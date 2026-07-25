/**
 * 押金侠的角色形象位（稿子 §01 第 1 幕右格、§03 分析中右栏）。
 *
 * 画师的图还没到，所以这里先摆一个**明显是占位**的斜纹框：写清楚这一格要什么
 * （全身 / 半身、什么姿势、透明底 PNG），而不是留一片空白让人以为布局塌了。
 *
 * 图到了之后**只改调用点的一行**：给 `src` 传路径（放 `public/`），
 * 占位框自动让位，尺寸与位置都不用动。
 *
 * 用原生 `<img>` 而不是 `next/image`：这些图是设计交付的固定资源，
 * 尺寸由容器决定，走 `next/image` 反而要为每处配 sizes/fill。
 */

import { cx } from "@/components/result/utils";

export interface CharacterSlotProps {
  /** 画师的图（放 `public/`，如 `/character/hero.png`）。给了就渲染图，占位框退场 */
  src?: string;
  alt?: string;
  /** 占位框上的说明：这一格要的是哪一张 */
  briefZh: string;
  className?: string;
}

export function CharacterSlot({
  src,
  alt = "押金侠",
  briefZh,
  className,
}: CharacterSlotProps) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        className={cx("h-full w-full object-contain", className)}
      />
    );
  }

  return (
    <div
      className={cx(
        "hatch flex items-center justify-center border border-seal/40 px-6 py-10 text-center",
        className,
      )}
      // 占位框对读屏用户没有信息，图到了之后才有
      aria-hidden="true"
    >
      <p className="font-mono text-caption whitespace-pre-line text-verdict-unlawful-on-dark">
        {briefZh}
      </p>
    </div>
  );
}
