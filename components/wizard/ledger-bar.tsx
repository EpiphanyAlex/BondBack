"use client";

/**
 * 手机底栏 —— 战报栏在小屏上的压缩版（稿子 §02：「手机保留一条 88px 单行动条」）。
 *
 * 只留两件事：一个金额、一个行动。上一版这条里同时塞着金额、押金/被扣两行小字、
 * 主行动和校验提示，正文被两层信息挤压；现在细节全部让给战报栏（≥lg 才有），
 * 手机上只保留拇指够得着的那一下。
 *
 * ≥lg 隐藏：那时右边的 `WarReport` 已经常驻，两条主行动同时在场只会分散。
 */

import type { ReactNode } from "react";

import { money } from "@/components/result/utils";
import { deductionTotal, parseAmount } from "@/lib/case-draft";
import { useCaseSession } from "@/lib/case-session";

export function LedgerBar({
  primaryLabel,
  onPrimary,
  primaryDisabled = false,
  secondary,
}: {
  primaryLabel: string;
  onPrimary: () => void;
  primaryDisabled?: boolean;
  /** 「还差什么」的提示，压在条上面一行 */
  secondary?: ReactNode;
}) {
  const { draft } = useCaseSession();
  const claimed =
    parseAmount(draft.claimedAmount) ?? deductionTotal(draft.deductions);
  const hasClaimed = claimed !== undefined && claimed > 0;

  return (
    <div className="sticky bottom-0 z-20 bg-ink text-paper lg:hidden">
      {secondary ? (
        <div className="border-b border-paper/16 px-4 py-2">{secondary}</div>
      ) : null}

      <div className="flex items-center gap-4 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
        <div className="min-w-0">
          <p className="font-mono text-micro text-paper/45">要争的钱</p>
          <p
            className={`font-number text-num-sm leading-none ${
              hasClaimed ? "text-amount-hero" : "text-amount-hero/35"
            }`}
          >
            {hasClaimed ? money(claimed) : "$0"}
          </p>
        </div>

        <button
          type="button"
          onClick={onPrimary}
          disabled={primaryDisabled}
          className="ml-auto shrink-0 bg-seal px-5 py-3.5 text-body font-bold text-paper transition active:scale-[0.98] disabled:opacity-40"
        >
          {primaryLabel}
        </button>
      </div>
    </div>
  );
}
