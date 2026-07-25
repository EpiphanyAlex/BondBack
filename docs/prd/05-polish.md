# 05 · 打磨保险（任务 6）

> 母文档 §5。目标不是加功能，是**堵住演示与传播中的翻车口**。

## 清单

### 移动端 / 微信（传播主战场）

- [ ] 微信内置浏览器实测走全流程（iOS + Android 至少各一）
- [ ] **微信安卓深色模式实测**：`color-scheme: light` 生效，配色未被强制反色
- [x] 微信链接卡片：OG meta（标题 = 一句话标题、描述 = 简介、缩略图）——链接在群里甩出来必须好看
- [x] PDF 下载在微信内的兜底提示（「点右上角 → 浏览器打开」）+ 复制全文按钮可用
- [x] iPhone Safari 底部工具栏不遮挡账本条主 CTA（代码侧 `env(safe-area-inset-bottom)`；真机待验）

### 响应式与视觉一致性

- [x] **360px 宽度**：账本条不溢出、全站无横向滚动
- [x] **≥1024px**：首页 hero 双栏、结果页/示例页双栏且右栏 sticky 正常
- [x] **`pnpm check:tokens` 零违规**（任意字号、禁用断点、硬编码 hex、行内 ms）
- [x] 三档结论在任何页面都同时有图标 + 颜色 + 中文标签（不只靠颜色）

### 防刷与成本

- [x] `/api/*` 简单限流：按 IP 内存计数（serverless 尽力而为即可）+ 单次请求体积上限
- [x] `AI_ENABLED=false` 全局开关实测：一键只留示例模式，`/sample` 不受影响
- [x] 图片上传前客户端压缩（控 token 成本与请求体积）

### 兜底与观感

- [x] AI 调用失败/超时 → 体面降级文案 + 重试；绝不白屏
- [x] **两段真实进度动画顺滑**，中途失败时能指出失败在哪一段并可单独重试
- [x] 免责声明全站在；对外文案通读一遍，去掉绝对化承诺（「帮你拿回」→ 辅助定位；战报卡不得写「追回」）
- [x] API route `maxDuration` 配置到位，杜绝平台默认超时截断
- [x] 示例页所有人名/地址/机构名确认为虚构

## 已落地的做法（2026-07-25）

**OG 卡片**：`public/og.png` 是 `pnpm og` 在本地烤好的**静态图**（`scripts/make-og.mjs`，next/og + `scripts/og-fonts/` 里的 Noto Sans SC 子集），不是动态路由 —— 微信抓取器不跑 JS 且超时短，CDN 直出最稳，也不用给函数塞一份中文字体。改 OG 文案要跑 `pnpm og:sub && pnpm og`，不然新字渲染成豆腐块**且不会报错**。

微信在聊天里把缩略图**居中裁成正方形**，所以图上「押金侠」三个字是居中的，裁完照样认得出。`metadataBase` 在预览部署上走 `VERCEL_URL`，正式环境走 `lib/site.ts` 的 `SITE_URL`（战报卡二维码永远指向后者）。

**请求体积上限**：`lib/rate-limit.ts` 的 `bodyTooLarge()` 在 `request.json()` **之前**看 `content-length`。analyze 2MB（只吃文本）/ extract 12MB / facts 16MB。超限走各自的静默降级：analyze 返 413，facts、extract 返 200 + `payload-too-large` 诊断码。

**验证方式**：headless Chrome + CDP 量 `documentElement.scrollWidth`，`/`、`/wizard`、`/sample`、`/result` 在 360 / 768 / 1280 三档下横向溢出均为 0；账本条灌进 `$999,999.99` 仍是 360px 整宽。`AI_ENABLED=false` 起服务实测：facts / extract 返 `ai-disabled`，analyze 返 `burden-shift` 完整结果，`/sample` 全程不受影响。

## 只有真机能验的三件事

headless 与桌面浏览器都测不出来，必须在手机上走一遍：

1. **微信安卓深色模式**会不会强制反色（`color-scheme: light` 是否真的挡住了）
2. **战报卡长按能不能保存** —— 卡片是 `data:` URL 的 `<img>`（已确认真的转成了 `<img>`，1074×1431），但部分安卓微信对 `data:` URI 的「保存图片」支持不全；旁边的「下载图片」是兜底
3. **PDF 下载**在微信内是不是必须靠「复制全文」兜底

## 验收标准

以上清单全勾。此模块完成 = 具备封版资格。
