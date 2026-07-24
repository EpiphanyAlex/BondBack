# 执行计划（Plan）

> 依据 `docs/prd/`（模块拆分）与母文档军规。所有技术选型在此钉死，开发中不再议——改选型必须先改本文件。时间均为悉尼时间。

## 1. 时间轴与闸门

| 时段 | 模块 | 产出 |
|------|------|------|
| 7/24 晚（~2h） | 00 脚手架 | **公网链接活了** |
| 7/25 上午（~3h） | 01 法条（research agent 后台跑，人工收口）∥ 02 前段 UI | `data/legal/` 初稿 |
| 7/25 下午（~5h） | 02 向导 + 上传 + 预填 | 向导端到端可填完 |
| 7/25 晚（~5h） | 03 分析 + 三件套 + PDF | **Gate A：部署环境端到端跑通** |
| 7/26 早（~3h） | 04 示例 + 战报卡 + 首页 | 演示路径完整 |
| 7/26 上午（~2h） | 05 打磨清单全勾 | 具备封版资格 |
| （仅 Gate A 提前达成且有余量） | 06 入住留证 | 否则愿景橱窗即终态 |
| **7/26 12:00 — Gate B 封版** | | |
| 7/26 12:00-18:00（~6h） | 07 视频 + 截图 + 提交 | 必交四件全交 |

心理预期：06 大概率不解锁，按愿景橱窗规划视觉；01 的用户抽查（存管期限/claim 时限/仲裁费）安排在 7/25 白天，别拖到晚上。

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
- **01**：按 01-legal-data.md 的条目清单 + 来源白名单发起调研，产出
  `legalClauses` 与 `stateProcesses`；人工核对 act/section/quote/URL，
  标 confidence；**用户抽查关键三项**。
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
| 法条引错（最大翻车点） | 01 的 confidence 门 + prompt 白名单引用 + 用户抽查；宁缺毋错 |
| 微信内浏览器限制（下载/兼容） | 05 优先实测；PDF 兜底=复制全文+浏览器打开提示；示例页纯静态保底 |
| 分析慢/超时 | maxDuration 60 + 假进度动画 + 失败重试；演示视频用示例路径（零 API 风险） |
| structured output 偶发跑偏 | zod 校验 + 一次自动重试 + 降级提示 |
| 成本失控/被刷 | 限流 + 全局开关 env（一键只留示例模式） |
| 时间超支 | 各模块超预算 50% 时砍验收清单外的一切；06 永远第一个弃 |

## 5. 收尾纪律

- 每完成一个模块：更新 `docs/prd/README.md` 状态列 + commit（用 `commit-commands:commit`）
- Gate A 达成时明确记录（README 状态表加一行注记），06 是否解锁以此为准
- 实现偏离模块 PRD 时：先改 PRD 再改代码（一行注记即可，不写长文）
