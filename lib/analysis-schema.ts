/**
 * 分析管线的模型输出契约：OpenAI structured outputs 用手写 JSON Schema
 *（`strict: true` 要求所有字段 required、可空字段写成 `["type","null"]`），
 * 回来的 JSON 再过一遍 zod（docs/plan.md：双重校验）。
 *
 * **模型输出的字段远少于 `AnalysisResult`** —— 金额、押金号、法条原文、
 * 账本、存管等级、信件骨架全部由代码产出，不经过 LLM（03a §3/§4）。
 */

import { z } from "zod";

import {
  AU_STATES,
  DISPUTE_TYPES,
  EVIDENCE_KINDS,
  type CaseInput,
  type EvidenceFact,
  type EvidenceImage,
} from "@/lib/types";

/* ── ① /api/facts ────────────────────────────────────────────────────── */

/** 一次最多接受多少条事实，防止模型把整页文字逐行倒出来 */
export const MAX_FACTS = 40;
const MAX_LOCATOR_LENGTH = 120;
const MAX_QUOTE_LENGTH = 400;

export const FACTS_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["facts"],
  properties: {
    facts: {
      type: "array",
      description: "从图片中读到的事实；读不清就不要输出，宁可少也不要编。",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["evidenceIndex", "locator", "quote"],
        properties: {
          evidenceIndex: {
            type: "integer",
            description:
              "这条事实来自第几张图片（按用户消息里的编号，从 1 开始）。",
          },
          locator: {
            type: "string",
            description:
              "人能看懂的中文定位，如「入住报告 P3 · 客厅地毯」「扣款清单 · 第 2 行」。",
          },
          quote: {
            type: "string",
            description:
              "原文逐字引语，保留原语言（英文材料保留英文）。唯一例外：记录「已读页面中未见某条款」时用中文陈述。",
          },
        },
      },
    },
  },
} as const;

const factsPayloadSchema = z.object({
  facts: z.array(
    z.object({
      evidenceIndex: z.number().int(),
      locator: z.string().max(MAX_LOCATOR_LENGTH),
      quote: z.string().max(MAX_QUOTE_LENGTH),
    }),
  ),
});

/**
 * 收敛成 `EvidenceFact[]`：id 由代码分配（`fact-1…`），
 * `kind` / `evidenceId` / `sourcePage` 一律从来源图片复制，模型无权决定。
 */
export function parseFactsPayload(
  raw: unknown,
  images: EvidenceImage[],
): EvidenceFact[] {
  const result = factsPayloadSchema.safeParse(raw);
  if (!result.success) return [];

  const candidates: (Omit<EvidenceFact, "id"> & { normalized: string })[] = [];

  for (const item of result.data.facts) {
    const locator = item.locator.trim();
    const quote = item.quote.trim();
    if (!locator || !quote) continue;

    const image = images[item.evidenceIndex - 1];
    if (!image) continue;

    candidates.push({
      kind: image.kind,
      evidenceId: image.id,
      locator,
      quote,
      normalized: quote.replace(/\s+/g, " ").toLowerCase(),
      ...(image.sourcePage !== undefined
        ? { sourcePage: image.sourcePage }
        : {}),
    });
  }

  // 模型偶尔把同一行读两遍（一条干净引语 + 一条带 Y/N 栏位的整行）。
  // 同一份证据里若一条引语包含另一条，留短的那条 —— 对照卡上的引语要干净。
  const facts: EvidenceFact[] = [];
  for (const [index, candidate] of candidates.entries()) {
    const covered = candidates.some(
      (other, otherIndex) =>
        otherIndex !== index &&
        other.evidenceId === candidate.evidenceId &&
        other.normalized.length < candidate.normalized.length &&
        candidate.normalized.includes(other.normalized),
    );
    if (covered) continue;

    const { normalized, ...fact } = candidate;
    void normalized;
    facts.push({ id: `fact-${facts.length + 1}`, ...fact });
    if (facts.length >= MAX_FACTS) break;
  }

  return facts;
}

/* ── ② /api/analyze ──────────────────────────────────────────────────── */

const MAX_REASONING_LENGTH = 600;
const MAX_PARAGRAPH_LENGTH = 1200;
const MAX_NOTE_LENGTH = 120;

const CHECK_STATES = ["yes", "no", "unknown", "n-a"] as const;
const CONTRACT_STATES = ["exists", "absent", "unknown", "n-a"] as const;
const VERDICTS = ["unlawful", "doubtful", "lawful"] as const;

export const ANALYSIS_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["items"],
  properties: {
    items: {
      type: "array",
      description:
        "逐笔扣款的结论，必须与用户消息里的扣款清单一一对应、数量相同、顺序相同。",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "deductionIndex",
          "verdict",
          "reasoningZh",
          "checks",
          "evidenceRefs",
          "statuteRefs",
          "paragraphEn",
        ],
        properties: {
          deductionIndex: {
            type: "integer",
            description: "对应扣款清单里的编号（从 1 开始）。",
          },
          verdict: {
            type: "string",
            enum: [...VERDICTS],
            description:
              "unlawful=不应扣；doubtful=待房东举证；lawful=房东占理，诚实告诉租客别争。",
          },
          reasoningZh: {
            type: "string",
            description:
              "给租客看的中文结论，2-3 句，说事实和理由；不要写条款号（卡片会单独展示法条）。",
          },
          checks: {
            type: "object",
            additionalProperties: false,
            required: ["preExisting", "contractObligation", "fairWearTear"],
            properties: {
              preExisting: {
                type: "string",
                enum: [...CHECK_STATES],
                description: "该问题在入住时就已存在？",
              },
              contractObligation: {
                type: "string",
                enum: [...CONTRACT_STATES],
                description:
                  "合约里有没有这项义务？只有你确实读过合约页且其中没有时才用 absent；没上传合约一律 unknown。",
              },
              fairWearTear: {
                type: "string",
                enum: [...CHECK_STATES],
                description: "属于合理磨损（fair wear and tear）？",
              },
            },
          },
          evidenceRefs: {
            type: "array",
            description:
              "支撑本项结论的事实，factId 必须逐字抄自事实清单；没有就给空数组。",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["factId", "noteZh"],
              properties: {
                factId: {
                  type: "string",
                  description: "事实清单里的 id，如 fact-3。",
                },
                noteZh: {
                  type: ["string", "null"],
                  description: "这条事实在本项里起什么作用，一句中文；没有就 null。",
                },
              },
            },
          },
          statuteRefs: {
            type: "array",
            description:
              "本项引用的法条，只能来自法条清单；id/act/section/quote 逐字抄清单，不许改写、不许引清单外的条文。",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["id", "act", "section", "quote"],
              properties: {
                id: { type: "string", description: "法条清单方括号里的 id。" },
                act: { type: "string" },
                section: { type: "string" },
                quote: { type: "string" },
              },
            },
          },
          paragraphEn: {
            type: "string",
            description:
              "申诉信里这一笔的英文段落，2-4 句，第一人称。不要写任何金额、日期、期限或条款号——这些由信件模板插入。",
          },
        },
      },
    },
  },
} as const;

const analysisPayloadSchema = z.object({
  items: z.array(
    z.object({
      deductionIndex: z.number().int(),
      verdict: z.enum(VERDICTS),
      reasoningZh: z.string().max(MAX_REASONING_LENGTH),
      checks: z.object({
        preExisting: z.enum(CHECK_STATES),
        contractObligation: z.enum(CONTRACT_STATES),
        fairWearTear: z.enum(CHECK_STATES),
      }),
      evidenceRefs: z.array(
        z.object({
          factId: z.string().max(80),
          noteZh: z.string().max(MAX_NOTE_LENGTH).nullable(),
        }),
      ),
      statuteRefs: z.array(
        z.object({
          id: z.string().max(80),
          act: z.string().max(200),
          section: z.string().max(120),
          quote: z.string().max(400),
        }),
      ),
      paragraphEn: z.string().max(MAX_PARAGRAPH_LENGTH),
    }),
  ),
});

export type RawAnalysisPayload = z.infer<typeof analysisPayloadSchema>;
export type RawAnalysisItem = RawAnalysisPayload["items"][number];

/** zod 不过就当模型没答，调用方走重试 / 降级。 */
export function parseAnalysisPayload(raw: unknown): RawAnalysisPayload | null {
  const result = analysisPayloadSchema.safeParse(raw);
  return result.success ? result.data : null;
}

/* ── ③ /api/analyze 的请求体 ─────────────────────────────────────────── */

/**
 * 请求体校验刻意宽松：除了 `state`（选错州就等于用错法），其余字段脏了就
 * 兜底成安全值，而不是把整次分析打回 —— 用户已经填完向导了。
 *
 * 注意 `evidence[].dataUrl` **被主动丢弃**：`/api/analyze` 不发图片（03a §2）。
 */
const triStateSchema = z.enum(["yes", "no", "unsure"]).catch("unsure");
const looseDate = z.string().max(40).optional().catch(undefined);

const bondPaymentSchema = z.object({
  paidTo: z
    .enum(["bond-authority", "landlord", "agent", "other", "unsure"])
    .catch("unsure"),
  paidAt: looseDate,
  paidByInstalments: triStateSchema,
  instalmentDates: z.array(z.string().max(40)).max(24).optional().catch(undefined),
  confirmationReceived: triStateSchema,
  lookup: z
    .object({
      status: z
        .enum(["found", "not-found", "not-checked", "unsure"])
        .catch("not-checked"),
      evidence: z.enum(["none", "portal", "authority-written"]).catch("none"),
    })
    .catch({ status: "not-checked", evidence: "none" }),
});

const amount = z.number().nonnegative().max(1_000_000);

const caseInputSchema = z.object({
  state: z.enum(AU_STATES),
  disputeTypes: z.array(z.enum(DISPUTE_TYPES)).max(6).catch([]),
  bondAmount: amount.catch(0),
  claimedAmount: amount.catch(0),
  moveOutDate: z.string().max(40).catch(""),
  bondPayment: bondPaymentSchema.catch({
    paidTo: "unsure",
    paidByInstalments: "unsure",
    confirmationReceived: "unsure",
    lookup: { status: "not-checked", evidence: "none" },
  }),
  claimNotice: z
    .object({
      receivedAt: looseDate,
      dueAt: looseDate,
      deliveryMethod: z
        .enum(["email", "post", "sms", "other", "unsure"])
        .catch("unsure"),
    })
    .optional()
    .catch(undefined),
  deductions: z
    .array(
      z.object({
        description: z.string().max(200),
        amount: amount.nullish().catch(undefined),
      }),
    )
    .max(20)
    .catch([]),
  evidence: z
    .array(
      z.object({
        id: z.string().max(120).catch(""),
        kind: z.enum(EVIDENCE_KINDS).catch("other"),
        fileName: z.string().max(200).catch(""),
        mimeType: z.string().max(80).catch("image/jpeg"),
        sourcePage: z.number().int().nonnegative().max(500).optional().catch(undefined),
      }),
    )
    .max(24)
    .catch([]),
  propertyAddress: z.string().max(200).optional().catch(undefined),
  notes: z.string().max(2000).optional().catch(undefined),
});

const factSchema = z.object({
  id: z.string().max(80),
  kind: z.enum(EVIDENCE_KINDS).catch("other"),
  evidenceId: z.string().max(120).optional().catch(undefined),
  locator: z.string().max(MAX_LOCATOR_LENGTH),
  quote: z.string().max(MAX_QUOTE_LENGTH),
  sourcePage: z.number().int().nonnegative().max(500).optional().catch(undefined),
  anchorId: z.string().max(120).optional().catch(undefined),
});

const analyzeRequestSchema = z.object({
  input: caseInputSchema,
  facts: z.array(factSchema).max(MAX_FACTS).catch([]),
});

export interface AnalyzeRequest {
  input: CaseInput;
  facts: EvidenceFact[];
}

export function parseAnalyzeRequest(raw: unknown): AnalyzeRequest | null {
  const body = (raw ?? {}) as Record<string, unknown>;
  // 兼容 `{ input, facts }` 与 `{ case, facts }` 两种写法
  const candidate = {
    input: body.input ?? body.case ?? body.caseInput,
    facts: body.facts ?? [],
  };

  const result = analyzeRequestSchema.safeParse(candidate);
  if (!result.success) return null;

  const parsed = result.data;
  const seen = new Set<string>();
  const facts: EvidenceFact[] = [];

  for (const fact of parsed.facts) {
    const id = fact.id.trim();
    const locator = fact.locator.trim();
    const quote = fact.quote.trim();
    if (!id || !locator || !quote || seen.has(id)) continue;
    seen.add(id);
    facts.push({ ...fact, id, locator, quote });
  }

  const input: CaseInput = {
    ...parsed.input,
    deductions: parsed.input.deductions.map((deduction) => ({
      description: deduction.description,
      ...(typeof deduction.amount === "number"
        ? { amount: deduction.amount }
        : {}),
    })),
    // dataUrl 一律置空：图片绝不进入 /api/analyze 的调用链
    evidence: parsed.input.evidence.map((item, index) => ({
      ...item,
      id: item.id || `evidence-${index + 1}`,
      dataUrl: "",
    })),
  };

  return { input, facts };
}
