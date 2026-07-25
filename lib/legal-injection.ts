/**
 * 法条注入与白名单解析（03a §2/§3）。
 *
 * 两个职责：
 * 1. 按州 + 纠纷类型 + `asOf` 日期门筛出 `confirmed` 法条，渲染成 prompt 文本块；
 * 2. 把模型回吐的法条引用**解析回注入清单里的原始条目** —— 解析不到就丢弃，
 *    解析得到就用注入值整条覆盖（act/section/quote/sourceUrl 全部来自
 *    `data/legal/**`，模型改写的一律作废）。
 *
 * 军规：法条引用宁缺毋错。这里只可能输出注入清单里存在的条目，不可能凭空造。
 */

import { getConfirmedLegalClauses } from "@/data/legal";
import type { LegalClause } from "@/data/legal/types";
import type { AUState, DisputeType, StatuteRef } from "@/lib/types";

/** 模型输出的候选引用（未经校验）。 */
export interface StatuteCandidate {
  id?: string | null;
  act?: string | null;
  section?: string | null;
  quote?: string | null;
}

export interface LegalContext {
  state: AUState;
  /** 本次注入的 confirmed 法条，白名单就是它 */
  clauses: LegalClause[];
  byId: Map<string, LegalClause>;
  /** 归一化 act+section → 条目；同键冲突时置 null（歧义即丢弃） */
  byActSection: Map<string, LegalClause | null>;
  bySection: Map<string, LegalClause | null>;
}

function normalizeKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

/** "s 51(3)(c)" → "51"；"ss 411(1A)–(1B)" → "411"；"Sch 2 Pt 1" → "2" */
function primaryNumber(section: string): string | null {
  const match = section.match(/(\d+[A-Za-z]*)/);
  return match ? match[1]!.toLowerCase() : null;
}

/** 括号里的层级路径："s 51(2)(a), (3)(c)" → "2a3c" */
function subPath(section: string): string {
  return (section.match(/\(([0-9a-zA-Z]+)\)/g) ?? [])
    .join("")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function setOrConflict(
  map: Map<string, LegalClause | null>,
  key: string,
  clause: LegalClause,
): void {
  if (!key) return;
  const existing = map.get(key);
  if (existing === undefined) {
    map.set(key, clause);
    return;
  }
  if (existing && existing.id !== clause.id) map.set(key, null);
}

/**
 * 注入哪些法条：纠纷类型对应的条目 + 永远带上 bond 主题
 *（本产品每个 case 都是押金争议，s 162/163/165 这类程序条款一律要在白名单里）。
 * `disputeTypes` 为空时不做主题过滤，取该州全部 confirmed 条目。
 */
export function selectLegalContext(
  state: AUState,
  disputeTypes: DisputeType[],
  asOf?: string,
): LegalContext {
  const topics: DisputeType[] =
    disputeTypes.length === 0
      ? []
      : Array.from(new Set<DisputeType>([...disputeTypes, "bond"]));

  const clauses = getConfirmedLegalClauses(state, topics, asOf);

  const byId = new Map<string, LegalClause>();
  const byActSection = new Map<string, LegalClause | null>();
  const bySection = new Map<string, LegalClause | null>();

  for (const clause of clauses) {
    byId.set(clause.id.toLowerCase(), clause);
    setOrConflict(
      byActSection,
      `${normalizeKey(clause.act)}|${normalizeKey(clause.section)}`,
      clause,
    );
    setOrConflict(bySection, normalizeKey(clause.section), clause);
  }

  return { state, clauses, byId, byActSection, bySection };
}

/** 注入条目 → 契约里的 `StatuteRef`（逐字复制，唯一合法的构造入口）。 */
export function statuteRefFromClause(clause: LegalClause): StatuteRef {
  return {
    act: clause.act,
    section: clause.section,
    quote: clause.quote,
    sourceUrl: clause.sourceUrl,
  };
}

/**
 * 把模型的候选引用解析回注入清单。解析顺序：
 * 1. `id` 精确命中（prompt 里要求模型抄 id，最可靠）
 * 2. 归一化 act+section 精确命中
 * 3. 归一化 section 精确命中
 * 4. 条号 + 子款路径打分，唯一最高分才算命中
 *    （模型常把 "s 51(2)(a), (3)(c)" 写成 "s 51(3)(c)"，这一步救回来）
 *
 * 任何一步都只可能命中注入清单内的条目；命中不了返回 null，调用方丢弃。
 */
export function resolveClause(
  context: LegalContext,
  candidate: StatuteCandidate,
): LegalClause | null {
  const id = candidate.id?.trim().toLowerCase();
  if (id) {
    const byId = context.byId.get(id);
    if (byId) return byId;
  }

  const section = candidate.section?.trim();
  if (!section) return null;

  const act = candidate.act?.trim() ?? "";
  if (act) {
    const exact = context.byActSection.get(
      `${normalizeKey(act)}|${normalizeKey(section)}`,
    );
    if (exact) return exact;
  }

  const sectionOnly = context.bySection.get(normalizeKey(section));
  if (sectionOnly) return sectionOnly;

  const number = primaryNumber(section);
  if (!number) return null;
  const path = subPath(section);

  let best: LegalClause | null = null;
  let bestScore = 0;
  let tied = false;

  for (const clause of context.clauses) {
    if (primaryNumber(clause.section) !== number) continue;
    const clausePath = subPath(clause.section);
    const score = path && clausePath.includes(path) ? 70 : 50;
    if (score > bestScore) {
      best = clause;
      bestScore = score;
      tied = false;
    } else if (score === bestScore && best && best.id !== clause.id) {
      tied = true;
    }
  }

  return tied ? null : best;
}

/** 供信件使用：按 id 取注入条目（拿不到就返回 null，宁缺毋错）。 */
export function clauseById(
  context: LegalContext,
  id: string,
): LegalClause | null {
  return context.byId.get(id.toLowerCase()) ?? null;
}

/**
 * 渲染进 prompt 的法条清单。模型只准从这里引用，并被要求抄 `id`。
 */
export function renderStatuteCatalog(context: LegalContext): string {
  return context.clauses
    .map((clause) => {
      const lines = [
        `[${clause.id}] ${clause.act} — ${clause.section}`,
        `  QUOTE: "${clause.quote}"`,
        `  含义: ${clause.ruleZh}`,
      ];
      if (clause.notes) lines.push(`  注意: ${clause.notes}`);
      return lines.join("\n");
    })
    .join("\n\n");
}
