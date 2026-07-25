/**
 * 尽力而为的内存限流 —— 无数据库（军规），单实例内有效，够比赛用。
 * serverless 冷启动会清空计数，这是已知且可接受的取舍。
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/** 防止长跑实例内存无限增长 */
const MAX_BUCKETS = 5000;

export interface RateLimitResult {
  ok: boolean;
  /** 本窗口剩余次数 */
  remaining: number;
  /** 距离窗口重置的秒数 */
  retryAfterSeconds: number;
}

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now: number = Date.now(),
): RateLimitResult {
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    if (buckets.size >= MAX_BUCKETS) {
      for (const [k, v] of buckets) {
        if (v.resetAt <= now) buckets.delete(k);
      }
      if (buckets.size >= MAX_BUCKETS) buckets.clear();
    }
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  bucket.count += 1;
  const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));

  if (bucket.count > limit) {
    return { ok: false, remaining: 0, retryAfterSeconds };
  }

  return { ok: true, remaining: limit - bucket.count, retryAfterSeconds };
}

/**
 * 请求体积闸门 —— 在 `request.json()` **之前**看 `content-length`，
 * 免得把几十 MB 的 base64 先解成内存里的字符串再嫌它大。
 *
 * 没有 `content-length`（chunked 传输）时放行：真实体积由各 route 自己的
 * 逐图上限兜底，这里只挡住明摆着超标的那一类。
 *
 * 本地 `next start` 下，route 不读 body 就返回会让还在上传的客户端收到
 * ECONNRESET 而不是这个响应体 —— Vercel 会先把请求缓冲完再调函数，线上没这回事。
 */
export function bodyTooLarge(headers: Headers, maxBytes: number): boolean {
  const raw = headers.get("content-length");
  if (!raw) return false;
  const size = Number(raw);
  return Number.isFinite(size) && size > maxBytes;
}

/** 取客户端 IP：Vercel 走 x-forwarded-for，本地退化为固定键。 */
export function clientKeyFromHeaders(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return headers.get("x-real-ip") ?? "local";
}
