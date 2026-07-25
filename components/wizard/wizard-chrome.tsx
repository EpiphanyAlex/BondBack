/**
 * 向导的外壳：墨黑顶栏、桌面左侧步骤轨、步骤抬头。
 *
 * 进度用**三段刻度**而不是圆点：向导确实是有序的三步，刻度既表示位置
 * 也表示「还剩多少」。桌面另有一条 260px 的步骤轨（稿子 §02），
 * 它比顶栏那三段更能说明「我在哪、还剩什么」，也放得下每一步的一句解释。
 */

import Link from "next/link";
import type { ReactNode } from "react";

export interface WizardStepMeta {
  id: string;
  title: string;
  question: string;
  hint?: string;
  /** 左侧步骤轨上的短名，如「基本情况」 */
  railZh: string;
  /** 左侧步骤轨底部那句解释 —— 每一步该注意什么 */
  railNoteZh: string;
  /** 战报栏 / 手机底栏上的主行动文案；每步说清楚「按下去会发生什么」 */
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
    <header className="sticky top-0 z-20 bg-ink text-paper">
      {/* 桌面锁死 68px：右侧战报栏要按这个高度 sticky，浮动高度会露出一条缝 */}
      <div className="flex items-center gap-4 px-4 py-4 md:gap-7 md:px-10 lg:h-[68px] lg:py-0">
        {stepIndex === 0 ? (
          <Link href="/" className="text-section text-paper/70" aria-label="返回首页">
            ←
          </Link>
        ) : (
          <button
            type="button"
            onClick={onBack}
            className="text-section text-paper/70"
            aria-label="返回上一步"
          >
            ←
          </button>
        )}

        <span className="h-shout hidden text-section md:inline">押金侠</span>

        <div className="flex flex-1 items-center gap-2" aria-hidden="true">
          {steps.map((step, index) => (
            <span
              key={step.id}
              className={`h-1 flex-1 transition-colors duration-300 ${
                index <= stepIndex ? "bg-seal" : "bg-paper/22"
              }`}
            />
          ))}
        </div>

        <span className="font-mono text-caption text-paper/60">
          {String(stepIndex + 1).padStart(2, "0")} /{" "}
          {String(steps.length).padStart(2, "0")}
        </span>
      </div>
    </header>
  );
}

/**
 * 桌面左轨。只在 ≥lg 出现 —— 手机上顶栏那三段刻度已经说清位置，
 * 再来一栏就是把正文挤没（design-tokens §4.1：结构变化只许发生在 lg）。
 */
export function StepRail({
  steps,
  stepIndex,
  onJump,
}: {
  steps: WizardStepMeta[];
  stepIndex: number;
  onJump: (index: number) => void;
}) {
  return (
    <nav
      aria-label="向导步骤"
      className="hidden border-r border-line px-7 py-10 lg:block"
    >
      <p className="font-mono text-micro text-faint">三步</p>

      <ol className="mt-5 flex flex-col gap-5">
        {steps.map((step, index) => {
          const current = index === stepIndex;
          const done = index < stepIndex;
          return (
            <li key={step.id}>
              <button
                type="button"
                // 只许往回跳：往前跳会跳过校验，把空表送进分析
                disabled={index > stepIndex}
                onClick={() => onJump(index)}
                className={`block w-full border-l-[3px] pl-3.5 text-left ${
                  current ? "border-seal" : "border-line"
                } ${index > stepIndex ? "cursor-default" : null}`}
              >
                <span
                  className={`block font-mono text-micro ${
                    current ? "text-verdict-unlawful" : "text-faint"
                  }`}
                >
                  STEP {String(index + 1).padStart(2, "0")}
                </span>
                <span
                  className={`mt-1 block text-section ${
                    current ? "font-bold text-ink" : "text-faint"
                  }`}
                >
                  {step.railZh}
                  {done ? (
                    <span className="ml-1.5 text-verdict-lawful">✓</span>
                  ) : null}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <p className="mt-10 text-caption text-faint">
        {steps[stepIndex]?.railNoteZh}
      </p>
    </nav>
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
      <p className="font-mono text-micro text-faint">{step.title}</p>
      <h2 className="h-shout mt-3 text-display text-ink">{step.question}</h2>
      {step.hint ? (
        <p className="mt-3 max-w-[560px] text-label text-muted">{step.hint}</p>
      ) : null}
      {children}
    </div>
  );
}
