"use client";

/**
 * 首页第 1 幕（「江湖战报」稿 §01）—— 全幅墨黑。
 *
 * 这一幕只有一个主意：**把金额输入直接长进标题里**。
 * 「房东扣了我 $____，先别认栽。」—— 数是用户自己填的，标题因此从一句广告语
 * 变成他自己的案情。填完就带着这个数进向导（会话内存挂在根布局，
 * 客户端跳转不丢），战报栏一进去就已经在算他的钱。
 *
 * 排版分工照 design-tokens §1.5：宋体 900 喊话、Anton 只给钱数、等宽只给「码」。
 */

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { money } from "@/components/result/utils";
import { VerdictBadge } from "@/components/result/verdict";
import { SAMPLE_ANALYSIS, SAMPLE_CASE_INPUT } from "@/data/sample-case";
import { parseAmount } from "@/lib/case-draft";
import { useCaseSession } from "@/lib/case-session";
import type { Verdict } from "@/lib/types";

const VERDICTS: Verdict[] = ["unlawful", "doubtful", "lawful"];

/** 只留数字与小数点，边打边加千分位 —— 标题里的数要一眼认得出是钱。 */
function formatWhileTyping(raw: string): string {
  const cleaned = raw.replace(/[^\d.]/g, "");
  const [int = "", ...rest] = cleaned.split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return rest.length > 0 ? `${grouped}.${rest.join("").slice(0, 2)}` : grouped;
}

export function HomeHero() {
  const router = useRouter();
  const { updateDraft, markTouched } = useCaseSession();
  const [amount, setAmount] = useState("");

  const parsed = parseAmount(amount);
  const hasAmount = parsed !== undefined && parsed > 0;

  const start = () => {
    if (hasAmount) {
      // 用户亲手填的数，标记 touched，之后的自动预填不许覆盖它
      updateDraft({ claimedAmount: String(parsed) });
      markTouched("claimedAmount");
    }
    router.push("/wizard");
  };

  return (
    <section className="bg-ink text-paper">
      <div className="mx-auto w-full max-w-[1152px] px-4 md:px-6">
        {/* ── 顶栏 ── */}
        <header className="flex items-center justify-between border-b border-paper/12 py-4 md:py-5">
          <div className="flex items-baseline gap-3">
            <span className="h-shout text-title">押金侠</span>
            <span className="font-mono text-micro text-paper/45">BONDBACK</span>
          </div>
          <nav className="flex items-center gap-5 md:gap-8">
            <a href="#how" className="text-label text-paper/60">
              怎么判
            </a>
            <Link href="/sample" className="text-label text-paper/60">
              真实案例
            </Link>
            <span className="hidden font-mono text-micro text-paper/40 md:inline">
              NSW · VIC
            </span>
          </nav>
        </header>

        <div className="grid gap-8 pt-10 pb-8 md:pt-12 lg:grid-cols-[1.28fr_0.72fr] lg:gap-12 lg:pb-12">
          {/* ── 左：喊话 + 合体式金额 + 主行动 ── */}
          <div>
            <p className="font-mono text-micro text-amount-hero">
              填一个数，两分钟出结论 · 不注册
            </p>

            <h1 className="h-shout mt-5 text-hero">
              房东扣了我
              <span className="whitespace-nowrap">
                <label className="hero-amount">
                  <span className="hero-amount__sign" aria-hidden="true">
                    $
                  </span>
                  <input
                    className="hero-amount__input"
                    value={amount}
                    onChange={(event) =>
                      setAmount(formatWhileTyping(event.target.value))
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter") start();
                    }}
                    inputMode="decimal"
                    autoComplete="off"
                    placeholder="1,306"
                    aria-label="房东一共扣了你多少钱"
                  />
                </label>
                ，
              </span>
              <br />
              先别
              <span className="strike-in relative text-verdict-unlawful">
                认栽
              </span>
              。
            </h1>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={start}
                className={`px-8 py-4 text-section font-bold transition-colors duration-300 ${
                  hasAmount
                    ? "bg-seal text-paper"
                    : "bg-seal/35 text-paper/60 hover:bg-seal/55"
                }`}
              >
                看看几笔站不住
              </button>
              <span className="font-mono text-caption text-paper/45">
                填上金额即可开始 · 或直接传扣款清单让它自己读
              </span>
            </div>

            {/* 三档结论的交通灯语义在首屏就先教一遍 */}
            <div className="mt-10 border-t border-paper/16 pt-6">
              <p className="font-mono text-micro text-paper/45">
                每一笔扣款只判三种结果
              </p>
              <ul className="mt-3.5 flex flex-wrap gap-2.5">
                {VERDICTS.map((verdict) => (
                  <li key={verdict}>
                    <VerdictBadge verdict={verdict} tone="dark" />
                  </li>
                ))}
              </ul>
              <p className="mt-3.5 max-w-[640px] text-label text-paper/55">
                每条结论都附州法条编号与官方原文链接。房东占理的那一笔，它会直接告诉你别争
                —— 不给虚假希望。
              </p>
            </div>
          </div>

          {/* ── 右：一张真的战报 ──
              稿子这一格留给押金侠的角色形象（待画师）。在画出来之前不摆
              「待补图」的占位框：拿示例案子的真实战报顶上，这一格因此从
              装饰位变成第二个论据 —— 它已经判过别人的三笔了。 */}
          <aside className="border border-paper/20 p-6 md:p-7">
            <p className="font-mono text-micro text-amount-hero">
              示例战报 · NSW · 文件与当事人均为虚构
            </p>
            <p className="mt-5 font-mono text-micro text-paper/45">可争议</p>
            <p className="font-number text-num-lg leading-none text-amount-hero">
              {money(SAMPLE_ANALYSIS.ledger.disputableTotal)}
            </p>
            <p className="mt-2.5 font-mono text-caption text-paper/50">
              押金 {money(SAMPLE_CASE_INPUT.bondAmount)} · 索扣{" "}
              {money(SAMPLE_ANALYSIS.ledger.claimedTotal)}
            </p>

            <ul className="mt-6 flex flex-col gap-3 border-t border-paper/16 pt-5">
              {SAMPLE_ANALYSIS.items.map((item) => (
                <li
                  key={item.description}
                  className="flex items-baseline justify-between gap-3"
                >
                  <span className="min-w-0 truncate text-label text-paper/70">
                    {item.description}
                  </span>
                  <span className="shrink-0 font-number text-num-sm text-paper">
                    {money(item.amount)}
                  </span>
                </li>
              ))}
            </ul>

            <Link
              href="/sample"
              className="mt-6 inline-block border-b-2 border-seal pb-0.5 text-label font-bold text-paper"
            >
              看它怎么判这三笔 →
            </Link>
          </aside>
        </div>
      </div>

      {/* ── 幕与幕之间的米白接口 ──
          稿子里它是压在第 1 幕底边上的一条浅色带，作用是「往下还有」。 */}
      <div className="mx-auto w-full max-w-[1152px] px-4 md:px-6">
        <a
          href="#how"
          className="flex items-center gap-5 bg-paper px-5 py-5 text-ink md:px-7"
        >
          <span className="hidden font-mono text-micro text-faint md:inline">
            往下 · 第 2 幕
          </span>
          <p className="h-shout text-section">
            还没准备好填？先看它怎么判别人那三笔。
          </p>
          <span className="ml-auto text-title text-verdict-unlawful">↓</span>
        </a>
      </div>
    </section>
  );
}
