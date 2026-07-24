import type { DisputeType } from "@/lib/types";

import { nswLegalClauses, nswStateProcesses } from "./nsw";
import type { AUState, LegalClause, StateProcess } from "./types";
import { vicLegalClauses, vicStateProcesses } from "./vic";

export const legalClauses: Record<AUState, LegalClause[]> = {
  NSW: nswLegalClauses,
  VIC: vicLegalClauses,
};

export const stateProcesses: Record<AUState, StateProcess[]> = {
  NSW: nswStateProcesses,
  VIC: vicStateProcesses,
};

type EffectiveDatedItem = {
  effectiveFrom?: string;
  effectiveTo?: string;
};

function todayIsoDate(state: AUState): string {
  const timeZone =
    state === "NSW" ? "Australia/Sydney" : "Australia/Melbourne";
  const parts = new Intl.DateTimeFormat("en-AU", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value;

  return `${part("year")}-${part("month")}-${part("day")}`;
}

/** 日期字段统一用 YYYY-MM-DD；effectiveTo 包含当日。 */
function isEffectiveOn(item: EffectiveDatedItem, asOf: string): boolean {
  return (
    (!item.effectiveFrom || item.effectiveFrom <= asOf) &&
    (!item.effectiveTo || asOf <= item.effectiveTo)
  );
}

/**
 * prompt 只能通过此入口取法条，避免未确认或尚未生效的条目进入维权信。
 */
export function getConfirmedLegalClauses(
  state: AUState,
  topics: DisputeType[] = [],
  asOf?: string,
): LegalClause[] {
  const effectiveDate = asOf ?? todayIsoDate(state);

  return legalClauses[state].filter(
    (clause) =>
      clause.confidence === "confirmed" &&
      isEffectiveOn(clause, effectiveDate) &&
      (topics.length === 0 ||
        clause.topics.some(
          (topic) => topic === "all" || topics.includes(topic),
        )),
  );
}

/** 路线图同样只消费 confirmed 且当前有效的条目。 */
export function getConfirmedStateProcesses(
  state: AUState,
  asOf?: string,
): StateProcess[] {
  const effectiveDate = asOf ?? todayIsoDate(state);

  return stateProcesses[state].filter(
    (process) =>
      process.confidence === "confirmed" &&
      isEffectiveOn(process, effectiveDate),
  );
}

export type {
  AUState,
  LegalClause,
  LegalConfidence,
  LegalSourceKind,
  LegalTopic,
  ProcessStage,
  StateProcess,
} from "./types";
