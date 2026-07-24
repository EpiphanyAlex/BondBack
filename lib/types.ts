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

export type TriState = "yes" | "no" | "unsure";

export type BondPaymentRecipient =
  | "bond-authority"
  | "landlord"
  | "agent"
  | "other"
  | "unsure";

export type BondLookupStatus =
  | "found"
  | "not-found"
  | "not-checked"
  | "unsure";

export type BondLookupEvidence = "none" | "portal" | "authority-written";

export interface BondLookup {
  status: BondLookupStatus;
  evidence: BondLookupEvidence;
}

export interface BondPayment {
  paidTo: BondPaymentRecipient;
  paidAt?: string;
  paidByInstalments: TriState;
  instalmentDates?: string[];
  confirmationReceived: TriState;
  lookup: BondLookup;
}

export type ClaimNoticeDeliveryMethod =
  | "email"
  | "post"
  | "sms"
  | "other"
  | "unsure";

export interface ClaimNotice {
  receivedAt?: string;
  dueAt?: string;
  deliveryMethod: ClaimNoticeDeliveryMethod;
}

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
  bondPayment: BondPayment;
  claimNotice?: ClaimNotice;
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

export type BondLodgementAlertLevel =
  | "none"
  | "verify-record"
  | "possible-non-lodgement"
  | "authority-confirmed-missing";

export interface BondLodgementAlert {
  level: BondLodgementAlertLevel;
  reasoningZh: string;
  calculatedDeadline?: string;
  deadlineBasis?: string;
}

export interface StatuteRef {
  act: string;
  section: string;
}

export interface AnalysisItem {
  description: string;
  amount?: number;
  verdict: "unlawful" | "lawful" | "doubtful";
  reasoning_zh: string;
  statuteRefs: StatuteRef[];
}

export interface AnalysisResult {
  items: AnalysisItem[];
  bondLodgementAlert: BondLodgementAlert;
  letterEn: string;
  letterZhNotes: string;
  winRate: "high" | "medium" | "low";
}
