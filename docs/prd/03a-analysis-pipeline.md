# 03a · 分析管线与契约（服务端）

> 母文档 §3.3-3.4。**只写服务端**：两个 API route、prompt、schema、校验层、信件拼装。UI 归 03b，两边只在**已冻结的** `lib/types.ts` 上相遇。

## 文件所有权（并行纪律）

| 你拥有 | 你不许碰 |
|---|---|
| `app/api/facts/route.ts` | `lib/types.ts`（前置已冻结） |
| `app/api/analyze/route.ts` | `lib/ai.ts`（前置已定模型常量） |
| `app/api/extract/route.ts`（按需微调） | `app/result/**`、`components/**`（属 03b/04b） |
| `lib/prompts/*.ts` | `data/sample-case/**`（属 04a） |
| `lib/analysis-schema.ts`（zod + JSON schema） | `app/globals.css`、`app/layout.tsx`、`package.json` |
| `lib/analysis-validate.ts`（服务端校验层） | |
| `lib/letter.ts`（信件确定性拼装） | |
| `lib/legal-injection.ts`（法条筛选注入） | |

## 1. `/api/facts` —— 事实提取（`FACTS_MODEL`）

- 输入：`EvidenceImage[]`（已在客户端压缩，含 `kind`）
- 输出：`EvidenceFact[]`
- **提示词纪律**：只记录**看得见**的东西——不推断、不评价、不补全。看不清就不输出，禁止猜测内容。每条事实必须给出 `locator`（人能看懂的定位，如「入住报告 P3 · 客厅」）与 `quote`（原文，英文材料保留英文）。
- 按 `kind` 给不同的提取重点：
  - `condition-report`：逐行读 Room / Item / Condition / Comments，**尤其是标注了既有损耗、污渍、磨损的行**
  - `lease`：与清洁、地毯、园艺、专业服务、退租义务相关的条款；**没找到就明确输出「已读页面中未见此类条款」这一条事实**（这是 ⚠️ 判定的依据）
  - `chat`：房东/中介对房屋状况或费用的口头承认
  - `deduction-notice`：逐笔扣款项与金额；**是否随附发票或报价**
  - `room`：可见的损伤或清洁状况
- 失败或超时 → 返回空数组，**不阻塞**，由 `/api/analyze` 走零证据模式

## 2. `/api/analyze` —— 逐项对照（`ANALYZE_MODEL`）

- 输入：`CaseInput` + `EvidenceFact[]` + 按州注入的 `confirmed` 法条（经 `asOf` 日期门）
- **不发送图片**——只吃文本事实。延迟可控、可强制引用白名单、便宜
- 输出：`AnalysisResult`（契约见 `lib/types.ts`）

### 写死进 prompt 的三条纪律

1. **三板斧作为结构化字段**：`checks.preExisting` / `contractObligation` / `fairWearTear`，各取 `yes|no|unknown|n-a`（或 `exists|absent|unknown|n-a`）
2. **否命题纪律**：`contractObligation: 'absent'` **不得得出 `unlawful`**，一律 `doubtful`，`reasoningZh` 措辞为「你上传的合约页中未见此义务条款」，并引 NSW s 165 要求房东出示条款与单据
3. **诚实条款**：房东占理必须判 `lawful` 并解释原因；`rent-arrears` 默认倾向房东占理，除非证据显示例外

### 零证据模式

`evidence.length === 0`（或 facts 为空）时 → `mode: 'burden-shift'`：
- 不猜结论，逐笔要求房东按 s 165 在 7 日内出示退租 condition report 与支持金额的发票/报价
- 全部 `checks` 为 `unknown`，`verdict` 为 `doubtful`，但 `paragraphEn` 是**要求举证**而非「我认为不合法」
- 信件与路线图照常产出

## 3. 服务端校验层（`lib/analysis-validate.ts`）

**不依赖 LLM 自律。**返回给客户端前逐项过滤：

| 检查 | 不通过时 |
|---|---|
| `evidenceRefs[].factId` ∈ 本次 `EvidenceFact[]` | 丢弃该引用 |
| `statuteRefs[]` 的 act+section ∈ 本次注入的 `confirmed` 法条 | 丢弃该引用 |
| `statuteRefs[].quote` 与注入法条的 `quote` 一致 | 用注入值覆盖（不许模型改写法条原文） |
| 某项被过滤到 `statuteRefs.length === 0` | `verdict` 降级为 `doubtful` |
| `checks.contractObligation === 'absent'` 且 `verdict === 'unlawful'` | 强制降级为 `doubtful` |
| `ledger.*` 六个数字 | **一律代码重算覆盖**，不采信 LLM |
| `bondLodgementAlert` | 由 `lib/bond-lodgement.ts` 确定性计算覆盖，LLM 不得升级等级 |
| `disputableAmount` | `lawful` 恒为 0；其余不得超过该项 `amount` |

被降级的项目要在 `reasoningZh` 前追加一句说明（例如「引用未通过核对，已下调为待核实」），**不要静默改结论**。

## 4. 申诉信拼装（`lib/letter.ts`）

**LLM 只产出每笔扣款的 `paragraphEn`**（并被要求在段落里引用该 item 已有的 `evidenceRefs` 与 `statuteRefs`）。骨架由代码拼：

```
[代码] 日期 / 收件人 / 物业地址 / 押金号
[代码] Re: Bond claim — Bond $3,560 · Claimed $1,306
[LLM ] ① Carpet & cleaning $780 — the ingoing condition report (p.3)
        records "existing stains"… ss 30, 51(3)(c), 19
[LLM ] ② Garden $340 — no such term appears in the pages provided… s 165
[代码] Please provide invoices/quotes and the outgoing condition report per s 165
[代码] I dispute $1,120 of the $1,306 claimed and request release of $3,374
[代码] Reply within 14 days / 附件清单 / 签名区
```

金额、押金号、法条编号、期限一律来自代码，**绝不经过 LLM**。

## 5. 模型调用约定

- 常量只从 `lib/ai.ts` 读，不在 route 内写死模型名
- gpt-5.x 系列：用 `max_completion_tokens` 与 `reasoning_effort`（先 `low`，按冒烟结果调），**不要写 `max_tokens`**，不自由设 temperature
- structured outputs（JSON schema）+ zod 双校验；校验失败 → 自动重试一次 → 仍失败则降级提示
- `export const maxDuration = 60`
- 沿用既有限流（`lib/rate-limit.ts`）与 `isAiEnabled()` 成本刹车

## 6. 验收标准

- [ ] `/api/facts` 对一张扫描版入住报告能返回带 `locator` + `quote` 的事实，读不清时返回空而不是编造
- [ ] `/api/analyze` 输出通过 zod 校验，`items` 与 `deductions` 逐笔对应
- [ ] **捏造的 `factId` / `statuteRef` 被丢弃，且该项自动降级为 ⚠️**（可用手改的假响应单测）
- [ ] **`contractObligation: 'absent'` 永远不会输出 `unlawful`**
- [ ] `rent-arrears` 类 case 能诚实输出 `lawful`
- [ ] `evidence: []` → `mode: 'burden-shift'`，`paragraphEn` 是要求举证而非指控
- [ ] `ledger` 六个数字由代码重算，与逐项金额自洽
- [ ] `bondLodgementAlert` 与 `lib/bond-lodgement.ts` 的结果一致，LLM 无法升级
- [ ] `letterEn` 中的金额与法条编号与 `items` 完全一致（拼装保证）
- [ ] 法条 `quote` 与 `data/legal/` 原文逐字一致
- [ ] AI 关闭（`AI_ENABLED=false`）或 key 缺失时返回体面降级，不 500

## 7. 不做

- 向 `/api/analyze` 发送图片；流式输出；任何 UI；结果持久化
