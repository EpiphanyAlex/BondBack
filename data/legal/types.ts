// 法条结构化数据类型 —— 任务 2 按此结构产出 nsw.ts / vic.ts。
// 军规：法条引用宁缺毋错；存疑条目 confidence 标 "unverified"。

import type { AUState, DisputeType } from "@/lib/types";

export type { AUState } from "@/lib/types";

export type LegalTopic = DisputeType | "all";
export type LegalConfidence = "confirmed" | "unverified";
export type LegalSourceKind =
  | "legislation"
  | "regulator-guidance"
  | "tribunal"
  | "tenant-advocacy";

export interface LegalClause {
  id: string;
  state: AUState;
  /** 与 CaseInput.disputeTypes 共用标签；通用条目使用 "all"。 */
  topics: LegalTopic[];
  /** 法案或规章名称，如 "Residential Tenancies Act 2010 (NSW)"。 */
  act: string;
  /** 条款号，如 "s 36"。 */
  section: string;
  /** 官方原文短引文（英文）。 */
  quote: string;
  /** 中文要点解释。 */
  ruleZh: string;
  /** 支撑本条规则的白名单来源 URL。 */
  sourceUrl: string;
  sourceKind: LegalSourceKind;
  confidence: LegalConfidence;
  /** YYYY-MM-DD，记录最后一次人工核对日期。 */
  checkedAt: string;
  /** YYYY-MM-DD；未来规则在此日期前不得注入 prompt。 */
  effectiveFrom?: string;
  /** YYYY-MM-DD，含当日。 */
  effectiveTo?: string;
  notes?: string;
}

export type ProcessStage =
  | "bond-authority"
  | "consumer-agency"
  | "tribunal";

/**
 * 行动路线图使用的确定性资料。它与法条分开，避免为机构流程伪造
 * act/section/quote。
 */
export interface StateProcess {
  id: string;
  state: AUState;
  stage: ProcessStage;
  agency: string;
  summaryZh: string;
  stepsZh: string[];
  sourceUrl: string;
  sourceKind: LegalSourceKind;
  confidence: LegalConfidence;
  checkedAt: string;
  /** YYYY-MM-DD；未来路线在此日期前不得展示。 */
  effectiveFrom?: string;
  /** YYYY-MM-DD，含当日。 */
  effectiveTo?: string;
  feeZh?: string;
  timeLimitZh?: string;
  phone?: string;
  notes?: string;
}
