# Design Tokens 与响应式约束

> **这是视觉的唯一事实源。** 写任何 UI 前先读这一页。母文档见 `docs/PRD.md`。
> 一句话规矩：**Tailwind 已经有的（间距、圆角、阴影）直接用官方的，不重造；这里只定义 Tailwind 给不了的三层——排版尺度、语义色、动效。**

## 0. 三条硬规矩

1. **禁止任意字号**：不写 `text-[15px]`，只用下面 7 档。
2. **禁止硬编码颜色**：不写 `#b93a27` 或 `text-red-600`，只用语义 token。
3. **只有 `md:` 和 `lg:` 两个断点**：`sm:` / `xl:` / `2xl:` 已在 `@theme` 中删除，写了也不会生效。

违反项由 `pnpm check:tokens` 扫出来。

---

## 1. 排版尺度（7 档）

大字号用 `clamp()` **流体缩放**——一个类同时管好手机和桌面，不需要写 `md:` 前缀，也就不可能漏。正文以下**固定不缩放**：中文字形复杂不耐小号，且 `globals.css` 已为 iOS 输入框自动放大锁死 `max(16px, 1rem)`。

| Token | 值 | 手机 → 桌面 | 用途 |
|---|---|---|---|
| `text-hero` | `clamp(1.75rem, 1.3rem + 2.2vw, 3rem)` | 28 → 48px | 首页大标题、结果页「可争议」金额 |
| `text-title` | `clamp(1.375rem, 1.15rem + 1.1vw, 2rem)` | 22 → 32px | 页面标题、账本条金额、战报卡主数字 |
| `text-section` | `clamp(1.0625rem, 1rem + 0.4vw, 1.25rem)` | 17 → 20px | 卡片标题、区块标题 |
| `text-body` | `1rem` | 16px 固定 | 正文、按钮、输入框 |
| `text-label` | `0.875rem` | 14px 固定 | 表单标签、次要正文 |
| `text-caption` | `0.8125rem` | 13px 固定 | 辅助说明、脚注 |
| `text-micro` | `0.6875rem` + `0.14em` 字距 | 11px 固定 | 全大写小标签（「证据」「合同」「法条」） |

### 旧值收编对照（改现有代码时照这张表）

| 原写法 | 改成 |
|---|---|
| `text-[11px]`（14 处） | `text-micro` |
| `text-[12px]` / `text-xs`（18 处） | `text-caption` |
| `text-[13px]`（3 处） | `text-caption` |
| `text-sm`（22 处） | `text-label` |
| `text-[15px]`（4 处） | `text-body` |
| `text-[26px]` / `text-[27px]` | `text-title` |
| `text-2xl` | `text-title` |
| `text-4xl` | `text-hero` |
| `tracking-[0.14em]` / `[0.18em]` | 已内建进 `text-micro`，不用再写 |

> 12px 与 15px 被合并掉是有意的：尺度的价值就在于**有限**。12px 中文在手机上本来就偏小。

---

## 2. 语义色

底层材质色（`--ink` / `--seal` / `--jade` / `--gold` …）**不再直接用于业务组件**，一律通过语义别名引用。这样三个并行开发的模块不会各挑一个自己觉得对的红色。

### 2.1 结论三档

红 / 金 / 绿三色**全部让给结论**——这是无需学习的交通灯语义。

| Token | 底层 | 用法 | 配套图标 |
|---|---|---|---|
| `verdict-unlawful` | `--seal` `#b93a27` | ❌ 不合法 | ✕ 实心圆 |
| `verdict-doubtful` | `--gold` `#9c650f` | ⚠️ 待举证 / 存疑 | ！三角 |
| `verdict-lawful` | `--jade` `#1c6b5d` | ✅ 合法，别争 | ✓ 实心圆 |

- 每档配 `-wash` 底色（`verdict-unlawful-wash` 等）用于卡片浅色衬底
- 每档配 `-on-dark` 变体，专用于深色账本条上的文字与图例（浅底色值在墨蓝上对比度不足）
- **不得只靠颜色传达结论**：图标与中文标签必须同时在场（色觉障碍可及性，成本为零）

三档结论有两个出口，都在 `components/result/verdict.tsx`，别处不要再画第三个：

| 出口 | 用在哪 |
|---|---|
| `VerdictBadge` | 卡内徽章。手机、首页、`/sample` 重放一律用它 |
| `VerdictSeal` | **印章**，只用于结果页 ≥lg 的页边批注栏 |

`VerdictSeal` 是这一版的签名元素：配色里一直有一档叫「印章红」却从没真画过一枚印，
而产品做的事正是**逐项判决**，所以每笔扣款在页边被盖一枚章（双边框、`rotate-[-6deg]`、
压在卡片右边缘上）。歪角是静态 `transform` 不是动画，`prefers-reduced-motion` 不必介入。
卡内徽章与页边印章**不得同时出现**（同一个结论说两遍）—— 由 `ComparisonCard`
的 `sealInMargin` 给徽章加 `lg:hidden` 来保证。

### 2.2 金额

金色让给了「存疑」，所以金额改用**形式**而非颜色区分：等宽数字 + 更重字重。

| Token | 值 | 用法 |
|---|---|---|
| `amount` | `--ink` | 浅底上的一切金额，配 `.tnum` + `font-semibold` |
| `amount-hero` | `--gold-bright` `#e8a33d` | **仅限深色账本条上**的主数字（可争议总额、争取金额） |

> ⚠️ `amount-hero` 绝不可用在浅色纸面上：`#e8a33d` 对 `#f4f6f8` 只有 **1.99:1**，连大字号的 3:1 都不到。它对墨蓝底是 **7.58:1**，非常安全。**所以「可争议 $1,120」这个主数字必须坐在深色账本条上**——这与既有视觉方向「全站唯一的深色面是账本条，它是记忆点」一致，`components/wizard/ledger-bar.tsx` 已经是这个模式，照抄即可。

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
| 单列内容（向导、文章型区块） | `max-w-[720px]` |
| 每一幕的容器（首页 / 结果页 / 示例页） | `max-w-[1152px]` + `px-4 md:px-6` |
| 结果页对照卡阅读栏 | `minmax(0,840px)` + 右侧 `7rem` 页边（放印章） |
| 结果页申诉信 | `660px`（英文约 70 字符/行），第三幕整体 `840px` |

> **2026-07-25 改动**：结果页原先是「左 `1fr` / 右固定 `380px` sticky」，右栏竖着堆
> 申诉信 + 行动路线 + 证据档。这条已废弃 —— 那三样阅读方式完全不同（成品 / 流程 /
> 索引），焊进同一根窄柱等于让**最需要宽度的内容拿到最少的宽度**：英文信一行只剩
> 三十几个字符，机构卡只有 310px。现在按阅读方式切幕，见 §4.5。

**最窄支持 360px**：账本条在此宽度下金额与按钮换成两行，不得溢出或横向滚动。
改完布局请实测 360 / 390 / 1024 三个宽度的 `document.scrollWidth`，必须等于视口宽。

### 4.3 三类页面的桌面形态

```
首页 ≥lg                        结果页 / 示例页 ≥lg（四幕，见 §4.5）
┌──────────┬──────────┐        ═══════════════════════════════ 全幅墨蓝
│ 标题+简介 │          │        │ 索扣 $1,306 │三色条│ 可争议 $1,120 │
│ 双入口    │  对照卡   │        │ 三条为什么（并排三栏）+ 两个 CTA      │
│          │（真实静态）│        ═══════════════════════════════
└──────────┴──────────┘        ┌──────────────────────┐ ┌──┐
                                │ 对照卡 ①             │ │印│ ← 页边批注
向导 ≥lg                        └──────────────────────┘ └章┘
  单列加宽到 720px，不分栏       ┌────────────┬─────────┐
（多栏表单是公认反模式）          │ 英文申诉信  │ 中文对照 │
                                └────────────┴─────────┘
                                ┌─────────────────────────────┐
                                │ 邮件话术（整幅，等宽英文要宽）│
                                └─────────────────────────────┘
                                ┌────┐┌────┐┌────┐  三级机构
                                │1押金││2消费││3仲裁│
                                └────┘└────┘└────┘
                                手机：全部堆回单列，顺序不变
```

### 4.5 结果页的四幕结构

按**阅读方式**切幕，不按栏切。结构变化一律只在 `lg:`（§4.1）。

| 幕 | 内容 | 桌面形态 |
|---|---|---|
| 一 · 判决 | 账本 + 三条为什么 + CTA | **全幅墨蓝横条**（自带底色，不进 `ACT` 容器），三分：索扣 │ 三色条 │ 可争议 |
| 二 · 逐项对照 | 对照卡 | 840px 阅读栏 + `7rem` 页边，**结论印章盖在卡片右边缘上**（`-ml-9` 跨过纸边才像盖的） |
| 三 · 拿去发 | 申诉信 + 中文对照 + 邮件话术 | **单列**：信 660px（英文约 70 字符/行），底下跟两条**默认折叠**的附件（中文对照 660px、邮件话术 840px） |
| 四 · 行动路线 | 存管预警 + 三级机构 | 预警**全幅横幅**（它是前置检查，不是步骤，也是唯一高度可变的一块）；机构按**阶段**分三栏 |
| 尾 · 证据档 | 事实索引 | 折叠收尾 |

两条容易踩的：

- **行动路线按 `stage` 分组，不按条目**。升级发生在阶段之间；条目数会变（NSW 4 条、
  VIC 6 条），阶段数恒为 3。按条目编号会让人以为要逐条走完，也会让三栏在换州后错位。
- **手机首屏保持紧凑，留白交给 `md:` 往上加**。第一幕四件事要压在 ~560px 内（§1），
  桌面那套 `py-8` / `mt-6` 直接用在手机上会把「可争议」挤出首屏。

### 4.4 锁定浅色

`:root { color-scheme: light; }` + `<meta name="color-scheme" content="light">`。

**理由不是偷懒，是防御**：微信安卓版的深色模式会对未声明适配的网页强制反色，会把「墨蓝 + 金 + 印章红」整套配色毁掉，而全部用户都在微信里打开链接。不做深色主题——两套值意味着全部页面各测一遍，封版前没有这个时间，且截图与视频只能选一套。

---

## 5. `@theme` 落地代码

写进 `app/globals.css`（材质色保留在 `:root`，语义层在 `@theme inline` 引用它们）：

```css
:root {
  color-scheme: light;

  /* ── 材质色（不直接用于业务组件）── */
  --ink: #12212f;
  --ink-soft: #24384b;
  --paper: #f4f6f8;
  --card: #ffffff;
  --line: #dfe4ea;
  --muted: #5f6d7e;
  --gold: #9c650f;
  --gold-bright: #e8a33d;
  --gold-wash: #fdf3e0;
  --seal: #b93a27;
  --seal-wash: #fbeeec;
  --seal-on-dark: #f0806b;
  --jade: #1c6b5d;
  --jade-wash: #e9f3f0;
  --jade-on-dark: #5fbfa8;

  /* ── 动效 ── */
  --duration-quick: 150ms;
  --duration-settle: 280ms;
  --duration-sweep: 1600ms;
  --duration-beat: 1200ms;
}

@theme inline {
  /* 断点：删掉三个，只留 md / lg */
  --breakpoint-sm: initial;
  --breakpoint-xl: initial;
  --breakpoint-2xl: initial;

  /* 排版 */
  --text-hero: clamp(1.75rem, 1.3rem + 2.2vw, 3rem);
  --text-hero--line-height: 1.1;
  --text-hero--font-weight: 800;
  --text-title: clamp(1.375rem, 1.15rem + 1.1vw, 2rem);
  --text-title--line-height: 1.2;
  --text-title--font-weight: 700;
  --text-section: clamp(1.0625rem, 1rem + 0.4vw, 1.25rem);
  --text-section--line-height: 1.35;
  --text-section--font-weight: 600;
  --text-body: 1rem;
  --text-body--line-height: 1.6;
  --text-label: 0.875rem;
  --text-label--line-height: 1.5;
  --text-caption: 0.8125rem;
  --text-caption--line-height: 1.5;
  --text-micro: 0.6875rem;
  --text-micro--line-height: 1.4;
  --text-micro--letter-spacing: 0.14em;

  /* 语义色：结论 */
  --color-verdict-unlawful: var(--seal);
  --color-verdict-unlawful-wash: var(--seal-wash);
  --color-verdict-unlawful-on-dark: var(--seal-on-dark);
  --color-verdict-doubtful: var(--gold);
  --color-verdict-doubtful-wash: var(--gold-wash);
  --color-verdict-doubtful-on-dark: var(--gold-bright);
  --color-verdict-lawful: var(--jade);
  --color-verdict-lawful-wash: var(--jade-wash);
  --color-verdict-lawful-on-dark: var(--jade-on-dark);

  /* 语义色：金额与状态 */
  --color-amount: var(--ink);
  --color-amount-hero: var(--gold-bright);
  --color-alert-verify: var(--gold);
  --color-alert-risk: var(--seal);
  --color-evidence-used: var(--jade);
  --color-evidence-unused: var(--muted);

  --ease-settle: cubic-bezier(0.22, 1, 0.36, 1);

  /* 既有材质色仍暴露给布局用（bg-ink / border-line 等） */
  --color-ink: var(--ink);
  --color-ink-soft: var(--ink-soft);
  --color-paper: var(--paper);
  --color-card: var(--card);
  --color-line: var(--line);
  --color-muted: var(--muted);
  --color-gold-bright: var(--gold-bright);
}
```

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
