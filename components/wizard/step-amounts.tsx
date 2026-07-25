"use client";

/** 第 2 步：金额、退租日期、扣款明细、押金存管核实。 */

import { useCaseSession } from "@/lib/case-session";
import { deductionTotal, parseAmount } from "@/lib/case-draft";
import type { PrefillableField } from "@/lib/case-draft";

import { BondLodgementFields } from "./bond-lodgement-fields";
import { DeductionList } from "./deduction-list";
import {
  AmountInput,
  Callout,
  DateInput,
  Field,
  SectionCard,
  TextArea,
  TextInput,
} from "./fields";

export function StepAmounts({
  justPrefilled,
}: {
  justPrefilled: PrefillableField[];
}) {
  const { draft, updateDraft, markTouched } = useCaseSession();

  const bond = parseAmount(draft.bondAmount);
  const claimed = parseAmount(draft.claimedAmount);
  const total = deductionTotal(draft.deductions);
  const filled = (field: PrefillableField) => justPrefilled.includes(field);

  const claimedOverBond = bond !== undefined && claimed !== undefined && claimed > bond;
  const totalMismatch =
    claimed !== undefined &&
    total !== undefined &&
    Math.abs(total - claimed) > 1;

  return (
    <div className="space-y-4">
      <SectionCard title="押金和被扣的钱">
        <div className="space-y-4">
          <Field
            label="押金总额"
            htmlFor="bond-amount"
            highlight={filled("bondAmount")}
          >
            <AmountInput
              id="bond-amount"
              value={draft.bondAmount}
              onChange={(value) => {
                markTouched("bondAmount");
                updateDraft({ bondAmount: value });
              }}
            />
          </Field>

          <Field
            label="对方说要扣掉多少"
            htmlFor="claimed-amount"
            hint="不确定就先留空，填完下面的明细会自动加总。"
            highlight={filled("claimedAmount")}
          >
            <AmountInput
              id="claimed-amount"
              value={draft.claimedAmount}
              onChange={(value) => {
                markTouched("claimedAmount");
                updateDraft({ claimedAmount: value });
              }}
            />
          </Field>

          <Field
            label="退租日期"
            htmlFor="move-out-date"
            highlight={filled("moveOutDate")}
          >
            <DateInput
              id="move-out-date"
              value={draft.moveOutDate}
              onChange={(value) => {
                markTouched("moveOutDate");
                updateDraft({ moveOutDate: value });
              }}
            />
          </Field>

          <Field
            label="房屋地址"
            htmlFor="property-address"
            hint="选填。写上后维权信里会直接带上，不用再改。"
            highlight={filled("propertyAddress")}
          >
            <TextInput
              id="property-address"
              value={draft.propertyAddress}
              placeholder="例如 12/34 Example St, Sydney NSW 2000"
              onChange={(event) => {
                markTouched("propertyAddress");
                updateDraft({ propertyAddress: event.target.value });
              }}
            />
          </Field>

          {claimedOverBond ? (
            <Callout tone="warn" title="被扣金额超过了押金总额">
              可能是打字打错了，也可能对方在押金之外另外索赔。两种情况都可以继续，
              分析时会一并说明。
            </Callout>
          ) : null}
        </div>
      </SectionCard>

      <SectionCard
        title="对方到底扣了哪几笔？"
        hint="逐项写清楚，胜算评估会一项一项给结论——哪笔能争、哪笔别争，分得开。"
      >
        <DeductionList highlight={filled("deductions")} />
        {totalMismatch ? (
          <p className="mt-3 text-xs leading-relaxed text-muted">
            明细合计 ${total?.toLocaleString("en-AU")} 和你填的被扣金额对不上。
            不影响继续，分析时会以明细为准逐项判断。
          </p>
        ) : null}
      </SectionCard>

      <BondLodgementFields />

      <SectionCard title="还有什么想补充的？" tone="quiet">
        <Field label="备注" htmlFor="case-notes" hint="选填。比如「入住时地毯就有污渍，我拍了照」。">
          <TextArea
            id="case-notes"
            className="min-h-24"
            value={draft.notes}
            placeholder="随便写，中英文都行"
            onChange={(event) => updateDraft({ notes: event.target.value })}
          />
        </Field>
      </SectionCard>
    </div>
  );
}
