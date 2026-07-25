"use client";

/**
 * 逐项对照卡 —— 整个产品的差异化就长在这张卡上。
 *
 * 「江湖战报」稿的形态：**卡头整片铺结论色**（朱红 / 金 / 石青）+ Anton 大金额，
 * 卡身左右两栏「证据 ↔ 法条」，页脚一条「可争 $X」。方角，无圆角。
 *
 * 为什么卡头铺色：上一版结论只是标题旁的一枚小徽章，三张卡摞起来长得一模一样。
 * 铺色之后，横着滑过三张卡就是「红 → 金 → 青」，结论在看清字之前已经传达完了。
 * 红线照旧：颜色不单打独斗，卡头同时写着中文标签、配着图标。
 *
 * 收起时给的是**一眼能用的结论**（引语 + 法条 + 一句为什么）；完整推理、三轴检查、
 * 法条原文与官方链接都在「展开完整推理」里，一条都没丢。
 *
 * 纯 props：`onFactClick` 由外层接到入住报告原件的定位 API 上。
 */

import { useMemo, useState } from "react";

import type {
  AnalysisItem,
  CheckState,
  ContractObligationState,
  EvidenceFact,
  StatuteRef,
  Verdict,
} from "@/lib/types";

import { cx, factsById, money, shortActName } from "./utils";
import { VERDICT_META, VerdictIcon } from "./verdict";

/** 卡头第一行：结论 + 它对这笔钱意味着什么。 */
const HEADER_NOTE: Record<Verdict, string> = {
  unlawful: "不合法 · 可争",
  doubtful: "待举证 · 球踢回去",
  lawful: "合法 · 别争",
};

/**
 * 合同轴的文案。红线：`absent` 只能说「未见」不能说「没有」——
 * lease 往往只读了前几页，用部分样本断言全量缺失站不住。
 */
const CONTRACT_TEXT: Record<ContractObligationState, string> = {
  exists: "合约里确有这项义务条款。",
  // 「未见」不可改成「没有」（军规）：只读了上传的那几页，断言全量缺失站不住
  absent:
    "你上传的合约页中未见这项义务。只读了几页，不能断言「没有」—— 所以不判不合法，改为要房东指出条款、出示单据。",
  unknown: "合约里有没有这项义务：未知（相关页面没有读到）。",
  "n-a": "这一笔与合约义务无关。",
};

/** `unknown` / `n-a` 一律不得显示成「否」（红线）；`n-a` 直接省略该 chip。 */
const PRE_EXISTING_TEXT: Record<CheckState, string | null> = {
  yes: "入住时就已存在",
  no: "入住时不存在",
  unknown: "入住时是否存在：未知",
  "n-a": null,
};

const FAIR_WEAR_TEXT: Record<CheckState, string | null> = {
  yes: "属于合理磨损",
  no: "不属于合理磨损",
  unknown: "是否属合理磨损：未知",
  "n-a": null,
};

export interface ComparisonCardProps {
  item: AnalysisItem;
  /** 1 起的序号，落在卡头的等宽小标签里 */
  ordinal?: number;
  /** 本次全部事实，用来把 `evidenceRefs[].factId` 解引用 */
  facts?: EvidenceFact[];
  /** 点证据引语 → 外层负责滚动并高亮到原件。只有带 `anchorId` 的事实才可点 */
  onFactClick?: (fact: EvidenceFact) => void;
  className?: string;
  id?: string;
}

export function ComparisonCard({
  item,
  ordinal,
  facts = [],
  onFactClick,
  className,
  id,
}: ComparisonCardProps) {
  const lookup = useMemo(() => factsById(facts), [facts]);
  const meta = VERDICT_META[item.verdict];
  const [open, setOpen] = useState(false);

  const refs = item.evidenceRefs
    .map((ref) => ({ ref, fact: lookup.get(ref.factId) }))
    .filter(
      (entry): entry is { ref: (typeof item.evidenceRefs)[number]; fact: EvidenceFact } =>
        Boolean(entry.fact),
    );

  const chips = [
    PRE_EXISTING_TEXT[item.checks.preExisting],
    FAIR_WEAR_TEXT[item.checks.fairWearTear],
  ].filter((text): text is string => Boolean(text));

  /* 「合法，别争」那张不分栏：它没有要争的东西，两栏会空掉一半。 */
  const singleColumn = item.verdict === "lawful" && refs.length === 0;

  return (
    <article
      id={id}
      className={cx("flex flex-col border border-line bg-card", className)}
    >
      <header
        className={cx(
          "flex flex-wrap items-end justify-between gap-x-4 gap-y-2 px-5 py-5 md:px-7 md:py-6",
          meta.fill,
          meta.onFillText,
        )}
      >
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 font-mono text-micro opacity-80">
            <VerdictIcon verdict={item.verdict} size={13} />
            {HEADER_NOTE[item.verdict]}
            {ordinal ? ` · 第 ${ordinal} 笔` : null}
          </p>
          <h4 className="h-shout mt-2 text-title">{item.description}</h4>
        </div>
        <p className="font-number text-num-md leading-none">
          {money(item.amount)}
        </p>
      </header>

      <div
        className={cx(
          "grid gap-6 px-5 py-6 md:px-7",
          singleColumn ? null : "lg:grid-cols-2 lg:gap-7",
        )}
      >
        {/* ── 证据 ── */}
        <div className="min-w-0">
          {refs.length === 0 ? (
            <p className="text-label text-muted">
              {item.verdict === "lawful"
                ? "这一笔房东占理，无需援引证据 —— 大方认下能扣的那笔，其余的争议反而更站得住。"
                : "本次材料里没有读到可直接引用的行，所以改为逐笔要房东举证。"}
            </p>
          ) : (
            <ul className="flex flex-col gap-5">
              {refs.map(({ ref, fact }) => (
                <li key={ref.factId}>
                  <EvidenceLine
                    fact={fact}
                    noteZh={ref.noteZh}
                    verdict={item.verdict}
                    onFactClick={onFactClick}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ── 法条 ── */}
        {singleColumn ? null : (
          <div className="min-w-0">
            <p className="font-mono text-micro text-faint">
              {item.statuteRefs.length > 0
                ? `法条 · ${item.statuteRefs.length} 条压着它`
                : "法条"}
            </p>
            {item.statuteRefs.length === 0 ? (
              <p className="mt-2.5 text-label text-muted">
                本项没有援引具体法条。
              </p>
            ) : (
              <ul className="mt-2.5 flex flex-col gap-2">
                {item.statuteRefs.map((statute) => (
                  <li key={`${statute.act}-${statute.section}`}>
                    <span className="inline-block bg-ink px-3 py-2 font-mono text-caption font-semibold text-paper">
                      {statute.section}
                      <span className="ml-2 font-normal text-paper/55">
                        {shortActName(statute.act)}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3.5 text-label text-muted">
              {CONTRACT_TEXT[item.checks.contractObligation]}
            </p>
          </div>
        )}
      </div>

      {/* ── 展开：完整推理 + 三轴 + 法条原文与出处 ── */}
      {open ? (
        <div className="border-t border-line px-5 pb-6 md:px-7">
          <p className="mt-5 font-mono text-micro text-faint">完整推理</p>
          <p className="mt-2 text-body text-ink">{item.reasoningZh}</p>

          {chips.length > 0 ? (
            <ul className="mt-4 flex flex-wrap gap-2">
              {chips.map((text) => (
                <li
                  key={text}
                  className="border border-line bg-paper px-2.5 py-1 text-caption text-muted"
                >
                  {text}
                </li>
              ))}
            </ul>
          ) : null}

          {item.statuteRefs.length > 0 ? (
            <ul className="mt-5 flex flex-col gap-4">
              {item.statuteRefs.map((statute) => (
                <li key={`${statute.act}-${statute.section}-quote`}>
                  <StatuteQuote statute={statute} />
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <footer className="mt-auto flex items-center justify-between gap-4 border-t border-line bg-paper px-5 py-3.5 md:px-7">
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
          className="font-mono text-micro text-faint underline underline-offset-4 transition-colors duration-150 hover:text-ink"
        >
          {open ? "收起推理" : "展开完整推理 · 法条原文"}
        </button>
        <span
          className={cx(
            "shrink-0 font-number text-num-sm leading-none",
            item.disputableAmount > 0 ? meta.text : "text-faint",
          )}
        >
          {item.disputableAmount > 0
            ? `可争 ${money(item.disputableAmount)}`
            : "不争议"}
        </span>
      </footer>
    </article>
  );
}

/* ── 证据行：引语用左侧竖线，有 anchorId 才做成可点的定位按钮 ─────────── */

function EvidenceLine({
  fact,
  noteZh,
  verdict,
  onFactClick,
}: {
  fact: EvidenceFact;
  noteZh?: string;
  verdict: Verdict;
  onFactClick?: (fact: EvidenceFact) => void;
}) {
  // 没有 anchorId 就不做成可点的假按钮 —— 点了没反应比不可点更糟
  const clickable = Boolean(fact.anchorId && onFactClick);
  const meta = VERDICT_META[verdict];

  return (
    <div>
      <p className="font-mono text-micro text-faint">证据 · {fact.locator}</p>
      <p
        className={cx(
          "mt-2.5 border-l-[3px] pl-3.5 font-mono text-section leading-normal text-ink",
          meta.borderStrong,
        )}
      >
        “{fact.quote}”
      </p>
      {noteZh ? (
        <p className="mt-3 text-label text-muted">{noteZh}</p>
      ) : null}
      {clickable ? (
        <button
          type="button"
          onClick={() => onFactClick?.(fact)}
          className="mt-3 inline-flex items-center gap-1 border-b border-ink pb-0.5 font-mono text-micro text-ink"
        >
          定位原件
          <LocateIcon />
        </button>
      ) : null}
    </div>
  );
}

function LocateIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="12"
      height="12"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 4v13M7 12l5 5 5-5" />
    </svg>
  );
}

/* ── 展开后的法条原文：原句 + 法案全名 + 官方出处 ────────────────────── */

function StatuteQuote({ statute }: { statute: StatuteRef }) {
  return (
    <div className="border-l-[3px] border-ink pl-3.5">
      <p className="font-mono text-caption font-semibold text-ink">
        {statute.section}
      </p>
      <p className="mt-1.5 font-mono text-caption text-muted">
        “{statute.quote}”
      </p>
      <a
        href={statute.sourceUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-1.5 inline-flex items-center gap-1 font-mono text-micro text-ink underline underline-offset-4"
      >
        {statute.act}
        <ExternalIcon />
      </a>
    </div>
  );
}

function ExternalIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="12"
      height="12"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M14 4h6v6M20 4l-8 8M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5" />
    </svg>
  );
}
