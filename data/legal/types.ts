// 法条结构化数据类型 —— 任务 2 按此结构产出 nsw.ts / vic.ts。
// 军规：只用官方来源，宁缺毋错；存疑条目 confidence 标 'unverified'。

export type AUState = "NSW" | "VIC";

export interface LegalClause {
  id: string;
  state: AUState;
  /** 争议类型标签，用于按案情筛选注入 prompt（如 cleaning / damage / rent-arrears） */
  topics: string[];
  /** 法规名 + 条号，如 "Residential Tenancies Act 2010 (NSW) s 36" */
  statute: string;
  /** 官方原文引用（英文） */
  quote: string;
  /** 中文要点解释 */
  summaryZh: string;
  /** 官方来源 URL（白名单域名） */
  sourceUrl: string;
  confidence: "confirmed" | "unverified";
  notes?: string;
}
