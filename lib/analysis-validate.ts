/**
 * 服务端校验层（03a §3）—— **不依赖 LLM 自律**。
 *
 * 返回客户端前逐项过滤，并把所有「不能出错」的东西改由代码产出：
 *
 * | 检查                                                   | 不通过时                    |
 * |--------------------------------------------------------|-----------------------------|
 * | `evidenceRefs[].factId` ∈ 本次事实                       | 丢弃该引用                  |
 * | `statuteRefs[]` 的 act+section ∈ 本次注入法条             | 丢弃该引用                  |
 * | `statuteRefs[].quote` 与注入法条不一致                    | 用注入值整条覆盖            |
 * | 某项 `statuteRefs.length === 0`                          | verdict 降级为 doubtful     |
 * | `contractObligation === 'absent'` 且 `verdict === 'unlawful'` | 强制降级为 doubtful    |
 * | `ledger.*` 六个数字                                      | 一律代码重算覆盖            |
 * | `bondLodgementAlert`                                     | `lib/bond-lodgement.ts` 覆盖 |
 * | `disputableAmount`                                       | lawful 恒 0，其余等于 amount |
 *
 * 被降级的项目在 `reasoningZh` 前追加一句说明，**不做静默改判**。
 */

import { evaluateBondLodgement } from "@/lib/bond-lodgement";
import {
  EVIDENCE_DEMAND_CLAUSE,
  buildLetter,
  formatMoney,
} from "@/lib/letter";
import {
  clauseById,
  resolveClause,
  statuteRefFromClause,
  type LegalContext,
} from "@/lib/legal-injection";
import type { RawAnalysisItem, RawAnalysisPayload } from "@/lib/analysis-schema";
import type { DeductionLine } from "@/lib/prompts/analyze";
import type {
  AnalysisChecks,
  AnalysisItem,
  AnalysisLedger,
  AnalysisMode,
  AnalysisResult,
  AUState,
  CaseInput,
  EvidenceFact,
  EvidenceRef,
  StatuteRef,
  Verdict,
} from "@/lib/types";

/** 零证据 / 兜底模式下逐笔援引的程序性条文（只认注入清单里的 id）。 */
const BURDEN_SHIFT_CLAUSE_IDS: Record<AUState, string[]> = {
  NSW: ["nsw-landlord-claim-evidence", "nsw-permitted-bond-claims"],
  VIC: ["vic-permitted-bond-claims", "vic-condition-report-entry-exit"],
};

const DOWNGRADE_NOTE_STATUTE = "（法条引用未通过核对，已下调为待房东举证）";
const DOWNGRADE_NOTE_CONTRACT =
  "（我们只读到你上传的部分合约页，不能断言全篇都没有这项义务，已下调为待房东举证）";
const DOWNGRADE_NOTE_MISSING = "（AI 未对这一笔给出可用结论，已按待房东举证处理）";

export type BurdenShiftReason = "no-evidence" | "ai-unavailable";

export interface AnalysisBuildContext {
  input: CaseInput;
  facts: EvidenceFact[];
  context: LegalContext;
  /** 走兜底路径时的原因，影响文案；有 raw 时忽略 */
  fallbackReason?: BurdenShiftReason;
  /** 固定日期，便于示例与测试 */
  asOf?: string;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/* ── 扣款行：金额与描述由代码持有，模型只回指编号 ───────────────────── */

/**
 * 把 `CaseInput` 收敛成逐笔扣款行。两个补洞规则让账本永远自洽：
 * - 一条明细都没有 → 用 `claimedAmount` 造一条「未提供明细」的行
 * - 明细金额齐全但合计小于 `claimedAmount` → 补一条差额行（逼房东逐项说明）
 */
export function buildDeductionLines(input: CaseInput): DeductionLine[] {
  const lines: DeductionLine[] = input.deductions
    .map((deduction) => ({
      description: deduction.description.trim(),
      ...(typeof deduction.amount === "number" && deduction.amount > 0
        ? { amount: round2(deduction.amount) }
        : {}),
    }))
    .filter((line) => line.description.length > 0);

  const claimed = input.claimedAmount > 0 ? round2(input.claimedAmount) : 0;

  if (lines.length === 0) {
    return claimed > 0
      ? [{ description: "房东未提供明细的扣款", amount: claimed }]
      : [{ description: "房东从押金中扣款（金额未列明）" }];
  }

  const allPriced = lines.every((line) => line.amount !== undefined);
  const accounted = round2(
    lines.reduce((sum, line) => sum + (line.amount ?? 0), 0),
  );

  if (allPriced && claimed - accounted > 0.5) {
    lines.push({
      description: "其余未列明细的扣款",
      amount: round2(claimed - accounted),
    });
  }

  return lines;
}

/* ── 文本清洗：金额与条款号绝不允许出自 LLM ─────────────────────────── */

const MONEY_PATTERN = /\$\s?\d[\d,]*(?:\.\d{1,2})?/g;
const SECTION_PATTERN =
  /\b(?:ss|s|sections|section)\s?\d+[A-Za-z]*(?:\([0-9a-zA-Z]+\))*/gi;

function primaryNumber(section: string): string | null {
  const match = section.match(/(\d+[A-Za-z]*)/);
  return match ? match[1]!.toLowerCase() : null;
}

/**
 * 模型被明确要求不写金额与条款号；这里再兜一次底：
 * 金额一律换成中性表述；条款号只有落在本项已核验的法条里才允许留下。
 */
function sanitizeText(
  text: string,
  allowedSections: Set<string>,
  moneyReplacement: string,
  sectionReplacement: string,
): string {
  const replaced = text
    .replace(MONEY_PATTERN, moneyReplacement)
    .replace(SECTION_PATTERN, (match) => {
      const number = primaryNumber(match);
      return number && allowedSections.has(number) ? match : sectionReplacement;
    });

  // 连着被替换两次（"under s 165 and s 999"）会读起来很蠢，合并成一句
  const escaped = sectionReplacement.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return replaced
    .replace(
      new RegExp(`${escaped}(?:\\s*(?:and|,|、|和|与)\\s*${escaped})+`, "g"),
      sectionReplacement,
    )
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

/** 法条编号由代码追加到段落末尾 —— 信与卡片因此永远一致。 */
function citationSuffix(refs: StatuteRef[]): string {
  if (refs.length === 0) return "";
  const byAct = new Map<string, string[]>();
  for (const ref of refs) {
    const sections = byAct.get(ref.act) ?? [];
    if (!sections.includes(ref.section)) sections.push(ref.section);
    byAct.set(ref.act, sections);
  }
  const parts = Array.from(byAct, ([act, sections]) => `${act}: ${sections.join("; ")}`);
  return ` — see ${parts.join(" | ")}.`;
}

/* ── 单项校验 ───────────────────────────────────────────────────────── */

function validEvidenceRefs(
  raw: RawAnalysisItem,
  factIds: Set<string>,
): EvidenceRef[] {
  const seen = new Set<string>();
  const refs: EvidenceRef[] = [];

  for (const ref of raw.evidenceRefs) {
    const factId = ref.factId.trim();
    if (!factIds.has(factId) || seen.has(factId)) continue;
    seen.add(factId);
    const noteZh = ref.noteZh?.trim();
    refs.push({ factId, ...(noteZh ? { noteZh } : {}) });
  }

  return refs;
}

function validStatuteRefs(
  raw: RawAnalysisItem,
  context: LegalContext,
): StatuteRef[] {
  const seen = new Set<string>();
  const refs: StatuteRef[] = [];

  for (const candidate of raw.statuteRefs) {
    const clause = resolveClause(context, candidate);
    if (!clause || seen.has(clause.id)) continue;
    seen.add(clause.id);
    // 逐字复制注入值：模型改写过的 act/section/quote/sourceUrl 全部作废
    refs.push(statuteRefFromClause(clause));
  }

  return refs;
}

function burdenShiftStatutes(context: LegalContext, state: AUState): StatuteRef[] {
  return BURDEN_SHIFT_CLAUSE_IDS[state]
    .map((id) => clauseById(context, id))
    .filter((clause): clause is NonNullable<typeof clause> => clause !== null)
    .map(statuteRefFromClause);
}

function burdenShiftReasonZh(
  reason: BurdenShiftReason,
  state: AUState,
  line: DeductionLine,
): string {
  const amount = line.amount !== undefined ? `${formatMoney(line.amount)} ` : "";
  const lead =
    reason === "no-evidence"
      ? "你还没有上传与这笔扣款相关的证据，所以我们不猜结论。"
      : "这一笔暂时没能完成逐项比对，所以我们不猜结论。";
  const demand =
    state === "NSW"
      ? "房东单方从押金中扣款时，须在提出 claim 后 7 日内向你出示退租 condition report 以及支持金额的报价、发票或收据。"
      : "从押金中扣款须限于法定项目且金额合理，房东应出示退租 condition report 以及支持金额的报价、发票或收据。";
  return `${lead}${demand}在他把${amount}这一笔的依据拿出来之前，这笔钱属于待举证，你可以要求先退回。`;
}

function burdenShiftParagraphEn(state: AUState): string {
  const report =
    state === "NSW" ? "the final condition report" : "the outgoing condition report";
  return `I do not accept this item as it stands. Please identify the term of the tenancy agreement you rely on for it, and provide ${report} together with the quote, invoice or receipt that supports the amount claimed. Without that material I am not able to accept this deduction from my bond.`;
}

function burdenShiftItem(
  line: DeductionLine,
  context: LegalContext,
  state: AUState,
  reason: BurdenShiftReason,
  prefixNote?: string,
): AnalysisItem {
  const statuteRefs = burdenShiftStatutes(context, state);
  const reasoning = burdenShiftReasonZh(reason, state, line);

  return {
    description: line.description,
    ...(line.amount !== undefined ? { amount: line.amount } : {}),
    verdict: "doubtful",
    reasoningZh: prefixNote ? `${prefixNote}${reasoning}` : reasoning,
    checks: {
      preExisting: "unknown",
      contractObligation: "unknown",
      fairWearTear: "unknown",
    },
    evidenceRefs: [],
    statuteRefs,
    disputableAmount: line.amount ?? 0,
    paragraphEn:
      burdenShiftParagraphEn(state) + citationSuffix(statuteRefs),
  };
}

function buildItem(
  line: DeductionLine,
  raw: RawAnalysisItem,
  ctx: AnalysisBuildContext,
  factIds: Set<string>,
): AnalysisItem {
  const { context, input } = ctx;

  const evidenceRefs = validEvidenceRefs(raw, factIds);
  const statuteRefs = validStatuteRefs(raw, context);

  const checks: AnalysisChecks = { ...raw.checks };
  let verdict: Verdict = raw.verdict;
  const notes: string[] = [];

  // 引用被过滤光 → 不许再下任何硬结论（不合法要有依据，说房东占理也要有依据）
  if (statuteRefs.length === 0 && verdict !== "doubtful") {
    verdict = "doubtful";
    notes.push(DOWNGRADE_NOTE_STATUTE);
  }

  // 红线：合约「已读页面中未见」永远不得判 unlawful
  if (checks.contractObligation === "absent" && verdict === "unlawful") {
    verdict = "doubtful";
    notes.push(DOWNGRADE_NOTE_CONTRACT);
  }

  // 没上传任何证据却声称读到合约缺项 —— 收回为 unknown
  if (checks.contractObligation === "absent" && ctx.facts.length === 0) {
    checks.contractObligation = "unknown";
  }

  const allowedSections = new Set(
    statuteRefs
      .map((ref) => primaryNumber(ref.section))
      .filter((value): value is string => value !== null),
  );

  const reasoningBody =
    sanitizeText(raw.reasoningZh, allowedSections, "该笔金额", "相关法条") ||
    burdenShiftReasonZh("ai-unavailable", input.state, line);

  const paragraphBody =
    sanitizeText(
      raw.paragraphEn,
      allowedSections,
      "the amount claimed",
      "the applicable provisions of the Act",
    ) || burdenShiftParagraphEn(input.state);

  const disputableAmount =
    verdict === "lawful" ? 0 : round2(line.amount ?? 0);

  return {
    description: line.description,
    ...(line.amount !== undefined ? { amount: line.amount } : {}),
    verdict,
    reasoningZh: `${notes.join("")}${reasoningBody}`,
    checks,
    evidenceRefs,
    statuteRefs,
    disputableAmount,
    paragraphEn: paragraphBody + citationSuffix(statuteRefs),
  };
}

/* ── 账本与赢面：一律代码重算 ───────────────────────────────────────── */

function buildLedger(input: CaseInput, items: AnalysisItem[]): AnalysisLedger {
  const sumBy = (predicate: (item: AnalysisItem) => boolean) =>
    round2(
      items
        .filter(predicate)
        .reduce((sum, item) => sum + (item.amount ?? 0), 0),
    );

  const itemsTotal = sumBy(() => true);
  const claimedTotal =
    itemsTotal > 0 ? itemsTotal : round2(Math.max(input.claimedAmount, 0));
  const unlawfulTotal = sumBy((item) => item.verdict === "unlawful");
  const doubtfulTotal = sumBy((item) => item.verdict === "doubtful");
  const lawfulTotal = sumBy((item) => item.verdict === "lawful");
  const bondAmount = round2(Math.max(input.bondAmount, 0));

  return {
    claimedTotal,
    unlawfulTotal,
    doubtfulTotal,
    lawfulTotal,
    disputableTotal: round2(unlawfulTotal + doubtfulTotal),
    refundExpected: round2(
      Math.min(bondAmount, Math.max(0, bondAmount - lawfulTotal)),
    ),
  };
}

/** 赢面也由代码定：可争议占比越高、其中「不合法」占比越高，赢面越大。 */
function buildWinRate(ledger: AnalysisLedger): AnalysisResult["winRate"] {
  if (ledger.claimedTotal <= 0) return "low";
  if (ledger.unlawfulTotal / ledger.claimedTotal >= 0.4) return "high";
  if (ledger.disputableTotal / ledger.claimedTotal >= 0.4) return "medium";
  return "low";
}

/* ── 组装 ───────────────────────────────────────────────────────────── */

/**
 * 唯一的 `AnalysisResult` 出口。`raw` 为 null 时走确定性的举证责任翻转模式
 *（零证据、AI 关闭、模型两次都失败都走这里，永远不 500）。
 */
export function buildAnalysisResult(
  raw: RawAnalysisPayload | null,
  ctx: AnalysisBuildContext,
): AnalysisResult {
  const { input, facts, context, asOf } = ctx;
  const lines = buildDeductionLines(input);
  const factIds = new Set(facts.map((fact) => fact.id));
  const mode: AnalysisMode = raw ? "evidence-based" : "burden-shift";
  const fallbackReason: BurdenShiftReason =
    ctx.fallbackReason ?? (facts.length === 0 ? "no-evidence" : "ai-unavailable");

  const items: AnalysisItem[] = lines.map((line, index) => {
    if (!raw) {
      return burdenShiftItem(line, context, input.state, fallbackReason);
    }
    const match =
      raw.items.find((item) => item.deductionIndex === index + 1) ??
      raw.items[index];
    if (!match) {
      return burdenShiftItem(
        line,
        context,
        input.state,
        "ai-unavailable",
        DOWNGRADE_NOTE_MISSING,
      );
    }
    return buildItem(line, match, ctx, factIds);
  });

  const ledger = buildLedger(input, items);
  const bondLodgementAlert = evaluateBondLodgement(
    { state: input.state, bondPayment: input.bondPayment },
    asOf,
  );
  const { letterEn, letterZhNotes } = buildLetter({
    input,
    items,
    ledger,
    mode,
    context,
    asOf,
  });

  return {
    mode,
    items,
    facts,
    ledger,
    bondLodgementAlert,
    letterEn,
    letterZhNotes,
    winRate: buildWinRate(ledger),
  };
}

/** 给 `lib/letter.ts` 之外的调用方一个只读的兜底条文清单入口。 */
export { BURDEN_SHIFT_CLAUSE_IDS, EVIDENCE_DEMAND_CLAUSE };
