"use client";

/**
 * 两段进度（03b §6）—— 与 `/api/facts`、`/api/analyze` 两次真实调用一一对应。
 *
 * 纪律：
 * - 是进度动画，不是聊天气泡；完成时报的是**真实条数**（读到 N 条事实 / 比对了 M 条法条）
 * - 整体进度条按「已结束的段数」推进，正在跑的那一段用不定长条表示 ——
 *   不假装知道百分比，也绝不空转装样子
 * - 零证据时第一段直接跳过并说明原因（03a 那条路径本来就不走网络）
 * - 某一段失败 → 指出是哪一段，**单独重试那一段**，不要求从头再来
 */

import { useEffect, useState } from "react";

import type { AnalysisStageId, AnalysisStageState } from "./use-analysis";
import { cx } from "./utils";

const RUNNING_LABEL: Record<AnalysisStageId, string> = {
  facts: "正在阅读你上传的证据…",
  analyze: "正在对照租赁法…",
};

const PENDING_LABEL: Record<AnalysisStageId, string> = {
  facts: "读取证据",
  analyze: "对照法条",
};

export interface AnalysisProgressProps {
  stages: AnalysisStageState[];
  /** 如「NSW」，拼进「正在对照 NSW 租赁法…」 */
  stateLabel?: string;
  /** 有入住报告时可以更具体：「正在阅读你的入住报告…」 */
  factsRunningLabel?: string;
  onRetry?: (id: AnalysisStageId) => void;
  /** 结果出来之后收成一条窄摘要 */
  variant?: "full" | "compact";
  className?: string;
}

export function AnalysisProgress({
  stages,
  stateLabel,
  factsRunningLabel,
  onRetry,
  variant = "full",
  className,
}: AnalysisProgressProps) {
  const settled = stages.filter(
    (stage) => stage.status === "done" || stage.status === "skipped",
  ).length;
  const failed = stages.filter((stage) => stage.status === "failed");
  const runningLabel = (stage: AnalysisStageState) => {
    if (stage.id === "facts") return factsRunningLabel ?? RUNNING_LABEL.facts;
    return stateLabel ? `正在对照 ${stateLabel} 租赁法…` : RUNNING_LABEL.analyze;
  };

  if (variant === "compact") {
    return (
      <section
        className={cx(
          "rounded-xl border border-line bg-card px-3.5 py-2.5",
          className,
        )}
      >
        <ul className="flex flex-wrap items-center gap-x-4 gap-y-1">
          {stages.map((stage) => (
            <li
              key={stage.id}
              className="flex items-center gap-1.5 text-caption text-muted"
            >
              <StatusGlyph status={stage.status} />
              <span
                className={
                  stage.status === "failed" ? "text-verdict-unlawful" : undefined
                }
              >
                {stage.detailZh ?? PENDING_LABEL[stage.id]}
              </span>
            </li>
          ))}
        </ul>
        {failed.length > 0 && onRetry ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {failed.map((stage) => (
              <RetryButton
                key={stage.id}
                onClick={() => onRetry(stage.id)}
                label={
                  stage.id === "facts" ? "重试「读取证据」" : "重试「对照法条」"
                }
              />
            ))}
          </div>
        ) : null}
      </section>
    );
  }

  return (
    <section
      className={cx("rounded-2xl border border-line bg-card p-4 md:p-5", className)}
      aria-live="polite"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 className="text-section text-ink">
          {settled === stages.length ? "分析完成" : "正在分析你的案情"}
        </h2>
        <span className="tnum font-mono text-micro uppercase text-muted">
          {settled} / {stages.length}
        </span>
      </div>

      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-paper">
        <div
          className="h-full rounded-full bg-ink transition-[width] duration-300"
          style={{ width: `${(settled / stages.length) * 100}%` }}
        />
      </div>

      <ol className="mt-4 flex flex-col gap-3">
        {stages.map((stage) => (
          <StageRow
            key={stage.id}
            stage={stage}
            runningLabel={runningLabel(stage)}
            onRetry={onRetry}
          />
        ))}
      </ol>

      <p className="mt-4 text-caption leading-relaxed text-muted">
        两段都是真实调用：先把证据读成一条条可引用的事实，再拿事实去对照法条。
        任何一段没跑成，都可以只重跑那一段。
      </p>
    </section>
  );
}

/* ── 单段 ─────────────────────────────────────────────────────────────── */

function StageRow({
  stage,
  runningLabel,
  onRetry,
}: {
  stage: AnalysisStageState;
  runningLabel: string;
  onRetry?: (id: AnalysisStageId) => void;
}) {
  const isRunning = stage.status === "running";
  const elapsed = useElapsed(isRunning);

  return (
    <li className="grid grid-cols-[1.25rem_1fr] gap-x-2.5">
      <span className="mt-0.5">
        <StatusGlyph status={stage.status} />
      </span>

      <div className="min-w-0">
        <p
          className={cx(
            "text-label leading-snug",
            stage.status === "failed"
              ? "text-verdict-unlawful"
              : stage.status === "pending"
                ? "text-muted"
                : "text-ink",
          )}
        >
          {isRunning ? runningLabel : (stage.detailZh ?? PENDING_LABEL[stage.id])}
        </p>

        {isRunning ? (
          <>
            <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-paper">
              <div className="h-full w-2/5 animate-pulse rounded-full bg-ink-soft" />
            </div>
            <p className="tnum mt-1 font-mono text-micro text-muted">
              已用 {(elapsed / 1000).toFixed(1)}s
            </p>
          </>
        ) : null}

        {stage.status === "failed" && onRetry ? (
          <div className="mt-2">
            <RetryButton
              onClick={() => onRetry(stage.id)}
              label="只重试这一段"
            />
          </div>
        ) : null}
      </div>
    </li>
  );
}

function RetryButton({
  onClick,
  label,
}: {
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg border border-line bg-card px-3 py-1.5 text-caption font-medium text-ink transition-colors duration-150 hover:bg-paper"
    >
      {label}
    </button>
  );
}

function StatusGlyph({ status }: { status: AnalysisStageState["status"] }) {
  const common = {
    viewBox: "0 0 24 24",
    width: 16,
    height: 16,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2.2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  if (status === "done") {
    return (
      <svg {...common} className="shrink-0 text-evidence-used">
        <circle cx="12" cy="12" r="9" />
        <path d="M8 12.4l2.7 2.7L16 9.8" />
      </svg>
    );
  }

  if (status === "failed") {
    return (
      <svg {...common} className="shrink-0 text-verdict-unlawful">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v5M12 15.8v.1" />
      </svg>
    );
  }

  if (status === "skipped") {
    return (
      <svg {...common} className="shrink-0 text-muted">
        <circle cx="12" cy="12" r="9" />
        <path d="M8.5 12h7" />
      </svg>
    );
  }

  if (status === "running") {
    return (
      <svg
        {...common}
        className="shrink-0 animate-spin text-ink"
        style={{ animationDuration: "var(--duration-sweep)" }}
      >
        <circle cx="12" cy="12" r="9" className="opacity-25" />
        <path d="M21 12a9 9 0 00-9-9" />
      </svg>
    );
  }

  return (
    <svg {...common} className="shrink-0 text-line">
      <circle cx="12" cy="12" r="9" />
    </svg>
  );
}

/** 正在跑的那一段显示真实已用时长 —— 比任何假百分比都诚实。 */
function useElapsed(active: boolean): number {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!active) {
      setElapsed(0);
      return;
    }
    const started = Date.now();
    setElapsed(0);
    const timer = setInterval(() => setElapsed(Date.now() - started), 100);
    return () => clearInterval(timer);
  }, [active]);

  return elapsed;
}
