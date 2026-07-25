"use client";

/**
 * 邮件留证话术（原先长在 `action-roadmap.tsx` 里）。
 *
 * 搬出来的理由是信息架构：它**不是一个步骤**，而是一件「要发出去的东西」——
 * 和申诉信同类。所以它跟着申诉信进第三幕「给房东发信」，行动路线只留真正的流程。
 *
 * 机构名仍旧从 `data/legal/` 的 `stateProcesses` 确定性取，不经过 LLM。
 */

import { useEffect, useRef, useState } from "react";

import { getConfirmedStateProcesses } from "@/data/legal";
import type { AUState } from "@/lib/types";

import { Chevron } from "./appeal-letter";
import { copyToClipboard, cx } from "./utils";

/** 三条留证纪律，压到一行三段 —— 原本每条都是整句，加起来比模板本身还长。 */
const TIPS = ["正文粘贴全文，别只发附件", "抄送自己一份", "电话后补一封邮件"];

export function buildEmailTemplate({
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

export interface EmailScriptProps {
  state: AUState;
  propertyAddress?: string;
  className?: string;
  id?: string;
}

export function EmailScript({
  state,
  propertyAddress,
  className,
  id,
}: EmailScriptProps) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const processes = getConfirmedStateProcesses(state);
  const tribunal =
    processes.find((item) => item.stage === "tribunal")?.agency ?? "仲裁机构";
  const consumerAgency =
    processes.find((item) => item.stage === "consumer-agency")?.agency ??
    "消费者事务机构";

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
    <section
      id={id}
      className={cx("border-l-[3px] border-l-line bg-card px-5 py-4 md:px-7", className)}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h3 className="text-section font-bold text-ink">邮件留证话术</h3>
        <span className="font-mono text-micro text-faint">{state} 通用</span>
      </div>

      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5">
        {TIPS.map((tip) => (
          <li
            key={tip}
            className="flex items-baseline gap-1.5 text-label text-ink"
          >
            <span aria-hidden="true" className="text-muted">
              ·
            </span>
            <span>{tip}</span>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleCopy}
          className="bg-ink px-5 py-2.5 text-label font-bold text-paper transition active:scale-[0.99]"
        >
          {copied ? "已复制" : "复制邮件模板"}
        </button>

        {/*
          模板正文默认折叠：它有 500 字，而这里真正的动作是「复制」——
          绝大多数人复制完就去邮箱里改，不需要在这一页通读一遍。
        */}
        <details className="group w-full">
          <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 text-label font-medium text-ink underline underline-offset-2 [&::-webkit-details-marker]:hidden">
            <span className="group-open:hidden">看模板正文</span>
            <span className="hidden group-open:inline">收起模板</span>
            <Chevron />
          </summary>
          <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap bg-paper px-4 py-3.5 font-mono text-caption leading-loose text-ink">
            {template}
          </pre>
        </details>
      </div>
    </section>
  );
}
