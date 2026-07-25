/**
 * 第一幕 · 判决（03b §1）—— 手机 ~560px 内必须同时看到四件事：
 * 被扣多少 / 可争议多少 / 三条为什么 / 两个 CTA。
 *
 * 主数字坐在深色面上是硬性的：`--color-amount-hero` 对浅色纸面只有 1.99:1，
 * 在墨蓝底上才是 7.58:1（design-tokens §2.2）。
 *
 * **本组件自带全幅底色与内层容器**，所以 `ResultView` 不要再把它包进
 * `max-w-[1152px]` 里 —— 墨蓝从「740px 栏里的一张卡」改成整幅横条，
 * 是全站唯一的深色面，也是这一版的结构锚点（design-tokens §4.3）。
 *
 * 纯 props，不碰路由与会话。
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
  const legend = SEGMENTS.filter(({ key }) => ledger[key] > 0);

  return (
    <section className={cx("bg-ink text-white", className)}>
      {/*
        手机首屏预算只有 ~560px，四件事必须全装进去（design-tokens §1），
        所以**手机保持紧凑，留白交给 md: 往上加** —— 这正是 §4.1 给 md: 的职责。
      */}
      <div className="mx-auto w-full max-w-[1152px] px-4 py-5 md:px-6 md:py-8">
        {mode === "burden-shift" ? (
          <p className="mb-4 border-l-2 border-verdict-doubtful-on-dark pl-3.5 text-body leading-relaxed text-white/75 md:mb-5">
            <span className="font-semibold text-verdict-doubtful-on-dark">
              举证责任翻转模式
            </span>
            {" —— "}
            这次没有读到可引用的证据，下面不给「合法 / 不合法」的断言，
            而是逐笔要求房东先拿出退租报告与发票。
          </p>
        ) : null}

        {/*
          ≥lg 三分：索扣（来处）│ 三色条（构成）│ 可争议（去处）。
          手机上塌回单列，顺序不变 —— 先看被扣多少，再看能争多少。
        */}
        <div className="lg:grid lg:grid-cols-[auto_1fr_auto] lg:items-end lg:gap-10">
          <div>
            <p className="font-mono text-micro uppercase text-white/65">
              房东索扣
              {stateLabel ? ` · ${stateLabel}` : null}
            </p>
            <p className="tnum mt-1 font-display text-title leading-none font-bold text-white">
              {money(ledger.claimedTotal)}
            </p>
            <p className="tnum mt-1.5 font-mono text-caption text-white/65">
              押金 {money(bondAmount)}
            </p>
          </div>

          {/* 三色堆叠条：按 ledger 的三个金额分段。桌面上有整条横幅的宽度可用 */}
          <div className="mt-4 lg:mt-0">
            <div
              className="flex h-4 w-full overflow-hidden rounded-full bg-white/12"
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
            <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5">
              {legend.map(({ verdict, key }) => (
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
              ))}
            </ul>
          </div>

          {/* 可争议：整页最大的一个数字，只能坐在这块深色上 */}
          <div className="mt-4 border-t border-ink-soft pt-3.5 lg:mt-0 lg:border-t-0 lg:pt-0 lg:text-right">
            <p className="font-mono text-micro uppercase text-white/65">可争议</p>
            <p className="tnum font-display text-hero leading-none font-extrabold text-amount-hero">
              <span className="text-section font-semibold">$</span>
              {formatMoney(ledger.disputableTotal)}
            </p>
            <p className="tnum mt-1.5 text-label text-white/75">
              应退回至少{" "}
              <span className="font-semibold text-white">
                {money(ledger.refundExpected)}
              </span>
            </p>
          </div>
        </div>

        {/* 三条「为什么」：桌面并排三栏，不再是深色卡里挤着的三行小字 */}
        {reasons.length > 0 ? (
          <ul className="mt-4 grid gap-2.5 border-t border-ink-soft pt-4 md:mt-6 md:pt-5 lg:grid-cols-3 lg:gap-6">
            {reasons.map((reason) => (
              <li key={reason.key} className="flex items-start gap-2.5">
                <span
                  className={cx(
                    "mt-0.5",
                    VERDICT_META[reason.verdict].onDarkText,
                  )}
                >
                  <VerdictIcon verdict={reason.verdict} size={15} />
                </span>
                {/* 首屏预算有限，一条只给两行；完整理由在下面的对照卡里 */}
                <p className="line-clamp-2 text-label leading-relaxed text-white/75">
                  <span className="font-semibold text-white">
                    {reason.labelZh}：
                  </span>
                  {reason.lineZh}
                </p>
              </li>
            ))}
          </ul>
        ) : null}

        {/* CTA 进横幅内部：它们属于「判决」这一刻，配色也就跟着走深色面。
            手机上两颗并排各占一半（首屏装得下）；≥md 收成自然宽度，不横铺一整条 */}
        {onSeeDetails || onWriteLetter ? (
          <div className="mt-5 flex gap-2.5 md:mt-6 md:gap-3">
            {onWriteLetter ? (
              <button
                type="button"
                onClick={onWriteLetter}
                className="flex-1 rounded-xl bg-white px-5 py-3 text-body font-semibold text-ink transition active:scale-[0.99] md:flex-none md:px-6"
              >
                生成申诉信
              </button>
            ) : null}
            {onSeeDetails ? (
              <button
                type="button"
                onClick={onSeeDetails}
                className="flex-1 rounded-xl border border-white/30 px-5 py-3 text-body font-semibold text-white transition-colors duration-150 hover:bg-white/10 md:flex-none md:px-6"
              >
                看逐项依据
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
