"use client";

/**
 * `/sample` 重放的时钟（04b §2）。
 *
 * 只做三件事：按 `ReplayBeat.atMs` 逐拍推进、随时可跳过、
 * `prefers-reduced-motion: reduce` 时**一拍都不播**直接给结果页。
 *
 * 纪律：
 * - 零网络请求 —— 数据全是 04a 的模块常量，这里只管时间
 * - reduce 的判断走 `lib/reduced-motion.ts`（`useSyncExternalStore`），
 *   与首页第 2 幕的轮播共用同一处读法
 * - `atMs` 已经排在 `--duration-beat`（1200ms）的格子上，这里不再自己造节拍
 */

import { useCallback, useEffect, useRef, useState } from "react";

import { useReducedMotion } from "@/lib/reduced-motion";
import type { ReplayBeat } from "@/lib/types";

/**
 * 落幕停顿：最后一拍（`result`）之后不立刻换页，先在墨黑面上把判决横幅升起来。
 * 结果页的第一幕正是同一条横幅，所以这一停顿把「三张卡翻完 → 突然换成另一页」
 * 变成「同一块深色面上，结论先落定，页面再在它底下展开」。
 */
const OUTRO_MS = 2000;

export type ReplayStatus =
  /** 正在逐拍推进 */
  | "playing"
  /** 最后一拍已落、判决横幅升起，正在过渡到结果页 */
  | "outro"
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
  /** 暂停中。暂停是录屏刚需：讲到哪一拍就停在哪一拍 */
  paused: boolean;
  /** 「跳过」：任何时刻可点，直达结果页 */
  skip: () => void;
  /** 从头再播一遍（reduce 时不提供） */
  restart: () => void;
  /** 暂停 / 继续 */
  togglePause: () => void;
}

export function useReplay(beats: ReplayBeat[]): ReplayState {
  const reducedMotion = useReducedMotion();

  const [firedCount, setFiredCount] = useState(0);
  const [ended, setEnded] = useState(false);
  const [outro, setOutro] = useState(false);
  const [paused, setPaused] = useState(false);

  /**
   * 已经播掉的毫秒数。暂停时清掉全部定时器并把进度记在这里，继续时按
   * 「还差多少」重新排一遍 —— 定时器本身没有暂停语义，只能自己记时。
   */
  const playedRef = useRef(0);

  const status: ReplayStatus =
    ended || reducedMotion ? "finished" : outro ? "outro" : "playing";

  // 落幕停顿走完再换页；「跳过」不经过它，点了就直达结果
  useEffect(() => {
    if (status !== "outro") return;
    const timer = window.setTimeout(() => setEnded(true), OUTRO_MS);
    return () => window.clearTimeout(timer);
  }, [status]);

  useEffect(() => {
    if (status !== "playing" || paused) return;

    const last = beats.length - 1;
    const base = playedRef.current;
    const startedAt = Date.now();

    const timers = beats
      .map((beat, index) => {
        // 暂停前已经播过的拍不再重播
        if (beat.atMs < base) return null;
        return window.setTimeout(() => {
          setFiredCount(index + 1);
          // `result` 拍是「判决落定」；换页交给上面那段落幕停顿
          if (beat.kind === "result" || index === last) setOutro(true);
        }, beat.atMs - base);
      })
      .filter((id): id is number => id !== null);

    return () => {
      playedRef.current = base + (Date.now() - startedAt);
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [status, paused, beats]);

  const skip = useCallback(() => setEnded(true), []);

  const restart = useCallback(() => {
    playedRef.current = 0;
    setFiredCount(0);
    setEnded(false);
    setOutro(false);
    setPaused(false);
  }, []);

  const togglePause = useCallback(() => setPaused((current) => !current), []);

  return {
    status,
    firedCount,
    current: firedCount > 0 ? beats[firedCount - 1] : null,
    reducedMotion,
    paused,
    skip,
    restart,
    togglePause,
  };
}
