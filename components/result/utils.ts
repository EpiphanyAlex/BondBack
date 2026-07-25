/**
 * 结果页共用的小工具（03b）。刻意做薄：只放三处以上会重复的纯函数。
 * 任何视觉决策都不在这里 —— 这里不产出 className。
 */

import type { AnalysisItem, EvidenceFact } from "@/lib/types";

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

/** 金额只格式化数字本身，`$` 由调用方决定要不要带（深色条上 `$` 单独降一档字号）。 */
export function formatMoney(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "—";
  }
  return value.toLocaleString("en-AU", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export function money(value: number | null | undefined): string {
  const formatted = formatMoney(value);
  return formatted === "—" ? formatted : `$${formatted}`;
}

/**
 * 从中文长句里取第一小句，给首屏「三条为什么」用。
 * 在第一个句读处断开（至少 10 字，避免把「按 s 30，」这种半截拎出来），
 * 实在没有句读就按字数硬断，并尽量退回到最近的空格，别把英文词劈开。
 */
export function leadClauseZh(text: string, maxChars = 44): string {
  const clean = text.trim().replace(/\s+/g, " ");
  if (!clean) return "";

  const breakers = new Set(["。", "！", "？", "；", "，", ";", "!", "?"]);
  for (let i = 10; i < clean.length && i <= maxChars; i += 1) {
    if (breakers.has(clean[i]!)) return clean.slice(0, i);
  }

  if (clean.length <= maxChars) return clean;

  const hard = clean.slice(0, maxChars);
  const lastSpace = hard.lastIndexOf(" ");
  const safe = lastSpace > maxChars - 10 ? hard.slice(0, lastSpace) : hard;
  return `${safe.trimEnd()}…`;
}

/** 对照卡的法条行要窄：法案全名放展开面板里，行上只留可辨认的短名。 */
export function shortActName(act: string): string {
  return act
    .replace(/^Residential Tenancies\s+/i, "RT ")
    .replace(/\s+/g, " ")
    .trim();
}

/** 本次比对到的不重复法条条数 —— 两段进度里「比对了 M 条法条」报的就是它。 */
export function countStatutes(items: AnalysisItem[]): number {
  return new Set(
    items.flatMap((item) =>
      item.statuteRefs.map((ref) => `${ref.act}|${ref.section}`),
    ),
  ).size;
}

/** 被 `evidenceRefs` 采用的 factId（去重）。 */
export function usedFactIdsOf(items: AnalysisItem[]): string[] {
  return Array.from(
    new Set(items.flatMap((item) => item.evidenceRefs.map((ref) => ref.factId))),
  );
}

export function factsById(facts: EvidenceFact[]): Map<string, EvidenceFact> {
  return new Map(facts.map((fact) => [fact.id, fact]));
}

/** 扣款描述在首屏只留一个短标签：先按分隔符断，再按字数兜底。 */
export function shortLabelZh(description: string, maxChars = 9): string {
  const head = description.split(/[+/、,，·]/)[0]?.trim() || description.trim();
  return head.length > maxChars ? `${head.slice(0, maxChars)}…` : head;
}

/** 统一的滚动：`prefers-reduced-motion` 下不做平滑动画。 */
export function scrollToElement(
  element: HTMLElement | null,
  block: ScrollLogicalPosition = "start",
): void {
  if (!element) return;
  const reduce =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  element.scrollIntoView({ block, behavior: reduce ? "auto" : "smooth" });
}

/**
 * 复制到剪贴板。微信内置浏览器 / 非安全上下文下 `navigator.clipboard` 会直接抛，
 * 所以必须留 `execCommand` 兜底 —— 下载受限时「复制全文」是唯一的出口。
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // 落到下面的兜底
    }
  }

  if (typeof document === "undefined") return false;

  try {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.top = "0";
    area.style.left = "0";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.focus();
    area.select();
    area.setSelectionRange(0, text.length);
    const ok = document.execCommand("copy");
    document.body.removeChild(area);
    return ok;
  } catch {
    return false;
  }
}
