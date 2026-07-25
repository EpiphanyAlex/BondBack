/**
 * 「即将支持」清单 —— 收尾幕的右半栏（「江湖战报」稿 §01 收尾）。
 *
 * 红线：措辞一律是「即将支持」，**不得暗示当前可用**。
 * 形态是一列虚线分隔的条目，不是三张卡：一个讲「这些还不能用」的区块
 * 不该在视觉上和真能用的功能平起平坐。
 */

const UPCOMING = [
  { titleZh: "QLD / WA", noteZh: "其余各州法规" },
  { titleZh: "入住留证", noteZh: "入住当天拍照存档" },
  { titleZh: "中介往来助手", noteZh: "邮件消息理成时间线" },
];

export function VisionShowcase() {
  return (
    <div>
      <p className="font-mono text-micro text-paper/45">
        即将支持 · 尚未上线，别按它们安排退租
      </p>
      <ul className="mt-4.5 flex flex-col gap-3">
        {UPCOMING.map((item) => (
          <li
            key={item.titleZh}
            className="flex items-baseline gap-3.5 border-b border-dashed border-paper/22 pb-3"
          >
            <span className="text-section font-bold text-paper">
              {item.titleZh}
            </span>
            <span className="text-label text-paper/50">{item.noteZh}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
