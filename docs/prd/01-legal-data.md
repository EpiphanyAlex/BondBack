# 01 · NSW/VIC 法条结构化资料（任务 2 · 3h）

> 母文档 §8。**最大翻车点 = 引用错法条。宁缺毋错。**可与 02 并行（研究型 agent 后台跑，人工抽查收口）。
>
> 状态：**✅ 研究、关键条款复核与结构化已完成（2026-07-24）**。研究底稿见
> [`docs/research/legal-nsw-vic.md`](../research/legal-nsw-vic.md)。

## 范围

产出 `data/legal/nsw.ts` 与 `data/legal/vic.ts`，并由
`data/legal/index.ts` 汇总导出，按州覆盖：

1. 押金存管义务与期限（NSW → RBO / VIC → RTBA）、未存管罚则
2. 退租后 claim 流程与双方时限（含租客抢先发起 claim 的程序）
3. 仲裁申请费用与时限（NSW → NCAT / VIC → VCAT）
4. "reasonably clean" 标准
5. fair wear and tear 定义与常见判例口径
6. condition report 规则（3-7 天窗口）
7. 行动路线图所需机构信息：Fair Trading NSW / Consumer Affairs Victoria 投诉路径、联系方式
8. 高频专业清洁条款、VIC Portable Rental Bond Scheme，以及已立法但未来生效规则的日期门控

## 数据结构

共享类型以 `data/legal/types.ts` 为准。法条和行动路线图资料分开：

### 法条 `LegalClause`

```
- id / state
- topics: 与 CaseInput.disputeTypes 共用的主题标签；通用条目用 all
- ruleZh: 规则的中文概括（写给 prompt 和 UI 用）
- act: 法案名（如 Residential Tenancies Act 2010 (NSW)）
- section: 条款号（如 s 159）
- quote: 关键原文引用（英文）
- sourceUrl: 官方来源 URL
- confidence: confirmed / unverified（存疑条目不得进入维权信引用）
- checkedAt: 最后一次人工核对日期
- effectiveFrom / effectiveTo: 可选生效区间（未来规则在生效前不得进入 prompt）
```

`topics` 只能使用：
`cleaning / damage / early-termination / bond / rent-arrears / other / all`。

### 行动路线图 `StateProcess`

机构办理流程、费用、时限、联系方式不能伪装成法条，单独存为：

```
- id / state / stage / agency
- summaryZh / stepsZh
- feeZh / timeLimitZh / phone（按需）
- sourceUrl
- sourceKind
- confidence
- checkedAt
- effectiveFrom / effectiveTo（可选生效区间）
```

## 来源白名单与确认规则

Fair Trading NSW · Consumer Affairs Victoria · RTBA · NCAT · VCAT · tenants.org.au · tenantsvic.org.au · 州立法数据库（legislation.nsw.gov.au / legislation.vic.gov.au）

- `act + section + quote` 必须以州立法数据库原文为依据。
- 机构流程、费用、期限优先使用对应政府机构、RTBA/RBO、NCAT/VCAT 页面。
- tenants.org.au / tenantsvic.org.au 只作解释和交叉核对，不能单独支撑 `confirmed` 法条。
- 白名单内找不到可靠原始依据的“常见判例口径”宁缺毋错：省略或标
  `unverified`，本轮不扩展到新来源。

## 验收标准

- [x] 每条法条有 act + section + quote + sourceUrl，任一缺失即标 `unverified`
- [x] 覆盖上述 7 类条目 × 2 州
- [x] 存疑条目显式标注且被 confirmed-only selector 排除
- [x] `stateProcesses` 覆盖 RBO/RTBA → Fair Trading/CAV → NCAT/VCAT 路线
- [x] **关键条款（存管期限、claim 时限、仲裁费用）已按现行授权法案、规章及官方程序页复核并标 confirmed**
- [x] 未来生效规则通过 `effectiveFrom` 与 confirmed-only selector 双重过滤

## 不做

- 向量库 / RAG（母文档已决策：按州直接塞 prompt）
- NSW/VIC 以外的州
