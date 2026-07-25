"use client";

/**
 * 三步向导（模块 02）。
 *
 * 形态是「报税式」流水线：每步一屏、进度可见、可回退改答案，不是聊天。
 * 主行动固定在底部账本条里，单手就能走完。
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { StepBasics } from "@/components/wizard/step-basics";
import { StepEvidence } from "@/components/wizard/step-evidence";
import { StepReview } from "@/components/wizard/step-review";
import { LedgerBar } from "@/components/wizard/ledger-bar";
import {
  StepHeading,
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
    question: "先说清楚：在哪个州，为什么被扣？",
    hint: "州决定了适用哪部法、找哪个机构、有多长时限。十几秒就能过。",
    cta: "下一步",
  },
  {
    id: "evidence",
    title: "第二步 · 上传证据",
    question: "手里有什么材料，先传上来",
    hint: "AI 现在就把金额、日期、扣款明细读出来，下一步的表你只用核对。没有也能跳过。",
    cta: "传好了，去核对",
  },
  {
    id: "review",
    title: "第三步 · 核对与补全",
    question: "核对一下，空的补上",
    hint: "读出来的字段已经填好了；你改过的，之后不会再被覆盖。",
    cta: "看看我的胜算",
  },
];

export default function WizardPage() {
  const router = useRouter();
  const { draft, submitCase } = useCaseSession();
  const [stepIndex, setStepIndex] = useState(0);
  const [showBlocker, setShowBlocker] = useState(false);
  const [justPrefilled, setJustPrefilled] = useState<PrefillableField[]>([]);
  const topRef = useRef<HTMLDivElement>(null);

  const step = STEPS[stepIndex]!;

  useEffect(() => {
    topRef.current?.scrollIntoView({ block: "start" });
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

  return (
    <div className="flex min-h-dvh flex-col">
      <WizardTopBar
        stepIndex={stepIndex}
        steps={STEPS}
        onBack={() => goToStep(stepIndex - 1)}
      />

      <div ref={topRef} className="flex-1">
        <div key={step.id} className="step-enter mx-auto max-w-md px-4 pb-8 pt-6">
          <StepHeading step={step} />

          <div className="mt-6">
            {stepIndex === 0 ? <StepBasics /> : null}
            {stepIndex === 1 ? <StepEvidence onPrefilled={setJustPrefilled} /> : null}
            {stepIndex === 2 ? <StepReview justPrefilled={justPrefilled} /> : null}
          </div>
        </div>
      </div>

      <LedgerBar
        bondAmount={bond}
        claimedAmount={claimed}
        primaryLabel={step.cta ?? "下一步"}
        onPrimary={handlePrimary}
        secondary={
          showBlocker && blocker ? (
            <p className="text-caption text-gold-bright">{blocker}</p>
          ) : null
        }
      />
    </div>
  );
}
