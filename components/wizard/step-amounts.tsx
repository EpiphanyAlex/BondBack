"use client";

/** 金额、退租日期、扣款明细、押金存管核实。上传优先后由第 3 步（StepReview）承载。 */

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
    <div className="flex flex-col gap-8">
      {/* 一张网格排完五格，两列到底：
          必填的三格（押金 / 被扣 / 退租日期）在前，两个选填的跟在后面。
          原来分成两个 grid，第二个 grid 里三格填两列，押金号被剩在左下角，
          右边空出半格 —— 看着像漏了一个字段。 */}
      <SectionCard title="押金和被扣的钱">
        <div className="grid max-w-[620px] gap-x-6 gap-y-7 md:grid-cols-2">
          <Field
            label="押金总额"
            htmlFor="bond-amount"
            hint="租约开始时交出去的那一笔。"
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
            label="被扣总额"
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
            hint="交钥匙那天。所有时限都从它往后算。"
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
            label="押金号"
            htmlFor="bond-number"
            hint="选填。填了维权信抬头会直接引用，对方查起来快一步。"
            highlight={filled("bondNumber")}
          >
            <TextInput
              id="bond-number"
              value={draft.bondNumber}
              placeholder="例如 RB-2025-402917"
              onChange={(event) => {
                markTouched("bondNumber");
                updateDraft({ bondNumber: event.target.value });
              }}
            />
          </Field>

          {/* 地址整行：一行地址塞进半格必然被截断（见截图里的 Marrickville NSW…）*/}
          <div className="md:col-span-2">
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
          </div>
        </div>

        {claimedOverBond ? (
          <div className="mt-6 max-w-[620px]">
            <Callout tone="warn" title="被扣金额超过了押金总额">
              可能是打字打错了，也可能对方在押金之外另外索赔。两种情况都可以继续，
              分析时会一并说明。
            </Callout>
          </div>
        ) : null}
      </SectionCard>

      <SectionCard
        title="扣款明细 · 金额合计须等于被扣总额"
        hint="逐项写清楚，胜算评估会一项一项给结论——哪笔能争、哪笔别争，分得开。"
      >
        <DeductionList highlight={filled("deductions")} />
        {totalMismatch ? (
          <p className="mt-3.5 text-caption leading-relaxed text-muted">
            明细合计 ${total?.toLocaleString("en-AU")} 和你填的被扣金额对不上。
            不影响继续，分析时会以明细为准逐项判断。
          </p>
        ) : null}
      </SectionCard>

      <BondLodgementFields />

      <SectionCard title="还想补一句（可选）" tone="quiet">
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
