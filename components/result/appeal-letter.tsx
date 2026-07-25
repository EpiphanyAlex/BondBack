"use client";

/**
 * 申诉信（03b §4）。
 *
 * - `textarea` 可编辑，编辑**不回写分析结果**（信是给人发的，改了不影响逐项对照）
 * - 「复制全文」是微信内置浏览器下载受限时的兜底，必须存在且好用
 * - 中文对照解释 `letterZhNotes` 在信下方展示，**不进 PDF**
 */

import { useEffect, useRef, useState } from "react";

import { copyToClipboard, cx } from "./utils";

type Feedback = { tone: "ok" | "warn"; text: string } | null;

export interface AppealLetterProps {
  letterEn: string;
  letterZhNotes?: string;
  /** PDF 文件名，不含扩展名 */
  fileName?: string;
  className?: string;
  id?: string;
}

export function AppealLetter({
  letterEn,
  letterZhNotes,
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
      className={cx("rounded-2xl border border-line bg-card p-4 md:p-5", className)}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 className="text-section text-ink">申诉信（英文）</h2>
        <span className="font-mono text-micro uppercase text-muted">
          可直接发送
        </span>
      </div>
      <p className="mt-1 text-caption leading-relaxed text-muted">
        金额、押金号、法条编号与期限由程序填入。你可以直接改这里的文字，
        改动不会影响上面的逐项对照。
      </p>

      <textarea
        ref={areaRef}
        value={text}
        onChange={(event) => setText(event.target.value)}
        spellCheck={false}
        aria-label="申诉信英文正文"
        className="field-input mt-3 h-64 resize-y text-body leading-relaxed"
      />

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={handleCopy}
          className="rounded-xl bg-ink px-3 py-3 text-body font-semibold text-white transition active:scale-[0.99]"
        >
          复制全文
        </button>
        <button
          type="button"
          onClick={handleDownload}
          disabled={busy}
          className="rounded-xl border border-line bg-card px-3 py-3 text-body font-semibold text-ink transition-colors duration-150 hover:bg-paper disabled:opacity-50"
        >
          {busy ? "生成中…" : "下载 PDF"}
        </button>
      </div>

      <p
        aria-live="polite"
        className={cx(
          "mt-2 min-h-5 text-caption leading-relaxed",
          feedback?.tone === "warn" ? "text-verdict-doubtful" : "text-muted",
        )}
      >
        {feedback?.text ??
          "微信里下载受限是常见的，「复制全文」永远可用。"}
      </p>

      {letterZhNotes ? (
        <div className="mt-4 rounded-xl border border-line bg-paper px-3.5 py-3">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <h3 className="text-label font-semibold text-ink">中文对照解释</h3>
            <span className="font-mono text-micro uppercase text-muted">
              不进 PDF
            </span>
          </div>
          <p className="mt-2 whitespace-pre-line text-caption leading-relaxed text-muted">
            {letterZhNotes}
          </p>
        </div>
      ) : null}
    </section>
  );
}
