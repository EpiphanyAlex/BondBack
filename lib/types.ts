export const AU_STATES = ["NSW", "VIC"] as const;

export type AUState = (typeof AU_STATES)[number];

export const DISPUTE_TYPES = [
  "cleaning",
  "damage",
  "early-termination",
  "bond",
  "rent-arrears",
  "other",
] as const;

export type DisputeType = (typeof DISPUTE_TYPES)[number];

export const EVIDENCE_KINDS = [
  "room",
  "lease",
  "condition-report",
  "chat",
  "other",
] as const;

export type EvidenceKind = (typeof EVIDENCE_KINDS)[number];

export type BondLodged = "yes" | "no" | "unsure";

export interface Deduction {
  description: string;
  amount?: number;
}

/**
 * Evidence is kept as compressed image data in the client session only.
 * PDF pages are rendered to images before they enter this contract.
 */
export interface EvidenceImage {
  id: string;
  kind: EvidenceKind;
  fileName: string;
  mimeType: string;
  dataUrl: string;
  sourcePage?: number;
}

export interface CaseInput {
  state: AUState;
  disputeTypes: DisputeType[];
  bondAmount: number;
  claimedAmount: number;
  moveOutDate: string;
  bondLodged: BondLodged;
  deductions: Deduction[];
  evidence: EvidenceImage[];
  propertyAddress?: string;
  notes?: string;
}

export type ExtractedCaseFields = Partial<
  Pick<
    CaseInput,
    | "bondAmount"
    | "claimedAmount"
    | "moveOutDate"
    | "deductions"
    | "propertyAddress"
  >
>;

export interface ExtractResult {
  fields: ExtractedCaseFields;
}
