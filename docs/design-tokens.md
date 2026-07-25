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
| 结果页 / 示例页双栏容器 | `max-w-[1152px]` |
| 结果页右侧栏（信、路线图、证据档） | 固定 `380px`，左栏 `1fr` |

**最窄支持 360px**：账本条在此宽度下金额与按钮换成两行，不得溢出或横向滚动。

### 4.3 三类页面的桌面形态

```
首页 ≥lg                        结果页 / 示例页 ≥lg
┌──────────┬──────────┐        ┌────────────────┬──────────┐
│ 标题+简介 │          │        │ 账本条 $1,306   │ 英文信    │
│ 双入口    │  对照卡   │        │ 可争议 $1,120   │（sticky） │
│          │（真实静态）│        ├────────────────┤──────────┤
└──────────┴──────────┘        │ 对照卡 ①❌      │ 行动路线  │
                                │ 对照卡 ②⚠      ├──────────┤
向导 ≥lg                        │ 对照卡 ③✅      │ 证据档    │
  单列加宽到 720px，不分栏       └────────────────┴──────────┘
（多栏表单是公认反模式）          手机：全部堆回单列，顺序不变
```

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

这一节是工单。**它不只是 token——它是所有并行工作的契约冻结点。**顺序执行：

### 7.1 视觉层

- [ ] §5 的 `@theme` 块写入 `app/globals.css`（材质色留在 `:root`，语义层在 `@theme inline` 引用）
- [ ] `app/layout.tsx` 加 `<meta name="color-scheme" content="light">`
- [ ] `package.json` 加 `"check:tokens"` 脚本
- [ ] 按 §1 对照表收编现有 27 处任意字号（主要在 `components/wizard/**` 与 `components/wizard/ledger-bar.tsx`）
- [ ] `pnpm check:tokens` 跑通并清零
- [ ] `pnpm build` 通过（确认 `--breakpoint-*: initial` 与 `clamp()` 编译无误）

### 7.2 契约冻结（**冻结后任何 agent 不得再改这两个文件**）

- [ ] `lib/types.ts`：按 `docs/prd/03a-analysis-pipeline.md` 与 `03b-result-page.md` 补齐 `EvidenceFact`、`EvidenceRef`、`StatuteRef`（加 `quote`/`sourceUrl`）、`AnalysisItem.checks`、`AnalysisItem.evidenceRefs`、`AnalysisItem.disputableAmount`、`AnalysisItem.paragraphEn`、`AnalysisResult.mode`、`AnalysisResult.facts`、`AnalysisResult.ledger`、`ReplayBeat`
- [ ] `lib/ai.ts`：三个模型常量 `EXTRACT_MODEL='gpt-5.4-nano'`、`FACTS_MODEL='gpt-5.6-luna'`、`ANALYZE_MODEL='gpt-5.6-luna'`

### 7.3 依赖一次装完（**避免多个 agent 同时 `pnpm add` 打烂 lockfile**）

- [ ] `pnpm add jspdf html-to-image qrcode`（+ `@types/qrcode`）

### 7.4 模型冒烟测试（读不准就没有第二层）

- [ ] 参数：确认 gpt-5.x 接受 `max_completion_tokens` + `reasoning_effort`，拒绝 `max_tokens`
- [ ] structured outputs：JSON schema 严格模式可用
- [ ] 延迟：单次 `FACTS_MODEL` 调用（4 张图）在 `maxDuration = 60` 内有充足余量
- [ ] 读取能力：能从一张扫描版入住报告里准确读出 `existing stains` 那一行
- [ ] 读不准 → 沿升级梯子把 `FACTS_MODEL` 升到 `gpt-5.6-terra` 再测

**四组全勾 = 具备扇出资格。** 未勾就扇出，会得到三套互不一致的视觉、三种猜出来的红色，以及一个被并发写坏的 lockfile。
