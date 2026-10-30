// Screening logic: threshold metadata, filtering, sorting, medians and cell
// formatting. Pure functions; a live data layer can reuse them as `screen()`.

import { MINUS, num, signed } from "@/lib/format";
import {
  SCREEN_STOCKS,
  type MetricKey,
  type ScreenFilters,
  type ScreenSort,
  type ScreenStock,
  type SortKey,
} from "@/lib/mock/screener";

export type MetricDef = {
  label: string;
  /** "min" rows keep stocks at or above the value (≥), "max" at or below (≤). */
  bound: "min" | "max";
  unit: "%" | "×";
  step: number;
  get: (s: ScreenStock) => number;
};

export const METRICS: Record<MetricKey, MetricDef> = {
  revGrowth: { label: "Revenue growth (YoY)", bound: "min", unit: "%", step: 1, get: (s) => s.revGrowth },
  grossMargin: { label: "Gross margin", bound: "min", unit: "%", step: 1, get: (s) => s.grossMargin },
  roic: { label: "ROIC", bound: "min", unit: "%", step: 1, get: (s) => s.roic },
  fwdPe: { label: "Forward P/E", bound: "max", unit: "×", step: 1, get: (s) => s.fwdPe },
  netDebtEbitda: { label: "Net debt / EBITDA", bound: "max", unit: "×", step: 0.1, get: (s) => s.netDebtEbitda },
  dividendYield: { label: "Dividend yield", bound: "min", unit: "%", step: 0.1, get: (s) => s.dividendYield },
  dividendGrowth: { label: "Dividend growth (5y)", bound: "min", unit: "%", step: 1, get: (s) => s.dividendGrowth },
  offHigh: {
    label: "Below 52-week high",
    bound: "max",
    unit: "%",
    step: 1,
    get: (s) => ((s.high52 - s.price) / s.high52) * 100,
  },
};

/** Rows "Add filter" can append to a screen. */
export const EXTRA_METRICS: MetricKey[] = ["dividendYield", "dividendGrowth", "offHigh"];

/** Input text → threshold, or null when blank or not a number (no limit). */
export function parseThreshold(text: string): number | null {
  const t = text.trim().replace(MINUS, "-").replace(",", ".");
  if (t === "") return null;
  const v = Number(t);
  return Number.isFinite(v) ? v : null;
}

export function thresholdAria(key: MetricKey): string {
  const m = METRICS[key];
  return `${m.label} ${m.bound === "min" ? "minimum" : "maximum"}`;
}

const SORT_VALUE: Record<SortKey, (s: ScreenStock) => number | string> = {
  company: (s) => s.symbol,
  industry: (s) => s.industry,
  price: (s) => s.price,
  today: (s) => s.changePct,
  cap: (s) => s.marketCap,
  pe: (s) => s.fwdPe,
  growth: (s) => s.revGrowth,
  gm: (s) => s.grossMargin,
  roic: (s) => s.roic,
  range: (s) => s.rangePos,
  trend: (s) => s.trend,
};

/** Direction a column sorts in first: text and P/E ascending, the rest descending. */
export function defaultDir(key: SortKey): ScreenSort["dir"] {
  return key === "company" || key === "industry" || key === "pe" ? "asc" : "desc";
}

/** Options of the "Sort by" select; the design's four come first. */
export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "roic", label: "ROIC" },
  { value: "growth", label: "Revenue growth" },
  { value: "pe", label: "Forward P/E" },
  { value: "cap", label: "Market cap" },
  { value: "gm", label: "Gross margin" },
  { value: "today", label: "Today" },
  { value: "price", label: "Price" },
  { value: "range", label: "52-week range" },
  { value: "trend", label: "3 months" },
  { value: "company", label: "Symbol" },
  { value: "industry", label: "Industry" },
];

/** Stocks that pass every filter, in sort order. */
export function runScreen(
  filters: ScreenFilters,
  sort: ScreenSort,
  watched: readonly string[],
  stocks: readonly ScreenStock[] = SCREEN_STOCKS,
): ScreenStock[] {
  const limits = filters.thresholds
    .map((t) => ({ m: METRICS[t.key], v: parseThreshold(t.value) }))
    .filter((l): l is { m: MetricDef; v: number } => l.v !== null);
  const list = stocks.filter((s) => {
    if (filters.universe === "sp500" && !s.sp500) return false;
    if (filters.universe === "watchlist" && !watched.includes(s.symbol)) return false;
    if (filters.caps.length && !filters.caps.includes(s.capBucket)) return false;
    if (filters.sectors.length && !filters.sectors.includes(s.sector)) return false;
    return limits.every(({ m, v }) => (m.bound === "min" ? m.get(s) >= v : m.get(s) <= v));
  });
  const value = SORT_VALUE[sort.key];
  const sign = sort.dir === "asc" ? 1 : -1;
  return list.sort((a, b) => {
    const x = value(a);
    const y = value(b);
    const c = typeof x === "string" ? x.localeCompare(y as string) : x - (y as number);
    return c !== 0 ? c * sign : a.symbol.localeCompare(b.symbol);
  });
}

/** Median as in the design script: mean of the two middle values when even. */
export function median(values: number[]): number | null {
  if (!values.length) return null;
  const v = [...values].sort((a, b) => a - b);
  const m = Math.floor(v.length / 2);
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
}

/** "4.59T" / "143.1B" from $B. */
export function fmtCap(b: number): string {
  return b >= 1000 ? (b / 1000).toFixed(2) + "T" : b.toFixed(1) + "B";
}

/** "72.9%", "−1.8%". */
export function fmtPct1(v: number): string {
  return (v < 0 ? MINUS : "") + Math.abs(v).toFixed(1) + "%";
}

/** "+54.6%", "−1.4%". */
export function fmtGrowth(v: number): string {
  return signed(v, 1) + "%";
}

export function fmtPrice(v: number): string {
  return num(v, 2);
}

export function fmtPe(v: number): string {
  return (v < 0 ? MINUS : "") + Math.abs(v).toFixed(1);
}

// ── Columns ─────────────────────────────────────────────────────────────────

export type ColumnKey = SortKey | "watch";

export type ColumnDef = {
  key: ColumnKey;
  label: string;
  /** grid-template-columns track, as in the design markup. */
  track: string;
  align: "left" | "right";
  /** Always shown (not offered by "Choose columns"). */
  fixed?: boolean;
};

export const COLUMNS: ColumnDef[] = [
  { key: "company", label: "Company", track: "minmax(170px,1.6fr)", align: "left", fixed: true },
  { key: "industry", label: "Industry", track: "minmax(110px,1fr)", align: "left" },
  { key: "price", label: "Price", track: "72px", align: "right" },
  { key: "today", label: "Today", track: "70px", align: "right" },
  { key: "cap", label: "Mkt cap", track: "70px", align: "right" },
  { key: "pe", label: "Fwd P/E", track: "62px", align: "right" },
  { key: "growth", label: "Rev growth", track: "76px", align: "right" },
  { key: "gm", label: "Gross m.", track: "70px", align: "right" },
  { key: "roic", label: "ROIC", track: "60px", align: "right" },
  { key: "range", label: "52-week range", track: "112px", align: "left" },
  { key: "trend", label: "3 months", track: "84px", align: "left" },
  { key: "watch", label: "Watch", track: "40px", align: "left", fixed: true },
];

/** CSV of the matches, for "Export results". */
export function toCsv(rows: readonly ScreenStock[]): string {
  const head = [
    "Symbol",
    "Company",
    "Industry",
    "Sector",
    "Price",
    "Today %",
    "Market cap ($B)",
    "Fwd P/E",
    "Revenue growth %",
    "Gross margin %",
    "ROIC %",
    "Net debt / EBITDA",
    "52-week low",
    "52-week high",
  ];
  const cell = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = rows.map((s) =>
    [
      s.symbol,
      s.name,
      s.industry,
      s.sector,
      s.price.toFixed(2),
      s.changePct.toFixed(2),
      s.marketCap.toFixed(1),
      s.fwdPe.toFixed(1),
      s.revGrowth.toFixed(1),
      s.grossMargin.toFixed(1),
      s.roic.toFixed(1),
      s.netDebtEbitda.toFixed(1),
      s.low52.toFixed(2),
      s.high52.toFixed(2),
    ]
      .map(cell)
      .join(","),
  );
  return [head.join(","), ...lines].join("\n") + "\n";
}
