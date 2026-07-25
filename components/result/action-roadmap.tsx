/**
 * 第四幕 · 行动路线（03b §5）。
 *
 * **费用与时限一律从 `data/legal/` 的 `stateProcesses` 确定性渲染，不经过 LLM。**
 * 机构名、电话、来源链接同理 —— 这一段的可信度全靠「每句话都指得出出处」。
 *
 * ## 为什么是竖向时间轴 + 分层展开
 *
 * 上一版是三栏并排，每栏里塞着机构名 + 一段说明 + 两条步骤 + 费用/电话/来源。
 * 两个问题叠在一起：**分栏把长句压成十来个字一行**（中文本来就不耐窄栏），
 * 而三栏又是同时全展开的，一屏下来是三堵等高的字墙。
 *
 * 所以改成一条竖轴：
 * - **竖着走本来就更对**。三级机构是「谈不成才往下一级」的升级序列，
 *   竖轴天然表达先后；横排三栏读起来像三个并列选项，反而要靠编号补说明。
 * - **一眼层与动手层分开**。轴上每站只留「机构名 + 一句话 + 电话/费用」，
 *   具体几步、注意事项收进「具体怎么做」里。行动路线是跨周执行的东西，
 *   现在扫一眼知道有几站、下周真去办时才需要那几步。
 * - 存管前置横幅同理：结论与那句「不等于你自动获赔」留在外面，
 *   长长的日期推算收进「计算依据」。
 *
 * 任何等级都不得把 penalty units 写成租客自动获赔 —— 那句话**不进折叠**。
 */

import { getConfirmedStateProcesses } from "@/data/legal";
import type { ProcessStage, StateProcess } from "@/data/legal/types";
import { formatIsoDateZh, parseIsoDate, todayIsoDate } from "@/lib/dates";
import type { AUState, BondLodgementAlert, BondLodgementAlertLevel } from "@/lib/types";

import { Chevron } from "./appeal-letter";
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

/** 什么时候轮到这一站 —— 比「1 / 2 / 3」更能说明它们是升级关系。 */
const STAGE_WHEN: Record<ProcessStage, string> = {
  "bond-authority": "现在",
  "consumer-agency": "谈不成",
  tribunal: "最后一步",
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

/** 三档预警一律走「左侧三像素色条 + 淡底」，与向导的 Callout 同一个形制 */
const TONE_CLASS = {
  info: "border-l-line bg-card",
  verify: "border-l-alert-verify bg-verdict-doubtful-wash",
  risk: "border-l-alert-risk bg-alert-risk/8",
} as const;

/** 距截止还有几天。算不出来（没日期 / 已过期）就不摆那个大数字。 */
function daysUntil(iso: string): number | null {
  const due = parseIsoDate(iso);
  const today = parseIsoDate(todayIsoDate());
  if (!due || !today) return null;
  const days = Math.round((due.getTime() - today.getTime()) / 86_400_000);
  return days >= 0 ? days : null;
}

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
  const hasBasis = Boolean(
    bondAlert.deadlineBasis || bondAlert.calculatedDeadline,
  );
  const needsBasis =
    bondAlert.level === "possible-non-lodgement" ||
    bondAlert.level === "authority-confirmed-missing";

  return (
    <section id={id} className={cx("flex flex-col gap-5", className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h2 className="h-shout text-title text-ink">行动路线 · {state}</h2>
        <span className="font-mono text-micro text-faint">
          费用与时限来自官方指引
        </span>
      </div>

      {/* 时限排在最前，而且用 Anton 把「还剩几天」放大 ——
          这一页所有内容里，只有它是会过期的 */}
      {claimDueAt ? (
        <div className="flex items-center gap-5 border-l-[3px] border-l-alert-risk bg-alert-risk/8 px-5 py-4">
          {daysUntil(claimDueAt) !== null ? (
            <p className="shrink-0 font-number text-title leading-none text-verdict-unlawful">
              {daysUntil(claimDueAt)} 天
            </p>
          ) : null}
          <p className="text-label text-ink">
            claim 通知截止{" "}
            <strong className="font-bold">{formatIsoDateZh(claimDueAt)}</strong>
            。过了这个日期，押金可能按对方的 claim 直接支付。
          </p>
        </div>
      ) : null}

      {/* 前置检查：先查存管，再谈流程 */}
      <div className={cx("border-l-[3px] px-5 py-4", TONE_CLASS[alertMeta.tone])}>
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
          <h3 className="h-shout text-section text-ink">{alertMeta.titleZh}</h3>
          <span className="font-mono text-micro text-faint">开工前先查这个</span>
        </div>

        <p className="mt-2.5 max-w-[68ch] text-label text-ink">
          {bondAlert.reasoningZh}
        </p>

        {/* 这一条是军规：penalty units 绝不可写成租客自动获赔。
            它必须留在外面 —— 折起来就等于没说 */}
        {bondAlert.level !== "none" ? (
          <p className="mt-2.5 max-w-[68ch] text-label text-muted">
            存管违规是机构对房东的处罚事由，
            <span className="font-bold text-ink">不等于</span>
            你自动获赔；它的作用是谈判筹码。
          </p>
        ) : null}

        {/* 日期推算是「要用的时候才看」的东西，收进来 */}
        {hasBasis || needsBasis ? (
          <details className="group mt-3.5 border-t border-ink/10 pt-3">
            <summary className="flex cursor-pointer list-none items-center gap-1.5 font-mono text-micro text-ink [&::-webkit-details-marker]:hidden">
              计算依据与下一步
              <Chevron />
            </summary>

            <div className="mt-3 flex flex-col gap-2.5">
              {bondAlert.calculatedDeadline ? (
                <p className="font-mono text-caption text-ink">
                  估算存管期限 {formatIsoDateZh(bondAlert.calculatedDeadline)}
                </p>
              ) : null}
              {bondAlert.deadlineBasis ? (
                <p className="max-w-[68ch] text-label text-muted">
                  {bondAlert.deadlineBasis}
                </p>
              ) : needsBasis ? (
                <p className="max-w-[68ch] text-label text-muted">
                  这一级本应给出计算依据，但本次缺少可靠的付款日期。先去
                  {bondAuthority}核对官方记录，再下判断。
                </p>
              ) : null}
              <p className="max-w-[68ch] text-label text-muted">
                抢先手：趁对方的单方 claim 还没变成默认结果，先去{bondAuthority}
                标记争议。
              </p>
            </div>
          </details>
        ) : null}
      </div>

      {/*
        竖轴。编号给的是**阶段**，不是条目：升级发生在阶段之间（押金机构 →
        消费者事务 → 仲裁），而一个阶段里可能有好几个入口（NSW 4 条、VIC 6 条）。
        按条目编号会让人以为要逐条走一遍。
      */}
      <ol className="mt-1 flex flex-col">
        {groups.map((group, index) => (
          <li key={group.stage} className="relative pl-7 md:pl-8">
            {/* 轴线：最后一站不画尾巴，否则线会悬空垂出来 */}
            {index < groups.length - 1 ? (
              <span
                aria-hidden="true"
                className="absolute top-4 bottom-0 left-[5px] w-px -translate-x-1/2 bg-line"
              />
            ) : null}
            <span
              aria-hidden="true"
              className={cx(
                "absolute top-1 left-0 size-2.5 rounded-full border-2",
                index === 0 ? "border-seal bg-seal" : "border-ink/35 bg-paper",
              )}
            />

            <p
              className={cx(
                "font-mono text-micro",
                index === 0 ? "text-verdict-unlawful" : "text-faint",
              )}
            >
              {STAGE_WHEN[group.stage]} · {STAGE_LABEL[group.stage]}
            </p>

            <div
              className={cx(
                "mt-3 flex flex-col gap-6",
                index < groups.length - 1 && "pb-9",
              )}
            >
              {group.items.map((process) => (
                <ProcessEntry key={process.id} process={process} />
              ))}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

/**
 * 轴上的一站。外面只留「机构名 + 一句话 + 电话/费用/时限」，
 * 具体步骤与注意事项收进折叠 —— 现在要的是「有几站」，不是「每站怎么办」。
 */
function ProcessEntry({ process }: { process: StateProcess }) {
  const meta = [
    process.phone ? { label: "电话", value: process.phone } : null,
    process.feeZh ? { label: "费用", value: process.feeZh } : null,
    process.timeLimitZh ? { label: "时限", value: process.timeLimitZh } : null,
  ].filter((item): item is { label: string; value: string } => Boolean(item));

  const hasDetail = process.stepsZh.length > 0 || Boolean(process.notes);

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-5 gap-y-1">
        <h3 className="text-section font-bold text-ink">{process.agency}</h3>
        <a
          href={process.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 font-mono text-micro text-ink underline underline-offset-4"
        >
          官方页面 ↗
        </a>
      </div>

      {/* 一句话就够：这一站是干什么的 */}
      <p className="mt-2 max-w-[68ch] text-label text-muted">
        {process.summaryZh}
      </p>

      {meta.length > 0 ? (
        <dl className="mt-3 flex flex-col gap-1.5">
          {meta.map((item) => (
            <div key={item.label} className="flex gap-3">
              <dt className="w-8 shrink-0 font-mono text-micro text-faint">
                {item.label}
              </dt>
              <dd className="max-w-[60ch] font-mono text-caption text-ink">
                {item.value}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}

      {hasDetail ? (
        <details className="group mt-3">
          <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 font-mono text-micro text-ink underline underline-offset-4 [&::-webkit-details-marker]:hidden">
            具体怎么做
            {process.stepsZh.length > 0 ? ` · ${process.stepsZh.length} 步` : null}
            <Chevron />
          </summary>

          {process.stepsZh.length > 0 ? (
            <ol className="mt-3 flex flex-col gap-2">
              {process.stepsZh.map((step, index) => (
                <li
                  key={step}
                  className="grid max-w-[68ch] grid-cols-[1.5rem_1fr] gap-x-2 text-label text-ink"
                >
                  <span className="font-mono text-caption text-faint">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          ) : null}

          {process.notes ? (
            <p className="mt-3 max-w-[68ch] text-caption text-muted">
              {process.notes}
            </p>
          ) : null}

          <p className="mt-3 font-mono text-micro text-faint">
            核对于 {process.checkedAt}
          </p>
        </details>
      ) : (
        <p className="mt-3 font-mono text-micro text-faint">
          核对于 {process.checkedAt}
        </p>
      )}
    </div>
  );
}
