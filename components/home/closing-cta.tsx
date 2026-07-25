/**
 * 首页收尾幕（「江湖战报」稿 §01 收尾）—— 墨黑，把双入口再给一次。
 *
 * 左半栏是收口喊话 + 两个入口，右半栏是「即将支持」。措辞不加任何
 * 「一定拿回」之类的承诺（军规：避免绝对化承诺）。
 * 免责声明由根布局的 `SiteFooter` 常驻，这里不重复一份。
 */

import Link from "next/link";

import { VisionShowcase } from "@/components/home/vision-showcase";

export function ClosingCta() {
  return (
    <section className="mt-12 bg-ink text-paper md:mt-16">
      <div className="mx-auto grid w-full max-w-[1152px] gap-10 px-4 py-12 md:px-6 md:py-14 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
        <div>
          <p className="font-mono text-micro text-amount-hero">
            两分钟，先看看有几笔站不住
          </p>
          <h2 className="h-shout mt-5 text-display">
            押金退不干净这件事，
            <br />
            认栽的成本远比争一次高。
          </h2>
          <div className="mt-9 flex flex-wrap items-center gap-3.5">
            <Link
              href="/wizard"
              className="bg-seal px-8 py-4 text-section font-bold text-paper"
            >
              算我的押金
            </Link>
            <Link
              href="/sample"
              className="border border-paper/35 px-7 py-4 text-section font-bold text-paper transition-colors duration-150 hover:bg-paper/10"
            >
              看示例案例
            </Link>
          </div>
        </div>

        <VisionShowcase />
      </div>
    </section>
  );
}
