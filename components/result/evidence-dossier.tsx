"use client";

/**
 * 证据档（03b §3）—— 「AI 从 N 份证据读到 M 条事实」。
 *
 * 关键：**未被采用的事实也要列出来**。它证明 AI 通读了全部材料，
 * 而不是只挑了用得上的那几条 —— 这是「不是随便写封信」的第二个证据。
 *
 * 原件组件全部来自 04a（`components/evidence/**`），这里只编排、不重造。
 * 虚构的入住报告原件只在示例案例下渲染（军规：不伪造真实世界凭证）。
 */

import { useState, type Ref } from "react";

import {
  ConditionReportDoc,
  type ConditionReportHandle,
} from "@/components/evidence/condition-report-doc";
import { EvidenceThumb } from "@/components/evidence/evidence-thumb";
import type { EvidenceFact, EvidenceImage } from "@/lib/types";

import { cx } from "./utils";

type EvidenceMeta = Pick<EvidenceImage, "id" | "kind" | "fileName">;

const UNGROUPED: EvidenceMeta = {
  id: "ungrouped",
  kind: "other",
  fileName: "其他材料",
};

export interface EvidenceDossierProps {
  facts: EvidenceFact[];
  /** 本次上传的文件清单（只用到 id / kind / fileName） */
  evidence: EvidenceMeta[];
  /** 被对照卡采用的 factId */
  usedFactIds: string[];
  onFactClick?: (fact: EvidenceFact) => void;
  /** 受控展开；不传就用内部状态（默认折叠，标题即可看到 N/M） */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
  /** 只有示例案例才渲染 04a 那份虚构的入住报告原件 */
  showConditionReportDoc?: boolean;
  conditionReportRef?: Ref<ConditionReportHandle>;
  sampleBadge?: boolean;
  className?: string;
  id?: string;
}

export function EvidenceDossier({
  facts,
  evidence,
  usedFactIds,
  onFactClick,
  open,
  onOpenChange,
  defaultOpen = false,
  showConditionReportDoc = false,
  conditionReportRef,
  sampleBadge = false,
  className,
  id,
}: EvidenceDossierProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isOpen = open ?? uncontrolledOpen;

  const toggle = () => {
    const next = !isOpen;
    if (open === undefined) setUncontrolledOpen(next);
    onOpenChange?.(next);
  };

  const usedCount = facts.filter((fact) => usedFactIds.includes(fact.id)).length;
  const knownIds = new Set(evidence.map((item) => item.id));
  const orphans = facts.filter(
    (fact) => !fact.evidenceId || !knownIds.has(fact.evidenceId),
  );
  const fileCount = evidence.length + (orphans.length > 0 ? 1 : 0);
  const panelId = "evidence-dossier-panel";

  return (
    <section
      id={id}
      className={cx(
        "overflow-hidden rounded-2xl border border-line bg-card",
        className,
      )}
    >
      <button
        type="button"
        onClick={toggle}
        aria-expanded={isOpen}
        aria-controls={panelId}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors duration-150 hover:bg-paper md:px-5"
      >
        <span className="min-w-0 flex-1">
          <span className="block text-section text-ink">证据档</span>
          <span className="tnum mt-0.5 block text-caption text-muted">
            {fileCount === 0
              ? "这次没有上传任何证据"
              : `AI 从 ${fileCount} 份证据读到 ${facts.length} 条事实 · 对照卡采用 ${usedCount} 条`}
          </span>
        </span>
        <Chevron open={isOpen} />
      </button>

      {isOpen ? (
        <div
          id={panelId}
          className="flex flex-col gap-3 border-t border-line px-4 py-4 md:px-5"
        >
          <p className="text-caption leading-relaxed text-muted">
            没被采用的事实也留在这里 —— 它们证明这次是把全部材料通读了一遍，
            而不是只挑了用得上的那几条。
          </p>

          {evidence.map((file) => {
            const own = facts.filter((fact) => fact.evidenceId === file.id);
            return (
              <div key={file.id} className="flex flex-col gap-2">
                <EvidenceThumb
                  evidence={file}
                  facts={own}
                  usedFactIds={usedFactIds}
                  onFactClick={onFactClick}
                  defaultOpen={own.length > 0}
                  sampleBadge={sampleBadge}
                />
                {showConditionReportDoc && file.kind === "condition-report" ? (
                  <ConditionReportDoc ref={conditionReportRef} />
                ) : null}
              </div>
            );
          })}

          {orphans.length > 0 ? (
            <EvidenceThumb
              evidence={UNGROUPED}
              facts={orphans}
              usedFactIds={usedFactIds}
              onFactClick={onFactClick}
              defaultOpen
              sampleBadge={sampleBadge}
            />
          ) : null}

          {facts.length === 0 ? (
            <p className="rounded-xl border border-line bg-paper px-3.5 py-3 text-label leading-relaxed text-muted">
              这次没有从材料里读到可引用的行。下面的结论因此不做「合法 /
              不合法」的断言，而是逐笔把举证责任推回给房东。
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cx(
        "shrink-0 text-muted transition-transform duration-150",
        open && "rotate-180",
      )}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}
