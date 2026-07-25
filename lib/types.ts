export const AU_STATES = ["NSW", "VIC"] as const;

export type AUState = (typeof AU_STATES)[number];

export const DISPUTE_TYPES = [
  "cleaning",
  "damage",
  "early-termination",
  "bond",
  "rent-arrears",
  "other",
] as const;

export type DisputeType = (typeof DISPUTE_TYPES)[number];

/**
 * `deduction-notice`（扣款清单）是第二层能力的入口证据：逐笔扣款项、金额、
 * 以及**是否随附发票或报价**都从它读出（03a §1）。
 */
export const EVIDENCE_KINDS = [
  "condition-report",
  "deduction-notice",
  "lease",
  "chat",
  "room",
  "other",
] as const;

export type EvidenceKind = (typeof EVIDENCE_KINDS)[number];

export type TriState = "yes" | "no" | "unsure";

export type BondPaymentRecipient =
  | "bond-authority"
  | "landlord"
  | "agent"
  | "other"
  | "unsure";

export type BondLookupStatus =
  | "found"
  | "not-found"
  | "not-checked"
  | "unsure";

export type BondLookupEvidence = "none" | "portal" | "authority-written";

export interface BondLookup {
  status: BondLookupStatus;
  evidence: BondLookupEvidence;
}

export interface BondPayment {
  paidTo: BondPaymentRecipient;
  paidAt?: string;
  paidByInstalments: TriState;
  instalmentDates?: string[];
  confirmationReceived: TriState;
  lookup: BondLookup;
}

export type ClaimNoticeDeliveryMethod =
  | "email"
  | "post"
  | "sms"
  | "other"
  | "unsure";

export interface ClaimNotice {
  receivedAt?: string;
  dueAt?: string;
  deliveryMethod: ClaimNoticeDeliveryMethod;
}

export interface Deduction {
  description: string;
  amount?: number;
}

/**
 * Evidence is kept as compressed image data in the client session only.
 * PDF pages are rendered to images before they enter this contract.
 */
export interface EvidenceImage {
  id: string;
  kind: EvidenceKind;
  fileName: string;
  mimeType: string;
  dataUrl: string;
  sourcePage?: number;
}

export interface CaseInput {
  state: AUState;
  disputeTypes: DisputeType[];
  bondAmount: number;
  claimedAmount: number;
  moveOutDate: string;
  bondPayment: BondPayment;
  claimNotice?: ClaimNotice;
  deductions: Deduction[];
  evidence: EvidenceImage[];
  propertyAddress?: string;
  notes?: string;
}

export type ExtractedCaseFields = Partial<
  Pick<
    CaseInput,
    | "bondAmount"
    | "claimedAmount"
    | "moveOutDate"
    | "deductions"
    | "propertyAddress"
  >
>;

export interface ExtractResult {
  fields: ExtractedCaseFields;
}

export type BondLodgementAlertLevel =
  | "none"
  | "verify-record"
  | "possible-non-lodgement"
  | "authority-confirmed-missing";

export interface BondLodgementAlert {
  level: BondLodgementAlertLevel;
  reasoningZh: string;
  calculatedDeadline?: string;
  deadlineBasis?: string;
}

/* ────────────────────────────────────────────────────────────────────────
   分析契约（design-tokens.md §7.2 已冻结）

   03a 产出它、03b 渲染它、04a 手工写出一份符合它的示例常量、04b 复用 03b
   的组件。**任何 agent 都不得再改本文件** —— 要改先回来改这一段的注释，
   并同步四个模块。
   ──────────────────────────────────────────────────────────────────────── */

/** 法条引用。act/section/quote/sourceUrl 一律从 `data/legal/**` 逐字复制，模型不得改写。 */
export interface StatuteRef {
  /** 如 "Residential Tenancies Act 2010 (NSW)" */
  act: string;
  /** 如 "s 51(3)(c)" */
  section: string;
  /** 官方原文短引文（英文）；服务端校验层用注入值覆盖模型输出 */
  quote: string;
  /** 白名单来源 URL，对照卡展开时外链 */
  sourceUrl: string;
}

/**
 * AI 从一份证据里读到的一条事实。
 *
 * 纪律（03a §1）：只记录**看得见**的东西，不推断、不评价、不补全。
 * 记录「未见到某物」时 `quote` 允许是中文陈述（没有原文可引），
 * 这正是 `contractObligation: 'absent'` 的依据。
 */
export interface EvidenceFact {
  /** `evidenceRefs[].factId` 引用的键；服务端白名单校验就是比对它 */
  id: string;
  kind: EvidenceKind;
  /** 来自哪张 `EvidenceImage`；示例常量可留空 */
  evidenceId?: string;
  /** 人能看懂的定位，如「入住报告 P3 · 客厅地毯」 */
  locator: string;
  /** 原文引语；英文材料保留英文 */
  quote: string;
  sourcePage?: number;
  /**
   * 证据原件里可定位高亮的行 id（如 `cr-living-carpet`）。
   * 有值时 03b 的证据行才可点击滚动高亮（04a 的 `ConditionReportDoc` 提供）。
   */
  anchorId?: string;
}

/** 对照卡的「证据」行指向哪条事实。 */
export interface EvidenceRef {
  factId: string;
  /** 这条事实在本项里起什么作用，可选的一句中文 */
  noteZh?: string;
}

/** 三板斧的取值。`unknown` / `n-a` 在 UI 上不得显示成「否」。 */
export type CheckState = "yes" | "no" | "unknown" | "n-a";

/** 合同义务轴单独一套取值：存在 / 已读页面中未见 / 未知 / 不适用 */
export type ContractObligationState = "exists" | "absent" | "unknown" | "n-a";

export type Verdict = "unlawful" | "doubtful" | "lawful";

/**
 * 三板斧。**红线**：`contractObligation === 'absent'` 时 `verdict` 永远不得是
 * `unlawful` —— lease 只读了前几页，用部分样本断言全量缺失站不住，一律降为
 * `doubtful` 并引 s 165 把举证责任翻转给房东。
 */
export interface AnalysisChecks {
  /** 入住时就存在？ */
  preExisting: CheckState;
  /** 合约里有没有这项义务？ */
  contractObligation: ContractObligationState;
  /** 属于合理磨损？ */
  fairWearTear: CheckState;
}

export interface AnalysisItem {
  description: string;
  amount?: number;
  verdict: Verdict;
  /** 中文结论。被服务端校验层降级时会在句首追加说明，不做静默改判 */
  reasoningZh: string;
  checks: AnalysisChecks;
  evidenceRefs: EvidenceRef[];
  statuteRefs: StatuteRef[];
  /** 该项可争议金额。`lawful` 恒为 0，其余不得超过 `amount` */
  disputableAmount: number;
  /** 申诉信里这一笔的英文段落；LLM 只产出它，信的骨架由 `lib/letter.ts` 代码拼 */
  paragraphEn: string;
}

/**
 * `evidence-based`：读到了事实，逐项给结论。
 * `burden-shift`：零证据，不猜结论，逐笔按 s 165 要求房东出示 condition report
 * 与发票/报价（全部 checks 为 unknown、verdict 为 doubtful，但措辞是要求举证）。
 */
export type AnalysisMode = "evidence-based" | "burden-shift";

/**
 * 账本：**六个数字一律由代码重算覆盖，不采信 LLM**。
 * 押金总额不在这里 —— 它是 `CaseInput.bondAmount`，账本条从那儿取。
 */
export interface AnalysisLedger {
  /** 房东索扣合计 */
  claimedTotal: number;
  /** ❌ 不合法合计 */
  unlawfulTotal: number;
  /** ⚠️ 待举证合计 */
  doubtfulTotal: number;
  /** ✅ 合法合计 */
  lawfulTotal: number;
  /** 可争议合计 = unlawful + doubtful */
  disputableTotal: number;
  /** 应退回至少 = bondAmount − lawfulTotal */
  refundExpected: number;
}

export interface AnalysisResult {
  mode: AnalysisMode;
  items: AnalysisItem[];
  /** AI 通读全部材料读到的事实；未被 `evidenceRefs` 引用的也留着，证据档要列出来 */
  facts: EvidenceFact[];
  ledger: AnalysisLedger;
  bondLodgementAlert: BondLodgementAlert;
  letterEn: string;
  letterZhNotes: string;
  winRate: "high" | "medium" | "low";
}

/* ── /sample 重放时轴（04a 提供数据，04b 编排播放）────────────────────── */

export type ReplayBeatKind =
  /** 证据文件飞入 */
  | "evidence-arrive"
  /** 字段自动填入，金色扫过 */
  | "prefill"
  /** 「正在阅读入住报告…」→ 读到 N 条事实 */
  | "facts-progress"
  /** 「正在对照 NSW 租赁法…」→ 比对了 M 条法条 */
  | "analyze-progress"
  /** 对照卡逐张翻开 */
  | "card-reveal"
  /** 停在完整结果页 */
  | "result";

export interface ReplayBeat {
  id: string;
  kind: ReplayBeatKind;
  /** 相对开场的毫秒数；节拍参考 `--duration-beat` = 1200ms */
  atMs: number;
  /** 这一拍的画面主文案（中文） */
  labelZh: string;
  /** 完成态或副标题文案 */
  detailZh?: string;
  /** `evidence-arrive`：飞入的是哪张证据 */
  evidenceId?: string;
  /** `prefill`：这一拍填好了哪些字段 */
  fields?: (keyof ExtractedCaseFields)[];
  /** `facts-progress`：累计读到几条事实 */
  factCount?: number;
  /** `analyze-progress`：比对了几条法条 */
  statuteCount?: number;
  /** `card-reveal`：翻开 `items` 里的第几张（0 起） */
  itemIndex?: number;
}
