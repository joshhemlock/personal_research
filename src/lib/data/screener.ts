import "server-only";

// Live Screener: runs a screen on TradingView's scanner (the backend of its
// own stock screener). Filtering, sorting, paging and the match count happen
// there; this module maps the Screener's filters to scanner fields and the
// answer back to the rows the table shows. Every request is cached.

import { cacheLife } from "next/cache";
import { METRICS, PAGE_SIZE, SORT_OPTIONS, median, queryKey, toQuery } from "@/components/screener/screen";
import { linePath } from "@/lib/mock/gen";
import {
  CAP_BUCKETS,
  DEFAULT_WATCHED,
  SAVED_SCREENS,
  SECTORS,
  UNIVERSES,
  type CapBucket,
  type LiveScreener,
  type MetricKey,
  type ScreenPage,
  type ScreenQuery,
  type ScreenRow,
  type Sector,
  type SortKey,
} from "@/lib/mock/screener";
import { marketDate, marketDateOf } from "./clock";
import { getDailyBars, shortName } from "./market";
import { isSample } from "./source";
import { numOrNull, scan, strOrNull, type ScanFilter } from "./tradingview/scanner";

/** Medians are taken over at most this many matches (the largest by market cap). */
const MEDIAN_CAP = 300;
/** Most rows "Export results" downloads, in the screen's sort order. */
const EXPORT_CAP = 1000;
/** Daily bars fetched for a 3-month sparkline (≈ 63 sessions, plus slack). */
const SPARK_BARS = 70;

// ── Fields ──────────────────────────────────────────────────────────────────

const CAP = "market_cap_basic";
// `price_earnings_forward_fy` comes back empty for every US stock; the non-GAAP
// forward P/E (next fiscal year, analysts' consensus) is filled and filterable.
const FWD_PE = "non_gaap_price_to_earnings_per_share_forecast_next_fy";

const METRIC_FIELDS: Record<Exclude<MetricKey, "offHigh">, string> = {
  revGrowth: "total_revenue_yoy_growth_ttm",
  grossMargin: "gross_margin_ttm",
  roic: "return_on_invested_capital_fq",
  fwdPe: FWD_PE,
  netDebtEbitda: "net_debt_to_ebitda_fq",
  dividendYield: "dividends_yield_current",
  // Latest fiscal year's growth in dividends per share; there is no 5-year rate.
  dividendGrowth: "dps_common_stock_prim_issue_yoy_growth_fy",
};

const SORT_FIELDS: Record<SortKey, string | null> = {
  company: "name",
  industry: "industry",
  price: "close",
  today: "change",
  cap: CAP,
  pe: FWD_PE,
  growth: METRIC_FIELDS.revGrowth,
  gm: METRIC_FIELDS.grossMargin,
  roic: METRIC_FIELDS.roic,
  // No field holds the position in the 52-week range.
  range: null,
  trend: "Perf.3M",
};

const ROW_COLUMNS = [
  "name", "description", "sector", "industry", "close", "change", CAP, FWD_PE, METRIC_FIELDS.revGrowth,
  METRIC_FIELDS.grossMargin, METRIC_FIELDS.roic, METRIC_FIELDS.netDebtEbitda, "price_52_week_low",
  "price_52_week_high", "Perf.3M",
] as const;

const MEDIAN_COLUMNS = [FWD_PE, METRIC_FIELDS.revGrowth, METRIC_FIELDS.grossMargin, METRIC_FIELDS.roic] as const;

// ── Universe, size and sector ───────────────────────────────────────────────

/** Common stock and depositary receipts; no preferreds, units, ETFs or closed-end funds. */
const SHARES: ScanFilter[] = [
  { left: "type", operation: "in_range", right: ["stock", "dr"] },
  { left: "subtype", operation: "not_in_range", right: ["preferred", "unit", "etf", "closedend"] },
];

const US_LISTED: ScanFilter[] = [{ left: "exchange", operation: "in_range", right: ["NYSE", "NASDAQ"] }, ...SHARES];

/** Market-cap buckets, $: [from, below]. */
const CAP_RANGES: Record<CapBucket, [number, number]> = {
  Mega: [200e9, Infinity],
  Large: [10e9, 200e9],
  Mid: [2e9, 10e9],
  Small: [300e6, 2e9],
};

const CAP_HELP: Record<CapBucket, string> = {
  Mega: "Market cap $200B and up",
  Large: "Market cap $10B–$200B",
  Mid: "Market cap $2B–$10B",
  Small: "Market cap $300M–$2B",
};

/**
 * TradingView classifies companies by its own sectors and industries (from
 * FactSet), not GICS: Boeing is "Electronic Technology", Alphabet and Meta
 * "Technology Services". The Screener's sectors are GICS-like, so each one is
 * a list of TradingView industries. Utilities, materials (Process Industries,
 * Non-Energy Minerals), real estate and funds belong to none of the chips.
 * Known misfits: chip-equipment makers AMAT and LRCX are "Industrial
 * Machinery", so they count as Industrials.
 */
const SECTOR_INDUSTRIES: Record<Sector, string[]> = {
  Technology: [
    "Semiconductors", "Electronic Components", "Electronic Equipment/Instruments", "Electronic Production Equipment",
    "Computer Processing Hardware", "Computer Peripherals", "Computer Communications", "Telecommunications Equipment",
    "Packaged Software", "Information Technology Services", "Data Processing Services", "Electronics Distributors",
  ],
  Communication: [
    "Internet Software/Services", "Major Telecommunications", "Wireless Telecommunications",
    "Specialty Telecommunications", "Cable/Satellite TV", "Broadcasting", "Movies/Entertainment", "Media Conglomerates",
    "Publishing: Newspapers", "Publishing: Books/Magazines", "Advertising/Marketing Services",
  ],
  "Health care": [
    "Pharmaceuticals: Major", "Pharmaceuticals: Other", "Pharmaceuticals: Generic", "Biotechnology",
    "Medical Specialties", "Managed Health Care", "Hospital/Nursing Management", "Medical/Nursing Services",
    "Services to the Health Industry", "Medical Distributors", "Drugstore Chains",
  ],
  Consumer: [
    "Motor Vehicles", "Automotive Aftermarket", "Electronics/Appliances", "Home Furnishings", "Homebuilding",
    "Recreational Products", "Tools & Hardware", "Other Consumer Specialties", "Apparel/Footwear",
    "Beverages: Alcoholic", "Beverages: Non-Alcoholic", "Consumer Sundries", "Food: Major Diversified",
    "Food: Meat/Fish/Dairy", "Food: Specialty/Candy", "Household/Personal Care", "Tobacco", "Casinos/Gaming",
    "Hotels/Resorts/Cruise lines", "Restaurants", "Other Consumer Services", "Apparel/Footwear Retail",
    "Catalog/Specialty Distribution", "Department Stores", "Discount Stores", "Electronics/Appliance Stores",
    "Food Retail", "Home Improvement Chains", "Internet Retail", "Specialty Stores", "Food Distributors",
  ],
  Financials: [
    "Major Banks", "Regional Banks", "Savings Banks", "Investment Banks/Brokers", "Investment Managers",
    "Financial Conglomerates", "Finance/Rental/Leasing", "Insurance Brokers/Services", "Life/Health Insurance",
    "Multi-Line Insurance", "Property/Casualty Insurance", "Specialty Insurance", "Financial Publishing/Services",
  ],
  Industrials: [
    "Aerospace & Defense", "Industrial Machinery", "Electrical Products", "Building Products", "Auto Parts: OEM",
    "Trucks/Construction/Farm Machinery", "Industrial Conglomerates", "Metal Fabrication",
    "Miscellaneous Manufacturing", "Office Equipment/Supplies", "Engineering & Construction",
    "Environmental Services", "Air Freight/Couriers", "Airlines", "Marine Shipping", "Railroads", "Trucking",
    "Other Transportation", "Miscellaneous Commercial Services", "Personnel Services", "Commercial Printing/Forms",
    "Wholesale Distributors",
  ],
  Energy: [
    "Integrated Oil", "Oil & Gas Production", "Oil Refining/Marketing", "Coal", "Oilfield Services/Equipment",
    "Contract Drilling", "Oil & Gas Pipelines",
  ],
};

const SECTOR_HELP = Object.fromEntries(
  SECTORS.map((s) => [s, `TradingView industries: ${SECTOR_INDUSTRIES[s].join(", ")}`]),
) as Record<Sector, string>;

/** S&P 500 members' TradingView ids. Index membership is a "symbolset", which scan() doesn't send. */
async function sp500Members(): Promise<string[]> {
  "use cache";
  cacheLife("days");
  const res = await fetch("https://scanner.tradingview.com/global/scan", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ columns: ["name"], symbols: { symbolset: ["SYML:SP;SPX"] }, range: [0, 1000] }),
    signal: AbortSignal.timeout(12_000),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`TradingView scanner answered ${res.status}`);
  const json = (await res.json()) as { data?: { s: string }[] };
  if (!json.data?.length) throw new Error("TradingView sent no S&P 500 members");
  return json.data.map((r) => r.s);
}

/** Where to look: the universe, as scanner arguments. Null when it is empty. */
type Scope = { markets?: string[]; tickers?: string[]; filter: ScanFilter[] };

async function universeScope(q: ScreenQuery): Promise<Scope | null> {
  switch (q.universe) {
    case "us":
      return { markets: ["america"], filter: US_LISTED };
    case "sp500":
      return { tickers: await sp500Members(), filter: [] };
    case "watchlist":
      if (!q.watched.length) return null;
      return {
        markets: ["america"],
        filter: [
          { left: "name", operation: "in_range", right: q.watched },
          // Tickers are unique across US exchanges; OTC listings are left out.
          { left: "exchange", operation: "in_range", right: ["NYSE", "NASDAQ", "AMEX", "CBOE"] },
          ...SHARES,
        ],
      };
  }
}

/** Selected buckets as one range, minus any unselected bucket inside it (filters only AND). */
function capFilters(caps: CapBucket[]): ScanFilter[] {
  if (!caps.length) return [];
  const from = Math.min(...caps.map((c) => CAP_RANGES[c][0]));
  const below = Math.max(...caps.map((c) => CAP_RANGES[c][1]));
  const out: ScanFilter[] = [{ left: CAP, operation: "egreater", right: from }];
  if (below !== Infinity) out.push({ left: CAP, operation: "less", right: below });
  for (const b of CAP_BUCKETS) {
    const [lo, hi] = CAP_RANGES[b];
    if (!caps.includes(b) && lo >= from && hi <= below) out.push({ left: CAP, operation: "not_in_range", right: [lo, hi - 1] });
  }
  return out;
}

function sectorFilters(sectors: Sector[]): ScanFilter[] {
  if (!sectors.length) return [];
  return [{ left: "industry", operation: "in_range", right: sectors.flatMap((s) => SECTOR_INDUSTRIES[s]) }];
}

function limitFilters(limits: ScreenQuery["limits"]): ScanFilter[] {
  return limits.flatMap(({ key, value }): ScanFilter[] => {
    if (key === "offHigh") {
      // At most N% below the 52-week high: close > high × (1 − N/100). "above%"
      // compares two fields; it is a scanner operation ScanFilter doesn't list.
      return [
        { left: "close", operation: "above%" as ScanFilter["operation"], right: ["price_52_week_high", 1 - value / 100] },
      ];
    }
    const field = METRIC_FIELDS[key];
    if (METRICS[key].bound === "min") return [{ left: field, operation: "egreater", right: value }];
    const max: ScanFilter = { left: field, operation: "eless", right: value };
    // A P/E ceiling means profitable companies under it, not losses.
    return key === "fwdPe" ? [{ left: field, operation: "greater", right: 0 }, max] : [max];
  });
}

// ── Scans (cached) ──────────────────────────────────────────────────────────

type Spec = Scope;
type Sort = { sortBy: string; sortOrder: "asc" | "desc" };
/** Rows with their TradingView ids ("NASDAQ:NVDA"), which the chart feed needs. */
type ScanRows = { total: number; rows: { id: string; row: ScreenRow }[] };

async function scanRows(spec: Spec, sort: Sort, offset: number, limit: number): Promise<ScanRows> {
  "use cache";
  cacheLife("minutes");
  const { total, rows } = await scan({ columns: ROW_COLUMNS, ...spec, sort, range: [offset, offset + limit] });
  return {
    total,
    rows: rows.flatMap(({ tvSymbol, values }) => {
      const row = toRow(values);
      return row ? [{ id: tvSymbol, row }] : [];
    }),
  };
}

function toRow(v: Record<(typeof ROW_COLUMNS)[number], unknown>): ScreenRow | null {
  const price = numOrNull(v.close);
  if (price === null) return null;
  const symbol = String(v.name);
  const cap = numOrNull(v[CAP]);
  const low52 = numOrNull(v.price_52_week_low);
  const high52 = numOrNull(v.price_52_week_high);
  const inRange = low52 !== null && high52 !== null && high52 > low52;
  return {
    symbol,
    name: shortName(strOrNull(v.description) ?? symbol),
    industry: strOrNull(v.industry),
    sector: strOrNull(v.sector),
    price,
    changePct: numOrNull(v.change) ?? 0,
    marketCap: cap === null ? null : cap / 1e9,
    fwdPe: numOrNull(v[FWD_PE]),
    revGrowth: numOrNull(v[METRIC_FIELDS.revGrowth]),
    grossMargin: numOrNull(v[METRIC_FIELDS.grossMargin]),
    roic: numOrNull(v[METRIC_FIELDS.roic]),
    netDebtEbitda: numOrNull(v[METRIC_FIELDS.netDebtEbitda]),
    low52,
    high52,
    rangePos: inRange ? Math.round(Math.min(100, Math.max(0, ((price - low52) / (high52 - low52)) * 100))) : null,
    trend: numOrNull(v["Perf.3M"]),
    spark: null,
  };
}

type Medians = Omit<ScreenPage["summary"], "count"> & { base: number; total: number };

/** Medians of the matches; over the MEDIAN_CAP largest when there are more. */
async function scanMedians(spec: Spec): Promise<Medians> {
  "use cache";
  cacheLife("minutes");
  const { total, rows } = await scan({
    columns: MEDIAN_COLUMNS,
    ...spec,
    sort: { sortBy: CAP, sortOrder: "desc" },
    range: [0, MEDIAN_CAP],
  });
  const of = (field: (typeof MEDIAN_COLUMNS)[number], keep: (x: number) => boolean = () => true) =>
    median(rows.flatMap((r) => {
      const x = numOrNull(r.values[field]);
      return x !== null && keep(x) ? [x] : [];
    }));
  return {
    // A median P/E over losses (or zero earnings) means nothing; leave them out.
    fwdPe: of(FWD_PE, (x) => x > 0),
    revGrowth: of(METRIC_FIELDS.revGrowth),
    grossMargin: of(METRIC_FIELDS.grossMargin),
    roic: of(METRIC_FIELDS.roic),
    base: rows.length,
    total,
  };
}

/** 3-month sparklines for the rows on screen, ending at the live price. Empty if the chart feed fails. */
async function sparklines(rows: ScanRows["rows"]): Promise<Record<string, string>> {
  if (!rows.length) return {};
  let bars: Awaited<ReturnType<typeof getDailyBars>>;
  try {
    bars = await getDailyBars(rows.map((r) => r.id), SPARK_BARS);
  } catch {
    return {};
  }
  const now = new Date();
  const today = marketDate(now);
  const from = new Date(now);
  from.setMonth(from.getMonth() - 3);
  const fromSec = from.getTime() / 1000;
  const out: Record<string, string> = {};
  for (const r of rows) {
    const series = (bars[r.id] ?? []).filter((b) => b.time >= fromSec);
    const closes = series.map((b) => b.close);
    const last = series[series.length - 1];
    if (last && marketDateOf(last.time) === today) closes[closes.length - 1] = r.row.price;
    else closes.push(r.row.price);
    if (closes.length > 2) out[r.id] = linePath(closes, 84, 24, 3);
  }
  return out;
}

// ── API ─────────────────────────────────────────────────────────────────────

async function screenSpec(q: ScreenQuery): Promise<Spec | null> {
  const scope = await universeScope(q);
  if (!scope) return null;
  return {
    ...scope,
    filter: [...scope.filter, ...capFilters(q.caps), ...sectorFilters(q.sectors), ...limitFilters(q.limits)],
  };
}

function sortSpec(q: ScreenQuery): Sort {
  const field = SORT_FIELDS[q.sort.key];
  return field ? { sortBy: field, sortOrder: q.sort.dir } : { sortBy: CAP, sortOrder: "desc" };
}

/** One page of a screen's results, with the match count and medians. */
export async function runLiveScreen(q: ScreenQuery): Promise<ScreenPage> {
  "use cache";
  cacheLife("minutes");
  const key = queryKey(q);
  const offset = q.page * PAGE_SIZE;
  const spec = await screenSpec(q);
  if (!spec) {
    const none = { count: 0, fwdPe: null, revGrowth: null, grossMargin: null, roic: null };
    return { key, total: 0, offset, rows: [], summary: none, medianBase: null };
  }
  const [page, med] = await Promise.all([scanRows(spec, sortSpec(q), offset, PAGE_SIZE), scanMedians(spec)]);
  const sparks = await sparklines(page.rows);
  return {
    key,
    total: page.total,
    offset,
    rows: page.rows.map(({ id, row }) => ({ ...row, spark: sparks[id] ?? null })),
    summary: { count: page.total, fwdPe: med.fwdPe, revGrowth: med.revGrowth, grossMargin: med.grossMargin, roic: med.roic },
    medianBase: med.total > med.base ? med.base : null,
  };
}

/** The first EXPORT_CAP matches in the screen's order, for "Export results". */
export async function exportLiveScreen(q: ScreenQuery): Promise<ScreenRow[]> {
  "use cache";
  cacheLife("minutes");
  const spec = await screenSpec(q);
  if (!spec) return [];
  const { rows } = await scanRows(spec, sortSpec(q), 0, EXPORT_CAP);
  return rows.map((r) => r.row);
}

/** The Screener's live setup: the default screen's results and chip help. Null in sample mode. */
export async function getLiveScreener(): Promise<LiveScreener | null> {
  if (isSample) return null;
  const screen = SAVED_SCREENS[0];
  let initial: ScreenPage | null = null;
  try {
    initial = await runLiveScreen(toQuery(screen.filters, screen.sort, 0, DEFAULT_WATCHED));
  } catch {
    // The client retries; the page still renders.
  }
  return { initial, capHelp: CAP_HELP, sectorHelp: SECTOR_HELP, exportCap: EXPORT_CAP };
}

/** A ScreenQuery from untrusted JSON (the route handler's `q`), or null when malformed. */
export function parseScreenQuery(text: string | null): ScreenQuery | null {
  if (!text || text.length > 4000) return null;
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return null;
  }
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const list = (v: unknown) => (Array.isArray(v) ? (v as unknown[]) : null);
  const caps = list(r.caps);
  const sectors = list(r.sectors);
  const limits = list(r.limits);
  const watched = list(r.watched);
  const sort = r.sort as Record<string, unknown> | null;
  const universe = UNIVERSES.find((u) => u.value === r.universe)?.value;
  const sortKey = SORT_OPTIONS.find((o) => o.value === sort?.key)?.value;
  const dir = sort?.dir;
  const page = r.page;
  if (!caps || !sectors || !limits || !watched || !universe || !sortKey) return null;
  if (dir !== "asc" && dir !== "desc") return null;
  if (typeof page !== "number" || !Number.isInteger(page) || page < 0 || page > 5000) return null;
  if (!caps.every((c) => CAP_BUCKETS.includes(c as CapBucket))) return null;
  if (!sectors.every((s) => SECTORS.includes(s as Sector))) return null;
  if (watched.length > 500 || !watched.every((s) => typeof s === "string" && /^[A-Z0-9.\-]{1,12}$/.test(s))) return null;
  const thresholds = limits.map((l) => l as { key?: unknown; value?: unknown });
  if (!thresholds.every((l) => typeof l.key === "string" && l.key in METRICS && typeof l.value === "number" && Number.isFinite(l.value))) {
    return null;
  }
  // Rebuild through toQuery so the result is canonical (and so is its cache key).
  return toQuery(
    {
      universe,
      caps: caps as CapBucket[],
      sectors: sectors as Sector[],
      thresholds: thresholds.map((l) => ({ key: l.key as MetricKey, value: String(l.value) })),
    },
    { key: sortKey, dir },
    page,
    watched as string[],
  );
}
