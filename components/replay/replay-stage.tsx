"use client";

/**
 * `/sample` 的重放舞台（04b §2）—— 把整条流水线播一遍，而不是直接给结果。
 *
 * 四幕，全部只用 04a 的常量与 03b/04a 的现成组件，**零网络请求**：
 *   ① 上传台   0.0–4.5s  四份文件逐个飞入（`EvidenceThumb`，04a）
 *   ② 预填     4.5–6.0s  三个字段自动填入，金色扫过（复用 `.prefilled`）
 *   ③ 两段进度 6.0–11s   `AnalysisProgress`（03b 本体，与真实流程同一个组件）
 *   ④ 翻卡     11–12.6s  `ComparisonCard`（03b 本体）逐张翻开
 * 播完由 `app/sample/page.tsx` 换成 `ResultView` 本体。
 *
 * 每一幕换场时上一幕收成一行摘要，所以整段重放的高度是有界的 ——
 * 手机上不用中途自动滚动（自动滚动在录屏里最难看）。
 *
 * 「跳过」钉在 sticky 头部右上角，第 0 拍（还没有任何东西飞进来）就已经渲染出来，
 * 所以「任何时刻可点」是真的任何时刻。
 */

import { EvidenceThumb } from "@/components/evidence/evidence-thumb";
import { AnalysisProgress } from "@/components/result/analysis-progress";
import { ComparisonCard } from "@/components/result/comparison-card";
import type { AnalysisStageState } from "@/components/result/use-analysis";
import { money } from "@/components/result/utils";
import type {
  AnalysisResult,
  CaseInput,
  ExtractedCaseFields,
  ReplayBeat,
} from "@/lib/types";

type PrefillField = keyof ExtractedCaseFields;

const FIELD_LABEL: Record<PrefillField, string> = {
  bondAmount: "押金总额",
  claimedAmount: "房东索扣",
  moveOutDate: "退租日期",
  deductions: "扣款项",
  propertyAddress: "物业地址",
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
  }
}

/** 当前演到第几幕。已经翻卡了就不再显示上传台，高度才有界。 */
type Scene = "intake" | "prefill" | "analyze" | "cards";

function sceneOf(fired: ReplayBeat[]): Scene {
  if (fired.some((beat) => beat.kind === "card-reveal")) return "cards";
  if (
    fired.some(
      (beat) =>
        beat.kind === "facts-progress" || beat.kind === "analyze-progress",
    )
  ) {
    return "analyze";
  }
  if (fired.some((beat) => beat.kind === "prefill")) return "prefill";
  return "intake";
}

/**
 * 把已播的拍翻译成 03b 两段进度的状态。
 * 文案与真实流程逐字一致（「读到 N 条事实」/「比对了 M 条法条」），
 * 因为它们本来就是同一个组件在渲染。
 */
function stagesOf(fired: ReplayBeat[]): AnalysisStageState[] {
  const factsBeats = fired.filter((beat) => beat.kind === "facts-progress");
  const analyzeBeat = fired.find((beat) => beat.kind === "analyze-progress");
  const analyzed = fired.some(
    (beat) => beat.kind === "card-reveal" || beat.kind === "result",
  );
  const factCount = factsBeats[factsBeats.length - 1]?.factCount ?? 0;

  return [
    {
      id: "facts",
      status: analyzeBeat ? "done" : factsBeats.length > 0 ? "running" : "pending",
      detailZh: analyzeBeat ? `读到 ${factCount} 条事实` : undefined,
    },
    {
      id: "analyze",
      status: analyzed ? "done" : analyzeBeat ? "running" : "pending",
      detailZh: analyzed
        ? `比对了 ${analyzeBeat?.statuteCount ?? 0} 条法条`
        : undefined,
    },
  ];
}

export interface ReplayStageProps {
  caseInput: CaseInput;
  analysis: AnalysisResult;
  beats: ReplayBeat[];
  firedCount: number;
  onSkip: () => void;
}

export function ReplayStage({
  caseInput,
  analysis,
  beats,
  firedCount,
  onSkip,
}: ReplayStageProps) {
  const fired = beats.slice(0, firedCount);
  const current = firedCount > 0 ? beats[firedCount - 1] : null;
  const scene = sceneOf(fired);

  const arrived = fired.filter((beat) => beat.kind === "evidence-arrive");
  const prefillBeat = fired.find((beat) => beat.kind === "prefill");
  const factsBeats = fired.filter((beat) => beat.kind === "facts-progress");
  const analyzeBeat = fired.find((beat) => beat.kind === "analyze-progress");
  const revealed = fired.filter((beat) => beat.kind === "card-reveal");
  const latestCard = revealed[revealed.length - 1];

  return (
    <div className="mx-auto w-full max-w-[720px] px-4 pb-10 md:px-6">
      {/* 头部：进度 + 常驻「跳过」。旁白单独一条，免得 sticky 高度跟着文案跳 */}
      <header className="sticky top-0 z-20 -mx-4 border-b border-line bg-paper px-4 py-3 md:-mx-6 md:px-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-micro uppercase text-muted">
              示例案例 · 零 API 重放
            </p>
            <p className="mt-0.5 text-section text-ink">重放一次完整分析</p>
          </div>
          <button
            type="button"
            onClick={onSkip}
            className="shrink-0 rounded-xl border border-line bg-card px-3 py-2 text-label font-semibold text-ink transition-colors duration-150 hover:bg-paper"
          >
            跳过 →
          </button>
        </div>

        <div className="mt-2.5 h-1 w-full overflow-hidden rounded-full bg-line">
          <div
            className="h-full rounded-full bg-ink transition-[width] duration-300"
            style={{ width: `${(firedCount / beats.length) * 100}%` }}
          />
        </div>
      </header>

      {/* 旁白：当前这一拍在做什么 */}
      <div className="mt-4 min-h-[3.25rem]" aria-live="polite">
        <p className="text-section text-ink">
          {current?.labelZh ?? "准备重放这个案子的分析过程"}
        </p>
        <p className="mt-0.5 text-caption leading-relaxed text-muted">
          {current?.detailZh ?? "全程零网络请求，断网也能看完"}
        </p>
      </div>

      <div className="mt-3 flex flex-col gap-3">
        {/* ① 上传台 */}
        {scene === "intake" ? (
          <section className="flex flex-col gap-2">
            <p className="font-mono text-micro uppercase text-muted">
              上传的材料 · {arrived.length} / {caseInput.evidence.length}
            </p>
            {caseInput.evidence.map((file) => {
              const beat = arrived.find((item) => item.evidenceId === file.id);
              if (!beat) {
                return (
                  <div
                    key={file.id}
                    className="rounded-xl border border-dashed border-line px-3 py-5 text-caption text-muted md:px-4"
                  >
                    等待文件…
                  </div>
                );
              }
              return (
                <div key={file.id} className="step-enter">
                  <EvidenceThumb
                    evidence={file}
                    captionZh={beat.detailZh}
                    sampleBadge
                  />
                </div>
              );
            })}
          </section>
        ) : null}

        {/* 上传台收成一行 */}
        {scene === "prefill" || scene === "analyze" ? (
          <section className="rounded-2xl border border-line bg-card px-4 py-3 md:px-5">
            <p className="font-mono text-micro uppercase text-muted">
              材料已就位 · {caseInput.evidence.length} 份
            </p>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {caseInput.evidence.map((file) => (
                <li
                  key={file.id}
                  className="rounded-full border border-line bg-paper px-2.5 py-0.5 text-caption text-muted"
                >
                  {file.fileName}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* ② 预填：金色扫过复用向导那套 .prefilled，三个字段错开半拍进场 */}
        {prefillBeat && scene !== "cards" ? (
          <section className="rounded-2xl border border-line bg-card px-4 py-3 md:px-5">
            <p className="font-mono text-micro uppercase text-muted">
              {prefillBeat.labelZh}
            </p>
            <dl className="mt-2 grid grid-cols-3 gap-2">
              {(prefillBeat.fields ?? []).map((field, index) => (
                <div
                  key={field}
                  className="prefilled rounded-xl border border-line px-2.5 py-2"
                  style={{
                    animationDelay: `calc(var(--duration-quick) * ${index * 2})`,
                  }}
                >
                  <dt className="font-mono text-micro uppercase text-muted">
                    {FIELD_LABEL[field]}
                  </dt>
                  <dd className="tnum mt-0.5 font-mono text-label font-semibold text-amount">
                    {fieldValue(field, caseInput)}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ) : null}

        {/* ③ 两段进度：与真实流程同一个组件，连文案都不改 */}
        {scene === "analyze" ? (
          <AnalysisProgress
            stages={stagesOf(fired)}
            stateLabel={caseInput.state}
            factsRunningLabel={factsBeats[factsBeats.length - 1]?.labelZh}
            variant="full"
          />
        ) : null}

        {/* ④ 翻卡：一次只留最新的一张，等结果页再一次给全 */}
        {scene === "cards" ? (
          <>
            <section className="rounded-2xl border border-line bg-card px-4 py-3 md:px-5">
              <p className="font-mono text-micro uppercase text-muted">已完成</p>
              <p className="tnum mt-1 text-label leading-relaxed text-ink">
                {caseInput.evidence.length} 份材料 · 读到{" "}
                {factsBeats[factsBeats.length - 1]?.factCount ?? 0} 条事实 · 比对{" "}
                {analyzeBeat?.statuteCount ?? 0} 条法条
              </p>
            </section>

            <div>
              <p className="font-mono text-micro uppercase text-muted">
                逐项对照 · 第 {revealed.length} / {analysis.items.length} 张
              </p>
              {latestCard ? (
                <div key={latestCard.id} className="step-enter mt-2">
                  <ComparisonCard
                    item={analysis.items[latestCard.itemIndex ?? 0]}
                    ordinal={(latestCard.itemIndex ?? 0) + 1}
                    facts={analysis.facts}
                  />
                </div>
              ) : null}
            </div>
          </>
        ) : null}
      </div>

      <p className="mt-6 text-caption leading-relaxed text-muted">
        这是预载示例，你的案子会实时分析。整段重放不发任何网络请求，
        文件、当事人与地址全部虚构。
      </p>
    </div>
  );
}
