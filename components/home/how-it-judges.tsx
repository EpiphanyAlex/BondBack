/**
 * 首页第 2 幕（「江湖战报」稿 §01 第 2 幕）—— 全站唯一的浅色面。
 *
 * 论点只有一句：**它不是替你写封信，是把每一笔对到一条法条上。**
 * 所以这一幕把 01/02/03 三段做成**一条可点的流水线**（三根顶边细线连成一排，
 * 不是三张卡）：点哪一段，右边就换成那一段的真实产物 —— 原句 / 三轴 / 对照卡，
 * 三块都是 `data/sample-case` 里的真数据，不做任何「首页简化版」。
 * 交互本体在 `PipelineDemo`（客户端），这里只留标题。
 */

import { PipelineDemo } from "./pipeline-demo";

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

      <PipelineDemo />
    </section>
  );
}
