"use client";

/**
 * lease PDF → 图片（客户端）。服务端不解析 PDF（docs/plan.md 钉死）：
 * 只把前几页渲染成 JPEG，再走和照片完全相同的 vision 识别管线。
 *
 * 失败一律抛错，由调用方静默回退手填 —— 永不阻塞流程。
 */

import { drawToJpegDataUrl, MAX_IMAGE_EDGE, type CompressedImage } from "@/lib/image";

/** 前几页足够覆盖押金金额、地址、租期等关键字段 */
export const PDF_MAX_PAGES = 3;

type PdfJsModule = typeof import("pdfjs-dist");

let pdfjsPromise: Promise<PdfJsModule> | null = null;

async function loadPdfjs(): Promise<PdfJsModule> {
  if (!pdfjsPromise) {
    pdfjsPromise = import("pdfjs-dist").then((pdfjs) => {
      // worker 与主包同源打包，不依赖 CDN（微信内置浏览器可能拦外链）
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url,
      ).toString();
      return pdfjs;
    });
  }
  return pdfjsPromise;
}

export interface PdfPageImage extends CompressedImage {
  /** 1-based 页码，写进 EvidenceImage.sourcePage */
  pageNumber: number;
}

function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  return canvas;
}

export async function pdfToImages(
  file: Blob,
  maxPages: number = PDF_MAX_PAGES,
): Promise<PdfPageImage[]> {
  const pdfjs = await loadPdfjs();
  const buffer = await file.arrayBuffer();
  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(buffer) });

  try {
    const pdf = await loadingTask.promise;
    const pageCount = Math.min(pdf.numPages, maxPages);
    const images: PdfPageImage[] = [];

    for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const baseViewport = page.getViewport({ scale: 1 });
      // 直接渲染到目标尺寸，避免先大后小的二次采样糊字
      const fitScale =
        MAX_IMAGE_EDGE / Math.max(baseViewport.width, baseViewport.height);
      const viewport = page.getViewport({
        scale: Math.min(2, Math.max(fitScale, 0.5)),
      });

      const canvas = createCanvas(viewport.width, viewport.height);
      const context = canvas.getContext("2d");
      if (context) {
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
      }

      await page.render({ canvas, viewport }).promise;
      page.cleanup();

      images.push({
        ...drawToJpegDataUrl(canvas, canvas.width, canvas.height),
        pageNumber,
      });
    }

    return images;
  } finally {
    await loadingTask.destroy();
  }
}
