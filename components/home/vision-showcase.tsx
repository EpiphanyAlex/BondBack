/**
 * 愿景橱窗（04b §1 末段）。
 *
 * 红线：措辞一律是「即将支持」，**不得暗示当前可用** —— 所以每一条都带
 * 「未上线」角标，区块开头和结尾各说一次「现在还用不了」。
 * 这里只讲方向，不讲时间表（对外文案避免绝对化承诺）。
 */

const UPCOMING = [
  {
    titleZh: "QLD / WA 州法规",
    bodyZh:
      "当前版本只覆盖 NSW 与 VIC 两州的租赁法。其他州的法条正在按同一套「原文 + 官方来源」的标准整理。",
  },
  {
    titleZh: "入住留证",
    bodyZh:
      "搬进去那天就把房况拍好、存好、标好日期。退租时房东说的「这是你弄坏的」，当场就有对照。",
  },
  {
    titleZh: "中介往来助手",
    bodyZh:
      "把和中介的邮件、消息整理成一条时间线，谁在哪天说过什么一目了然，写申诉信时直接取用。",
  },
];

export function VisionShowcase() {
  return (
    <section className="mx-auto w-full max-w-[1152px] px-4 pt-10 pb-4 md:px-6 md:pt-12">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="text-title text-ink">即将支持</h2>
        <p className="font-mono text-micro uppercase text-muted">
          以下功能尚未上线
        </p>
      </div>
      <p className="mt-1.5 text-label leading-relaxed text-muted">
        下面三项还在开发中，当前版本不提供，也不要按它们来安排你的退租时间。
      </p>

      <ul className="mt-4 grid gap-3 lg:grid-cols-3">
        {UPCOMING.map((item) => (
          <li
            key={item.titleZh}
            className="rounded-2xl border border-dashed border-line bg-card px-4 py-4 md:px-5"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <p className="text-section text-ink">{item.titleZh}</p>
              <span className="rounded-full border border-line px-2 py-0.5 font-mono text-micro uppercase text-muted">
                即将支持
              </span>
            </div>
            <p className="mt-2 text-label leading-relaxed text-muted">
              {item.bodyZh}
            </p>
          </li>
        ))}
      </ul>

      <p className="mt-4 text-caption leading-relaxed text-muted">
        现在能用的是：NSW / VIC 两州的逐项对照、英文申诉信与行动路线。
        本工具提供信息辅助，不构成法律意见，金额与法条请在发出前自行复核。
      </p>
    </section>
  );
}
