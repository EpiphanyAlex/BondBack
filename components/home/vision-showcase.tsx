/**
 * 愿景橱窗（04b §1 末段）。
 *
 * 红线：措辞一律是「即将支持」，**不得暗示当前可用**。
 *
 * **压回一行。** `docs/prd/06-move-in-mode.md:18` 给的形态本来就是一行：
 * 「即将支持：QLD / WA · 入住留证（…） · 中介往来助手」。原实现把它铺成三张
 * 虚线卡 + 前后各一段「现在还用不了」+ 一段重复的免责声明，约 250 字 ——
 * 一个讲「这些还不能用」的区块占掉首页近两成文字量，是本末倒置。
 * 「未上线」的信息由 `即将支持` 这个标签本身承担，说一次就够。
 */

const UPCOMING = [
  { titleZh: "QLD / WA", noteZh: "其余各州法规" },
  { titleZh: "入住留证", noteZh: "入住当天拍照存档" },
  { titleZh: "中介往来助手", noteZh: "邮件消息理成时间线" },
];

export function VisionShowcase() {
  return (
    <section className="mx-auto w-full max-w-[1152px] px-4 pt-10 pb-4 md:px-6 md:pt-12">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="text-section text-ink">即将支持</h2>
        <p className="font-mono text-micro uppercase text-muted">
          尚未上线，别按它们安排退租
        </p>
      </div>

      <ul className="mt-3 flex flex-wrap gap-2">
        {UPCOMING.map((item) => (
          <li
            key={item.titleZh}
            className="flex items-baseline gap-2 rounded-full border border-dashed border-line bg-card px-3.5 py-1.5"
          >
            <span className="text-label font-semibold text-ink">
              {item.titleZh}
            </span>
            <span className="text-caption text-muted">{item.noteZh}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
