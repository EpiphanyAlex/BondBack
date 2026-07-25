# CLAUDE.md — BondBack · 押金侠

匠人学院 TOP Coder Challenge 04（房地产 × AI）参赛项目。48 小时 MVP，截止 **2026-07-26 18:00（悉尼时间）**，**7/26 12:00 封版**。

**产品需求见 `docs/PRD.md` v1.1（事实源）。不要重开产品讨论，只按 PRD 执行。** 这是公众投票的人气赛：清晰易懂 + 情绪共鸣 + 可传播 > 技术深度。

文档层级：`docs/PRD.md`（母文档，冲突时以它为准）→ `docs/prd/`（模块 PRD + 状态索引，开工看这里）→ `docs/plan.md`（时间轴与钉死的技术选型，改选型必须先改它）→ `docs/design-tokens.md`（**视觉与响应式的唯一事实源，写 UI 前必读**）。

## 差异化在哪（v1.1 重心，别写偏）

产品不是「上传文件 → AI 生成一封信」，是**证据驱动的退租维权闭环**，必须清楚展示三层 AI 能力：

1. 从扣款清单、入住报告、照片、聊天截图中**提取事实**
2. **把每笔扣款与具体证据、合同义务、州法条对应起来** ← **真正的壁垒，一切取舍优先保它**
3. 输出逐项结论、可直接发送的英文申诉信、下一步行动路线

自动填表只是小魔法；「这笔地毯费不能扣，因为入住报告已记录原有污渍，且对应 s 30 / s 51(3)(c)」才是产品的智能壁垒。

## 技术栈（已确认，勿更换）

- Next.js（App Router）+ TypeScript + Tailwind CSS v4，部署 Vercel
- **移动优先 + 桌面真适配**：只有 `md:`(768) 与 `lg:`(1024) 两个断点，其余已删除（见 design-tokens.md）
- **无登录、无数据库**：一切在会话内完成；PDF 由前端生成下载
- **OpenAI 三段分工**（不换供应商，常量集中在 `lib/ai.ts`，换模型只改这一处）：
  - `EXTRACT_MODEL = 'gpt-5.4-nano'`：上传瞬间的字段预填（只求快）
  - `FACTS_MODEL = 'gpt-5.6-luna'`：读证据出 `EvidenceFact[]`（**产品命门**）
  - `ANALYZE_MODEL = 'gpt-5.6-luna'`：对照法条出逐项结论与信件段落
  - 单次完整分析 ~$0.062 USD。升级梯子 FACTS→`gpt-5.6-terra`→`gpt-5.6-sol`；降级梯子→`gpt-5.1`→`gpt-4.1`
  - gpt-5.x 用 `max_completion_tokens` + `reasoning_effort`，**不要写 `max_tokens`**
- **API key 仅在服务端**：`OPENAI_API_KEY` 环境变量 + API route，绝不出现在客户端代码或 git 中
- **法条不建向量库**：NSW/VIC 法规为结构化数据文件，按州直接注入 prompt

## 目录结构约定

```
app/                  # Next.js App Router 页面
app/api/              # API routes —— OpenAI 调用只发生在这里
                      #   extract（预填）/ facts（事实提取）/ analyze（对照法条）
components/           # UI 组件
lib/                  # prompt 模板、法条加载、校验、PDF 生成、限流等
data/legal/           # 按州结构化法条（带原文引用 + 来源 URL）
data/sample-case/     # 示例案例静态数据（CaseInput + EvidenceFact[] + AnalysisResult）
docs/PRD.md           # 产品需求母文档（v1.1，事实源）
docs/prd/             # 模块 PRD（00-07，含状态索引 README）
docs/plan.md          # 执行计划：时间轴、闸门、技术选型（钉死）
docs/design-tokens.md # 视觉与响应式唯一事实源
```

## 军规

1. **7/26 悉尼时间 12:00 封版**——此后不碰功能代码，只做传播材料（视频/截图/提交）
2. **design token 层与模型冒烟测试是 03/04 的硬前置**：契约不冻结就扇出，会得到三套互不一致的视觉
3. 入住留证模式**已取消**（v1.1 §6），Gate A 仅作健康检查，不再解锁任何模块

## 红线

- 不做 chatbot 对话形态——产品是「报税式」向导流水线；分析中的 UI 是**真实两段进度动画**，不是聊天气泡也不是假进度
- 不引入数据库、登录、其他模型供应商
- **法条引用宁缺毋错**；法条数据只用 PRD 白名单来源。法案、条款号和英文原文以 NSW/VIC 州立法数据库为准；租客组织网站仅作解释和交叉核对。存疑条目显式标注；未来规则必须设置生效日期并由 selector 过滤
- **`contractObligation: 'absent'`（合同无此义务）永远不得判 ❌**，一律降为 ⚠️ 并援引 s 165 把举证责任翻转给房东——因为 lease 只读了前几页，用部分样本断言全量缺失站不住
- **`evidenceRefs` / `statuteRefs` 必须过服务端白名单校验**（factId ∈ 本次事实、statuteRef ∈ 注入法条），不合规就丢弃并把该项降级为 ⚠️；`ledger` 与存管等级一律代码重算，不采信 LLM
- 「房东占理」的情形（典型：拖欠租金抵扣）AI 必须诚实输出「合法别争」——这是可信度卖点，prompt 里要写死
- 对外文案避免绝对化承诺（「帮你拿回」→ 工具辅助定位）；**战报卡不得写「追回」**，只写「找出可争议扣款」；页脚「不构成法律意见」免责声明必须在
- 证据识别失败必须静默回退手填，永不阻塞流程
- **不伪造真实世界的凭证**（聊天记录、汇款单、裁决书）；示例案例的文件全部虚构且标注「示例案例」
- **视觉红线**：不写任意字号 `text-[15px]`、不写硬编码颜色 `#b93a27`、不用 `sm:`/`xl:`/`2xl:` 断点。改样式前读 `docs/design-tokens.md`，改完跑 `pnpm check:tokens`

## 当前进度

| 模块 | 状态 |
|---|---|
| 00 脚手架 + 部署 | ✅ |
| 01 NSW/VIC 法条 | ✅ |
| **design tokens 前置** | ✅ 四组全勾（`lib/types.ts` / `lib/ai.ts` **已冻结，勿改**） |
| 02 向导 | ✅ 上传优先（基本情况 → 上传证据 → 核对补全） |
| 03a 分析管线（服务端） | ✅ 完成 |
| 03b 结果页 UI（对照卡/证据档/信/路线图） | ✅ 完成 |
| 04a 示例常量 + 证据原件 | ✅ 完成 |
| 04b 首页 + `/sample` 重放 + 战报卡 | ✅ 完成 |
| 05 打磨保险 | 待开工 —— 主流程 2026-07-25 已端到端跑通 |
| 06 入住留证 | ❌ 已取消 |
| 07 传播材料 | 封版后 |

## 语言约定

- 界面文案：全中文
- 申诉信：英文正文 + 中文对照解释
- 代码注释、commit message：中英皆可，从简

## 环境

- macOS，Node v24.4.1，pnpm 可用；git 用户名 EpiphanyAlex
- 部署：<https://bond-back-yanzhuo-lius-projects.vercel.app>
- 产品 API 用用户已有的 OpenAI key（勿再询问）

## 建议技能调用时机

- 写 UI 前：先读 `docs/design-tokens.md`；需要视觉方向时 `frontend-design`
- 组件/配色/字体选型：`ui-ux-pro-max`
- 改动分析管线或校验层后：`pnpm test:analysis`（零 API 成本，守住红线）
- 提交代码：`commit-commands:commit`
- 本地启动验证：`run`
- 主流程完工后：`/code-review`（时间紧，低优先级）
