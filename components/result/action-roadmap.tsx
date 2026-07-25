/**
 * 第四幕 · 行动路线（03b §5）。
 *
 * **费用与时限一律从 `data/legal/` 的 `stateProcesses` 确定性渲染，不经过 LLM。**
 * 机构名、电话、来源链接同理 —— 这一段的可信度全靠「每句话都指得出出处」。
 *
 * 这一版的两处结构调整：
 * - **押金存管从「第 1 步」升为全幅前置横幅**。它不是流程里的一站，而是先要
 *   查清的事实；而且它是唯一高度可变的一块（红卡要展示计算依据），
 *   塞进等宽步骤列里会把整排撑歪。`verify-record` 出黄，
 *   `possible-non-lodgement` 及以上出红并**必须展示计算依据**。
 * - **三个机构横排**。它们是真正的升级序列（押金机构 → 消费者事务 → 仲裁），
 *   所以编号站得住脚；但原先三张卡竖着挤在 380px 右栏里，一张卡只有 310px 可用。
 * - 本组件**不再自带外层卡片**：外层卡里套步骤卡、步骤卡里再套细节卡，
 *   三层同构描边是密集感的主要来源。容器交给 `ResultView`。
 *
 * 任何等级都不得把 penalty units 写成租客自动获赔。
 */

import { getConfirmedStateProcesses } from "@/data/legal";
import type { ProcessStage, StateProcess } from "@/data/legal/types";
import { formatIsoDateZh } from "@/lib/dates";
import type { AUState, BondLodgementAlert, BondLodgementAlertLevel } from "@/lib/types";

import { cx } from "./utils";

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
  info: "border-line bg-card",
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
  className?: string;
  id?: string;
}

export function ActionRoadmap({
  state,
  bondAlert,
  processes,
  claimDueAt,
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

  /** 按阶段分组，空组不占位 —— 换州时条目数会变，阶段数不变。 */
  const groups = STAGE_ORDER.map((stage) => ({
    stage,
    items: ordered.filter((item) => item.stage === stage),
  })).filter((group) => group.items.length > 0);

  const alertMeta = ALERT_META[bondAlert.level];
  const needsBasis =
    bondAlert.level === "possible-non-lodgement" ||
    bondAlert.level === "authority-confirmed-missing";

  return (
    <section id={id} className={cx("flex flex-col gap-5", className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="text-title text-ink">行动路线 · {state}</h2>
        <span className="font-mono text-micro uppercase text-muted">
          费用与时限来自官方指引
        </span>
      </div>

      {claimDueAt ? (
        <p className="border-l-2 border-alert-risk bg-alert-risk/10 px-4 py-3 text-body leading-relaxed text-ink">
          <span className="font-semibold">先看期限：</span>
          你收到的押金 claim 通知截止 {formatIsoDateZh(claimDueAt)}
          。过了这个日期，押金可能按对方的 claim 直接支付。
        </p>
      ) : null}

      {/* 前置检查：先查存管，再谈流程 */}
      <div className={cx("rounded-2xl border p-4 md:p-5", TONE_CLASS[alertMeta.tone])}>
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h3 className="text-section text-ink">{alertMeta.titleZh}</h3>
          <span className="font-mono text-micro uppercase text-muted">
            开工前先查这个
          </span>
        </div>

        <p className="mt-2 text-body leading-relaxed text-ink">
          {bondAlert.reasoningZh}
        </p>

        <div className="mt-4 lg:grid lg:grid-cols-2 lg:items-start lg:gap-5">
          {bondAlert.deadlineBasis || bondAlert.calculatedDeadline ? (
            <div className="rounded-xl bg-card px-4 py-3">
              <p className="font-mono text-micro uppercase text-muted">
                计算依据
              </p>
              {bondAlert.calculatedDeadline ? (
                <p className="tnum mt-1.5 font-mono text-label text-ink">
                  估算存管期限 {formatIsoDateZh(bondAlert.calculatedDeadline)}
                </p>
              ) : null}
              {bondAlert.deadlineBasis ? (
                <p className="mt-1.5 text-label leading-relaxed text-muted">
                  {bondAlert.deadlineBasis}
                </p>
              ) : null}
            </div>
          ) : needsBasis ? (
            <p className="text-label leading-relaxed text-muted">
              这一级本应给出计算依据，但本次缺少可靠的付款日期。先去{bondAuthority}
              核对官方记录，再下判断。
            </p>
          ) : null}

          <div className="mt-3 flex flex-col gap-2 lg:mt-0">
            {/* 这一条是军规：penalty units 绝不可写成租客自动获赔，删不得，只压长度 */}
            {bondAlert.level !== "none" ? (
              <p className="text-label leading-relaxed text-muted">
                存管违规是机构对房东的处罚事由，
                <span className="font-semibold text-ink">不等于</span>
                你自动获赔；它的作用是谈判筹码。
              </p>
            ) : null}
            <p className="text-label leading-relaxed text-muted">
              抢先手：趁对方的单方 claim 还没变成默认结果，先去{bondAuthority}
              标记争议。
            </p>
          </div>
        </div>
      </div>

      {/*
        编号给的是**阶段**，不是条目：升级发生在阶段之间（押金机构 → 消费者事务 →
        仲裁），而一个阶段里可能有好几个入口（NSW 有 4 条、VIC 有 6 条）。
        按条目编号会让人以为要逐条走一遍，也会让「三栏」在换州后错位。
        所以这里固定按 STAGE_ORDER 分三组，空组跳过 —— 编号因此始终承载信息。
      */}
      <div>
        {/* 「谈不成才往下一级」这件事，编号 1→2→3 加上阶段名已经说清了，不必再写一句 */}
        <ol className="grid gap-4 lg:grid-cols-3">
          {groups.map((group, index) => (
            <li key={group.stage} className="flex flex-col gap-3">
              <div className="flex items-center gap-2.5">
                <span className="tnum flex size-7 shrink-0 items-center justify-center rounded-full bg-ink font-mono text-caption font-semibold text-white">
                  {index + 1}
                </span>
                <span className="font-mono text-micro uppercase text-muted">
                  {STAGE_LABEL[group.stage]}
                </span>
              </div>
              {group.items.map((process) => (
                <ProcessCard key={process.id} process={process} />
              ))}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function ProcessCard({ process }: { process: StateProcess }) {
  const meta = [
    process.feeZh ? { label: "费用", value: process.feeZh } : null,
    process.timeLimitZh ? { label: "时限", value: process.timeLimitZh } : null,
    process.phone ? { label: "电话", value: process.phone } : null,
  ].filter((item): item is { label: string; value: string } => Boolean(item));

  return (
    <div className="flex h-full w-full flex-col rounded-2xl border border-line bg-card p-4 md:p-5">
      <h3 className="text-section text-ink">{process.agency}</h3>
      <p className="mt-1.5 text-label leading-relaxed text-muted">
        {process.summaryZh}
      </p>

      {process.stepsZh.length > 0 ? (
        <ul className="mt-3 flex flex-col gap-1.5">
          {process.stepsZh.map((step) => (
            <li
              key={step}
              className="grid grid-cols-[0.75rem_1fr] gap-x-2 text-label leading-relaxed text-ink"
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
        <dl className="mt-3 grid grid-cols-[2.5rem_1fr] gap-x-3 gap-y-1.5 border-t border-line pt-3">
          {meta.map((item) => (
            <div key={item.label} className="contents">
              <dt className="pt-0.5 font-mono text-micro uppercase text-muted">
                {item.label}
              </dt>
              <dd className="text-label leading-relaxed text-ink">
                {item.value}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}

      {process.notes ? (
        <p className="mt-2.5 text-caption leading-relaxed text-muted">
          {process.notes}
        </p>
      ) : null}

      {/* 来源永远贴在卡底：这一段的可信度全靠指得出出处 */}
      <div className="mt-auto flex flex-wrap items-baseline gap-x-3 gap-y-1 pt-3">
        <a
          href={process.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="text-label font-semibold text-ink underline underline-offset-2"
        >
          官方页面 ↗
        </a>
        <span className="tnum font-mono text-micro uppercase text-muted">
          核对于 {process.checkedAt}
        </span>
      </div>
    </div>
  );
}
