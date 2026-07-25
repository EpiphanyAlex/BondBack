import type { Metadata, Viewport } from "next";
import { Anton, IBM_Plex_Mono, Noto_Sans_SC } from "next/font/google";
import "./globals.css";
import { SiteFooter } from "@/components/site-footer";
import { CaseSessionProvider } from "@/lib/case-session";
import { SITE_URL } from "@/lib/site";

/**
 * 正文体。只声明 latin —— next/font 的 Google 字体清单里 Noto Sans SC
 * 根本没有 `chinese-simplified` 这个子集可选，写了也不含汉字。
 * 所以它只负责拉丁字母与数字，汉字由 `--font-sans` 字族链里的 PingFang SC 接手。
 */
const notoSansSc = Noto_Sans_SC({
  variable: "--font-noto-sans-sc",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
});

/** 钱数专用。只有 latin 一档，正好只用来排 `$` 和阿拉伯数字（设计稿 §字阶）*/
const anton = Anton({
  variable: "--font-anton",
  subsets: ["latin"],
  weight: ["400"],
});

/** 等宽体：法条编号、日期这类「代号」 */
const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

/**
 * OG 的绝对地址基准。微信/Slack 抓 `og:image` 只认绝对 URL，Next 用这个值补全。
 * 预览部署上要用预览域名 —— 否则在预览里调微信卡片，缩略图会指向还没上线的正式域名。
 */
function metadataBase(): URL {
  const { VERCEL_ENV, VERCEL_URL } = process.env;
  if (VERCEL_ENV && VERCEL_ENV !== "production" && VERCEL_URL) {
    return new URL(`https://${VERCEL_URL}`);
  }
  return new URL(SITE_URL);
}

/**
 * 链接甩进微信群时，卡片 = 标题 + 描述 + 缩略图（05 §微信）。
 * - 标题走情绪钩子，不是功能说明 —— 群里滑过去只看得见这一行
 * - 缩略图是 `public/og.png`（`pnpm og` 本地烤好的静态图）。**微信会把它居中裁成
 *   正方形**，所以图上「押金侠」三个字是居中的，裁完照样认得出
 * - 描述压到两行以内，微信超了直接截断
 */
export const metadata: Metadata = {
  metadataBase: metadataBase(),
  title: "押金侠 BondBack｜房东乱扣 Bond？先别认栽",
  description:
    "面向澳洲 NSW / VIC 租客的信息辅助工具：三步向导整理证据、评估胜算、生成英文维权信。不构成法律意见。",
  icons: {
    icon: [
      {
        url: "/brand/logo-mark.png",
        type: "image/png",
        sizes: "512x512",
      },
    ],
    apple: "/brand/logo-mark.png",
  },
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: "/",
    siteName: "押金侠 BondBack",
    title: "押金侠 BondBack｜房东乱扣 Bond？先别认栽",
    description:
      "上传扣款清单和入住报告，AI 按 NSW/VIC 租赁法逐项比对，指出哪几笔不该扣、凭哪条法规，并生成英文申诉信。信息辅助，不构成法律意见。",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "押金侠 BondBack —— 按 NSW / VIC 租赁法逐项比对押金扣款",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "押金侠 BondBack｜房东乱扣 Bond？先别认栽",
    description:
      "上传扣款清单和入住报告，AI 按 NSW/VIC 租赁法逐项比对，指出哪几笔不该扣、凭哪条法规，并生成英文申诉信。",
    images: ["/og.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#14110f", // token-ok: --ink 的字面值，浏览器 chrome 取不到 CSS 变量
  /**
   * 锁定浅色（design-tokens.md §4.4）：微信安卓版会对未声明适配的网页强制反色，
   * 会把「墨蓝 + 金 + 印章红」整套配色毁掉，而用户全都在微信里打开链接。
   * 走 viewport 而不是手写 <head>，由 Next 保证标签只出现一次。
   */
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${notoSansSc.variable} ${anton.variable} ${plexMono.variable} h-full antialiased`}
    >
      {/*
        思源宋体 900 是这一版标题的签名字面，但 next/font 拿不到它的汉字子集，
        只能走 Google 的 css2（汉字按 unicode-range 切成上百个小块，浏览器只下
        标题里真正用到的那几块）。拉不到也不会坏：`--font-display` 后面还挂着
        Songti SC / SimSun 的系统宋体链。
      */}
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* 规则针对的是 pages/_document 时代的「只对单页生效」问题；
            这里是 App Router 的根布局，全站共用一次，不适用 */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@700;900&display=swap"
        />
      </head>
      <body className="flex min-h-dvh flex-col bg-paper text-ink">
        {/* 会话内存挂在根布局，/wizard → /result 之间不丢；刷新即清空 */}
        <CaseSessionProvider>
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </CaseSessionProvider>
      </body>
    </html>
  );
}
