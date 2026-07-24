# NSW / VIC 租赁押金法条研究底稿

> 任务 2 研究记录。核对日期：**2026-07-24（Australia/Melbourne）**。
> 本文用于产品、prompt 和人工复核，不构成法律意见。法律与费用会变化；正式提交 claim 或仲裁申请前应再次核对官方页面。

## 1. 研究方法与采用标准

### 1.1 来源层级

1. 州立法数据库中的现行法案、规章和授权合订本；
2. Fair Trading NSW、Consumer Affairs Victoria、RTBA、NCAT、VCAT 的程序页面和表格；
3. tenants.org.au、tenantsvic.org.au 用于解释实际举证口径、折旧因素及查找判例线索；
4. 搜索结果摘要只用于定位，不作为结构化条目的最终依据。

产品中的每条 `LegalClause` 必须同时有法条/规则名称、短引文、来源 URL、核对日期和置信状态。联系电话、行动步骤和程序警告放在独立的 `StateProcess` 中，避免伪装成法条。

### 1.2 `confirmed` 与 `unverified`

- `confirmed`：已在白名单的一手或允许的二手来源中完成交叉核对，可供产品使用。
- `unverified`：来源冲突、适用范围或程序仍有实质不确定，默认 selector 不会将其注入 prompt；不能用它表示“只是还没走形式确认”。
- 已立法但未来生效的 `confirmed` 条目必须设置 `effectiveFrom`；selector 同时检查置信度与生效区间。
- 若官方指引与现行授权法案冲突，以授权法案为结构化规则，同时完整记录冲突，不静默抹平。

### 1.3 四种期限必须分开

产品不得把下列概念都写成“14 天”：

| 期限 | 解决的问题 |
|---|---|
| 押金存管期限 | 房东/中介最迟何时把收到的 bond 交给押金机构 |
| provider 发起索赔的期限 | 房东要从 bond 中取得款项时，何时必须启动程序 |
| 单方 claim 通知的争议期限 | 另一方收到通知后，最迟何时让 claim 进入正式争议程序 |
| tribunal 后备申请期限 | bond 已经支付或常规期限已过后，是否仍有法定申请窗口 |

---

## 2. NSW 研究结论

### 2.1 存管义务、期限与罚则

现行 [Residential Tenancies Act 2010 (NSW)](https://legislation.nsw.gov.au/view/whole/html/inforce/current/act-2010-042#sec.162) s 162 不是统一的“收到后 10 天”：

- 房东或其他非代理收款人：bond 支付后 **10 business days**；
- 代理：bond 支付所在月份结束后 **10 business days**；
- 分期 bond 若在首期后 3 个月内付清：付清后 **10 business days**；
- 若首期后 3 个月仍未付清：首三个月内的 instalments 在“首期后 3 个月”或“各期后 10 business days”两者较晚时存管；其后每 **3 个月**存管一次直至付清；
- 未按 s 162 存管的最高罚则为 **20 penalty units**。

产品影响：

- 用户选择“直接付给房东”“付给中介”或“直接通过 RBO 支付”会改变是否适用转交义务和计算起点；
- 必须询问是否分期、首期日、付清日和可得的分期日期，不能把 s 162(3) 套到 s 162(4)；
- 没有 RBO 邮件不足以证明未存管，第一步应核对 RBO 记录；
- “最高 20 penalty units”是刑事/监管最高罚则，不是自动付给租客的赔偿，也不能当作已确定的谈判金额。

### 2.2 退款 claim、租客先发起及争议

[Act ss 163–168](https://legislation.nsw.gov.au/view/whole/html/inforce/current/act-2010-042#sec.163) 建立了以下流程：

1. 租约终止后，租客、房东或双方可提出 bond claim；租客不必等房东。
2. 一方单独提出时，押金机构向其他方发 Notice of Claim。
3. 不同意的一方须在通知规定的 **14 天**内证明 claim 已进入 NCAT 或法院程序，否则押金可按先提交的 claim 支付。
4. 房东单独索赔须在提出 claim 后 **7 天**内给租客退租 condition report，以及估价、报价、发票或收据。
5. s 166 的项目包括欠租或其他到期费用、非 fair wear and tear 的合理修复/恢复费、考虑入住时状况后的合理清洁费，以及未经同意改动锁具/安全装置的合理更换费；该条明确不是穷尽清单。

[NSW Fair Trading 当前的 RBO 租客页面](https://www.nsw.gov.au/housing-and-construction/renting-a-place-to-live/residential-rental-bonds/rental-bonds-online-for-tenants)及[押金争议页面](https://www.nsw.gov.au/housing-and-construction/renting-a-place-to-live/residential-rental-bonds/dealing-bond-disputes-for-tenants)进一步说明：

- RBO 中的 bond 应在线 claim；
- 单方 claim 会触发 Notice of Claim；
- 若 14 天内没有按程序提出 NCAT dispute 并在 due-for-payment 前通知 Fair Trading，先到的 claim 可被处理；
- 双方同意时通常可更快直接退款。
- 官方列出的常见 claim 例子还包括依法成立的 break fee、未归还钥匙/安全装置，以及符合条件的未付水费；任何项目仍须证明责任与金额。

产品影响：

- “先 claim”是合法程序优势，但文案不能保证必胜；
- 收到 Notice 后，普通投诉、邮件交涉或等待 agent 回复不能被描述为会自动暂停 14 天；
- 路线图应优先显示“申请 NCAT + 按 Notice 通知 bond authority”，投诉协助放在后面。

### 2.3 NCAT 费用与申请时限

[Residential Tenancies Regulation 2019 (NSW) cl 39(8)](https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0629#sec.39) 规定：依据 Act s 175 申请 bond payment order，应在 bond 被支付后 **6 个月**内提出。[NCAT tenancy orders 页面](https://ncat.nsw.gov.au/case-types/housing-and-property/tenancy/tenancy-and-social-housing-orders.html) 也列出这一期限。

这 6 个月是 bond 已支付后的后备窗口，不能替代 Notice of Claim 的紧急 14 天。

[NCAT fee schedule](https://ncat.nsw.gov.au/forms-and-fees/fees-at-ncat.html)（updated 26 June 2026）列出的自 2026-07-01 起 residential proceedings 费用：

| 申请人 | 费用 |
|---|---:|
| 个人标准费 | $64 |
| 符合资格的 reduced fee | $16 |
| Corporation | $128 |

费用会调整；产品必须显示核对日期，不能永久硬编码成无日期事实。

符合资格者可申请 reduced fee；若付款会造成严重经济困难，还可按 NCAT 程序申请 fee waiver。路线图应提示但不得保证获批。

### 2.4 “Reasonably clean”

[Act s 51(2)(a), (3)(c)](https://legislation.nsw.gov.au/view/whole/html/inforce/current/act-2010-042#sec.51) 要求租客保持并在退租时留下“reasonable state of cleanliness”，且必须考虑租约开始时的状态。

因此：

- 标准是合理清洁，不是绝对 spotless；
- 不能不看入住 condition report 就要求比入住时更干净；
- 清洁 claim 仍需证明实际不合理清洁、所做工作与金额合理；
- “房东偏好专业清洁”本身不等于租客法定义务。

### 2.5 专业清洁和熏蒸条款

[Act s 19](https://legislation.nsw.gov.au/view/whole/html/inforce/current/act-2010-042#sec.19) 及 [NSW Fair Trading 的 tenancy agreement 指引](https://www.nsw.gov.au/housing-and-construction/rules/residential-tenancy-agreements)禁止笼统加入退租专业地毯清洁、付费清洁或专业熏蒸条款。

受限例外是 landlord 已同意室内饲养宠物，且专业地毯清洁对该宠物类型属合理；专业熏蒸还要求宠物属于 mammal。产品须分开判断：

1. lease 中的专业清洁附加条款是否依法有效；
2. 即使条款无效，租客是否仍未履行 s 51 的 reasonably clean 义务；
3. 实际清洁工作、范围和金额是否必要且有证据支持。

### 2.6 Fair wear and tear 与判例口径

[Act s 51(3)(b)](https://legislation.nsw.gov.au/view/whole/html/inforce/current/act-2010-042#sec.51) 将 fair wear and tear 排除在租客恢复义务之外。[Residential Tenancies Regulation 2019 Sch 2 的标准 condition report](https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0629#sch.2) 将其解释为 ordinary use 产生的变化，并排除故意或疏忽损坏。

[Tenants’ Union of NSW Bond Kit](https://www.tenants.org.au/resource/bond-kit) 汇总的实务判断因素：

- 入住时原状和物品年龄；
- 租期长度、正常居住人数和普通使用强度；
- 自然老化与具体损坏之间的因果关系；
- 折旧和剩余使用寿命，房东通常不能“new for old”；
- 房东是否合理减损、修复是否必要、报价/收据是否支持金额。

该资料列出的判例线索包括：

- *Alamdo Holdings Pty Limited v Australian Window Furnishings (NSW) Pty Ltd* [2006] NSWCA 224；
- *Graham, Caste, Pilonchery v French (Tenancy)* [2013] NSWCTTT 15；
- *Panico v Crompton/Jennings* [2015] NSWCATAP 110；
- *Welch v Luke; Luke v Welch* [2019] NSWCATCD 72；
- *Vasales v Li* [2021] NSWCATAP 295。

这些名称目前只作为二手研究线索保留：本任务白名单不包含 AustLII/CaseLaw，尚未逐份核对裁判全文和适用上下文，故**不作为 confirmed 法条注入维权信**。产品可安全使用的概括是：没有固定年限或划痕尺寸的亮线规则；原状、年龄、普通使用、因果关系、折旧与金额证据共同决定。

### 2.7 Condition report

[Act s 29](https://legislation.nsw.gov.au/view/whole/html/inforce/current/act-2010-042#sec.29)：

- 房东在租客签约前或签约时提供已填写并签署的报告；
- 纸本为两份，电子交付可为一份；
- 租客在取得房屋占有后 **7 天**内填写并返还一份；
- 退租 report 应在终止时或终止后尽快共同完成，房东须给租客合理到场机会。

[Act s 30](https://legislation.nsw.gov.au/view/whole/html/inforce/current/act-2010-042#sec.30) 对双方签署报告给予正确性推定，但允许相反证据和法定例外。照片、视频、时间戳、维修邮件和租客在报告上的批注仍然重要。

### 2.8 NSW 行动机构

| 机构 | 适用动作 | 联系 |
|---|---|---|
| Rental Bonds Online / Fair Trading | 核对存管、发起或回应 bond claim | [RBO for tenants](https://www.nsw.gov.au/housing-and-construction/renting-a-place-to-live/residential-rental-bonds/rental-bonds-online-for-tenants) |
| NSW Fair Trading | real estate/renting 咨询与投诉协助 | [在线表单](https://www.cas.fairtrading.nsw.gov.au/icmspublicweb/forms/RealEstateEnquiry.html)；13 32 20 |
| NCAT Housing and Property | 请求具有约束力的 tenancy/bond orders | [申请与 orders](https://ncat.nsw.gov.au/case-types/housing-and-property/tenancy/tenancy-and-social-housing-orders.html)；1300 006 228 |

建议产品路线：

1. 保存 RBO 记录、condition report、照片、发票/报价和通信；
2. 先核对存管并发起/回应 bond claim；
3. 收到单方 claim Notice 时优先保护 14 天程序期限；
4. Fair Trading 可协助沟通，但最终 bond order 通常由 NCAT 作出。

### 2.9 当前运营变化与未来 rollout

- 自 2025-07-01 起，landlord/agent 在 RBO 发起首次 bond release/claim 后须在 14 天内完成 end-of-tenancy survey。该义务不替代也不延长租客 Notice of Claim 的紧急期限，故只作为 landlord-side 流程说明。[NSW Fair Trading 变更说明](https://www.nsw.gov.au/departments-and-agencies/fair-trading/news/changes-to-rental-laws)
- [Smart Rental Bonds](https://www.nsw.gov.au/housing-and-construction/renting-a-place-to-live/residential-rental-bonds/smart-rental-bonds) 截至本次核对仍是分阶段 rollout：2026 年 8 月开始在部分地区推出，预计 2026 年底覆盖全州。产品不得在当前 NSW 路线图中把它显示成普遍可用；后续须按 eligible postcode/官方开通状态启用，不能仅用一个全州 `effectiveFrom`。

---

## 3. Victoria 研究结论

### 3.1 使用的法案版本

采用 Victorian legislation database 的 [Residential Tenancies Act 1997 Version 113](https://www.legislation.vic.gov.au/in-force/acts/residential-tenancies-act-1997/113)，授权合订本已纳入截至 **2026-07-01** 的修订；逐条文字来自[授权 PDF](https://content.legislation.vic.gov.au/sites/default/files/2026-07/97-109aa113-authorised.pdf)。

### 3.2 存管义务、期限与官方页面冲突

授权法案 s 406 规定：

- rental provider 收到 bond 后 **10 business days** 内交给 RTBA；
- 违反最高可罚 **150 penalty units**。

s 409 规定：租客交付 bond 后 **15 business days** 仍未收到 RTBA receipt，可通知 RTBA。

发现的冲突：

- CAV 某些 bond lodging 页面/摘要出现“14 days”；
- 截至 2026-07-01 的授权法案 s 406 明文仍是 “10 business days”；
- 其他 CAV 租客资料也有“10 business days”的表述。

处理决定：

- 结构化规则采用授权法案的 **10 business days**；
- CAV 的 14 days 不进入维权信；
- 冲突保留在 notes 中，避免后续维护时被旧摘要覆盖；
- 产品只提示“可能未存管，请向 RTBA 核实”，不能用“未收到邮件”直接判定违法。

最高 150 penalty units 同样是法定最高罚则，不是租客自动获得的赔偿。

自新版 RTBA 流程上线后，renter 可按流程直接向 RTBA 支付 bond。产品必须记录 `paidTo`：若钱直接付给 RTBA，不能用 s 406 的“provider 收款后未转交”逻辑制造红警。[CAV lodging 指引](https://www.consumer.vic.gov.au/housing/renting/rent-bond-bills-and-condition-reports/bond/lodging-the-bond-with-the-rtba)

### 3.3 退款 claim、租客先发起及争议

授权法案 ss 411–411AD：

1. 租客、代理或 provider 可申请 RTBA repayment；
2. 租客可单独发起；provider 单独申请时只能要求付款给租客，若要取得 bond 通常需共同申请或进入争议程序；
3. 一方单独 claim 后，RTBA 通知其他方；
4. 其他方收到通知后 **14 天**内须让 RTBA 知道 claim 已成为法定申请的对象，否则 RTBA 可按 claim 支付；
5. 可主张项目包括欠租或其他到期费用、考虑 fair wear and tear 后的合理修复/恢复费、考虑入住状态后的合理清洁费，以及未经同意改动锁具/安全装置的合理更换费。

[CAV renter-initiated claim 指引](https://www.consumer.vic.gov.au/housing/renting/rent-bond-bills-and-condition-reports/bond/starting-or-contesting-a-bond-claim-initiated-by-a-renter) 说明：

- bond 上列名的 renter 可在租约结束后发起；
- RTBA 向其他方发送通知；
- 通常有 14 天 contest；没有 email 而采用邮寄时，操作流程可能显示 20 天；
- 所有人同意可更早退款，否则期限结束且无人正式 contest 后付款。

产品应以用户实际收到的 RTBA notice 所列日期为第一优先，不能自己把邮寄规则转换成保证性 deadline。

### 3.4 RDRV / VCAT、费用与时限

授权法案 s 419A：

- 有利害关系的一方可申请 VCAT 决定 bond repayment；
- 申请须在 rental agreement 终止后 **14 天**内提出；
- VCAT 可在 bond 金额范围内作出支付命令。

[Tenants Victoria 的 dispute 指引](https://tenantsvic.org.au/explore-topics/issues-with-your-landlord/disputing-bond-and-compensation-claims/private-rental/) 提醒，迟交者可能请求延长期限，但是否准许不是自动结果，产品不得承诺延期。

[CAV dispute resolution 路线](https://www.consumer.vic.gov.au/housing/renting/legal-and-dispute-support/resolving-disputes)说明 RDRV 是 VCAT 的免费、digital-first 服务，可处理包括 bond 在内的租赁争议：

1. 了解权利并书面与 provider/agent 沟通；
2. 需要时联系 CAV；
3. 通过 Rental Dispute Resolution Victoria（RDRV）；
4. 无法解决时进入 VCAT。

对于 renter-initiated RTBA claim，正式 contest 不是“联系过 RDRV/VCAT”即可：须提出 bond application，并把有效 reference number 填入 RTBA transaction；RTBA 会在 response period 结束时复核 reference。[CAV renter-initiated claim 指引](https://www.consumer.vic.gov.au/housing/renting/rent-bond-bills-and-condition-reports/bond/starting-or-contesting-a-bond-claim-initiated-by-a-renter)

费用研究采用 2026-06-27 生效的 [Victorian Civil and Administrative Tribunal (Fees) Regulations 2026](https://www.legislation.vic.gov.au/as-made/statutory-rules/victorian-civil-and-administrative-tribunal-fees-regulations-2026)。Sch 2 Pt 1 Table 5 item 20 对 Residential Tenancies Act 1997 **Part 10** proceedings 规定 **No fee**。s 419A 位于 Part 10，因此单纯 bond repayment proceeding 的结构化费用是 $0。

注意：

- 若案件混合 compensation 或其他不同性质请求，不能不看实际 application category 就保证全部免费；
- 旧 VCAT 网页或旧费用表可能过时，应以 2026 Regulations 和提交当日 VCAT 分类为准。

### 3.5 “Reasonably clean”

授权法案 s 63 要求租客：

- 租期中保持 reasonably clean（provider 负责的事项除外）；
- 退租时在切实可行范围内留下 reasonably clean、接近入住时的状态，并考虑 fair wear and tear。

[Tenants Victoria 对 CAV Guidelines 的总结](https://tenantsvic.org.au/explore-topics/issues-with-your-landlord/consumer-affairs-victoria-guidelines/) 将 reasonably clean 解释为普通社区标准下既非 spotless 也非 messy，须结合房屋性质、年龄和具体情况，且不应要求比入住时更干净。

产品影响：

- 不自动接受“必须 professional clean”；
- 是否须专业清洁还应核对租约条款及 Act s 27C 的严格条件；
- 即使确有清洁不足，也只能主张合理、必要并有证据支持的费用。

### 3.6 专业清洁条款

[Act s 27C](https://content.legislation.vic.gov.au/sites/default/files/2026-07/97-109aa113-authorised.pdf) 与现行 [Residential Tenancies Regulations 2021 reg 12](https://content.legislation.vic.gov.au/sites/default/files/2026-06/21-3sra009-authorised.pdf) 规定 provider 不得默认要求专业清洁，除非：

1. 入住前刚完成专业清洁或 professional-standard cleaning，并已告知 renter；或
2. 专业清洁确有必要把房屋恢复至入住前状态，且须结合 condition report、排除 fair wear and tear。

第二项同时限制租客实际承担清洁或费用的义务。产品不得只看到 lease 中出现 “professional clean” 就判 provider 胜；还须核对入住前清洁及通知证据，或恢复原状的实际必要性。

### 3.7 Fair wear and tear

授权法案 s 3(1) 明确定义为：

- renter 或 visitor 对房屋/物品的合理使用造成的 deterioration；以及
- natural environmental forces 造成的 deterioration。

s 61、s 63 和 s 411AB 将该概念用于损坏、退租状态和 bond claim。CAV 的 [bond claims and refunds](https://www.consumer.vic.gov.au/housing/renting/rent-bond-bills-and-condition-reports/bond/bond-claims-and-refunds) 用褪色窗帘、正常磨损的台面，与撕裂或破损作对比。

实务口径仍不是“看到变化就扣押金”。应综合：

- 入住 condition report；
- 物品年龄和预计寿命；
- 租期、合理使用与自然老化；
- 损坏的因果关系；
- 折旧、实际损失、修复必要性和凭证。

### 3.8 Condition report

授权法案 s 35：

- 入住前 provider 提供两份已签署报告，电子版视为两份；
- renter 在入住后 **5 business days** 内返还；
- 若 provider 未给，renter 可自行完成并在法定窗口内交给 provider；
- 退租 report 在终止后 **10 days** 内完成，并让 renter 有合理机会到场。

s 36 使双方签署报告成为入住时维修和一般状态的强证据，但仍有法定例外。产品应鼓励逐项批注、上传有时间信息的照片/视频，并保留发送证明。

### 3.9 Victoria 行动机构

| 机构 | 适用动作 | 联系 |
|---|---|---|
| RTBA | 核对 receipt/存管、发起或回应 bond claim | [Bond 入口](https://www.consumer.vic.gov.au/housing/renting/rent-bond-bills-and-condition-reports/bond)；1300 137 164 |
| Consumer Affairs Victoria | 权利信息、租赁投诉与早期协助 | [Residential accommodation complaint](https://www.consumer.vic.gov.au/contact-us/resolve-your-problem/residential-accommodation-complaint)；1300 55 81 81 |
| RDRV | 免费租赁争议解决入口 | [Resolving disputes](https://www.consumer.vic.gov.au/housing/renting/legal-and-dispute-support/resolving-disputes)；1300 017 378 |
| VCAT Residential Tenancies | 法定命令和未解决争议 | [VCAT Residential Tenancies](https://www.vcat.vic.gov.au/case-types/residential-tenancies)；1300 01 8228 |

建议产品路线：

1. 核对 RTBA receipt/记录；
2. 保存 condition reports、照片、报价/发票和往来记录；
3. 可由 renter 主动发起 RTBA claim；
4. 收到 claim notice 时，以 notice 的 contest date 为最高优先级；
5. 通过 RDRV/VCAT 正式争议，并按通知要求告知 RTBA；
6. CAV 一般投诉可并行，但不能表述为会自动停止 bond 支付。

### 3.10 Portable Rental Bond Scheme（现已生效）

[Portable Rental Bond Scheme](https://www.vic.gov.au/about-portable-rental-bond-scheme) 自 **2026-07-01** 起可用，属于自愿参加的 transfer 机制，申请费 **$25**。核心条件包括：

- 旧 bond 仍由 RTBA 持有、未被 claim、未暂停且没有 pending transaction；
- 新旧 bond 列有相同 renters，且两处 property 都在 Victoria；
- 所有 renters 同意 terms；不适用于分开搬家的 share-house renters、rooming house、caravan park、Part 4A dwelling、Homes Victoria loan bond 或欠此前 transfer debt 的 renter。

转移并不会消灭旧 provider 的 claim 权。旧 claim 成功时，州政府可代为付款，金额随后成为 renter 欠 State 的债务；标准还款期为 8 周，经济困难者可申请 payment plan。产品路线图必须同时说明这一后果，不能只展示“免垫新押金”。

### 3.11 已立法、2026-10-13 生效的证据规则

[Consumer Legislation Amendment Act 2025 (Vic) ss 9–11](https://content.legislation.vic.gov.au/sites/default/files/2025-11/25-046aa-authorised.pdf) 将从 **2026-10-13** 起强化 provider/agent 的 bond claim 证据义务：

- 要求 bond 支付给 provider 的 RTBA claim，至少提前 3 天向每名 renter 提供 bond claim evidence；
- provider/agent 的 s 419A application 须随附支持材料；
- evidence 包括 invoice、receipt、quote、photograph 及规定材料，并不得与 condition report 冲突。

该规则已作为 `confirmed` 数据写入，但带 `effectiveFrom: "2026-10-13"`；当前日期调用 selector 时不会注入 prompt。

---

## 4. 跨州产品规则

### 4.1 可以直接表达

- “你可以先发起 bond claim”，但同时说明对方仍可正式争议；
- “合理清洁不等于 spotless”，并结合入住 condition report；
- “合理损耗不由租客承担”，但要区分疏忽/故意损坏；
- “索赔金额需要证据，并应考虑折旧和实际损失”；
- “未收到存管确认是风险信号，请先向 RBO/RTBA 核实”。

### 4.2 禁止表达

- 只因没有邮件就断言房东已违法；
- 把最高 penalty units 写成租客应获赔金额；
- 把 Notice 的 contest 时限与 tribunal 后备申请期混为一谈；
- 保证投诉会暂停 bond 支付；
- 保证专业清洁总是必须或总是不必；
- 给 fair wear and tear 编造固定年限、百分比或划痕尺寸；
- 把 `unverified` 或尚未到 `effectiveFrom` 的条目作为当前法条注入维权信。

### 4.3 Prompt 注入

`data/legal/index.ts` 提供：

- `getConfirmedLegalClauses(state, topics)`；
- `getConfirmedStateProcesses(state)`。

两个 selector 均可接收 `asOf`，默认使用 NSW/VIC 对应辖区时区的当前 ISO 日期，同时过滤 `confidence`、`effectiveFrom` 和 `effectiveTo`。prompt 和 UI 只能通过这些入口取数据；不得直接把完整数组序列化给模型，否则会绕开置信度与生效日期门。

---

## 5. 关键条款复核记录

以下条目已于 2026-07-24 按“条号 + 授权文本 + 数值 + 官方程序页面”复核，结构化数据已升级为 `confirmed`。

### NSW

- [x] [Act s 162](https://legislation.nsw.gov.au/view/whole/html/inforce/current/act-2010-042#sec.162)：一次性非中介 10 business days；中介为月末后 10 business days；分期按 s 162(4) 的 3 个月周期；max 20 penalty units。
- [x] [Act s 164](https://legislation.nsw.gov.au/view/whole/html/inforce/current/act-2010-042#sec.164)：单方 claim notice 的 14 天正式争议要求。
- [x] [Regulation cl 39(8)](https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0629#sec.39)：bond paid out 后 6 个月的 s 175 application window。
- [x] [NCAT fees](https://ncat.nsw.gov.au/forms-and-fees/fees-at-ncat.html)：2026-07-01 起个人 $64、reduced $16、corporation $128。

### Victoria

- [x] [Act Version 113, s 406](https://content.legislation.vic.gov.au/sites/default/files/2026-07/97-109aa113-authorised.pdf)：10 business days；max 150 penalty units；授权法案优先于 CAV “14 days”摘要。
- [x] 同一授权法案 ss 411A、419A：收到单方 claim notice 后 14 天；租约终止后 14 天的 bond application。
- [x] [VCAT Fees Regulations 2026 Sch 2 Pt 1 Table 5 item 20](https://content.legislation.vic.gov.au/sites/default/files/2026-06/26-070sra-authorised.pdf)：RTA Part 10 proceeding 为 No fee。

---

## 6. 来源台账

### NSW 一手来源

- [Residential Tenancies Act 2010 (NSW), current in-force HTML](https://legislation.nsw.gov.au/view/whole/html/inforce/current/act-2010-042)
- [Residential Tenancies Regulation 2019 (NSW), current in-force HTML](https://legislation.nsw.gov.au/view/whole/html/inforce/current/sl-2019-0629)
- [NSW Fair Trading — Rental Bonds Online for tenants](https://www.nsw.gov.au/housing-and-construction/renting-a-place-to-live/residential-rental-bonds/rental-bonds-online-for-tenants)
- [NSW Fair Trading — Dealing with bond disputes](https://www.nsw.gov.au/housing-and-construction/renting-a-place-to-live/residential-rental-bonds/dealing-bond-disputes-for-tenants)
- [NSW Fair Trading — Residential tenancy agreements](https://www.nsw.gov.au/housing-and-construction/rules/residential-tenancy-agreements)
- [NSW Fair Trading — Rental law changes](https://www.nsw.gov.au/departments-and-agencies/fair-trading/news/changes-to-rental-laws)
- [NSW Government — Smart Rental Bonds](https://www.nsw.gov.au/housing-and-construction/renting-a-place-to-live/residential-rental-bonds/smart-rental-bonds)
- [NSW Fair Trading — Real estate enquiry/complaint](https://www.cas.fairtrading.nsw.gov.au/icmspublicweb/forms/RealEstateEnquiry.html)
- [NCAT — Tenancy and social housing orders](https://ncat.nsw.gov.au/case-types/housing-and-property/tenancy/tenancy-and-social-housing-orders.html)
- [NCAT — Fees](https://ncat.nsw.gov.au/forms-and-fees/fees-at-ncat.html)

### NSW 允许的解释来源

- [Tenants’ Union of NSW — Bond factsheet](https://www.tenants.org.au/factsheet-bond)
- [Tenants’ Union of NSW — Bond Kit](https://www.tenants.org.au/resource/bond-kit)

### Victoria 一手来源

- [Residential Tenancies Act 1997 (Vic), Version 113 landing page](https://www.legislation.vic.gov.au/in-force/acts/residential-tenancies-act-1997/113)
- [Residential Tenancies Act 1997 (Vic), Version 113 authorised PDF](https://content.legislation.vic.gov.au/sites/default/files/2026-07/97-109aa113-authorised.pdf)
- [Residential Tenancies Regulations 2021 (Vic), Version 009 authorised PDF](https://content.legislation.vic.gov.au/sites/default/files/2026-06/21-3sra009-authorised.pdf)
- [VCAT Fees Regulations 2026 landing page](https://www.legislation.vic.gov.au/as-made/statutory-rules/victorian-civil-and-administrative-tribunal-fees-regulations-2026)
- [VCAT Fees Regulations 2026 authorised PDF](https://content.legislation.vic.gov.au/sites/default/files/2026-06/26-070sra-authorised.pdf)
- [CAV — Bond claims and refunds](https://www.consumer.vic.gov.au/housing/renting/rent-bond-bills-and-condition-reports/bond/bond-claims-and-refunds)
- [CAV — Renter-initiated bond claim](https://www.consumer.vic.gov.au/housing/renting/rent-bond-bills-and-condition-reports/bond/starting-or-contesting-a-bond-claim-initiated-by-a-renter)
- [CAV — Resolving bond disputes](https://www.consumer.vic.gov.au/housing/renting/rent-bond-bills-and-condition-reports/bond/resolving-bond-disputes)
- [CAV — Condition reports](https://www.consumer.vic.gov.au/housing/renting/rent-bond-bills-and-condition-reports/condition-reports)
- [CAV — Resolving rental disputes](https://www.consumer.vic.gov.au/housing/renting/legal-and-dispute-support/resolving-disputes)
- [CAV — Residential accommodation complaint](https://www.consumer.vic.gov.au/contact-us/resolve-your-problem/residential-accommodation-complaint)
- [Victorian Government — Portable Rental Bond Scheme](https://www.vic.gov.au/about-portable-rental-bond-scheme)
- [Consumer Legislation Amendment Act 2025 (Vic), authorised PDF](https://content.legislation.vic.gov.au/sites/default/files/2025-11/25-046aa-authorised.pdf)
- [VCAT — Residential Tenancies](https://www.vcat.vic.gov.au/case-types/residential-tenancies)

### Victoria 允许的解释来源

- [Tenants Victoria — Private rental bonds](https://tenantsvic.org.au/explore-topics/starting-your-tenancy/bonds/private-rental/)
- [Tenants Victoria — Disputing bond and compensation claims](https://tenantsvic.org.au/explore-topics/issues-with-your-landlord/disputing-bond-and-compensation-claims/private-rental/)
- [Tenants Victoria — Consumer Affairs Victoria guidelines](https://tenantsvic.org.au/explore-topics/issues-with-your-landlord/consumer-affairs-victoria-guidelines/)
