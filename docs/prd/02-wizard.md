# 02 · 三步向导 + 证据上传 + 自动预填（任务 3 · 5h）

> 母文档 §3.2-3.3。产品形态是「报税式」向导，**不是 chatbot**。

## 用户流程

1. **基本情况**：
   - 选州：NSW / VIC 可选；其余州和领地显示但禁用，标「即将支持」
   - 纠纷类型：5 预设 + 「其他」，可多选（清洁费 / 损坏 vs
     合理磨损 / 提前解约扣费 / 押金逾期未退或未存管 /
     拖欠租金抵扣 / 其他）
2. **金额与扣款**：
   - 押金金额、被扣金额、退租日期
   - 隐藏武器扫描：「你收到过州政府押金存管确认邮件吗？
     （VIC=RTBA / NSW=RBO）」→ 是 / 没有 / 不确定
   - 扣款明细：逐项「描述 + 金额」，可手动增删；胜算评估卡按此逐项出结论
3. **证据与确认**：
   - 证据上传（可跳过，提示“信息越全评估越准”）：房间照片 /
     lease PDF / 入住 condition report / 与房东聊天截图
   - 检查自动预填结果并提交分析

“每步一屏”指一个独立步骤面板并保持进度可见；扣款较多时允许纵向滚动。

## 自动预填（魔法时刻 ①）

- 上传后调 `/api/extract`（gpt-4o-mini，vision）：提取押金金额、地址、扣款明细等字段 → 自动填入表单
- 只填空白且未被用户修改的字段；扣款列表为空时才整体预填
- `claimedAmount` 为空时可由扣款金额合计得出；一经用户修改不再自动覆盖
- **识别失败静默回退手填：不弹错误、不阻塞流程、永不翻车**
- lease PDF 在客户端转前几页为图片后走同一识别管线（实现见 plan）

## 数据契约（与 03 共享，放 `lib/types.ts`）

```ts
type DisputeType =
  | 'cleaning'
  | 'damage'
  | 'early-termination'
  | 'bond'
  | 'rent-arrears'
  | 'other'

type EvidenceImage = {
  id: string
  kind: 'room' | 'lease' | 'condition-report' | 'chat' | 'other'
  fileName: string
  mimeType: string
  dataUrl: string
  sourcePage?: number
}

type CaseInput = {
  state: 'NSW' | 'VIC'
  disputeTypes: DisputeType[]            // 多选
  bondAmount: number                     // AUD
  claimedAmount: number
  moveOutDate: string                    // ISO
  bondLodged: 'yes' | 'no' | 'unsure'    // 隐藏武器扫描
  deductions: { description: string; amount?: number }[]
  evidence: EvidenceImage[]              // 压缩后图片，仅保留在 React 会话内存
  propertyAddress?: string
  notes?: string
}

type ExtractResult = {
  fields: Partial<Pick<
    CaseInput,
    'bondAmount' | 'claimedAmount' | 'moveOutDate' |
    'deductions' | 'propertyAddress'
  >>
}
```

`/wizard → /result` 通过根布局内的轻量 `CaseSessionProvider` 传递
`CaseInput` 与分析结果；不引入状态库、localStorage、sessionStorage 或数据库。
刷新空的 `/result` 时提示返回向导重新填写。

## 验收标准

- [ ] 手机上单手可完成全流程；每步一屏、进度可见、可回退改答案
- [ ] 上传含金额信息的截图 → 字段肉眼可见地自动填好（演示高光，值得 300ms 动画）
- [ ] 断网/识别失败 → 表单仍可手填走通，无报错弹窗
- [ ] 选「没有/不确定」存管 → `bondLodged` 正确传递给 03（红色警报在 03 渲染）
- [ ] 不上传任何证据也能进入分析
- [ ] 不同证据类型的 `kind` 正确传入 03；PDF 页保留 `lease` 类型
- [ ] 直接访问或刷新空的 `/result` 有可恢复提示，不白屏

## 不做

- 聊天输入框、自由对话；证据存储（无数据库，图片只在会话内存）
