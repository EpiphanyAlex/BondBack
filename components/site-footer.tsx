/**
 * 全站页脚。军规：「不构成法律意见」这句必须常驻。
 *
 * 稿子里页脚是墨黑面上的一条细线分栏（首页收尾幕、结果页底部都是这个形态），
 * 所以这里也跟着走墨黑 —— 米白页面滚到底收在一条深色上，整站才有收口。
 */

import { BrandLockup } from "@/components/brand-lockup";

export function SiteFooter() {
  return (
    <footer className="bg-ink text-paper">
      <div className="mx-auto flex w-full max-w-[1152px] flex-col gap-3 px-4 py-6 md:flex-row md:items-center md:justify-between md:px-6">
        <p className="text-caption text-paper/50">
          本工具提供信息辅助，不构成法律意见。重大纠纷请咨询律师或所在州租客服务机构。
        </p>
        <div className="flex shrink-0 items-center gap-3">
          <BrandLockup compact />
          <p className="font-mono text-micro text-paper/35">
            数据仅在本次会话内使用 · 不做存储
          </p>
        </div>
      </div>
    </footer>
  );
}
