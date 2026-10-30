// Screening logic: threshold metadata, filtering, sorting, medians and cell
// formatting. Pure functions; a live data layer can reuse them as `screen()`.

import { MINUS, num, signed } from "@/lib/format";
import {
  CAP_BUCKETS,
  SCREEN_STOCKS,
  SECTORS,
  type MetricKey,
  type ScreenFilters,
  type ScreenQuery,
  type ScreenRow,
  type ScreenSort,
  type ScreenStock,
  type SortKey,
} from "@/lib/mock/screener";

/** Rows per results page. */
export const PAGE_SIZE = 12;

export type MetricDef = {
  /** Row label. Added rows also carry a remove button, so keep theirs short. */
  label: string;
  /** Longer name for the "Add filter" menu, when the label leaves things out. */
  menuLabel?: string;
  /** Menu name with live data, when TradingView measures it differently. */
  liveMenuLabel?: string;
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
  dividendGrowth: {
    label: "Dividend growth",
    menuLabel: "Dividend growth (5-yr)",
    // TradingView has no 5-year dividend growth rate, only the latest year's.
    liveMenuLabel: "Dividend growth (1-yr)",
    bound: "min",
    unit: "%",
    step: 1,
    get: (s) => s.dividendGrowth,
  },
  offHigh: {
    label: "Off 52-week high",
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

/** Columns live data can't sort by (TradingView has no 52-week range position). */
export const LIVE_UNSORTABLE: readonly SortKey[] = ["range"];

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

/** Thresholds, chips and sort in canonical order, the form live screens are cached under. */
export function toQuery(
  filters: ScreenFilters,
  sort: ScreenSort,
  page: number,
  watched: readonly string[],
): ScreenQuery {
  const limits: ScreenQuery["limits"] = [];
  for (const t of filters.thresholds) {
    const value = parseThreshold(t.value);
    if (value !== null && !limits.some((l) => l.key === t.key)) limits.push({ key: t.key, value });
  }
  limits.sort((a, b) => a.key.localeCompare(b.key));
  return {
    universe: filters.universe,
    caps: CAP_BUCKETS.filter((c) => filters.caps.includes(c)),
    sectors: SECTORS.filter((s) => filters.sectors.includes(s)),
    limits,
    sort: { key: sort.key, dir: sort.dir },
    page,
    watched: filters.universe === "watchlist" ? [...new Set(watched)].sort() : [],
  };
}

export function queryKey(q: ScreenQuery): string {
  return JSON.stringify(q);
}

/** The same screen on another page or in another order: same matches and medians. */
export function filtersKey(q: ScreenQuery): string {
  return JSON.stringify({ ...q, sort: null, page: null });
}

/** "18", "5,321". */
export function fmtCount(n: number): string {
  return n.toLocaleString("en-US");
}

/** "4.59T" / "143.1B" / "745M" / "8.2M" from $B. */
export function fmtCap(b: number): string {
  if (b >= 1000) return (b / 1000).toFixed(2) + "T";
  if (b >= 1) return b.toFixed(1) + "B";
  const m = b * 1000;
  return m.toFixed(m >= 10 ? 0 : 1) + "M";
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
  /** Narrowest width of `track`, px. */
  min: number;
  /** Tighter track (and its minimum) for when even the essential columns run out of room. */
  tight: { track: string; min: number };
  align: "left" | "right";
  /** Always shown (not offered by "Choose columns"). */
  fixed?: boolean;
};

function col(
  key: ColumnKey,
  label: string,
  track: string,
  min: number,
  align: ColumnDef["align"],
  tight?: [track: string, min: number],
  fixed?: boolean,
): ColumnDef {
  return { key, label, track, min, tight: tight ? { track: tight[0], min: tight[1] } : { track, min }, align, fixed };
}

// Tight minimums fit the widest value (or header) in the sample universe.
export const COLUMNS: ColumnDef[] = [
  col("company", "Company", "minmax(170px,1.6fr)", 170, "left", ["minmax(120px,1.6fr)", 120], true),
  col("industry", "Industry", "minmax(110px,1fr)", 110, "left"),
  col("price", "Price", "72px", 72, "right", ["minmax(60px,72px)", 60]),
  col("today", "Today", "70px", 70, "right", ["minmax(46px,70px)", 46]),
  col("cap", "Mkt cap", "70px", 70, "right", ["minmax(48px,70px)", 48]),
  col("pe", "Fwd P/E", "62px", 62, "right", ["minmax(46px,62px)", 46]),
  col("growth", "Rev growth", "76px", 76, "right", ["minmax(62px,76px)", 62]),
  col("gm", "Gross m.", "70px", 70, "right", ["minmax(50px,70px)", 50]),
  col("roic", "ROIC", "60px", 60, "right", ["minmax(42px,60px)", 42]),
  col("range", "52-week range", "112px", 112, "left"),
  col("trend", "3 months", "84px", 84, "left"),
  col("watch", "Watch", "40px", 40, "left", undefined, true),
];

/** Row geometry from the design: 10px column gap, 4px side padding. */
const COLUMN_GAP = 10;
const ROW_PADDING = 8;

/** Below the split width these columns give way, in this order, when the table runs out of room. */
export const AUTO_HIDE: ColumnKey[] = ["industry", "range", "trend", "pe"];

export function gridTemplate(cols: readonly ColumnDef[], tight = false): string {
  return cols.map((c) => (tight ? c.tight.track : c.track)).join(" ");
}

/** Width the rows need to show `cols` without scrolling, px. */
function neededWidth(cols: readonly ColumnDef[]): number {
  return cols.reduce((w, c) => w + c.min, 0) + COLUMN_GAP * (cols.length - 1) + ROW_PADDING;
}

/**
 * How the table narrows below the split width. Each step applies while the
 * table is narrower than `below` px (steps are cumulative): first the
 * AUTO_HIDE columns go, one per step, then the remaining columns tighten.
 */
export type FitStep = { below: number; hide?: ColumnKey; template: string };

export function fitSteps(visible: readonly ColumnDef[]): FitStep[] {
  const steps: FitStep[] = [];
  let cols = visible;
  for (const key of AUTO_HIDE) {
    if (!cols.some((c) => c.key === key)) continue;
    const below = neededWidth(cols);
    cols = cols.filter((c) => c.key !== key);
    steps.push({ below, hide: key, template: gridTemplate(cols) });
  }
  steps.push({ below: neededWidth(cols), template: gridTemplate(cols, true) });
  return steps;
}

/** CSV of the matches, for "Export results". Missing values are left empty. */
export function toCsv(rows: readonly ScreenRow[]): string {
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
  const cell = (v: string | null) => {
    const s = v ?? "";
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const fixed = (v: number | null, digits: number) => (v === null ? null : v.toFixed(digits));
  const lines = rows.map((s) =>
    [
      s.symbol,
      s.name,
      s.industry,
      s.sector,
      fixed(s.price, 2),
      fixed(s.changePct, 2),
      fixed(s.marketCap, 1),
      fixed(s.fwdPe, 1),
      fixed(s.revGrowth, 1),
      fixed(s.grossMargin, 1),
      fixed(s.roic, 1),
      fixed(s.netDebtEbitda, 1),
      fixed(s.low52, 2),
      fixed(s.high52, 2),
    ]
      .map(cell)
      .join(","),
  );
  return [head.join(","), ...lines].join("\n") + "\n";
}
