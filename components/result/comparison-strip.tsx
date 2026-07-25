"use client";

/**
 * 第二幕 · 逐笔对照（稿子 §04）—— **一次只看一笔**。
 *
 * 上一版是把三张长卡竖着摞起来，第三张在手机上要滚七八屏才见得到，
 * 而它们本来是**并列的三个判决**，不是递进的三段论述。改成横向吸附的一条卡带：
 * 屏幕上永远只有当前这一笔，左右滑动切换，右边露出下一张的边暗示还有。
 *
 * 键盘与读屏不靠横滑：上方的刻度是可点的按钮（也是当前位置指示），
 * 卡带本身可聚焦、可用左右方向键翻页。
 */

import { useCallback, useEffect, useRef, useState } from "react";

import type { AnalysisItem, EvidenceFact } from "@/lib/types";

import { ComparisonCard } from "./comparison-card";
import { VERDICT_META } from "./verdict";

export function ComparisonStrip({
  items,
  facts,
  onFactClick,
}: {
  items: AnalysisItem[];
  facts: EvidenceFact[];
  onFactClick?: (fact: EvidenceFact) => void;
}) {
  const stripRef = useRef<HTMLUListElement>(null);
  const cardsRef = useRef<(HTMLLIElement | null)[]>([]);
  const [active, setActive] = useState(0);

  // 当前是第几张由「谁占住了卡带中间」决定，而不是由点击记录 ——
  // 用户是用手滑的，状态必须跟着真实滚动位置走
  useEffect(() => {
    const root = stripRef.current;
    if (!root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = Number(
            (entry.target as HTMLElement).dataset.index ?? "0",
          );
          setActive(index);
        }
      },
      { root, threshold: 0.6 },
    );

    for (const card of cardsRef.current) {
      if (card) observer.observe(card);
    }
    return () => observer.disconnect();
  }, [items.length]);

  const goTo = useCallback((index: number) => {
    const root = stripRef.current;
    const card = cardsRef.current[index];
    if (!root || !card) return;
    const reduce = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    // 用 scrollTo 而不是 scrollIntoView：后者会连带把整页也滚一段
    root.scrollTo({
      left: card.offsetLeft - root.offsetLeft,
      behavior: reduce ? "auto" : "smooth",
    });
  }, []);

  if (items.length === 0) return null;

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-3">
        <h2 className="h-shout text-title text-ink">
          第 {active + 1} 笔 / {items.length}
        </h2>

        <div className="flex items-center gap-2.5">
          {items.map((item, index) => (
            <button
              key={`${item.description}-${index}`}
              type="button"
              onClick={() => goTo(index)}
              aria-label={`看第 ${index + 1} 笔：${item.description}`}
              aria-current={index === active}
              className={`h-1 w-8 transition-colors duration-150 ${
                index === active
                  ? VERDICT_META[item.verdict].fill
                  : "bg-ink/18 hover:bg-ink/35"
              }`}
            />
          ))}
          <span className="ml-2.5 font-mono text-micro text-faint">
            左右滑动 →
          </span>
        </div>
      </div>

      {/*
        `-mr-4 md:-mr-6` 让卡带咬住纸的右边缘：下一张露出来的那一条边就是
        「还有」的全部提示，收在容器里反而看不出可以滑。
      */}
      <ul
        ref={stripRef}
        tabIndex={0}
        aria-label="逐笔对照"
        onKeyDown={(event) => {
          if (event.key === "ArrowRight") {
            event.preventDefault();
            goTo(Math.min(active + 1, items.length - 1));
          }
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            goTo(Math.max(active - 1, 0));
          }
        }}
        className="strip -mr-4 mt-5 flex gap-5 pr-4 pb-2 md:-mr-6 md:pr-6"
      >
        {items.map((item, index) => (
          <li
            key={`${item.description}-${index}`}
            data-index={index}
            ref={(node) => {
              cardsRef.current[index] = node;
            }}
            className="snap w-[86vw] max-w-[860px]"
          >
            <ComparisonCard
              item={item}
              ordinal={index + 1}
              facts={facts}
              onFactClick={onFactClick}
              className="h-full"
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
