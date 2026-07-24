# 00 · 脚手架与首次部署（任务 1 · 2h）

> 军规精神：**先有链接再有产品**。本模块唯一目标是让一个公网链接活着。

## 范围

- Next.js（App Router, TypeScript, Tailwind CSS）+ pnpm 初始化
- 全局布局壳：移动优先视口、基础主题 token（颜色/字体在 04 打磨前用占位方案，但结构留好）
- 页面路由占位：`/`（首页）、`/wizard`（向导）、`/result`（结果页）、`/sample`(示例)
- 页脚免责声明组件（全站常驻）：「本工具提供信息辅助，不构成法律意见」
- Vercel 项目创建 + 环境变量 `OPENAI_API_KEY`（仅服务端）+ 首次部署
- `data/legal/`、`data/sample-case/` 目录骨架与类型文件占位

## 验收标准

- [ ] 公网 URL 可直接访问，手机打开无横向滚动、无布局崩坏
- [ ] 免责声明页脚在所有页面可见
- [ ] `OPENAI_API_KEY` 只存在于 Vercel 环境变量与 `.env.local`（已 gitignore），git 历史零泄漏
- [ ] `pnpm dev` / `pnpm build` 本地通过；push 触发 Vercel 自动部署

## 不做

- 任何业务逻辑、AI 调用、真实 UI 视觉（视觉在写 UI 前调 `frontend-design` 技能定方向）

## 依赖与阻塞

- 需要用户执行 `vercel login`（交互式，一次性）
