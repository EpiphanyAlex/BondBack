"use client";

/**
 * 战报卡（04b §3）—— 转发出去的那一张图。
 *
 * **措辞红线**：不写「追回」「拿回」「帮你要回来」。工具的战果是**找出可争议扣款**，
 * 钱有没有回来是房东和仲裁的事。也不用第一人称 —— 用户转发时不该替一个
 * 虚构案例作证，所以卡上没有「我」，只有这个案子的数字。
 *
 * **对比度红线**：主数字用 `--color-amount-hero`，它对浅色纸面只有 1.99:1，
 * 只能坐在深色面上（墨蓝底 7.58:1）。所以整张卡是 `bg-ink`。
 *
 * 实现：DOM 先按 3:4 竖版画出来 → `html-to-image` 转 PNG → 换成 `<img>`，
 * 微信里长按即可保存 / 转发。二维码由 `qrcode` 在本地生成，不发网络请求，
 * 所以断网也拿得到这张卡。
 */

import { useEffect, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { toDataURL } from "qrcode";

import { cx, formatMoney, money } from "@/components/result/utils";
import { SITE_URL } from "@/lib/site";
import type { AnalysisLedger } from "@/lib/types";

/** 二维码指向部署地址（与 OG meta 共用 `lib/site.ts` 这一处事实源）。 */
export const SHARE_URL = SITE_URL;

/** 二维码位图边长（PNG 里的实际像素）；卡上按 88px 显示，不会被放大糊掉。 */
const QR_PIXELS = 264;
const QR_DISPLAY = 88;

/** 等 QR 的 <img> 落地再截图；两帧足够，比盲等一个整节拍稳。 */
const CAPTURE_FRAMES = 2;

export interface WarCardProps {
  bondAmount: number;
  ledger: AnalysisLedger;
  /** 扣款笔数 */
  itemCount: number;
  /** 本案比对到的不重复法条条数 */
  statuteCount: number;
  /** 如「NSW」 */
  stateLabel: string;
  /** 示例案例才加角标；真实结果页的卡不带（04b §3） */
  sample?: boolean;
  /** 本地生成的二维码 data URL */
  qrDataUrl?: string;
  className?: string;
}

export function WarCard({
  bondAmount,
  ledger,
  itemCount,
  statuteCount,
  stateLabel,
  sample = false,
  qrDataUrl,
  className,
}: WarCardProps) {
  return (
    <div
      className={cx(
        "flex aspect-[3/4] w-full max-w-[360px] flex-col justify-between rounded-2xl bg-ink px-5 py-5 text-white",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        {sample ? (
          <span className="rounded-full border border-white/25 px-2 py-0.5 font-mono text-micro uppercase text-white/70">
            示例案例
          </span>
        ) : (
          <span />
        )}
        <span className="font-mono text-micro uppercase text-white/55">
          BondBack · 押金侠
        </span>
      </div>

      {/* 主数字：找出多少可争议扣款 —— 不是「追回了多少」 */}
      <div>
        <p className="font-mono text-micro uppercase text-white/55">
          AI 逐项找出
        </p>
        <p className="tnum mt-1 font-display text-hero leading-none font-extrabold text-amount-hero">
          <span className="text-section font-semibold">$</span>
          {formatMoney(ledger.disputableTotal)}
        </p>
        <p className="mt-1.5 text-body font-semibold text-white">可争议扣款</p>
        <p className="tnum mt-2 text-label leading-snug text-white/70">
          按此应退回至少{" "}
          <span className="font-semibold text-white">
            {money(ledger.refundExpected)}
          </span>
        </p>
      </div>

      <div className="border-t border-ink-soft pt-3">
        <p className="tnum font-mono text-caption text-white/60">
          押金 {money(bondAmount)} · 索扣 {money(ledger.claimedTotal)}
        </p>
        <p className="tnum mt-0.5 font-mono text-caption text-white/60">
          {itemCount} 笔 · {stateLabel} 租赁法 {statuteCount} 条法条
        </p>
      </div>

      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-label leading-snug text-white/80">
            扫码，逐项比对你的扣款单
          </p>
          <p className="mt-1 text-caption leading-snug text-white/45">
            信息辅助，不构成法律意见
          </p>
        </div>
        <span className="shrink-0 rounded-lg bg-white p-1.5">
          {qrDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qrDataUrl}
              alt={`扫码打开 BondBack（${SHARE_URL}）`}
              width={QR_DISPLAY}
              height={QR_DISPLAY}
              className="block"
            />
          ) : (
            <span
              className="block"
              style={{ width: QR_DISPLAY, height: QR_DISPLAY }}
            />
          )}
        </span>
      </div>
    </div>
  );
}

/* ── 生成 PNG 并换成 <img> ────────────────────────────────────────────── */

export interface WarCardShareProps extends Omit<WarCardProps, "qrDataUrl"> {
  /** 卡下面那行提示要不要显示；录屏时可以关掉 */
  showHint?: boolean;
}

export function WarCardShare({
  showHint = true,
  className,
  ...card
}: WarCardShareProps) {
  const nodeRef = useRef<HTMLDivElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | undefined>(undefined);
  const [png, setPng] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  // 二维码本地生成，不走网络。默认黑白，不传 color 就没有硬编码色值
  useEffect(() => {
    let alive = true;
    toDataURL(SHARE_URL, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: QR_PIXELS,
    })
      .then((url) => {
        if (alive) setQrDataUrl(url);
      })
      .catch(() => {
        if (alive) setFailed(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  // 二维码就位后再截图，否则 PNG 里会缺一块
  useEffect(() => {
    if (!qrDataUrl || png) return;
    let alive = true;
    let raf = 0;
    let frames = 0;

    const capture = () => {
      const node = nodeRef.current;
      if (!alive || !node) return;
      void toPng(node, { pixelRatio: 3, cacheBust: false })
        .then((url) => {
          if (alive) setPng(url);
        })
        .catch(() => {
          // 失败不致命：下面会继续显示可截图的 DOM 卡片
          if (alive) setFailed(true);
        });
    };

    const tick = () => {
      frames += 1;
      if (frames >= CAPTURE_FRAMES) {
        capture();
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
    };
  }, [qrDataUrl, png]);

  return (
    <div className={cx("flex flex-col items-start gap-2", className)}>
      {png ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={png}
          alt="BondBack 战报卡"
          className="block w-full max-w-[360px] rounded-2xl"
        />
      ) : (
        <div ref={nodeRef} className="w-full max-w-[360px]">
          <WarCard {...card} qrDataUrl={qrDataUrl} />
        </div>
      )}

      {showHint ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <p className="text-caption leading-relaxed text-muted">
            {png
              ? "微信里长按图片即可保存或转发。"
              : failed
                ? "这张卡截图保存即可。"
                : "正在生成可保存的图片…"}
          </p>
          {png ? (
            <a
              href={png}
              download="bondback-war-card.png"
              className="text-caption font-medium text-ink underline underline-offset-2"
            >
              下载图片
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
