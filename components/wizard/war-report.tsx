"use client";

/**
 * 战报栏 —— 本产品的记忆点，也是这一版向导最大的结构改动。
 *
 * 上一版桌面是「一根 720px 窄栏 + 两侧空白」，账本条只在手机底部。
 * 稿子（§02）把它升级成桌面的**第三栏**：常驻墨黑，同时承担金额、已读材料
 * 与主行动。它把「填表」变成「有人在替我算账」—— 每填一个字段，右边的数就动一下。
 *
 * 手机上没有第三栏可用，同一份内容压成底部 88px 的一条（`LedgerBar`），
 * 只留一个金额 + 一个行动：正文不能被两层信息挤压。
 *
 * 两个组件都自己从会话里读数据（它们本来就只显示草稿的派生量），
 * 调用方只需要告诉它「这一步的主行动叫什么、按下去做什么」。
 */

import type { ReactNode } from "react";

import { EVIDENCE_KIND_LABEL } from "@/components/evidence/evidence-thumb";
import { money } from "@/components/result/utils";
import { deductionTotal, parseAmount } from "@/lib/case-draft";
import { useCaseSession } from "@/lib/case-session";
import { formatIsoDateZh, parseIsoDate, todayIsoDate } from "@/lib/dates";
import type { DisputeType } from "@/lib/types";

const DISPUTE_SHORT: Record<DisputeType, string> = {
  cleaning: "清洁",
  damage: "损坏",
  "early-termination": "提前解约",
  bond: "押金存管",
  "rent-arrears": "欠租",
  other: "其他",
};

/** 每一步底下那句小字：说清楚按下主行动之后会发生什么。 */
const FOOTNOTE: string[] = [
  "无需注册 · 资料只在本次会话内 · 刷新即清空",
  "没有材料也能继续 · 那时会逐笔要房东举证",
  "两段真实调用，通常十几秒",
];

/** 草稿里能拿到的派生量，战报栏与手机底栏共用一份。 */
function useWarNumbers() {
  const { draft } = useCaseSession();

  const bond = parseAmount(draft.bondAmount);
  const claimed =
    parseAmount(draft.claimedAmount) ?? deductionTotal(draft.deductions);
  const filledDeductions = draft.deductions.filter(
    (item) => item.description.trim() || item.amount.trim(),
  );

  const dueAt = draft.claimNotice.dueAt;
  const due = dueAt ? parseIsoDate(dueAt) : null;
  const today = parseIsoDate(todayIsoDate());
  const daysLeft =
    due && today
      ? Math.round((due.getTime() - today.getTime()) / 86_400_000)
      : null;

  return { draft, bond, claimed, filledDeductions, dueAt, daysLeft };
}

export function WarReport({
  stepIndex,
  primaryLabel,
  onPrimary,
  blocker,
}: {
  stepIndex: number;
  primaryLabel: string;
  onPrimary: () => void;
  /** 「还差什么」的提示；有就压在主行动上面 */
  blocker?: ReactNode;
}) {
  const { draft, bond, claimed, filledDeductions, dueAt, daysLeft } =
    useWarNumbers();
  const hasClaimed = claimed !== undefined && claimed > 0;

  return (
    <aside className="hidden bg-ink text-paper lg:flex lg:flex-col">
      <div className="sticky top-[68px] flex max-h-[calc(100dvh-68px)] flex-col overflow-y-auto px-8 py-11">
        <p className="font-mono text-micro text-amount-hero">战报 · 实时</p>

        <p className="mt-5 font-mono text-micro text-paper/45">你要争的钱</p>
        <p
          className={`font-number text-num-lg leading-none ${
            hasClaimed ? "text-amount-hero" : "text-amount-hero/35"
          }`}
        >
          {hasClaimed ? money(claimed) : "$0"}
        </p>
        {hasClaimed ? (
          <p className="mt-2.5 font-mono text-caption text-paper/50">
            押金 {money(bond)} · 被扣 {money(claimed)}
          </p>
        ) : (
          <p className="mt-3.5 text-label text-paper/50">
            下一步传上扣款清单，这里会实时算出你在争的钱。
          </p>
        )}

        {/* ── 第一步：已知 ── */}
        {stepIndex === 0 ? (
          <Block label="已知">
            <ul className="flex flex-col gap-2.5">
              <Row label="州" value={draft.state} />
              <Row
                label="纠纷"
                value={
                  draft.disputeTypes.length > 0
                    ? draft.disputeTypes
                        .map((type) => DISPUTE_SHORT[type])
                        .join(" · ")
                    : "还没选"
                }
              />
              <Row
                label="退租"
                value={draft.moveOutDate || "还没填"}
                mono={Boolean(draft.moveOutDate)}
              />
            </ul>
          </Block>
        ) : null}

        {/* ── 第二步：已经读进来的材料 ──
            稿子这里写的是「已读到的事实」。事实要等结果页那两段真实调用才有，
            向导阶段只有上传的材料与预填出来的字段 —— 就报这两样，不假装。 */}
        {stepIndex === 1 ? (
          <Block label={`已收到的材料 · ${draft.evidence.length} 份`}>
            {draft.evidence.length === 0 ? (
              <p className="text-label text-paper/50">
                还没传。传一张扣款清单，下一步的表就基本填好了。
              </p>
            ) : (
              <ul className="flex flex-col gap-2.5">
                {draft.evidence.map((file) => (
                  <li
                    key={file.id}
                    className="border-l-2 border-gold-bright pl-2.5 font-mono text-caption text-paper/70"
                  >
                    {EVIDENCE_KIND_LABEL[file.kind]} · {file.fileName}
                  </li>
                ))}
              </ul>
            )}
          </Block>
        ) : null}

        {/* ── 第三步：时限与材料 ── */}
        {stepIndex === 2 ? (
          <>
            {dueAt ? (
              <Block label="时限" labelClassName="text-verdict-unlawful-on-dark">
                <p className="text-label">
                  claim 通知截止{" "}
                  <strong className="font-bold">{formatIsoDateZh(dueAt)}</strong>
                  {daysLeft !== null && daysLeft >= 0
                    ? ` —— 还有 ${daysLeft} 天。`
                    : "。"}
                  过期押金可能按对方 claim 直接支付。
                </p>
              </Block>
            ) : null}
            <Block label="材料">
              <p className="text-label text-paper/70">
                {draft.evidence.length} 份 · 扣款明细 {filledDeductions.length} 项
                {hasClaimed ? "已对上" : ""}
              </p>
            </Block>
          </>
        ) : null}

        <div className="mt-auto pt-10">
          {blocker ? <div className="mb-3">{blocker}</div> : null}
          <button
            type="button"
            onClick={onPrimary}
            className="block w-full bg-seal px-6 py-4 text-section font-bold text-paper transition-colors duration-150 hover:bg-seal/90"
          >
            {primaryLabel}
          </button>
          <p className="mt-3.5 font-mono text-micro text-paper/40">
            {FOOTNOTE[stepIndex]}
          </p>
        </div>
      </div>
    </aside>
  );
}

function Block({
  label,
  labelClassName = "text-paper/45",
  children,
}: {
  label: string;
  labelClassName?: string;
  children: ReactNode;
}) {
  return (
    <div className="mt-8 border-t border-paper/16 pt-5">
      <p className={`font-mono text-micro ${labelClassName}`}>{label}</p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Row({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <li className="flex items-baseline justify-between gap-3 text-label">
      <span className="text-paper/60">{label}</span>
      <span className={mono ? "font-mono text-paper" : "font-bold text-paper"}>
        {value}
      </span>
    </li>
  );
}
