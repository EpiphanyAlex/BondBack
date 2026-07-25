"use client";

/** 扣款明细：逐项「描述 + 金额」，胜算评估卡按此逐项出结论。 */

import { useCaseSession } from "@/lib/case-session";
import {
  createDeductionDraft,
  deductionTotal,
  type DeductionDraft,
} from "@/lib/case-draft";

import { AmountInput, TextInput } from "./fields";

export function DeductionList({ highlight = false }: { highlight?: boolean }) {
  const { draft, updateDraft, markTouched } = useCaseSession();
  const total = deductionTotal(draft.deductions);

  const patch = (id: string, changes: Partial<DeductionDraft>) => {
    markTouched("deductions");
    updateDraft((current) => ({
      deductions: current.deductions.map((item) =>
        item.id === id ? { ...item, ...changes } : item,
      ),
    }));
  };

  const addRow = () => {
    markTouched("deductions");
    updateDraft((current) => ({
      deductions: [...current.deductions, createDeductionDraft()],
    }));
  };

  const removeRow = (id: string) => {
    markTouched("deductions");
    updateDraft((current) => {
      const next = current.deductions.filter((item) => item.id !== id);
      return { deductions: next.length > 0 ? next : [createDeductionDraft()] };
    });
  };

  return (
    <div className={highlight ? "prefilled " : ""}>
      <ul className="space-y-2.5">
        {draft.deductions.map((item, index) => (
          <li key={item.id} className="border border-line bg-card p-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-micro text-muted">
                {String(index + 1).padStart(2, "0")}
              </span>
              {draft.deductions.length > 1 ? (
                <button
                  type="button"
                  onClick={() => removeRow(item.id)}
                  className="px-2 py-1 text-caption text-muted"
                >
                  删除
                </button>
              ) : null}
            </div>
            <div className="mt-1.5 space-y-2">
              <TextInput
                value={item.description}
                placeholder="扣款项目，例如 professional cleaning"
                aria-label={`第 ${index + 1} 项扣款描述`}
                onChange={(event) =>
                  patch(item.id, { description: event.target.value })
                }
              />
              <AmountInput
                value={item.amount}
                onChange={(value) => patch(item.id, { amount: value })}
              />
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex items-center justify-between">
        <button
          type="button"
          onClick={addRow}
          className="border border-line bg-card px-3.5 py-2 text-label font-medium text-ink active:scale-[0.98]"
        >
          + 再加一项
        </button>
        {total !== undefined ? (
          <p className="tnum font-mono text-label text-muted">
            合计 ${total.toLocaleString("en-AU")}
          </p>
        ) : null}
      </div>
    </div>
  );
}
