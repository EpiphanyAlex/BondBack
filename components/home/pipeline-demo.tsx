"use client";

/**
 * 首页第 2 幕的可操作部分（04b §1）——「一条流水线，三个视角，同一个案子」。
 *
 * 上一版这三段只是三行说明文字：01 旁边挂着真实输出的对照卡，02 和 03 什么都没有，
 * 读者点不动、也看不到「三轴」和「出信」到底长什么样，只能相信它。
 * 其实这三段各自的真实产物都在 `data/sample-case` 里躺着：
 *
 *   01 读懂你的证据 → `SAMPLE_FACTS`      7 条带页码的可引用原句（用上 4 条）
 *   02 三轴过一遍   → `AnalysisItem.checks` 3 笔 × 3 轴，含花园那笔「未见 → 不判不合法」
 *   03 出结论与信   → `ComparisonCard`      逐笔对照卡本体（与结果页同组件同数据）
 *
 * 所以这一幕改成**三个标签页**：三段顶线就是标签，点哪一段右边换成哪一段的真实产物。
 * 交互只有一层（选中 / 未选中），没有第二种动效 —— 这一幕的主角是内容不是切换本身。
 *
 * 默认自动轮播，因为大多数人不会去点一排看起来像标题的东西；轮播是那句
 * 「这里还有两屏」的唯一诚实说法。四条纪律：
 *
 * - **时钟就是进度条本身**：换段由 `.tab-dwell` 的 `animationend` 触发，
 *   不另起 `setInterval` —— 两个时钟必然会漂，进度条走完了面板还没换最难看。
 * - **用户一动手就永久停**：点了标签、按了方向键，就是他要自己读，
 *   不再从他手里把内容抢走。悬停与焦点落入只是暂停（纯 CSS，见 globals.css）。
 * - **不在视口里不走**：否则用户滚到这一幕时是半截进度条 + 随机一段。
 * - **`prefers-reduced-motion: reduce` 不轮播**：整幕退回纯点击。
 *
 * 无障碍：标准 tablist / tab / tabpanel，左右方向键在三段之间移动焦点。
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import { useReducedMotion } from "@/lib/reduced-motion";
import { ComparisonCard } from "@/components/result/comparison-card";
import { money } from "@/components/result/utils";
import { VERDICT_META, VerdictIcon } from "@/components/result/verdict";
import {
  SAMPLE_ANALYSIS,
  SAMPLE_CASE_INPUT,
  SAMPLE_FACTS,
  SAMPLE_STATUTE_COUNT,
  SAMPLE_USED_FACT_IDS,
} from "@/data/sample-case";
import type {
  AnalysisItem,
  CheckState,
  ContractObligationState,
} from "@/lib/types";

/** 卡①：退租清洁 + 地毯蒸洗 $780 ❌ —— 三条法条压着的那一张，最有说服力。 */
const HERO_ITEM = SAMPLE_ANALYSIS.items[0]!;

const USED_FACTS = new Set(SAMPLE_USED_FACT_IDS);

interface Step {
  ordinal: string;
  titleZh: string;
  bodyZh: string;
  /** 左栏那句话：右边这一屏是什么 */
  captionZh: string;
  leadZh: string;
}

const STEPS: Step[] = [
  {
    ordinal: "01",
    titleZh: "读懂你的证据",
    bodyZh: "入住报告、租约、聊天记录 —— 读成带页码的可引用原句。",
    captionZh: "它读出来的原句",
    leadZh: `${SAMPLE_CASE_INPUT.evidence.length} 份材料读成 ${SAMPLE_FACTS.length} 条可引用的原句，每条都带文件名与页码。用得上的进对照卡，用不上的也列出来 —— 你得知道它到底读到了什么。`,
  },
  {
    ordinal: "02",
    titleZh: "三轴过一遍",
    bodyZh: "原已存在？合约真有此义务？属合理磨损？",
    captionZh: "三笔扣款各自的三轴",
    leadZh:
      "同一笔钱问同样三个问题，答案决定判决。花园那笔就卡在第二轴：合约只读了 3 页，未见此义务 ≠ 没有此义务，所以它不判「不合法」，改判「待举证」，把举证责任推回给房东。",
  },
  {
    ordinal: "03",
    titleZh: "出结论与信",
    bodyZh: "逐笔给判决，写好英文申诉信与下一步路线。",
    captionZh: "这张卡是它的真实输出",
    leadZh: `${SAMPLE_FACTS.length} 条事实 → ${SAMPLE_STATUTE_COUNT} 条法条 → 三个判决。卡上每一句引语都点得回原件，每一条法条都给得出原文与官方出处。`,
  },
];

/* ── 02 的三轴文案：`unknown` / `n-a` 一律不得显示成「否」（红线）─────── */

const PRE_EXISTING: Record<CheckState, string> = {
  yes: "入住时就有",
  no: "入住时没有",
  unknown: "未知",
  "n-a": "与这笔无关",
};

const FAIR_WEAR: Record<CheckState, string> = {
  yes: "算合理磨损",
  no: "不算合理磨损",
  unknown: "未知",
  "n-a": "与这笔无关",
};

/** 红线：`absent` 只能说「未见」，不能说「没有」—— 只读了上传的那几页。 */
const CONTRACT: Record<ContractObligationState, string> = {
  exists: "合约里确有",
  absent: "已读页面未见",
  unknown: "未知",
  "n-a": "与这笔无关",
};

const AXES: { labelZh: string; read: (item: AnalysisItem) => string }[] = [
  { labelZh: "原已存在？", read: (item) => PRE_EXISTING[item.checks.preExisting] },
  {
    labelZh: "合约有此义务？",
    read: (item) => CONTRACT[item.checks.contractObligation],
  },
  { labelZh: "属合理磨损？", read: (item) => FAIR_WEAR[item.checks.fairWearTear] },
];

export function PipelineDemo() {
  const [active, setActive] = useState(2);
  /** 用户接管过没有。接管过就永久停播，不再从他手里把内容抢走 */
  const [tookOver, setTookOver] = useState(false);
  /** 这一幕在不在视口里 —— 不在就不走，免得滚下来撞见半截进度条 */
  const [inView, setInView] = useState(false);
  const reducedMotion = useReducedMotion();
  const sectionRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const step = STEPS[active]!;

  useEffect(() => {
    const node = sectionRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(Boolean(entry?.isIntersecting)),
      // 露出四分之一才算「在看」：擦边划过去不该消耗掉一段
      { threshold: 0.25 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const dwelling = !reducedMotion && !tookOver && inView;

  /** 用户接管：点了标签或按了方向键，轮播就此停住 */
  const takeOver = (index: number) => {
    setTookOver(true);
    setActive(index);
  };

  /** 左右方向键在三段之间走，焦点跟着走 —— tablist 的标准键盘行为。 */
  const onKeyDown = (event: React.KeyboardEvent, index: number) => {
    const delta =
      event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (delta === 0) return;
    event.preventDefault();
    const next = (index + delta + STEPS.length) % STEPS.length;
    takeOver(next);
    tabRefs.current[next]?.focus();
  };

  return (
    <div ref={sectionRef} className="pipeline">
      {/* 三段顶线连成一条流水线：选中的那一段是朱红，其余是墨黑淡线。
          红色从「永远在 01」变成「你正在看哪一段」，线本身就成了位置指示。 */}
      <div
        role="tablist"
        aria-label="它怎么判：三段流水线"
        className="mt-8 grid gap-6 md:mt-10 lg:grid-cols-3 lg:gap-0"
      >
        {STEPS.map((item, index) => {
          const selected = index === active;
          return (
            <button
              key={item.ordinal}
              ref={(node) => {
                tabRefs.current[index] = node;
              }}
              type="button"
              role="tab"
              id={`pipeline-tab-${item.ordinal}`}
              aria-selected={selected}
              aria-controls="pipeline-panel"
              tabIndex={selected ? 0 : -1}
              onClick={() => takeOver(index)}
              onKeyDown={(event) => onKeyDown(event, index)}
              className={`group relative border-t-[3px] pt-4 text-left transition-colors duration-150 ${
                selected
                  ? "border-seal/25"
                  : "border-ink/20 hover:border-ink/45"
              } ${index === 0 ? "lg:pr-7" : index === 1 ? "lg:px-7" : "lg:pl-7"}`}
            >
              {/* 当前那一段顶线上走过的一道朱红。轮播时它是进度条，也是时钟
                  （走完即换段）；用户接管后它就静静地铺满，只当选中指示。 */}
              {selected ? (
                <span
                  aria-hidden="true"
                  className={`absolute inset-x-0 top-[-3px] h-[3px] origin-left bg-seal ${
                    dwelling ? "tab-dwell" : ""
                  }`}
                  onAnimationEnd={
                    dwelling
                      ? () => setActive((current) => (current + 1) % STEPS.length)
                      : undefined
                  }
                />
              ) : null}
              <span className="flex items-baseline gap-3">
                <span
                  className={`font-number text-title leading-none transition-colors duration-150 ${
                    selected ? "text-verdict-unlawful" : "text-ink/45"
                  }`}
                >
                  {item.ordinal}
                </span>
                <span
                  className={`font-mono text-micro ${
                    selected ? "text-verdict-unlawful" : "text-faint"
                  }`}
                >
                  {selected ? "正在看" : "看这一步"}
                </span>
              </span>
              <span className="mt-2.5 block text-section font-bold text-ink">
                {item.titleZh}
              </span>
              <span
                className={`mt-2 block max-w-[300px] text-label transition-colors duration-150 ${
                  selected ? "text-ink" : "text-muted"
                }`}
              >
                {item.bodyZh}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-10 grid gap-8 md:mt-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,700px)] lg:gap-11">
        <div>
          {/* 左栏跟着切：说清右边这一屏是什么，其余（虚构声明、完整示例入口）不动 */}
          <div key={step.ordinal} className="step-enter">
            <p className="font-mono text-micro text-faint">{step.captionZh}</p>
            <p className="mt-3.5 max-w-[380px] text-section text-ink">
              {step.leadZh}
            </p>
          </div>

          {/* 军规：示例案例必须标虚构 */}
          <p className="mt-5 inline-flex items-center gap-2.5 border border-ink/30 px-3.5 py-2">
            <span className="size-[7px] rounded-full bg-gold-bright" />
            <span className="font-mono text-micro text-muted">
              示例案例 · 文件与当事人均为虚构
            </span>
          </p>

          <p className="mt-6">
            <Link
              href="/sample"
              className="border-b-2 border-seal pb-0.5 text-section font-bold text-ink"
            >
              看完整示例（会重放整个过程）→
            </Link>
          </p>
        </div>

        <div
          key={active}
          id="pipeline-panel"
          role="tabpanel"
          aria-labelledby={`pipeline-tab-${step.ordinal}`}
          tabIndex={-1}
          /* min-h：三块内容高度不一（原句 7 条最高、三轴最矮），
             不给个下限，切标签时下面的第 3 幕会跟着跳。 */
          className="step-enter min-w-0 lg:min-h-[620px]"
        >
          {active === 0 ? <FactsPanel /> : null}
          {active === 1 ? <ChecksPanel /> : null}
          {active === 2 ? (
            <ComparisonCard item={HERO_ITEM} facts={SAMPLE_ANALYSIS.facts} />
          ) : null}
        </div>
      </div>
    </div>
  );
}

/* ── 面板外壳：三块共用同一副卡面，切换时只换内容不换形 ─────────────── */

function PanelFrame({
  eyebrowZh,
  metaZh,
  children,
}: {
  eyebrowZh: string;
  metaZh: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-line bg-card">
      <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-line px-5 py-3.5 md:px-7">
        <p className="font-mono text-micro text-ink">{eyebrowZh}</p>
        <p className="font-mono text-micro text-faint">{metaZh}</p>
      </header>
      {children}
    </div>
  );
}

/* ── 01 · 读出来的原句 ────────────────────────────────────────────────
   连「没用上的 3 条」一起列 —— 只给用上的那几条，就没法回答
   「它到底读了多少」这个问题，而这正是第一层能力的分量所在。 */

function FactsPanel() {
  return (
    <PanelFrame
      eyebrowZh={`证据 · ${SAMPLE_CASE_INPUT.evidence.length} 份材料 → ${SAMPLE_FACTS.length} 条可引用原句`}
      metaZh={`${USED_FACTS.size} 条被这次判决采用`}
    >
      <ul className="divide-y divide-line">
        {SAMPLE_FACTS.map((fact) => {
          const used = USED_FACTS.has(fact.id);
          return (
            <li key={fact.id} className="px-5 py-4 md:px-7">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <p className="font-mono text-micro text-faint">{fact.locator}</p>
                <p
                  className={`font-mono text-micro ${
                    used ? "text-evidence-used" : "text-faint"
                  }`}
                >
                  {used ? "已采用" : "未用到"}
                </p>
              </div>
              <p
                className={`mt-2.5 border-l-[3px] pl-3.5 font-mono text-label leading-normal ${
                  used
                    ? "border-evidence-used text-ink"
                    : "border-line text-muted"
                }`}
              >
                “{fact.quote}”
              </p>
            </li>
          );
        })}
      </ul>
    </PanelFrame>
  );
}

/* ── 02 · 三轴过一遍 ──────────────────────────────────────────────────
   三笔 × 三轴摊平了看，「花园」那一笔为什么是 ⚠️ 而不是 ❌ 一眼就答完了。 */

function ChecksPanel() {
  return (
    <PanelFrame
      eyebrowZh={`三轴 · ${SAMPLE_ANALYSIS.items.length} 笔扣款各过一遍`}
      metaZh="答案决定判决"
    >
      <ul className="divide-y divide-line">
        {SAMPLE_ANALYSIS.items.map((item) => {
          const meta = VERDICT_META[item.verdict];
          /* 三轴全「不适用」时（典型：水费），三格一模一样的「与这笔无关」
             是噪音不是信息 —— 收成一句话，把位置让给「那它凭什么合法」。 */
          const allNa =
            item.checks.preExisting === "n-a" &&
            item.checks.contractObligation === "n-a" &&
            item.checks.fairWearTear === "n-a";

          return (
            <li key={item.description} className="px-5 py-5 md:px-7">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <p className="text-section font-bold text-ink">
                  {item.description}
                </p>
                <p className="font-number text-num-sm leading-none text-amount">
                  {money(item.amount)}
                </p>
              </div>

              {allNa ? (
                <p className="mt-3.5 border-l-2 border-line pl-3 text-caption text-muted">
                  三轴都不适用 —— 它不看证据也不看合约，直接由法条列明可扣：
                  <span className="font-mono text-caption text-ink">
                    {" "}
                    {item.statuteRefs[0]?.section ?? "—"}
                  </span>
                </p>
              ) : (
                <ul className="mt-3.5 grid gap-2.5 md:grid-cols-3">
                  {AXES.map((axis) => (
                    <li
                      key={axis.labelZh}
                      className="border-l-2 border-line pl-3"
                    >
                      <p className="font-mono text-micro text-faint">
                        {axis.labelZh}
                      </p>
                      <p className="mt-1 text-caption text-ink">
                        {axis.read(item)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}

              <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-line pt-3">
                <span
                  className={`flex items-center gap-1.5 font-bold ${meta.text}`}
                >
                  <VerdictIcon verdict={item.verdict} size={14} />
                  {meta.labelZh}
                </span>
                <span className="ml-auto font-mono text-micro text-faint">
                  {item.disputableAmount > 0
                    ? `可争 ${money(item.disputableAmount)}`
                    : "不争议"}
                </span>
              </p>
            </li>
          );
        })}
      </ul>
    </PanelFrame>
  );
}
