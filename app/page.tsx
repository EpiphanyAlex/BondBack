/**
 * 首页（「江湖战报」稿 §01）。
 *
 * 三幕，底色交替 —— 全站只有墨黑与米白两种面：
 *   第 1 幕 · 墨黑   合体式标题（金额由用户填进标题里）+ 三档结论 + 示例战报
 *   第 2 幕 · 米白   它怎么判：01/02/03 流水线 + 一张真实对照卡
 *   收尾   · 墨黑   双入口 + 即将支持
 *
 * 免责声明由根布局的 `SiteFooter` 常驻，不再重复一份。
 * 只有第 1 幕（要接金额输入）与对照卡是客户端组件，其余不等 JS。
 */

import { ClosingCta } from "@/components/home/closing-cta";
import { HomeHero } from "@/components/home/home-hero";
import { HowItJudges } from "@/components/home/how-it-judges";

export default function HomePage() {
  return (
    <>
      <HomeHero />
      <HowItJudges />
      <ClosingCta />
    </>
  );
}
