#!/usr/bin/env node
/**
 * design token 自查（docs/design-tokens.md §6）。
 *
 * 扫四类违规：
 *   1. 任意字号 / 非 7 档字号（text-[15px]、text-sm、text-2xl …）
 *   2. 禁用断点（sm: / xl: / 2xl:，已在 @theme 中删除，写了也不生效）
 *   3. .ts(x) 里的硬编码 #hex 颜色（材质色只许留在 globals.css 的 :root）
 *   4. 行内 ms 时长（时长走 --duration-*，Tailwind 侧只许 duration-150 / duration-300）
 *
 * 封版前必须跑一次并清零：pnpm check:tokens
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const SCAN_DIRS = ["app", "components", "lib", "data"];
const EXTENSIONS = [".ts", ".tsx"];

/**
 * 排版尺度只有 7 档：hero / title / section / body / label / caption / micro。
 * 其余一律违规 —— Tailwind 自带档位也要按 §1 对照表收编。
 */
const TAILWIND_TEXT_SIZES =
  "xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl";

const RULES = [
  {
    id: "arbitrary-text-size",
    label: "任意字号",
    hint: "改用 7 档之一：text-hero / title / section / body / label / caption / micro",
    // text-[15px] / text-[0.8rem]；text-[var(--x)] 这类颜色写法不在此列
    pattern: /\btext-\[[^\]]*(?:px|rem|em|pt|%)[^\]]*\]/g,
  },
  {
    id: "off-scale-text-size",
    label: "非 7 档字号",
    hint: "见 docs/design-tokens.md §1 的旧值收编对照表",
    pattern: new RegExp(`\\btext-(?:${TAILWIND_TEXT_SIZES})\\b`, "g"),
  },
  {
    id: "banned-breakpoint",
    label: "禁用断点",
    hint: "只有 md: 与 lg:，sm:/xl:/2xl: 已在 @theme 中设为 initial",
    pattern: /(?<![\w-])(?:sm|xl|2xl):(?=[a-z[])/g,
  },
  {
    id: "hardcoded-hex",
    label: "硬编码颜色",
    hint: "改用语义 token（verdict-* / amount / alert-* / evidence-*）",
    pattern: /#[0-9a-fA-F]{3,8}\b/g,
  },
  {
    id: "inline-duration",
    label: "行内时长",
    hint: "时长走 var(--duration-quick|settle|sweep|beat)；Tailwind 侧只许 duration-150 / duration-300",
    pattern: /(?<![\w-])\d+ms\b|\bduration-(?!150\b|300\b)[\w[]+/g,
  },
];

/** 收字距的 tracking-[…] 已内建进 text-micro，单列一条软提醒 */
const TRACKING_PATTERN = /\btracking-\[[^\]]+\]/g;

/**
 * 唯一逃生舱：行尾写 `// token-ok: 理由`。
 * 只给**非 UI 层**的真实例外（canvas 填充色、浏览器 chrome 色这类拿不到 CSS 变量的地方）。
 * 业务组件里想用它 = 用错了，去查语义 token。
 */
const OPT_OUT = /token-ok:/;

/** 整行注释不参与扫描 —— 契约文件里会把 token 名字写进注释解释用途 */
const COMMENT_LINE = /^\s*(?:\/\/|\/\*|\*)/;

function walk(dir) {
  const out = [];
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (entry === "node_modules" || entry.startsWith(".")) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...walk(full));
    } else if (EXTENSIONS.some((ext) => entry.endsWith(ext))) {
      out.push(full);
    }
  }
  return out;
}

const files = SCAN_DIRS.flatMap((dir) => walk(join(ROOT, dir)));
const violations = [];
const warnings = [];

for (const file of files) {
  const rel = relative(ROOT, file);
  const lines = readFileSync(file, "utf8").split("\n");

  lines.forEach((line, index) => {
    if (OPT_OUT.test(line) || COMMENT_LINE.test(line)) return;

    for (const rule of RULES) {
      rule.pattern.lastIndex = 0;
      const matches = line.match(rule.pattern);
      if (!matches) continue;
      for (const match of matches) {
        violations.push({
          file: rel,
          line: index + 1,
          rule: rule.label,
          hint: rule.hint,
          match,
        });
      }
    }

    const tracking = line.match(TRACKING_PATTERN);
    if (tracking) {
      for (const match of tracking) {
        warnings.push({ file: rel, line: index + 1, match });
      }
    }
  });
}

if (warnings.length > 0) {
  console.log(`\n提醒：${warnings.length} 处任意字距（0.14em 已内建进 text-micro）`);
  for (const item of warnings) {
    console.log(`  ${item.file}:${item.line}  ${item.match}`);
  }
}

if (violations.length === 0) {
  console.log(`\n✓ design token 自查通过（扫描 ${files.length} 个文件，零违规）\n`);
  process.exit(0);
}

const byRule = new Map();
for (const item of violations) {
  if (!byRule.has(item.rule)) byRule.set(item.rule, []);
  byRule.get(item.rule).push(item);
}

console.error(`\n✗ design token 自查发现 ${violations.length} 处违规\n`);
for (const [rule, items] of byRule) {
  console.error(`【${rule}】${items.length} 处 —— ${items[0].hint}`);
  for (const item of items) {
    console.error(`  ${item.file}:${item.line}  ${item.match}`);
  }
  console.error("");
}
console.error("详见 docs/design-tokens.md\n");
process.exit(1);
