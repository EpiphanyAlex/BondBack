/**
 * 第一幕 · 判决（稿子 §04）—— 整幅墨黑的横幅，全站最大的一个数字坐在这里。
 *
 * 顺序是**先说结论、再说钱**：「三笔扣款，两笔站不住。」是一句人话，
 * 用户在看清任何金额之前就知道自己赢面在哪。三色条紧跟其后交代构成。
 *
 * 主数字必须坐在深色面上是硬性的：`--color-amount-hero` 对米白只有 1.9:1，
 * 在墨黑上才安全（design-tokens §2.2）。
 *
 * **本组件自带全幅底色与内层容器**，所以 `ResultView` 不要再把它包进
 * `max-w-[1152px]` 里。纯 props，不碰路由与会话。
 */

import { formatIsoDateZh } from "@/lib/dates";
import type { AnalysisItem, AnalysisLedger, AnalysisMode, Verdict } from "@/lib/types";

import { cx, formatMoney, money } from "./utils";
import { VERDICT_META, VerdictIcon } from "./verdict";

export interface HeadlineLedgerProps {
  bondAmount: number;
  ledger: AnalysisLedger;
  mode: AnalysisMode;
  items: AnalysisItem[];
  /** 如「NSW」 */
  stateLabel?: string;
  propertyAddress?: string;
  moveOutDate?: string;
  onSeeDetails?: () => void;
  onWriteLetter?: () => void;
  className?: string;
}

const SEGMENTS: { verdict: Verdict; key: keyof AnalysisLedger }[] = [
  { verdict: "unlawful", key: "unlawfulTotal" },
  { verdict: "doubtful", key: "doubtfulTotal" },
  { verdict: "lawful", key: "lawfulTotal" },
];

const CN_NUMERALS = ["零", "一", "两", "三", "四", "五", "六", "七", "八", "九", "十"];

/** 「三笔」比「3 笔」像人说的话；超过十就退回阿拉伯数字。 */
function cn(count: number): string {
  return CN_NUMERALS[count] ?? String(count);
}

/**
 * 判决标题。**只根据 ledger 与 items 算，不问 LLM** —— 这句话是整页最响的一句，
 * 不能出现「说两笔站不住、下面却只有一笔红卡」这种自相矛盾。
 */
function headlineZh(items: AnalysisItem[], mode: AnalysisMode): string {
  const total = items.length;
  if (total === 0) return "还没有可判的扣款。";

  if (mode === "burden-shift") {
    return `${cn(total)}笔扣款，先让房东拿证据。`;
  }

  const shaky = items.filter((item) => item.verdict !== "lawful").length;
  if (shaky === 0) return `${cn(total)}笔扣款，房东都占理。`;
  if (shaky === total) return `${cn(total)}笔扣款，笔笔站不住。`;
  return `${cn(total)}笔扣款，${cn(shaky)}笔站不住。`;
}

export function HeadlineLedger({
  bondAmount,
  ledger,
  mode,
  items,
  stateLabel,
  propertyAddress,
  moveOutDate,
  onSeeDetails,
  onWriteLetter,
  className,
}: HeadlineLedgerProps) {
  const base = ledger.claimedTotal > 0 ? ledger.claimedTotal : 0;
  const legend = SEGMENTS.filter(({ key }) => ledger[key] > 0);

  const meta = [
    stateLabel,
    propertyAddress,
    moveOutDate ? `退租 ${formatIsoDateZh(moveOutDate)}` : null,
  ].filter(Boolean);

  return (
    <section className={cx("bg-ink text-paper", className)}>
      <div className="mx-auto w-full max-w-[1152px] px-4 py-10 md:px-6 md:py-12">
        {mode === "burden-shift" ? (
          <p className="mb-6 border-l-2 border-verdict-doubtful-on-dark pl-4 text-label text-paper/75">
            <span className="font-bold text-verdict-doubtful-on-dark">
              举证责任翻转模式
            </span>
            {" —— "}
            这次没有读到可引用的证据，下面不给「合法 / 不合法」的断言，
            而是逐笔要求房东先拿出退租报告与发票。
          </p>
        ) : null}

        <div className="lg:flex lg:items-end lg:justify-between lg:gap-12">
          <div className="min-w-0">
            <p className="font-mono text-micro text-amount-hero">
              判决{meta.length > 0 ? ` · ${meta.join(" · ")}` : null}
            </p>
            <h1 className="h-shout mt-3 text-display">
              {headlineZh(items, mode)}
            </h1>
            <p className="mt-3.5 text-body text-paper/60">
              房东索扣 {money(ledger.claimedTotal)} · 押金 {money(bondAmount)}
            </p>
          </div>

          {/* 可争议：整页最大的一个数字，只能坐在这块深色上。
              名头走在数字底下，不压在右上角 —— 原来「可争议」是 micro + 55% 透明度
              右对齐吊在数字肩上，字小、对比又弱，在整页最大的一个数字旁边根本读不到，
              看着像被挤出去的一截。战报卡上早就是「数字 → 可争议扣款」这个顺序，
              这里跟上：先给钱，再说这笔钱是什么。 */}
          <div className="mt-7 shrink-0 lg:mt-0 lg:text-right">
            <p className="font-number text-num-xl leading-[0.82] text-amount-hero">
              {formatMoney(ledger.disputableTotal) === "—"
                ? "—"
                : `$${formatMoney(ledger.disputableTotal)}`}
            </p>
            <p className="mt-3 text-section font-bold text-paper">可争议扣款</p>
            <p className="mt-2 text-body text-paper/75">
              应退回至少{" "}
              <span className="font-bold text-paper">
                {money(ledger.refundExpected)}
              </span>
            </p>
          </div>
        </div>

        {/* 三色条：整幅横条铺开，它是「这笔钱由什么构成」的一眼答案 */}
        <div
          className="mt-8 flex h-4 w-full bg-paper/12 md:h-[18px]"
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
                className={cx("block h-full min-w-[3px]", VERDICT_META[verdict].fill)}
                style={{ width: `${(amount / base) * 100}%` }}
              />
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-x-8 gap-y-5">
          {/* 图例只列有金额的档：`$0 合法` 这种空档位是噪音，不是信息 */}
          <ul className="flex flex-wrap gap-x-7 gap-y-2">
            {legend.map(({ verdict, key }) => (
              <li
                key={verdict}
                className={cx(
                  "flex items-center gap-2 font-mono text-caption",
                  VERDICT_META[verdict].onDarkText,
                )}
              >
                <VerdictIcon verdict={verdict} size={13} />
                {money(ledger[key])}
                <span>{VERDICT_META[verdict].shortZh}</span>
              </li>
            ))}
          </ul>

          {onSeeDetails || onWriteLetter ? (
            <div className="flex flex-1 gap-3 md:flex-none">
              {onWriteLetter ? (
                <button
                  type="button"
                  onClick={onWriteLetter}
                  className="flex-1 bg-seal px-6 py-3.5 text-body font-bold text-paper transition-colors duration-150 hover:bg-seal/90 md:flex-none md:px-7"
                >
                  拿信去发
                </button>
              ) : null}
              {onSeeDetails ? (
                <button
                  type="button"
                  onClick={onSeeDetails}
                  className="flex-1 border border-paper/35 px-6 py-3.5 text-body font-bold text-paper transition-colors duration-150 hover:bg-paper/10 md:flex-none md:px-7"
                >
                  逐笔看依据
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
