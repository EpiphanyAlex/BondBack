/**
 * 三格能力图示（04b §1 往下滚的第一段）。
 *
 * 说的是产品的三层能力，第二格是壁垒所在：把每一笔扣款对到具体证据、
 * 合同义务和州法条上。三档结论的图例在首屏（`home-hero.tsx`）已经教过，
 * 这里不重复一份。
 */

/**
 * 正文压到一句一格。原先每格 50–58 字，三格加起来比首屏全部文案还长，
 * 而这三句要传达的其实只是**这条流水线有三站**；细节由结果页本体去证明。
 */
const STEPS = [
  {
    ordinal: "①",
    titleZh: "读懂你的证据",
    bodyZh: "入住报告、租约、聊天记录，读成可引用的原句。",
  },
  {
    ordinal: "②",
    titleZh: "对照州法条",
    bodyZh: "每笔单独过三轴：原已存在？合约有无此义务？合理磨损？",
  },
  {
    ordinal: "③",
    titleZh: "出结论与信",
    bodyZh: "逐项给结论，房东占理的直说别争，再写好英文信。",
  },
];

export function CapabilityTrio() {
  return (
    <section className="mx-auto w-full max-w-[1152px] px-4 pt-10 md:px-6 md:pt-12">
      {/* 「不是上传文件→AI 写封信」那句删了：首屏那张真卡本身就在说这件事 */}
      <h2 className="text-title text-ink">它到底做了什么</h2>

      <ol className="mt-4 grid gap-3 lg:grid-cols-3">
        {STEPS.map((step) => (
          <li
            key={step.ordinal}
            className="rounded-2xl border border-line bg-card px-4 py-4 md:px-5"
          >
            <p className="flex items-baseline gap-2">
              <span className="font-mono text-section text-muted">
                {step.ordinal}
              </span>
              <span className="text-section text-ink">{step.titleZh}</span>
            </p>
            <p className="mt-2 text-label leading-relaxed text-muted">
              {step.bodyZh}
            </p>
          </li>
        ))}
      </ol>

    </section>
  );
}
