/**
 * 申诉信 PDF（03b §4）—— 客户端用 jspdf 排纯文本英文信。
 *
 * 为什么不嵌中文字体：信的正文全是英文，中文对照解释**不进 PDF**（PRD 明确要求）。
 * 嵌一份 CJK 字体要多打包几 MB，在微信里打开会明显变慢，收益为零。
 *
 * 这个模块只被点击事件动态 import，jspdf 不进首屏 bundle。
 */

import { jsPDF } from "jspdf";

const PAGE_MARGIN = 56;
const FONT_SIZE = 10.5;
const LINE_HEIGHT = 14.5;
/** 空行不占满一整行，收紧一点更像正式信件 */
const BLANK_LINE_HEIGHT = 8;

export interface LetterPdfOptions {
  /** 不含扩展名；缺省用日期拼 */
  fileName?: string;
  /** 页脚右下角的小字，缺省为产品名 + 免责声明 */
  footNote?: string;
}

/**
 * jspdf 的标准字体只认 WinAnsi：中文与全角标点会变成乱码方块。
 * 常见的排版字符先降级成 ASCII，其余非 Latin-1 字符直接丢掉 ——
 * 宁可少一个字符，也不要在寄给房东的信里出现方块。
 */
function toLatin(text: string): string {
  const normalized = text
    .replace(/[‘’‚‛]/g, "'")
    .replace(/[“”„‟]/g, '"')
    .replace(/[–—―]/g, "-")
    .replace(/…/g, "...")
    .replace(/ /g, " ")
    .replace(/[　，：；]/g, " ");

  let out = "";
  for (const char of normalized) {
    const code = char.codePointAt(0) ?? 0;
    if (char === "\n" || (code >= 0x20 && code <= 0xff)) out += char;
  }
  return out;
}

function todayStamp(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function buildLetterPdf(
  letterEn: string,
  options: LetterPdfOptions = {},
): jsPDF {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const textWidth = pageWidth - PAGE_MARGIN * 2;
  const bottom = pageHeight - PAGE_MARGIN;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(FONT_SIZE);
  doc.setLineHeightFactor(1.35);

  let y = PAGE_MARGIN;

  const newPage = () => {
    doc.addPage();
    doc.setFont("helvetica", "normal");
    doc.setFontSize(FONT_SIZE);
    y = PAGE_MARGIN;
  };

  for (const rawLine of toLatin(letterEn).split("\n")) {
    const line = rawLine.replace(/\s+$/, "");

    if (!line) {
      y += BLANK_LINE_HEIGHT;
      continue;
    }

    const wrapped: string[] = doc.splitTextToSize(line, textWidth);
    for (const piece of wrapped) {
      if (y + LINE_HEIGHT > bottom) newPage();
      doc.text(piece, PAGE_MARGIN, y, { baseline: "top" });
      y += LINE_HEIGHT;
    }
  }

  const note =
    options.footNote ??
    "Prepared with BondBack. Information tool only - not legal advice.";
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.setFontSize(8);
    doc.text(toLatin(note), PAGE_MARGIN, pageHeight - PAGE_MARGIN + 22, {
      baseline: "top",
    });
    doc.text(`${page} / ${pages}`, pageWidth - PAGE_MARGIN, pageHeight - PAGE_MARGIN + 22, {
      baseline: "top",
      align: "right",
    });
  }

  return doc;
}

/**
 * 触发下载。iPhone Safari 与微信内置浏览器对 blob 下载限制不同，
 * `save()` 失败时退到新开标签页；两条路都不通时返回 false，
 * 由调用方提示用户改用「复制全文」。
 */
export async function downloadLetterPdf(
  letterEn: string,
  options: LetterPdfOptions = {},
): Promise<boolean> {
  const doc = buildLetterPdf(letterEn, options);
  const fileName = `${options.fileName ?? `bondback-letter-${todayStamp()}`}.pdf`;

  try {
    await doc.save(fileName, { returnPromise: true });
    return true;
  } catch {
    try {
      const url = doc.output("bloburl") as unknown as string;
      const opened = window.open(url, "_blank");
      return Boolean(opened);
    } catch {
      return false;
    }
  }
}
