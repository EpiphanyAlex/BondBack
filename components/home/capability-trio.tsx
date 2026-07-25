/**
 * 三格能力图示（04b §1 往下滚的第一段）。
 *
 * 说的是产品的三层能力，第二格是壁垒所在：把每一笔扣款对到具体证据、
 * 合同义务和州法条上。三档结论的图例在首屏（`home-hero.tsx`）已经教过，
 * 这里不重复一份。
 */

const STEPS = [
  {
    ordinal: "①",
    titleZh: "读懂你的证据",
    bodyZh:
      "入住报告、租约、和中介的聊天记录、扣款清单，一份份读成可以直接引用的原句，连「合约里没写这一条」这种否命题也记下来。",
  },
  {
    ordinal: "②",
    titleZh: "对照州法条",
    bodyZh:
      "每一笔扣款单独过一遍：入住时就有的？合约里到底有没有这项义务？对应哪一条租赁法？法条附英文原文与官方来源链接。",
  },
  {
    ordinal: "③",
    titleZh: "出结论 + 信 + 路线",
    bodyZh:
      "逐项给结论，房东占理的那笔会诚实告诉你别争；再拼一封可直接发送的英文申诉信，附中文对照和下一步该找谁。",
  },
];

export function CapabilityTrio() {
  return (
    <section className="mx-auto w-full max-w-[1152px] px-4 pt-10 md:px-6 md:pt-12">
      <h2 className="text-title text-ink">它到底做了什么</h2>
      <p className="mt-1.5 text-label leading-relaxed text-muted">
        不是「上传文件 → AI 写封信」。中间那一步才是重点：把扣款、证据、合同和法条一一对上。
      </p>

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
