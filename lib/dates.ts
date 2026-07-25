/**
 * 日期工具 —— 一律使用 `YYYY-MM-DD` 字符串，内部按 UTC 解析，避免本地时区把
 * 日期算差一天。存管期限计算依赖这里，所以保持纯函数、可单测。
 */

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(value: unknown): value is string {
  if (typeof value !== "string" || !ISO_DATE.test(value)) return false;
  const parsed = parseIsoDate(value);
  return parsed !== null && toIsoDate(parsed) === value;
}

export function parseIsoDate(value: string): Date | null {
  if (!ISO_DATE.test(value)) return null;
  const time = Date.parse(`${value}T00:00:00Z`);
  return Number.isNaN(time) ? null : new Date(time);
}

export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export function addMonths(date: Date, months: number): Date {
  const next = new Date(date.getTime());
  const targetMonth = next.getUTCMonth() + months;
  const dayOfMonth = next.getUTCDate();
  next.setUTCDate(1);
  next.setUTCMonth(targetMonth);
  // 月末溢出保护：1/31 + 1 个月 → 2/28 或 2/29
  const daysInTargetMonth = new Date(
    Date.UTC(next.getUTCFullYear(), next.getUTCMonth() + 1, 0),
  ).getUTCDate();
  next.setUTCDate(Math.min(dayOfMonth, daysInTargetMonth));
  return next;
}

/** 当月最后一天（NSW s 162 中介规则的起算点）。 */
export function endOfMonth(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0),
  );
}

/**
 * 全国性固定日期公共假日（含顺延观察日）。复活节等浮动假日不在此列 ——
 * 存管判断另有安全缓冲（见 lib/bond-lodgement.ts），宁可少判也不错判。
 */
function fixedHolidaysFor(year: number): Set<string> {
  const dates = [
    `${year}-01-01`, // New Year's Day
    `${year}-01-26`, // Australia Day
    `${year}-04-25`, // Anzac Day
    `${year}-12-25`, // Christmas Day
    `${year}-12-26`, // Boxing Day
  ];

  const holidays = new Set<string>();
  for (const iso of dates) {
    holidays.add(iso);
    // 落在周末的假日通常顺延到下一个工作日
    const date = parseIsoDate(iso)!;
    const weekday = date.getUTCDay();
    if (weekday === 6) holidays.add(toIsoDate(addDays(date, 2)));
    if (weekday === 0) holidays.add(toIsoDate(addDays(date, 1)));
  }
  return holidays;
}

const holidayCache = new Map<number, Set<string>>();

function isBusinessDay(date: Date): boolean {
  const weekday = date.getUTCDay();
  if (weekday === 0 || weekday === 6) return false;

  const year = date.getUTCFullYear();
  let holidays = holidayCache.get(year);
  if (!holidays) {
    holidays = fixedHolidaysFor(year);
    holidayCache.set(year, holidays);
  }
  return !holidays.has(toIsoDate(date));
}

/**
 * 起算日之后的第 n 个工作日（起算日当天不计）。
 * 只排除周末与全国性固定假日，州假日未覆盖 —— 结果一律按「估算」表述。
 */
export function addBusinessDays(date: Date, days: number): Date {
  let cursor = date;
  let remaining = days;
  while (remaining > 0) {
    cursor = addDays(cursor, 1);
    if (isBusinessDay(cursor)) remaining -= 1;
  }
  return cursor;
}

export function maxDate(...dates: Date[]): Date {
  return dates.reduce((latest, current) =>
    current.getTime() > latest.getTime() ? current : latest,
  );
}

/** 供 UI 展示的中文日期，如 2026-07-25 → 2026年7月25日。 */
export function formatIsoDateZh(value: string): string {
  const date = parseIsoDate(value);
  if (!date) return value;
  return `${date.getUTCFullYear()}年${date.getUTCMonth() + 1}月${date.getUTCDate()}日`;
}

/** 今天（按州时区），格式 YYYY-MM-DD。 */
export function todayIsoDate(timeZone = "Australia/Sydney"): string {
  const parts = new Intl.DateTimeFormat("en-AU", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}
