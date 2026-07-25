"use client";

/** 第 1 步：选州 + 纠纷类型（母文档 §3.2，多选） */

import { useCaseSession } from "@/lib/case-session";
import type { AUState, DisputeType } from "@/lib/types";

import { ChipGroup, ChoiceGroup, SectionCard, type Choice } from "./fields";

/** 真正能选的两个州 */
const STATE_CHOICES: Choice<AUState>[] = [
  { value: "NSW", label: "新南威尔士 NSW", hint: "悉尼等" },
  { value: "VIC", label: "维多利亚 VIC", hint: "墨尔本等" },
];

/**
 * 其余州和领地照 PRD 要求「显示但禁用，标即将支持」。
 *
 * 原先它们和 NSW / VIC 一样是六张等大的禁用卡，各自带一行「即将支持」——
 * 结果**选不了的东西占掉了选择区四分之三**，还把「即将支持」说了六遍。
 * 压成一行不可点的小标签：显示到位、禁用到位，「即将支持」作为组标签说一次。
 */
const UPCOMING_STATES = ["QLD", "WA", "SA", "TAS", "ACT", "NT"];

const DISPUTE_CHOICES: Choice<DisputeType>[] = [
  { value: "cleaning", label: "清洁费" },
  { value: "damage", label: "损坏 vs 合理磨损" },
  { value: "early-termination", label: "提前解约扣费" },
  { value: "bond", label: "押金逾期未退 / 未存管" },
  { value: "rent-arrears", label: "拖欠租金抵扣" },
  { value: "other", label: "其他" },
];

export function StepBasics() {
  const { draft, updateDraft } = useCaseSession();

  const toggleDispute = (value: DisputeType) => {
    updateDraft((current) => ({
      disputeTypes: current.disputeTypes.includes(value)
        ? current.disputeTypes.filter((item) => item !== value)
        : [...current.disputeTypes, value],
    }));
  };

  return (
    <div className="space-y-4">
      <SectionCard
        title="你在哪个州租房？"
        hint="押金规则和时限各州不同，选错后面的分析不作数。"
      >
        <ChoiceGroup
          ariaLabel="选择所在州"
          columns={2}
          choices={STATE_CHOICES}
          value={draft.state}
          onChange={(value) => updateDraft({ state: value })}
        />

        <p className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1.5">
          <span className="font-mono text-micro uppercase text-muted">
            即将支持
          </span>
          {UPCOMING_STATES.map((code) => (
            <span
              key={code}
              className="rounded-full border border-dashed border-line px-2.5 py-0.5 font-mono text-caption text-muted"
            >
              {code}
            </span>
          ))}
        </p>
      </SectionCard>

      <SectionCard title="哪些扣款让你不服？" hint="可以多选。">
        <ChipGroup
          ariaLabel="选择纠纷类型"
          choices={DISPUTE_CHOICES}
          values={draft.disputeTypes}
          onToggle={toggleDispute}
        />
        {draft.disputeTypes.includes("rent-arrears") ? (
          <p className="mt-3 text-caption leading-relaxed text-muted">
            拖欠租金抵扣通常房东占理，分析会直说「合法，别争」。
          </p>
        ) : null}
      </SectionCard>
    </div>
  );
}
