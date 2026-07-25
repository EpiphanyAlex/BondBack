# 执行计划（Plan）

> 依据 `docs/prd/`（模块拆分）与母文档军规。所有技术选型在此钉死，开发中不再议——改选型必须先改本文件。进度按模块依赖与验收结果推进；时间仅标注硬截止，均为悉尼时间。
> **v1.1（2026-07-25）**：模型全线更新、分析改三段式、进度动画改真实、新增 design token 前置阶段、06 取消。

## 1. 执行顺序与闸门

| 阶段 | 模块 | 关键产出 / 推进条件 |
|------|------|---------------------|
| 启动 | 00 脚手架 | ✅ 公网链接活了 |
| 并行主线 | 01 法条 ∥ 02 向导 | ✅ 均已完成（02 待返工为上传优先） |
| **前置冻结** | **tokens + `lib/types.ts` 契约 + 依赖安装 + 模型冒烟** | **`docs/design-tokens.md` §7 四组清单全勾 = 具备扇出资格** |
| 并行扇出 | 04a 示例常量 → 03b 结果页 UI → 04b 首页/重放/战报卡<br>∥ 03a 分析管线（服务端） ∥ 02 返工 | 四份工单按文件边界零重叠，见 `docs/prd/README.md`「并行扇出与文件所有权」 |
| 核心闭环 | 03a × 03b 接真接口 | **Gate A：部署环境端到端跑通** |
| 发布检查 | 05 打磨清单全勾 | **Gate B：具备封版资格** |
| 提交 | 07 视频 + 截图 + 提交 | Gate B 后提交必交四件 |

| 硬截止 | 要求 |
|--------|------|
| **7/26 12:00 — 最晚 Gate B 封版** | 主线停止扩展，集中处理发布阻塞项 |
| **7/26 18:00 — 最晚完成提交** | 必交四件全部提交并复核 |

调度规则：

- **前置阶段是一切的硬闸门**：契约不冻结就扇出，会得到三套互不一致的视觉、三种猜出来的红色，以及一个被并发 `pnpm add` 写坏的 lockfile。
- **04a 是依赖链起点，最先开工**：03b 需要一份 `AnalysisResult` 假数据才能开画结果页，而那份假数据正好是示例案常量。（v1.0 让 04 依赖 03，这个顺序是错的。）
- **03a 与 03b/04a 完全并行**：前者只碰 `app/api/**` 与 `lib/**`，后者只碰 `app/result/**` 与 `components/**`。
- 02 的返工可与所有模块并行，但必须在 Gate A 前合入。
- 04b 完成后，07 的素材准备与 05 并行。
- Gate A 仅作健康检查，**不再解锁任何模块**（06 已取消）。

## 2. 技术选型（钉死）

| 事项 | 决定 | 理由/备注 |
|------|------|-----------|
| 框架 | Next.js App Router + TS + Tailwind v4，pnpm | 已定 |
| AI SDK | 官方 `openai` npm 包，仅在 API route 使用 | key 不出服务端 |
| **模型常量** | `lib/ai.ts`：`EXTRACT_MODEL='gpt-5.4-nano'`、`FACTS_MODEL='gpt-5.6-luna'`、`ANALYZE_MODEL='gpt-5.6-luna'` | 单次完整分析 ~$0.062 USD，**低于原 gpt-4o 方案的 $0.076**。升级梯子 FACTS→`gpt-5.6-terra`→`gpt-5.6-sol`；降级梯子→`gpt-5.1`→`gpt-4.1`。换模型只改这一处 |
| **模型参数** | gpt-5.x 系列用 `max_completion_tokens` 与 `reasoning_effort`（先试 low/medium），不用 `max_tokens`、不自由设 temperature | 冒烟测试第一件事就是验证这几个参数 |
| **分析管线** | 三段式：`/api/extract`（预填）→ `/api/facts`（读证据出 `EvidenceFact[]`）→ `/api/analyze`（事实+法条出结论） | 事实可校验、analyze 不吃图、延迟可控 |
| **进度动画** | **真实两段**：读证据 / 对照法条，完成时报出真实条数 | 管线本来就是两段，白送的可信度；不做流式 |
| 结构化输出 | OpenAI structured outputs（JSON schema）+ zod 双重校验 | 校验失败→一次重试→降级提示 |
| **防幻觉校验** | 服务端过滤：`factId` ∈ 本次事实、`statuteRef` ∈ 注入白名单；不合规丢弃并把该项降级为 ⚠️；`ledger` 与存管等级一律代码重算 | 不依赖 LLM 自律（03 §3） |
| **申诉信** | LLM 只写每笔 `paragraphEn`，骨架（金额、押金号、s 165 要求、期限、附件清单）由代码确定性拼装 | 金额与法条编号绝不出错，信与卡片天然一致 |
| 状态管理 | React state + 根布局内轻量 `CaseSessionProvider` | 只跨 `/wizard → /result` 保留内存；不用全局库或浏览器持久化 |
| 图片处理 | 客户端 canvas 压缩（长边 ≤1568px，JPEG q0.8）→ base64 | 控 token 与请求体 |
| lease PDF | `pdfjs-dist` 客户端渲染前 3 页为图片 → 走同一 vision 管线 | 服务端不解析 PDF。**正因只读前几页，`contractObligation: absent` 一律降为 ⚠️** |
| 申诉信 PDF | `jspdf` 纯文本英文信排版 | 英文信无需中文字体嵌入（体积陷阱） |
| 战报卡 | `html-to-image` DOM→PNG 渲成 `<img>` + `qrcode` | 微信长按保存 |
| **示例案例** | `/sample` = 零 API 全流程重放（~12s 时轴 + 跳过），数据为手工打磨常量 | 展示过程而非只有结果；同时是视频的零风险素材源 |
| **证据原件** | 入住报告做成**可点击定位高亮的 HTML 组件**，其余三份简版缩略卡；不用 JPEG | 可高亮、手机清晰、体积小、改数字不用重导图 |
| 限流 | API route 内存 Map 按 IP 计数 + 请求体上限 + 全局开关 env | 尽力而为，够比赛用 |
| 超时 | 分析 route `export const maxDuration = 60` | 三段式让单次调用更短，超时风险下降 |
| 法条注入 | 按 `state` + `disputeTypes` 筛选 `confirmed` 且 topic 匹配或为 `all` 的条目，经 `asOf` 日期门 | 无向量库（已决策） |
| 路线图 | `stateProcesses` 州机构数据确定性渲染，LLM 只填个性化字段 | 费用/时限这类硬数据不过 LLM |
| **视觉 token** | 排版（7 档，大字号 `clamp` 流体）+ 语义色 + 动效三层；间距/圆角/阴影用 Tailwind 官方 | 唯一事实源 `docs/design-tokens.md` |
| **断点** | **只有 `md:`(768) 与 `lg:`(1024)**；`sm:`/`xl:`/`2xl:` 在 `@theme` 中设为 `initial` 删除。md 只许加宽加间距，lg 才许改结构 | 规则越少，并行开发越不会打架 |
| **配色模式** | `color-scheme: light` 显式锁定，不做暗色主题 | 防微信安卓深色模式强制反色毁掉配色 |
| **约束执行** | `pnpm check:tokens`：扫任意字号、禁用断点、硬编码 hex、行内 ms | 文档没有检查手段等于没有 |

## 3. 模块开工要点

- **tokens（前置）**：把 `docs/design-tokens.md` §5 的 `@theme` 块写进 `app/globals.css` → `layout.tsx` 加 `color-scheme` meta → 加 `check:tokens` 脚本 → 收编现有 27 处任意字号 → 跑一次清零。
- **冒烟**：真实调 `FACTS_MODEL` 读一张扫描版入住报告，确认 ① 参数不报错 ② 延迟可接受 ③ 能读出关键行。读不准就沿升级梯子上一档。
- **02 返工**：调整 `STEPS` 顺序为「基本情况 → 上传证据 → 核对与补全」，步骤组件复用；入住报告置顶成卡。
- **03**：先用假 `AnalysisResult`（直接借示例案常量）把对照卡/证据档/信/路线图 UI 全画完 → 再接 `/api/facts` 与 `/api/analyze` → 服务端校验层 → 最后 jspdf。
- **04**：示例数据 = 手工打磨的 `CaseInput` + `EvidenceFact[]` + `AnalysisResult` 常量，直接喂 03 的组件；再做重放时轴、首页、战报卡。
- **05**：按 05-polish.md 清单逐项勾，微信实测与 `check:tokens` 放最前。
- **07**：配音稿先行，分镜照 07-submission.md 执行。

## 4. 风险与对策

| 风险 | 对策 |
|------|------|
| 法条引错（最大翻车点） | 01 的 confidence + effective-date 双门、服务端白名单校验、不合规即降级；宁缺毋错 |
| **AI 读错入住报告关键行**（新的最大翻车点） | 关键读取交给 `FACTS_MODEL` 而非最便宜档；冒烟测试先验；读不准就升 terra |
| **并行开发视觉不一致** | token 层与断点约定先冻结再扇出；`check:tokens` 兜底 |
| 微信内浏览器限制（下载/兼容/深色反色） | 05 优先实测；`color-scheme: light`；PDF 兜底=复制全文+浏览器打开提示；`/sample` 纯静态保底 |
| 分析慢/超时 | 三段式拆短单次调用 + `maxDuration 60` + 真实进度动画 + 分段重试；演示视频用 `/sample` 重放（零 API 风险） |
| structured output 偶发跑偏 | zod 校验 + 一次自动重试 + 降级提示 |
| 成本失控/被刷 | 限流 + `AI_ENABLED=false` 一键只留示例模式。按选型单次 ~$0.06，预算够跑上百次 |
| 进度风险 | 硬截止受威胁时裁减验收清单外内容；已提前砍掉 06 |

## 5. 收尾纪律

- 每完成一个模块：更新 `docs/prd/README.md` 状态列 + commit（用 `commit-commands:commit`）
- Gate A 达成时明确记录（README 状态表加一行注记）——仅作健康检查，不解锁模块
- 实现偏离模块 PRD 时：先改 PRD 再改代码（一行注记即可，不写长文）
- 视觉偏离 `docs/design-tokens.md` 时：先改 tokens 文档再改代码，且必须跑 `check:tokens`
