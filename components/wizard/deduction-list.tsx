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
      {/* 一行一笔：序号与「删除」压在行首那条细线上，描述与金额并排。
          原来每一笔外面还套一个白卡，卡里又是两个描边输入框 —— 盒中盒，
          一笔占掉大半屏，看着又挤又空。行与行之间只用一条发丝线分。 */}
      <ul className="flex flex-col">
        {draft.deductions.map((item, index) => (
          <li
            key={item.id}
            className="border-t border-line pt-3 pb-5 first:border-t-0 first:pt-0"
          >
            <div className="flex items-center justify-between gap-4">
              <span className="font-mono text-micro text-faint">
                第 {String(index + 1).padStart(2, "0")} 笔
              </span>
              {draft.deductions.length > 1 ? (
                <button
                  type="button"
                  onClick={() => removeRow(item.id)}
                  className="-mr-1 px-2 py-1 text-caption text-muted transition-colors duration-150 hover:text-verdict-unlawful"
                >
                  删除
                </button>
              ) : null}
            </div>
            <div className="mt-2 grid gap-3 md:grid-cols-[minmax(0,1fr)_12.5rem]">
              <TextInput
                value={item.description}
                placeholder="扣款项目，例如 professional cleaning"
                aria-label={`第 ${index + 1} 项扣款描述`}
                onChange={(event) =>
                  patch(item.id, { description: event.target.value })
                }
              />
              <AmountInput
                ariaLabel={`第 ${index + 1} 项扣款金额`}
                value={item.amount}
                onChange={(value) => patch(item.id, { amount: value })}
              />
            </div>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t-2 border-ink pt-3.5">
        <button
          type="button"
          onClick={addRow}
          className="border border-line bg-card px-3.5 py-2 text-label font-medium text-ink transition-colors duration-150 hover:border-ink active:scale-[0.98]"
        >
          + 再加一项
        </button>
        {total !== undefined ? (
          <p className="tnum text-label text-muted">
            合计{" "}
            <span className="font-number text-num-sm align-middle text-amount">
              ${total.toLocaleString("en-AU")}
            </span>
          </p>
        ) : null}
      </div>
    </div>
  );
}
