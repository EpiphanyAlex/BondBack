# 执行计划（Plan）

> 依据 `docs/prd/`（模块拆分）与母文档军规。所有技术选型在此钉死，开发中不再议——改选型必须先改本文件。进度按模块依赖与验收结果推进；时间仅标注硬截止，均为悉尼时间。

## 1. 执行顺序与闸门

| 阶段 | 模块 | 关键产出 / 推进条件 |
|------|------|---------------------|
| 启动 | 00 脚手架 | **公网链接活了**；完成后立即解锁主线 |
| 并行主线 | 01 法条（已完成）∥ 02 前端 UI、向导、上传与预填 | `data/legal/` 已复核；向导端到端可填完 |
| 核心闭环 | 03 分析 + 三件套 + PDF | **Gate A：部署环境端到端跑通** |
| 演示闭环 | 04 示例 + 战报卡 + 首页 | 演示路径完整；解锁 07 的素材准备 |
| 发布检查 | 05 打磨清单全勾 | **Gate B：具备封版资格** |
| 条件扩展 | 06 入住留证 | Gate A 达成且主线无 P0/P1 问题即可解锁；否则愿景橱窗即终态 |
| 提交 | 07 视频 + 截图 + 提交 | Gate B 后提交必交四件 |

| 硬截止 | 要求 |
|--------|------|
| **7/26 12:00 — 最晚 Gate B 封版** | 主线停止扩展，集中处理发布阻塞项 |
| **7/26 18:00 — 最晚完成提交** | 必交四件全部提交并复核 |

调度规则：

- 00 完成后，01 与 02 并行。
- 01 的存管期限、claim 时限与仲裁费已于 2026-07-24 按现行官方来源复核。
- 当前场景所需法条确认且 02 可用后，进入 03。
- 04 完成后，07 的素材准备与 05、可选的 06 并行。

## 2. 技术选型（钉死）

| 事项 | 决定 | 理由/备注 |
|------|------|-----------|
| 框架 | Next.js App Router + TS + Tailwind，pnpm | 已定 |
| AI SDK | 官方 `openai` npm 包，仅在 API route 使用 | key 不出服务端 |
| 模型常量 | `lib/ai.ts`：`EXTRACT_MODEL='gpt-4o-mini'`、`ANALYZE_MODEL='gpt-4o'` | 若 key 可用更新旗舰，只改这一处 |
| 结构化输出 | OpenAI structured outputs（JSON schema）+ zod 双重校验 | 校验失败→一次重试→降级提示 |
| 状态管理 | React state + 根布局内轻量 `CaseSessionProvider` | 只跨 `/wizard → /result` 保留内存；不用全局库或浏览器持久化，刷新空结果页回向导 |
| 图片处理 | 客户端 canvas 压缩（长边 ≤1568px，JPEG q0.8）→ base64 | 控 token 与请求体 |
| lease PDF | `pdfjs-dist` 客户端渲染前 3 页为图片 → 走同一 vision 管线 | 服务端不解析 PDF |
| 维权信 PDF | `jspdf` 纯文本英文信排版 | 英文信无需中文字体嵌入（体积陷阱） |
| 战报卡 | `html-to-image` DOM→PNG 渲成 `<img>` + `qrcode` | 微信长按保存 |
| 限流 | API route 内存 Map 按 IP 计数 + 请求体上限 + 全局开关 env | 尽力而为，够比赛用 |
| 超时 | 分析 route `export const maxDuration = 60` | 避免平台默认截断 |
| 进度动画 | 非流式；前端按三板斧分阶段的假进度 + 真实完成跳转 | 流式结构化输出复杂度不值 |
| 法条注入 | 按 `state` + `disputeTypes` 筛选 `confirmed` 且 topic 匹配或为 `all` 的条目 | 无向量库（已决策） |
| 路线图 | `stateProcesses` 州机构数据确定性渲染，LLM 只填个性化字段 | 费用/时限这类硬数据不过 LLM |

## 3. 模块开工要点

- **00**：`pnpm create next-app` → 布局壳/页脚/路由占位 → push → Vercel 连 repo + env → 验部署。需要用户 `vercel login` 一次。
- **01**：已按 01-legal-data.md 的清单与来源白名单完成研究，产出
  `legalClauses` 与 `stateProcesses`；人工核对 act/section/quote/URL，
  标 confidence，并为未来规则增加生效日期门。
- **02**：先按「基本情况 → 金额与扣款 → 证据与确认」跑通静态三步表单
  （手填路径永远可用）→ 接 `CaseSessionProvider` → 再接 `/api/extract`
  预填 → 最后接 PDF 转图。写 UI 前先调 `frontend-design`
  定视觉方向（一次性，覆盖 02/03/04）。
- **03**：先用假 `AnalysisResult` 把三件套 UI 全部画完 → 再接真 `/api/analyze` → prompt 里写死三板斧 + 诚实条款 + 「只引用注入法条」→ 最后 jspdf。
- **04**：示例数据 = 手工打磨的一份 `CaseInput`+`AnalysisResult` 常量，直接喂 03 的组件；战报卡与首页收尾。
- **05**：按 05-polish.md 清单逐项勾，微信实测放最前（发现问题留时间修）。
- **07**：配音稿先行，分镜照 07-submission.md 执行。

## 4. 风险与对策

| 风险 | 对策 |
|------|------|
| 法条引错（最大翻车点） | 01 的 confidence + effective-date 双门、prompt 白名单引用；宁缺毋错 |
| 微信内浏览器限制（下载/兼容） | 05 优先实测；PDF 兜底=复制全文+浏览器打开提示；示例页纯静态保底 |
| 分析慢/超时 | maxDuration 60 + 假进度动画 + 失败重试；演示视频用示例路径（零 API 风险） |
| structured output 偶发跑偏 | zod 校验 + 一次自动重试 + 降级提示 |
| 成本失控/被刷 | 限流 + 全局开关 env（一键只留示例模式） |
| 进度风险 | 硬截止受威胁时裁减验收清单外内容，优先裁减 06 |

## 5. 收尾纪律

- 每完成一个模块：更新 `docs/prd/README.md` 状态列 + commit（用 `commit-commands:commit`）
- Gate A 达成时明确记录（README 状态表加一行注记），06 是否解锁以此为准
- 实现偏离模块 PRD 时：先改 PRD 再改代码（一行注记即可，不写长文）
