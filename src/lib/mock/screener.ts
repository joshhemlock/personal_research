// Sample data for the Screener: a small fundamentals universe and the saved
// screens. All numbers are made up. Never ship them as real figures.
//
// The first twelve rows, the 3-month sparkline generator and the default
// screen come from design/source/04-screener.dc.html. The other rows were
// added so the design's "18 matches" are real (six more on page 2) and so
// every chip, threshold and saved screen changes the results.

import { linePath, walk } from "./gen";

export const CAP_BUCKETS = ["Mega", "Large", "Mid", "Small"] as const;
export type CapBucket = (typeof CAP_BUCKETS)[number];

export const SECTORS = [
  "Technology",
  "Communication",
  "Health care",
  "Consumer",
  "Financials",
  "Industrials",
  "Energy",
] as const;
export type Sector = (typeof SECTORS)[number];

export const UNIVERSES = [
  { value: "us", label: "US-listed stocks · NYSE + Nasdaq" },
  { value: "sp500", label: "S&P 500 members" },
  { value: "watchlist", label: "My watchlist" },
] as const;
export type UniverseId = (typeof UNIVERSES)[number]["value"];

/** Fundamentals a threshold filter can test. */
export type MetricKey =
  | "revGrowth"
  | "grossMargin"
  | "roic"
  | "fwdPe"
  | "netDebtEbitda"
  | "dividendYield"
  | "dividendGrowth"
  | "offHigh";

export type ScreenStock = {
  symbol: string;
  name: string;
  industry: string;
  sector: Sector;
  capBucket: CapBucket;
  sp500: boolean;
  price: number;
  /** Today's change, %. */
  changePct: number;
  /** Market cap, $B. */
  marketCap: number;
  fwdPe: number;
  /** Revenue growth, YoY %. */
  revGrowth: number;
  grossMargin: number;
  roic: number;
  /** Net debt / EBITDA, ×. Negative means net cash. */
  netDebtEbitda: number;
  dividendYield: number;
  /** Dividend per share, 5-year CAGR %. */
  dividendGrowth: number;
  low52: number;
  high52: number;
  /** Where the price sits in its 52-week range, 0–100. */
  rangePos: number;
  /** 3-month drift, %; sets the sparkline's direction and color. */
  trend: number;
  /** 84×24 sparkline path. */
  spark: string;
};

/**
 * One results row as the table, the summary and the CSV export use it. A
 * ScreenStock is one; a live row may lack any fundamental (null) and has no
 * sparkline when price history couldn't be loaded.
 */
export type ScreenRow = {
  symbol: string;
  name: string;
  industry: string | null;
  sector: string | null;
  price: number;
  changePct: number;
  /** $B. */
  marketCap: number | null;
  fwdPe: number | null;
  revGrowth: number | null;
  grossMargin: number | null;
  roic: number | null;
  netDebtEbitda: number | null;
  low52: number | null;
  high52: number | null;
  /** 0–100. */
  rangePos: number | null;
  /** 3-month change, %; sets the sparkline's color. */
  trend: number | null;
  /** 84×24 sparkline path. */
  spark: string | null;
};

/** Market-cap buckets in $B: Mega ≥ 200, Large ≥ 10, Mid ≥ 2, Small below. */
export function capBucket(marketCap: number): CapBucket {
  if (marketCap >= 200) return "Mega";
  if (marketCap >= 10) return "Large";
  if (marketCap >= 2) return "Mid";
  return "Small";
}

type Row = [
  symbol: string,
  name: string,
  industry: string,
  sector: Sector,
  sp500: boolean,
  price: number,
  changePct: number,
  marketCap: number,
  fwdPe: number,
  revGrowth: number,
  grossMargin: number,
  roic: number,
  netDebtEbitda: number,
  dividendYield: number,
  dividendGrowth: number,
  low52: number,
  high52: number,
  trend: number,
];

// prettier-ignore
const ROWS: Row[] = [
  // symbol  name                      industry                  sector           S&P    price    chg%   cap $B  fwdPE  growth  GM    ROIC  ND/E  yld  divG  52w low  52w high trend
  // From the design: the default screen's first page.
  ["NVDA",  "NVIDIA",                 "Semiconductors",         "Technology",    true,  188.42,  2.14,  4590,   27.9,  54.6,  72.9,  81.4, -0.4, 0.0,  0.0,  92.47,  190.24,   9],
  ["KLAC",  "KLA Corp",               "Semi equipment",         "Technology",    true, 1082.40,  1.42,  143.1,  26.4,  21.6,  61.2,  41.3,  0.4, 0.7, 14.8, 640.20, 1110.50,   6],
  ["LLY",   "Eli Lilly",              "Pharmaceuticals",        "Health care",   true,  812.30, -0.72,  728.4,  30.8,  37.5,  82.9,  38.0,  1.2, 0.7, 15.0, 623.78,  972.53,  -4],
  ["ANET",  "Arista Networks",        "Networking",             "Technology",    true,  142.80,  1.85,  179.6,  38.6,  25.3,  64.2,  35.1, -2.1, 0.0,  0.0,  59.43,  156.20,  11],
  ["META",  "Meta Platforms",         "Interactive media",      "Communication", true,  731.20,  0.44,  1840,   25.1,  19.4,  81.6,  31.2, -0.3, 0.3,  0.0, 479.80,  796.25,  -3],
  ["MSFT",  "Microsoft",              "Software",               "Technology",    true,  512.66,  0.91,  3810,   32.4,  15.6,  68.8,  28.7, -0.2, 0.7, 10.2, 344.79,  555.45,  -2],
  ["TSM",   "Taiwan Semiconductor",   "Semiconductors",         "Technology",    false, 296.40,  1.12,  1540,   22.6,  36.8,  59.0,  27.9, -0.6, 1.1,  9.4, 134.25,  311.37,   8],
  ["GOOGL", "Alphabet",               "Interactive media",      "Communication", true,  247.80, -0.62,  3000,   22.4,  15.1,  59.2,  27.6, -0.5, 0.3,  0.0, 140.53,  256.00,   7],
  ["AVGO",  "Broadcom",               "Semiconductors",         "Technology",    true,  342.15,  3.02,  1610,   33.0,  22.1,  77.8,  24.0,  1.4, 0.7, 13.6, 138.10,  374.23,   6],
  ["VRTX",  "Vertex Pharmaceuticals", "Biotechnology",          "Health care",   true,  451.10, -0.36,  115.8,  23.2,  15.4,  86.1,  22.5, -1.9, 0.0,  0.0, 362.50,  519.88,   2],
  ["NOW",   "ServiceNow",             "Software",               "Technology",    true,  948.20, -0.18,  196.0,  39.2,  20.8,  79.0,  17.5, -0.9, 0.0,  0.0, 678.66, 1170.39,  -5],
  ["ISRG",  "Intuitive Surgical",     "Health equipment",       "Health care",   true,  548.60,  0.33,  196.5,  39.7,  20.4,  66.1,  16.2, -1.1, 0.0,  0.0, 425.00,  616.00,   3],
  // The default screen's second page: ROIC just above the 15% floor.
  ["FTNT",  "Fortinet",               "Software",               "Technology",    true,   96.80,  0.64,   74.2,  33.6,  15.8,  80.9,  16.0, -1.8, 0.0,  0.0,  70.12,  114.82,   4],
  ["REGN",  "Regeneron",              "Biotechnology",          "Health care",   true,  768.40, -0.48,   81.5,  17.9,  17.2,  86.4,  15.8, -2.4, 0.4,  0.0, 520.00, 1050.00,  -3],
  ["AMD",   "Advanced Micro Devices", "Semiconductors",         "Technology",    true,  161.90,  2.36,  262.4,  34.2,  28.4,  53.6,  15.7, -0.6, 0.0,  0.0,  76.48,  186.65,   7],
  ["BSX",   "Boston Scientific",      "Health equipment",       "Health care",   true,  103.25,  0.71,  152.6,  32.8,  21.9,  68.2,  15.5,  1.3, 0.0,  0.0,  80.64,  109.50,   5],
  ["QCOM",  "Qualcomm",               "Semiconductors",         "Technology",    true,  166.70, -0.27,  182.3,  15.2,  15.3,  56.1,  15.3,  0.2, 2.1,  6.0, 120.80,  182.10,   1],
  ["VEEV",  "Veeva Systems",          "Health care tech",       "Health care",   true,  284.30,  0.52,   46.2,  26.1,  22.4,  75.2,  15.1, -3.6, 0.0,  0.0, 201.54,  296.72,   3],
  // Filtered out by the default screen; other chips, thresholds and saved screens find them.
  ["AAPL",  "Apple",                  "Consumer electronics",   "Technology",    true,  254.10, -0.38,  3770,   30.9,   6.1,  46.6,  56.2,  0.3, 0.4,  4.6, 169.21,  260.10,   2],
  ["AMZN",  "Amazon",                 "Internet retail",        "Consumer",      true,  226.35,  1.27,  2410,   33.8,  11.2,  49.6,  16.4,  0.1, 0.0,  0.0, 161.38,  242.52,   4],
  ["COST",  "Costco",                 "Discount stores",        "Consumer",      true,  918.40, -1.05,  407.2,  47.8,   8.1,  12.8,  21.9, -0.6, 0.5, 12.7, 852.00, 1078.24,  -2],
  ["LULU",  "Lululemon Athletica",    "Apparel",                "Consumer",      true,  268.40, -1.42,   32.6,  17.6,  16.4,  58.3,  31.5, -0.8, 0.0,  0.0, 226.01,  423.32,  -6],
  ["MA",    "Mastercard",             "Payments",               "Financials",    true,  578.90,  0.36,  528.4,  33.9,  15.6,  76.4,  46.0,  0.6, 0.5, 13.9, 465.59,  601.77,   3],
  ["V",     "Visa",                   "Payments",               "Financials",    true,  351.20,  0.22,  678.0,  28.6,  11.4,  80.6,  34.2,  0.4, 0.7, 14.6, 299.00,  375.51,   2],
  ["SPGI",  "S&P Global",             "Financial data",         "Financials",    true,  521.30, -0.15,  159.4,  29.4,   9.8,  69.1,  12.4,  2.1, 0.7,  9.2, 427.14,  579.05,  -1],
  ["AXON",  "Axon Enterprise",        "Aerospace & defense",    "Industrials",   true,  742.10,  1.94,   56.8,  96.2,  31.4,  60.8,   4.6, -0.9, 0.0,  0.0, 397.00,  885.91,   8],
  ["VRSK",  "Verisk Analytics",       "Consulting services",    "Industrials",   true,  268.50, -0.41,   37.9,  30.2,  15.2,  69.8,  19.6,  1.9, 0.7,  9.8, 250.12,  322.92,  -4],
  ["CTAS",  "Cintas",                 "Business services",      "Industrials",   true,  208.40,  0.28,   84.1,  42.1,   8.4,  49.9,  24.8,  0.9, 0.8, 18.2, 180.39,  229.24,   1],
  ["TPL",   "Texas Pacific Land",     "Oil & gas",              "Energy",        true, 1124.60, -1.36,   25.8,  36.7,  15.7,  91.2,  39.8, -2.0, 0.6, 14.0, 830.00, 1769.14,  -7],
  ["XOM",   "Exxon Mobil",            "Oil & gas",              "Energy",        true,  112.60, -0.84,  485.3,  14.1,  -3.2,  31.2,  12.1,  0.2, 3.5,  3.0,  97.80,  126.34,  -2],
  ["ADI",   "Analog Devices",         "Semiconductors",         "Technology",    true,  236.40,  0.87,  117.4,  29.6,  16.8,  61.4,   8.9,  1.2, 1.7, 10.4, 158.65,  258.13,   4],
  ["PANW",  "Palo Alto Networks",     "Software",               "Technology",    true,  204.10,  0.58,  136.0,  52.3,  15.4,  73.9,  16.6, -1.2, 0.0,  0.0, 144.15,  223.61,   5],
  ["ORCL",  "Oracle",                 "Software",               "Technology",    true,  248.20,  1.08,  698.4,  31.6,  16.9,  70.5,  16.8,  3.4, 0.8, 13.0, 118.86,  345.72,   6],
  ["APH",   "Amphenol",               "Electronic components",  "Technology",    true,  128.40,  1.12,  157.0,  34.6,  24.6,  34.2,  21.4,  0.8, 0.5, 12.6,  56.45,  134.37,   9],
  ["CRWD",  "CrowdStrike",            "Software",               "Technology",    true,  491.60,  1.32,  122.4, 112.0,  21.7,  74.6,  -1.8, -2.6, 0.0,  0.0, 298.00,  517.98,   6],
  ["INTC",  "Intel",                  "Semiconductors",         "Technology",    true,   37.20, -1.54,  162.8,  48.5,  -1.4,  34.7,  -2.1,  2.8, 0.0,  0.0,  17.67,   42.48,   5],
  ["CSCO",  "Cisco Systems",          "Networking",             "Technology",    true,   71.40,  0.18,  282.6,  18.4,   7.2,  64.6,  18.7,  0.6, 2.3,  2.9,  52.11,   72.55,   3],
  ["TXN",   "Texas Instruments",      "Semiconductors",         "Technology",    true,  181.20, -0.66,  164.9,  31.4,  13.1,  57.8,  13.9,  1.0, 3.0,  9.6, 139.95,  221.69,  -3],
  ["JNJ",   "Johnson & Johnson",      "Pharmaceuticals",        "Health care",   true,  191.60,  0.21,  461.2,  16.9,   5.1,  68.4,  17.2,  0.5, 2.7,  5.5, 140.68,  194.48,   4],
  ["UNH",   "UnitedHealth",           "Health plans",           "Health care",   true,  352.70, -0.92,  319.4,  19.8,   9.6,  18.3,  13.4,  1.4, 2.5, 11.8, 234.60,  630.73,  -5],
  ["DOCS",  "Doximity",               "Health care tech",       "Health care",   false,  72.40,  1.62,    8.9,  38.2,  18.6,  90.1,  21.8, -3.8, 0.0,  0.0,  40.10,   85.21,   4],
  ["QLYS",  "Qualys",                 "Software",               "Technology",    false, 142.30, -0.74,    5.2,  24.9,  15.4,  81.4,  34.0, -1.6, 0.0,  0.0, 112.61,  162.10,  -2],
  ["INMD",  "InMode",                 "Health equipment",       "Health care",   false,  15.40,  0.92,    1.1,   9.8,  16.2,  79.6,  24.6, -5.9, 0.0,  0.0,  13.14,   19.38,  -1],
  ["IRMD",  "iRadimed",               "Health equipment",       "Health care",   false,  58.70,  0.47,    0.7,  34.0,  15.8,  77.2,  28.0, -2.8, 1.0,  0.0,  46.02,   63.11,   3],
];

export const SCREEN_STOCKS: ScreenStock[] = ROWS.map(
  ([symbol, name, industry, sector, sp500, price, changePct, marketCap, fwdPe, revGrowth, grossMargin, roic, netDebtEbitda, dividendYield, dividendGrowth, low52, high52, trend]) => ({
    symbol,
    name,
    industry,
    sector,
    capBucket: capBucket(marketCap),
    sp500,
    price,
    changePct,
    marketCap,
    fwdPe,
    revGrowth,
    grossMargin,
    roic,
    netDebtEbitda,
    dividendYield,
    dividendGrowth,
    low52,
    high52,
    rangePos: Math.round(((price - low52) / (high52 - low52)) * 100),
    trend,
    // Same seed and drift as the design script, so the sparklines match the PNG.
    spark: linePath(walk(symbol.charCodeAt(0) * 7 + symbol.length, 40, trend * 2.4), 84, 24, 3),
  }),
);

/** Symbols starred in the sample watchlist. */
export const DEFAULT_WATCHED: string[] = ["NVDA", "AVGO", "MSFT", "META", "GOOGL"];

export type SortKey =
  | "company"
  | "industry"
  | "price"
  | "today"
  | "cap"
  | "pe"
  | "growth"
  | "gm"
  | "roic"
  | "range"
  | "trend";

export type ScreenSort = { key: SortKey; dir: "asc" | "desc" };

/** A threshold row. `value` is the raw input text; empty means "no limit". */
export type Threshold = { key: MetricKey; value: string };

export type ScreenFilters = {
  universe: UniverseId;
  /** Selected buckets; none selected means any size. */
  caps: CapBucket[];
  /** Selected sectors; none selected means any sector. */
  sectors: Sector[];
  thresholds: Threshold[];
};

export type SavedScreen = { id: string; name: string; filters: ScreenFilters; sort: ScreenSort };

/** The five threshold rows every screen shows, in order. */
export const BASE_METRICS: MetricKey[] = ["revGrowth", "grossMargin", "roic", "fwdPe", "netDebtEbitda"];

function thresholds(values: string[], extra: Threshold[] = []): Threshold[] {
  return [...BASE_METRICS.map((key, i) => ({ key, value: values[i] ?? "" })), ...extra];
}

/** Blank filters: every stock in the US universe. */
export const EMPTY_FILTERS: ScreenFilters = {
  universe: "us",
  caps: [],
  sectors: [],
  thresholds: thresholds([]),
};

/** The user's saved screens (sample). The first one is open by default. */
export const SAVED_SCREENS: SavedScreen[] = [
  {
    id: "quality-compounders",
    name: "Quality compounders",
    filters: {
      universe: "us",
      caps: ["Mega", "Large"],
      sectors: ["Technology", "Communication", "Health care"],
      thresholds: thresholds(["15", "50", "15", "40", "1.5"]),
    },
    sort: { key: "roic", dir: "desc" },
  },
  {
    id: "cash-rich",
    name: "Cash-rich",
    filters: {
      universe: "us",
      caps: ["Mega", "Large"],
      sectors: [],
      thresholds: thresholds(["", "40", "15", "33", "0"]),
    },
    sort: { key: "cap", dir: "desc" },
  },
  {
    id: "dividend-growers",
    name: "Dividend growers",
    filters: {
      universe: "us",
      caps: ["Mega", "Large"],
      sectors: [],
      thresholds: thresholds(
        ["5", "", "12", "35", "2"],
        [
          { key: "dividendYield", value: "0.5" },
          { key: "dividendGrowth", value: "8" },
        ],
      ),
    },
    sort: { key: "pe", dir: "asc" },
  },
];

// ── Live screening ──────────────────────────────────────────────────────────
// Shapes shared by the live data layer (src/lib/data/screener.ts), its route
// handler and the client. Built by toQuery() in components/screener/screen.ts.

/** A screen in canonical form: equal screens give equal JSON (the cache key). */
export type ScreenQuery = {
  universe: UniverseId;
  /** In CAP_BUCKETS order. */
  caps: CapBucket[];
  /** In SECTORS order. */
  sectors: Sector[];
  /** Thresholds that hold a number, by key. */
  limits: { key: MetricKey; value: number }[];
  sort: ScreenSort;
  page: number;
  /** Starred symbols, sorted; only sent for the "My watchlist" universe. */
  watched: string[];
};

export type ScreenSummary = {
  count: number;
  fwdPe: number | null;
  revGrowth: number | null;
  grossMargin: number | null;
  roic: number | null;
};

/** One page of live results. */
export type ScreenPage = {
  /** JSON of the ScreenQuery these results answer. */
  key: string;
  total: number;
  offset: number;
  rows: ScreenRow[];
  summary: ScreenSummary;
  /** When the medians come from only the largest matches (the fetch is capped), how many. */
  medianBase: number | null;
};

/** What the server hands the Screener in live mode. */
export type LiveScreener = {
  /** Results of the default screen, or null when TradingView couldn't be reached. */
  initial: ScreenPage | null;
  /** Hover text for the chips: what each bucket and sector covers. */
  capHelp: Record<CapBucket, string>;
  sectorHelp: Record<Sector, string>;
  /** Most rows "Export results" downloads. */
  exportCap: number;
};
