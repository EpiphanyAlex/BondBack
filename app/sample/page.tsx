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

import { useEffect } from "react";
import Link from "next/link";

import { ReplayFinale, ReplayStage } from "@/components/replay/replay-stage";
import { useReplay } from "@/components/replay/use-replay";
import { ResultView } from "@/components/result/result-view";
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
 *
 * 原来是四段整句（约 160 字），可那张卡上已经写着押金、索扣、可争议三个数字，
 * 旁边再用一整段把同样的数字读一遍是重复。只留两条卡上没有的信息：
 * 二维码通向哪里，以及这些材料是虚构的（后者是军规）。
 */
const SHARE_NOTES = [
  "二维码指向这个工具，对方扫开就能跑自己的扣款单。",
  "文件、当事人、地址与押金号全部虚构，仅用于演示。",
];

export default function SamplePage() {
  const replay = useReplay(SAMPLE_REPLAY_TIMELINE);

  /*
   * 落幕与换页都回到页顶。翻卡那一段会把舞台撑长，用户多半正停在页面中段；
   * 不回顶，判决横幅就升在视口外，两秒停顿等于白留。
   */
  useEffect(() => {
    if (replay.status === "playing") return;
    window.scrollTo({ top: 0 });
  }, [replay.status]);

  // 最后一拍之后的两秒：判决横幅先落定，下一帧 ResultView 在它底下展开
  if (replay.status === "outro") {
    return (
      <ReplayFinale caseInput={SAMPLE_CASE_INPUT} analysis={SAMPLE_ANALYSIS} />
    );
  }

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

      {/* 卡靠左、说明靠右，整块收在一张卡面里、限宽 880 ——
          上一版标题压在卡上方、说明只有两行贴在卡右边，卡右侧空出大半个屏，
          在桌面上像是布局塌了一半。标题搬到右栏，卡与文字互相收边。 */}
      <section className="mx-auto w-full max-w-[1152px] border-t border-line px-4 pb-12 pt-9 md:px-6">
        <div className="max-w-[880px] border border-line bg-card p-5 md:p-7 lg:grid lg:grid-cols-[360px_minmax(0,1fr)] lg:gap-9">
          <WarCardShare
            sample
            bondAmount={SAMPLE_CASE_INPUT.bondAmount}
            ledger={SAMPLE_ANALYSIS.ledger}
            itemCount={SAMPLE_ANALYSIS.items.length}
            statuteCount={SAMPLE_STATUTE_COUNT}
            stateLabel={SAMPLE_CASE_INPUT.state}
          />

          {/* 右栏收在一个 CTA 上：看完别人的案子，下一步本来就是跑自己的 */}
          <div className="mt-6 flex flex-col lg:mt-0">
            <h2 className="h-shout text-title text-ink">带走这张战报卡</h2>
            <p className="mt-2.5 text-label text-muted">
              转发给还在纠结要不要认栽的室友。
            </p>
            <ul className="mt-5 flex flex-col gap-3">
              {SHARE_NOTES.map((note) => (
                <li
                  key={note}
                  className="border-l-2 border-line pl-3.5 text-label text-muted"
                >
                  {note}
                </li>
              ))}
            </ul>

            <div className="mt-7 border-t border-line pt-6 lg:mt-auto">
              <p className="text-section text-ink">
                这张卡上的每个数字，都是从上面那四份材料里读出来的。
              </p>
              <Link
                href="/wizard"
                className="mt-4 inline-block bg-seal px-7 py-3.5 text-body font-bold text-paper transition-colors duration-150 hover:bg-seal/90"
              >
                换成我自己的案子 →
              </Link>
            </div>
          </div>
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
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-l-[3px] border-l-alert-verify bg-verdict-doubtful-wash px-4 py-3">
      <p className="min-w-0 text-caption text-muted">
        <span className="font-mono text-micro text-ink">示例案例</span> ——
        这是预载示例，文件与当事人全部虚构；你的案子会实时分析。
      </p>
      <div className="flex shrink-0 flex-wrap items-center gap-4">
        {showReplay ? (
          <button
            type="button"
            onClick={onReplay}
            className="font-mono text-micro text-ink underline underline-offset-4"
          >
            再看一遍重放
          </button>
        ) : null}
        <Link
          href="/wizard"
          className="bg-ink px-4 py-2 text-caption font-bold text-paper"
        >
          换成我的案子 →
        </Link>
      </div>
    </div>
  );
}
