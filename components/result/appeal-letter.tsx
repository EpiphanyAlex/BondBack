"use client";

/**
 * 申诉信（03b §4）—— 第三幕「拿去发」的主角。
 *
 * - `textarea` 可编辑，编辑**不回写分析结果**（信是给人发的，改了不影响逐项对照）
 * - 「复制全文」是微信内置浏览器下载受限时的兜底，必须存在且好用
 * - 中文对照解释拆成了同文件导出的 `LetterNotes`：它在 ≥lg 走信件**旁注栏**，
 *   而不是压在信下面。信原先挤在 380px 固定右栏里，英文正文一行只有三十几个字符，
 *   这一版把它放进整幅宽栏，旁注单独成栏（design-tokens §4.2）
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
      className={cx("rounded-2xl border border-line bg-card p-4 md:p-5", className)}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 className="text-section text-ink">申诉信（英文）</h2>
        <span className="font-mono text-micro uppercase text-muted">
          可直接发送
        </span>
      </div>
      <p className="mt-1.5 text-label leading-relaxed text-muted">
        金额与法条已填好，可以直接改。
      </p>

      <textarea
        ref={areaRef}
        value={text}
        onChange={(event) => setText(event.target.value)}
        spellCheck={false}
        aria-label="申诉信英文正文"
        className="field-input mt-4 h-96 resize-y text-body leading-relaxed lg:h-[34rem]"
      />

      <div className="mt-4 flex flex-col gap-2.5 md:flex-row md:gap-3">
        <button
          type="button"
          onClick={handleCopy}
          className="rounded-xl bg-ink px-5 py-3 text-body font-semibold text-white transition active:scale-[0.99]"
        >
          复制全文
        </button>
        <button
          type="button"
          onClick={handleDownload}
          disabled={busy}
          className="rounded-xl border border-line bg-card px-5 py-3 text-body font-semibold text-ink transition-colors duration-150 hover:bg-paper disabled:opacity-50"
        >
          {busy ? "生成中…" : "下载 PDF"}
        </button>
      </div>

      <p
        aria-live="polite"
        className={cx(
          "mt-2.5 min-h-5 text-caption leading-relaxed",
          feedback?.tone === "warn" ? "text-verdict-doubtful" : "text-muted",
        )}
      >
        {feedback?.text ?? "微信里下载常被拦，「复制全文」永远可用。"}
      </p>
    </section>
  );
}

/**
 * 中文对照解释 —— ≥lg 站在信件右侧的旁注栏里（手机上顺序不变，接在信后面）。
 * **不进 PDF**：PDF 是要发给房东的，中文注解是给你自己看的。
 *
 * **默认折叠**：它是全页最长的一块（示例案例里 636 字），而且是**查阅型**内容 ——
 * 你要么在改某一段时来对一下，要么根本不看。常开着就是把整页最大的一堵字墙
 * 摆在最显眼的位置。用原生 `<details>`：零 JS、键盘可达、不需要管 reduced-motion。
 */
export function LetterNotes({
  notes,
  className,
}: {
  notes: string;
  className?: string;
}) {
  return (
    <details
      className={cx(
        "group rounded-2xl border-l-2 border-line bg-card p-4 md:p-5",
        className,
      )}
    >
      <summary className="flex cursor-pointer list-none items-center gap-3 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0 flex-1">
          <span className="block text-section text-ink">中文对照解释</span>
          <span className="mt-0.5 block text-label text-muted">
            逐段说明这封信在争什么
          </span>
        </span>
        <span className="shrink-0 font-mono text-micro uppercase text-muted">
          不进 PDF
        </span>
        <Chevron />
      </summary>
      <p className="mt-3 whitespace-pre-line border-t border-line pt-3 text-label leading-relaxed text-ink">
        {notes}
      </p>
    </details>
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
      className="shrink-0 text-muted transition-transform duration-150 group-open:rotate-180"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}
