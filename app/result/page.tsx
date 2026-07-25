"use client";

/**
 * 结果页。三件套 UI 是模块 03 的活，这里先做两件属于 02 的事：
 * 1. 空会话保护 —— 直接访问或刷新时给可恢复提示，不白屏；
 * 2. 交接面 —— 展示向导交来的 `CaseInput` 和确定性算出的存管等级。
 */

import Link from "next/link";

import { Callout } from "@/components/wizard/fields";
import {
  evaluateBondLodgement,
  resolveClaimNoticeDeadline,
} from "@/lib/bond-lodgement";
import { useCaseSession } from "@/lib/case-session";
import { formatIsoDateZh } from "@/lib/dates";

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

export default function ResultPage() {
  const { caseInput } = useCaseSession();

  if (!caseInput) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-start gap-4 px-4 py-20">
        <p className="font-mono text-micro uppercase text-muted">
          没有可显示的案情
        </p>
        <h1 className="font-display text-title leading-tight font-extrabold text-ink">
          这里还是空的
        </h1>
        <p className="text-label leading-relaxed text-muted">
          为了不存你的资料，案情只留在这次会话里，刷新页面就清空了。
          回向导重填一遍，两分钟就好。
        </p>
        <Link
          href="/wizard"
          className="rounded-xl bg-ink px-5 py-3 text-body font-semibold text-white"
        >
          回去填写向导
        </Link>
      </div>
    );
  }

  const alert = evaluateBondLodgement(caseInput);
  const claimDeadline = resolveClaimNoticeDeadline(caseInput);

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <p className="font-mono text-micro uppercase text-muted">
        分析结果
      </p>
      <h1 className="mt-1.5 font-display text-title leading-tight font-extrabold text-ink">
        案情已收到
      </h1>

      <div className="mt-5 rounded-2xl border border-line bg-ink px-4 py-4 text-white">
        <p className="font-mono text-micro uppercase text-white/45">
          争取金额
        </p>
        <p className="tnum font-display text-hero leading-none font-extrabold text-amount-hero">
          <span className="text-section font-semibold">$</span>
          {caseInput.claimedAmount.toLocaleString("en-AU")}
        </p>
        <p className="tnum mt-1.5 font-mono text-micro text-white/45">
          {caseInput.state} · 押金 ${caseInput.bondAmount.toLocaleString("en-AU")} ·
          {caseInput.deductions.length} 项扣款 · {caseInput.evidence.length} 张证据
        </p>
      </div>

      <div className="mt-4 space-y-3">
        <Callout tone={ALERT_TONE[alert.level]} title={ALERT_TITLE[alert.level]}>
          <p>{alert.reasoningZh}</p>
          {alert.deadlineBasis ? (
            <p className="mt-2 font-mono text-caption leading-relaxed">
              {alert.deadlineBasis}
            </p>
          ) : null}
        </Callout>

        {claimDeadline ? (
          <Callout tone="risk" title="你收到了押金 claim 通知，先看期限">
            <p>{claimDeadline.noteZh}</p>
            {claimDeadline.dueAt ? (
              <p className="mt-1 font-mono text-caption">
                截止 {formatIsoDateZh(claimDeadline.dueAt)}
              </p>
            ) : null}
          </Callout>
        ) : null}
      </div>

      <div className="mt-5 rounded-2xl border border-dashed border-line px-4 py-5">
        <p className="text-label font-medium text-ink">
          胜算评估卡、英文维权信、行动路线图正在接入
        </p>
        <p className="mt-1 text-caption leading-relaxed text-muted">
          模块 03 会拿这份案情和你所在州的现行法条做逐项分析。向导这一段已经跑通。
        </p>
      </div>

      <Link
        href="/wizard"
        className="mt-5 block rounded-xl border border-line bg-card px-4 py-3 text-center text-label font-medium text-ink"
      >
        回去改答案
      </Link>
    </div>
  );
}
