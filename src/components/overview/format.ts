// Formatting helpers for the Overview screen. Calendar dates are plain
// YYYY-MM-DD strings handled in UTC, so nothing here reads the clock.

const DAY_MS = 86_400_000;

function utc(isoDate: string): number {
  const [y, m, d] = isoDate.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

const dateFormat = (options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" });

const LONG_DAY = dateFormat({ weekday: "long", month: "long", day: "numeric" });
const MONTH_DAY = dateFormat({ month: "short", day: "numeric" });
const MONTH = dateFormat({ month: "short" });

/** "Friday, October 30" */
export const longDay = (isoDate: string) => LONG_DAY.format(utc(isoDate));

/** "Nov 18" */
export const monthDay = (isoDate: string) => MONTH_DAY.format(utc(isoDate));

/** "Nov" */
export const monthShort = (isoDate: string) => MONTH.format(utc(isoDate));

/** Day of the month, 1–31. */
export const dayOfMonth = (isoDate: string) => Number(isoDate.slice(8, 10));

/** Whole days from one date to another. */
export const daysBetween = (from: string, to: string) => Math.round((utc(to) - utc(from)) / DAY_MS);

/** "19 days", "1 day" */
export const dayCount = (n: number) => `${n} ${n === 1 ? "day" : "days"}`;

/** Market cap in USD: "4.59T", "407.2B", "12.4M". */
export function compactUsd(v: number): string {
  if (v >= 1e12) return `${(v / 1e12).toFixed(2)}T`;
  if (v >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
  return `${(v / 1e6).toFixed(1)}M`;
}
