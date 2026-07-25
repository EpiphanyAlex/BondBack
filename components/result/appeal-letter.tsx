"use client";

/**
 * 申诉信（03b §4）—— 第三幕「给房东发信」的主角。
 *
 * - `textarea` 可编辑，编辑**不回写分析结果**（信是给人发的，改了不影响逐项对照）
 * - 「复制全文」是微信内置浏览器下载受限时的兜底，必须存在且好用
 * - 中文对照解释**已从界面撤掉**（2026-07-26，产品决定）：这封信是要原样发出去的
 *   成品，旁边挂一份六百字的中文注解，会让人以为还得先读懂它才能发。
 *   `AnalysisResult.letterZhNotes` 仍由 `lib/letter.ts` 确定性生成（零 token 成本），
 *   只是不再渲染 —— 要恢复的话把它接回这一幕即可
 */

import { useEffect, useRef, useState } from "react";

import { copyToClipboard, cx } from "./utils";

type Feedback = { tone: "ok" | "warn"; text: string } | null;

export interface AppealLetterProps {
  letterEn: string;
  /** PDF 文件名，不含扩展名 */
  fileName?: string;
  className?: string;
  id?: string;
}

export function AppealLetter({
  letterEn,
  fileName,
  className,
  id,
}: AppealLetterProps) {
  const [text, setText] = useState(letterEn);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 重试后拿到新的信 → 用新版本覆盖（编辑态本来就只在本地）。
  // 渲染期直接调整而不是走 effect：effect 版本会先把旧信渲染一帧再覆盖，
  // 编辑框会肉眼可见地闪一下旧内容。
  const [syncedLetter, setSyncedLetter] = useState(letterEn);
  if (syncedLetter !== letterEn) {
    setSyncedLetter(letterEn);
    setText(letterEn);
  }

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  const flash = (next: Feedback) => {
    setFeedback(next);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setFeedback(null), 3000);
  };

  const handleCopy = async () => {
    const ok = await copyToClipboard(text);
    if (ok) {
      flash({ tone: "ok", text: "已复制全文，去邮件里直接粘贴正文" });
      return;
    }
    areaRef.current?.focus();
    areaRef.current?.select();
    flash({ tone: "warn", text: "浏览器不给复制权限，已帮你全选，长按选择「拷贝」" });
  };

  const handleDownload = async () => {
    setBusy(true);
    try {
      // jspdf 只在点击时才加载，不进首屏 bundle
      const { downloadLetterPdf } = await import("@/lib/pdf-letter");
      const ok = await downloadLetterPdf(text, { fileName });
      flash(
        ok
          ? { tone: "ok", text: "PDF 已生成" }
          : { tone: "warn", text: "这个浏览器拦了下载，请改用「复制全文」" },
      );
    } catch {
      flash({ tone: "warn", text: "PDF 生成失败，请改用「复制全文」" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section
      id={id}
      className={cx("border border-line bg-card", className)}
    >
      {/* 卡头是「成品 + 一个动作」：标题旁边直接就是那颗朱红的「复制全文」*/}
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4 border-b border-line px-5 py-5 md:px-7">
        <div className="min-w-0">
          <h2 className="h-shout text-section text-ink">申诉信（英文）</h2>
          <p className="mt-1.5 text-label text-muted">
            金额、押金号、期限由程序填入，不经过 AI。可直接改。
          </p>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="shrink-0 bg-seal px-6 py-3.5 text-body font-bold whitespace-nowrap text-paper transition-colors duration-150 hover:bg-seal/90"
        >
          复制全文
        </button>
      </div>

      <textarea
        ref={areaRef}
        value={text}
        onChange={(event) => setText(event.target.value)}
        spellCheck={false}
        aria-label="申诉信英文正文"
        className="h-96 w-full resize-y border-0 bg-card px-5 py-5 font-mono text-caption leading-loose text-ink outline-none md:px-7 lg:h-[34rem]"
      />

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-line px-5 py-3.5 md:px-7">
        <button
          type="button"
          onClick={handleDownload}
          disabled={busy}
          className="font-mono text-micro text-ink underline underline-offset-4 disabled:opacity-50"
        >
          {busy ? "生成中…" : "下载 PDF"}
        </button>
        <p
          aria-live="polite"
          className={cx(
            "min-h-4 font-mono text-micro",
            feedback?.tone === "warn" ? "text-verdict-doubtful" : "text-faint",
          )}
        >
          {feedback?.text ?? "微信里下载常被拦，「复制全文」永远可用"}
        </p>
      </div>
    </section>
  );
}

/** `<details>` 的开合指示：跟着 group 的 open 态转 180°。 */
export function Chevron() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0 text-faint transition-transform duration-150 group-open:rotate-180"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}
