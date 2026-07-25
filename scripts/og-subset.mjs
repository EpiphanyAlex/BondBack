/**
 * 按 `make-og.mjs` 里 OG_TEXT 实际用到的字，重新拉一份 Noto Sans SC 子集
 * 到 `scripts/og-fonts/`（各 ~16KB）。改了 OG 文案就跑 `pnpm og:sub && pnpm og`，
 * 否则新字没进子集会渲染成豆腐块，而且**不会报错**。
 *
 * 用 Google Fonts 的 `text=` 参数做子集；UA 报成不支持 woff2 的旧 Safari，
 * 拿到的是 woff —— satori 直接吃 woff，不用再转 ttf。
 */

import { writeFile } from "node:fs/promises";

import { OG_TEXT } from "./make-og.mjs";

/** 旧 Safari：不支持 woff2，Google 会回退给 woff */
const LEGACY_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_6_8) AppleWebKit/534.30 (KHTML, like Gecko) Version/5.1 Safari/534.30";

const chars = [...new Set(Object.values(OG_TEXT).join(""))].sort().join("");

for (const weight of [400, 700]) {
  const cssUrl =
    `https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@${weight}` +
    `&text=${encodeURIComponent(chars)}`;

  const css = await fetch(cssUrl, { headers: { "user-agent": LEGACY_UA } }).then(
    (r) => r.text(),
  );

  const fontUrl = css.match(/https:\/\/[^)]+/)?.[0];
  if (!fontUrl) throw new Error(`没从 CSS 里找到字体 URL（weight ${weight}）`);

  const data = Buffer.from(
    await fetch(fontUrl).then((r) => r.arrayBuffer()),
  );
  const out = new URL(`./og-fonts/noto-sc-${weight}.ttf`, import.meta.url);
  await writeFile(out, data);
  console.log(`✓ weight ${weight} → ${(data.length / 1024).toFixed(1)}KB`);
}

console.log(`共 ${chars.length} 个字符：${chars}`);
