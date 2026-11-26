// Calendar days travel as "yyyy-MM-dd" strings (the format of <input type="date"> and of the API).
// Such strings sort like dates, so they are compared as plain strings.

const ISO_DAY = /^(\d{4})-(\d{2})-(\d{2})$/;

// A date in the local time zone of the server, not in UTC (toISOString would give yesterday after midnight).
export function toIsoDay(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function todayIso(now: Date = new Date()): string {
  return toIsoDay(now);
}

export function firstDayOfMonthIso(now: Date = new Date()): string {
  return toIsoDay(new Date(now.getFullYear(), now.getMonth(), 1));
}

// Returns the value when it is a real calendar day ("2026-02-30" is not), otherwise null.
export function parseIsoDay(raw: string | undefined): string | null {
  const match = raw === undefined ? null : ISO_DAY.exec(raw);
  if (!match) return null;

  const [, year, month, day] = match.map(Number);
  const date = new Date(year, month - 1, day);
  const isRealDay = date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  return isRealDay ? raw! : null;
}

// Query string values are a string, a list (parameter repeated) or missing: keep the first string.
export function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
