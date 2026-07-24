# 03 · AI 分析 + 三件套 + PDF（任务 4 · 5h）

> 母文档 §3.4-3.5。产品的核心交付物，截图/视频的全部高光都在这。

## 分析（`/api/analyze`，强模型）

- 输入：`CaseInput` + 证据图片 + 按州注入的法条资料（`data/legal/`，只注入 confirmed 条目 + 与 disputeTypes 匹配的 topic）
- **三板斧写死进 prompt**：① 损伤是否原已存在（对照入住 condition report）② 合同是否真有此义务 ③ 是否属 fair wear and tear
- **诚实条款写死进 prompt**：房东占理时必须判「✅合法，别争」并解释原因；拖欠租金抵扣默认倾向房东占理，除非证据显示例外
- UI：进度动画（按三板斧分阶段展示分析步骤），**不是聊天气泡**；失败给体面降级提示 + 重试按钮

## 输出契约（`lib/types.ts`，structured output + zod 校验）

```ts
type AnalysisResult = {
  items: {
    description: string; amount?: number
    verdict: 'unlawful' | 'lawful' | 'doubtful'      // ❌ / ✅ / ⚠️
    reasoning_zh: string                              // 给评估卡的中文解释
    statuteRefs: { act: string; section: string }[]   // 只允许引用注入的 confirmed 法条
  }[]
  bondAlert: boolean          // bondLodged ≠ yes 时为 true
  letterEn: string            // 正式英文维权信初稿
  letterZhNotes: string       // 中文对照解释（UI 展示，不进 PDF）
  winRate: 'high'|'medium'|'low'   // 评估卡顶部总观感
}
```

## 三件套 UI

1. **胜算评估卡**：逐项 ✅/❌/⚠️ + 法条编号 + 中文解释；`bondAlert` 时顶部**红色警报**：「押金可能未合法存管，此为违法行为，是你最强谈判筹码」
2. **英文维权信**：textarea 可编辑；「下载 PDF」（前端生成，英文正文，标准信件排版）；「复制全文」按钮（微信内置浏览器下载受限的兜底）；`bondAlert` 时信中必须包含未存管段落
3. **行动路线图**：按州从 `data/legal/` 机构数据**确定性组装**（Fair Trading/CAV → NCAT/VCAT 路径、费用、时限），LLM 只填个性化建议；含邮件留证话术模板（「正如我们电话中沟通的…」）与抢先向 RTBA/RBO 发起 claim 的指引

## 验收标准

- [ ] 端到端：向导填完 → 30-60s 内出三件套（部署环境，非本地）
- [ ] 评估卡引用的法条编号全部来自注入资料，无凭空捏造（抽查 3 个 case）
- [ ] 「拖欠租金抵扣」类 case 能诚实输出「合法别争」
- [ ] `bondLodged: 'no'` → 红警 + 信中含未存管段落
- [ ] PDF 在 iPhone Safari 与桌面 Chrome 均可下载打开；微信内可复制全文
- [ ] API 失败 → 降级提示可重试，不白屏

## 不做

- 结果持久化/分享链接（无数据库）；流式输出（进度动画分阶段即可，实现从简）
