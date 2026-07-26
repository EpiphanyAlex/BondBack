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

import { BrandLockup } from "@/components/brand-lockup";
import { CharacterSlot } from "@/components/character-slot";
import { parseAmount } from "@/lib/case-draft";
import { useCaseSession } from "@/lib/case-session";

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
        {/* ── 顶栏 ──
            `relative z-10`：右边的侠客图在 lg 上放大到 125%，会从格子里溢出来
            盖住顶栏；不抬高层级，这两个链接就点不到（图那边另配 pointer-events-none）。 */}
        <header className="relative z-10 flex items-center justify-between gap-4 border-b border-paper/12 py-4 md:py-5">
          <Link href="/" aria-label="押金侠首页">
            <BrandLockup />
          </Link>
          {/* NSW · VIC 已整条删掉：它是「支持哪两个州」，不是去处，
              摆在导航里既点不动又像个断掉的菜单项；侠客图脚下那摞书上就印着
              NSW / VIC，向导第一步也要选州，这里再说一次是多的。 */}
          <nav className="flex items-center gap-6 md:gap-9">
            <a
              href="#how"
              className="border-b border-transparent pb-0.5 text-label text-paper/60 transition-colors duration-150 hover:border-seal hover:text-paper"
            >
              怎么判
            </a>
            <Link
              href="/sample"
              className="border-b border-transparent pb-0.5 text-label text-paper/60 transition-colors duration-150 hover:border-seal hover:text-paper"
            >
              真实案例
            </Link>
          </nav>
        </header>

        <div className="grid gap-8 pt-10 pb-8 md:pt-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12 lg:pb-0">
          {/* ── 左：喊话 + 合体式金额 + 主行动 ── */}
          <div>
            <p className="font-mono text-micro text-amount-hero">
              两分钟出结论 · 不注册
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
                    ? "bg-seal text-paper hover:bg-seal/90"
                    : "bg-seal/35 text-paper/60 hover:bg-seal/55"
                }`}
              >
                看看几笔站不住
              </button>
              <span className="font-mono text-caption text-paper/45">
                填上金额即可开始 · 或直接传扣款清单让它自己读
              </span>
            </div>

          </div>

          {/* ── 右：方案一「卷宗游侠」—— 传统侠客 × 现代证据分析的反差。 */}
          <CharacterSlot
            src="/character/hero-xia.png"
            alt="押金侠俯身用放大镜核对证据卷宗与 NSW、VIC 租赁法资料"
            eager
            /* pointer-events-none：放大 125% 后它的盒子会盖到顶栏上，
               透明像素照样吃点击。它是装饰，不该拦住任何一次点击。 */
            className="pointer-events-none min-h-[320px] object-bottom lg:min-h-[600px] lg:origin-bottom-right lg:scale-125"
            briefZh={"押金侠 · 卷宗游侠\n俯身查证据与法条"}
          />
        </div>
      </div>

      {/* ── 幕与幕之间的米白接口 ──
          稿子里它是压在第 1 幕底边上的一条浅色带，作用是「往下还有」。 */}
      <div className="mx-auto w-full max-w-[1152px] px-4 md:px-6">
        <a
          href="#how"
          className="group flex items-center gap-5 bg-paper px-5 py-5 text-ink transition-colors duration-150 hover:bg-card md:px-7"
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
