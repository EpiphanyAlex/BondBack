import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Geist, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { SiteFooter } from "@/components/site-footer";
import { CaseSessionProvider } from "@/lib/case-session";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

/** 展示体：只给大标题与钱数 */
const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["600", "800"],
});

/** 等宽体：法条编号、日期这类「代号」 */
const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "押金侠 BondBack｜租房押金维权助手",
  description:
    "面向澳洲 NSW / VIC 租客的信息辅助工具：三步向导整理证据、评估胜算、生成英文维权信。不构成法律意见。",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#12212f", // token-ok: --ink 的字面值，浏览器 chrome 取不到 CSS 变量
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
      className={`${geistSans.variable} ${bricolage.variable} ${plexMono.variable} h-full antialiased`}
    >
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
