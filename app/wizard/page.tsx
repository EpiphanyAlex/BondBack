"use client";

/**
 * 三步向导（模块 02）。
 *
 * 形态是「报税式」流水线：每步一屏、进度可见、可回退改答案，不是聊天。
 *
 * 桌面按稿子 §02 分三栏：**左轨给步骤 / 中栏给表单 / 右栏是常驻的墨黑战报栏**。
 * 中栏坚持单列 —— 多栏表单是公认反模式，加宽不等于分栏。
 * 手机塌回单列 + 底部一条 88px 的行动条，正文不再被两层信息挤压。
 */

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { StepBasics } from "@/components/wizard/step-basics";
import { StepEvidence } from "@/components/wizard/step-evidence";
import { StepReview } from "@/components/wizard/step-review";
import { LedgerBar } from "@/components/wizard/ledger-bar";
import { WarReport } from "@/components/wizard/war-report";
import {
  StepHeading,
  StepRail,
  WizardTopBar,
  type WizardStepMeta,
} from "@/components/wizard/wizard-chrome";
import { deductionTotal, parseAmount, type PrefillableField } from "@/lib/case-draft";
import { useCaseSession } from "@/lib/case-session";

/**
 * 上传优先（v1.1）：先传证据、再核对已填好的表。
 * 反过来的话，用户认真填完金额后预填将无事可填，魔法时刻会被流程顺序自己抵消。
 */
const STEPS: WizardStepMeta[] = [
  {
    id: "basics",
    title: "第一步 · 基本情况",
    question: "在哪个州，为什么被扣？",
    railZh: "基本情况",
    railNoteZh: "州决定了适用哪部法、多长时限。整个向导两分钟，可随时回退改答案。",
    cta: "下一步 · 传证据",
  },
  {
    id: "evidence",
    title: "第二步 · 上传证据",
    question: "手里有什么，先传上来",
    railZh: "上传证据",
    railNoteZh:
      "材料越全，能引用的原句越多。没有也能跳过 —— 那时它会改成逐笔要房东举证。",
    cta: "传好了 · 去核对",
  },
  {
    id: "review",
    title: "第三步 · 核对与补全",
    question: "核对一下，空的补上",
    railZh: "核对与补全",
    railNoteZh: "金色底的字段是读出来的，改一下就变成你的答案。",
    cta: "看看我的胜算",
  },
];

export default function WizardPage() {
  const router = useRouter();
  const { draft, submitCase } = useCaseSession();
  const [stepIndex, setStepIndex] = useState(0);
  const [showBlocker, setShowBlocker] = useState(false);
  const [justPrefilled, setJustPrefilled] = useState<PrefillableField[]>([]);

  const step = STEPS[stepIndex]!;

  /*
   * 换步骤回到顶部。**不能用 `scrollIntoView`**：抬头紧贴在 `sticky top-0`
   * 的顶栏下面，把它的顶边对到视口顶边，标题就正好被顶栏盖住半行。
   */
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [stepIndex]);

  // 换步骤时把「还差什么」的提示收起来，别把上一屏的话留到下一屏
  const goToStep = (next: number) => {
    setStepIndex(Math.min(Math.max(next, 0), STEPS.length - 1));
    setShowBlocker(false);
  };

  const bond = parseAmount(draft.bondAmount);
  const claimed =
    parseAmount(draft.claimedAmount) ?? deductionTotal(draft.deductions);

  const blocker = useMemo(() => {
    if (stepIndex === 0 && draft.disputeTypes.length === 0) {
      return "先选一个纠纷类型，哪怕是「其他」。";
    }
    // 金额校验只在最后一步拦人：第 2 步允许两手空空地跳过上传
    if (stepIndex === 2) {
      if (bond === undefined || bond <= 0) return "填一下押金总额，这是算账的基准。";
      if (claimed === undefined || claimed <= 0) {
        return "填被扣总额，或者在明细里写上至少一笔金额。";
      }
      if (!draft.moveOutDate) return "补一个退租日期，时限全靠它算。";
    }
    return null;
  }, [stepIndex, draft.disputeTypes.length, draft.moveOutDate, bond, claimed]);

  const handlePrimary = () => {
    if (blocker) {
      setShowBlocker(true);
      return;
    }
    if (stepIndex < STEPS.length - 1) {
      goToStep(stepIndex + 1);
      return;
    }
    submitCase();
    router.push("/result");
  };

  const blockerNote =
    showBlocker && blocker ? (
      <p className="font-mono text-caption text-verdict-unlawful-on-dark">
        {blocker}
      </p>
    ) : null;

  return (
    <div className="flex min-h-dvh flex-col">
      <WizardTopBar
        stepIndex={stepIndex}
        steps={STEPS}
        onBack={() => goToStep(stepIndex - 1)}
      />

      {/* 260 / 自适应 / 400 —— 稿子 §02 的三栏。手机与平板塌回单列 */}
      <div className="flex-1 lg:grid lg:grid-cols-[260px_minmax(0,1fr)_400px] lg:items-stretch">
        <StepRail steps={STEPS} stepIndex={stepIndex} onJump={goToStep} />

        <div
          key={step.id}
          className="step-enter mx-auto w-full max-w-[720px] px-4 pt-8 pb-10 md:px-6 lg:mx-0 lg:max-w-none lg:px-12 lg:pt-11"
        >
          <StepHeading step={step} />

          <div className="mt-9 flex flex-col gap-8">
            {stepIndex === 0 ? <StepBasics /> : null}
            {stepIndex === 1 ? <StepEvidence onPrefilled={setJustPrefilled} /> : null}
            {stepIndex === 2 ? <StepReview justPrefilled={justPrefilled} /> : null}
          </div>
        </div>

        <WarReport
          stepIndex={stepIndex}
          primaryLabel={step.cta ?? "下一步"}
          onPrimary={handlePrimary}
          blocker={blockerNote}
        />
      </div>

      <LedgerBar
        primaryLabel={step.cta ?? "下一步"}
        onPrimary={handlePrimary}
        secondary={blockerNote}
      />
    </div>
  );
}
