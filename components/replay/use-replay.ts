"use client";

/**
 * `/sample` 重放的时钟（04b §2）。
 *
 * 只做三件事：按 `ReplayBeat.atMs` 逐拍推进、随时可跳过、
 * `prefers-reduced-motion: reduce` 时**一拍都不播**直接给结果页。
 *
 * 纪律：
 * - 零网络请求 —— 数据全是 04a 的模块常量，这里只管时间
 * - reduce 的判断走 `useSyncExternalStore`：服务端快照恒为 `false`，
 *   客户端接管后自然纠正，既不会 hydration mismatch 也不用在 effect 里 setState
 * - `atMs` 已经排在 `--duration-beat`（1200ms）的格子上，这里不再自己造节拍
 */

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

import type { ReplayBeat } from "@/lib/types";

const REDUCE_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void): () => void {
  const query = window.matchMedia?.(REDUCE_QUERY);
  query?.addEventListener("change", onChange);
  return () => query?.removeEventListener("change", onChange);
}

function getReducedMotion(): boolean {
  return Boolean(window.matchMedia?.(REDUCE_QUERY).matches);
}

/** 服务端渲染时没有 matchMedia，先当作「可以播」，客户端接管后再纠正。 */
function getServerReducedMotion(): boolean {
  return false;
}

export type ReplayStatus =
  /** 正在逐拍推进 */
  | "playing"
  /** 播完、跳过、或 reduce 直接落地 —— 一律停在结果页 */
  | "finished";

export interface ReplayState {
  status: ReplayStatus;
  /** 已经播过的拍数 */
  firedCount: number;
  /** 当前这一拍（旁白文案取它） */
  current: ReplayBeat | null;
  /** 用户系统开了减少动效 —— 界面据此隐藏「重播」这类会再播一次的入口 */
  reducedMotion: boolean;
  /** 「跳过」：任何时刻可点，直达结果页 */
  skip: () => void;
  /** 从头再播一遍（reduce 时不提供） */
  restart: () => void;
}

export function useReplay(beats: ReplayBeat[]): ReplayState {
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotion,
    getServerReducedMotion,
  );

  const [firedCount, setFiredCount] = useState(0);
  const [ended, setEnded] = useState(false);

  const status: ReplayStatus =
    ended || reducedMotion ? "finished" : "playing";

  useEffect(() => {
    if (status !== "playing") return;

    const last = beats.length - 1;
    const timers = beats.map((beat, index) =>
      window.setTimeout(() => {
        setFiredCount(index + 1);
        // `result` 拍就是「停在完整结果页」；没有这一拍时用最后一拍兜底
        if (beat.kind === "result" || index === last) setEnded(true);
      }, beat.atMs),
    );

    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [status, beats]);

  const skip = useCallback(() => setEnded(true), []);

  const restart = useCallback(() => {
    setFiredCount(0);
    setEnded(false);
  }, []);

  return {
    status,
    firedCount,
    current: firedCount > 0 ? beats[firedCount - 1] : null,
    reducedMotion,
    skip,
    restart,
  };
}
