"use client";

/**
 * 证据缩略卡（04a §3 末段）—— 租约 / 聊天截图 / 扣款清单这三份不做完整原件，
 * 只给「文件名 + 类型图标 + 关键行摘要」，点一下展开。入住报告是唯一的例外，
 * 它有独立的可定位原件组件 `ConditionReportDoc`。
 *
 * 纯 props、零会话依赖，03b 的证据档与 04b 的重放都能直接喂：
 *
 * ```tsx
 * <EvidenceThumb
 *   evidence={SAMPLE_CASE_INPUT.evidence[1]}
 *   facts={SAMPLE_FACTS.filter((f) => f.evidenceId === "ev-lease")}
 *   usedFactIds={SAMPLE_USED_FACT_IDS}
 *   onFactClick={(fact) => fact.anchorId && docRef.current?.scrollToAndHighlight(fact.anchorId)}
 * />
 * ```
 *
 * 军规：聊天截图展开后是**中性气泡**，不出现任何第三方 IM 的商标性 UI 细节。
 */

import { useCallback, useState } from "react";
import type { ReactNode } from "react";

import type { EvidenceFact, EvidenceImage, EvidenceKind } from "@/lib/types";

export const EVIDENCE_KIND_LABEL: Record<EvidenceKind, string> = {
  "condition-report": "入住报告",
  "deduction-notice": "扣款清单",
  lease: "租约",
  chat: "聊天截图",
  room: "房间照片",
  other: "其他文件",
};

export interface EvidenceThumbProps {
  /** 文件本身：只用到 kind 与 fileName */
  evidence: Pick<EvidenceImage, "id" | "kind" | "fileName">;
  /** 属于这份文件的事实，展开后作为「关键行摘要」列出 */
  facts?: EvidenceFact[];
  /** 被对照卡 `evidenceRefs` 采用的 factId；用于打钩 */
  usedFactIds?: string[];
  /** 副标题，如「3 页 · 已读到清洁条款」 */
  captionZh?: string;
  /** 点击某条摘要（03b 用它联动入住报告高亮） */
  onFactClick?: (fact: EvidenceFact) => void;
  defaultOpen?: boolean;
  /** 受控展开；传了就以它为准 */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** 示例案例的文件必须标注（军规：不伪造真实世界凭证） */
  sampleBadge?: boolean;
  className?: string;
}

function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

export function EvidenceThumb({
  evidence,
  facts = [],
  usedFactIds = [],
  captionZh,
  onFactClick,
  defaultOpen = false,
  open,
  onOpenChange,
  sampleBadge = false,
  className,
}: EvidenceThumbProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isOpen = open ?? uncontrolledOpen;

  const toggle = useCallback(() => {
    const next = !isOpen;
    if (open === undefined) setUncontrolledOpen(next);
    onOpenChange?.(next);
  }, [isOpen, open, onOpenChange]);

  const usedCount = facts.filter((fact) =>
    usedFactIds.includes(fact.id),
  ).length;
  const panelId = `evidence-thumb-${evidence.id}`;

  return (
    <div
      className={cx(
        "overflow-hidden border border-line bg-card",
        className,
      )}
    >
      <button
        type="button"
        onClick={toggle}
        aria-expanded={isOpen}
        aria-controls={panelId}
        className="flex w-full items-center gap-3 px-3 py-3 text-left transition-colors duration-150 hover:bg-paper md:px-4"
      >
        <span className="shrink-0 border border-line bg-paper p-2 text-muted">
          <KindGlyph kind={evidence.kind} />
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="truncate text-label font-semibold text-ink">
              {evidence.fileName}
            </span>
            {sampleBadge ? (
              <span className="rounded-full border border-line px-1.5 py-px font-mono text-micro uppercase text-muted">
                示例案例
              </span>
            ) : null}
          </span>
          <span className="mt-0.5 block text-caption text-muted">
            {EVIDENCE_KIND_LABEL[evidence.kind]}
            {captionZh ? ` · ${captionZh}` : null}
            {facts.length > 0
              ? ` · 读到 ${facts.length} 条${usedCount > 0 ? `，采用 ${usedCount} 条` : ""}`
              : null}
          </span>
        </span>

        <Chevron open={isOpen} />
      </button>

      {isOpen ? (
        <div id={panelId} className="border-t border-line px-3 py-3 md:px-4">
          {facts.length === 0 ? (
            <p className="text-caption text-muted">
              这份文件没有读到可引用的行。
            </p>
          ) : evidence.kind === "chat" ? (
            <ChatBubbles
              facts={facts}
              usedFactIds={usedFactIds}
              onFactClick={onFactClick}
            />
          ) : (
            <ul className="flex flex-col gap-2">
              {facts.map((fact) => (
                <FactLine
                  key={fact.id}
                  fact={fact}
                  used={usedFactIds.includes(fact.id)}
                  onFactClick={onFactClick}
                />
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}

/* ── 摘要行 ───────────────────────────────────────────────────────────── */

function UsedMark({ used }: { used: boolean }) {
  // 不靠颜色单独传意：图标 + 中文标签同时在场
  return (
    <span
      className={cx(
        "inline-flex shrink-0 items-center gap-1 font-mono text-micro uppercase",
        used ? "text-evidence-used" : "text-evidence-unused",
      )}
    >
      <span aria-hidden="true">{used ? "✓" : "○"}</span>
      {used ? "已采用" : "未采用"}
    </span>
  );
}

function FactShell({
  fact,
  onFactClick,
  children,
}: {
  fact: EvidenceFact;
  onFactClick?: (fact: EvidenceFact) => void;
  children: ReactNode;
}) {
  if (!onFactClick) return <li className="w-full">{children}</li>;
  return (
    <li>
      <button
        type="button"
        onClick={() => onFactClick(fact)}
        className="w-full text-left transition-colors duration-150 hover:bg-paper"
      >
        {children}
      </button>
    </li>
  );
}

function FactLine({
  fact,
  used,
  onFactClick,
}: {
  fact: EvidenceFact;
  used: boolean;
  onFactClick?: (fact: EvidenceFact) => void;
}) {
  return (
    <FactShell fact={fact} onFactClick={onFactClick}>
      <div className="border border-line px-3 py-2">
        <div className="flex items-baseline justify-between gap-3">
          <p className="font-mono text-micro uppercase text-muted">
            {fact.locator}
          </p>
          <UsedMark used={used} />
        </div>
        <p className="mt-1 text-label text-ink">{fact.quote}</p>
      </div>
    </FactShell>
  );
}

/** 中性气泡：没有任何第三方 IM 的头像、绿底、气泡尖角等商标性细节。 */
function ChatBubbles({
  facts,
  usedFactIds,
  onFactClick,
}: {
  facts: EvidenceFact[];
  usedFactIds: string[];
  onFactClick?: (fact: EvidenceFact) => void;
}) {
  return (
    <ul className="flex flex-col gap-2">
      {facts.map((fact) => (
        <FactShell key={fact.id} fact={fact} onFactClick={onFactClick}>
          <div className="bg-paper px-3 py-2">
            <div className="flex items-baseline justify-between gap-3">
              <p className="font-mono text-micro uppercase text-muted">
                {fact.locator}
              </p>
              <UsedMark used={usedFactIds.includes(fact.id)} />
            </div>
            <p className="mt-1.5 inline-block border border-line bg-card px-3 py-2 text-label text-ink">
              {fact.quote}
            </p>
          </div>
        </FactShell>
      ))}
    </ul>
  );
}

/* ── 图标 ─────────────────────────────────────────────────────────────── */

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

function KindGlyph({ kind }: { kind: EvidenceKind }) {
  const common = {
    viewBox: "0 0 24 24",
    width: 18,
    height: 18,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  switch (kind) {
    case "condition-report":
      return (
        <svg {...common}>
          <path d="M9 4h6v3H9z" />
          <path d="M15 5.5h3v14H6v-14h3" />
          <path d="M9 11h6M9 15h4" />
        </svg>
      );
    case "deduction-notice":
      return (
        <svg {...common}>
          <path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" />
          <path d="M9 8h6M9 12h6M9 16h3" />
        </svg>
      );
    case "lease":
      return (
        <svg {...common}>
          <path d="M13 3H7a1 1 0 00-1 1v16a1 1 0 001 1h10a1 1 0 001-1V8z" />
          <path d="M13 3v5h5" />
          <path d="M9 13h6M9 17h4" />
        </svg>
      );
    case "chat":
      return (
        <svg {...common}>
          <path d="M20 12a7 7 0 01-7 7H8l-4 3v-5a7 7 0 017-7h2a7 7 0 017 2z" />
        </svg>
      );
    case "room":
      return (
        <svg {...common}>
          <path d="M4 5h16v14H4z" />
          <path d="M4 15l4.5-4.5L13 15" />
          <path d="M14 13l2-2 4 4" />
          <path d="M15.5 8.5h.01" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <path d="M20 11l-7.5 7.5a4 4 0 01-5.7-5.7l8-8a2.7 2.7 0 013.8 3.8l-8 8a1.4 1.4 0 01-2-2l7-7" />
        </svg>
      );
  }
}
