import assert from "node:assert/strict";

const { buildAnalysisResult, buildDeductionLines } = await import(
  "@/lib/analysis-validate"
);
const { selectLegalContext } = await import("@/lib/legal-injection");

const context = selectLegalContext("NSW", ["cleaning", "damage", "bond"], "2026-07-25");

const facts = [
  {
    id: "fact-1",
    kind: "condition-report",
    evidenceId: "ev-1",
    locator: "入住报告 P3 · 客厅地毯",
    quote: "Carpet: existing stains noted",
  },
  {
    id: "fact-2",
    kind: "lease",
    evidenceId: "ev-2",
    locator: "租约 P2 · 已读页面",
    quote: "已读页面中未见园艺/草坪维护义务条款",
  },
  {
    id: "fact-3",
    kind: "deduction-notice",
    evidenceId: "ev-3",
    locator: "扣款清单 · 第 3 行",
    quote: "Water usage 01/03-31/05 $186.00",
  },
];

const input = {
  state: "NSW",
  disputeTypes: ["cleaning", "damage", "bond"],
  bondAmount: 3560,
  claimedAmount: 1306,
  moveOutDate: "2026-06-12",
  bondPayment: {
    paidTo: "agent",
    paidAt: "2025-05-20",
    paidByInstalments: "no",
    confirmationReceived: "no",
    lookup: { status: "not-checked", evidence: "none" },
  },
  deductions: [
    { description: "End of lease professional clean + carpet steam clean", amount: 780 },
    { description: "Garden / lawn maintenance", amount: 340 },
    { description: "Unpaid water usage", amount: 186 },
  ],
  evidence: [
    { id: "ev-1", kind: "condition-report", fileName: "cr.jpg", mimeType: "image/jpeg", dataUrl: "" },
    { id: "ev-2", kind: "lease", fileName: "lease.jpg", mimeType: "image/jpeg", dataUrl: "" },
    { id: "ev-3", kind: "deduction-notice", fileName: "notice.jpg", mimeType: "image/jpeg", dataUrl: "" },
  ],
  propertyAddress: "12/34 Example St, Sampleville NSW 2000",
};

/* ── 手改的假模型响应：混入捏造引用、被改写的法条原文、越界结论 ───────── */
const raw = {
  items: [
    {
      deductionIndex: 1,
      verdict: "unlawful",
      // 混一个捏造的 factId
      evidenceRefs: [
        { factId: "fact-1", noteZh: "入住时已记录污渍" },
        { factId: "fact-99", noteZh: "这条不存在" },
      ],
      // 模型把 quote 改写了 + section 写成 s 51(3)(c)（清单里是 s 51(2)(a), (3)(c)）
      statuteRefs: [
        {
          id: "",
          act: "Residential Tenancies Act 2010 (NSW)",
          section: "s 51(3)(c)",
          quote: "premises must be left spotless at all times",
        },
        {
          id: "nsw-condition-report-evidence",
          act: "Residential Tenancies Act 2010 (NSW)",
          section: "s 30",
          quote: "WRONG QUOTE INVENTED BY MODEL",
        },
      ],
      checks: { preExisting: "yes", contractObligation: "unknown", fairWearTear: "yes" },
      reasoningZh: "入住报告已记录 existing stains noted，按 s 30 推定为入住时状况，房东不能要你付 $780 把地毯洗到全新。",
      paragraphEn:
        "I do not accept the cleaning charge of $780. The ingoing condition report records existing stains, and under s 165 and s 999 the premises only need to be reasonably clean.",
    },
    {
      deductionIndex: 2,
      // 红线：contractObligation absent 却判 unlawful
      verdict: "unlawful",
      evidenceRefs: [{ factId: "fact-2", noteZh: null }],
      statuteRefs: [
        {
          id: "nsw-landlord-claim-evidence",
          act: "Residential Tenancies Act 2010 (NSW)",
          section: "s 165",
          quote: "within 7 days of making the claim, give the tenant ... a copy of the final condition report",
        },
      ],
      checks: { preExisting: "unknown", contractObligation: "absent", fairWearTear: "n-a" },
      reasoningZh: "你上传的合约页中未见园艺维护义务条款。",
      paragraphEn: "No term requiring me to maintain the garden appears in the pages provided.",
    },
    {
      deductionIndex: 3,
      verdict: "lawful",
      evidenceRefs: [{ factId: "fact-3", noteZh: "扣款清单列明水费" }],
      // 全部捏造 → 应被丢光 → 降级
      statuteRefs: [
        {
          id: "nsw-made-up-clause",
          act: "Imaginary Act 1999 (NSW)",
          section: "s 4242",
          quote: "totally invented",
        },
      ],
      checks: { preExisting: "n-a", contractObligation: "exists", fairWearTear: "n-a" },
      reasoningZh: "水费是法条明列可扣项目，别争。",
      paragraphEn: "I accept this item.",
    },
  ],
};

const result = buildAnalysisResult(raw, { input, facts, context, asOf: "2026-07-25" });

console.log("=== mode ===", result.mode);
console.log("=== ledger ===", result.ledger, "winRate:", result.winRate);
for (const item of result.items) {
  console.log("\n---", item.description, item.amount, "→", item.verdict, "disputable", item.disputableAmount);
  console.log("  checks:", JSON.stringify(item.checks));
  console.log("  evidenceRefs:", JSON.stringify(item.evidenceRefs));
  console.log("  statuteRefs:", item.statuteRefs.map((r) => `${r.section} :: ${r.quote}`).join(" | "));
  console.log("  reasoningZh:", item.reasoningZh);
  console.log("  paragraphEn:", item.paragraphEn);
}

/* ── 断言 ───────────────────────────────────────────────────────────── */
const [a, b, c] = result.items;

// ① 捏造的 factId 被丢弃
assert.deepEqual(a.evidenceRefs.map((r) => r.factId), ["fact-1"]);
// ① section 容错解析到注入条目，quote 被注入值覆盖
assert.equal(a.statuteRefs[0].section, "s 51(2)(a), (3)(c)");
assert.match(a.statuteRefs[0].quote, /reasonable state of cleanliness/);
assert.equal(a.statuteRefs[1].quote, "is presumed to be a correct statement ... unless the contrary is proved");
assert.equal(a.verdict, "unlawful");
// ① 段落里的金额与越界条款号被清洗
assert.ok(!a.paragraphEn.includes("$780"), "金额不得由 LLM 写进信里");
assert.ok(!a.paragraphEn.includes("s 999"), "白名单外的条款号必须清洗");
assert.match(a.paragraphEn, /see Residential Tenancies Act 2010 \(NSW\)/);

// ② contractObligation absent → 绝不 unlawful
assert.equal(b.checks.contractObligation, "absent");
assert.equal(b.verdict, "doubtful");
assert.match(b.reasoningZh, /^（我们只读到你上传的部分合约页/);

// ③ 引用全被丢弃 → 降级 doubtful 且句首有说明
assert.equal(c.statuteRefs.length, 0);
assert.equal(c.verdict, "doubtful");
assert.match(c.reasoningZh, /^（法条引用未通过核对/);

// ④ ledger 代码重算
assert.deepEqual(result.ledger, {
  claimedTotal: 1306,
  unlawfulTotal: 780,
  doubtfulTotal: 526,
  lawfulTotal: 0,
  disputableTotal: 1306,
  refundExpected: 3560,
});

// ⑤ 存管等级来自 lib/bond-lodgement.ts
console.log("\n=== bondLodgementAlert ===", result.bondLodgementAlert.level);
assert.equal(result.bondLodgementAlert.level, "verify-record");

console.log("\n=== letterEn ===\n" + result.letterEn);
console.log("\n=== letterZhNotes ===\n" + result.letterZhNotes);

/* ── 零证据模式 ─────────────────────────────────────────────────────── */
const empty = buildAnalysisResult(null, {
  input: { ...input, evidence: [] },
  facts: [],
  context,
  asOf: "2026-07-25",
});
assert.equal(empty.mode, "burden-shift");
assert.ok(empty.items.every((i) => i.verdict === "doubtful"));
assert.ok(
  empty.items.every(
    (i) =>
      i.checks.preExisting === "unknown" &&
      i.checks.contractObligation === "unknown" &&
      i.checks.fairWearTear === "unknown",
  ),
);
assert.ok(empty.items.every((i) => i.statuteRefs.length > 0));
assert.deepEqual(empty.ledger, {
  claimedTotal: 1306,
  unlawfulTotal: 0,
  doubtfulTotal: 1306,
  lawfulTotal: 0,
  disputableTotal: 1306,
  refundExpected: 3560,
});
console.log("\n=== burden-shift letter ===\n" + empty.letterEn);

/* ── 明细缺口补洞 ───────────────────────────────────────────────────── */
const gap = buildDeductionLines({
  ...input,
  deductions: [{ description: "Cleaning", amount: 500 }],
  claimedAmount: 1306,
});
assert.deepEqual(gap, [
  { description: "Cleaning", amount: 500 },
  { description: "其余未列明细的扣款", amount: 806 },
]);

const noneListed = buildDeductionLines({ ...input, deductions: [], claimedAmount: 1306 });
assert.deepEqual(noneListed, [{ description: "房东未提供明细的扣款", amount: 1306 }]);

/* ── 诚实条款：rent-arrears 判 lawful 必须原样通过 ───────────────────── */
const arrearsInput = {
  ...input,
  disputeTypes: ["rent-arrears", "bond"],
  claimedAmount: 900,
  deductions: [{ description: "Rent arrears 2 weeks", amount: 900 }],
};
const arrearsContext = selectLegalContext("NSW", ["rent-arrears", "bond"], "2026-07-25");
const arrears = buildAnalysisResult(
  {
    items: [
      {
        deductionIndex: 1,
        verdict: "lawful",
        evidenceRefs: [{ factId: "fact-3", noteZh: null }],
        statuteRefs: [
          {
            id: "nsw-permitted-bond-claims",
            act: "Residential Tenancies Act 2010 (NSW)",
            section: "s 166",
            quote: "reasonable cost of repairs ... other than fair wear and tear ... reasonable cost of cleaning",
          },
        ],
        checks: { preExisting: "n-a", contractObligation: "exists", fairWearTear: "n-a" },
        reasoningZh: "欠租属于法条明列可从押金扣除的项目，这一笔房东占理，别争。",
        paragraphEn: "I accept the deduction for the rent that was outstanding when the tenancy ended.",
      },
    ],
  },
  { input: arrearsInput, facts, context: arrearsContext, asOf: "2026-07-25" },
);
assert.equal(arrears.items[0].verdict, "lawful");
assert.equal(arrears.items[0].disputableAmount, 0);
assert.deepEqual(arrears.ledger, {
  claimedTotal: 900,
  unlawfulTotal: 0,
  doubtfulTotal: 0,
  lawfulTotal: 900,
  disputableTotal: 0,
  refundExpected: 2660,
});
assert.equal(arrears.winRate, "low");
console.log("\n=== rent-arrears item ===", arrears.items[0].verdict, arrears.items[0].reasoningZh);
console.log("\n=== rent-arrears letter tail ===\n" + arrears.letterEn.split("\n\n").slice(-4).join("\n\n"));

console.log("\n✅ 全部断言通过");
