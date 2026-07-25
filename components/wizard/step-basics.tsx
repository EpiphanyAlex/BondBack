"use client";

/** 第 1 步：选州 + 纠纷类型 + 退租日期（母文档 §3.2，纠纷类型多选） */

import { useCaseSession } from "@/lib/case-session";
import type { AUState, DisputeType } from "@/lib/types";

import { ChipGroup, DateInput, SectionCard, type Choice } from "./fields";

/**
 * 真正能选的两个州。州名底下压着适用的那部法 —— 稿子里这两张卡是整个
 * 向导第一眼看到的东西，写上法案全名比写「悉尼等」更能立住可信度。
 */
const STATE_CHOICES: { value: AUState; act: string }[] = [
  { value: "NSW", act: "Residential Tenancies Act 2010" },
  { value: "VIC", act: "Residential Tenancies Act 1997" },
];

/**
 * 其余州和领地照 PRD 要求「显示但禁用，标即将支持」。
 *
 * 压成一行不可点的小标签：显示到位、禁用到位，「即将支持」作为组标签说一次 ——
 * 选不了的东西不该占掉选择区四分之三。
 */
const UPCOMING_STATES = ["QLD", "WA", "SA", "TAS", "ACT", "NT"];

const DISPUTE_CHOICES: Choice<DisputeType>[] = [
  { value: "cleaning", label: "清洁 / 地毯" },
  { value: "damage", label: "损坏 / 维修" },
  { value: "early-termination", label: "提前解约扣费" },
  { value: "bond", label: "押金存管" },
  { value: "rent-arrears", label: "欠租 / 水电" },
  { value: "other", label: "其他" },
];

export function StepBasics() {
  const { draft, updateDraft, markTouched } = useCaseSession();

  const toggleDispute = (value: DisputeType) => {
    updateDraft((current) => ({
      disputeTypes: current.disputeTypes.includes(value)
        ? current.disputeTypes.filter((item) => item !== value)
        : [...current.disputeTypes, value],
    }));
  };

  return (
    <>
      <SectionCard title="房子在哪个州">
        <div
          role="radiogroup"
          aria-label="选择所在州"
          className="grid max-w-[560px] grid-cols-2 gap-3.5"
        >
          {STATE_CHOICES.map((choice) => {
            const selected = draft.state === choice.value;
            return (
              <button
                key={choice.value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => updateDraft({ state: choice.value })}
                className={`border-2 px-5 py-5 text-left transition-colors duration-150 ${
                  selected
                    ? "border-seal bg-ink"
                    : "border-line bg-card hover:border-ink/40"
                }`}
              >
                <span
                  className={`block font-number text-title leading-none ${
                    selected ? "text-amount-hero" : "text-ink"
                  }`}
                >
                  {choice.value}
                </span>
                <span
                  className={`mt-2 block text-label ${
                    selected ? "text-paper/65" : "text-faint"
                  }`}
                >
                  {choice.act}
                </span>
              </button>
            );
          })}
        </div>

        <p className="mt-4 flex flex-wrap items-baseline gap-x-2.5 gap-y-2">
          <span className="font-mono text-micro text-faint">即将支持</span>
          {UPCOMING_STATES.map((code) => (
            <span
              key={code}
              className="border border-dashed border-line px-2.5 py-1 font-mono text-caption text-faint"
            >
              {code}
            </span>
          ))}
        </p>
      </SectionCard>

      <SectionCard title="房东扣钱的理由（可多选）">
        <div className="max-w-[560px]">
          <ChipGroup
            ariaLabel="选择纠纷类型"
            choices={DISPUTE_CHOICES}
            values={draft.disputeTypes}
            onToggle={toggleDispute}
          />
        </div>
        {draft.disputeTypes.includes("rent-arrears") ? (
          <p className="mt-3.5 text-caption text-muted">
            拖欠租金抵扣通常房东占理，分析会直说「合法，别争」。
          </p>
        ) : null}
      </SectionCard>

      {/*
        日期放在这一步是稿子的安排，但它仍然**允许留空**：上传优先（v1.1）下，
        扣款清单里往往就写着退租日期，空着就让预填去读；这里填了就算用户自己的答案，
        预填不会覆盖（`markTouched`）。第 3 步还会再露一次面供核对。
      */}
      <SectionCard title="退租日期 · 时限全靠它算">
        <div className="max-w-[280px]">
          <DateInput
            id="move-out-date-basics"
            value={draft.moveOutDate}
            onChange={(value) => {
              markTouched("moveOutDate");
              updateDraft({ moveOutDate: value });
            }}
          />
        </div>
        <p className="mt-2.5 text-caption text-muted">
          不记得也没关系 —— 下一步传上扣款清单，它自己会读出来。
        </p>
      </SectionCard>
    </>
  );
}
