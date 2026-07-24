import type { LegalClause, StateProcess } from "./types";

const CHECKED_AT = "2026-07-24";
const VIC_ACT =
  "https://content.legislation.vic.gov.au/sites/default/files/2026-07/97-109aa113-authorised.pdf";
const VIC_REGULATIONS =
  "https://content.legislation.vic.gov.au/sites/default/files/2026-06/21-3sra009-authorised.pdf";
const VCAT_FEES_2026 =
  "https://content.legislation.vic.gov.au/sites/default/files/2026-06/26-070sra-authorised.pdf";
const VIC_2025_AMENDMENT =
  "https://content.legislation.vic.gov.au/sites/default/files/2025-11/25-046aa-authorised.pdf";

/**
 * 使用截至 2026-07-01 的 Residential Tenancies Act 1997 授权合订本
 *（Version 113）及截至 2026-06-30 的 Regulations Version 009。
 */
export const vicLegalClauses: LegalClause[] = [
  {
    id: "vic-bond-lodgement-deadline",
    state: "VIC",
    topics: ["bond"],
    act: "Residential Tenancies Act 1997 (Vic)",
    section: "s 406",
    quote:
      "within 10 business days after receiving the bond ... give the bond to the Authority",
    ruleZh:
      "收取押金的 rental provider 须在收到后 10 个工作日内将押金和完整表格交给 RTBA。违反最高可罚 150 penalty units。",
    sourceUrl: VIC_ACT,
    sourceKind: "legislation",
    confidence: "confirmed",
    checkedAt: CHECKED_AT,
    notes:
      "部分 CAV 页面摘要写 14 days，与截至 2026-07-01 的授权法案 s 406 不一致；结构化数据采用上位法的 10 business days。只有 provider 收到 bond 时才计算本义务，租客直接付 RTBA 的情形不得误判。",
  },
  {
    id: "vic-missing-rtba-receipt",
    state: "VIC",
    topics: ["bond"],
    act: "Residential Tenancies Act 1997 (Vic)",
    section: "s 409",
    quote:
      "has not received a receipt ... within 15 business days ... may notify the Authority",
    ruleZh:
      "租客交付押金后 15 个工作日仍未收到 RTBA 收据，可以通知 RTBA。未收到邮件并不自动证明未存管，应先向 RTBA 核实记录。",
    sourceUrl: VIC_ACT,
    sourceKind: "legislation",
    confidence: "confirmed",
    checkedAt: CHECKED_AT,
  },
  {
    id: "vic-who-may-claim-bond",
    state: "VIC",
    topics: ["bond"],
    act: "Residential Tenancies Act 1997 (Vic)",
    section: "s 411",
    quote:
      "A renter ... or a residential rental provider may apply to the Authority for repayment",
    ruleZh:
      "租约结束后，租客、代理或 rental provider 都可向 RTBA 发起退款。租客可单独发起；provider 单独申请时只能要求把款项付给租客，若要从押金中取得款项通常需共同申请或走争议程序。",
    sourceUrl: VIC_ACT,
    sourceKind: "legislation",
    confidence: "confirmed",
    checkedAt: CHECKED_AT,
  },
  {
    id: "vic-unilateral-bond-claim-notice",
    state: "VIC",
    topics: ["bond"],
    act: "Residential Tenancies Act 1997 (Vic)",
    section: "s 411A",
    quote:
      "within 14 days after receiving the notice ... the claim is the subject of an application",
    ruleZh:
      "一方单独发起 RTBA claim 后，RTBA 通知其他方；不同意的一方须在收到通知后 14 天内告知 RTBA，该 claim 已成为法定申请的对象，否则 RTBA 可按 claim 支付。",
    sourceUrl: VIC_ACT,
    sourceKind: "legislation",
    confidence: "confirmed",
    checkedAt: CHECKED_AT,
    notes:
      "CAV 操作指引说明无法以 email 联系某方时会邮寄通知，操作期可能延长至 20 天；产品必须优先采用实际 RTBA notice 的 due date。",
  },
  {
    id: "vic-permitted-bond-claims",
    state: "VIC",
    topics: ["all"],
    act: "Residential Tenancies Act 1997 (Vic)",
    section: "s 411AB",
    quote:
      "reasonable cost of repairs ... taking into account fair wear and tear ... [and] reasonable cost of cleaning",
    ruleZh:
      "法定项目包括欠租或其他到期费用、租客或访客造成损坏的合理修复/恢复费、结合入住状况后的合理清洁费，以及租客未经同意改动、移除或安装锁具/安全装置的合理更换费。损坏金额须考虑 fair wear and tear，provider 仍须证明责任、实际损失及金额合理。",
    sourceUrl: VIC_ACT,
    sourceKind: "legislation",
    confidence: "confirmed",
    checkedAt: CHECKED_AT,
  },
  {
    id: "vic-provider-bond-application-deadline",
    state: "VIC",
    topics: ["bond"],
    act: "Residential Tenancies Act 1997 (Vic)",
    section: "s 419A",
    quote:
      "An application ... must be made within 14 days after the residential rental agreement terminates",
    ruleZh:
      "任何有利害关系的一方可申请 VCAT 作出押金支付命令；法定申请期限为租约终止后 14 天。逾期能否延长期限由程序规则和个案决定，产品不得把延期描述为自动权利。",
    sourceUrl: VIC_ACT,
    sourceKind: "legislation",
    confidence: "confirmed",
    checkedAt: CHECKED_AT,
    notes:
      "14 天从 rental agreement termination 起算。是否允许逾期申请取决于程序规则与个案，不是自动权利。",
  },
  {
    id: "vic-condition-report-entry-exit",
    state: "VIC",
    topics: ["cleaning", "damage"],
    act: "Residential Tenancies Act 1997 (Vic)",
    section: "s 35",
    quote:
      "within 5 business days after entering into occupation ... [and] within 10 days after the termination",
    ruleZh:
      "入住前 rental provider 须提供两份已签署 condition report（电子版视为两份）；租客入住后 5 个工作日内返还。退租 report 应在租约结束后 10 天内完成，并让租客有合理机会在场。",
    sourceUrl: VIC_ACT,
    sourceKind: "legislation",
    confidence: "confirmed",
    checkedAt: CHECKED_AT,
  },
  {
    id: "vic-condition-report-evidence",
    state: "VIC",
    topics: ["cleaning", "damage"],
    act: "Residential Tenancies Act 1997 (Vic)",
    section: "s 36",
    quote:
      "is conclusive evidence ... of the state of repair or general condition",
    ruleZh:
      "双方签署的 condition report 对入住时维修和整体状况具有很强的证据效力，但法定例外仍可能适用；租客应把异议和照片纳入报告。",
    sourceUrl: VIC_ACT,
    sourceKind: "legislation",
    confidence: "confirmed",
    checkedAt: CHECKED_AT,
  },
  {
    id: "vic-reasonably-clean",
    state: "VIC",
    topics: ["cleaning"],
    act: "Residential Tenancies Act 1997 (Vic)",
    section: "s 63",
    quote:
      "leave the rented premises ... in a reasonably clean condition ... taking into account fair wear and tear",
    ruleZh:
      "租客须保持合理清洁，退租时在切实可行范围内留下合理清洁且接近入住时的状态，并考虑合理损耗。标准是结合房屋性质、年龄、入住时状况的社区合理标准，并非默认 spotless。",
    sourceUrl: VIC_ACT,
    sourceKind: "legislation",
    confidence: "confirmed",
    checkedAt: CHECKED_AT,
  },
  {
    id: "vic-professional-cleaning-term",
    state: "VIC",
    topics: ["cleaning"],
    act:
      "Residential Tenancies Act 1997 (Vic); Residential Tenancies Regulations 2021 (Vic)",
    section: "s 27C; reg 12",
    quote:
      "must not require ... professional cleaning ... unless ... carried out immediately before ... or ... required to restore",
    ruleZh:
      "provider 不得默认要求退租专业清洁。只有两类情形可成立：入住前刚做过专业清洁且已告知租客；或确有必要把房屋恢复到入住前状态。后一判断必须看 condition report，并排除 fair wear and tear；即使成立也只能主张合理必要的范围和费用。",
    sourceUrl: VIC_REGULATIONS,
    sourceKind: "legislation",
    confidence: "confirmed",
    checkedAt: CHECKED_AT,
  },
  {
    id: "vic-fair-wear-and-tear-definition",
    state: "VIC",
    topics: ["damage"],
    act: "Residential Tenancies Act 1997 (Vic)",
    section: "s 3(1)",
    quote:
      "deterioration ... caused by the reasonable use ... and the operation of natural environmental forces",
    ruleZh:
      "合理损耗是租客或访客合理使用房屋，以及自然环境作用造成的老化。判断索赔还应考虑物品年龄、使用寿命、折旧、因果关系和修复是否合理。",
    sourceUrl: VIC_ACT,
    sourceKind: "legislation",
    confidence: "confirmed",
    checkedAt: CHECKED_AT,
  },
  {
    id: "vic-bond-proceeding-vcat-fee",
    state: "VIC",
    topics: ["bond"],
    act:
      "Victorian Civil and Administrative Tribunal (Fees) Regulations 2026 (Vic)",
    section: "Sch 2 Pt 1 Table 5 item 20",
    quote:
      "Proceeding under Part 10 ... of the Residential Tenancies Act 1997 — No fee",
    ruleZh:
      "押金支付申请位于 Residential Tenancies Act 1997 Part 10；2026 VCAT Fees Regulations 对 Part 10 proceedings 规定 no fee。若案件混合其他请求或程序性质不同，提交前仍应核对 VCAT。",
    sourceUrl: VCAT_FEES_2026,
    sourceKind: "legislation",
    confidence: "confirmed",
    checkedAt: CHECKED_AT,
    notes:
      "2026 Regulations 于 2026-06-27 生效。若混合 compensation 或其他请求，须按实际 proceeding category 重新核费。",
  },
  {
    id: "vic-provider-bond-claim-evidence-2026",
    state: "VIC",
    topics: ["all"],
    act:
      "Residential Tenancies Act 1997 (Vic); Consumer Legislation Amendment Act 2025 (Vic)",
    section: "ss 411(1A)–(1B), 419A(1A); amending ss 9–11",
    quote:
      "at least 3 days before making the application, give each renter the bond claim evidence",
    ruleZh:
      "自 2026-10-13 起，provider/agent 若提出向其支付 bond 的 claim，须至少提前 3 天向每名 renter 提供支持材料；provider/agent 的 s 419A 申请也须随附证据。证据包括发票、收据、报价、照片及规定材料，且不得与 condition report 冲突。",
    sourceUrl: VIC_2025_AMENDMENT,
    sourceKind: "legislation",
    confidence: "confirmed",
    checkedAt: CHECKED_AT,
    effectiveFrom: "2026-10-13",
    notes:
      "这是未来生效规则；confirmed-only selector 会在 effectiveFrom 前自动排除。",
  },
];

export const vicStateProcesses: StateProcess[] = [
  {
    id: "vic-process-rtba-check",
    state: "VIC",
    stage: "bond-authority",
    agency: "Residential Tenancies Bond Authority (RTBA)",
    summaryZh:
      "先向 RTBA 核对 receipt 和押金记录；未收到确认邮件不能单独证明违法未存管。",
    stepsZh: [
      "通过 RTBA Online 查询 bond 记录，或联系 RTBA 核实。",
      "核对押金实际支付对象和日期；租客直接付 RTBA 时不得套用 provider 收款后未转交的判断。",
    ],
    sourceUrl:
      "https://www.consumer.vic.gov.au/housing/renting/rent-bond-bills-and-condition-reports/bond",
    sourceKind: "regulator-guidance",
    confidence: "confirmed",
    checkedAt: CHECKED_AT,
    phone: "1300 137 164",
  },
  {
    id: "vic-process-rtba-claim",
    state: "VIC",
    stage: "bond-authority",
    agency: "Residential Tenancies Bond Authority (RTBA)",
    summaryZh:
      "租客可在租约结束后先发起 RTBA claim；正式 contest 必须在通知期限内进入 RDRV/VCAT 程序。",
    stepsZh: [
      "bond 上列名的租客可在线发起 claim；RTBA 会通知其他方。",
      "不同意单方 claim 时，在实际 RTBA notice 的 due date 前向 RDRV/VCAT 提出 bond application。",
      "把有效 reference number 填入 RTBA transaction；一般投诉或仅与中介交涉不会暂停付款。",
    ],
    sourceUrl:
      "https://www.consumer.vic.gov.au/housing/renting/rent-bond-bills-and-condition-reports/bond/starting-or-contesting-a-bond-claim-initiated-by-a-renter",
    sourceKind: "regulator-guidance",
    confidence: "confirmed",
    checkedAt: CHECKED_AT,
    timeLimitZh:
      "email 通知通常 14 天；邮寄通知操作期可能为 20 天，以实际 RTBA notice 的 due date 为准。",
    notes:
      "RTBA 会在 response period 结束时复核 reference 是否仍有效；无法在线验证时可提交 reference document 审核。",
  },
  {
    id: "vic-process-portable-rental-bond",
    state: "VIC",
    stage: "bond-authority",
    agency: "Portable Rental Bond Scheme",
    summaryZh:
      "符合条件的租客可自愿把仍由 RTBA 持有、未被 claim 或暂停的旧 bond 转至新的 Victorian rental。",
    stepsZh: [
      "确认新旧 bond 列有相同 renters，且两处房产均在 Victoria。",
      "核对排除条件和所有 renters 的同意后在线申请。",
      "理解旧 provider 后续成功索赔时，政府代付金额会成为租客欠州政府的债务。",
    ],
    sourceUrl: "https://www.vic.gov.au/about-portable-rental-bond-scheme",
    sourceKind: "regulator-guidance",
    confidence: "confirmed",
    checkedAt: CHECKED_AT,
    effectiveFrom: "2026-07-01",
    feeZh: "$25 申请费。",
    notes:
      "不适用于分开搬家的 share-house renters、rooming house、caravan park、Part 4A dwelling、Homes Victoria loan bond 或尚欠此前 transfer debt 的租客。",
  },
  {
    id: "vic-process-cav",
    state: "VIC",
    stage: "consumer-agency",
    agency: "Consumer Affairs Victoria",
    summaryZh:
      "提供租赁权利信息和投诉协助；普通投诉不会自动停止 RTBA 支付或替代法定申请。",
    stepsZh: [
      "先保存与 provider/agent 的书面沟通、condition report、照片及金额凭证。",
      "通过 residential accommodation complaint 表单求助，并另行保护紧急 bond 时限。",
    ],
    sourceUrl:
      "https://www.consumer.vic.gov.au/contact-us/resolve-your-problem/residential-accommodation-complaint",
    sourceKind: "regulator-guidance",
    confidence: "confirmed",
    checkedAt: CHECKED_AT,
    phone: "1300 55 81 81",
  },
  {
    id: "vic-process-rdrv",
    state: "VIC",
    stage: "tribunal",
    agency: "Rental Dispute Resolution Victoria (RDRV)",
    summaryZh:
      "RDRV 是 VCAT 的免费、digital-first 租赁争议服务，可处理适合其范围的 bond、维修和赔偿争议。",
    stepsZh: [
      "提交 dispute application，并保留 reference number。",
      "无法解决时按 RDRV 指引进入正式 VCAT hearing。",
    ],
    sourceUrl:
      "https://www.consumer.vic.gov.au/housing/renting/legal-and-dispute-support/resolving-disputes",
    sourceKind: "regulator-guidance",
    confidence: "confirmed",
    checkedAt: CHECKED_AT,
    feeZh: "RDRV 服务免费。",
    phone: "1300 017 378",
  },
  {
    id: "vic-process-vcat",
    state: "VIC",
    stage: "tribunal",
    agency: "VCAT Residential Tenancies",
    summaryZh:
      "申请具有约束力的 bond order；准备 condition report、照片、报价/发票、RTBA notice 和完整沟通记录。",
    stepsZh: [
      "provider 通常须在租约终止后 14 天内提出 s 419A bond application。",
      "收到单方 RTBA claim 时，按 notice due date 提交并把 reference number 告知 RTBA。",
    ],
    sourceUrl:
      "https://www.vcat.vic.gov.au/case-types/residential-tenancies",
    sourceKind: "tribunal",
    confidence: "confirmed",
    checkedAt: CHECKED_AT,
    feeZh:
      "单纯 Residential Tenancies Act Part 10 bond proceeding 按 2026 Fees Regulations 为 no fee；混合请求须复核。",
    timeLimitZh:
      "s 419A 通常为租约终止后 14 天；单方 claim 争议以实际 RTBA notice 为准。",
    phone: "1300 01 8228",
  },
];
