"use client";

/**
 * 客户端图片压缩 —— 长边 ≤1568px、JPEG q0.8（docs/plan.md 钉死），
 * 目的是控住 vision 请求的 token 与体积。全部在浏览器完成，图片不落盘。
 */

export const MAX_IMAGE_EDGE = 1568;
export const IMAGE_QUALITY = 0.8;

/** 单个原始文件的体积上限，超过直接跳过（不报错、不阻塞）。 */
export const MAX_SOURCE_FILE_BYTES = 15 * 1024 * 1024;

/** 一次会话允许保留的证据张数上限 */
export const MAX_EVIDENCE_IMAGES = 8;

export interface CompressedImage {
  dataUrl: string;
  mimeType: string;
  width: number;
  height: number;
}

function scaledSize(width: number, height: number) {
  const longEdge = Math.max(width, height);
  if (longEdge <= MAX_IMAGE_EDGE) return { width, height };
  const ratio = MAX_IMAGE_EDGE / longEdge;
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  };
}

async function decode(file: Blob): Promise<CanvasImageSource & { width: number; height: number }> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file);
    } catch {
      // 某些浏览器对 HEIC / 损坏文件会抛错，退回 <img> 解码再试一次
    }
  }

  const url = URL.createObjectURL(file);
  try {
    return await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("图片解码失败"));
      image.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function drawToJpegDataUrl(
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
): CompressedImage {
  const { width, height } = scaledSize(sourceWidth, sourceHeight);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) throw new Error("canvas 不可用");

  // 白底：截图常带透明通道，转 JPEG 后会变黑
  context.fillStyle = "#ffffff"; // token-ok: canvas 底色，非 UI 配色
  context.fillRect(0, 0, width, height);
  context.drawImage(source, 0, 0, width, height);

  return {
    dataUrl: canvas.toDataURL("image/jpeg", IMAGE_QUALITY),
    mimeType: "image/jpeg",
    width,
    height,
  };
}

/** 压缩失败时抛错，调用方负责静默跳过该文件。 */
export async function compressImageFile(file: Blob): Promise<CompressedImage> {
  const bitmap = await decode(file);
  try {
    return drawToJpegDataUrl(bitmap, bitmap.width, bitmap.height);
  } finally {
    if (typeof ImageBitmap !== "undefined" && bitmap instanceof ImageBitmap) {
      bitmap.close();
    }
  }
}

/** 粗略估算 dataUrl 的字节数（base64 每 4 字符 ≈ 3 字节）。 */
export function dataUrlBytes(dataUrl: string): number {
  const commaIndex = dataUrl.indexOf(",");
  const base64 = commaIndex >= 0 ? dataUrl.slice(commaIndex + 1) : dataUrl;
  return Math.floor((base64.length * 3) / 4);
}
