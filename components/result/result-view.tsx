"use client";

/**
 * 结果页整页（03b）—— **纯 props，不碰路由、不碰会话**。
 *
 * 04b 会整片复用它（`/sample` 重放结束停在这一页），所以数据只从 props 进来；
 * 唯一的内部状态是「哪一行证据刚被点开」这类纯 UI 交互。
 *
 * ## 为什么从「两栏」改成「四幕」
 *
 * 上一版是左 1fr / 右 380px sticky，右栏里竖着堆申诉信 + 行动路线 + 证据档。
 * 问题是这三样**根本不是一类东西**，阅读方式各不相同：信是要通读要发出去的
 * **成品**，路线是跨周执行的**流程**，证据档是随手回查的**索引**。把它们焊进
 * 同一根 380px 窄柱，等于让整页最需要宽度的内容拿到最少的宽度 —— 英文信一行
 * 只剩三十几个字符，行动路线的机构卡只有 310px 可用。
 *
 * 所以这一版按**阅读方式**切幕，而不是按栏切：
 *
 *   第一幕 · 判决      全幅墨蓝横条（唯一深色面），≥lg 三分：索扣 │ 三色条 │ 可争议
 *   第二幕 · 逐项对照   760px 阅读栏 + 右侧 7rem 页边，序号与结论印章落在页边里
 *   第三幕 · 拿去发     申诉信 660px（英文约 70 字符/行）│ 420px 旁注：中文对照 + 邮件话术
 *   第四幕 · 行动路线   存管预警全幅横幅 + 三级机构横排
 *   证据档              折叠收尾（它是索引，不该占据视线）
 *
 * 结构变化一律只发生在 `lg:`（design-tokens §4.1：`md:` 只许加宽加间距）。
 * 手机堆回单列，顺序不变 —— DOM 顺序本身就是手机顺序。
 */

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import type { ConditionReportHandle } from "@/components/evidence/condition-report-doc";
import type {
  AnalysisResult,
  CaseInput,
  EvidenceFact,
} from "@/lib/types";

import { ActionRoadmap } from "./action-roadmap";
import { AppealLetter, LetterNotes } from "./appeal-letter";
import { ComparisonCard } from "./comparison-card";
import { EmailScript } from "./email-script";
import { EvidenceDossier } from "./evidence-dossier";
import { HeadlineLedger, type HeadlineReason } from "./headline-ledger";
import {
  cx,
  leadClauseZh,
  scrollToElement,
  shortLabelZh,
  usedFactIdsOf,
} from "./utils";

/** 每一幕共用的容器：同一个最大宽度 + 同一组内边距，四幕左边缘才对得齐。 */
const ACT = "mx-auto w-full max-w-[1152px] px-4 md:px-6";

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
    <div className={cx("pb-10", className)}>
      {header ? <div className={cx(ACT, "pt-4 pb-4")}>{header}</div> : null}

      {/* ── 第一幕 · 判决 ── 自带全幅底色，所以不进 ACT 容器 ── */}
      <HeadlineLedger
        bondAmount={caseInput.bondAmount}
        ledger={analysis.ledger}
        mode={analysis.mode}
        reasons={reasons}
        stateLabel={caseInput.state}
        onSeeDetails={() => scrollToElement(cardsRef.current)}
        onWriteLetter={() => scrollToElement(letterRef.current)}
      />

      {/* ── 第二幕 · 逐项对照 ── 产品的差异化就长在这一幕 ── */}
      <section
        ref={cardsRef}
        id="result-cards"
        className={cx(ACT, "scroll-mt-4 pt-8 md:pt-10")}
      >
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 className="text-title text-ink">
            逐项对照 · {analysis.items.length} 笔
          </h2>
          <p className="font-mono text-micro uppercase text-muted">
            扣款 ↔ 证据 ↔ 合同 ↔ 法条
          </p>
        </div>

        <ol className="mt-4 flex flex-col gap-4 lg:gap-5">
          {analysis.items.map((item, index) => (
            <li key={`${item.description}-${index}`}>
              <ComparisonCard
                item={item}
                ordinal={index + 1}
                facts={analysis.facts}
                onFactClick={focusFact}
              />
            </li>
          ))}
        </ol>
      </section>

      {/* ── 第三幕 · 拿去发 ── 信与邮件话术同类：都是要发出去的东西 ── */}
      <section className={cx(ACT, "pt-10 md:pt-12")}>
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 className="text-title text-ink">拿去发</h2>
          <p className="font-mono text-micro uppercase text-muted">
            英文正文 · 中文对照
          </p>
        </div>

        {/*
          单列，不再分栏。中文对照与邮件话术都已折叠成一条摘要，
          再给它们一根 420px 的旁注栏，那栏就只剩一条 80px 的横条和一大片空白。
          现在的层级是：信是成品，底下两条是它的附件。
          信保持 660px（英文约 70 字符/行）；邮件话术放宽到 840px，
          因为展开后是等宽英文，越窄折行越碎。
        */}
        <div
          ref={letterRef}
          className="mt-4 flex scroll-mt-4 flex-col gap-4 lg:max-w-[840px]"
        >
          <AppealLetter
            id="result-letter"
            className="lg:max-w-[660px]"
            letterEn={analysis.letterEn}
          />

          {analysis.letterZhNotes ? (
            <LetterNotes
              className="lg:max-w-[660px]"
              notes={analysis.letterZhNotes}
            />
          ) : null}

          <EmailScript
            state={caseInput.state}
            propertyAddress={caseInput.propertyAddress}
          />
        </div>
      </section>

      {/* ── 第四幕 · 行动路线 ── 组件自带标题与横幅，容器只给宽度 ── */}
      <section className={cx(ACT, "pt-10 md:pt-12")}>
        <ActionRoadmap
          id="result-roadmap"
          state={caseInput.state}
          bondAlert={analysis.bondLodgementAlert}
          claimDueAt={caseInput.claimNotice?.dueAt}
        />
      </section>

      {/* ── 证据档 ── 它是索引，折叠收尾，不占视线 ── */}
      <section className={cx(ACT, "pt-10 md:pt-12")}>
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

        {/*
          原先这里还有一段 60 字的免责声明，与根布局 `SiteFooter` 那句重复了。
          军规只要求「页脚免责声明必须在」—— SiteFooter 常驻，这里只留复核提醒。
        */}
        <p className="mt-6 text-caption leading-relaxed text-muted">
          金额与法条请在发出前自行复核。
        </p>
      </section>
    </div>
  );
}
