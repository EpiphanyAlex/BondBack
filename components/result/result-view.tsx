"use client";

/**
 * 结果页整页（03b）—— **纯 props，不碰路由、不碰会话**。
 *
 * 04b 会整片复用它（`/sample` 重放结束停在这一页），所以数据只从 props 进来；
 * 唯一的内部状态是「哪一行证据刚被点开」这类纯 UI 交互。
 *
 * ## 四幕串在一根卷轴上（「江湖战报」稿 §04）
 *
 *   第一幕 · 判决    整幅墨黑横幅：先说一句人话的结论，再上三色条与最大的那个数
 *   第二幕 · 逐笔    **横向吸附卡带，一次只看一笔** —— 三张卡是并列的三个判决，
 *                    不是递进的三段论述，竖着摞起来第三张要滚七八屏才见得到
 *   第三幕 · 发信    信是成品，邮件留证话术是它的附件（默认折叠）
 *   第四幕 · 路线    存管预警是前置检查（全幅横幅），机构按**阶段**分三栏
 *   尾   · 证据档   它是索引，折叠收尾，不占视线
 *
 * ≥lg 左边多一根 140px 的卷轴指示现在读到哪一幕；结构变化一律只发生在 `lg:`
 * （design-tokens §4.1）。手机堆回单列，顺序不变 —— DOM 顺序本身就是手机顺序。
 */

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import type { ConditionReportHandle } from "@/components/evidence/condition-report-doc";
import type { AnalysisResult, CaseInput, EvidenceFact } from "@/lib/types";

import { ActRail, type ActRailItem } from "./act-rail";
import { ActionRoadmap } from "./action-roadmap";
import { AppealLetter } from "./appeal-letter";
import { ComparisonStrip } from "./comparison-strip";
import { EmailScript } from "./email-script";
import { EvidenceDossier } from "./evidence-dossier";
import { HeadlineLedger } from "./headline-ledger";
import { cx, scrollToElement, usedFactIdsOf } from "./utils";

/** 四幕 + 收尾，卷轴上的五个点。id 同时是锚点与滚动监听的目标。 */
const ACTS: ActRailItem[] = [
  { id: "result-verdict", label: "判决" },
  { id: "result-cards", label: "逐笔" },
  { id: "result-letter", label: "发信" },
  { id: "result-roadmap", label: "路线" },
  { id: "result-dossier", label: "证据档" },
];

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
  /** 示例预览时顶上的一句「均为虚构」（军规：示例必须标虚构）*/
  sampleNote?: string;
  className?: string;
}

export function ResultView({
  caseInput,
  analysis,
  showSampleDocuments = false,
  header,
  sampleNote,
  className,
}: ResultViewProps) {
  const docRef = useRef<ConditionReportHandle>(null);
  const cardsRef = useRef<HTMLElement>(null);
  const letterRef = useRef<HTMLElement>(null);
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

  const usedFactIds = usedFactIdsOf(analysis.items);

  return (
    <div className={cx("pb-14", className)}>
      {sampleNote ? (
        <p className="mx-auto w-full max-w-[1152px] px-4 pt-4 font-mono text-caption text-faint md:px-6">
          {sampleNote}
        </p>
      ) : null}

      {/* ── 第一幕 · 判决 ── 自带全幅底色，所以不进容器 ── */}
      <div id="result-verdict" className="scroll-mt-4">
        <HeadlineLedger
          bondAmount={caseInput.bondAmount}
          ledger={analysis.ledger}
          mode={analysis.mode}
          items={analysis.items}
          stateLabel={caseInput.state}
          propertyAddress={caseInput.propertyAddress}
          moveOutDate={caseInput.moveOutDate}
          onSeeDetails={() => scrollToElement(cardsRef.current)}
          onWriteLetter={() => scrollToElement(letterRef.current)}
        />
      </div>

      <div className="mx-auto w-full max-w-[1152px] px-4 md:px-6 lg:grid lg:grid-cols-[140px_minmax(0,1fr)] lg:gap-9">
        <ActRail items={ACTS} />

        <div className="min-w-0">
          {header ? <div className="pt-6">{header}</div> : null}

          {/* ── 第二幕 · 逐笔 ── 产品的差异化就长在这一幕 ── */}
          <section
            ref={cardsRef}
            id="result-cards"
            className="scroll-mt-4 pt-9 md:pt-11"
          >
            <ComparisonStrip
              items={analysis.items}
              facts={analysis.facts}
              onFactClick={focusFact}
            />
          </section>

          {/* ── 第三幕 · 给房东发信 ── 信是成品，底下是它的附件 ── */}
          <section
            ref={letterRef}
            id="result-letter"
            className="mt-11 scroll-mt-4 border-t border-line pt-9 md:mt-14"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
              <h2 className="h-shout text-title text-ink">给房东发信</h2>
              <p className="font-mono text-micro text-faint">
                英文正文 · 邮件模板 · 发出前自查
              </p>
            </div>

            <div className="mt-5 flex flex-col gap-4 lg:max-w-[840px]">
              <AppealLetter letterEn={analysis.letterEn} />

              <EmailScript
                state={caseInput.state}
                propertyAddress={caseInput.propertyAddress}
              />

              {/* 发出前的自查：这一条是军规，得贴在信旁边说，不能只留给页脚 */}
              <p className="bg-ink px-5 py-4 text-label text-paper/75">
                <span className="mb-1.5 block font-mono text-micro text-verdict-unlawful-on-dark">
                  发出前自查
                </span>
                金额与法条请自行复核一遍。本工具提供信息辅助，不构成法律意见。
              </p>
            </div>
          </section>

          {/* ── 第四幕 · 行动路线 ── 组件自带标题与横幅 ── */}
          <section
            id="result-roadmap"
            className="mt-11 scroll-mt-4 border-t border-line pt-9 md:mt-14"
          >
            <ActionRoadmap
              state={caseInput.state}
              bondAlert={analysis.bondLodgementAlert}
              claimDueAt={caseInput.claimNotice?.dueAt}
            />
          </section>

          {/* ── 证据档 ── 它是索引，折叠收尾，不占视线 ── */}
          <section
            id="result-dossier"
            className="mt-11 scroll-mt-4 border-t border-line pt-9 md:mt-14"
          >
            <div ref={dossierRef}>
              <EvidenceDossier
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
          </section>
        </div>
      </div>
    </div>
  );
}
