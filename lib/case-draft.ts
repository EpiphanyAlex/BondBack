/**
 * 向导内部的草稿态。数字字段用字符串保存，这样「空」和「0」可以区分，
 * 也方便自动预填只写空白字段。提交时通过 `toCaseInput` 转成 02-wizard.md
 * 约定的 `CaseInput` 契约交给 03。
 */

import { isIsoDate } from "@/lib/dates";
import type {
  AUState,
  CaseInput,
  ClaimNoticeDeliveryMethod,
  Deduction,
  DisputeType,
  EvidenceImage,
  ExtractedCaseFields,
  TriState,
  BondLookup,
  BondPaymentRecipient,
} from "@/lib/types";

export interface DeductionDraft {
  id: string;
  description: string;
  amount: string;
}

export interface CaseDraft {
  state: AUState;
  disputeTypes: DisputeType[];
  bondAmount: string;
  claimedAmount: string;
  moveOutDate: string;
  bondPayment: {
    paidTo: BondPaymentRecipient;
    paidAt: string;
    paidByInstalments: TriState;
    /** NSW 分期：首期之后的各期日期（含付清日） */
    instalmentDates: string[];
    confirmationReceived: TriState;
    lookup: BondLookup;
  };
  hasClaimNotice: boolean;
  claimNotice: {
    receivedAt: string;
    dueAt: string;
    deliveryMethod: ClaimNoticeDeliveryMethod;
  };
  deductions: DeductionDraft[];
  evidence: EvidenceImage[];
  propertyAddress: string;
  bondNumber: string;
  notes: string;
}

/** 会被 /api/extract 预填的字段；用户改过就永不覆盖。 */
export const PREFILLABLE_FIELDS = [
  "bondAmount",
  "claimedAmount",
  "moveOutDate",
  "propertyAddress",
  "bondNumber",
  "deductions",
] as const;

export type PrefillableField = (typeof PREFILLABLE_FIELDS)[number];

export type TouchedFields = Partial<Record<PrefillableField, boolean>>;

let deductionSeq = 0;

export function createDeductionId(): string {
  deductionSeq += 1;
  return `ded-${deductionSeq}-${Date.now().toString(36)}`;
}

export function createDeductionDraft(
  description = "",
  amount = "",
): DeductionDraft {
  return { id: createDeductionId(), description, amount };
}

export function createEmptyDraft(): CaseDraft {
  return {
    state: "NSW",
    disputeTypes: [],
    bondAmount: "",
    claimedAmount: "",
    moveOutDate: "",
    bondPayment: {
      paidTo: "unsure",
      paidAt: "",
      paidByInstalments: "unsure",
      instalmentDates: [],
      confirmationReceived: "unsure",
      lookup: { status: "not-checked", evidence: "none" },
    },
    hasClaimNotice: false,
    claimNotice: { receivedAt: "", dueAt: "", deliveryMethod: "unsure" },
    deductions: [createDeductionDraft()],
    evidence: [],
    propertyAddress: "",
    bondNumber: "",
    notes: "",
  };
}

export function parseAmount(value: string): number | undefined {
  const cleaned = value.replace(/[$,\s]/g, "");
  if (!cleaned) return undefined;
  const parsed = Number(cleaned);
  if (!Number.isFinite(parsed) || parsed < 0) return undefined;
  return Math.round(parsed * 100) / 100;
}

export function formatAmount(value: number | undefined): string {
  if (value === undefined || !Number.isFinite(value)) return "";
  return String(Math.round(value * 100) / 100);
}

function isBlankDeduction(item: DeductionDraft): boolean {
  return !item.description.trim() && !item.amount.trim();
}

/** 扣款明细合计；一项都没填时返回 undefined。 */
export function deductionTotal(deductions: DeductionDraft[]): number | undefined {
  const amounts = deductions
    .map((item) => parseAmount(item.amount))
    .filter((value): value is number => value !== undefined);
  if (amounts.length === 0) return undefined;
  return Math.round(amounts.reduce((sum, value) => sum + value, 0) * 100) / 100;
}

export function toDeductions(deductions: DeductionDraft[]): Deduction[] {
  return deductions
    .filter((item) => !isBlankDeduction(item))
    .map((item) => ({
      description: item.description.trim() || "未命名扣款项",
      amount: parseAmount(item.amount),
    }));
}

/**
 * 草稿 → 契约。押金/被扣金额缺失时按 0 处理（03 会看到 0 并据此措辞），
 * 被扣金额为空则回退为扣款明细合计。
 */
export function toCaseInput(draft: CaseDraft): CaseInput {
  const deductions = toDeductions(draft.deductions);
  const claimed =
    parseAmount(draft.claimedAmount) ?? deductionTotal(draft.deductions) ?? 0;

  const instalmentDates = draft.bondPayment.instalmentDates.filter(isIsoDate);

  const caseInput: CaseInput = {
    state: draft.state,
    disputeTypes: draft.disputeTypes.length > 0 ? [...draft.disputeTypes] : ["other"],
    bondAmount: parseAmount(draft.bondAmount) ?? 0,
    claimedAmount: claimed,
    moveOutDate: draft.moveOutDate,
    bondPayment: {
      paidTo: draft.bondPayment.paidTo,
      paidByInstalments: draft.bondPayment.paidByInstalments,
      confirmationReceived: draft.bondPayment.confirmationReceived,
      lookup: { ...draft.bondPayment.lookup },
      ...(isIsoDate(draft.bondPayment.paidAt)
        ? { paidAt: draft.bondPayment.paidAt }
        : {}),
      ...(instalmentDates.length > 0 ? { instalmentDates } : {}),
    },
    deductions,
    evidence: draft.evidence,
    ...(draft.propertyAddress.trim()
      ? { propertyAddress: draft.propertyAddress.trim() }
      : {}),
    ...(draft.bondNumber.trim() ? { bondNumber: draft.bondNumber.trim() } : {}),
    ...(draft.notes.trim() ? { notes: draft.notes.trim() } : {}),
  };

  if (draft.hasClaimNotice) {
    caseInput.claimNotice = {
      deliveryMethod: draft.claimNotice.deliveryMethod,
      ...(isIsoDate(draft.claimNotice.receivedAt)
        ? { receivedAt: draft.claimNotice.receivedAt }
        : {}),
      ...(isIsoDate(draft.claimNotice.dueAt)
        ? { dueAt: draft.claimNotice.dueAt }
        : {}),
    };
  }

  return caseInput;
}

export interface PrefillOutcome {
  /**
   * 只返回补丁而不是整份草稿：预填是异步回来的，期间用户可能已经加了证据，
   * 整份覆盖会把那些改动抹掉。
   */
  patch: Partial<CaseDraft>;
  /** 实际被写入的字段，用于高亮动画与提示文案 */
  filled: PrefillableField[];
}

/**
 * 自动预填合并规则（02-wizard.md）：
 * - 只填当前为空、且用户没改过的字段
 * - 扣款列表整体为空时才整体预填
 * - claimedAmount 为空时可由扣款合计得出，一经用户修改不再覆盖
 */
export function applyExtractedFields(
  draft: CaseDraft,
  fields: ExtractedCaseFields,
  touched: TouchedFields,
): PrefillOutcome {
  const patch: Partial<CaseDraft> = {};
  const filled: PrefillableField[] = [];

  const canFill = (field: PrefillableField, currentValue: string) =>
    !touched[field] && !currentValue.trim();

  if (fields.bondAmount !== undefined && canFill("bondAmount", draft.bondAmount)) {
    const value = formatAmount(fields.bondAmount);
    if (value) {
      patch.bondAmount = value;
      filled.push("bondAmount");
    }
  }

  if (
    fields.moveOutDate !== undefined &&
    isIsoDate(fields.moveOutDate) &&
    canFill("moveOutDate", draft.moveOutDate)
  ) {
    patch.moveOutDate = fields.moveOutDate;
    filled.push("moveOutDate");
  }

  if (
    fields.propertyAddress !== undefined &&
    canFill("propertyAddress", draft.propertyAddress)
  ) {
    const value = fields.propertyAddress.trim();
    if (value) {
      patch.propertyAddress = value;
      filled.push("propertyAddress");
    }
  }

  if (fields.bondNumber !== undefined && canFill("bondNumber", draft.bondNumber)) {
    const value = fields.bondNumber.trim();
    if (value) {
      patch.bondNumber = value;
      filled.push("bondNumber");
    }
  }

  if (
    fields.deductions !== undefined &&
    fields.deductions.length > 0 &&
    !touched.deductions &&
    draft.deductions.every(isBlankDeduction)
  ) {
    patch.deductions = fields.deductions.map((item) =>
      createDeductionDraft(item.description ?? "", formatAmount(item.amount)),
    );
    filled.push("deductions");
  }

  if (canFill("claimedAmount", draft.claimedAmount)) {
    const fromModel =
      fields.claimedAmount !== undefined ? formatAmount(fields.claimedAmount) : "";
    // 明细刚被预填时按新明细合计，避免用上一版的空列表算
    const fromDeductions = formatAmount(
      deductionTotal(patch.deductions ?? draft.deductions),
    );
    const value = fromModel || fromDeductions;
    if (value) {
      patch.claimedAmount = value;
      filled.push("claimedAmount");
    }
  }

  return { patch, filled };
}

export const PREFILL_FIELD_LABELS: Record<PrefillableField, string> = {
  bondAmount: "押金金额",
  claimedAmount: "被扣金额",
  moveOutDate: "退租日期",
  propertyAddress: "房屋地址",
  bondNumber: "押金号",
  deductions: "扣款明细",
};
