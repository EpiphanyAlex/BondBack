# 04a · 示例案例常量与证据原件

> 母文档 §4。**这是依赖链的起点，最先开工**：03b 需要一份 `AnalysisResult` 假数据才能开画结果页，而那份假数据正好就是示例案常量。文案要逐字手工打磨——投票者绝大多数只会看这一条路径。

## 文件所有权（并行纪律）

| 你拥有 | 你不许碰 |
|---|---|
| `data/sample-case/**` | `lib/types.ts`（前置已冻结——常量必须严格符合它） |
| `components/evidence/condition-report-doc.tsx` | `app/**`（属 02/03b/04b） |
| `components/evidence/evidence-thumb.tsx` | `app/api/**`、`lib/prompts/**`（属 03a） |
| | `app/globals.css`、`package.json`（前置已定） |

## 1. 案情数字（NSW，钉死，全文档一致）

| 项 | 值 |
|---|---|
| 押金 | **$3,560** |
| 房东索扣 | **$1,306** |
| 可争议合计 | **$1,120** |
| 应退回至少 | **$3,374**（= 3,560 − 合法的 186） |

| # | 扣款项 | 金额 | verdict | disputable | 依据 |
|---|--------|------|---------|-----------|------|
| ① | 退租专业清洁 + 地毯蒸洗 | $780 | `unlawful` ❌ | $780 | 入住报告 "Carpet: existing stains noted"（s 30 推定正确）· s 51(3)(c) 判断清洁标准须考虑入住时状况 · s 19 笼统专业洗地毯条款可能无效 |
| ② | 花园 / 草坪维护 | $340 | `doubtful` ⚠️ | $340 | 已阅读的合约页中未见园艺维护义务 · s 165 房东须 7 日内出示条款与发票/报价 |
| ③ | 未付水费 | $186 | `lawful` ✅ | $0 | s 166 明列为可从押金扣除的项目 |

三轴取值：
- ① `preExisting: 'yes'`、`contractObligation: 'exists'`（条款存在但可能无效）、`fairWearTear: 'n-a'`
- ② `preExisting: 'n-a'`、`contractObligation: 'absent'`、`fairWearTear: 'n-a'` → **因 absent 必须是 `doubtful`，不得写 `unlawful`**
- ③ 三轴均 `n-a`

押金存管：`bondPayment.paidTo = 'agent'`、`confirmationReceived = 'no'`、`lookup = { status: 'not-checked', evidence: 'none' }` → `bondLodgementAlert.level = 'verify-record'`（**黄卡**）。不做存管红警案例。

## 2. 四份证据与 7 条事实

`EvidenceFact[]` 共 **7 条**，其中 **4 条被对照卡采用**（打钩）、**3 条未用到但仍展示**（证明 AI 通读过）：

| # | 来源 (`locator`) | `quote` | 采用 |
|---|---|---|---|
| 1 | 入住报告 P3 · 客厅地毯 | `Carpet: existing stains noted` | ✅ 卡① |
| 2 | 入住报告 P1 · 签署信息 | `Tenant signed 5 Mar 2024` | ☐ |
| 3 | 入住报告 P2 · 墙面 | `Walls: good, minor scuffs` | ☐ |
| 4 | 租约 P1-P3 · 条款清单 | `已读页面中未见园艺/草坪维护义务条款` | ✅ 卡② |
| 5 | 租约 P2 · 清洁条款 | `carpets to be professionally cleaned at the end of tenancy` | ✅ 卡① |
| 6 | 聊天截图 2026-03-14 · 中介 | `garden looks fine, no need to worry` | ✅ 卡② |
| 7 | 扣款清单 · 附件栏 | `未附任何发票或报价` | ☐ |

> 事实 4 的 `quote` 是中文陈述而非英文原文——因为它记录的是**未见到**某物，没有原文可引。这是有意的，`/api/facts` 的提示词也这么要求（03a §1）。

## 3. 入住报告原件（全片高潮那一帧）

**做成可点击定位高亮的 HTML 组件**，不用 JPEG——可高亮、手机上清晰不糊、体积小、改一个数字不用重新导图。

```
┌ Ingoing Condition Report · 2024-03-02 ─────────┐
│ Room      Item     Condition   Comments        │
│ Living    Walls    Good        —                │
│ Living    Carpet   Fair        existing stains noted   ← 可高亮
│ Kitchen   Oven     Good        —                │
│ Bathroom  Grout    Fair        light staining   │
│ Garden    Lawn     Good        —                │
│ Tenant signed: 5 Mar 2024                       │
└─────────────────────────────────────────────────┘
```

- 暴露定位 API 供 03b 调用：给每行 `id`（如 `cr-living-carpet`），提供 `scrollToAndHighlight(id)` 或接受 `highlightId` prop
- 高亮用 `--color-verdict-doubtful-wash` 底 + 左侧色条，持续 `--duration-sweep`
- 其余三份（租约 / 聊天截图 / 扣款清单）做**简版缩略卡**：文件名 + 类型图标 + 关键行摘要，点击展开摘要即可，不需要完整原件

## 4. 虚构纪律（红线）

- 地址、中介名、房东名、租客名、押金号**全部虚构**，不得使用真实中介品牌或真实住址
- 建议：`12/34 Kingsford Rd, Kensington NSW 2033`、中介 `Harbourline Property`、租客 `L. Chen`、押金号 `RB-2024-118376`
- 聊天截图组件里不得出现真实微信/WhatsApp 的商标性 UI 细节，做成中性气泡即可
- **不得伪造任何真实世界凭证**（汇款单、裁决书、真实机构回函）

## 5. 导出形态

```ts
// data/sample-case/index.ts
export const SAMPLE_CASE_INPUT: CaseInput
export const SAMPLE_FACTS: EvidenceFact[]        // 7 条
export const SAMPLE_ANALYSIS: AnalysisResult     // mode: 'evidence-based'
export const SAMPLE_REPLAY_TIMELINE: ReplayBeat[] // 供 04b 重放使用（时轴见 04b）
```

`SAMPLE_ANALYSIS.ledger` 必须与 §1 的四个数字逐一对上；`letterEn` 用 03a 的拼装规则手工写出等效结果（这样 03b 用假数据时看到的就是最终形态）。

## 6. 验收标准

- [ ] 常量严格通过 `lib/types.ts` 的类型检查（`pnpm build` 无 TS 错误）
- [ ] `ledger` 六个数字与逐项金额自洽：$780 + $340 + $186 = $1,306；可争议 $1,120；应退 $3,374
- [ ] **卡② 的 `verdict` 是 `doubtful` 而非 `unlawful`**（`contractObligation: 'absent'` 纪律）
- [ ] 7 条事实中恰有 4 条被 `evidenceRefs` 引用，3 条未引用
- [ ] 所有 `statuteRefs` 的 act/section/quote **与 `data/legal/nsw.ts` 逐字一致**（复制，不重写）
- [ ] 入住报告组件的地毯那行可被外部按 id 定位并高亮
- [ ] 全部人名/地址/机构名/押金号为虚构
- [ ] `letterEn` 中的金额与法条编号与 items 完全一致
- [ ] `pnpm check:tokens` 零违规

## 7. 不做

- 重放动画本身（属 04b，本模块只提供时轴数据）
- 第二个（存管红警）示例案例
- 真实的 PDF/图片素材文件
