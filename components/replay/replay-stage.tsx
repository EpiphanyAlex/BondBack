"use client";

/**
 * `/sample` 的重放舞台（04b §2 / 稿子 §05）—— 把整条流水线播一遍，而不是直接给结果。
 *
 * 整幅墨黑，五段进度串在顶上，底下三栏各管一件事：
 *   左   四份材料      逐份飞入并打勾
 *   中   读出的事实    每读到一条就多一句可引用的原句（这一栏是产品的命门）
 *   右   预填的字段    金色扫过，外加重放控制（暂停 / 重放 / 跳到结果）
 * 翻卡那一拍在三栏下面整幅展开一张真的 `ComparisonCard`，一次只留最新的一张。
 * 播完由 `app/sample/page.tsx` 换成 `ResultView` 本体。
 *
 * 三条硬约束一条没松：
 * - **零网络请求**：数据全是 04a 的模块常量，组件全部静态 import
 * - **「跳过」常驻**：右栏的重放控制第 0 拍就已渲染，任何时刻可点
 * - `prefers-reduced-motion: reduce` 由 `useReplay` 负责，一拍都不播直接落地
 *
 * 与真实分析页的关系：那边（`AnalysisProgress`）也是墨黑面 + 金色引语逐条推出，
 * 视觉语言是同一套；这里不再嵌那个组件，因为它自带整幅一幕的排版，
 * 套进重放的三栏里会出现两层「幕」。
 */

import Link from "next/link";

import { EVIDENCE_KIND_LABEL } from "@/components/evidence/evidence-thumb";
import { ComparisonCard } from "@/components/result/comparison-card";
import { money } from "@/components/result/utils";
import type {
  AnalysisResult,
  CaseInput,
  ExtractedCaseFields,
  ReplayBeat,
} from "@/lib/types";

type PrefillField = keyof ExtractedCaseFields;

const FIELD_LABEL: Record<PrefillField, string> = {
  bondAmount: "押金",
  claimedAmount: "被扣",
  moveOutDate: "退租日期",
  deductions: "扣款明细",
  propertyAddress: "物业地址",
  bondNumber: "押金号",
};

function fieldValue(field: PrefillField, input: CaseInput): string {
  switch (field) {
    case "bondAmount":
      return money(input.bondAmount);
    case "claimedAmount":
      return money(input.claimedAmount);
    case "deductions":
      return `${input.deductions.length} 项`;
    case "moveOutDate":
      return input.moveOutDate;
    case "propertyAddress":
      return input.propertyAddress ?? "—";
    case "bondNumber":
      return input.bondNumber ?? "—";
  }
}

/** 顶上那条五段进度。段名与稿子一致，也正好是这条流水线的五个动作。 */
const PHASES = [
  "01 材料飞入",
  "02 字段预填",
  "03 读出事实",
  "04 逐张翻开",
  "05 判决",
];

/** 当前演到第几段（0 起）。 */
function phaseOf(fired: ReplayBeat[]): number {
  if (fired.some((beat) => beat.kind === "result")) return 4;
  if (fired.some((beat) => beat.kind === "card-reveal")) return 3;
  if (
    fired.some(
      (beat) =>
        beat.kind === "facts-progress" || beat.kind === "analyze-progress",
    )
  ) {
    return 2;
  }
  if (fired.some((beat) => beat.kind === "prefill")) return 1;
  return 0;
}

export interface ReplayStageProps {
  caseInput: CaseInput;
  analysis: AnalysisResult;
  beats: ReplayBeat[];
  firedCount: number;
  paused: boolean;
  onSkip: () => void;
  onTogglePause: () => void;
  onRestart: () => void;
}

export function ReplayStage({
  caseInput,
  analysis,
  beats,
  firedCount,
  paused,
  onSkip,
  onTogglePause,
  onRestart,
}: ReplayStageProps) {
  const fired = beats.slice(0, firedCount);
  const current = firedCount > 0 ? beats[firedCount - 1] : null;
  const phase = phaseOf(fired);

  const arrived = fired.filter((beat) => beat.kind === "evidence-arrive");
  const prefillBeat = fired.find((beat) => beat.kind === "prefill");
  const factsBeats = fired.filter((beat) => beat.kind === "facts-progress");
  const factCount = factsBeats[factsBeats.length - 1]?.factCount ?? 0;
  const revealed = fired.filter((beat) => beat.kind === "card-reveal");
  const latestCard = revealed[revealed.length - 1];

  /** 读出来的事实按拍逐条露出 —— 和真实流程一样，读到几条就是几条 */
  const readFacts = analysis.facts.slice(0, factCount);

  return (
    <section className="min-h-dvh bg-ink text-paper">
      <div className="mx-auto w-full max-w-[1152px] px-4 py-10 md:px-6 md:py-12">
        <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-4">
          <div>
            <p className="font-mono text-micro text-amount-hero">
              示例重放 · 断网可看 · 零 API 调用
            </p>
            <h1 className="h-shout mt-3 text-display">
              一个 {caseInput.state} 案子，从材料到判决
            </h1>
          </div>
          {/* 军规：示例必须标虚构，而且要在第 0 拍就在场 */}
          <p className="inline-flex items-center gap-2.5 border border-gold-bright/50 px-4 py-2">
            <span className="size-2 rounded-full bg-gold-bright" />
            <span className="font-mono text-micro text-paper/80">
              文件与当事人均为虚构
            </span>
          </p>
        </div>

        {/* ── 五段进度：走到哪一段，那一段的顶线就亮 ── */}
        <ol className="mt-9 grid grid-cols-2 gap-x-4 gap-y-3 md:grid-cols-5 md:gap-x-0">
          {PHASES.map((label, index) => (
            <li
              key={label}
              className={`border-t-[3px] pt-3 md:pr-4 ${
                index < phase
                  ? "border-seal"
                  : index === phase
                    ? "border-gold-bright"
                    : "border-paper/20"
              }`}
            >
              <p
                className={`font-mono text-micro ${
                  index === phase
                    ? "text-amount-hero"
                    : index < phase
                      ? "text-paper"
                      : "text-paper/45"
                }`}
              >
                {label}
                {index === phase ? " ●" : null}
              </p>
            </li>
          ))}
        </ol>

        {/* 旁白：当前这一拍在做什么。高度固定，免得每拍都把下面顶一下 */}
        <div className="mt-8 min-h-[3.5rem]" aria-live="polite">
          <p className="text-section font-bold">
            {current?.labelZh ?? "准备重放这个案子的分析过程"}
          </p>
          <p className="mt-1 text-label text-paper/50">
            {current?.detailZh ?? "全程零网络请求，断网也能看完"}
          </p>
        </div>

        <div className="mt-6 grid gap-9 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_380px]">
          {/* ── 左：四份材料 ── */}
          <div>
            <p className="font-mono text-micro text-paper/45">
              {caseInput.evidence.length} 份材料 · 已到 {arrived.length}
            </p>
            <ul className="mt-3.5 flex flex-col gap-2.5">
              {caseInput.evidence.map((file) => {
                const beat = arrived.find((item) => item.evidenceId === file.id);
                const latest =
                  beat && current?.evidenceId === file.id && phase === 0;
                return (
                  <li
                    key={file.id}
                    className={`flex items-center gap-3 border px-4 py-3.5 ${
                      latest
                        ? "step-enter border-gold-bright bg-gold-bright/10"
                        : beat
                          ? "border-paper/25"
                          : "border-dashed border-paper/15"
                    }`}
                  >
                    <span
                      className={`font-mono text-caption ${
                        latest
                          ? "text-amount-hero"
                          : beat
                            ? "text-verdict-lawful-on-dark"
                            : "text-paper/25"
                      }`}
                    >
                      {beat ? (latest ? "▸" : "✓") : "·"}
                    </span>
                    <span
                      className={`min-w-0 flex-1 truncate text-label font-bold ${
                        beat ? "text-paper" : "text-paper/30"
                      }`}
                    >
                      {file.fileName}
                    </span>
                    <span className="shrink-0 font-mono text-micro text-paper/45">
                      {EVIDENCE_KIND_LABEL[file.kind]}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* ── 中：读出来的事实 —— 产品的命门，所以给它整整一栏 ── */}
          <div>
            <p className="font-mono text-micro text-amount-hero">
              正在读出的事实 · 累计 {factCount} / {analysis.facts.length}
            </p>
            {readFacts.length === 0 ? (
              <p className="mt-3.5 text-label text-paper/45">
                材料到齐后，它会把每一份读成带页码的可引用原句。
              </p>
            ) : (
              <ul className="mt-3.5 flex flex-col gap-3.5">
                {readFacts.map((fact, index) => (
                  <li
                    key={fact.id}
                    className={`border-l-2 pl-3.5 ${
                      index === readFacts.length - 1
                        ? "step-enter border-gold-bright"
                        : "border-paper/30"
                    }`}
                  >
                    <p
                      className={`font-mono text-label ${
                        index === readFacts.length - 1
                          ? "text-paper"
                          : "text-paper/55"
                      }`}
                    >
                      “{fact.quote}”
                    </p>
                    <p className="mt-1 font-mono text-micro text-paper/40">
                      {fact.locator}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* ── 右：预填的字段 + 重放控制 ── */}
          <div>
            <p className="font-mono text-micro text-paper/45">已预填的字段</p>
            <dl className="mt-3.5 flex flex-col gap-2.5">
              {(prefillBeat?.fields ?? []).map((field, index) => (
                <div
                  key={field}
                  className="prefilled flex items-baseline justify-between border-b-2 border-gold-bright bg-gold-bright/14 px-3.5 py-2.5"
                  style={{
                    animationDelay: `calc(var(--duration-quick) * ${index * 2})`,
                  }}
                >
                  <dt className="text-label text-paper/70">
                    {FIELD_LABEL[field]}
                  </dt>
                  <dd className="font-number text-num-sm text-amount-hero">
                    {fieldValue(field, caseInput)}
                  </dd>
                </div>
              ))}
              {prefillBeat ? null : (
                <p className="text-label text-paper/45">
                  读到扣款清单时，这里会自动填出押金、被扣与明细。
                </p>
              )}
            </dl>

            <div className="mt-8 border-t border-paper/16 pt-5">
              <p className="font-mono text-micro text-paper/45">重放控制</p>
              <div className="mt-3.5 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={onTogglePause}
                  className="bg-seal px-5 py-2.5 text-label font-bold text-paper"
                >
                  {paused ? "继续" : "暂停"}
                </button>
                <button
                  type="button"
                  onClick={onRestart}
                  className="border border-paper/35 px-4 py-2.5 text-label font-bold text-paper transition-colors duration-150 hover:bg-paper/10"
                >
                  重放
                </button>
                <button
                  type="button"
                  onClick={onSkip}
                  className="font-mono text-micro text-paper/60 underline underline-offset-4"
                >
                  跳到结果 →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── 翻卡：整幅展开一张真的对照卡，一次只留最新的一张 ── */}
        {latestCard ? (
          <div
            key={latestCard.id}
            className="step-enter mt-10 border-t border-paper/16 pt-8"
          >
            <p className="font-mono text-micro text-paper/45">
              逐张翻开 · 第 {revealed.length} / {analysis.items.length} 张
            </p>
            <div className="mt-4 lg:max-w-[860px]">
              <ComparisonCard
                item={analysis.items[latestCard.itemIndex ?? 0]!}
                ordinal={(latestCard.itemIndex ?? 0) + 1}
                facts={analysis.facts}
              />
            </div>
          </div>
        ) : null}

        {/* ── 收口：说清重放结束后停在哪 ── */}
        <div className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-4 border-t border-paper/16 pt-6">
          <p className="font-mono text-micro text-paper/45">
            重放结束后停在完整结果页
          </p>
          <p className="text-section">
            <span className="font-number text-num-sm text-amount-hero">
              {money(analysis.ledger.disputableTotal)}
            </span>{" "}
            可争议 · {analysis.items.length} 笔扣款、三种结论
          </p>
          <Link
            href="/wizard"
            className="bg-seal px-6 py-3.5 text-body font-bold text-paper md:ml-auto"
          >
            换成我自己的案子
          </Link>
        </div>
      </div>
    </section>
  );
}
