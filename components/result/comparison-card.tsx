"use client";

/**
 * 逐项对照卡（03b §2）—— 整个产品的差异化就长在这张卡上。
 *
 * 固定四行：证据 / 合同 / 法条 / 结论，外加一条「可争议 $X」页脚。
 * 「扣款 ↔ 证据 ↔ 合同 ↔ 法条」的对应关系必须一眼看懂，所以四行的顺序与标签
 * 不随数据变化，缺什么就说缺什么，不塌行。
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
} from "@/lib/types";

import { cx, factsById, money, shortActName } from "./utils";
import { VERDICT_META, VerdictBadge } from "./verdict";

const ORDINALS = ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨"];

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
  /** 1 起的序号，用于 ①②③ */
  ordinal?: number;
  /** 本次全部事实，用来把 `evidenceRefs[].factId` 解引用 */
  facts?: EvidenceFact[];
  /** 点证据引语 → 外层负责滚动并高亮到原件。只有带 `anchorId` 的事实才可点 */
  onFactClick?: (fact: EvidenceFact) => void;
  /**
   * 结果页 ≥lg 把结论印章放到页边批注栏里，卡内徽章就该让位（否则同一个结论说两遍）。
   * 手机上没有页边，徽章照旧 —— 所以是 `lg:hidden` 而不是不渲染。
   * 首页与 `/sample` 单独嵌这张卡时不传，徽章全程在场。
   */
  sealInMargin?: boolean;
  className?: string;
  id?: string;
}

export function ComparisonCard({
  item,
  ordinal,
  facts = [],
  onFactClick,
  sealInMargin = false,
  className,
  id,
}: ComparisonCardProps) {
  const lookup = useMemo(() => factsById(facts), [facts]);
  const meta = VERDICT_META[item.verdict];
  const [openStatute, setOpenStatute] = useState<string | null>(null);

  const refs = item.evidenceRefs
    .map((ref) => ({ ref, fact: lookup.get(ref.factId) }))
    .filter((entry): entry is { ref: (typeof item.evidenceRefs)[number]; fact: EvidenceFact } =>
      Boolean(entry.fact),
    );

  const chips = [
    PRE_EXISTING_TEXT[item.checks.preExisting],
    FAIR_WEAR_TEXT[item.checks.fairWearTear],
  ].filter((text): text is string => Boolean(text));

  return (
    <article
      id={id}
      className={cx(
        "overflow-hidden rounded-2xl border border-line bg-card",
        className,
      )}
    >
      <header
        className={cx(
          "flex flex-wrap items-start justify-between gap-x-3 gap-y-2 px-4 py-3 md:px-5",
          meta.wash,
        )}
      >
        <div className="min-w-0 flex-1">
          <p className="text-section text-ink">
            {ordinal ? (
              <span className="mr-1.5 font-mono text-muted">
                {ORDINALS[ordinal - 1] ?? ordinal}
              </span>
            ) : null}
            {item.description}
          </p>
          {/* 数字吃展示体：中文标题拿不到 Bricolage（只载了 latin subset），
              所以排版的主角让给金额 —— 这也正是「账本」该有的样子 */}
          <p className="tnum mt-0.5 font-display text-section font-semibold text-amount">
            {money(item.amount)}
          </p>
        </div>
        <VerdictBadge
          verdict={item.verdict}
          className={cx(sealInMargin && "lg:hidden")}
        />
      </header>

      <dl className="flex flex-col">
        <Row label="证据">
          {refs.length === 0 ? (
            <p className="text-body text-muted">
              {item.verdict === "lawful"
                ? "这一笔不争议，无需援引证据。"
                : "本次材料里没有读到可直接引用的行。"}
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {refs.map(({ ref, fact }) => (
                <li key={`${ref.factId}`}>
                  <EvidenceLine
                    fact={fact}
                    noteZh={ref.noteZh}
                    onFactClick={onFactClick}
                  />
                </li>
              ))}
            </ul>
          )}
        </Row>

        <Row label="合同">
          <p className="text-body leading-relaxed text-ink">
            {CONTRACT_TEXT[item.checks.contractObligation]}
          </p>
          {chips.length > 0 ? (
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {chips.map((text) => (
                <li
                  key={text}
                  className="rounded-full border border-line bg-paper px-2 py-0.5 text-caption text-muted"
                >
                  {text}
                </li>
              ))}
            </ul>
          ) : null}
        </Row>

        <Row label="法条">
          {item.statuteRefs.length === 0 ? (
            <p className="text-body text-muted">本项没有援引具体法条。</p>
          ) : (
            /* 收起时按内容宽度横向排：三条法条挤成一行三枚小牌，
               而不是三根几乎全空的横条。展开的那一条撑满整行放原文。
               展开态提到卡片这一层：同时只开一条，横排才不会跳来跳去。 */
            <ul className="flex flex-wrap items-start gap-2">
              {item.statuteRefs.map((statute) => {
                const key = `${statute.act}-${statute.section}`;
                const open = openStatute === key;
                return (
                  <li key={key} className={cx(open && "w-full")}>
                    <StatuteLine
                      statute={statute}
                      open={open}
                      onToggle={() => setOpenStatute(open ? null : key)}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </Row>

        <Row label="结论" last>
          <p className="text-body leading-relaxed text-ink">
            {item.reasoningZh}
          </p>
        </Row>
      </dl>

      <footer className="flex items-baseline justify-between gap-3 border-t border-line bg-paper px-4 py-2.5 md:px-5">
        <span className="font-mono text-micro uppercase text-muted">
          {item.disputableAmount > 0 ? "可争议" : "不争议"}
        </span>
        <span className={cx("tnum font-mono text-body font-semibold", meta.text)}>
          {item.disputableAmount > 0 ? money(item.disputableAmount) : "—"}
        </span>
      </footer>
    </article>
  );
}

/* ── 四行的统一骨架 ───────────────────────────────────────────────────── */

function Row({
  label,
  last = false,
  children,
}: {
  label: string;
  last?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cx(
        "grid grid-cols-[2.75rem_1fr] gap-x-3 px-4 py-3 md:px-5",
        last ? null : "border-b border-line",
      )}
    >
      <dt className="pt-0.5 font-mono text-micro uppercase text-muted">
        {label}
      </dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  );
}

/* ── 证据行：有 anchorId 才做成可点的定位按钮 ─────────────────────────── */

function EvidenceLine({
  fact,
  noteZh,
  onFactClick,
}: {
  fact: EvidenceFact;
  noteZh?: string;
  onFactClick?: (fact: EvidenceFact) => void;
}) {
  // 没有 anchorId 就不做成可点的假按钮 —— 点了没反应比不可点更糟
  const clickable = Boolean(fact.anchorId && onFactClick);

  const body = (
    <>
      <div className="flex items-baseline justify-between gap-2">
        <p className="font-mono text-micro uppercase text-muted">
          {fact.locator}
        </p>
        {clickable ? (
          <span className="inline-flex shrink-0 items-center gap-1 font-mono text-micro uppercase text-ink">
            定位原件
            <LocateIcon />
          </span>
        ) : null}
      </div>
      <p className="mt-1 text-body leading-relaxed text-ink">
        <span className="text-muted">“</span>
        {fact.quote}
        <span className="text-muted">”</span>
      </p>
      {noteZh ? (
        <p className="mt-1 text-caption leading-relaxed text-muted">↳ {noteZh}</p>
      ) : null}
    </>
  );

  /**
   * 引语用**左侧竖线**而不是四面描边：一是它本来就是引文，竖线是引文该有的标记；
   * 二是卡里原先是「描边盒子里再套描边盒子」，边框密度很高而层级为零。
   */
  const shell = "rounded-r-lg border-l-2 bg-paper px-3.5 py-2.5";

  if (!clickable) {
    return <div className={cx(shell, "border-muted")}>{body}</div>;
  }

  return (
    <button
      type="button"
      onClick={() => onFactClick?.(fact)}
      className={cx(
        shell,
        "block w-full border-muted text-left transition-colors duration-150 hover:border-ink hover:bg-verdict-doubtful-wash",
      )}
    >
      {body}
    </button>
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

/* ── 法条行：行上只放 act 短名 + section，展开才给原文与来源 ───────────── */

function StatuteLine({
  statute,
  open,
  onToggle,
}: {
  statute: StatuteRef;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className={cx("rounded-lg border border-line", open && "w-full")}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors duration-150 hover:bg-paper"
      >
        <span className="min-w-0 font-mono text-label text-ink">
          <span className="text-muted">{shortActName(statute.act)}</span>{" "}
          <span className="font-semibold">{statute.section}</span>
        </span>
        <span className="ml-auto shrink-0 font-mono text-micro uppercase text-muted">
          {open ? "收起" : "原文"}
        </span>
      </button>

      {open ? (
        <div className="border-t border-line px-3 py-2.5">
          <p className="font-mono text-caption leading-relaxed text-ink">
            “{statute.quote}”
          </p>
          <p className="mt-1.5 font-mono text-micro uppercase text-muted">
            {statute.act}
          </p>
          <a
            href={statute.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-1.5 inline-flex items-center gap-1 text-caption font-medium text-ink underline underline-offset-2"
          >
            查看来源原文
            <ExternalIcon />
          </a>
        </div>
      ) : null}
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
