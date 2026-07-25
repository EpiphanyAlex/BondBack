/**
 * 向导顶栏与步骤抬头。进度用分段刻度而不是圆点：向导确实是有序的三步，
 * 刻度既表示位置也表示「还剩多少」。
 */

import Link from "next/link";
import type { ReactNode } from "react";

export interface WizardStepMeta {
  id: string;
  title: string;
  question: string;
  hint?: string;
  /** 账本条上的主行动文案；每步说清楚「按下去会发生什么」 */
  cta?: string;
}

export function WizardTopBar({
  stepIndex,
  steps,
  onBack,
}: {
  stepIndex: number;
  steps: WizardStepMeta[];
  onBack: () => void;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-paper/90 backdrop-blur">
      <div className="mx-auto flex max-w-md items-center gap-3 px-4 py-3">
        {stepIndex === 0 ? (
          <Link
            href="/"
            className="-ml-1 rounded-lg px-2 py-1 text-label text-muted"
            aria-label="返回首页"
          >
            ←
          </Link>
        ) : (
          <button
            type="button"
            onClick={onBack}
            className="-ml-1 rounded-lg px-2 py-1 text-label text-muted"
            aria-label="返回上一步"
          >
            ←
          </button>
        )}

        <div className="flex flex-1 items-center gap-1.5" aria-hidden="true">
          {steps.map((step, index) => (
            <span
              key={step.id}
              className={`h-1 flex-1 rounded-full transition-colors ${
                index <= stepIndex ? "bg-ink" : "bg-line"
              }`}
            />
          ))}
        </div>

        <span className="font-mono text-micro text-muted">
          {String(stepIndex + 1).padStart(2, "0")}/
          {String(steps.length).padStart(2, "0")}
        </span>
      </div>
    </header>
  );
}

export function StepHeading({
  step,
  children,
}: {
  step: WizardStepMeta;
  children?: ReactNode;
}) {
  return (
    <div>
      <p className="font-mono text-micro uppercase text-muted">
        {step.title}
      </p>
      <h2 className="mt-1.5 font-display text-title leading-tight font-extrabold text-ink">
        {step.question}
      </h2>
      {step.hint ? (
        <p className="mt-2 text-label leading-relaxed text-muted">{step.hint}</p>
      ) : null}
      {children}
    </div>
  );
}
