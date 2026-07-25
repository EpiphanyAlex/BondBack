/**
 * 账本条 —— 本产品的记忆点。
 *
 * 全站唯一的深色面，钉在拇指区：左边是随输入实时变化的「你要争的钱」，
 * 右边是主行动。它把「填表」变成「有人在替我算账」，也让主 CTA 永远够得着。
 */

import type { ReactNode } from "react";

function formatAud(value: number | undefined): string {
  if (value === undefined) return "—";
  return value.toLocaleString("en-AU", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export function LedgerBar({
  bondAmount,
  claimedAmount,
  primaryLabel,
  onPrimary,
  primaryDisabled = false,
  secondary,
}: {
  bondAmount?: number;
  claimedAmount?: number;
  primaryLabel: string;
  onPrimary: () => void;
  primaryDisabled?: boolean;
  secondary?: ReactNode;
}) {
  const hasNumbers = bondAmount !== undefined || claimedAmount !== undefined;

  return (
    <div className="sticky bottom-0 z-20 border-t border-ink-soft bg-ink text-white">
      <div className="mx-auto max-w-md px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            {hasNumbers ? (
              <>
                <p className="font-mono text-micro uppercase text-white/45">
                  争取金额
                </p>
                <p className="tnum font-display text-title leading-none font-extrabold text-amount-hero">
                  <span className="text-section font-semibold">$</span>
                  {formatAud(claimedAmount)}
                </p>
                <p className="tnum mt-1 font-mono text-micro text-white/45">
                  押金 ${formatAud(bondAmount)} · 被扣 ${formatAud(claimedAmount)}
                </p>
              </>
            ) : (
              <p className="text-caption leading-snug text-white/60">
                传上证据或填完金额，这里会实时算出你在争的钱
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onPrimary}
            disabled={primaryDisabled}
            className="shrink-0 rounded-xl bg-white px-5 py-3 text-body font-semibold text-ink transition active:scale-[0.98] disabled:opacity-40"
          >
            {primaryLabel}
          </button>
        </div>
        {secondary ? <div className="mt-2">{secondary}</div> : null}
      </div>
    </div>
  );
}
