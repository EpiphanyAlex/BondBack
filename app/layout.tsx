import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { SiteFooter } from "@/components/site-footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "押金侠 BondBack｜租房押金维权助手",
  description:
    "面向澳洲 NSW / VIC 租客的信息辅助工具：三步向导整理证据、评估胜算、生成英文维权信。不构成法律意见。",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={`${geistSans.variable} h-full antialiased`}>
      <body className="flex min-h-dvh flex-col bg-background text-foreground">
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
