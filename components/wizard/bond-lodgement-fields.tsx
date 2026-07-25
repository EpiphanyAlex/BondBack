"use client";

/**
 * 押金存管核实 —— 按答案渐进展开（母文档 §3.2）。
 *
 * 这里只负责把事实问清楚。等级判断走 `evaluateBondLodgement` 的确定性规则，
 * 页面上的提示与 03 的提示同源，不会各说各话。
 */

import { useMemo } from "react";

import { evaluateBondLodgement } from "@/lib/bond-lodgement";
import { useCaseSession } from "@/lib/case-session";
import { toCaseInput } from "@/lib/case-draft";
import type {
  BondLookupEvidence,
  BondLookupStatus,
  BondPaymentRecipient,
  ClaimNoticeDeliveryMethod,
  TriState,
} from "@/lib/types";

import {
  Callout,
  ChoiceGroup,
  DateInput,
  Field,
  SectionCard,
  type Choice,
} from "./fields";

const PAID_TO_CHOICES: Choice<BondPaymentRecipient>[] = [
  {
    value: "bond-authority",
    label: "直接付给官方押金机构",
    hint: "NSW 的 Rental Bonds Online 或 VIC 的 RTBA",
  },
  { value: "agent", label: "付给中介" },
  { value: "landlord", label: "付给房东本人" },
  { value: "other", label: "付给其他人" },
  { value: "unsure", label: "记不清了" },
];

const TRI_STATE_CHOICES: Choice<TriState>[] = [
  { value: "yes", label: "是" },
  { value: "no", label: "没有" },
  { value: "unsure", label: "不确定" },
];

const LOOKUP_CHOICES: Choice<BondLookupStatus>[] = [
  { value: "found", label: "查到了记录" },
  { value: "not-found", label: "查不到记录" },
  { value: "not-checked", label: "还没查过" },
  { value: "unsure", label: "不确定查的对不对" },
];

const LOOKUP_EVIDENCE_CHOICES: Choice<BondLookupEvidence>[] = [
  { value: "authority-written", label: "有机构书面回复说查无记录" },
  { value: "portal", label: "只是我自己在官网查不到" },
  { value: "none", label: "说不清" },
];

const DELIVERY_CHOICES: Choice<ClaimNoticeDeliveryMethod>[] = [
  { value: "email", label: "邮件" },
  { value: "post", label: "纸质信件" },
  { value: "sms", label: "短信" },
  { value: "other", label: "其他" },
  { value: "unsure", label: "不确定" },
];

const ALERT_TONE = {
  none: "info",
  "verify-record": "warn",
  "possible-non-lodgement": "risk",
  "authority-confirmed-missing": "risk",
} as const;

const ALERT_TITLE = {
  none: "存管这一项目前没有疑点",
  "verify-record": "先去核对官方记录",
  "possible-non-lodgement": "可能存在未按期存管",
  "authority-confirmed-missing": "高风险：机构书面确认查无记录",
} as const;

export function BondLodgementFields() {
  const { draft, updateDraft } = useCaseSession();
  const payment = draft.bondPayment;

  const patchPayment = (changes: Partial<typeof payment>) => {
    updateDraft((current) => ({
      bondPayment: { ...current.bondPayment, ...changes },
    }));
  };

  const authorityName =
    draft.state === "NSW" ? "Rental Bonds Online" : "RTBA";
  const paidToAuthority = payment.paidTo === "bond-authority";

  const alert = useMemo(
    () => evaluateBondLodgement(toCaseInput(draft)),
    [draft],
  );

  const setInstalmentDate = (index: number, value: string) => {
    updateDraft((current) => {
      const dates = [...current.bondPayment.instalmentDates];
      dates[index] = value;
      return {
        bondPayment: { ...current.bondPayment, instalmentDates: dates },
      };
    });
  };

  const addInstalmentDate = () => {
    updateDraft((current) => ({
      bondPayment: {
        ...current.bondPayment,
        instalmentDates: [...current.bondPayment.instalmentDates, ""],
      },
    }));
  };

  const removeInstalmentDate = (index: number) => {
    updateDraft((current) => ({
      bondPayment: {
        ...current.bondPayment,
        instalmentDates: current.bondPayment.instalmentDates.filter(
          (_, itemIndex) => itemIndex !== index,
        ),
      },
    }));
  };

  return (
    <SectionCard
      title="押金存管核实"
      hint={`押金本来应该躺在 ${authorityName} 的账户里。下面几个问题决定了能不能算出法定存管期限——记不清就选「不确定」，不会因此下错结论。`}
    >
      <div className="space-y-4">
        <Field label="押金当初付给了谁？">
          <ChoiceGroup
            ariaLabel="押金付给谁"
            choices={PAID_TO_CHOICES}
            value={payment.paidTo}
            onChange={(value) => patchPayment({ paidTo: value })}
          />
        </Field>

        {paidToAuthority ? (
          <Callout tone="info" title={`你是直接付给 ${authorityName} 的`}>
            这种情况下不存在「房东或中介收了钱不转交」的问题，后面只需要确认记录还在。
          </Callout>
        ) : null}

        <Field label="押金支付日期" hint="记不清具体哪天就填最接近的日期。">
          <DateInput
            value={payment.paidAt}
            onChange={(value) => patchPayment({ paidAt: value })}
          />
        </Field>

        <Field
          label="押金是分几次付清的吗？"
          hint={
            draft.state === "NSW"
              ? "NSW 分期付款的存管期限算法和一次性付清完全不同，这一项必须问。"
              : "分期付款时，存管期限从最后一期算起。"
          }
        >
          <ChoiceGroup
            ariaLabel="是否分期支付"
            columns={2}
            choices={TRI_STATE_CHOICES}
            value={payment.paidByInstalments}
            onChange={(value) => patchPayment({ paidByInstalments: value })}
          />
        </Field>

        {payment.paidByInstalments === "yes" ? (
          <div className="rounded-xl border border-line bg-paper p-3">
            <p className="text-label font-medium text-ink">后面几期分别是哪天付的？</p>
            <p className="mt-1 text-caption leading-relaxed text-muted">
              上面填的是首期日期。把能想起来的分期日期都加上，最后一项就是付清日；
              少了这些日期就算不出期限，只能给核实提示。
            </p>
            <div className="mt-3 space-y-2">
              {payment.instalmentDates.map((date, index) => (
                <div key={index} className="flex items-center gap-2">
                  <DateInput
                    value={date}
                    onChange={(value) => setInstalmentDate(index, value)}
                  />
                  <button
                    type="button"
                    onClick={() => removeInstalmentDate(index)}
                    className="shrink-0 rounded-lg px-2 py-1 text-caption text-muted"
                  >
                    删除
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addInstalmentDate}
                className="rounded-xl border border-line bg-card px-3.5 py-2 text-label font-medium text-ink active:scale-[0.98]"
              >
                + 加一期
              </button>
            </div>
          </div>
        ) : null}

        <Field
          label={`有没有收到 ${authorityName} 的确认？`}
          hint="没收到不代表押金一定没存管——邮件可能进了垃圾箱或发到旧邮箱。"
        >
          <ChoiceGroup
            ariaLabel="是否收到官方确认"
            columns={2}
            choices={TRI_STATE_CHOICES}
            value={payment.confirmationReceived}
            onChange={(value) => patchPayment({ confirmationReceived: value })}
          />
        </Field>

        <Field label={`你去 ${authorityName} 查过押金记录吗？`}>
          <ChoiceGroup
            ariaLabel="官方记录查询结果"
            choices={LOOKUP_CHOICES}
            value={payment.lookup.status}
            onChange={(value) =>
              patchPayment({ lookup: { ...payment.lookup, status: value } })
            }
          />
        </Field>

        {payment.lookup.status === "not-found" ? (
          <Field label="这个「查不到」是怎么得到的？">
            <ChoiceGroup
              ariaLabel="查不到记录的依据"
              choices={LOOKUP_EVIDENCE_CHOICES}
              value={payment.lookup.evidence}
              onChange={(value) =>
                patchPayment({ lookup: { ...payment.lookup, evidence: value } })
              }
            />
          </Field>
        ) : null}

        <ClaimNoticeFields />

        <Callout tone={ALERT_TONE[alert.level]} title={ALERT_TITLE[alert.level]}>
          <p>{alert.reasoningZh}</p>
          {alert.deadlineBasis ? (
            <p className="mt-2 font-mono text-caption leading-relaxed">
              {alert.deadlineBasis}
            </p>
          ) : null}
        </Callout>
      </div>
    </SectionCard>
  );
}

function ClaimNoticeFields() {
  const { draft, updateDraft } = useCaseSession();
  const notice = draft.claimNotice;

  const patchNotice = (changes: Partial<typeof notice>) => {
    updateDraft((current) => ({
      claimNotice: { ...current.claimNotice, ...changes },
    }));
  };

  return (
    <div className="rounded-xl border border-line bg-paper p-3">
      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          className="mt-0.5 size-5 shrink-0 accent-[var(--ink)]"
          checked={draft.hasClaimNotice}
          onChange={(event) =>
            updateDraft({ hasClaimNotice: event.target.checked })
          }
        />
        <span>
          <span className="block text-label font-medium text-ink">
            我收到了押金 claim 通知
          </span>
          <span className="mt-0.5 block text-caption leading-relaxed text-muted">
            房东或中介单方申请扣押金时，机构会发通知给你。通知上的期限通常很短，
            错过就可能直接按对方的申请付款。
          </span>
        </span>
      </label>

      {draft.hasClaimNotice ? (
        <div className="mt-3 space-y-3">
          <Field label="收到通知的日期">
            <DateInput
              value={notice.receivedAt}
              onChange={(value) => patchNotice({ receivedAt: value })}
            />
          </Field>
          <Field
            label="通知上写的截止日期"
            hint="以通知原件为准。填了这个日期，后面的行动路线图就按它来排。"
          >
            <DateInput
              value={notice.dueAt}
              onChange={(value) => patchNotice({ dueAt: value })}
            />
          </Field>
          <Field label="通知是怎么送到你手上的？">
            <ChoiceGroup
              ariaLabel="通知送达方式"
              columns={2}
              choices={DELIVERY_CHOICES}
              value={notice.deliveryMethod}
              onChange={(value) => patchNotice({ deliveryMethod: value })}
            />
          </Field>
        </div>
      ) : null}
    </div>
  );
}
