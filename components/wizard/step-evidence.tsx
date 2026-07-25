"use client";

/** 第 3 步：证据上传（可跳过）+ 核对预填结果 + 提交分析。 */

import { useCaseSession } from "@/lib/case-session";
import {
  deductionTotal,
  parseAmount,
  type PrefillableField,
} from "@/lib/case-draft";
import { formatIsoDateZh } from "@/lib/dates";
import type { DisputeType } from "@/lib/types";

import { EvidenceUploader } from "./evidence-uploader";
import { SectionCard } from "./fields";

const DISPUTE_LABEL: Record<DisputeType, string> = {
  cleaning: "清洁费",
  damage: "损坏 vs 合理磨损",
  "early-termination": "提前解约扣费",
  bond: "押金逾期未退 / 未存管",
  "rent-arrears": "拖欠租金抵扣",
  other: "其他",
};

export function StepEvidence({
  onPrefilled,
  onEdit,
}: {
  onPrefilled: (fields: PrefillableField[]) => void;
  onEdit: () => void;
}) {
  const { draft } = useCaseSession();

  const bond = parseAmount(draft.bondAmount);
  const claimed = parseAmount(draft.claimedAmount) ?? deductionTotal(draft.deductions);
  const filledDeductions = draft.deductions.filter(
    (item) => item.description.trim() || item.amount.trim(),
  );

  return (
    <div className="space-y-4">
      <SectionCard
        title="有证据吗？传上来，字段我来填"
        hint="可以跳过。传了的话，AI 会读出金额、日期这些字段自动填进表格；信息越全，评估越准。图片只留在这次会话里。"
      >
        <EvidenceUploader onPrefilled={onPrefilled} />
      </SectionCard>

      <SectionCard title="提交前核对一下" tone="quiet">
        <dl className="divide-y divide-line text-sm">
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
          <SummaryRow
            label="证据"
            value={draft.evidence.length > 0 ? `${draft.evidence.length} 张` : "没传"}
          />
        </dl>
        <button
          type="button"
          onClick={onEdit}
          className="mt-3 w-full rounded-xl border border-line bg-card px-3.5 py-2.5 text-sm font-medium text-ink active:scale-[0.99]"
        >
          回去改答案
        </button>
      </SectionCard>

      <p className="px-1 text-xs leading-relaxed text-muted">
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
      <dd
        className={`text-right text-ink ${mono ? "tnum font-mono" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}
