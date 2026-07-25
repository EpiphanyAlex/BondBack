/**
 * 首页第 2 幕（「江湖战报」稿 §01 第 2 幕）—— 全站唯一的浅色面。
 *
 * 论点只有一句：**它不是替你写封信，是把每一笔对到一条法条上。**
 * 所以这一幕把 01/02/03 三段做成**一条流水线**（三根顶边细线连成一排，
 * 不是三张卡），右边紧跟着摆它的真实输出 —— 与结果页同一个
 * `ComparisonCard` 组件、同一份数据，不做任何「首页简化版」。
 *
 * 服务端组件：首屏的论据不该等 JS（卡本身自带 "use client"）。
 */

import Link from "next/link";

import { ComparisonCard } from "@/components/result/comparison-card";
import {
  SAMPLE_ANALYSIS,
  SAMPLE_CASE_INPUT,
  SAMPLE_FACTS,
  SAMPLE_STATUTE_COUNT,
} from "@/data/sample-case";

/** 卡①：退租清洁 + 地毯蒸洗 $780 ❌ —— 三条法条压着的那一张，最有说服力。 */
const HERO_ITEM = SAMPLE_ANALYSIS.items[0]!;

const STEPS = [
  {
    ordinal: "01",
    titleZh: "读懂你的证据",
    bodyZh: "入住报告、租约、聊天记录 —— 读成带页码的可引用原句。",
  },
  {
    ordinal: "02",
    titleZh: "三轴过一遍",
    bodyZh: "原已存在？合约真有此义务？属合理磨损？",
  },
  {
    ordinal: "03",
    titleZh: "出结论与信",
    bodyZh: "逐笔给判决，写好英文申诉信与下一步路线。",
  },
];

export function HowItJudges() {
  return (
    <section
      id="how"
      className="mx-auto w-full max-w-[1152px] scroll-mt-4 px-4 pt-12 md:px-6 md:pt-16"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-3">
        <h2 className="h-shout text-display text-ink">
          它不是替你写封信，
          <br />
          是把每一笔对到一条法条上。
        </h2>
        <p className="font-mono text-micro text-faint">
          EVIDENCE → CONTRACT → STATUTE → VERDICT
        </p>
      </div>

      {/* 三段用顶边细线连成一条流水线（不是三张卡）：第一段是朱红，
          后两段是墨黑淡线 —— 视线从红那头起步，自然往右走。 */}
      <ol className="mt-8 grid gap-6 md:mt-10 lg:grid-cols-3 lg:gap-0">
        {STEPS.map((step, index) => (
          <li
            key={step.ordinal}
            className={`border-t-[3px] pt-4 ${
              index === 0 ? "border-seal" : "border-ink/20"
            } ${index === 0 ? "lg:pr-7" : index === 1 ? "lg:px-7" : "lg:pl-7"}`}
          >
            <p
              className={`font-number text-title leading-none ${
                index === 0 ? "text-verdict-unlawful" : "text-ink"
              }`}
            >
              {step.ordinal}
            </p>
            <p className="mt-2.5 text-section font-bold text-ink">
              {step.titleZh}
            </p>
            <p className="mt-2 max-w-[300px] text-label text-muted">
              {step.bodyZh}
            </p>
          </li>
        ))}
      </ol>

      <div className="mt-10 grid gap-8 md:mt-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,700px)] lg:gap-11">
        <div>
          <p className="font-mono text-micro text-faint">
            右边这张卡是它的真实输出
          </p>
          <p className="mt-3.5 max-w-[380px] text-section text-ink">
            {SAMPLE_CASE_INPUT.evidence.length} 份材料 → {SAMPLE_FACTS.length}{" "}
            条可引用的事实 → {SAMPLE_STATUTE_COUNT} 条法条 → 三个判决。
            卡上每一句引语都点得回原件。
          </p>

          {/* 军规：示例案例必须标虚构 */}
          <p className="mt-5 inline-flex items-center gap-2.5 border border-ink/30 px-3.5 py-2">
            <span className="size-[7px] rounded-full bg-gold-bright" />
            <span className="font-mono text-micro text-muted">
              示例案例 · 文件与当事人均为虚构
            </span>
          </p>

          <p className="mt-6">
            <Link
              href="/sample"
              className="border-b-2 border-seal pb-0.5 text-section font-bold text-ink"
            >
              看完整示例（会重放整个过程）→
            </Link>
          </p>
        </div>

        {/* 与结果页同一个组件、同一份数据 */}
        <ComparisonCard item={HERO_ITEM} facts={SAMPLE_ANALYSIS.facts} />
      </div>
    </section>
  );
}
