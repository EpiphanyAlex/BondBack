# 02 · 三步向导 + 证据上传 + 自动预填（任务 3）

> 母文档 §3.2-3.3。产品形态是「报税式」向导，**不是 chatbot**。视觉与响应式约束见 `docs/design-tokens.md`。
>
> **状态：已实现，但需按 v1.1 返工步骤顺序（见下）。**

## v1.1 返工项

1. **步骤顺序改为上传优先**（原：基本情况 → 金额与扣款 → 证据与确认）。`app/wizard/page.tsx` 的 `STEPS` 数组、步骤标题、校验时机与 CTA 文案需相应调整；三个步骤组件本身基本可复用。
2. 入住 condition report 在上传步骤内**置顶单独成卡**并配说服文案。
3. `/api/extract` 的产出保持不变（只做字段预填）；**新增的事实提取属于 03**，不在本模块。
4. 排版按 `docs/design-tokens.md` 的对照表收编（本模块是 27 处任意字号的主要来源）。

## 用户流程（上传优先）

1. **基本情况**（十几秒就能过）：
   - 选州：NSW / VIC 可选；其余州和领地显示但禁用，标「即将支持」
   - 纠纷类型：5 预设 + 「其他」，可多选
2. **上传证据**：
   - **入住 condition report 置顶单独成卡**，文案：「这一份最关键：它能推翻大多数扣款」
   - 其余：lease PDF / 房间照片 / 与房东聊天截图 / 扣款清单
   - 可跳过，但需明确告知代价：「没有它，多数结论会停在待核实」——不是恐吓，是让用户知道信息量决定结论强度
   - 上传即调 `/api/extract`，字段扫过金色（魔法时刻 ①）
3. **核对与补全**：
   - 字段**已经填好**，用户只需核对与补充：押金金额、被扣金额、退租日期、扣款明细
   - 押金存管核实（渐进展开，见下）
   - 提交进入分析

**为什么是这个顺序**：预填规则是「只填空白且未被用户修改的字段」。若金额步骤在上传之前，用户认真填完后预填将无事可填，魔法时刻被自己的流程顺序抵消。上传优先让它**必然发生**；且「核对已填好的表」比「从白填」心理阻力低得多。

**跳过上传的用户**照常进入第 3 步手填，流程不断——手填路径永远可用。

### 押金存管核实（第 3 步内，渐进展开）

- 押金付给谁：RBO/RTBA / 房东 / 中介 / 其他 / 不确定
- 付款日期；NSW 若分期，记录首期、付清日及可得的分期日期
- 是否收到 RBO/RTBA 确认：是 / 没有 / 不确定
- 是否已查询官方记录：查到 / 查不到 / 未查询 / 不确定；若查不到，是否有 authority 的书面确认
- 若已收到单方 claim notice，记录收到日、通知所列 due date 与 email/post 等送达方式

「每步一屏」指一个独立步骤面板并保持进度可见；问题较多时允许纵向滚动。

## 自动预填（魔法时刻 ①）

- 上传后调 `/api/extract`（`EXTRACT_MODEL`，vision）：提取押金金额、地址、扣款明细等字段 → 自动填入表单
- 只填空白且未被用户修改的字段；扣款列表为空时才整体预填
- `claimedAmount` 为空时可由扣款金额合计得出；一经用户修改不再自动覆盖
- **识别失败静默回退手填：不弹错误、不阻塞流程、永不翻车**
- lease PDF 在客户端转前几页为图片后走同一识别管线

## 数据契约（与 03 共享，放 `lib/types.ts`）

```ts
type DisputeType =
  | 'cleaning' | 'damage' | 'early-termination'
  | 'bond' | 'rent-arrears' | 'other'

type EvidenceKind = 'room' | 'lease' | 'condition-report' | 'chat' | 'deduction-notice' | 'other'

type EvidenceImage = {
  id: string
  kind: EvidenceKind
  fileName: string
  mimeType: string
  dataUrl: string
  sourcePage?: number
}

type BondPaymentRecipient = 'bond-authority' | 'landlord' | 'agent' | 'other' | 'unsure'

type BondLookup = {
  status: 'found' | 'not-found' | 'not-checked' | 'unsure'
  evidence: 'none' | 'portal' | 'authority-written'
}

type CaseInput = {
  state: 'NSW' | 'VIC'
  disputeTypes: DisputeType[]
  bondAmount: number
  claimedAmount: number
  moveOutDate: string                    // ISO
  bondPayment: {
    paidTo: BondPaymentRecipient
    paidAt?: string
    paidByInstalments: 'yes' | 'no' | 'unsure'
    instalmentDates?: string[]           // NSW s 162(4) 计算所需
    confirmationReceived: 'yes' | 'no' | 'unsure'
    lookup: BondLookup
  }
  claimNotice?: {
    receivedAt?: string
    dueAt?: string                       // 优先采用 Notice 明列日期
    deliveryMethod: 'email' | 'post' | 'sms' | 'other' | 'unsure'
  }
  deductions: { description: string; amount?: number }[]
  evidence: EvidenceImage[]              // 压缩后图片，仅保留在 React 会话内存
  propertyAddress?: string
  notes?: string
}

type ExtractResult = {
  fields: Partial<Pick<CaseInput,
    'bondAmount' | 'claimedAmount' | 'moveOutDate' | 'deductions' | 'propertyAddress'>>
}
```

`/wizard → /result` 通过根布局内的轻量 `CaseSessionProvider` 传递 `CaseInput` 与分析结果；不引入状态库、localStorage、sessionStorage 或数据库。刷新空的 `/result` 时提示返回向导重新填写。

## 存管判断规则

存管期限和风险等级必须由确定性代码计算，LLM 只解释结果：

1. 仅「没收到/不确定是否收到确认」或尚未查询官方记录 → `verify-record`，黄色核实提示，不得断言违法。
2. 官方记录 `not-found`，且付款对象、付款日期、州别和 NSW 分期情况足以证明适用期限已过 → `possible-non-lodgement`，只能写「可能未按期存管」。
3. authority 书面确认无记录，且付款证据与适用期限完整 → `authority-confirmed-missing`；可显示红色高风险提示，但仍不得把罚则写成租客必得赔偿。
4. RBO/RTBA 已查到记录 → `none`。租客直接付给 RBO/RTBA 时，不得套用「provider 收款后未转交」的违法判断。
5. claim notice 的紧急期限优先采用通知中的 `dueAt`。

## 验收标准

- [ ] **步骤顺序为：基本情况 → 上传证据 → 核对与补全**
- [ ] 上传含金额信息的截图 → 进入第 3 步时字段肉眼可见地已填好（魔法时刻，值得 `--duration-sweep` 的金色扫过）
- [ ] 入住报告在上传步骤内视觉上明显优先于其他证据类型
- [ ] 跳过上传 → 第 3 步全部手填可走通，无报错弹窗
- [ ] 手机上单手可完成全流程；每步一屏、进度可见、可回退改答案
- [ ] 360px 宽度下账本条不溢出、无横向滚动
- [ ] 断网/识别失败 → 表单仍可手填走通
- [ ] 仅选「没有/不确定」确认邮件 → 03 只显示黄色「请核对 RBO/RTBA」提示
- [ ] `lookup.status = not-found` 且法定期限已过 → 正确传递 `possible-non-lodgement`
- [ ] 选择直接支付 RBO/RTBA → 不触发 provider 未转交押金的红警
- [ ] NSW 分期押金不使用一次性支付的统一 10 天算法
- [ ] 有 claim notice 时，分析和路线图优先显示用户录入的 notice due date
- [ ] 不上传任何证据也能进入分析（03 会切到举证翻转模式）
- [ ] 不同证据类型的 `kind` 正确传入 03；PDF 页保留 `lease` 类型
- [ ] 直接访问或刷新空的 `/result` 有可恢复提示，不白屏
- [ ] `pnpm check:tokens` 在本模块文件上零违规

## 不做

- 聊天输入框、自由对话；证据存储（无数据库，图片只在会话内存）
- 事实提取（属 03）
