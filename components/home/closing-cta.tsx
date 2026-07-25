/**
 * 收尾的双入口（04b §1）。
 *
 * 首页滚到底大约 2600px，拇指区不该是空的 —— 把首屏那两个入口原样再给一次。
 * 措辞与首屏一致，不加任何「一定拿回」之类的承诺（军规：避免绝对化承诺）。
 */

import Link from "next/link";

export function ClosingCta() {
  return (
    <section className="mx-auto w-full max-w-[1152px] px-4 pt-8 pb-2 md:px-6">
      <div className="rounded-2xl bg-ink px-4 py-5 text-white md:px-6 md:py-6">
        <p className="font-mono text-micro uppercase text-white/45">
          两分钟，先看看有几笔站不住
        </p>
        <p className="mt-1.5 text-section text-white">
          押金退不干净这件事，认栽的成本远比争一次高。
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2 md:gap-3">
          <Link
            href="/wizard"
            className="rounded-xl bg-white px-2 py-3 text-center text-body font-semibold text-ink transition active:scale-[0.99] md:px-4"
          >
            😤 我的押金被扣了
          </Link>
          <Link
            href="/sample"
            className="rounded-xl border border-white/25 px-2 py-3 text-center text-body font-semibold text-white transition-colors duration-150 hover:bg-white/10 md:px-4"
          >
            👀 先看个案例
          </Link>
        </div>
      </div>
    </section>
  );
}
