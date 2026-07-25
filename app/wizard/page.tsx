"use client";

/**
 * 三步向导（模块 02）。
 *
 * 形态是「报税式」流水线：每步一屏、进度可见、可回退改答案，不是聊天。
 * 主行动固定在底部账本条里，单手就能走完。
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { StepAmounts } from "@/components/wizard/step-amounts";
import { StepBasics } from "@/components/wizard/step-basics";
import { StepEvidence } from "@/components/wizard/step-evidence";
import { LedgerBar } from "@/components/wizard/ledger-bar";
import {
  StepHeading,
  WizardTopBar,
  type WizardStepMeta,
} from "@/components/wizard/wizard-chrome";
import { deductionTotal, parseAmount, type PrefillableField } from "@/lib/case-draft";
import { useCaseSession } from "@/lib/case-session";

const STEPS: WizardStepMeta[] = [
  {
    id: "basics",
    title: "第一步 · 基本情况",
    question: "先说清楚：在哪个州，为什么被扣？",
    hint: "州决定了适用哪部法、找哪个机构、有多长时限。",
  },
  {
    id: "amounts",
    title: "第二步 · 金额与扣款",
    question: "他们扣了多少，凭什么扣？",
    hint: "逐项写清楚，后面才能一项一项判。",
  },
  {
    id: "evidence",
    title: "第三步 · 证据与确认",
    question: "有截图或租约吗？没有也能继续。",
    hint: "传上来的话，金额和日期这些字段会自动填好。",
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
    if (stepIndex === 1) {
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
            {stepIndex === 1 ? <StepAmounts justPrefilled={justPrefilled} /> : null}
            {stepIndex === 2 ? (
              <StepEvidence
                onPrefilled={setJustPrefilled}
                onEdit={() => goToStep(1)}
              />
            ) : null}
          </div>
        </div>
      </div>

      <LedgerBar
        bondAmount={bond}
        claimedAmount={claimed}
        primaryLabel={stepIndex === STEPS.length - 1 ? "看看我的胜算" : "下一步"}
        onPrimary={handlePrimary}
        secondary={
          showBlocker && blocker ? (
            <p className="text-[13px] text-gold-bright">{blocker}</p>
          ) : null
        }
      />
    </div>
  );
}
