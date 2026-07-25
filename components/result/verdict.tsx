/**
 * 三档结论的唯一出口（03b）。
 *
 * 红线：**不得只靠颜色传达结论** —— 图标 + 颜色 + 中文标签必须同时在场
 * （design-tokens §2.1）。所以本文件把三者绑在一起导出，别处不要再各画一个圆点。
 * 图标形状本身可区分（圆叉 / 三角叹号 / 圆勾），灰度打印或色觉障碍下也读得出。
 */

import type { Verdict } from "@/lib/types";

import { cx } from "./utils";

interface VerdictMeta {
  /** 完整中文标签，对照卡与首屏用 */
  labelZh: string;
  /** 图例里的短标签，360px 下不换行 */
  shortZh: string;
  /** 浅色纸面上的文字色 */
  text: string;
  /** 浅色衬底 */
  wash: string;
  border: string;
  /** 实色边框，给引语的左侧竖线这类要「有力」的地方 */
  borderStrong: string;
  /** 块面：对照卡头、三色条这类整片铺色的地方（金当块面好看，当文字读不清）*/
  fill: string;
  /** 卡头铺满块面之后，压在上面的字该用什么颜色 */
  onFillText: string;
  /** 墨黑面上的文字、边框与衬底 */
  onDarkText: string;
  onDarkBg: string;
  onDarkBorder: string;
  onDarkWash: string;
}

export const VERDICT_META: Record<Verdict, VerdictMeta> = {
  unlawful: {
    labelZh: "不合法",
    shortZh: "不合法",
    text: "text-verdict-unlawful",
    wash: "bg-verdict-unlawful-wash",
    border: "border-verdict-unlawful/30",
    borderStrong: "border-verdict-unlawful-fill",
    fill: "bg-verdict-unlawful-fill",
    onFillText: "text-paper",
    onDarkText: "text-verdict-unlawful-on-dark",
    onDarkBg: "bg-verdict-unlawful-on-dark",
    onDarkBorder: "border-verdict-unlawful-fill/55",
    onDarkWash: "bg-verdict-unlawful-fill/12",
  },
  doubtful: {
    labelZh: "待举证",
    shortZh: "待举证",
    text: "text-verdict-doubtful",
    wash: "bg-verdict-doubtful-wash",
    border: "border-verdict-doubtful/40",
    borderStrong: "border-verdict-doubtful-fill",
    fill: "bg-verdict-doubtful-fill",
    // 金块面很亮，压墨黑字才读得出（浅底文字色 #9A6A10 在金上反而糊）
    onFillText: "text-ink",
    onDarkText: "text-verdict-doubtful-on-dark",
    onDarkBg: "bg-verdict-doubtful-on-dark",
    onDarkBorder: "border-verdict-doubtful-fill/55",
    onDarkWash: "bg-verdict-doubtful-fill/12",
  },
  lawful: {
    labelZh: "合法，别争",
    shortZh: "合法",
    text: "text-verdict-lawful",
    wash: "bg-verdict-lawful-wash",
    border: "border-verdict-lawful/30",
    borderStrong: "border-verdict-lawful-fill",
    fill: "bg-verdict-lawful-fill",
    onFillText: "text-paper",
    onDarkText: "text-verdict-lawful-on-dark",
    onDarkBg: "bg-verdict-lawful-on-dark",
    onDarkBorder: "border-verdict-lawful-fill/55",
    onDarkWash: "bg-verdict-lawful-fill/14",
  },
};

/** 形状可区分：圆叉 / 三角叹号 / 圆勾。全部 currentColor，深浅底都能用。 */
export function VerdictIcon({
  verdict,
  size = 16,
  className,
}: {
  verdict: Verdict;
  size?: number;
  className?: string;
}) {
  const common = {
    viewBox: "0 0 24 24",
    width: size,
    height: size,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    className: cx("shrink-0", className),
  };

  if (verdict === "unlawful") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="M9 9l6 6M15 9l-6 6" />
      </svg>
    );
  }

  if (verdict === "doubtful") {
    return (
      <svg {...common}>
        <path d="M12 3.5L22 20H2z" />
        <path d="M12 10v4M12 17.2v.1" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.4l2.7 2.7L16 9.8" />
    </svg>
  );
}

/**
 * 结论徽章。方角（这一版全站零圆角），`tone="dark"` 给墨黑面上用 ——
 * 浅底那套边框与衬底放到墨黑上会糊成一团。
 */
export function VerdictBadge({
  verdict,
  tone = "light",
  className,
}: {
  verdict: Verdict;
  tone?: "light" | "dark";
  className?: string;
}) {
  const meta = VERDICT_META[verdict];
  const dark = tone === "dark";
  return (
    <span
      className={cx(
        "inline-flex shrink-0 items-center gap-1.5 border px-3 py-1.5 text-label font-bold",
        dark ? meta.onDarkBorder : meta.border,
        dark ? meta.onDarkWash : meta.wash,
        dark ? meta.onDarkText : meta.text,
        className,
      )}
    >
      <VerdictIcon verdict={verdict} size={15} />
      {meta.labelZh}
    </span>
  );
}

/**
 * 结论印章 —— 本版的签名元素，只出现在结果页 ≥lg 的页边批注栏里。
 *
 * 配色里一直有一档叫「印章红」，却从没真画过一枚印。产品做的事就是**逐项判决**，
 * 所以每笔扣款在页边被盖一枚章：双边框、微微歪、盖在纸上。
 *
 * 三档共用同一枚章的形制，只换颜色与字 —— 章是「判决」这个动作的符号，
 * 不是三种装饰。红线照旧：图标 + 颜色 + 中文标签同时在场，不靠颜色单打独斗。
 * 歪角是静态 transform，不是动画，`prefers-reduced-motion` 无需介入。
 */
export function VerdictSeal({
  verdict,
  className,
}: {
  verdict: Verdict;
  className?: string;
}) {
  const meta = VERDICT_META[verdict];
  return (
    <span
      className={cx(
        "relative inline-flex size-20 shrink-0 rotate-[-6deg] flex-col items-center justify-center gap-1 rounded-md border-2 bg-card",
        meta.border,
        meta.text,
        className,
      )}
    >
      {/* 内圈细框：传统印章的双边，也把章面和纸面分开 */}
      <span
        aria-hidden="true"
        className={cx(
          "pointer-events-none absolute inset-[3px] rounded-sm border",
          meta.border,
          meta.wash,
        )}
      />
      <VerdictIcon verdict={verdict} size={22} className="relative" />
      <span className="relative text-label font-semibold">{meta.shortZh}</span>
    </span>
  );
}
