/**
 * 首页首屏（04b §1）。
 *
 * 手机首屏必须同时装下四件事：标题 / 简介 / 双入口 / **一张真实对照卡**。
 * 那张卡是 03b 的 `ComparisonCard` **本体**（不是复制品），喂 04a 示例常量的卡①——
 * 投票者不点任何东西就能看到「证据 → 合同 → 法条 → 结论」长什么样，
 * 这是对抗「看起来就是上传文件 → AI 写封信」的第一道防线。
 *
 * 手机上卡片只露出上半张，用于暗示往下滑；≥lg 走双栏
 * （左标题+简介+双入口，右对照卡，design-tokens §4.3）。
 */

import Link from "next/link";

import { ComparisonCard } from "@/components/result/comparison-card";
import { VerdictBadge } from "@/components/result/verdict";
import {
  SAMPLE_ANALYSIS,
  SAMPLE_CASE_INPUT,
  SAMPLE_FACTS,
  SAMPLE_STATUTE_COUNT,
} from "@/data/sample-case";

/** 卡①：退租清洁 + 地毯蒸洗 $780 ❌ —— 三条法条压着的那一张，最有说服力。 */
const HERO_ITEM = SAMPLE_ANALYSIS.items[0];

const OUTPUT_LABEL = "以下是它的实际输出";

export function HomeHero() {
  return (
    <section className="mx-auto w-full max-w-[1152px] px-4 pt-4 md:px-6 md:pt-6">
      {/*
        对照卡从 440px 加宽到 620px。它是首屏的论点，窄栏会把它拉成一根近千像素的
        长条 —— 左栏讲完话就见底，右边还在往下流，桌面上左侧空一大片。
        加宽后卡变矮、法条牌不再折行，两栏高度也就接近了。
      */}
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,620px)] lg:items-center lg:gap-10">
        {/* 左栏（手机上就是首屏的前半段）*/}
        <div>
          <p className="font-mono text-micro uppercase text-muted">
            押金侠 BondBack · 目前支持 NSW / VIC
          </p>

          <h1 className="mt-2 font-display text-hero text-ink">
            房东乱扣 Bond？
            <br />
            先别认栽。
          </h1>

          <p className="mt-3 text-body leading-relaxed text-muted">
            传扣款清单和入住报告，按 NSW / VIC 租赁法逐笔比对，
            告诉你哪几笔不该扣、凭哪条法规，并写好英文申诉信。
          </p>

          <div className="mt-4 grid grid-cols-2 gap-2 md:gap-3">
            <Link
              href="/wizard"
              className="rounded-xl bg-ink px-2 py-3 text-center text-body font-semibold text-white transition active:scale-[0.99] md:px-4"
            >
              😤 我的押金被扣了
            </Link>
            <Link
              href="/sample"
              className="rounded-xl border border-line bg-card px-2 py-3 text-center text-body font-semibold text-ink transition-colors duration-150 hover:bg-paper md:px-4"
            >
              👀 先看个案例
            </Link>
          </div>

          {/* 三档结论的交通灯语义在首屏就先教一遍（图标 + 颜色 + 中文标签同时在场） */}
          <p className="mt-4 font-mono text-micro uppercase text-muted">
            每一笔扣款只判三种结果
          </p>
          <ul className="mt-1.5 flex flex-wrap gap-1.5">
            <li>
              <VerdictBadge verdict="unlawful" />
            </li>
            <li>
              <VerdictBadge verdict="doubtful" />
            </li>
            <li>
              <VerdictBadge verdict="lawful" />
            </li>
          </ul>

          {/* 桌面才放得下的「输入 → 输出」注脚：手机上它会把对照卡挤出首屏 */}
          <div className="mt-6 hidden lg:block">
            <p className="font-mono text-micro uppercase text-muted">
              右边这张卡的输入
            </p>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {SAMPLE_CASE_INPUT.evidence.map((file) => (
                <li
                  key={file.id}
                  className="rounded-full border border-line bg-card px-2.5 py-1 text-caption text-muted"
                >
                  {file.fileName}
                </li>
              ))}
            </ul>
            <p className="tnum mt-2 text-caption leading-relaxed text-muted">
              {SAMPLE_CASE_INPUT.evidence.length} 份材料 → {SAMPLE_FACTS.length}{" "}
              条可引用的事实 → {SAMPLE_STATUTE_COUNT} 条法条 → 右边这张卡。
            </p>
          </div>

          {/* 手机：分隔线把「这不是宣传图，是真输出」说明白 */}
          <div className="mt-5 flex items-center gap-3 lg:hidden">
            <span className="h-px flex-1 bg-line" />
            <span className="shrink-0 font-mono text-micro uppercase text-muted">
              {OUTPUT_LABEL}
            </span>
            <span className="h-px flex-1 bg-line" />
          </div>
        </div>

        {/* 右栏（手机上接在分隔线之后，DOM 顺序即手机顺序） */}
        <div className="mt-3 lg:mt-0">
          <p className="hidden font-mono text-micro uppercase text-muted lg:mb-2 lg:block">
            {OUTPUT_LABEL}
          </p>
          {/* 与结果页同一个组件、同一份数据，不做任何简化版 */}
          <ComparisonCard item={HERO_ITEM} facts={SAMPLE_ANALYSIS.facts} />
          {/* 军规要求示例必须标虚构；「与结果页是同一个组件」是实现细节，读者不关心 */}
          <p className="mt-2 text-caption leading-relaxed text-muted">
            示例案例，文件与当事人均为虚构。
          </p>
        </div>
      </div>
    </section>
  );
}
