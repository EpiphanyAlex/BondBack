"use client";

/**
 * 两段进度（03b §6）—— 与 `/api/facts`、`/api/analyze` 两次真实调用一一对应。
 *
 * 「江湖战报」稿 §03 把它从一张浅色卡改成**整幅墨黑的一幕**：左边两段进度，
 * 右边轮播「正在读的这一条」。等待十几秒的这一屏是产品唯一的空窗，
 * 与其转一个圈，不如把刚读出来的原句一条条推到眼前 —— 那就是它在干的活。
 *
 * 纪律（一条没松）：
 * - 是进度动画，不是聊天气泡；完成时报的是**真实条数**（读到 N 条事实 / 比对了 M 条法条）
 * - 正在跑的那一段用不定长条 + **真实已用秒数**，不假装百分比，也绝不空转
 * - 轮播的引语是**真读到的事实**，读不到就不轮播，不摆样子
 * - 零证据时第一段直接跳过并说明原因（03a 那条路径本来就不走网络）
 * - 某一段失败 → 指出是哪一段，**单独重试那一段**，不要求从头再来
 */

import { useEffect, useState } from "react";

import { CharacterSlot } from "@/components/character-slot";
import type { EvidenceFact } from "@/lib/types";

import type { AnalysisStageId, AnalysisStageState } from "./use-analysis";
import { cx } from "./utils";

/** 轮播一拍，对应 `--duration-beat` */
const BEAT = 1200;

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
  /** 已经读出来的事实，用于右栏轮播 */
  facts?: EvidenceFact[];
  onRetry?: (id: AnalysisStageId) => void;
  /** 结果出来之后收成一条窄摘要 */
  variant?: "full" | "compact";
  className?: string;
}

export function AnalysisProgress({
  stages,
  stateLabel,
  factsRunningLabel,
  facts = [],
  onRetry,
  variant = "full",
  className,
}: AnalysisProgressProps) {
  const failed = stages.filter((stage) => stage.status === "failed");
  const runningLabel = (stage: AnalysisStageState) => {
    if (stage.id === "facts") return factsRunningLabel ?? RUNNING_LABEL.facts;
    return stateLabel ? `正在对照 ${stateLabel} 租赁法…` : RUNNING_LABEL.analyze;
  };

  if (variant === "compact") {
    return (
      <section
        className={cx(
          "flex flex-wrap items-center gap-x-5 gap-y-2 border-l-2 border-line pl-4",
          className,
        )}
      >
        {stages.map((stage) => (
          <p
            key={stage.id}
            className={cx(
              "flex items-center gap-2 font-mono text-caption",
              stage.status === "failed" ? "text-verdict-unlawful" : "text-faint",
            )}
          >
            <StatusGlyph status={stage.status} />
            {stage.detailZh ?? PENDING_LABEL[stage.id]}
          </p>
        ))}
        {failed.length > 0 && onRetry
          ? failed.map((stage) => (
              <RetryButton
                key={stage.id}
                onClick={() => onRetry(stage.id)}
                label={
                  stage.id === "facts" ? "重试「读取证据」" : "重试「对照法条」"
                }
              />
            ))
          : null}
      </section>
    );
  }

  return (
    <section
      className={cx("bg-ink text-paper", className)}
      aria-live="polite"
    >
      <div className="mx-auto grid w-full max-w-[1152px] gap-10 px-4 py-12 md:px-6 md:py-14 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-14">
        <div>
          <p className="font-mono text-micro text-amount-hero">
            分析中 · 通常十几秒
          </p>
          <h1 className="h-shout mt-5 text-display">
            正在把你的材料
            <br />
            对到{stateLabel ? ` ${stateLabel} ` : ""}租赁法上。
          </h1>

          <ol className="mt-10 flex max-w-[620px] flex-col gap-7">
            {stages.map((stage) => (
              <StageRow
                key={stage.id}
                stage={stage}
                runningLabel={runningLabel(stage)}
                onRetry={onRetry}
              />
            ))}
          </ol>

          <p className="mt-10 max-w-[560px] text-label text-paper/50">
            两段都是真实调用：先把证据读成一条条可引用的事实，再拿事实去对照法条。
            这段时间别关页面 —— 资料只在这次会话里，刷新就没了。
          </p>
        </div>

        <aside className="flex flex-col gap-6">
          {/* 图由画师提供，`src` 一给占位框就退场（见 CharacterSlot） */}
          <CharacterSlot
            className="min-h-[220px] lg:min-h-[280px]"
            briefZh={"押金侠 · 角色形象\n翻卷宗 / 可做 2 帧循环\n待画师提供"}
          />
          <NowReading facts={facts} />
        </aside>
      </div>
    </section>
  );
}

/* ── 右栏：正在读的这一条 ─────────────────────────────────────────────── */

function NowReading({ facts }: { facts: EvidenceFact[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (facts.length < 2) return;
    const timer = setInterval(
      () => setIndex((current) => (current + 1) % facts.length),
      BEAT,
    );
    return () => clearInterval(timer);
  }, [facts.length]);

  // 还没读到事实就什么都不摆：空着比摆一个转圈的占位诚实
  if (facts.length === 0) return null;

  const fact = facts[index % facts.length]!;

  return (
    <div className="border-t border-paper/16 pt-6">
      <p className="font-mono text-micro text-paper/45">
        正在读的这一条 · 共 {facts.length} 条
      </p>
      {/* key 换了就重播一次进场，等于「翻到下一条」 */}
      <blockquote
        key={fact.id}
        className="step-enter mt-4 border-l-2 border-gold-bright pl-3.5"
      >
        <p className="font-mono text-section leading-normal text-paper">
          “{fact.quote}”
        </p>
        <footer className="mt-2.5 font-mono text-micro text-paper/40">
          {fact.locator}
        </footer>
      </blockquote>
    </div>
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

  const tone =
    stage.status === "failed"
      ? "text-verdict-unlawful-on-dark"
      : stage.status === "running"
        ? "text-amount-hero"
        : stage.status === "pending"
          ? "text-paper/45"
          : "text-paper";

  return (
    <li>
      <div className="flex items-baseline justify-between gap-4">
        <p className={cx("flex items-center gap-2.5 text-section font-bold", tone)}>
          <StatusGlyph status={stage.status} />
          {isRunning ? runningLabel : (stage.detailZh ?? PENDING_LABEL[stage.id])}
        </p>
        {isRunning ? (
          <span className="shrink-0 font-mono text-caption text-paper/45">
            已用 {(elapsed / 1000).toFixed(1)}s
          </span>
        ) : null}
      </div>

      {/* 进度条只表达三态：跑完（铺满）/ 正在跑（不定长）/ 还没开始（空槽）。
          不画百分比 —— 我们并不知道模型跑到哪了。 */}
      <div className="mt-3 h-1 w-full bg-paper/14">
        {stage.status === "done" || stage.status === "skipped" ? (
          <span className="block h-full w-full bg-verdict-lawful-on-dark" />
        ) : isRunning ? (
          <span className="block h-full w-2/5 animate-pulse bg-gold-bright" />
        ) : stage.status === "failed" ? (
          <span className="block h-full w-full bg-verdict-unlawful-on-dark" />
        ) : null}
      </div>

      {stage.status === "failed" && onRetry ? (
        <div className="mt-3">
          <RetryButton onClick={() => onRetry(stage.id)} label="只重试这一段" />
        </div>
      ) : null}
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
      className="border border-current px-3.5 py-1.5 font-mono text-caption text-verdict-unlawful transition-colors duration-150 hover:bg-verdict-unlawful hover:text-paper"
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
    className: "shrink-0",
  };

  if (status === "done") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="M8 12.4l2.7 2.7L16 9.8" />
      </svg>
    );
  }

  if (status === "failed") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v5M12 15.8v.1" />
      </svg>
    );
  }

  if (status === "skipped") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="M8.5 12h7" />
      </svg>
    );
  }

  if (status === "running") {
    return (
      <svg
        {...common}
        className="shrink-0 animate-spin"
        style={{ animationDuration: "var(--duration-sweep)" }}
      >
        <circle cx="12" cy="12" r="9" className="opacity-25" />
        <path d="M21 12a9 9 0 00-9-9" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="9" className="opacity-40" />
    </svg>
  );
}

/** 正在跑的那一段显示真实已用时长 —— 比任何假百分比都诚实。 */
function useElapsed(active: boolean): number {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!active) return;
    const started = Date.now();
    const tick = () => setElapsed(Date.now() - started);
    // 立刻补一拍：重试时若等满 100ms 才更新，会先闪一下上一轮的秒数
    const first = setTimeout(tick, 0);
    const timer = setInterval(tick, 100);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [active]);

  // 归零在渲染期做，不在 effect 里 setState —— 那会多走一趟级联渲染
  return active ? elapsed : 0;
}
