import type { LegalClause, StateProcess } from "./types";

const CHECKED_AT = "2026-07-24";
const NSW_ACT =
  "https://legislation.nsw.gov.au/view/whole/html/inforce/current/act-2010-042";
const NSW_REGULATION =
  "https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0629";

/**
 * 最高罚则均为监管/刑事上限，不是自动支付给租客的赔偿。
 */
export const nswLegalClauses: LegalClause[] = [
  {
    id: "nsw-bond-lodgement-deadline",
    state: "NSW",
    topics: ["bond"],
    act: "Residential Tenancies Act 2010 (NSW)",
    section: "s 162",
    quote:
      "10 business days after the rental bond is paid ... every 3 months until the bond is fully paid",
    ruleZh:
      "一次性支付：房东或其他非中介收款人须在收款后 10 个工作日内存管；中介须在收款月份结束后 10 个工作日内存管。分期支付：若首期后 3 个月内付清，须在付清后 10 个工作日内存管；若未付清，首三个月内的款项按法定三个月节点处理，之后每 3 个月存管一次直至付清。违反最高可罚 20 penalty units。",
    sourceUrl: `${NSW_ACT}#sec.162`,
    sourceKind: "legislation",
    confidence: "confirmed",
    checkedAt: CHECKED_AT,
    notes:
      "不得统一概括成“收款后 10 天”。计算前必须知道收款人身份、付款日期及是否分期；s 162(4)(b) 采用“首期后 3 个月”与“各期后 10 个工作日”两者较晚者。",
  },
  {
    id: "nsw-tenant-or-landlord-may-claim-bond",
    state: "NSW",
    topics: ["bond"],
    act: "Residential Tenancies Act 2010 (NSW)",
    section: "s 163",
    quote:
      "A claim for the payment of a rental bond may be made ... by a landlord or a tenant",
    ruleZh:
      "租约结束后，租客、房东或双方均可向押金管理机构提出退款 claim；租客无需等待房东先发起。",
    sourceUrl: `${NSW_ACT}#sec.163`,
    sourceKind: "legislation",
    confidence: "confirmed",
    checkedAt: CHECKED_AT,
  },
  {
    id: "nsw-unilateral-bond-claim-notice",
    state: "NSW",
    topics: ["bond"],
    act: "Residential Tenancies Act 2010 (NSW)",
    section: "s 164",
    quote:
      "within 14 days ... the claim is the subject of proceedings before the Tribunal or a court",
    ruleZh:
      "一方单独提出押金 claim 后，押金管理机构会通知其他方。收到通知的一方须在通知规定的 14 天内证明该 claim 已进入 NCAT 或法院程序，否则押金可按先到的 claim 支付。",
    sourceUrl: `${NSW_ACT}#sec.164`,
    sourceKind: "legislation",
    confidence: "confirmed",
    checkedAt: CHECKED_AT,
    notes:
      "仅投诉或与中介协商不会暂停期限；提交 NCAT 后还须在 due-for-payment 前按 Notice/RBO 步骤通知 Fair Trading。",
  },
  {
    id: "nsw-landlord-claim-evidence",
    state: "NSW",
    topics: ["all"],
    act: "Residential Tenancies Act 2010 (NSW)",
    section: "s 165",
    quote:
      "within 7 days of making the claim, give the tenant ... a copy of the final condition report",
    ruleZh:
      "房东单独从押金中索赔时，须在提出 claim 后 7 天内向租客提供退租 condition report，以及支持索赔金额的估价、报价、发票或收据；违反可罚 20 penalty units。",
    sourceUrl: `${NSW_ACT}#sec.165`,
    sourceKind: "legislation",
    confidence: "confirmed",
    checkedAt: CHECKED_AT,
  },
  {
    id: "nsw-permitted-bond-claims",
    state: "NSW",
    topics: ["all"],
    act: "Residential Tenancies Act 2010 (NSW)",
    section: "s 166",
    quote:
      "reasonable cost of repairs ... other than fair wear and tear ... reasonable cost of cleaning",
    ruleZh:
      "法定项目包括欠租或其他到期费用、非合理损耗造成损坏的合理修复/恢复费、结合入住状况后的合理清洁费，以及租客未经同意改动、移除或增加锁具/安全装置的合理更换费；清单不是穷尽式。官方另举 break fee、未归还钥匙和符合条件的未付水费为常见例子，房东仍须证明责任、实际损失及金额合理。",
    sourceUrl: `${NSW_ACT}#sec.166`,
    sourceKind: "legislation",
    confidence: "confirmed",
    checkedAt: CHECKED_AT,
  },
  {
    id: "nsw-bond-tribunal-backstop",
    state: "NSW",
    topics: ["bond"],
    act:
      "Residential Tenancies Act 2010 (NSW); Residential Tenancies Regulation 2019 (NSW)",
    section: "s 175; cl 39(8)",
    quote:
      "within the period of 6 months after the rental bond has been paid out",
    ruleZh:
      "若押金已经支付，依据 s 175 向 NCAT 申请押金支付命令的规定期限为支付后 6 个月。这是后备申请期限，不能替代收到单方 claim 通知后的紧急 14 天应对。",
    sourceUrl: `${NSW_REGULATION}#sec.39`,
    sourceKind: "legislation",
    confidence: "confirmed",
    checkedAt: CHECKED_AT,
  },
  {
    id: "nsw-condition-report-entry",
    state: "NSW",
    topics: ["cleaning", "damage"],
    act: "Residential Tenancies Act 2010 (NSW)",
    section: "s 29",
    quote:
      "not later than 7 days after the tenant takes possession ... return ... one copy",
    ruleZh:
      "房东须在签约前或签约时向租客提供已填写并签署的 condition report；租客应在取得房屋占有后 7 天内填写并返还一份，并保留副本。",
    sourceUrl: `${NSW_ACT}#sec.29`,
    sourceKind: "legislation",
    confidence: "confirmed",
    checkedAt: CHECKED_AT,
  },
  {
    id: "nsw-condition-report-evidence",
    state: "NSW",
    topics: ["cleaning", "damage"],
    act: "Residential Tenancies Act 2010 (NSW)",
    section: "s 30",
    quote:
      "is presumed to be a correct statement ... unless the contrary is proved",
    ruleZh:
      "双方签署的入住 condition report 原则上被推定为入住时状况的正确记录，除非有相反证据；因此照片、视频和租客批注仍很重要。",
    sourceUrl: `${NSW_ACT}#sec.30`,
    sourceKind: "legislation",
    confidence: "confirmed",
    checkedAt: CHECKED_AT,
  },
  {
    id: "nsw-reasonably-clean",
    state: "NSW",
    topics: ["cleaning"],
    act: "Residential Tenancies Act 2010 (NSW)",
    section: "s 51(2)(a), (3)(c)",
    quote:
      "in a reasonable state of cleanliness, having regard to the condition of the premises at the commencement",
    ruleZh:
      "租客须保持并在退租时留下“合理清洁”的房屋，判断时必须考虑入住时的原始状况；法律并非一概要求 spotless 或专业清洁。",
    sourceUrl: `${NSW_ACT}#sec.51`,
    sourceKind: "legislation",
    confidence: "confirmed",
    checkedAt: CHECKED_AT,
  },
  {
    id: "nsw-professional-cleaning-term",
    state: "NSW",
    topics: ["cleaning"],
    act: "Residential Tenancies Act 2010 (NSW)",
    section: "s 19",
    quote:
      "requiring a tenant to have the carpet professionally cleaned ... unless ... reasonable for the type of pet",
    ruleZh:
      "租约不得笼统要求退租时专业清洗地毯或承担该费用。房东已同意在室内饲养宠物且清洗对该宠物类型属合理时，才可加入相应条件；专业熏蒸也仅有受限的宠物例外。无效附加条款不能仅因写进 lease 就执行。",
    sourceUrl:
      "https://www.nsw.gov.au/housing-and-construction/rules/residential-tenancy-agreements",
    sourceKind: "regulator-guidance",
    confidence: "confirmed",
    checkedAt: CHECKED_AT,
    notes:
      "仍须区分“专业清洁条款是否有效”与租客留下 reasonably clean 房屋的独立义务。",
  },
  {
    id: "nsw-fair-wear-and-tear",
    state: "NSW",
    topics: ["damage"],
    act:
      "Residential Tenancies Act 2010 (NSW); Residential Tenancies Regulation 2019 (NSW)",
    section: "s 51(3)(b); Sch 2",
    quote:
      "Fair wear and tear is a general term for anything that occurs through ordinary use",
    ruleZh:
      "退租时原则上须恢复至接近入住时状态，但合理损耗除外。官方 condition report 将其概括为普通使用导致的变化；故意或疏忽造成的损坏不属于合理损耗。",
    sourceUrl: `${NSW_REGULATION}#sch.2`,
    sourceKind: "legislation",
    confidence: "confirmed",
    checkedAt: CHECKED_AT,
  },
  {
    id: "nsw-ncat-residential-fee",
    state: "NSW",
    topics: ["bond"],
    act:
      "Civil and Administrative Tribunal Regulation 2022 (NSW); NCAT fee schedule",
    section: "Sch 2; fees from 1 July 2026",
    quote: "Residential proceedings — Standard fee $64.00 ... Reduced fee $16.00",
    ruleZh:
      "自 2026-07-01 起，NCAT residential proceedings 申请费标准为 $64；符合减免费资格者为 $16；公司申请人为 $128。费用会调整，提交前应再次核对。",
    sourceUrl: "https://ncat.nsw.gov.au/forms-and-fees/fees-at-ncat.html",
    sourceKind: "tribunal",
    confidence: "confirmed",
    checkedAt: CHECKED_AT,
    notes:
      "符合经济困难条件者还可申请 fee waiver；不得保证获批。",
  },
];

export const nswStateProcesses: StateProcess[] = [
  {
    id: "nsw-process-rbo-check",
    state: "NSW",
    stage: "bond-authority",
    agency: "Rental Bonds Online / NSW Fair Trading",
    summaryZh:
      "先核对押金记录；没有收到确认邮件只能作为核实信号，不能单独证明违法未存管。",
    stepsZh: [
      "登录 Rental Bonds Online 查看 bond 记录和通知。",
      "核对付款对象、付款日期及是否分期，再判断是否可能超过 s 162 的适用期限。",
    ],
    sourceUrl:
      "https://www.nsw.gov.au/housing-and-construction/renting-a-place-to-live/residential-rental-bonds/rental-bonds-online-for-tenants",
    sourceKind: "regulator-guidance",
    confidence: "confirmed",
    checkedAt: CHECKED_AT,
    phone: "1800 990 724",
  },
  {
    id: "nsw-process-rbo-claim",
    state: "NSW",
    stage: "bond-authority",
    agency: "Rental Bonds Online / NSW Fair Trading",
    summaryZh:
      "租客可先发起退款；收到单方 Notice of Claim 后，普通交涉不会暂停付款。",
    stepsZh: [
      "租约结束后可通过 RBO 单独或共同发起 bond claim。",
      "如不同意单方 claim，在 Notice 所示 14 天内向 NCAT 申请。",
      "在 due-for-payment 前登录 RBO 标记已提出争议；纸本 bond 按 Notice 回执办理，以冻结押金。",
    ],
    sourceUrl:
      "https://www.nsw.gov.au/housing-and-construction/renting-a-place-to-live/residential-rental-bonds/dealing-bond-disputes-for-tenants",
    sourceKind: "regulator-guidance",
    confidence: "confirmed",
    checkedAt: CHECKED_AT,
    timeLimitZh:
      "单方 claim 通知通常为 14 天，以实际 Notice 为准；bond 已支付后的 s 175 后备窗口为 6 个月。",
  },
  {
    id: "nsw-process-fair-trading",
    state: "NSW",
    stage: "consumer-agency",
    agency: "NSW Fair Trading",
    summaryZh:
      "可协助提供信息和沟通，但普通投诉不能替代 NCAT 程序或暂停紧急 bond 时限。",
    stepsZh: [
      "保存 condition report、照片、报价/发票、RBO 通知和完整沟通记录。",
      "通过 real estate enquiry/complaint 表单求助。",
    ],
    sourceUrl:
      "https://www.cas.fairtrading.nsw.gov.au/icmspublicweb/forms/RealEstateEnquiry.html",
    sourceKind: "regulator-guidance",
    confidence: "confirmed",
    checkedAt: CHECKED_AT,
    phone: "13 32 20",
  },
  {
    id: "nsw-process-ncat",
    state: "NSW",
    stage: "tribunal",
    agency: "NCAT Housing and Property",
    summaryZh:
      "申请具有约束力的 tenancy/bond order；准备 condition report、照片、往来记录、金额凭证及 Notice of Claim。",
    stepsZh: [
      "按 Notice 的紧急期限在线或书面提交 tenancy application。",
      "提交后按 RBO/Notice 要求通知 Fair Trading，以保护尚未支付的 bond。",
    ],
    sourceUrl:
      "https://ncat.nsw.gov.au/case-types/housing-and-property/tenancy/tenancy-and-social-housing-orders.html",
    sourceKind: "tribunal",
    confidence: "confirmed",
    checkedAt: CHECKED_AT,
    feeZh:
      "自 2026-07-01 起个人标准 $64、reduced $16、corporation $128；费用会调整，提交前复核。",
    timeLimitZh:
      "Notice of Claim 通常 14 天；bond 已支付后的 s 175 application window 为 6 个月。",
    phone: "1300 006 228",
  },
];
