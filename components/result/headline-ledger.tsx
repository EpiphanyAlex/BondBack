/**
 * 首屏（03b §1）—— 手机 ~560px 内必须同时看到四件事：
 * 被扣多少 / 可争议多少 / 三条为什么 / 两个 CTA。
 *
 * 主数字坐在深色账本条上是硬性的：`--color-amount-hero` 对浅色纸面只有 1.99:1，
 * 在墨蓝底上才是 7.58:1（design-tokens §2.2）。做法照抄 `components/wizard/ledger-bar.tsx`。
 *
 * 纯 props，不碰路由与会话 —— 04b 首页要单独嵌它。
 */

import type { AnalysisLedger, AnalysisMode, Verdict } from "@/lib/types";

import { cx, formatMoney, money } from "./utils";
import { VERDICT_META, VerdictIcon } from "./verdict";

export interface HeadlineReason {
  key: string;
  /** 哪一笔扣款，如「地毯」 */
  labelZh: string;
  verdict: Verdict;
  /** 一句话为什么 */
  lineZh: string;
}

export interface HeadlineLedgerProps {
  bondAmount: number;
  ledger: AnalysisLedger;
  mode: AnalysisMode;
  /** 首屏的三条「为什么」，一笔一条 */
  reasons?: HeadlineReason[];
  /** 如「NSW」，只用于副标题 */
  stateLabel?: string;
  onSeeDetails?: () => void;
  onWriteLetter?: () => void;
  className?: string;
}

const SEGMENTS: { verdict: Verdict; key: keyof AnalysisLedger }[] = [
  { verdict: "unlawful", key: "unlawfulTotal" },
  { verdict: "doubtful", key: "doubtfulTotal" },
  { verdict: "lawful", key: "lawfulTotal" },
];

export function HeadlineLedger({
  bondAmount,
  ledger,
  mode,
  reasons = [],
  stateLabel,
  onSeeDetails,
  onWriteLetter,
  className,
}: HeadlineLedgerProps) {
  const base = ledger.claimedTotal > 0 ? ledger.claimedTotal : 0;

  return (
    <section className={cx("flex flex-col gap-3", className)}>
      {mode === "burden-shift" ? (
        <p className="rounded-xl border border-verdict-doubtful/40 bg-verdict-doubtful-wash px-3.5 py-2.5 text-label leading-relaxed text-ink">
          <span className="font-semibold">举证责任翻转模式</span>
          <span className="text-muted">
            {" "}
            —— 这次没有读到可引用的证据，下面不给「合法 / 不合法」的断言，
            而是逐笔要求房东先拿出退租报告与发票。
          </span>
        </p>
      ) : null}

      {/* 全站唯一的深色面：金额主数字只能坐在这上面 */}
      <div className="rounded-2xl bg-ink px-4 py-4 text-white md:px-5 md:py-5">
        <p className="font-mono text-micro uppercase text-white/45">
          房东索扣
          {stateLabel ? ` · ${stateLabel}` : null}
        </p>
        <p className="tnum mt-0.5 font-display text-title leading-none font-bold text-white">
          {money(ledger.claimedTotal)}
        </p>

        {/* 三色堆叠条：按 ledger 的三个金额分段 */}
        <div
          className="mt-3 flex h-3 w-full overflow-hidden rounded-full bg-white/12"
          role="img"
          aria-label={`索扣 ${money(ledger.claimedTotal)}，其中不合法 ${money(
            ledger.unlawfulTotal,
          )}、待举证 ${money(ledger.doubtfulTotal)}、合法 ${money(
            ledger.lawfulTotal,
          )}`}
        >
          {SEGMENTS.map(({ verdict, key }) => {
            const amount = ledger[key];
            if (!(amount > 0) || base <= 0) return null;
            return (
              <span
                key={verdict}
                className={cx(
                  "block h-full min-w-[3px]",
                  VERDICT_META[verdict].onDarkBg,
                )}
                style={{ width: `${(amount / base) * 100}%` }}
              />
            );
          })}
        </div>

        {/* 图例只列有金额的档：`$0 合法` 这种空档位是噪音，不是信息 */}
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
          {SEGMENTS.filter(({ key }) => ledger[key] > 0).map(
            ({ verdict, key }) => (
              <li
                key={verdict}
                className={cx(
                  "tnum flex items-center gap-1.5 font-mono text-caption",
                  VERDICT_META[verdict].onDarkText,
                )}
              >
                <VerdictIcon verdict={verdict} size={13} />
                {money(ledger[key])}
                <span>{VERDICT_META[verdict].shortZh}</span>
              </li>
            ),
          )}
        </ul>

        <div className="mt-3 border-t border-ink-soft pt-3">
          <p className="font-mono text-micro uppercase text-white/45">可争议</p>
          <p className="tnum font-display text-hero leading-none font-extrabold text-amount-hero">
            <span className="text-section font-semibold">$</span>
            {formatMoney(ledger.disputableTotal)}
          </p>
          <p className="tnum mt-1.5 text-label text-white/60">
            应退回至少{" "}
            <span className="font-semibold text-white">
              {money(ledger.refundExpected)}
            </span>
            <span className="font-mono text-caption">
              {" "}
              （押金 {money(bondAmount)}）
            </span>
          </p>
        </div>

        {/* 三条「为什么」并进账本条：省掉一整张卡的边距，首屏才装得下四件事 */}
        {reasons.length > 0 ? (
          <ul className="mt-3 flex flex-col gap-1.5 border-t border-ink-soft pt-3">
            {reasons.map((reason) => (
              <li key={reason.key} className="flex items-start gap-2">
                <span
                  className={cx(
                    "mt-0.5",
                    VERDICT_META[reason.verdict].onDarkText,
                  )}
                >
                  <VerdictIcon verdict={reason.verdict} size={14} />
                </span>
                <p className="line-clamp-2 text-label leading-snug text-white/70">
                  <span className="font-semibold text-white">
                    {reason.labelZh}：
                  </span>
                  {reason.lineZh}
                </p>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {onSeeDetails || onWriteLetter ? (
        <div className="grid grid-cols-2 gap-2">
          {onSeeDetails ? (
            <button
              type="button"
              onClick={onSeeDetails}
              className="rounded-xl border border-line bg-card px-3 py-3 text-body font-semibold text-ink transition-colors duration-150 hover:bg-paper"
            >
              看逐项依据
            </button>
          ) : null}
          {onWriteLetter ? (
            <button
              type="button"
              onClick={onWriteLetter}
              className={cx(
                "rounded-xl bg-ink px-3 py-3 text-body font-semibold text-white transition active:scale-[0.99]",
                onSeeDetails ? null : "col-span-2",
              )}
            >
              生成申诉信
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
