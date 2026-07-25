"use client";

/** 第 1 步：选州 + 纠纷类型（母文档 §3.2，多选） */

import { useCaseSession } from "@/lib/case-session";
import type { AUState, DisputeType } from "@/lib/types";

import { ChipGroup, ChoiceGroup, SectionCard, type Choice } from "./fields";

/** 其余州和领地照 PRD 要求显示但禁用 */
type StateChoiceValue = AUState | "QLD" | "WA" | "SA" | "TAS" | "ACT" | "NT";

const STATE_CHOICES: Choice<StateChoiceValue>[] = [
  { value: "NSW", label: "新南威尔士 NSW", hint: "悉尼等" },
  { value: "VIC", label: "维多利亚 VIC", hint: "墨尔本等" },
  { value: "QLD", label: "昆士兰 QLD", disabled: true, disabledNote: "即将支持" },
  { value: "WA", label: "西澳 WA", disabled: true, disabledNote: "即将支持" },
  { value: "SA", label: "南澳 SA", disabled: true, disabledNote: "即将支持" },
  { value: "TAS", label: "塔州 TAS", disabled: true, disabledNote: "即将支持" },
  { value: "ACT", label: "首都领地 ACT", disabled: true, disabledNote: "即将支持" },
  { value: "NT", label: "北领地 NT", disabled: true, disabledNote: "即将支持" },
];

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
        hint="押金规则、机构和时限每个州都不一样，先选对州，后面的分析才作数。"
      >
        <ChoiceGroup
          ariaLabel="选择所在州"
          columns={2}
          choices={STATE_CHOICES}
          value={draft.state}
          onChange={(value) => {
            if (value === "NSW" || value === "VIC") {
              updateDraft({ state: value });
            }
          }}
        />
      </SectionCard>

      <SectionCard
        title="哪些扣款让你不服？"
        hint="可以多选。一次退租常常好几笔，分析会逐项给结论。"
      >
        <ChipGroup
          ariaLabel="选择纠纷类型"
          choices={DISPUTE_CHOICES}
          values={draft.disputeTypes}
          onToggle={toggleDispute}
        />
        {draft.disputeTypes.includes("rent-arrears") ? (
          <p className="mt-3 text-xs leading-relaxed text-muted">
            提前说明：拖欠租金抵扣通常是房东占理。真是这样，分析会直接告诉你「合法，
            别争」——把力气留给能赢的项。
          </p>
        ) : null}
      </SectionCard>
    </div>
  );
}
