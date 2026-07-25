# 模块 PRD 索引

> 母文档 `docs/PRD.md` 是产品事实源（**v1.1 定稿**）。本目录把它拆成可独立开工的模块 PRD，补充验收标准与数据契约。**若与母文档冲突，以母文档为准。**执行顺序与时间轴见 `docs/plan.md`，视觉与响应式约束见 `docs/design-tokens.md`。

| # | 模块 | 依赖 | 状态 |
|---|------|------|------|
| 00 | [脚手架与首次部署](./00-foundation.md) | 无 | ✅ 完成（<https://bond-back-yanzhuo-lius-projects.vercel.app>；GitHub 自动部署已连、`OPENAI_API_KEY` 已配、Deployment Protection 已关。旧的 `bondback-six.vercel.app` 在另一个 team 下，待新链接稳定后废弃） |
| 01 | [NSW/VIC 法条资料](./01-legal-data.md) | 无 | ✅ 完成（2026-07-24 关键条款已复核） |
| — | **[Design tokens + 契约冻结（前置）](../design-tokens.md#7-前置阶段落地清单)** | 00 | ✅ 完成（2026-07-25）—— §7 四组全勾。`lib/types.ts` / `lib/ai.ts` 的**冻结已解除**：那是为并行扇出期间不打架，扇出已结束，改动同步四个模块的消费点即可 |
| 02 | [向导：上传优先返工](./02-wizard.md) | 前置 | ✅ 完成（上传优先；核对区块拆出 `StepReview`；补上 `deduction-notice` slot） |
| 03a | [分析管线与契约（服务端）](./03a-analysis-pipeline.md) | 01、前置 | ✅ 完成（真实跑通；红线由 `pnpm test:analysis` 守住） |
| 03b | [结果页 UI（对照卡/证据档/信/路线图）](./03b-result-page.md) | 04a（假数据）、前置 | ✅ 完成（组件全纯 props，04b 已复用） |
| 04a | [示例常量与证据原件](./04a-sample-data-evidence.md) | 01、前置 | ✅ 完成（7 条事实 / 4 条被采用；账本六数自洽） |
| 04b | [首页 + `/sample` 重放 + 战报卡](./04b-home-replay-share.md) | 03b、04a | ✅ 完成（断网可看；二维码逐模块验证） |
| 05 | [打磨保险](./05-polish.md) | 02、03a/b、04a/b | 🔨 进行中 —— 代码侧全勾（OG 卡片、请求体积上限、360/1280 实测、`AI_ENABLED=false` 实测）；**只剩手机 + 微信内置浏览器真机三项** |
| 06 | [~~入住留证模式~~](./06-move-in-mode.md) | — | ❌ **已取消**（v1.1 §6） |
| 07 | [传播材料与提交（封版后）](./07-submission.md) | 封版 | 待开工 |

## 并行扇出与文件所有权

v1.1 把原 03、04 各拆成两份，切口在**文件边界**上——四份工单零重叠，只在前置已冻结的 `lib/types.ts` 上相遇。

```
前置（tokens + lib/types.ts 冻结 + 依赖安装 + 模型冒烟）
   ↓
04a 示例常量 + 证据原件 ──┐          03a 分析管线（服务端）
   ↓                      │             ↑ 与左侧完全并行
03b 结果页 UI（吃假数据）  │          02  向导返工（独立文件）
   ↓                      │             ↑ 与所有并行
04b 首页 + 重放 + 战报卡 ──┘
```

| 模块 | 拥有的文件 |
|---|---|
| 03a | `app/api/**`、`lib/prompts/**`、`lib/analysis-*.ts`、`lib/letter.ts`、`lib/legal-injection.ts` |
| 03b | `app/result/**`、`components/result/**`、`lib/pdf-letter.ts` |
| 04a | `data/sample-case/**`、`components/evidence/**` |
| 04b | `app/page.tsx`、`app/sample/**`、`components/home/**`、`components/replay/**`、`components/share/**` |
| 02 | `app/wizard/**`、`components/wizard/**` |
| **仅前置阶段（不交给任何 agent）** | `lib/types.ts`、`lib/ai.ts`、`app/globals.css`、`app/layout.tsx`、`package.json` |

**两道闸门（军规）**：

- **Gate A**（7/25 晚）：主流程端到端跑通并部署。**v1.1 起仅作主线健康检查，不再解锁任何模块**（06 已取消）
- **Gate B**（7/26 悉尼 12:00）：封版，此后只做 07

状态取值：`待开工` / `🔨 进行中` / `✅ 完成` / `⚠️ 需返工` / `❌ 已取消`。完成一个模块就把状态改掉——扫一眼表即知进度。

## v1.1 新增的主线工作（来自 2026-07-25 产品评审）

外部评审意见：产品呈现成普通的「上传文件 → AI 生成一封信」，差异化必须是**证据驱动的退租维权闭环**，且第二层（扣款 ↔ 证据 ↔ 合同 ↔ 法条的对应）最重要。据此新增：

| # | 工作 | 归属 |
|---|------|------|
| 1 | 事实提取管线 `/api/facts`（第一层可见化，进度动画变真实） | 03 |
| 2 | `AnalysisItem` 三轴判定 + 可校验 `evidenceRefs` + 服务端白名单校验（第二层壁垒） | 03 |
| 3 | 零证据的「举证责任翻转」模式 | 03 |
| 4 | 结果页首屏账本条版式 + 证据档区块 + 申诉信代码拼装 | 03 |
| 5 | 首页首屏真实对照卡 + `/sample` 零 API 全流程重放 | 04 |
| 6 | 可点击定位高亮的入住报告 HTML 组件 | 04 |
| 7 | design token 层（排版/语义色/动效）+ 两断点响应式 + `check:tokens` | 前置 |
| 8 | 向导返工为上传优先 | 02 |
