/**
 * POST /api/facts —— 证据事实提取（`FACTS_MODEL`，三段式管线的第 ② 段）。
 *
 * 输入：`{ evidence: EvidenceImage[] }`（客户端已压缩，PDF 已转图）
 * 输出：`{ facts: EvidenceFact[], diagnostic }`
 *
 * 军规：**识别失败必须静默回退**。任何异常（限流、超时、模型跑偏、没配 key）
 * 都返回 200 + 空数组，由 `/api/analyze` 走 `mode: 'burden-shift'`，不阻塞流程。
 *
 * OPENAI_API_KEY 只在服务端读取。
 */

import OpenAI from "openai";
import type { ChatCompletionContentPart } from "openai/resources/chat/completions";

import { FACTS_MODEL, isAiEnabled } from "@/lib/ai";
import { FACTS_JSON_SCHEMA, parseFactsPayload } from "@/lib/analysis-schema";
import { FACTS_SYSTEM_PROMPT, buildFactsUserText } from "@/lib/prompts/facts";
import { checkRateLimit, clientKeyFromHeaders } from "@/lib/rate-limit";
import { EVIDENCE_KINDS, type EvidenceFact, type EvidenceImage, type EvidenceKind } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const RATE_LIMIT = 8;
const RATE_WINDOW_MS = 10 * 60 * 1000;

/** 送模型的最大图片数：控 token 与延迟（冒烟：4 张 4.9 秒） */
const FACTS_MAX_IMAGES = 8;
/** 超过就从低优先级开始丢图，而不是整单失败 */
const FACTS_MAX_PAYLOAD_BYTES = 12 * 1024 * 1024;
/** 留余量给平台 60s 上限 */
const FACTS_TIMEOUT_MS = 48_000;

const ALLOWED_IMAGE_PREFIXES = [
  "data:image/jpeg;base64,",
  "data:image/jpg;base64,",
  "data:image/png;base64,",
  "data:image/webp;base64,",
];

/** 事实密度从高到低：扣款清单与入住报告是第二层能力的入口证据 */
const KIND_PRIORITY: Record<EvidenceKind, number> = {
  "deduction-notice": 0,
  "condition-report": 1,
  lease: 2,
  chat: 3,
  room: 4,
  other: 5,
};

type Diagnostic =
  | "ok"
  | "ai-disabled"
  | "rate-limited"
  | "no-images"
  | "model-error"
  | "no-facts-found"
  | "bad-request";

function errorSummary(error: unknown): string {
  if (error instanceof Error) {
    const status = (error as { status?: number }).status;
    const code = (error as { code?: string }).code;
    return [
      error.name,
      status !== undefined ? `status=${status}` : null,
      code ? `code=${code}` : null,
      error.message.slice(0, 400),
    ]
      .filter(Boolean)
      .join(" | ");
  }
  return String(error).slice(0, 200);
}

function respond(
  facts: EvidenceFact[],
  diagnostic: Diagnostic,
  detail?: string,
): Response {
  return Response.json({ facts, diagnostic, ...(detail ? { detail } : {}) });
}

function isAllowedDataUrl(value: unknown): value is string {
  return (
    typeof value === "string" &&
    ALLOWED_IMAGE_PREFIXES.some((prefix) => value.startsWith(prefix))
  );
}

function asKind(value: unknown): EvidenceKind {
  return EVIDENCE_KINDS.includes(value as EvidenceKind)
    ? (value as EvidenceKind)
    : "other";
}

/**
 * 只保留合法图片，按事实密度排序后截断；再超体积就继续丢尾部，
 * 宁可少读几张也不要整单失败。
 */
function selectImages(raw: unknown): EvidenceImage[] {
  if (!Array.isArray(raw)) return [];

  const images = raw
    .filter(
      (item): item is Record<string, unknown> =>
        typeof item === "object" &&
        item !== null &&
        isAllowedDataUrl((item as { dataUrl?: unknown }).dataUrl),
    )
    .map((item, index) => ({
      id: typeof item.id === "string" && item.id ? item.id : `evidence-${index + 1}`,
      kind: asKind(item.kind),
      fileName: typeof item.fileName === "string" ? item.fileName : `evidence-${index + 1}`,
      mimeType: typeof item.mimeType === "string" ? item.mimeType : "image/jpeg",
      dataUrl: item.dataUrl as string,
      ...(typeof item.sourcePage === "number" && Number.isFinite(item.sourcePage)
        ? { sourcePage: item.sourcePage }
        : {}),
    }))
    .sort((a, b) => KIND_PRIORITY[a.kind] - KIND_PRIORITY[b.kind])
    .slice(0, FACTS_MAX_IMAGES);

  const selected: EvidenceImage[] = [];
  let bytes = 0;
  for (const image of images) {
    if (bytes + image.dataUrl.length > FACTS_MAX_PAYLOAD_BYTES) continue;
    bytes += image.dataUrl.length;
    selected.push(image);
  }

  return selected;
}

function buildContent(images: EvidenceImage[]): ChatCompletionContentPart[] {
  const parts: ChatCompletionContentPart[] = [
    { type: "text", text: buildFactsUserText(images) },
  ];

  for (const image of images) {
    parts.push({
      type: "image_url",
      image_url: { url: image.dataUrl, detail: "high" },
    });
  }

  return parts;
}

async function callModel(
  client: OpenAI,
  images: EvidenceImage[],
  signal: AbortSignal,
): Promise<EvidenceFact[]> {
  const completion = await client.chat.completions.create(
    {
      model: FACTS_MODEL,
      // gpt-5.x 拒绝 max_tokens（400 unsupported_parameter）
      max_completion_tokens: 6000,
      reasoning_effort: "low",
      messages: [
        { role: "system", content: FACTS_SYSTEM_PROMPT },
        { role: "user", content: buildContent(images) },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "tenancy_evidence_facts",
          strict: true,
          schema: FACTS_JSON_SCHEMA as unknown as Record<string, unknown>,
        },
      },
    },
    { signal },
  );

  const content = completion.choices[0]?.message?.content;
  if (!content) return [];

  return parseFactsPayload(JSON.parse(content), images);
}

export async function POST(request: Request): Promise<Response> {
  const wantsDetail = new URL(request.url).searchParams.get("diag") === "1";
  const detailOf = (error: unknown) =>
    wantsDetail ? errorSummary(error) : undefined;

  try {
    if (!isAiEnabled()) return respond([], "ai-disabled");

    const limit = checkRateLimit(
      `facts:${clientKeyFromHeaders(request.headers)}`,
      RATE_LIMIT,
      RATE_WINDOW_MS,
    );
    if (!limit.ok) return respond([], "rate-limited");

    const body = (await request.json()) as {
      evidence?: unknown;
      images?: unknown;
    };
    const images = selectImages(body.evidence ?? body.images);
    if (images.length === 0) return respond([], "no-images");

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FACTS_TIMEOUT_MS);

    const finish = (facts: EvidenceFact[]) =>
      respond(facts, facts.length > 0 ? "ok" : "no-facts-found");

    try {
      return finish(await callModel(client, images, controller.signal));
    } catch (error) {
      console.error("[facts] first attempt failed", errorSummary(error));
      if (controller.signal.aborted) {
        return respond([], "model-error", detailOf(error));
      }
      try {
        // structured output 偶发跑偏：重试一次就收手
        return finish(await callModel(client, images, controller.signal));
      } catch (retryError) {
        console.error("[facts] retry failed", errorSummary(retryError));
        return respond([], "model-error", detailOf(retryError));
      }
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    console.error("[facts] unexpected failure", errorSummary(error));
    return respond([], "bad-request", detailOf(error));
  }
}
