"use client";

/**
 * 第 3 步：核对与补全。
 *
 * 上传优先（v1.1）之后，这一步是流程终点：表已经被上一步的预填写好了，
 * 用户只需核对、补空、提交。所以「提交前核对」从证据步搬到了这里——
 * 核对与提交发生在同一屏，不再需要「回去改答案」把人往回赶。
 */

import { useCaseSession } from "@/lib/case-session";
import { deductionTotal, parseAmount, type PrefillableField } from "@/lib/case-draft";
import { formatIsoDateZh } from "@/lib/dates";
import type { DisputeType } from "@/lib/types";

import { SectionCard } from "./fields";
import { StepAmounts } from "./step-amounts";

const DISPUTE_LABEL: Record<DisputeType, string> = {
  cleaning: "清洁费",
  damage: "损坏 vs 合理磨损",
  "early-termination": "提前解约扣费",
  bond: "押金逾期未退 / 未存管",
  "rent-arrears": "拖欠租金抵扣",
  other: "其他",
};

export function StepReview({
  justPrefilled,
}: {
  justPrefilled: PrefillableField[];
}) {
  const { draft } = useCaseSession();

  const bond = parseAmount(draft.bondAmount);
  const claimed = parseAmount(draft.claimedAmount) ?? deductionTotal(draft.deductions);
  const filledDeductions = draft.deductions.filter(
    (item) => item.description.trim() || item.amount.trim(),
  );

  return (
    <div className="flex flex-col gap-8">
      <StepAmounts justPrefilled={justPrefilled} />

      <SectionCard
        title="提交前核对一下"
        hint="写着「未填」的，往上翻改一下就行。"
        tone="quiet"
      >
        <dl className="divide-y divide-line text-label">
          <SummaryRow label="州" value={draft.state} />
          <SummaryRow
            label="纠纷类型"
            value={
              draft.disputeTypes.length > 0
                ? draft.disputeTypes.map((type) => DISPUTE_LABEL[type]).join("、")
                : "未选择"
            }
          />
          <SummaryRow
            label="证据"
            value={draft.evidence.length > 0 ? `${draft.evidence.length} 张` : "没传"}
          />
          <SummaryRow
            label="押金"
            value={bond !== undefined ? `$${bond.toLocaleString("en-AU")}` : "未填"}
            mono
          />
          <SummaryRow
            label="被扣"
            value={
              claimed !== undefined ? `$${claimed.toLocaleString("en-AU")}` : "未填"
            }
            mono
          />
          <SummaryRow
            label="退租日期"
            value={draft.moveOutDate ? formatIsoDateZh(draft.moveOutDate) : "未填"}
            mono
          />
          <SummaryRow
            label="扣款明细"
            value={
              filledDeductions.length > 0 ? `${filledDeductions.length} 项` : "未填"
            }
          />
        </dl>
      </SectionCard>

      <p className="px-1 text-caption leading-relaxed text-muted">
        提交后会把你填的情况和所在州的现行法条一起送去分析。本工具提供信息辅助，
        不构成法律意见。
      </p>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <dt className="shrink-0 text-muted">{label}</dt>
      <dd className={`text-right text-ink ${mono ? "tnum font-mono" : ""}`}>
        {value}
      </dd>
    </div>
  );
}
