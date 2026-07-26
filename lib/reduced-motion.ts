"use client";

/**
 * 「用户开了减少动效吗」的唯一读法。
 *
 * 走 `useSyncExternalStore` 而不是 `useEffect` + `setState`：
 * - 服务端快照恒为 `false`（当作可以播），客户端接管后自然纠正，
 *   既不会 hydration mismatch，也不用在 effect 里同步 setState
 *   （那会触发级联渲染，`react-hooks/set-state-in-effect` 会直接报错）
 * - 用户中途在系统里改了设置，`change` 事件会把订阅者一起叫醒
 *
 * 用它的地方：`/sample` 重放（一拍都不播）、首页第 2 幕（不自动轮播）。
 * 纯 CSS 能降级的动画不必来这里 —— `globals.css` 里已有全局 `reduce` 兜底，
 * 只有**由动画驱动逻辑**（重放时钟、轮播换段）才需要在 JS 里知道这件事。
 */

import { useSyncExternalStore } from "react";

const REDUCE_QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void): () => void {
  const query = window.matchMedia?.(REDUCE_QUERY);
  query?.addEventListener("change", onChange);
  return () => query?.removeEventListener("change", onChange);
}

function getSnapshot(): boolean {
  return Boolean(window.matchMedia?.(REDUCE_QUERY).matches);
}

/** 服务端渲染时没有 matchMedia，先当作「可以播」，客户端接管后再纠正。 */
function getServerSnapshot(): boolean {
  return false;
}

export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
