/**
 * 申诉信的确定性拼装（03a §4）。
 *
 * **LLM 只产出每笔扣款的 `paragraphEn`**，骨架全部由代码拼：日期、收件人、
 * 物业地址、金额汇总、法条编号、出示单据的要求、回复期限、附件清单、签名区。
 * 金额与法条编号绝不经过 LLM，所以信与对照卡天然一致。
 */

import { formatIsoDateZh, isIsoDate, parseIsoDate, todayIsoDate } from "@/lib/dates";
import { clauseById, type LegalContext } from "@/lib/legal-injection";
import type {
  AnalysisItem,
  AnalysisLedger,
  AnalysisMode,
  AUState,
  CaseInput,
  EvidenceKind,
  Verdict,
} from "@/lib/types";

const STATE_TIME_ZONE: Record<AUState, string> = {
  NSW: "Australia/Sydney",
  VIC: "Australia/Melbourne",
};

const BOND_AUTHORITY_ZH: Record<AUState, string> = {
  NSW: "Rental Bonds Online（NSW Fair Trading）",
  VIC: "RTBA",
};

const TRIBUNAL_EN: Record<AUState, string> = {
  NSW: "the NSW Civil and Administrative Tribunal (NCAT)",
  VIC: "Rental Dispute Resolution Victoria (RDRV) / VCAT",
};

/**
 * 「房东须出示单据」这句话引哪一条 —— 只认注入清单里的 id，
 * 取不到就退化成不带条款号的表述（法条引用宁缺毋错）。
 */
export const EVIDENCE_DEMAND_CLAUSE: Record<AUState, string> = {
  NSW: "nsw-landlord-claim-evidence",
  VIC: "vic-permitted-bond-claims",
};

const ATTACHMENT_LABEL_EN: Record<EvidenceKind, string> = {
  "condition-report": "Condition report",
  "deduction-notice": "Your notice of claim on the bond",
  lease: "Pages of the residential tenancy agreement",
  chat: "Messages with the landlord / agent",
  room: "Photographs of the premises",
  other: "Other supporting documents",
};

const VERDICT_LABEL_ZH: Record<Verdict, string> = {
  unlawful: "❌ 不应扣",
  doubtful: "⚠️ 待房东举证",
  lawful: "✅ 合法，别争",
};

const MONTHS_EN = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** 整数不带小数，非整数保留两位 —— 信里与卡片共用同一套格式。 */
export function formatMoney(value: number): string {
  return `$${value.toLocaleString("en-AU", {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDateEn(iso: string): string {
  const date = parseIsoDate(iso);
  if (!date) return iso;
  return `${date.getUTCDate()} ${MONTHS_EN[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

export interface LetterInput {
  input: CaseInput;
  items: AnalysisItem[];
  ledger: AnalysisLedger;
  mode: AnalysisMode;
  context: LegalContext;
  /** 便于示例与测试固定日期 */
  asOf?: string;
}

export interface LetterOutput {
  letterEn: string;
  letterZhNotes: string;
}

function evidenceDemandEn(state: AUState, context: LegalContext): string {
  const clause = clauseById(context, EVIDENCE_DEMAND_CLAUSE[state]);

  if (state === "NSW") {
    if (!clause) {
      return "Please provide the outgoing condition report and copies of the quotes, invoices or receipts that support each amount claimed.";
    }
    return `Under the ${clause.act}, ${clause.section}, a landlord who claims against a rental bond must, within 7 days of making the claim, give the tenant a copy of the final condition report together with copies of the estimates, quotes, invoices or receipts that support the amount claimed. Please provide those documents for every item above.`;
  }

  if (!clause) {
    return "Please provide the outgoing condition report and copies of the quotes, invoices or receipts that support each amount claimed.";
  }
  return `Under the ${clause.act}, ${clause.section}, a claim against the bond is limited to matters such as the reasonable cost of repairs (taking fair wear and tear into account) and the reasonable cost of cleaning, and the amounts must be reasonable. Please provide the outgoing condition report together with the quotes, invoices or receipts that support every item above.`;
}

function attachmentsEn(input: CaseInput): string[] {
  const counts = new Map<EvidenceKind, number>();
  for (const item of input.evidence) {
    counts.set(item.kind, (counts.get(item.kind) ?? 0) + 1);
  }
  return Array.from(counts, ([kind, count]) => {
    const label = ATTACHMENT_LABEL_EN[kind] ?? ATTACHMENT_LABEL_EN.other;
    return `${label} (${count} page${count > 1 ? "s" : ""})`;
  });
}

function itemHeadingEn(index: number, item: AnalysisItem): string {
  const amount = item.amount !== undefined ? ` — ${formatMoney(item.amount)}` : "";
  return `${index + 1}. ${item.description}${amount}`;
}

function closingTotalsEn(
  input: CaseInput,
  ledger: AnalysisLedger,
  mode: AnalysisMode,
): string {
  if (mode === "burden-shift") {
    return `Until those documents are provided I do not accept the deductions, and I ask that my bond of ${formatMoney(
      input.bondAmount,
    )} be released to me.`;
  }
  if (ledger.disputableTotal <= 0) {
    return `Having reviewed each item, I accept the amounts claimed and ask that the balance of ${formatMoney(
      ledger.refundExpected,
    )} be released to me.`;
  }
  const accepted =
    ledger.lawfulTotal > 0
      ? ` I accept ${formatMoney(ledger.lawfulTotal)} of the claim.`
      : "";
  return `I dispute ${formatMoney(ledger.disputableTotal)} of the ${formatMoney(
    ledger.claimedTotal,
  )} claimed against my bond of ${formatMoney(input.bondAmount)}.${accepted} On that basis I ask that at least ${formatMoney(
    ledger.refundExpected,
  )} be released to me.`;
}

export function buildLetter({
  input,
  items,
  ledger,
  mode,
  context,
  asOf,
}: LetterInput): LetterOutput {
  const today = isIsoDate(asOf) ? asOf : todayIsoDate(STATE_TIME_ZONE[input.state]);
  const address = input.propertyAddress?.trim() || "[property address]";
  const movedOutRaw = input.moveOutDate.trim();
  const movedOut = isIsoDate(movedOutRaw)
    ? formatDateEn(movedOutRaw)
    : movedOutRaw || "[end of tenancy date]";

  const blocks: string[] = [];

  blocks.push(
    [
      formatDateEn(today),
      "",
      "To: The landlord / managing agent",
      `Property: ${address}`,
      `Bond reference: ${input.bondNumber?.trim() || "[your bond number]"}`,
    ].join("\n"),
  );

  blocks.push(
    `Re: Bond claim — bond ${formatMoney(input.bondAmount)} · amount claimed ${formatMoney(
      ledger.claimedTotal,
    )}`,
  );

  blocks.push("Dear Landlord / Managing Agent,");

  blocks.push(
    `I was the tenant at the above property and the tenancy ended on ${movedOut}. You have claimed ${formatMoney(
      ledger.claimedTotal,
    )} against my rental bond of ${formatMoney(
      input.bondAmount,
    )}. I have reviewed each item claimed and my response to each is set out below.`,
  );

  items.forEach((item, index) => {
    blocks.push(`${itemHeadingEn(index, item)}\n${item.paragraphEn.trim()}`);
  });

  blocks.push(evidenceDemandEn(input.state, context));
  blocks.push(closingTotalsEn(input, ledger, mode));

  blocks.push(
    `Please reply in writing within 14 days of the date of this letter. If we cannot resolve this, I will apply to ${
      TRIBUNAL_EN[input.state]
    } for orders about the bond, and I will provide this letter and the documents referred to in it.`,
  );

  const attachments = attachmentsEn(input);
  if (attachments.length > 0) {
    blocks.push(
      [
        "Attachments:",
        ...attachments.map((line, index) => `${index + 1}. ${line}`),
      ].join("\n"),
    );
  }

  blocks.push(
    ["Yours sincerely,", "", "[Your name]", "[Your phone number]", "[Your email]"].join(
      "\n",
    ),
  );

  return {
    letterEn: blocks.join("\n\n"),
    letterZhNotes: buildLetterNotesZh(input, items, ledger, mode, today),
  };
}

function buildLetterNotesZh(
  input: CaseInput,
  items: AnalysisItem[],
  ledger: AnalysisLedger,
  mode: AnalysisMode,
  today: string,
): string {
  const perItem = items
    .map((item, index) => {
      const amount = item.amount !== undefined ? ` ${formatMoney(item.amount)}` : "";
      return `${index + 1}. ${item.description}${amount} —— ${VERDICT_LABEL_ZH[item.verdict]}`;
    })
    .join("\n");

  const opening =
    mode === "burden-shift"
      ? `你还没有上传证据，所以这封信不下结论，而是逐笔要求房东先出示退租 condition report 与支持金额的发票/报价 —— 举证责任本来就在提出索扣的一方。`
      : `信里逐笔回应了房东索扣的 ${items.length} 笔，共 ${formatMoney(
          ledger.claimedTotal,
        )}，其中可争议 ${formatMoney(ledger.disputableTotal)}。`;

  return [
    `信件日期：${formatIsoDateZh(today)}`,
    "",
    opening,
    "",
    "逐笔对照（与上面的对照卡一致）：",
    perItem,
    "",
    "发送前请做三件事：",
    input.bondNumber?.trim()
      ? "1. 替换方括号占位符：[Your name]、[Your phone number]、[Your email]。押金号已经按你填的填好了。"
      : "1. 替换方括号占位符：[your bond number]（押金号）、[Your name]、[Your phone number]、[Your email]。",
    `2. 用邮件发送并保留原件与发送时间；同一份内容之后也可以提交给 ${BOND_AUTHORITY_ZH[input.state]}或 tribunal。`,
    "3. 附件按信末清单一起发出。",
    "",
    "信里的金额、法条编号、期限与附件清单都由系统按你填写的案件数据生成，AI 只负责每一笔的英文论述，所以信和对照卡不会互相打架。这封信是要求对方举证与退回的沟通文书，不构成法律意见。",
    `如果对方在 14 天内不回复或坚持扣款，下一步按「行动路线图」处理（先查 ${BOND_AUTHORITY_ZH[input.state]}的押金记录）。`,
  ].join("\n");
}
