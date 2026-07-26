"use client";

/**
 * 给 `html-to-image` 用的 `@font-face` 内联 CSS —— **只取同源样式表**。
 *
 * 为什么要自己算这一份：
 *
 * `toPng` 把 DOM 塞进一个 SVG `foreignObject`，再当作 `<img>` 画到 canvas 上。
 * 那个 img 是独立的文档上下文，加载不了任何外部资源，所以字体必须先内联成
 * data URI —— 否则战报卡上那个 Anton 的 `$1,120` 会掉回 Helvetica，签名就没了。
 *
 * 它默认的做法是遍历 `document.styleSheets` 收集 `@font-face`。但本站在
 * `app/layout.tsx` 里挂着一张 Google Fonts 的表（思源宋体 900 的汉字子集，
 * next/font 拿不到，只能走 css2）。那是**跨源且没有 CORS 头**的样式表，
 * 读它的 `cssRules` 必然抛 `SecurityError`，控制台每次截图都红一次。
 *
 * 两条路都不好走：
 * - 给那个 `<link>` 加 `crossorigin` 能让它变得可读，但 css2 返回的 CJK 字体是
 *   按 unicode-range 切成上百块的，一旦可读，截图时就会去 fetch 上百个 woff2，
 *   一张卡要等好几秒。
 * - `skipFonts: true` 干净，但连 Anton 和等宽体一起丢掉。
 *
 * 所以取中间：**同源的自托管拉丁字体照嵌，Google 那张表根本不碰**。
 *
 * 同时顺手治了一个更贵的老问题（改之前就在，只是没人量过）：同源那张表里有
 * **429 条 `@font-face`**，绝大多数是 Noto Sans SC 按 unicode-range 切出来的
 * 汉字块。它默认全都要嵌，实测一次截图要拉 **426 个 woff2、共 17.4 MB**，
 * 生成一份 23.6 MB 的 CSS 串 —— 而全部用户都在微信里、多半是移动数据。
 * 加上下面这条白名单后是 **18 个文件、134 KB**。
 *
 * 白名单的判据不是「哪些好看」，是**哪些在别人机器上根本不存在**：
 * `globals.css` 里 `--font-number`(Anton) 与 `--font-mono`(IBM Plex Mono) 后面
 * 挂的都是通用族，不嵌就真的没有；而 `--font-sans` 与 `--font-display` 后面
 * 各自挂着 PingFang SC / Songti SC 这些系统中文字体 —— 何况 PNG 是在**作者本机**
 * 栅格化的，落到系统字仍然是一份正经的中文字，不会出豆腐块。
 * 将来再自托管一款拉丁字体，往这个数组里加一行，理由见上。
 *
 * 任何一步失败都只是少嵌一个字体，绝不让战报卡生不出来。
 */

/** 只嵌这两款：自托管、纯拉丁、别人机器上没有（判据见文件头注释）。 */
const SELF_HOSTED_LATIN = ["anton", "ibm plex mono"];

function isSelfHostedLatin(rule: CSSFontFaceRule): boolean {
  const family = rule.style.fontFamily.replace(/["']/g, "").trim().toLowerCase();
  return SELF_HOSTED_LATIN.includes(family);
}

/** `url("…")` / `url(…)`，把里面那个地址抠出来 */
const URL_IN_CSS = /url\((['"]?)([^'")]+)\1\)/g;

async function toDataUrl(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    return await new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/** 把一条 `@font-face` 里的所有 url() 换成 data URI；换不动的原样留着 */
async function inlineUrls(cssText: string, baseHref: string): Promise<string> {
  const jobs: Promise<[string, string | null]>[] = [];
  for (const match of cssText.matchAll(URL_IN_CSS)) {
    const raw = match[2]!;
    if (raw.startsWith("data:")) continue;
    const absolute = new URL(raw, baseHref).href;
    jobs.push(toDataUrl(absolute).then((data) => [raw, data]));
  }

  let out = cssText;
  for (const [raw, data] of await Promise.all(jobs)) {
    if (data) out = out.split(raw).join(data);
  }
  return out;
}

/**
 * 收齐同源表里的 `@font-face` 并内联。
 * 返回空串也是合法结果：`html-to-image` 只看 `!= null`，空串同样能让它
 * 跳过自己那趟遍历（也就跳过了 SecurityError）。
 */
export async function sameOriginFontEmbedCSS(): Promise<string> {
  if (typeof document === "undefined") return "";

  const faces: { cssText: string; baseHref: string }[] = [];

  for (const sheet of Array.from(document.styleSheets)) {
    // 跨源表直接跳过 —— 不是「读了再 catch」，是压根不读，控制台才干净
    if (sheet.href && !sheet.href.startsWith(window.location.origin)) continue;
    let rules: CSSRuleList;
    try {
      rules = sheet.cssRules;
    } catch {
      // 理论上到不了这里（同源），留个兜底免得一张表毁掉整张卡
      continue;
    }
    for (const rule of Array.from(rules)) {
      if (rule instanceof CSSFontFaceRule && isSelfHostedLatin(rule)) {
        faces.push({
          cssText: rule.cssText,
          baseHref: sheet.href ?? window.location.href,
        });
      }
    }
  }

  const inlined = await Promise.all(
    faces.map((face) => inlineUrls(face.cssText, face.baseHref)),
  );
  return inlined.join("\n");
}
