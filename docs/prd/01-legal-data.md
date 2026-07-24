# 01 · NSW/VIC 法条结构化资料（任务 2 · 3h）

> 母文档 §8。**最大翻车点 = 引用错法条。宁缺毋错。**可与 02 并行（研究型 agent 后台跑，人工抽查收口）。

## 范围

产出 `data/legal/nsw.md` 与 `data/legal/vic.md`（或 JSON，以 prompt 注入友好为准），按州覆盖：

1. 押金存管义务与期限（NSW → RBO / VIC → RTBA）、未存管罚则
2. 退租后 claim 流程与双方时限（含租客抢先发起 claim 的程序）
3. 仲裁申请费用与时限（NSW → NCAT / VIC → VCAT）
4. "reasonably clean" 标准
5. fair wear and tear 定义与常见判例口径
6. condition report 规则（3-7 天窗口）
7. 行动路线图所需机构信息：Fair Trading NSW / Consumer Affairs Victoria 投诉路径、联系方式

## 数据结构（每条目）

```
- topic: 主题标签（供 prompt 按纠纷类型筛选）
- rule: 规则的中文概括（写给 prompt 和 UI 用）
- statute: 法案名 + 条款号（如 Residential Tenancies Act 2010 (NSW) s 159）
- quote: 关键原文引用（英文）
- source_url: 官方来源 URL
- confidence: confirmed / 存疑（存疑条目不得进入维权信引用）
```

## 来源白名单（只允许这些）

Fair Trading NSW · Consumer Affairs Victoria · RTBA · NCAT · VCAT · tenants.org.au · tenantsvic.org.au · 州立法数据库（legislation.nsw.gov.au / legislation.vic.gov.au）

## 验收标准

- [ ] 每条目有 statute + quote + source_url，三者缺一即标「存疑」
- [ ] 覆盖上述 7 类条目 × 2 州
- [ ] 存疑条目显式标注且被 prompt 层排除在「具体法条编号」输出之外
- [ ] **关键条款（存管期限、claim 时限、仲裁费用）由用户抽查确认**后方可标 confirmed

## 不做

- 向量库 / RAG（母文档已决策：按州直接塞 prompt）
- NSW/VIC 以外的州
