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
  /** 深色账本条上的文字与色块 */
  onDarkText: string;
  onDarkBg: string;
}

export const VERDICT_META: Record<Verdict, VerdictMeta> = {
  unlawful: {
    labelZh: "不合法",
    shortZh: "不合法",
    text: "text-verdict-unlawful",
    wash: "bg-verdict-unlawful-wash",
    border: "border-verdict-unlawful/30",
    onDarkText: "text-verdict-unlawful-on-dark",
    onDarkBg: "bg-verdict-unlawful-on-dark",
  },
  doubtful: {
    labelZh: "待举证",
    shortZh: "待举证",
    text: "text-verdict-doubtful",
    wash: "bg-verdict-doubtful-wash",
    border: "border-verdict-doubtful/40",
    onDarkText: "text-verdict-doubtful-on-dark",
    onDarkBg: "bg-verdict-doubtful-on-dark",
  },
  lawful: {
    labelZh: "合法，别争",
    shortZh: "合法",
    text: "text-verdict-lawful",
    wash: "bg-verdict-lawful-wash",
    border: "border-verdict-lawful/30",
    onDarkText: "text-verdict-lawful-on-dark",
    onDarkBg: "bg-verdict-lawful-on-dark",
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

/** 对照卡标题右侧的结论徽章。 */
export function VerdictBadge({
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
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-label font-semibold",
        meta.border,
        meta.wash,
        meta.text,
        className,
      )}
    >
      <VerdictIcon verdict={verdict} />
      {meta.labelZh}
    </span>
  );
}
