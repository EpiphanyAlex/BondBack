"use client";

/**
 * 结果页（03b）。
 *
 * 这一页只做三件事：
 * 1. 空会话保护 —— 直接访问或刷新时给可恢复提示，不白屏
 * 2. 跑两段真实调用（`components/result/use-analysis.ts`），把进度如实显示出来
 * 3. 把 `CaseInput + AnalysisResult` 交给纯 props 的 `ResultView`
 *
 * `?demo=1` 用示例常量渲染整页（含 04a 的入住报告原件），方便自查与录屏；
 * 正式的 `/sample` 重放属于 04b。
 */

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { AnalysisProgress } from "@/components/result/analysis-progress";
import { ResultView } from "@/components/result/result-view";
import { useAnalysis } from "@/components/result/use-analysis";
import { SAMPLE_ANALYSIS, SAMPLE_CASE_INPUT } from "@/data/sample-case";
import { useCaseSession } from "@/lib/case-session";

export default function ResultPage() {
  // useSearchParams 需要 Suspense 边界；fallback 给空，闪一下也不白屏
  return (
    <Suspense fallback={null}>
      <ResultPageInner />
    </Suspense>
  );
}

function ResultPageInner() {
  const { caseInput, analysis: sessionAnalysis, setAnalysis } = useCaseSession();
  const demo = useSearchParams().has("demo");

  const { analysis, stages, retryStage } = useAnalysis({
    caseInput,
    initialAnalysis: sessionAnalysis,
    onAnalysis: setAnalysis,
    enabled: !demo,
  });

  if (demo) {
    return (
      <ResultView
        caseInput={SAMPLE_CASE_INPUT}
        analysis={SAMPLE_ANALYSIS}
        showSampleDocuments
        header={
          <p className="rounded-xl border border-line bg-card px-3.5 py-2.5 text-caption leading-relaxed text-muted">
            示例案例预览 · 全部文件与当事人均为虚构，用于演示对照能力。
          </p>
        }
      />
    );
  }

  if (!caseInput) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-start gap-4 px-4 py-20">
        <p className="font-mono text-micro uppercase text-muted">
          没有可显示的案情
        </p>
        <h1 className="font-display text-title leading-tight font-extrabold text-ink">
          这里还是空的
        </h1>
        <p className="text-label leading-relaxed text-muted">
          为了不存你的资料，案情只留在这次会话里，刷新页面就清空了。
          回向导重填一遍，两分钟就好。
        </p>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/wizard"
            className="rounded-xl bg-ink px-5 py-3 text-body font-semibold text-white"
          >
            回去填写向导
          </Link>
          <Link
            href="/result?demo=1"
            className="rounded-xl border border-line bg-card px-5 py-3 text-body font-semibold text-ink"
          >
            先看示例结果
          </Link>
        </div>
      </div>
    );
  }

  const hasConditionReport = caseInput.evidence.some(
    (item) => item.kind === "condition-report",
  );
  const factsRunningLabel = hasConditionReport
    ? "正在阅读你的入住报告…"
    : undefined;

  if (!analysis) {
    return (
      <div className="mx-auto w-full max-w-md px-4 py-8 lg:max-w-[720px]">
        <p className="font-mono text-micro uppercase text-muted">分析中</p>
        <h1 className="mt-1.5 font-display text-title leading-tight font-extrabold text-ink">
          正在把你的材料对到法条上
        </h1>
        <AnalysisProgress
          className="mt-4"
          stages={stages}
          stateLabel={caseInput.state}
          factsRunningLabel={factsRunningLabel}
          onRetry={retryStage}
        />
        <p className="mt-4 text-caption leading-relaxed text-muted">
          通常十几秒。这段时间别关页面 —— 资料只在这次会话里，刷新就没了。
        </p>
      </div>
    );
  }

  return (
    <ResultView
      caseInput={caseInput}
      analysis={analysis}
      header={
        <AnalysisProgress
          variant="compact"
          stages={stages}
          stateLabel={caseInput.state}
          factsRunningLabel={factsRunningLabel}
          onRetry={retryStage}
        />
      }
    />
  );
}
