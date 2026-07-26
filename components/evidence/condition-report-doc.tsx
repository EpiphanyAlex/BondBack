"use client";

/**
 * 入住报告「原件」（04a §3）—— 全片高潮那一帧。
 *
 * 为什么是 HTML 而不是一张 JPEG：可定位高亮、手机上不糊、体积小、改一个数字不用重导图。
 * 内容全部虚构并常驻「示例案例」角标（军规：不伪造真实世界凭证）。
 *
 * 给 03b 的定位 API（两种都行，可混用）：
 *
 * ```tsx
 * // 1) 命令式 —— 同一行连点两次也会重新播一遍高亮
 * const docRef = useRef<ConditionReportHandle>(null);
 * <ConditionReportDoc ref={docRef} />
 * docRef.current?.scrollToAndHighlight(fact.anchorId);
 *
 * // 2) 受控 prop —— 想再触发同一行，先置回 null
 * <ConditionReportDoc highlightId={anchorId} onHighlightEnd={() => setAnchorId(null)} />
 * ```
 *
 * 高亮样式：`--color-verdict-doubtful-wash` 底 + 左侧色条，持续 `--duration-sweep`。
 */

import { useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import type { ReactNode, Ref } from "react";

/** 可被外部定位的行 id —— `EvidenceFact.anchorId` 只能取这里的值。 */
export const CONDITION_REPORT_ROW_IDS = [
  "cr-signature",
  "cr-living-walls",
  "cr-kitchen-oven",
  "cr-bathroom-grout",
  "cr-garden-lawn",
  "cr-living-carpet",
] as const;

export type ConditionReportRowId = (typeof CONDITION_REPORT_ROW_IDS)[number];

export interface ConditionReportHandle {
  /** 滚动到该行并高亮一次；id 不存在时静默忽略 */
  scrollToAndHighlight: (anchorId: string) => void;
  /** 提前收掉高亮（例如对照卡被收起） */
  clearHighlight: () => void;
}

export interface ConditionReportDocProps {
  /** 受控高亮。要重复触发同一行，先置回 null/undefined */
  highlightId?: string | null;
  /** 高亮结束（`--duration-sweep` 到点）或被 clearHighlight 打断时回调 */
  onHighlightEnd?: () => void;
  /** 外层自己控制滚动位置时传 false，组件就只负责上色 */
  scrollOnHighlight?: boolean;
  className?: string;
  ref?: Ref<ConditionReportHandle>;
}

/** 高亮时长直接读 design token，组件里不硬编码毫秒。 */
const SWEEP_DURATION_VAR = "--duration-sweep";
const SWEEP_FALLBACK = 1600;

function readSweepDuration(): number {
  if (typeof window === "undefined") return SWEEP_FALLBACK;
  const raw = window
    .getComputedStyle(document.documentElement)
    .getPropertyValue(SWEEP_DURATION_VAR)
    .trim();
  const parsed = Number.parseFloat(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return SWEEP_FALLBACK;
  // CSS 时长可能写成秒，统一换算成毫秒
  return raw.endsWith("ms") ? parsed : parsed * 1000;
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

/* ── 报告内容（虚构，04a §3 的表逐行落地）──────────────────────────────── */

interface ReportRow {
  id: ConditionReportRowId;
  room: string;
  item: string;
  condition: "Good" | "Fair";
  comments: string;
}

const PAGE_TWO_ROWS: ReportRow[] = [
  {
    id: "cr-living-walls",
    room: "Living",
    item: "Walls",
    condition: "Good",
    comments: "minor scuffs",
  },
  {
    id: "cr-kitchen-oven",
    room: "Kitchen",
    item: "Oven",
    condition: "Good",
    comments: "—",
  },
  {
    id: "cr-bathroom-grout",
    room: "Bathroom",
    item: "Grout",
    condition: "Fair",
    comments: "light staining",
  },
  {
    id: "cr-garden-lawn",
    room: "Garden",
    item: "Lawn",
    condition: "Good",
    comments: "—",
  },
];

const PAGE_THREE_ROWS: ReportRow[] = [
  {
    id: "cr-living-carpet",
    room: "Living",
    item: "Carpet",
    condition: "Fair",
    comments: "existing stains noted",
  },
];

/* ── 组件 ─────────────────────────────────────────────────────────────── */

export function ConditionReportDoc({
  highlightId,
  onHighlightEnd,
  scrollOnHighlight = true,
  className,
  ref,
}: ConditionReportDocProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const endRef = useRef<(() => void) | undefined>(onHighlightEnd);
  const [activeId, setActiveId] = useState<string | null>(null);

  // 回调存进 ref，避免它每次变化都重建 scrollToAndHighlight（03b 多半会传内联箭头函数）
  useEffect(() => {
    endRef.current = onHighlightEnd;
  }, [onHighlightEnd]);

  const stopTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const clearHighlight = useCallback(() => {
    stopTimer();
    setActiveId(null);
  }, [stopTimer]);

  const scrollToAndHighlight = useCallback(
    (anchorId: string) => {
      const node = containerRef.current?.querySelector<HTMLElement>(
        `[data-anchor-id="${anchorId}"]`,
      );
      if (!node) return;

      if (scrollOnHighlight) {
        node.scrollIntoView({
          block: "center",
          behavior: prefersReducedMotion() ? "auto" : "smooth",
        });
      }

      setActiveId(anchorId);
      stopTimer();
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        setActiveId(null);
        endRef.current?.();
      }, readSweepDuration());
    },
    [scrollOnHighlight, stopTimer],
  );

  useImperativeHandle(
    ref,
    () => ({ scrollToAndHighlight, clearHighlight }),
    [scrollToAndHighlight, clearHighlight],
  );

  useEffect(() => {
    if (!highlightId) return;
    scrollToAndHighlight(highlightId);
  }, [highlightId, scrollToAndHighlight]);

  useEffect(() => stopTimer, [stopTimer]);

  return (
    <div
      ref={containerRef}
      className={cx(
        "overflow-hidden border border-line bg-card",
        className,
      )}
    >
      <header className="border-b border-line px-4 py-3 md:px-5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <h3 className="font-mono text-section text-ink">
            Ingoing Condition Report
          </h3>
          <span className="rounded-full border border-line px-2 py-0.5 font-mono text-micro uppercase text-muted">
            示例案例
          </span>
        </div>
        <p className="tnum mt-1 font-mono text-caption text-muted">
          Inspected 2 March 2024 · 3 pages
        </p>
      </header>

      <DocPage label="P1" title="Parties and signatures">
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 border-l-4 border-transparent px-4 py-3 md:px-5">
          <MetaRow label="Property" value="12/34 Kingsford Rd, Kensington NSW 2033" />
          <MetaRow label="Tenant" value="L. Chen" />
          <MetaRow label="Agent" value="Harbourline Property" />
          <MetaRow label="Rental bond" value="RB-2024-118376" />
        </dl>
        <HighlightTarget
          anchorId="cr-signature"
          active={activeId === "cr-signature"}
        >
          <p className="font-mono text-label text-ink">
            Tenant signed 5 Mar 2024
          </p>
          <p className="mt-0.5 font-mono text-caption text-muted">
            Agent signed 2 Mar 2024
          </p>
        </HighlightTarget>
      </DocPage>

      <DocPage label="P2" title="General condition">
        <TableHead />
        <ul>
          {PAGE_TWO_ROWS.map((row) => (
            <ConditionRow key={row.id} row={row} active={activeId === row.id} />
          ))}
        </ul>
      </DocPage>

      <DocPage label="P3" title="Living room (continued)" last>
        <TableHead />
        <ul>
          {PAGE_THREE_ROWS.map((row) => (
            <ConditionRow key={row.id} row={row} active={activeId === row.id} />
          ))}
        </ul>
      </DocPage>

      <p className="border-t border-line px-4 py-2.5 text-caption text-muted md:px-5">
        {/* 军规要的是「标虚构」。原来后半句「仅用于演示 BondBack 的对照能力」
            是讲给评委听的自我介绍，看文件的人只需要知道这份是假的。 */}
        本页为示例案例的虚构文件，不是真实的入住报告。
      </p>
    </div>
  );
}

/* ── 内部零件 ─────────────────────────────────────────────────────────── */

function DocPage({
  label,
  title,
  last = false,
  children,
}: {
  label: string;
  title: string;
  last?: boolean;
  children: ReactNode;
}) {
  return (
    <section className={last ? undefined : "border-b border-line"}>
      <div className="flex items-baseline gap-2 bg-paper px-4 py-1.5 md:px-5">
        <span className="font-mono text-micro uppercase text-muted">{label}</span>
        <span className="font-mono text-caption text-muted">{title}</span>
      </div>
      {children}
    </section>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="font-mono text-micro uppercase text-muted">{label}</dt>
      <dd className="font-mono text-caption break-words text-ink">{value}</dd>
    </>
  );
}

function TableHead() {
  return (
    // pl 比 px 多 4px，和行上那条 border-l-4 的色条对齐
    <div className="hidden border-b border-line px-4 pl-5 py-1.5 md:px-5 md:pl-6 lg:grid lg:grid-cols-[6rem_6rem_5rem_1fr] lg:gap-x-4">
      <span className="font-mono text-micro uppercase text-muted">Room</span>
      <span className="font-mono text-micro uppercase text-muted">Item</span>
      <span className="font-mono text-micro uppercase text-muted">Condition</span>
      <span className="font-mono text-micro uppercase text-muted">Comments</span>
    </div>
  );
}

/**
 * 高亮行的统一外壳：左侧 4px 色条常驻但默认透明（避免高亮时行内容位移），
 * 底色与色条同时切换 —— 不靠颜色单独传意，被高亮的行本身就是被引用的那一行。
 */
function HighlightTarget({
  anchorId,
  active,
  className,
  children,
}: {
  anchorId: string;
  active: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      id={anchorId}
      data-anchor-id={anchorId}
      data-active={active ? "true" : undefined}
      className={cx(
        "scroll-mt-24 border-l-4 px-4 py-2.5 transition-colors duration-300 md:px-5",
        active
          ? "border-verdict-doubtful bg-verdict-doubtful-wash"
          : "border-transparent",
        className,
      )}
    >
      {children}
    </div>
  );
}

function ConditionRow({ row, active }: { row: ReportRow; active: boolean }) {
  return (
    <li>
      <HighlightTarget anchorId={row.id} active={active}>
        <div className="grid grid-cols-[auto_auto_1fr] items-baseline gap-x-3 gap-y-1 lg:grid-cols-[6rem_6rem_5rem_1fr] lg:gap-x-4 lg:gap-y-0">
          <span className="font-mono text-label text-muted">{row.room}</span>
          <span className="font-mono text-label text-ink">{row.item}</span>
          <span className="justify-self-end font-mono text-caption text-muted lg:justify-self-start">
            {row.condition}
          </span>
          <span className="col-span-3 text-caption text-ink lg:col-span-1">
            {row.comments}
          </span>
        </div>
      </HighlightTarget>
    </li>
  );
}
