# Design Tokens 与响应式约束

> **这是视觉的唯一事实源。** 写任何 UI 前先读这一页。母文档见 `docs/PRD.md`。
> 一句话规矩：**Tailwind 已经有的（间距、阴影）直接用官方的，不重造；这里只定义 Tailwind 给不了的四层——排版尺度、语义色、字面分工、动效。**

> **2026-07-25 · 「江湖战报」改版**：全站视觉换代（设计稿 `押金侠 · 江湖战报.dc.html`）。
> 三处翻新：① 色板由「墨蓝 + 冷灰纸」改为**墨黑 + 米白 + 朱红**；② **圆角一律为 0**；
> ③ 字面分成四种、各司其职。下面各节已是新值，旧值只在「收编对照」里留痕。

## 0. 四条硬规矩

1. **禁止任意字号**：不写 `text-[15px]`，只用下面 8 档（钱数另有 `num-*` 一组）。
2. **禁止硬编码颜色**：不写 `#e23d28` 或 `text-red-600`，只用语义 token。
3. **只有 `md:` 和 `lg:` 两个断点**：`sm:` / `xl:` / `2xl:` 已在 `@theme` 中删除，写了也不会生效。
4. **不写圆角**：`--radius-*` 已全部归零，`rounded-xl` 写了也是方角。唯一的圆是卷轴小圆点，用 `rounded-full`（它不走 `--radius-*`）。

违反项由 `pnpm check:tokens` 扫出来（圆角靠归零硬保证，不进扫描）。

---

## 1. 排版尺度（8 档 + 钱数 4 档）

大字号用 `clamp()` **流体缩放**——一个类同时管好手机和桌面，不需要写 `md:` 前缀，也就不可能漏。正文以下**固定不缩放**：中文字形复杂不耐小号，且 `globals.css` 已为 iOS 输入框自动放大锁死 `max(16px, 1rem)`。

| Token | 值 | 手机 → 桌面 | 用途 |
|---|---|---|---|
| `text-hero` | `clamp(2.5rem, 1.55rem + 4.2vw, 4.5rem)` | 40 → 72px | 首页第 1 幕的合体式标题，全站只此一处 |
| `text-display` | `clamp(1.875rem, 1.3rem + 2.5vw, 2.75rem)` | 30 → 44px | 每一幕的喊话标题（「三笔扣款，两笔站不住。」）|
| `text-title` | `clamp(1.25rem, 1.05rem + 1vw, 1.75rem)` | 20 → 28px | 区块标题、对照卡标题 |
| `text-section` | `clamp(1.0625rem, 1rem + 0.3vw, 1.1875rem)` | 17 → 19px | 强调正文、小标题 |
| `text-body` | `1rem` | 16px 固定 | 正文、按钮、输入框 |
| `text-label` | `0.9375rem` | 15px 固定 | 次要正文、解释句 |
| `text-caption` | `0.8125rem` | 13px 固定 | 辅助说明、脚注 |
| `text-micro` | `0.6875rem` + `0.16em` 字距 | 11px 固定 | 全大写小标签（「证据」「STEP 02」「战报 · 实时」）|

**钱数单开一组**（只配 `font-number` 用）：钱是本产品的主角，尺寸跨度比正文大得多，硬塞进上面 8 档会把尺度撑坏。

| Token | 手机 → 桌面 | 用途 |
|---|---|---|
| `text-num-xl` | 56 → 112px | 结果页「可争议」，整页最大的一个数字 |
| `text-num-lg` | 40 → 76px | 向导战报栏「你要争的钱」 |
| `text-num-md` | 40 → 64px | 对照卡头的单笔金额 |
| `text-num-sm` | 22 → 28px | 明细行、页脚里的行内金额 |

### 旧值收编对照（改现有代码时照这张表）

| 原写法 | 改成 |
|---|---|
| `text-[11px]` | `text-micro` |
| `text-[12px]` / `text-xs` / `text-[13px]` | `text-caption` |
| `text-sm` | `text-label` |
| `text-[15px]` | `text-body` |
| `text-[26px]` / `text-[27px]` / `text-2xl` | `text-title` |
| `text-4xl` | `text-hero`（幕标题则是 `text-display`）|
| `tracking-[0.14em]` / `[0.18em]` | 已内建进 `text-micro`，不用再写 |
| 任何 `rounded-*`（除 `rounded-full`）| 删掉，已归零 |

> 12px 与 14px 被合并掉是有意的：尺度的价值就在于**有限**。

---

## 1.5 字面分工（四种，谁都不许串岗）

| 类 | 字族 | 只用来排 |
|---|---|---|
| `font-display` + `.h-shout` | Noto Serif SC 900 → Songti SC / SimSun | **标题喊话**。宋体 900 是这一版的签名 |
| `font-number` | Anton | **钱数与序号**，`$1,306` / `01` / `7 天` |
| `font-mono` | IBM Plex Mono | **「码」**：法条编号 `s 51(3)(c)`、日期、押金号、全大写小标签 |
| `font-sans`（默认）| Noto Sans SC → PingFang SC | 正文与解释 |

> **为什么中文字体不走 `next/font`**：next/font 的 Google 字体清单里 Noto Sans SC / Noto Serif SC
> 都只暴露 `latin / cyrillic / vietnamese` 子集，**没有 `chinese-simplified` 可选**，声明了也不含汉字。
> 所以正文汉字交给系统字（PingFang SC / 微软雅黑），标题的思源宋体走 `app/layout.tsx` 里那条
> Google `css2` 链接（汉字按 unicode-range 切块，只下用到的那几块），拉不到就退到 Songti SC / SimSun。
> Anton 与 IBM Plex Mono 只有拉丁字形，正常自托管。

---

## 2. 语义色

底层材质色（`--ink` / `--seal` / `--jade` / `--gold` …）**不再直接用于业务组件**，一律通过语义别名引用。这样三个并行开发的模块不会各挑一个自己觉得对的红色。

**全站只有两种底色：墨黑 `#14110F` 与米白 `#F6F1E6`。** 朱红只给「不合法 / 主行动」，金只给钱数，石青只给「合法别争」。

| 材质色 | 值 | 是什么 |
|---|---|---|
| `--ink` | `#14110F` | 墨黑，深色面 |
| `--paper` | `#F6F1E6` | 米白，唯一的浅色底 |
| `--seal` | `#E23D28` | 朱红，全站最强的一个颜色 |
| `--gold-bright` | `#E9B44C` | 金，只给钱数且只在深底 |
| `--jade-solid` | `#6E8F8C` | 石青 |

### 2.1 结论三档

红 / 金 / 石青三色**全部让给结论**——这是无需学习的交通灯语义。每档四个出口：

| Token 后缀 | 不合法 | 待举证 | 合法，别争 | 用在哪 |
|---|---|---|---|---|
| （无，浅底文字）| `#E23D28` | `#9A6A10` | `#4A6B68` | 米白面上的文字 |
| `-fill` | `#E23D28` | `#E9B44C` | `#6E8F8C` | 块面（对照卡头、三色条）|
| `-wash` | `#FBEAE7` | `#FDF3E0` | `#E8EEEC` | 浅色衬底 |
| `-on-dark` | `#F08B78` | `#E9B44C` | `#9DBAB6` | 墨黑面上的文字与图例 |

> 浅底文字与块面**不是同一个值**：金 `#E9B44C` 当块面很好看，当文字在米白上只有 1.9:1。
> 配套图标：✕ 实心圆 / ！三角 / ✓ 实心圆。
> **不得只靠颜色传达结论**：图标与中文标签必须同时在场（色觉障碍可及性，成本为零）

三档结论**只有一个出口**：对照卡的卡头整片铺成结论色（`comparison-card.tsx`），
配 `VerdictIcon` 与中文标签。别处不要再画第二个。判决横幅的三色条与图例同样走
`VERDICT_META`，不自己挑颜色。

> 上一版另有两个出口，都已退场：`VerdictSeal`（页边印章）随「840px 阅读栏 +
> 7rem 页边」那套布局一起走 —— 逐笔改成横向卡带后没有页边可盖；`VerdictBadge`
> 原本在首页教「只判三种结果」，那一块已按产品意见删掉（2026-07-26）。
> 卡头本身就同时给出颜色、图标和中文标签，教学位是多余的一层。

### 2.2 金额

金色让给了「存疑」，所以金额改用**形式**而非颜色区分：等宽数字 + 更重字重。

| Token | 值 | 用法 |
|---|---|---|
| `amount` | `--ink` | 浅底上的一切金额，配 `font-number` |
| `amount-hero` | `--gold-bright` `#E9B44C` | **仅限墨黑面上**的主数字（可争议总额、战报栏金额） |

> ⚠️ `amount-hero` 绝不可用在米白纸面上：`#E9B44C` 对 `#F6F1E6` 只有 **1.9:1**，连大字号的 3:1 都不到。它对墨黑底则很安全。**所以「可争议 $1,120」这个主数字必须坐在墨黑面上**——向导的战报栏、结果页的判决横幅都是这个模式。

### 2.3 状态与提示

| Token | 底层 | 用法 |
|---|---|---|
| `alert-verify` | `--gold` | 押金存管黄卡「尚不能判断是否已存管」 |
| `alert-risk` | `--seal` | 存管红警（`possible-non-lodgement` 及以上） |
| `evidence-used` | `--jade` | 证据档里已被采用的事实（打钩） |
| `evidence-unused` | `--muted` | 证据档里未用到的事实 |

---

## 3. 动效

Tailwind v4 的 `duration-*` 不走主题，所以**时长在 `:root` 定义为普通 CSS 变量**，供 `globals.css` 里的动画类与内联 `style` 使用；在 Tailwind 侧则**只允许 `duration-150` 与 `duration-300`**（对应 quick / settle），不许出现其他值。

| Token | 值 | 用途 |
|---|---|---|
| `--duration-quick` | `150ms` | hover、按下、颜色过渡 |
| `--duration-settle` | `280ms` | 步骤进场、卡片翻开（`rise-in`） |
| `--duration-sweep` | `1600ms` | 预填魔法的金色扫过（`prefill-sweep`） |
| `--duration-beat` | `1200ms` | `/sample` 重放动画的一个节拍 |
| `ease-settle` | `cubic-bezier(0.22, 1, 0.36, 1)` | 所有进场动画统一缓动 |

`prefers-reduced-motion: reduce` 的全局降级已在 `globals.css` 中处理，新动画无需各自再写。

---

## 4. 响应式约束

### 4.1 只有两个断点

| 断点 | 宽度 | **只允许做什么** |
|---|---|---|
| （默认） | ≥360px | 手机单列。这是基准，先写它 |
| `md:` | ≥768px | **只许加宽、加间距、加字距**。禁止改变结构（不许在这里分栏） |
| `lg:` | ≥1024px | **才允许改结构**：分栏、sticky 侧栏、hero 横排 |

`sm:` / `xl:` / `2xl:` 已在 `@theme` 中设为 `initial` 删除——写了不报错但也不生效，同时会被 `check:tokens` 抓出来。

### 4.2 宽度边界

| 场景 | 最大宽度 |
|---|---|
| 每一幕的容器（首页 / 结果页 / 示例页 / 分析中） | `max-w-[1152px]` + `px-4 md:px-6` |
| 向导中栏（手机与平板） | `max-w-[720px]`；≥lg 由三栏网格接管，不再限宽 |
| 结果页对照卡（横向卡带里的一张） | `w-[86vw]` + `max-w-[860px]` |
| 结果页第三幕「发信」 | `840px`（等宽英文越窄折行越碎）|

**最窄支持 360px**：账本条在此宽度下金额与按钮换成两行，不得溢出或横向滚动。
改完布局请实测 360 / 390 / 1024 三个宽度的 `document.scrollWidth`，必须等于视口宽。

### 4.3 三类页面的桌面形态

```
首页 ≥lg（三幕，底色交替）        向导 ≥lg（三栏）
═══════════════════ 墨黑         ┌────┬──────────┬──────┐ 墨黑顶栏
│ 房东扣了我 $___ │ 示例战报 │    │步骤│  表单     │ 战报 │
│ 先别~~认栽~~    │          │    │轨  │（单列，   │ 栏   │
═══════════════════              │260 │ 不分栏）  │ 400  │ 墨黑
┌──────────────────┐ 米白        └────┴──────────┴──────┘
│ 01──02──03 流水线 │            手机：单列 + 底部 88px 一条
│ 说明 │ 真实对照卡 │
└──────────────────┘             结果页 / 示例页 ≥lg（四幕，见 §4.5）
═══════════════════ 墨黑         ═══════════════════════ 全幅墨黑
│ 收口 CTA │ 即将支持 │          │ 判决一句话 │ 可争议 $1,120 │
═══════════════════              │ 三色条 + 图例 + 两个 CTA      │
                                 ═══════════════════════
                                 ┌───┬─────────────────────┐
                                 │卷 │ 逐笔（横向吸附卡带）  │
                                 │轴 ├─────────────────────┤
                                 │140│ 发信 / 路线 / 证据档  │
                                 └───┴─────────────────────┘
                                 手机：卷轴隐藏，其余堆回单列，顺序不变
```

### 4.5 结果页的四幕结构

按**阅读方式**切幕，不按栏切。结构变化一律只在 `lg:`（§4.1）。

| 幕 | 内容 | 桌面形态 |
|---|---|---|
| 一 · 判决 | 一句话结论 + 三色条 + CTA | **全幅墨黑横幅**（自带底色，不进容器）：左边判决句，右边 `text-num-xl` 的可争议 |
| 二 · 逐笔 | 对照卡 | **横向吸附卡带，一次只看一笔**（`.strip` / `.snap`）。刻度既是位置指示也是可点的翻页按钮 |
| 三 · 发信 | 申诉信 + 邮件话术 | 单列 840px：信是成品（「复制全文」坐在卡头上），底下跟**默认折叠**的邮件话术 |
| 四 · 行动路线 | 时限 + 存管预警 + 三级机构 | 时限与预警各一条左边线横幅；机构按**阶段**分三栏，顶边细线连成时间轴 |
| 尾 · 证据档 | 事实索引 | 折叠收尾 |

≥lg 左边还有一根 140px 的**卷轴**（`act-rail.tsx`）：五个点，当前那一段填实心。
它的位置由 IntersectionObserver 跟真实滚动位置算，不靠点击记录。

三条容易踩的：

- **逐笔用横滑，但横滑不能是唯一入口**。刻度是可点的按钮，卡带可聚焦、可用左右
  方向键翻页 —— 否则键盘与读屏用户看不到第二笔。
- **行动路线按 `stage` 分组，不按条目**。升级发生在阶段之间；条目数会变（NSW 4 条、
  VIC 6 条），阶段数恒为 3。按条目编号会让人以为要逐条走完，也会让三栏在换州后错位。
- **判决那句话只由 `ledger` 与 `items` 算，不问 LLM**。它是整页最响的一句，
  不能出现「说两笔站不住、下面却只有一笔红卡」这种自相矛盾。

### 4.4 锁定浅色

`:root { color-scheme: light; }` + `<meta name="color-scheme" content="light">`。

**理由不是偷懒，是防御**：微信安卓版的深色模式会对未声明适配的网页强制反色，会把「墨黑 + 米白 + 朱红」整套配色毁掉，而全部用户都在微信里打开链接。不做深色主题——两套值意味着全部页面各测一遍，封版前没有这个时间，且截图与视频只能选一套。

---

## 5. `@theme` 落地代码

已写进 `app/globals.css`（材质色留在 `:root`，语义层在 `@theme inline` 引用它们）。
**那份文件就是本节的实现，改 token 请直接改它，不要在这里复制第二份值** ——
上一版这里贴了整块 CSS，改完两边不同步，反而多出一个假的事实源。

要点只有四条，其余照 `globals.css` 的注释读：

- `--radius-*` 全部设 `0`（含 `xs`→`4xl`），所以 `rounded-lg` 之类写了也是方角；`rounded-full` 走 Tailwind 内建常量，不受影响
- `--breakpoint-sm|xl|2xl: initial` 删掉三个断点
- 字面四种：`--font-display`（宋体 900）/ `--font-number`（Anton）/ `--font-mono`（Plex Mono）/ `--font-sans`
- 结论三档各四个出口：无后缀 / `-fill` / `-wash` / `-on-dark`

`globals.css` 里另有三个跨页面复用的类：`.h-shout`（宋体 900 喊话）、
`.strip` + `.snap`（结果页横向吸附卡带）、`.strike-in`（首页「认栽」的删除线划入）。

---

## 6. 自查

```bash
pnpm check:tokens
```

扫四类违规：任意字号 `text-[…]`、禁用断点 `sm:|xl:|2xl:`、`.tsx` 里的硬编码 `#hex`、行内 `ms` 时长。**封版前必须跑一次并清零。**

---

## 7. 前置阶段落地清单（03a/03b/04a/04b 扇出前必须全勾）

> **状态：✅ 四组全勾（2026-07-25），已具备扇出资格。**

这一节是工单。**它不只是 token——它是所有并行工作的契约冻结点。**顺序执行：

### 7.1 视觉层

- [x] §5 的 `@theme` 块写入 `app/globals.css`（材质色留在 `:root`，语义层在 `@theme inline` 引用）
- [x] `app/layout.tsx` 声明 `color-scheme: light` —— 走 `viewport` 导出而非手写 `<head>`，由 Next 保证标签只出现一次
- [x] `package.json` 加 `"check:tokens"` 脚本（实现见 `scripts/check-tokens.mjs`）
- [x] 按 §1 对照表收编任意字号：31 处 `text-[…]` + 33 处 Tailwind 自带档位（`text-sm`/`text-xs`/`text-2xl`/`text-4xl`），一并收编
- [x] `pnpm check:tokens` 跑通并清零
- [x] `pnpm build` 通过（`--breakpoint-*: initial` 与 `clamp()` 编译无误）

顺带做掉的迁移：`@theme` 删掉了 `background`/`foreground`/`brand`/`gold`/`seal`/`jade` 这批直用材质色，
调用点改成语义别名（`bg-paper`、`text-ink`、`border-line`、`text-amount-hero`、
`bg-verdict-doubtful-wash`、`border-alert-risk/35` 等）。

`check:tokens` 扫五类：任意字号、非 7 档字号、禁用断点、`.ts(x)` 里的 `#hex`、行内 ms 时长；
另对 `tracking-[…]` 出软提醒（0.14em 已内建进 `text-micro`）。
**唯一逃生舱**是行尾 `// token-ok: 理由`，只给拿不到 CSS 变量的非 UI 层（canvas 填充色、
浏览器 chrome 色）——目前全项目只有 3 处。整行注释不参与扫描。

### 7.2 契约冻结（**冻结已于 2026-07-25 解除**）

> 冻结只为并行扇出期间三个 agent 不打架，扇出已结束。`lib/types.ts` / `lib/ai.ts` 现在要改就改，改完同步四个模块的消费点即可 —— **别因为这里写过「冻结」就绕着走、在别处复制一份类型**。


- [x] `lib/types.ts`：`EvidenceFact`、`EvidenceRef`、`StatuteRef`（加 `quote`/`sourceUrl`）、`AnalysisChecks`、`AnalysisItem.{checks,evidenceRefs,disputableAmount,paragraphEn}`、`AnalysisResult.{mode,facts,ledger}`、`AnalysisLedger`、`ReplayBeat` 全部就位
- [x] `EVIDENCE_KINDS` 加 `deduction-notice`（02-wizard.md 的契约里写了它，代码里原先没有）
- [x] `lib/ai.ts`：`EXTRACT_MODEL='gpt-5.4-nano'`、`FACTS_MODEL='gpt-5.6-luna'`、`ANALYZE_MODEL='gpt-5.6-luna'`

两处顺带修正：
- `AnalysisItem.reasoning_zh` → `reasoningZh`（03a/03b/04a 三份工单都写的是 camelCase，且与 `bondLodgementAlert.reasoningZh` 一致）
- `AnalysisLedger` 是**六个**数字，押金总额不在里面——它是 `CaseInput.bondAmount`，`refundExpected = bondAmount − lawfulTotal`

### 7.3 依赖一次装完（**避免多个 agent 同时 `pnpm add` 打烂 lockfile**）

- [x] `jspdf@4.2.1`、`html-to-image@1.11.13`、`qrcode@1.5.4`、`@types/qrcode@1.5.6`

### 7.4 模型冒烟测试（读不准就没有第二层）

- [x] 参数：`max_tokens` 被拒（`400 unsupported_parameter: use max_completion_tokens`）；`max_completion_tokens` + `reasoning_effort: 'low'` 通过；`temperature: 0` 目前仍被接受（但没必要设）
- [x] structured outputs：`json_schema` + `strict: true` 可用
- [x] 延迟：`FACTS_MODEL` 读 4 张图 **4.9s**（`maxDuration = 60` 余量充足），`reasoning_effort: 'low'` 即可；~3.9k prompt tokens
- [x] 读取能力：一张**倾斜 + JPEG 降质**的扫描版入住报告，两次独立运行都准确读出 `existing stains noted`；扣款三笔金额、租约 `professionally cleaned` 条款、聊天里的 `garden looks fine` 全中
- [x] **否命题也读对了**：正确输出「已读租约页面中未见园艺/草坪维护条款」这条中文事实——这正是卡② `contractObligation: 'absent'` 判定的依据
- [x] 不需要升级梯子，`FACTS_MODEL` 保持 `gpt-5.6-luna`

提示词纪律经真调用验证有效，值得 03a 沿用：「只记录看得见的东西 / 读不清就不输出 /
每条给 `locator` + `quote` / 唯一例外是记录『某物缺失』时用中文陈述（没有原文可引）」。

`/api/extract` 同步改掉了被拒的 `max_tokens`，并把 `deduction-notice` 设为送模型的最高优先级
（一张扣款清单就能填满 `claimedAmount` + `deductions`）。live 验证：两张图 **3.8s** 填出全部 5 个字段。

**四组全勾 = 具备扇出资格。** 未勾就扇出，会得到三套互不一致的视觉、三种猜出来的红色，以及一个被并发写坏的 lockfile。
