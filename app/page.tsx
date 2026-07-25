/**
 * 首页（04b §1）。
 *
 * 编排四段：首屏（标题 / 简介 / 双入口 / 一张真实对照卡）→ 三格能力图示 →
 * 愿景橱窗 → 收尾双入口。免责声明由根布局的 `SiteFooter` 常驻，不再重复一份。
 *
 * 全部是服务端组件，只有 03b 的对照卡自己带 `"use client"` —— 首屏不等 JS。
 */

import { CapabilityTrio } from "@/components/home/capability-trio";
import { ClosingCta } from "@/components/home/closing-cta";
import { HomeHero } from "@/components/home/home-hero";
import { VisionShowcase } from "@/components/home/vision-showcase";

export default function HomePage() {
  return (
    <div className="pb-8">
      <HomeHero />
      <CapabilityTrio />
      <VisionShowcase />
      <ClosingCta />
    </div>
  );
}
