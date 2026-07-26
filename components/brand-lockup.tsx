/**
 * 押金侠的品牌锁定组合。
 *
 * 图形标记来自最终选中的方案一：证据页 + 回转箭头 + 朱红小印。
 * 中英文名称继续用真实网页文字排版，不把字烤进图片里 —— 小尺寸更清楚，
 * 也不会因为生成图中文字失真而损害品牌识别。
 */

import { cx } from "@/components/result/utils";

export interface BrandLockupProps {
  compact?: boolean;
  className?: string;
}

export function BrandLockup({
  compact = false,
  className,
}: BrandLockupProps) {
  return (
    <span
      className={cx(
        "inline-flex shrink-0 items-center",
        compact ? "gap-2" : "gap-2.5",
        className,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/logo-mark.png"
        alt=""
        aria-hidden="true"
        width={compact ? 32 : 48}
        height={compact ? 32 : 48}
        className={
          compact
            ? "size-8 object-contain"
            : "size-10 object-contain md:size-12"
        }
      />
      <span className="flex items-baseline gap-2.5">
        <span
          className={cx(
            "h-shout leading-none text-paper",
            compact ? "text-section" : "text-title",
          )}
        >
          押金侠
        </span>
        <span className="font-mono text-micro text-paper/45">BONDBACK</span>
      </span>
    </span>
  );
}
