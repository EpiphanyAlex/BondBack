/**
 * 站点绝对地址 —— 战报卡二维码扫出来的那个地址。
 *
 * 卡片会被转发到群里，二维码**永远指向正式域名**，不能跟着预览部署跑。
 * 换域名只改这一处。OG meta 的基准地址在 `app/layout.tsx`（预览部署要用预览域名）。
 */
export const SITE_URL = "https://bond-back-yanzhuo-lius-projects.vercel.app";
