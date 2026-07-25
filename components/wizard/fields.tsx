/**
 * 向导表单原子。刻意做薄：只统一间距、描边与选中态，不做受控组件抽象，
 * 免得每个步骤都要跟一层包装打架。
 *
 * 「江湖战报」稿之后这一层最大的变化是**表单里不再有卡片**：
 * 每一组只由一行等宽小标签领着，靠间距分组。原来一屏四五个圆角描边盒子摞起来，
 * 是「组件库 Demo」感最重的地方；稿子里中栏从头到尾只有标签、输入和一条底线。
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
  /** `quiet` 是「顺带一提」的那种组：加一条左边线把它降一级 */
  tone?: "plain" | "quiet";
}) {
  return (
    <section
      className={tone === "quiet" ? "border-l-2 border-line pl-4" : undefined}
    >
      {title ? (
        <h3 className="font-mono text-micro text-faint">{title}</h3>
      ) : null}
      {hint ? (
        <p className="mt-1.5 text-caption text-muted">{hint}</p>
      ) : null}
      <div className={title || hint ? "mt-3.5" : ""}>{children}</div>
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
    <div className={highlight ? "prefilled" : undefined}>
      <label htmlFor={htmlFor} className="block font-mono text-micro text-faint">
        {label}
      </label>
      {hint ? <p className="mt-1 text-caption text-muted">{hint}</p> : null}
      <div className="mt-2.5">{children}</div>
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

/**
 * 金额输入。稿子里金额是**一条底线上的 Anton 数字**，不是描边盒子 ——
 * 钱是这一页的主角，给它一条实的下划线就够了，四面描边只会把它降成普通字段。
 */
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
    <div className="flex items-baseline gap-1.5 border-b-2 border-ink px-1 pb-1.5 focus-within:border-seal">
      <span className="font-number text-section text-faint">$</span>
      <input
        id={id}
        className="w-full min-w-0 border-0 bg-transparent p-0 font-number text-num-sm text-ink outline-none placeholder:text-faint/60"
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
      className="w-full border-0 border-b-2 border-ink bg-transparent px-1 pb-1.5 font-mono text-section text-ink outline-none focus:border-seal"
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

/** 单选：做成大按钮，手机上好点，也比原生 radio 好看。选中 = 墨黑底 + 朱红边 */
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
      className={`grid gap-3 ${columns === 2 ? "grid-cols-2" : "grid-cols-1"}`}
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
              "border-2 px-4 py-3.5 text-left text-body transition-colors duration-150",
              selected
                ? "border-seal bg-ink text-paper"
                : "border-line bg-card text-ink hover:border-ink/40",
              choice.disabled ? "cursor-not-allowed opacity-45" : null,
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <span className="font-bold">{choice.label}</span>
            {choice.hint ? (
              <span
                className={`mt-1 block text-caption ${
                  selected ? "text-paper/65" : "text-muted"
                }`}
              >
                {choice.hint}
              </span>
            ) : null}
            {choice.disabled && choice.disabledNote ? (
              <span className="mt-1 block font-mono text-micro text-faint">
                {choice.disabledNote}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/** 多选标签。方角，选中 = 实心墨黑 */
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
    <div role="group" aria-label={ariaLabel} className="flex flex-wrap gap-2.5">
      {choices.map((choice) => {
        const selected = values.includes(choice.value);
        return (
          <button
            key={choice.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onToggle(choice.value)}
            className={[
              "border px-4 py-2.5 text-label transition-colors duration-150",
              selected
                ? "border-ink bg-ink font-bold text-paper"
                : "border-ink/25 bg-transparent text-ink hover:border-ink/50",
            ].join(" ")}
          >
            {choice.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * 提示块。稿子里这类块一律是**左侧三像素色条 + 淡色底**，没有四面描边 ——
 * 它是正文旁边的一句话，不是又一张卡。
 */
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
    info: "border-l-line bg-card",
    warn: "border-l-alert-verify bg-verdict-doubtful-wash",
    risk: "border-l-alert-risk bg-alert-risk/8",
  }[tone];

  return (
    <div className={`border-l-[3px] px-4 py-3.5 text-label text-ink ${palette}`}>
      <p className="font-bold">{title}</p>
      {children ? (
        <div className="mt-1.5 text-caption text-muted">{children}</div>
      ) : null}
    </div>
  );
}
