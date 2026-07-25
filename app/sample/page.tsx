"use client";

/**
 * `/sample` —— 零 API 的全流程重放（04b §2）。
 *
 * 不是一张静态结果页：先把上传 → 预填 → 读证据 → 对法条 → 翻卡整个过程播一遍
 * （约 12.6s），再停在 **03b 的 `ResultView` 本体**上 —— 同组件、同数据，
 * 与真实流程视觉完全一致。
 *
 * 三条硬约束：
 * - **零网络请求**：数据全是 04a 的模块常量，组件全部静态 import（不用
 *   `next/dynamic`，否则断网时那个 chunk 拉不下来，重放会停在半路）
 * - **「跳过」常驻**：sticky 头部右上角，第 0 帧就已经渲染，任何时刻可点
 * - **`prefers-reduced-motion: reduce`**：一拍都不播，挂载后直接落到结果页
 */

import Link from "next/link";

import { ReplayStage } from "@/components/replay/replay-stage";
import { useReplay } from "@/components/replay/use-replay";
import { ResultView } from "@/components/result/result-view";
import { money } from "@/components/result/utils";
import { WarCardShare } from "@/components/share/war-card";
import {
  SAMPLE_ANALYSIS,
  SAMPLE_CASE_INPUT,
  SAMPLE_REPLAY_TIMELINE,
  SAMPLE_STATUTE_COUNT,
} from "@/data/sample-case";

/**
 * 卡片旁边的说明。措辞纪律同战报卡：说的是「找出可争议扣款」，
 * 不承诺钱会回来（军规：对外文案避免绝对化承诺）。
 * 数字一律从常量算，不手抄。
 */
const SHARE_NOTES = [
  `卡上的数字全部来自这个示例案例：押金 ${money(SAMPLE_CASE_INPUT.bondAmount)}、房东索扣 ${money(SAMPLE_ANALYSIS.ledger.claimedTotal)}，其中 ${money(SAMPLE_ANALYSIS.ledger.disputableTotal)} 找得出可以争的依据。`,
  "二维码指向这个工具本身。对方扫开后可以上传自己的扣款清单和入住报告，跑出属于他的那张卡。",
  "这里所有的文件、当事人、地址与押金号都是虚构的，只用于演示对照能力。",
  "工具做的是帮你定位可争议的扣款、把法条摆出来，不构成法律意见，也不代表结果一定如此。",
];

export default function SamplePage() {
  const replay = useReplay(SAMPLE_REPLAY_TIMELINE);

  if (replay.status !== "finished") {
    return (
      <ReplayStage
        caseInput={SAMPLE_CASE_INPUT}
        analysis={SAMPLE_ANALYSIS}
        beats={SAMPLE_REPLAY_TIMELINE}
        firedCount={replay.firedCount}
        onSkip={replay.skip}
      />
    );
  }

  return (
    <>
      <ResultView
        caseInput={SAMPLE_CASE_INPUT}
        analysis={SAMPLE_ANALYSIS}
        showSampleDocuments
        header={
          <SampleBanner
            onReplay={replay.restart}
            showReplay={!replay.reducedMotion}
          />
        }
      />

      <section className="mx-auto w-full max-w-[1152px] px-4 pb-10 md:px-6">
        <h2 className="text-section text-ink">带走这张战报卡</h2>
        <p className="mt-1 max-w-[720px] text-caption leading-relaxed text-muted">
          转发给正在纠结要不要认栽的室友或朋友。扫码就能打开这个工具，
          用他们自己的扣款清单跑一遍。
        </p>
        <div className="mt-3 lg:grid lg:grid-cols-[380px_1fr] lg:items-start lg:gap-8">
          <WarCardShare
            sample
            bondAmount={SAMPLE_CASE_INPUT.bondAmount}
            ledger={SAMPLE_ANALYSIS.ledger}
            itemCount={SAMPLE_ANALYSIS.items.length}
            statuteCount={SAMPLE_STATUTE_COUNT}
            stateLabel={SAMPLE_CASE_INPUT.state}
          />
          <ul className="mt-4 flex max-w-[520px] flex-col gap-2 lg:mt-0">
            {SHARE_NOTES.map((note) => (
              <li
                key={note}
                className="rounded-xl border border-line bg-card px-3.5 py-2.5 text-caption leading-relaxed text-muted"
              >
                {note}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}

/** 结果页顶部那条：说清这是预载示例，并给「重播 / 换成我的案子」两个出口。 */
function SampleBanner({
  onReplay,
  showReplay,
}: {
  onReplay: () => void;
  showReplay: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-xl border border-line bg-card px-3.5 py-2.5">
      <p className="min-w-0 text-caption leading-relaxed text-muted">
        <span className="font-mono text-micro uppercase text-ink">示例案例</span>{" "}
        —— 这是预载示例，文件与当事人全部虚构；你的案子会实时分析。
      </p>
      <div className="flex shrink-0 flex-wrap gap-2">
        {showReplay ? (
          <button
            type="button"
            onClick={onReplay}
            className="rounded-lg border border-line bg-card px-3 py-1.5 text-caption font-medium text-ink transition-colors duration-150 hover:bg-paper"
          >
            再看一遍重放
          </button>
        ) : null}
        <Link
          href="/wizard"
          className="rounded-lg bg-ink px-3 py-1.5 text-caption font-medium text-white"
        >
          换成我的案子 →
        </Link>
      </div>
    </div>
  );
}
