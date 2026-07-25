/**
 * 站点绝对地址 —— 战报卡二维码扫出来的那个地址。
 *
 * 卡片会被转发到群里，二维码**永远指向正式域名**，不能跟着预览部署跑。
 * 换域名只改这一处。OG meta 的基准地址在 `app/layout.tsx`（预览部署要用预览域名）。
 *
 * 用短的那个 production alias：`bond-back-psi` 比 `bond-back-yanzhuo-lius-projects`
 * 少 17 个字符，二维码少一档模块数 —— 卡上只显示 88px，别人举着手机扫屏幕时差别看得见。
 * 两个域名指向同一份生产部署，长的那个仍然可用。
 */
export const SITE_URL = "https://bond-back-psi.vercel.app";
