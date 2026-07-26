"use client";

/**
 * 结果页（03b）。
 *
 * 这一页只做三件事：
 * 1. 空会话保护 —— 直接访问或刷新时给可恢复提示，不白屏
 * 2. 跑两段真实调用（`components/result/use-analysis.ts`），把进度如实显示出来
 * 3. 把 `CaseInput + AnalysisResult` 交给纯 props 的 `ResultView`
 *
 * 分析中的那一屏是整幅墨黑的一幕（稿子 §03），不是页面里的一张卡：
 * 等待是产品唯一的空窗，这一幕要自己撑满，右边还得把刚读出来的原句推到眼前。
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

  const { analysis, facts, stages, retryStage } = useAnalysis({
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
        sampleNote="示例案例预览 · 全部文件与当事人均为虚构；你的案子会实时分析。"
      />
    );
  }

  if (!caseInput) return <EmptySession />;

  const hasConditionReport = caseInput.evidence.some(
    (item) => item.kind === "condition-report",
  );
  const factsRunningLabel = hasConditionReport
    ? "正在阅读你的入住报告…"
    : undefined;

  if (!analysis) {
    return (
      <AnalysisProgress
        stages={stages}
        stateLabel={caseInput.state}
        factsRunningLabel={factsRunningLabel}
        facts={facts}
        onRetry={retryStage}
      />
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

/**
 * 空会话（刷新后直接访问 /result，稿子 §06）。
 *
 * 这一屏要解释的是「为什么没了」而不是「出错了」—— 不存资料是产品承诺，
 * 所以文案先说承诺，再给回去的路。
 */
function EmptySession() {
  return (
    <section className="mx-auto w-full max-w-[1152px] px-4 py-16 md:px-6 md:py-20">
      <p className="font-mono text-micro text-faint">没有可显示的案情</p>
      <h1 className="h-shout mt-4 text-display text-ink">这里还是空的。</h1>
      <p className="mt-5 max-w-[600px] text-section text-muted">
        为了不存你的资料，案情只留在这次会话里，刷新页面就清空了。
        回向导重填一遍，两分钟就好。
      </p>
      <div className="mt-8 flex flex-wrap gap-3.5">
        <Link
          href="/wizard"
          className="bg-seal px-7 py-4 text-section font-bold text-paper"
        >
          回去填写向导
        </Link>
        <Link
          href="/sample"
          className="border border-ink/30 px-6 py-4 text-section font-bold text-ink transition-colors duration-150 hover:bg-card"
        >
          先看示例结果
        </Link>
      </div>
    </section>
  );
}
