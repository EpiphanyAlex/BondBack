/**
 * POST /api/analyze —— 逐项对照（`ANALYZE_MODEL`，三段式管线的第 ③ 段）。
 *
 * 输入：`{ input: CaseInput, facts: EvidenceFact[] }`
 * 输出：`{ result: AnalysisResult, diagnostic }`
 *
 * 纪律：
 * - **不发送图片**，只吃文本事实（延迟可控、可强制引用白名单、便宜）
 * - 事实为空 / AI 关闭 / 模型两次都失败 → 确定性的 `mode: 'burden-shift'`
 *   结果，永远不 500，用户始终拿到一封有法律杠杆的信
 * - `ledger`、`bondLodgementAlert`、金额、法条原文、信件骨架全部代码产出
 */

import OpenAI from "openai";

import { ANALYZE_MODEL, isAiEnabled } from "@/lib/ai";
import {
  ANALYSIS_JSON_SCHEMA,
  parseAnalysisPayload,
  parseAnalyzeRequest,
  type RawAnalysisPayload,
} from "@/lib/analysis-schema";
import {
  buildAnalysisResult,
  buildDeductionLines,
  type BurdenShiftReason,
} from "@/lib/analysis-validate";
import { selectLegalContext } from "@/lib/legal-injection";
import {
  ANALYZE_SYSTEM_PROMPT,
  buildAnalyzeUserText,
} from "@/lib/prompts/analyze";
import { bodyTooLarge, checkRateLimit, clientKeyFromHeaders } from "@/lib/rate-limit";
import type { AnalysisResult } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const RATE_LIMIT = 6;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const ANALYZE_TIMEOUT_MS = 48_000;

/**
 * 这一段只吃文本（客户端已剥掉 dataUrl），正常请求几十 KB 就到顶。
 * 超过 2MB 只可能是客户端 bug 或有人在灌请求 —— 直接拒，不进 JSON.parse。
 */
const ANALYZE_MAX_BODY_BYTES = 2 * 1024 * 1024;

type Diagnostic =
  | "ok"
  | "ai-disabled"
  | "rate-limited"
  | "burden-shift"
  | "model-error"
  | "payload-too-large"
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
  result: AnalysisResult,
  diagnostic: Diagnostic,
  detail?: string,
): Response {
  return Response.json({ result, diagnostic, ...(detail ? { detail } : {}) });
}

export async function POST(request: Request): Promise<Response> {
  const wantsDetail = new URL(request.url).searchParams.get("diag") === "1";
  const detailOf = (error: unknown) =>
    wantsDetail ? errorSummary(error) : undefined;

  if (bodyTooLarge(request.headers, ANALYZE_MAX_BODY_BYTES)) {
    return Response.json(
      { error: "payload-too-large", diagnostic: "payload-too-large" satisfies Diagnostic },
      { status: 413 },
    );
  }

  let parsed: ReturnType<typeof parseAnalyzeRequest> = null;

  try {
    parsed = parseAnalyzeRequest(await request.json());
  } catch (error) {
    console.error("[analyze] unreadable body", errorSummary(error));
  }

  if (!parsed) {
    // 连州都读不出来就没法选法条 —— 这只可能是客户端 bug，不静默伪造结果
    return Response.json(
      { error: "invalid-case-input", diagnostic: "bad-request" satisfies Diagnostic },
      { status: 400 },
    );
  }

  const { input, facts } = parsed;
  const context = selectLegalContext(input.state, input.disputeTypes);

  const fallback = (
    diagnostic: Diagnostic,
    reason: BurdenShiftReason,
    detail?: string,
  ) =>
    respond(
      buildAnalysisResult(null, { input, facts, context, fallbackReason: reason }),
      diagnostic,
      detail,
    );

  try {
    if (!isAiEnabled()) {
      return fallback("ai-disabled", facts.length === 0 ? "no-evidence" : "ai-unavailable");
    }

    const limit = checkRateLimit(
      `analyze:${clientKeyFromHeaders(request.headers)}`,
      RATE_LIMIT,
      RATE_WINDOW_MS,
    );
    if (!limit.ok) {
      return fallback(
        "rate-limited",
        facts.length === 0 ? "no-evidence" : "ai-unavailable",
      );
    }

    // 零证据模式：不猜结论，逐笔要求房东举证。确定性产出，零 API 成本。
    if (facts.length === 0) {
      return fallback("burden-shift", "no-evidence");
    }

    const lines = buildDeductionLines(input);
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), ANALYZE_TIMEOUT_MS);

    const callModel = async (): Promise<RawAnalysisPayload | null> => {
      const completion = await client.chat.completions.create(
        {
          model: ANALYZE_MODEL,
          // gpt-5.x 拒绝 max_tokens（400 unsupported_parameter）
          max_completion_tokens: 8000,
          reasoning_effort: "low",
          messages: [
            { role: "system", content: ANALYZE_SYSTEM_PROMPT },
            {
              role: "user",
              content: buildAnalyzeUserText(input, facts, lines, context),
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "bond_deduction_analysis",
              strict: true,
              schema: ANALYSIS_JSON_SCHEMA as unknown as Record<string, unknown>,
            },
          },
        },
        { signal: controller.signal },
      );

      const content = completion.choices[0]?.message?.content;
      if (!content) return null;
      return parseAnalysisPayload(JSON.parse(content));
    };

    try {
      let raw = await callModel();
      if (!raw && !controller.signal.aborted) {
        // structured output 偶发跑偏：重试一次就收手
        raw = await callModel();
      }
      if (!raw) return fallback("model-error", "ai-unavailable");

      return respond(
        buildAnalysisResult(raw, { input, facts, context }),
        "ok",
      );
    } catch (error) {
      console.error("[analyze] model call failed", errorSummary(error));
      if (!controller.signal.aborted) {
        try {
          const raw = await callModel();
          if (raw) {
            return respond(
              buildAnalysisResult(raw, { input, facts, context }),
              "ok",
            );
          }
        } catch (retryError) {
          console.error("[analyze] retry failed", errorSummary(retryError));
        }
      }
      return fallback("model-error", "ai-unavailable", detailOf(error));
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    console.error("[analyze] unexpected failure", errorSummary(error));
    return fallback("model-error", "ai-unavailable", detailOf(error));
  }
}
