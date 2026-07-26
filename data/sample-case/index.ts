/**
 * 示例案例常量（04a）—— 全站唯一的一份手工打磨假数据。
 *
 * 谁在用它：
 * - 03b 用它把结果页画完（真接口接上前的唯一数据源）
 * - 04b 首页嵌卡①、`/sample` 零 API 重放整条流水线
 * - 传播素材（战报卡、演示视频）的数字全部从这里取
 *
 * 纪律：
 * - **人名 / 地址 / 中介名 / 押金号全部虚构**，不得伪造任何真实世界凭证（04a §4）
 * - 法条 act/section/quote/sourceUrl 从 `data/legal/nsw.ts` 整件取用，这里不重写一个字
 * - 卡② 的 `contractObligation` 是 `absent` → verdict 必须是 `doubtful`（红线，见 lib/types.ts）
 * - 六个账本数字与逐项金额自洽：780 + 340 + 186 = 1306；可争议 1120；应退 3560 − 186 = 3374
 */

import { nswLegalClauses } from "@/data/legal/nsw";
import type {
  AnalysisItem,
  AnalysisLedger,
  AnalysisResult,
  CaseInput,
  EvidenceFact,
  EvidenceImage,
  ReplayBeat,
  StatuteRef,
} from "@/lib/types";

/* ── 法条：从 data/legal/nsw.ts 取原件 ──────────────────────────────────── */

/**
 * 按 clause id 整件取用法条。act / section / quote / sourceUrl 四个字段原样搬过来，
 * 手写会有错字，错字在维权信里就是硬伤（军规：法条引用宁缺毋错）。
 * 找不到就在模块加载时炸掉 —— 宁可开发期立刻红，也不要上线后引一条空法条。
 */
function statuteRef(clauseId: string): StatuteRef {
  const clause = nswLegalClauses.find((item) => item.id === clauseId);
  if (!clause) {
    throw new Error(`sample-case: data/legal/nsw.ts 里没有 ${clauseId}`);
  }
  return {
    act: clause.act,
    section: clause.section,
    quote: clause.quote,
    sourceUrl: clause.sourceUrl,
  };
}

/* ── 一、案情（NSW，虚构）──────────────────────────────────────────────── */

/**
 * 示例案例不含任何真实图片：四份「原件」由 `components/evidence/**` 用 HTML 画出来，
 * 所以这里的 `dataUrl` 一律为空串。
 *
 * 另：真实流水线会把 PDF 逐页拆成一张 `EvidenceImage`（见 evidence-uploader）。
 * 示例里每份文件只保留一条，页码交给 `EvidenceFact.sourcePage` 表达 ——
 * 重放动画要飞入的是「四份文件」，证据档要列的也是「四份文件」。
 */
const NO_IMAGE = "";

const SAMPLE_EVIDENCE: EvidenceImage[] = [
  {
    id: "ev-condition-report",
    kind: "condition-report",
    fileName: "入住报告.pdf",
    mimeType: "image/jpeg",
    dataUrl: NO_IMAGE,
  },
  {
    id: "ev-lease",
    kind: "lease",
    fileName: "租约.pdf",
    mimeType: "image/jpeg",
    dataUrl: NO_IMAGE,
  },
  {
    id: "ev-chat",
    kind: "chat",
    fileName: "聊天截图.png",
    mimeType: "image/jpeg",
    dataUrl: NO_IMAGE,
  },
  {
    id: "ev-deduction-notice",
    kind: "deduction-notice",
    fileName: "扣款清单.jpg",
    mimeType: "image/jpeg",
    dataUrl: NO_IMAGE,
  },
];

/** 虚构的当事人与物业（04a §4 指定，不得替换成真实中介品牌或住址）。 */
export const SAMPLE_PARTIES = {
  tenant: "L. Chen",
  agent: "Harbourline Property",
  propertyAddress: "12/34 Kingsford Rd, Kensington NSW 2033",
  bondNumber: "RB-2024-118376",
  letterDate: "2026-07-25",
} as const;

export const SAMPLE_CASE_INPUT: CaseInput = {
  state: "NSW",
  disputeTypes: ["cleaning", "bond"],
  bondAmount: 3560,
  claimedAmount: 1306,
  moveOutDate: "2026-06-28",
  bondPayment: {
    // 押金付给中介 → s 162 按「收款月份结束后 10 个工作日」起算
    paidTo: "agent",
    paidAt: "2024-02-26",
    paidByInstalments: "no",
    confirmationReceived: "no",
    // 没查过官方记录 → 只能出黄卡「先去查 RBO」，不做存管红警案例
    lookup: { status: "not-checked", evidence: "none" },
  },
  claimNotice: {
    receivedAt: "2026-07-18",
    dueAt: "2026-08-01",
    deliveryMethod: "email",
  },
  deductions: [
    { description: "退租专业清洁 + 地毯蒸洗", amount: 780 },
    { description: "花园 / 草坪维护", amount: 340 },
    { description: "未付水费", amount: 186 },
  ],
  evidence: SAMPLE_EVIDENCE,
  propertyAddress: SAMPLE_PARTIES.propertyAddress,
  notes:
    "中介 6 月 30 日来验过房，当场一句地毯的话都没说；7 月 18 日才发来扣款清单，附件里一张发票也没有。",
};

/* ── 二、7 条事实（4 条被采用、3 条未用到但仍展示）────────────────────── */

/**
 * `anchorId` 只有入住报告的事实才有 —— 它对应 `ConditionReportDoc` 里可定位的行 id，
 * 03b 靠它实现「点证据引语 → 滚动并高亮到原件对应行」。
 * 可用的 id 见 `components/evidence/condition-report-doc.tsx` 的 `CONDITION_REPORT_ROW_IDS`。
 */
export const SAMPLE_FACTS: EvidenceFact[] = [
  {
    id: "fact-cr-carpet",
    kind: "condition-report",
    evidenceId: "ev-condition-report",
    locator: "入住报告 P3 · 客厅地毯",
    quote: "Carpet: existing stains noted",
    sourcePage: 3,
    anchorId: "cr-living-carpet",
  },
  {
    id: "fact-cr-signed",
    kind: "condition-report",
    evidenceId: "ev-condition-report",
    locator: "入住报告 P1 · 签署信息",
    quote: "Tenant signed 5 Mar 2024",
    sourcePage: 1,
    anchorId: "cr-signature",
  },
  {
    id: "fact-cr-walls",
    kind: "condition-report",
    evidenceId: "ev-condition-report",
    locator: "入住报告 P2 · 墙面",
    quote: "Walls: good, minor scuffs",
    sourcePage: 2,
    anchorId: "cr-living-walls",
  },
  {
    // 记录的是「未见到某物」，没有原文可引，所以 quote 是中文陈述（03a §1 就这么要求）
    id: "fact-lease-no-garden",
    kind: "lease",
    evidenceId: "ev-lease",
    locator: "租约 P1-P3 · 条款清单",
    quote: "已读页面中未见园艺/草坪维护义务条款",
  },
  {
    id: "fact-lease-carpet-clause",
    kind: "lease",
    evidenceId: "ev-lease",
    locator: "租约 P2 · 第 14 条 清洁",
    quote: "carpets to be professionally cleaned at the end of tenancy",
    sourcePage: 2,
  },
  {
    id: "fact-chat-garden-ok",
    kind: "chat",
    evidenceId: "ev-chat",
    locator: "聊天截图 2026-03-14 · 中介",
    quote: "garden looks fine, no need to worry",
  },
  {
    id: "fact-notice-no-invoice",
    kind: "deduction-notice",
    evidenceId: "ev-deduction-notice",
    locator: "扣款清单 · 附件栏",
    quote: "未附任何发票或报价",
  },
];

/* ── 三、逐项对照 ─────────────────────────────────────────────────────── */

const ITEM_CARPET: AnalysisItem = {
  description: "退租专业清洁 + 地毯蒸洗",
  amount: 780,
  verdict: "unlawful",
  reasoningZh:
    "入住报告第 3 页白纸黑字写着客厅地毯「existing stains noted」，而这份报告是双方签署的 —— 按 s 30，它被推定为入住时状况的正确记录，除非房东能拿出相反证据。s 51(3)(c) 又要求判断清洁标准时必须考虑入住时的状况，你没有义务把地毯还成比接手时更干净。至于租约里那句笼统的「退租须专业清洗地毯」，按 s 19 一般不能强制执行（只有房东已同意室内养宠物、且清洗对该宠物属合理时才例外，你没有养宠物）。这 $780 全额可争。",
  checks: {
    preExisting: "yes",
    contractObligation: "exists",
    fairWearTear: "n-a",
  },
  evidenceRefs: [
    {
      factId: "fact-cr-carpet",
      noteZh: "入住时地毯就有污渍，这笔扣款的前提不成立",
    },
    {
      factId: "fact-lease-carpet-clause",
      noteZh: "租约里确有专业洗地毯条款，但正是 s 19 点名的那种笼统条款",
    },
  ],
  statuteRefs: [
    statuteRef("nsw-condition-report-evidence"),
    statuteRef("nsw-reasonably-clean"),
    statuteRef("nsw-professional-cleaning-term"),
  ],
  disputableAmount: 780,
  paragraphEn:
    "1. Professional cleaning and carpet steam cleaning — $780.00. The ingoing condition report dated 2 March 2024, signed by both parties, records at page 3: \"Carpet: existing stains noted\". Under s 30 of the Residential Tenancies Act 2010 (NSW) that report is presumed to be a correct statement of the condition of the premises at the commencement of the tenancy unless the contrary is proved. Section 51(2)(a) and (3)(c) require the state of cleanliness to be assessed having regard to the condition of the premises at the commencement of the tenancy; I am not required to return the carpet in a better condition than I received it. Clause 14 of the tenancy agreement states that \"carpets to be professionally cleaned at the end of tenancy\". A blanket term of that kind is not enforceable under s 19 unless the landlord has agreed to a pet being kept at the premises and the cleaning is reasonable for that type of pet. No pet was kept at the premises. I therefore dispute this item in full ($780.00).",
};

const ITEM_GARDEN: AnalysisItem = {
  description: "花园 / 草坪维护",
  amount: 340,
  verdict: "doubtful",
  reasoningZh:
    "你上传的合约页中未见园艺 / 草坪维护义务条款。注意措辞：你只上传了前 3 页，用这几页断言整份合约都没有这一条是站不住的，所以这笔判「待举证」而不是「不合法」。真正的打法是把球踢回去 —— 按 s 165，房东单方索赔时须在提出 claim 后 7 天内向你出示退租 condition report，以及支持索赔金额的估价、报价、发票或收据；你可以同时要求他指明依据的是哪一条。何况中介本人 2026 年 3 月 14 日还在消息里说「garden looks fine, no need to worry」。在他把条款和单据拿出来之前，这 $340 全额存疑。",
  checks: {
    // 红线：contractObligation 为 absent 时 verdict 永远不得是 unlawful
    preExisting: "n-a",
    contractObligation: "absent",
    fairWearTear: "n-a",
  },
  evidenceRefs: [
    {
      factId: "fact-lease-no-garden",
      noteZh: "已读的 3 页合约里没有这项义务 —— 只能说「未见」，不能说「没有」",
    },
    {
      factId: "fact-chat-garden-ok",
      noteZh: "中介在租期内亲口说过花园没问题",
    },
  ],
  statuteRefs: [statuteRef("nsw-landlord-claim-evidence")],
  disputableAmount: 340,
  paragraphEn:
    "2. Garden and lawn maintenance — $340.00. I have reviewed the pages of the tenancy agreement provided to me and none of them imposes an obligation on the tenant to maintain the garden or to mow the lawn. On 14 March 2026 your office wrote to me that the \"garden looks fine, no need to worry\". Please identify the specific clause of the agreement you rely on and provide, in accordance with s 165 of the Residential Tenancies Act 2010 (NSW), a copy of the final condition report together with the estimates, quotations, invoices or receipts that substantiate the amount claimed. Until that material is produced I dispute this item ($340.00).",
};

const ITEM_WATER: AnalysisItem = {
  description: "未付水费",
  amount: 186,
  verdict: "lawful",
  reasoningZh:
    "水费属于 s 166 明列的可以从押金中扣除的项目。这一笔房东占理，别争 —— 大方认下能扣的那笔，前面两笔的争议反而更站得住，对方也少了一个说你「什么都不认」的由头。",
  checks: {
    preExisting: "n-a",
    contractObligation: "n-a",
    fairWearTear: "n-a",
  },
  evidenceRefs: [],
  statuteRefs: [statuteRef("nsw-permitted-bond-claims")],
  disputableAmount: 0,
  paragraphEn:
    "3. Unpaid water usage — $186.00. Water usage charges properly payable by the tenant are among the amounts that may be claimed against the rental bond under s 166 of the Residential Tenancies Act 2010 (NSW). I do not dispute this item and I agree that $186.00 may be deducted from the bond.",
};

const SAMPLE_ITEMS: AnalysisItem[] = [ITEM_CARPET, ITEM_GARDEN, ITEM_WATER];

/* ── 四、账本（六个数字，与逐项金额逐一对上）─────────────────────────── */

/**
 * 780 + 340 + 186 = 1306（房东索扣）
 * 780 + 340       = 1120（可争议）
 * 3560 − 186      = 3374（应退回至少）
 * 押金 3560 不在这里 —— 它是 `CaseInput.bondAmount`。
 */
const SAMPLE_LEDGER: AnalysisLedger = {
  claimedTotal: 1306,
  unlawfulTotal: 780,
  doubtfulTotal: 340,
  lawfulTotal: 186,
  disputableTotal: 1120,
  refundExpected: 3374,
};

/* ── 五、申诉信（按 03a §4 的拼装规则手工写出等效结果）──────────────────
   骨架（日期 / 抬头 / 金额 / 押金号 / s 165 索证 / 期限 / 附件）由代码拼，
   逐笔的英文段落来自 items[].paragraphEn —— 下面这封信就是拼装后的最终形态。
   ──────────────────────────────────────────────────────────────────── */

const SAMPLE_LETTER_EN = `25 July 2026

Harbourline Property
Attention: Property Manager
By email

Re:  Rental bond RB-2024-118376
     12/34 Kingsford Rd, Kensington NSW 2033
     Tenant: L. Chen — tenancy ended 28 June 2026

     Bond lodged      $3,560.00
     Amount claimed   $1,306.00
     Amount disputed  $1,120.00
     Not disputed     $186.00

Dear Sir or Madam,

I refer to your notice of claim against my rental bond, received by email on 18 July 2026, in which you claim $1,306.00 of the $3,560.00 bond. I dispute $1,120.00 of that amount. My reasons for each item are set out below.

${ITEM_CARPET.paragraphEn}

${ITEM_GARDEN.paragraphEn}

${ITEM_WATER.paragraphEn}

Section 165 of the Residential Tenancies Act 2010 (NSW) requires a landlord who claims against a rental bond to give the tenant, within 7 days of making the claim, a copy of the final condition report and the estimates, quotations, invoices or receipts that substantiate the amount claimed. Your notice of claim was sent without any invoice or quotation attached. Please provide that material in full.

In summary, I dispute $1,120.00 of the $1,306.00 claimed and ask that $3,374.00 be released to me from the bond. I agree that $186.00 may be deducted for unpaid water usage.

Please reply in writing within 14 days of the date of this letter. If the matter is not resolved, I intend to apply to the NSW Civil and Administrative Tribunal for an order for payment of the rental bond and to advise NSW Fair Trading that the claim is disputed.

Attachments:
1. Ingoing condition report dated 2 March 2024 (pages 1-3)
2. Residential tenancy agreement (pages 1-3)
3. Message from your office dated 14 March 2026
4. Your notice of claim dated 18 July 2026

Yours faithfully,

L. Chen
Tenant, 12/34 Kingsford Rd, Kensington NSW 2033

---
Prepared with the assistance of BondBack. This letter is not legal advice.`;

const SAMPLE_LETTER_ZH_NOTES = `这封信每一段对应一笔扣款，中文对照如下。金额、押金号、法条编号、期限全部由程序填入，不经过 AI。

开头：写明押金号、地址、租期结束日、收到 claim 通知的日期，并一句话点题——「我争议其中 $1,120」。先把数字摆清楚，对方就没法含糊过去。

第 1 段 · 清洁与地毯 $780：援引双方签署的入住报告第 3 页「Carpet: existing stains noted」。s 30 说这份报告被推定为入住时状况的正确记录；s 51(2)(a)、(3)(c) 说判断清洁标准必须考虑入住时的状况；租约第 14 条那句笼统的「退租须专业清洗地毯」按 s 19 一般不能强制执行。三条法条一起把这笔钱的地基抽掉。

第 2 段 · 花园 $340：措辞是刻意克制的——只说「你给我的这几页合约里没有这项义务」，没有断言整份合约都没有，因为你只上传了前 3 页。然后按 s 165 把举证责任推回去：请他指出具体条款，并出示退租 condition report 与报价、发票。再补一句中介自己说过的「garden looks fine」。

第 3 段 · 水费 $186：明确认下这一笔可以扣。诚实认账不是让步，它让前两笔的争议更可信，也堵住对方「这个租客什么都不认」的说辞。

结尾：统一按 s 165 索要退租 condition report 与全部发票/报价（你的扣款清单一张单据都没附），给出 14 天回复期限，并说明下一步会去 NCAT 并知会 Fair Trading。

发送建议：用邮件发，正文直接粘贴全文，不要只发附件；保留发送记录和已读回执。同一份内容另存一份 PDF 备查。`;

/* ── 六、完整分析结果 ─────────────────────────────────────────────────── */

export const SAMPLE_ANALYSIS: AnalysisResult = {
  mode: "evidence-based",
  items: SAMPLE_ITEMS,
  facts: SAMPLE_FACTS,
  ledger: SAMPLE_LEDGER,
  /**
   * 与 `lib/bond-lodgement.ts` 对 SAMPLE_CASE_INPUT.bondPayment 的确定性输出逐字一致
   * （NSW · agent · 2024-02-26 · 未查记录 → verify-record 黄卡）。改案情数字请重算这里。
   */
  bondLodgementAlert: {
    level: "verify-record",
    reasoningZh:
      "没有收到确认邮件本身不能证明押金未存管（邮件可能发到旧邮箱或被过滤）。你还没有确认过官方记录。建议先在 Rental Bonds Online（NSW Fair Trading） 查询押金记录并保留查询结果，再判断是否存在存管问题。",
    calculatedDeadline: "2024-03-14",
    deadlineBasis:
      "押金付给中介，NSW《Residential Tenancies Act 2010》s 162 要求在收款月份结束（2024年2月29日）后 10 个工作日内存管，估算期限为 2024年3月14日。",
  },
  letterEn: SAMPLE_LETTER_EN,
  letterZhNotes: SAMPLE_LETTER_ZH_NOTES,
  winRate: "high",
};

/* ── 七、派生量（战报卡与重放文案直接取用，避免各处手抄数字）───────────── */

/** 被 `evidenceRefs` 采用的事实 id（4 条）；其余 3 条在证据档里仍要列出来。 */
export const SAMPLE_USED_FACT_IDS: string[] = Array.from(
  new Set(
    SAMPLE_ITEMS.flatMap((item) => item.evidenceRefs.map((ref) => ref.factId)),
  ),
);

/** 本案比对到的不重复法条条数（5 条：s 30 · s 51 · s 19 · s 165 · s 166）。 */
export const SAMPLE_STATUTE_COUNT: number = new Set(
  SAMPLE_ITEMS.flatMap((item) =>
    item.statuteRefs.map((ref) => `${ref.act}|${ref.section}`),
  ),
).size;

/* ── 八、/sample 重放时轴（04b §2 的表，本模块只提供数据，不做动画）────── */

export const SAMPLE_REPLAY_TIMELINE: ReplayBeat[] = [
  {
    id: "beat-arrive-condition-report",
    kind: "evidence-arrive",
    atMs: 0,
    labelZh: "入住报告.pdf",
    detailZh: "3 页 · 2024 年 3 月双方签署",
    evidenceId: "ev-condition-report",
  },
  {
    id: "beat-arrive-lease",
    kind: "evidence-arrive",
    atMs: 1200,
    labelZh: "租约.pdf",
    detailZh: "3 页",
    evidenceId: "ev-lease",
  },
  {
    id: "beat-arrive-chat",
    kind: "evidence-arrive",
    atMs: 2400,
    labelZh: "聊天截图.png",
    detailZh: "与中介的对话",
    evidenceId: "ev-chat",
  },
  {
    id: "beat-arrive-deduction-notice",
    kind: "evidence-arrive",
    atMs: 3600,
    labelZh: "扣款清单.jpg",
    detailZh: "房东索扣 3 笔",
    evidenceId: "ev-deduction-notice",
  },
  {
    id: "beat-prefill",
    kind: "prefill",
    atMs: 4500,
    labelZh: "自动填好了 3 个字段",
    detailZh: "押金 $3,560 · 被扣 $1,306 · 扣款 3 项",
    fields: ["bondAmount", "claimedAmount", "deductions"],
  },
  {
    id: "beat-facts-condition-report",
    kind: "facts-progress",
    atMs: 6000,
    labelZh: "正在阅读入住报告…",
    detailZh: "读到 3 条事实",
    factCount: 3,
  },
  {
    id: "beat-facts-lease-chat",
    kind: "facts-progress",
    atMs: 7500,
    labelZh: "正在阅读租约与聊天记录…",
    detailZh: "累计读到 7 条事实",
    factCount: 7,
  },
  {
    id: "beat-analyze",
    kind: "analyze-progress",
    atMs: 9000,
    labelZh: "正在对照 NSW 租赁法…",
    detailZh: "比对了 5 条法条",
    statuteCount: 5,
  },
  {
    id: "beat-card-carpet",
    kind: "card-reveal",
    atMs: 11000,
    labelZh: "退租专业清洁 + 地毯蒸洗 $780",
    detailZh: "不合法 · 可争议 $780",
    itemIndex: 0,
  },
  {
    id: "beat-card-garden",
    kind: "card-reveal",
    atMs: 12200,
    labelZh: "花园 / 草坪维护 $340",
    detailZh: "待举证 · 可争议 $340",
    itemIndex: 1,
  },
  {
    id: "beat-card-water",
    kind: "card-reveal",
    atMs: 13400,
    labelZh: "未付水费 $186",
    detailZh: "合法，别争",
    itemIndex: 2,
  },
  {
    id: "beat-result",
    kind: "result",
    atMs: 14600,
    labelZh: "3 笔扣款逐项对照完成",
    detailZh: "可争议 $1,120 · 应退回至少 $3,374",
  },
];
