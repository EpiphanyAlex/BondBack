/**
 * 烤一张 public/og.png —— 微信 / Slack / X 里甩链接时的缩略图（05 §微信）。
 *
 * 为什么是「本地烤好的静态 PNG」而不是 app/opengraph-image.tsx 动态生成：
 * - 微信的抓取器不跑 JS、超时短，静态文件从 CDN 直出最稳；
 * - 动态路由要在函数里带一份中文字体，冷启动和包体都得付账，而这张图一年不变。
 *
 * 字体：`scripts/og-fonts/` 里两个 Noto Sans SC **子集**（只含本文件用到的字，各 16KB）。
 * 它们只在这个脚本里用，不进 app 包。改了下面的文案就要重跑 `pnpm og:sub` 补字，
 * 否则新字会渲染成豆腐块。
 *
 * 用法：pnpm og
 */

import { readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { createElement as h } from "react";
// next 的 package.json 没给 "next/og" 加 exports 映射，脚本里得写全 .js
import { ImageResponse } from "next/og.js";

/* ── 文案（改这里之后必须重跑 pnpm og:sub）────────────────────────────── */

export const OG_TEXT = {
  kicker: "NSW / VIC 租赁法",
  wordmark: "押金侠",
  latin: "BondBack",
  tagline1: "房东乱扣 Bond？先别认栽。",
  tagline2: "逐项比对证据与法条，生成英文申诉信",
  footer: "信息辅助，不构成法律意见",
};

/* ── 颜色：globals.css :root 的字面值（脚本读不到 CSS 变量）──────────── */

const INK = "#14110f";
const PAPER = "#f6f1e6";
const SEAL = "#e23d28";
const GOLD = "#e9b44c";

const WIDTH = 1200;
const HEIGHT = 630;

/**
 * 微信在聊天里把缩略图**居中裁成正方形**（1200×630 → 中间 630×630）。
 * 所以整张图走居中栈，横向别超过 ~600px —— 裁完还得读得出「押金侠」。
 */
function card(logoSrc) {
  return h(
    "div",
    {
      style: {
        width: WIDTH,
        height: HEIGHT,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: INK,
        fontFamily: "Noto Sans SC",
        position: "relative",
      },
    },
    // 「江湖战报」方角细框 —— OG 也跟全站同一套墨黑 / 米白 / 朱红
    h("div", {
      style: {
        position: "absolute",
        top: 26,
        left: 26,
        right: 26,
        bottom: 26,
        border: `1px solid ${PAPER}`,
        opacity: 0.16,
      },
    }),
    h("img", {
      src: logoSrc,
      width: 72,
      height: 72,
      style: {
        objectFit: "contain",
      },
    }),
    h(
      "div",
      {
        style: {
          marginTop: 10,
          fontSize: 24,
          fontWeight: 400,
          letterSpacing: 8,
          color: "rgba(246,241,230,0.55)",
        },
      },
      OG_TEXT.kicker,
    ),
    h(
      "div",
      {
        style: {
          marginTop: 8,
          fontSize: 126,
          fontWeight: 700,
          letterSpacing: 10,
          lineHeight: 1.05,
          color: PAPER,
        },
      },
      OG_TEXT.wordmark,
    ),
    h(
      "div",
      {
        style: {
          marginTop: 2,
          fontSize: 40,
          fontWeight: 700,
          letterSpacing: 14,
          color: GOLD,
        },
      },
      OG_TEXT.latin,
    ),
    h("div", {
      style: {
        marginTop: 26,
        width: 132,
        height: 3,
        backgroundColor: SEAL,
      },
    }),
    h(
      "div",
      {
        style: {
          marginTop: 26,
          fontSize: 32,
          fontWeight: 700,
          color: "rgba(246,241,230,0.92)",
        },
      },
      OG_TEXT.tagline1,
    ),
    h(
      "div",
      {
        style: {
          marginTop: 10,
          fontSize: 27,
          fontWeight: 400,
          color: "rgba(246,241,230,0.62)",
        },
      },
      OG_TEXT.tagline2,
    ),
    h(
      "div",
      {
        style: {
          position: "absolute",
          bottom: 52,
          fontSize: 20,
          fontWeight: 400,
          letterSpacing: 2,
          color: "rgba(246,241,230,0.38)",
        },
      },
      OG_TEXT.footer,
    ),
  );
}

async function render() {
  const fontDir = new URL("./og-fonts/", import.meta.url);
  const logoData = await readFile(
    new URL("../public/brand/logo-mark.png", import.meta.url),
  );
  const logoSrc = `data:image/png;base64,${logoData.toString("base64")}`;

  const response = new ImageResponse(card(logoSrc), {
    width: WIDTH,
    height: HEIGHT,
    fonts: [
      {
        name: "Noto Sans SC",
        data: await readFile(new URL("noto-sc-400.ttf", fontDir)),
        weight: 400,
        style: "normal",
      },
      {
        name: "Noto Sans SC",
        data: await readFile(new URL("noto-sc-700.ttf", fontDir)),
        weight: 700,
        style: "normal",
      },
    ],
  });

  const out = new URL("../public/og.png", import.meta.url);
  await writeFile(out, Buffer.from(await response.arrayBuffer()));
  console.log(`✓ og.png 已生成 → public/og.png（${WIDTH}×${HEIGHT}）`);
}

// og-subset.mjs 只 import OG_TEXT，别顺手把图也烤了
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await render();
}
