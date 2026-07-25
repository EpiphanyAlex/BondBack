/**
 * 模型常量与全局开关 —— 换模型只改这里（docs/plan.md 已钉死供应商为 OpenAI）。
 * 这些常量只在服务端 API route 使用，key 绝不进客户端 bundle。
 *
 * gpt-5.x 系列用 `max_completion_tokens` + `reasoning_effort`，**不要写 `max_tokens`**。
 */

/** 上传瞬间的字段预填（只求快，vision） */
export const EXTRACT_MODEL = "gpt-5.4-nano";

/** 读证据出 `EvidenceFact[]` —— 产品命门。升级梯子：gpt-5.6-terra → gpt-5.6-sol */
export const FACTS_MODEL = "gpt-5.6-luna";

/** 对照法条出逐项结论与信件段落（只吃文本事实，不发图片） */
export const ANALYZE_MODEL = "gpt-5.6-luna";

/** 降级梯子：真出事时按序回退，改这里一处即可 */
export const FALLBACK_MODELS = ["gpt-5.1", "gpt-4.1"] as const;

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
