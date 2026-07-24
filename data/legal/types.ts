// 法条结构化数据类型 —— 任务 2 按此结构产出 nsw.ts / vic.ts。
// 军规：法条引用宁缺毋错；存疑条目 confidence 标 "unverified"。

import type { AUState, DisputeType } from "@/lib/types";

export type { AUState } from "@/lib/types";

export type LegalTopic = DisputeType | "all";
export type LegalConfidence = "confirmed" | "unverified";

export interface LegalClause {
  id: string;
  state: AUState;
  /** 与 CaseInput.disputeTypes 共用标签；通用条目使用 "all"。 */
  topics: LegalTopic[];
  /** 法案名，如 "Residential Tenancies Act 2010 (NSW)"。 */
  act: string;
  /** 条款号，如 "s 36"。 */
  section: string;
  /** 官方原文引用（英文） */
  quote: string;
  /** 中文要点解释 */
  ruleZh: string;
  /** 州立法数据库中的原文 URL。 */
  sourceUrl: string;
  confidence: LegalConfidence;
  /** ISO 日期，记录最后一次人工核对时间。 */
  checkedAt?: string;
  notes?: string;
}

export type ProcessStage =
  | "bond-authority"
  | "consumer-agency"
  | "tribunal";

/**
 * 行动路线图使用的确定性资料。它与法条分开，避免为机构流程伪造 statute/quote。
 */
export interface StateProcess {
  id: string;
  state: AUState;
  stage: ProcessStage;
  agency: string;
  summaryZh: string;
  stepsZh: string[];
  sourceUrl: string;
  confidence: LegalConfidence;
  checkedAt?: string;
  feeZh?: string;
  timeLimitZh?: string;
  phone?: string;
  notes?: string;
}
