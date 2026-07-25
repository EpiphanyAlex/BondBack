/**
 * 向导表单原子。刻意做薄：只统一间距、描边与选中态，不做受控组件抽象，
 * 免得每个步骤都要跟一层包装打架。
 */

import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

export function SectionCard({
  title,
  hint,
  children,
  tone = "plain",
}: {
  title?: ReactNode;
  hint?: ReactNode;
  children: ReactNode;
  tone?: "plain" | "quiet";
}) {
  return (
    <section
      className={`rounded-2xl border border-line p-4 ${
        tone === "quiet" ? "bg-paper" : "bg-card"
      }`}
    >
      {title ? (
        <h3 className="text-[15px] font-semibold text-ink">{title}</h3>
      ) : null}
      {hint ? <p className="mt-1 text-xs leading-relaxed text-muted">{hint}</p> : null}
      <div className={title || hint ? "mt-3" : ""}>{children}</div>
    </section>
  );
}

export function Field({
  label,
  hint,
  htmlFor,
  highlight = false,
  children,
}: {
  label: ReactNode;
  hint?: ReactNode;
  htmlFor?: string;
  /** 自动预填刚写入时扫一道金光 */
  highlight?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={highlight ? "prefilled rounded-xl" : ""}>
      <label
        htmlFor={htmlFor}
        className="block text-sm font-medium text-ink"
      >
        {label}
      </label>
      {hint ? <p className="mt-1 text-xs leading-relaxed text-muted">{hint}</p> : null}
      <div className="mt-2">{children}</div>
    </div>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`field-input ${props.className ?? ""}`} />;
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea {...props} className={`field-input ${props.className ?? ""}`} />
  );
}

/** 金额输入：手机上直接调数字键盘，前缀固定 $ */
export function AmountInput({
  id,
  value,
  onChange,
  placeholder = "0",
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-sm text-muted">
        $
      </span>
      <input
        id={id}
        className="field-input tnum pl-7 font-mono"
        inputMode="decimal"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

export function DateInput({
  id,
  value,
  onChange,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <input
      id={id}
      type="date"
      className="field-input font-mono"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

export interface Choice<T extends string> {
  value: T;
  label: string;
  hint?: string;
  disabled?: boolean;
  disabledNote?: string;
}

/** 单选：做成大按钮，手机上好点，也比原生 radio 好看 */
export function ChoiceGroup<T extends string>({
  choices,
  value,
  onChange,
  columns = 1,
  ariaLabel,
}: {
  choices: Choice<T>[];
  value: T | null;
  onChange: (value: T) => void;
  columns?: 1 | 2;
  ariaLabel: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={`grid gap-2 ${columns === 2 ? "grid-cols-2" : "grid-cols-1"}`}
    >
      {choices.map((choice) => {
        const selected = choice.value === value;
        return (
          <button
            key={choice.value}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={choice.disabled}
            onClick={() => onChange(choice.value)}
            className={[
              "rounded-xl border px-3.5 py-3 text-left text-[15px] transition",
              selected
                ? "border-ink bg-ink text-white"
                : "border-line bg-card text-ink",
              choice.disabled ? "cursor-not-allowed opacity-45" : "active:scale-[0.99]",
            ].join(" ")}
          >
            <span className="font-medium">{choice.label}</span>
            {choice.hint ? (
              <span
                className={`mt-0.5 block text-xs ${
                  selected ? "text-white/70" : "text-muted"
                }`}
              >
                {choice.hint}
              </span>
            ) : null}
            {choice.disabled && choice.disabledNote ? (
              <span className="mt-0.5 block font-mono text-[11px] uppercase tracking-wide text-muted">
                {choice.disabledNote}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/** 多选标签 */
export function ChipGroup<T extends string>({
  choices,
  values,
  onToggle,
  ariaLabel,
}: {
  choices: Choice<T>[];
  values: T[];
  onToggle: (value: T) => void;
  ariaLabel: string;
}) {
  return (
    <div role="group" aria-label={ariaLabel} className="flex flex-wrap gap-2">
      {choices.map((choice) => {
        const selected = values.includes(choice.value);
        return (
          <button
            key={choice.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onToggle(choice.value)}
            className={[
              "rounded-full border px-3.5 py-2 text-sm transition active:scale-[0.98]",
              selected
                ? "border-ink bg-ink font-medium text-white"
                : "border-line bg-card text-ink",
            ].join(" ")}
          >
            {choice.label}
          </button>
        );
      })}
    </div>
  );
}

/** 黄色核实提示 / 红色风险提示统一样式；措辞由调用方负责 */
export function Callout({
  tone,
  title,
  children,
}: {
  tone: "info" | "warn" | "risk";
  title: ReactNode;
  children?: ReactNode;
}) {
  const palette = {
    info: "border-line bg-paper text-ink",
    warn: "border-gold-bright/50 bg-gold-wash text-ink",
    risk: "border-seal/35 bg-seal/10 text-ink",
  }[tone];

  return (
    <div className={`rounded-xl border px-3.5 py-3 text-sm ${palette}`}>
      <p className="font-medium">{title}</p>
      {children ? (
        <div className="mt-1 text-[13px] leading-relaxed text-muted">{children}</div>
      ) : null}
    </div>
  );
}
