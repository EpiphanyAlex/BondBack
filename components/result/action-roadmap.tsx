"use client";

/**
 * 行动路线图（03b §5）。
 *
 * **费用与时限一律从 `data/legal/` 的 `stateProcesses` 确定性渲染，不经过 LLM。**
 * 机构名、电话、来源链接同理 —— 这一段的可信度全靠「每句话都指得出出处」。
 *
 * 存管卡是第 1 步：`verify-record` 出黄卡，`possible-non-lodgement` 及以上出红卡
 * 并**必须展示计算依据**（日期 + 适用期限 + 来源）。任何等级都不得把 penalty units
 * 写成租客自动获赔。
 */

import { useEffect, useRef, useState } from "react";

import { getConfirmedStateProcesses } from "@/data/legal";
import type { ProcessStage, StateProcess } from "@/data/legal/types";
import { formatIsoDateZh } from "@/lib/dates";
import type { AUState, BondLodgementAlert, BondLodgementAlertLevel } from "@/lib/types";

import { copyToClipboard, cx } from "./utils";

const STAGE_ORDER: ProcessStage[] = [
  "bond-authority",
  "consumer-agency",
  "tribunal",
];

const STAGE_LABEL: Record<ProcessStage, string> = {
  "bond-authority": "押金机构",
  "consumer-agency": "消费者事务机构",
  tribunal: "仲裁机构",
};

const ALERT_META: Record<
  BondLodgementAlertLevel,
  { titleZh: string; tone: "info" | "verify" | "risk" }
> = {
  none: { titleZh: "押金存管：目前没有疑点", tone: "info" },
  "verify-record": { titleZh: "先去查官方押金记录", tone: "verify" },
  "possible-non-lodgement": { titleZh: "押金可能未按期存管", tone: "risk" },
  "authority-confirmed-missing": {
    titleZh: "机构已书面确认查无记录",
    tone: "risk",
  },
};

const TONE_CLASS = {
  info: "border-line bg-paper",
  verify: "border-alert-verify/40 bg-verdict-doubtful-wash",
  risk: "border-alert-risk/35 bg-alert-risk/10",
} as const;

export interface ActionRoadmapProps {
  state: AUState;
  bondAlert: BondLodgementAlert;
  /** 缺省从 `data/legal` 取当前有效且已核实的条目 */
  processes?: StateProcess[];
  /** 押金 claim 通知的截止日（YYYY-MM-DD） */
  claimDueAt?: string;
  propertyAddress?: string;
  className?: string;
  id?: string;
}

export function ActionRoadmap({
  state,
  bondAlert,
  processes,
  claimDueAt,
  propertyAddress,
  className,
  id,
}: ActionRoadmapProps) {
  const list = processes ?? getConfirmedStateProcesses(state);
  const ordered = [...list].sort(
    (a, b) => STAGE_ORDER.indexOf(a.stage) - STAGE_ORDER.indexOf(b.stage),
  );

  const bondAuthority =
    ordered.find((item) => item.stage === "bond-authority")?.agency ??
    "押金存管机构";
  const tribunal =
    ordered.find((item) => item.stage === "tribunal")?.agency ?? "仲裁机构";
  const consumerAgency =
    ordered.find((item) => item.stage === "consumer-agency")?.agency ??
    "消费者事务机构";

  const alertMeta = ALERT_META[bondAlert.level];
  const needsBasis =
    bondAlert.level === "possible-non-lodgement" ||
    bondAlert.level === "authority-confirmed-missing";

  return (
    <section
      id={id}
      className={cx("rounded-2xl border border-line bg-card p-4 md:p-5", className)}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 className="text-section text-ink">行动路线（{state}）</h2>
        <span className="font-mono text-micro uppercase text-muted">
          费用与时限来自官方指引
        </span>
      </div>
      <p className="mt-1 text-caption leading-relaxed text-muted">
        下面每一步的机构、费用、时限与链接都来自结构化的官方资料，不是 AI
        写出来的。费用会调整，提交前按链接复核一次。
      </p>

      {claimDueAt ? (
        <p className="mt-3 rounded-xl border border-alert-risk/35 bg-alert-risk/10 px-3.5 py-2.5 text-label leading-relaxed text-ink">
          <span className="font-semibold">先看期限：</span>
          你收到的押金 claim 通知截止 {formatIsoDateZh(claimDueAt)}
          。过了这个日期，押金可能按对方的 claim 直接支付。
        </p>
      ) : null}

      <ol className="mt-3 flex flex-col gap-3">
        {/* 第 1 步永远是存管 */}
        <Step index={1} stageLabel="押金存管">
          <div className={cx("rounded-xl border px-3.5 py-3", TONE_CLASS[alertMeta.tone])}>
            <p className="text-label font-semibold text-ink">
              {alertMeta.titleZh}
            </p>
            <p className="mt-1 text-caption leading-relaxed text-muted">
              {bondAlert.reasoningZh}
            </p>

            {bondAlert.deadlineBasis || bondAlert.calculatedDeadline ? (
              <div className="mt-2 rounded-lg border border-line bg-card px-3 py-2">
                <p className="font-mono text-micro uppercase text-muted">
                  计算依据
                </p>
                {bondAlert.calculatedDeadline ? (
                  <p className="tnum mt-1 font-mono text-caption text-ink">
                    估算存管期限 {formatIsoDateZh(bondAlert.calculatedDeadline)}
                  </p>
                ) : null}
                {bondAlert.deadlineBasis ? (
                  <p className="mt-1 text-caption leading-relaxed text-muted">
                    {bondAlert.deadlineBasis}
                  </p>
                ) : null}
              </div>
            ) : needsBasis ? (
              <p className="mt-2 text-caption leading-relaxed text-muted">
                这一级本应给出计算依据，但本次缺少可靠的付款日期。先去{bondAuthority}
                核对官方记录，再下判断。
              </p>
            ) : null}

            {bondAlert.level !== "none" ? (
              <p className="mt-2 text-caption leading-relaxed text-muted">
                注意：存管违规是机构对房东的处罚事由，
                <span className="font-semibold text-ink">不等于</span>
                你自动获得赔偿。它的作用是给你在协商和裁决里的筹码。
              </p>
            ) : null}
          </div>

          <p className="mt-2 text-caption leading-relaxed text-muted">
            先手很重要：在对方的单方 claim 变成默认结果之前，先到{bondAuthority}
            发起退款申请或把争议标记上。
          </p>
        </Step>

        {ordered.map((process, index) => (
          <Step
            key={process.id}
            index={index + 2}
            stageLabel={STAGE_LABEL[process.stage]}
          >
            <ProcessCard process={process} />
          </Step>
        ))}
      </ol>

      <EmailTemplate
        state={state}
        tribunal={tribunal}
        consumerAgency={consumerAgency}
        propertyAddress={propertyAddress}
      />
    </section>
  );
}

/* ── 步骤外壳 ─────────────────────────────────────────────────────────── */

function Step({
  index,
  stageLabel,
  children,
}: {
  index: number;
  stageLabel: string;
  children: React.ReactNode;
}) {
  return (
    <li className="grid grid-cols-[1.75rem_1fr] gap-x-3">
      <span className="tnum mt-0.5 flex h-7 w-7 items-center justify-center rounded-full border border-line bg-paper font-mono text-caption font-semibold text-ink">
        {index}
      </span>
      <div className="min-w-0">
        <p className="font-mono text-micro uppercase text-muted">{stageLabel}</p>
        <div className="mt-1.5">{children}</div>
      </div>
    </li>
  );
}

function ProcessCard({ process }: { process: StateProcess }) {
  const meta = [
    process.feeZh ? { label: "费用", value: process.feeZh } : null,
    process.timeLimitZh ? { label: "时限", value: process.timeLimitZh } : null,
    process.phone ? { label: "电话", value: process.phone } : null,
  ].filter((item): item is { label: string; value: string } => Boolean(item));

  return (
    <div className="rounded-xl border border-line px-3.5 py-3">
      <p className="text-label font-semibold text-ink">{process.agency}</p>
      <p className="mt-1 text-caption leading-relaxed text-muted">
        {process.summaryZh}
      </p>

      {process.stepsZh.length > 0 ? (
        <ul className="mt-2 flex flex-col gap-1">
          {process.stepsZh.map((step) => (
            <li
              key={step}
              className="grid grid-cols-[0.75rem_1fr] gap-x-1.5 text-caption leading-relaxed text-ink"
            >
              <span aria-hidden="true" className="text-muted">
                ·
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {meta.length > 0 ? (
        <dl className="mt-2 grid grid-cols-[2.5rem_1fr] gap-x-2 gap-y-1 border-t border-line pt-2">
          {meta.map((item) => (
            <div key={item.label} className="contents">
              <dt className="font-mono text-micro uppercase text-muted">
                {item.label}
              </dt>
              <dd className="text-caption leading-relaxed text-ink">
                {item.value}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}

      {process.notes ? (
        <p className="mt-2 text-caption leading-relaxed text-muted">
          {process.notes}
        </p>
      ) : null}

      <a
        href={process.sourceUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-2 inline-block text-caption font-medium text-ink underline underline-offset-2"
      >
        官方页面 ↗
      </a>
      <span className="tnum ml-2 font-mono text-micro uppercase text-muted">
        核对于 {process.checkedAt}
      </span>
    </div>
  );
}

/* ── 邮件留证话术模板 ─────────────────────────────────────────────────── */

function buildEmailTemplate({
  tribunal,
  consumerAgency,
  propertyAddress,
}: {
  tribunal: string;
  consumerAgency: string;
  propertyAddress?: string;
}): string {
  const address = propertyAddress ?? "[property address]";
  return [
    `Subject: Rental bond - disputed claim - ${address}`,
    "",
    "Dear [agent / landlord],",
    "",
    "I refer to my letter of [date] regarding your claim against my rental bond. I attach it again below for your records.",
    "",
    "Please confirm receipt of this email in writing.",
    "",
    "Please also provide, for each amount claimed, a copy of the final condition report and the estimates, quotations, invoices or receipts you rely on.",
    "",
    `If I do not receive a written reply within 14 days, I will apply to ${tribunal} and advise ${consumerAgency} that the claim is disputed.`,
    "",
    "Kind regards,",
    "[your name] / [phone]",
  ].join("\n");
}

function EmailTemplate({
  state,
  tribunal,
  consumerAgency,
  propertyAddress,
}: {
  state: AUState;
  tribunal: string;
  consumerAgency: string;
  propertyAddress?: string;
}) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const template = buildEmailTemplate({
    tribunal,
    consumerAgency,
    propertyAddress,
  });

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  const handleCopy = async () => {
    const ok = await copyToClipboard(template);
    setCopied(ok);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="mt-4 rounded-xl border border-line bg-paper px-3.5 py-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h3 className="text-label font-semibold text-ink">邮件留证话术</h3>
        <span className="font-mono text-micro uppercase text-muted">
          {state} 通用
        </span>
      </div>
      <ul className="mt-2 flex flex-col gap-1 text-caption leading-relaxed text-muted">
        <li>· 用邮件发，正文直接粘贴申诉信全文，不要只发附件。</li>
        <li>· 抄送一份给自己，保留发送时间与对方回复。</li>
        <li>· 电话沟通后补一封邮件复述要点，口头承诺才留得下痕迹。</li>
      </ul>

      <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap rounded-lg border border-line bg-card px-3 py-2 font-mono text-caption leading-relaxed text-ink">
        {template}
      </pre>

      <button
        type="button"
        onClick={handleCopy}
        className="mt-2 rounded-lg border border-line bg-card px-3 py-2 text-caption font-medium text-ink transition-colors duration-150 hover:bg-paper"
      >
        {copied ? "已复制" : "复制邮件模板"}
      </button>
    </div>
  );
}
