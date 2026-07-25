"use client";

/**
 * 结果页整页（03b）—— **纯 props，不碰路由、不碰会话**。
 *
 * 04b 会整片复用它（`/sample` 重放结束停在这一页），所以数据只从 props 进来；
 * 唯一的内部状态是「哪一行证据刚被点开」这类纯 UI 交互。
 *
 * 桌面 ≥1024px：左 1fr（账本条 + 对照卡）/ 右 380px sticky（信 · 路线 · 证据档）。
 * 手机堆回单列，顺序不变 —— 两栏由两个 wrapper 承担，DOM 顺序本身就是手机顺序。
 */

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import type { ConditionReportHandle } from "@/components/evidence/condition-report-doc";
import type {
  AnalysisResult,
  CaseInput,
  EvidenceFact,
} from "@/lib/types";

import { ActionRoadmap } from "./action-roadmap";
import { AppealLetter } from "./appeal-letter";
import { ComparisonCard } from "./comparison-card";
import { EvidenceDossier } from "./evidence-dossier";
import { HeadlineLedger, type HeadlineReason } from "./headline-ledger";
import {
  cx,
  leadClauseZh,
  scrollToElement,
  shortLabelZh,
  usedFactIdsOf,
} from "./utils";

/** 定位原件时最多等几帧 —— 证据档刚展开，组件要一帧才挂上。 */
const LOCATE_FRAME_BUDGET = 20;

export interface ResultViewProps {
  caseInput: CaseInput;
  analysis: AnalysisResult;
  /**
   * 只有示例案例才为 true：04a 的入住报告原件是**虚构文件**，
   * 真实用户的案子上渲染它就是伪造凭证（军规）。
   */
  showSampleDocuments?: boolean;
  /** 顶部插槽：/result 用它放两段进度摘要 */
  header?: ReactNode;
  className?: string;
}

export function ResultView({
  caseInput,
  analysis,
  showSampleDocuments = false,
  header,
  className,
}: ResultViewProps) {
  const docRef = useRef<ConditionReportHandle>(null);
  const cardsRef = useRef<HTMLElement>(null);
  const letterRef = useRef<HTMLDivElement>(null);
  const dossierRef = useRef<HTMLDivElement>(null);

  const [dossierOpen, setDossierOpen] = useState(false);
  const [pending, setPending] = useState<{ anchorId: string; seq: number } | null>(
    null,
  );
  const seqRef = useRef(0);

  /** 点证据引语 → 展开证据档 → 滚动并高亮到原件对应行 */
  const focusFact = useCallback((fact: EvidenceFact) => {
    if (!fact.anchorId) return;
    setDossierOpen(true);
    seqRef.current += 1;
    setPending({ anchorId: fact.anchorId, seq: seqRef.current });
  }, []);

  // 用命令式句柄而不是受控 highlightId：同一行连点两次要能重播高亮。
  // 证据档可能刚被展开，原件还没挂上，所以按帧重试而不是只试一次。
  useEffect(() => {
    if (!pending) return;

    let frames = 0;
    let raf = 0;

    const tick = () => {
      const handle = docRef.current;
      if (handle) {
        // 证据档在整页最下面，手机上离对照卡有七八千像素。先无动画跳到证据档，
        // 再交给 04a 的句柄做那一小段平滑定位 —— 否则光滚动就要好几秒。
        dossierRef.current?.scrollIntoView({ block: "start", behavior: "auto" });
        handle.scrollToAndHighlight(pending.anchorId);
        setPending(null);
        return;
      }
      frames += 1;
      if (frames > LOCATE_FRAME_BUDGET) {
        // 没有可定位的原件（真实案子）就退而求其次：把证据档滚进视野
        scrollToElement(dossierRef.current);
        setPending(null);
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [pending]);

  const reasons: HeadlineReason[] = analysis.items.slice(0, 3).map((item) => ({
    key: item.description,
    labelZh: shortLabelZh(item.description),
    verdict: item.verdict,
    lineZh: leadClauseZh(item.reasoningZh),
  }));

  const usedFactIds = usedFactIdsOf(analysis.items);

  return (
    <div
      className={cx(
        "mx-auto w-full max-w-[1152px] px-4 py-4 md:px-6 md:py-6",
        className,
      )}
    >
      {header ? <div className="mb-3">{header}</div> : null}

      <div className="lg:grid lg:grid-cols-[1fr_380px] lg:items-start lg:gap-6">
        {/* 左栏：首屏 + 对照卡 */}
        <div className="flex flex-col gap-4">
          <HeadlineLedger
            bondAmount={caseInput.bondAmount}
            ledger={analysis.ledger}
            mode={analysis.mode}
            reasons={reasons}
            stateLabel={caseInput.state}
            onSeeDetails={() => scrollToElement(cardsRef.current)}
            onWriteLetter={() => scrollToElement(letterRef.current)}
          />

          <section
            ref={cardsRef}
            id="result-cards"
            className="scroll-mt-4 flex flex-col gap-3"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <h2 className="text-section text-ink">
                逐项对照 · {analysis.items.length} 笔
              </h2>
              <p className="font-mono text-micro uppercase text-muted">
                扣款 ↔ 证据 ↔ 合同 ↔ 法条
              </p>
            </div>

            {analysis.items.map((item, index) => (
              <ComparisonCard
                key={`${item.description}-${index}`}
                item={item}
                ordinal={index + 1}
                facts={analysis.facts}
                onFactClick={focusFact}
              />
            ))}
          </section>
        </div>

        {/* 右栏：信 · 路线 · 证据档。手机上顺序不变，只是不再 sticky */}
        <div className="mt-4 flex flex-col gap-4 lg:sticky lg:top-4 lg:mt-0 lg:max-h-[calc(100dvh-2rem)] lg:overflow-y-auto">
          <div ref={letterRef} className="scroll-mt-4">
            <AppealLetter
              id="result-letter"
              letterEn={analysis.letterEn}
              letterZhNotes={analysis.letterZhNotes}
            />
          </div>

          <ActionRoadmap
            id="result-roadmap"
            state={caseInput.state}
            bondAlert={analysis.bondLodgementAlert}
            claimDueAt={caseInput.claimNotice?.dueAt}
            propertyAddress={caseInput.propertyAddress}
          />

          <div ref={dossierRef} className="scroll-mt-4">
            <EvidenceDossier
              id="result-dossier"
              facts={analysis.facts}
              evidence={caseInput.evidence}
              usedFactIds={usedFactIds}
              onFactClick={focusFact}
              open={dossierOpen}
              onOpenChange={setDossierOpen}
              showConditionReportDoc={showSampleDocuments}
              conditionReportRef={docRef}
              sampleBadge={showSampleDocuments}
            />
          </div>
        </div>
      </div>

      <p className="mt-6 text-caption leading-relaxed text-muted">
        本页由工具依据你提供的材料与所在州的公开法规生成，用于帮你定位可争议的扣款，
        不构成法律意见。金额与法条请在发出前自行复核。
      </p>
    </div>
  );
}
