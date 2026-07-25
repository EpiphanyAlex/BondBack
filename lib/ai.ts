/**
 * 模型常量与全局开关 —— 换模型只改这里（docs/plan.md 已钉死供应商为 OpenAI）。
 * 这些常量只在服务端 API route 使用，key 绝不进客户端 bundle。
 */

/** 图片 / PDF 页字段提取、截图识别 */
export const EXTRACT_MODEL = "gpt-4o-mini";

/** 胜算评估 + 维权信生成（03 使用） */
export const ANALYZE_MODEL = "gpt-4o";

/** 送模型的最大图片数：控 token 与延迟 */
export const EXTRACT_MAX_IMAGES = 4;

/** 请求体上限（base64 dataUrl 体积），超限直接返回空结果而不是报错 */
export const EXTRACT_MAX_PAYLOAD_BYTES = 8 * 1024 * 1024;

/**
 * 成本刹车：Vercel env 设 `AI_ENABLED=false` 即可一键停掉所有真实调用
 *（示例页是静态数据，不受影响）。
 */
export function isAiEnabled(): boolean {
  return process.env.AI_ENABLED !== "false" && Boolean(process.env.OPENAI_API_KEY);
}
