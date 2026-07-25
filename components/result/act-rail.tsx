"use client";

/**
 * 结果页左侧的卷轴（稿子 §04）。
 *
 * 结果页有五段，加起来两千多像素高。上一版没有任何「我在哪」的指示，
 * 滚到中途就不知道后面还有什么、也回不去。卷轴是最轻的解法：五个点，
 * 当前那一段填成实心，点一下跳过去。
 *
 * 只在 ≥lg 出现 —— 手机上它会挤掉正文宽度，而手机本来就是一路往下读。
 * 位置由 IntersectionObserver 跟真实滚动位置算，不靠点击记录。
 */

import { useEffect, useState } from "react";

export interface ActRailItem {
  id: string;
  label: string;
}

export function ActRail({ items }: { items: ActRailItem[] }) {
  const [active, setActive] = useState(items[0]?.id ?? "");

  useEffect(() => {
    const nodes = items
      .map((item) => document.getElementById(item.id))
      .filter((node): node is HTMLElement => Boolean(node));
    if (nodes.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // 视口里可能同时有两段，取最靠上的那一段作为「当前」
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      // 只认视口上半部分：一段刚露头就算「到了」，比等它占满屏幕跟手
      { rootMargin: "-10% 0px -55% 0px", threshold: 0 },
    );

    for (const node of nodes) observer.observe(node);
    return () => observer.disconnect();
  }, [items]);

  return (
    <nav aria-label="结果页导航" className="hidden lg:block">
      <div className="sticky top-10 border-r border-line py-10 pr-7">
        <p className="font-mono text-micro text-faint">卷轴</p>
        <ul className="mt-5 flex flex-col gap-6">
          {items.map((item) => {
            const current = item.id === active;
            return (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  aria-current={current ? "true" : undefined}
                  className="flex items-center gap-3"
                >
                  <span
                    className={`size-2.5 shrink-0 rounded-full border-2 ${
                      current
                        ? "border-seal bg-seal"
                        : "border-ink/35 bg-transparent"
                    }`}
                  />
                  <span
                    className={`font-mono text-micro ${
                      current ? "font-semibold text-ink" : "text-faint"
                    }`}
                  >
                    {item.label}
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
