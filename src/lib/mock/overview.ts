// Sample data for the Overview screen, ported from the design script in
// design/source/01-overview.dc.html. All numbers are made up. Never ship
// them as real figures.

import type { EarningsTiming } from "@/lib/data/types";
import { walk } from "./gen";
import { AS_OF, findSecurity } from "./market";

/** Trading day the sample data describes, YYYY-MM-DD. */
export const MARKET_DATE = AS_OF.iso.slice(0, 10);

export const GREETING = "Good morning";

// ── Market index tiles ───────────────────────────────────────────────────

export type IndexTile = {
  name: string;
  /** Short label in the colored disc ("500", "10Y"). */
  badge: string;
  badgeColor: string;
  level: number;
  /** Yields are shown as a percentage. */
  unit?: "%";
  changePct: number;
  /** Yields quote their change in basis points instead of %. */
  changeBp?: number;
  /** Intraday sparkline values. */
  series: number[];
};

const INDEX_SPECS: Omit<IndexTile, "series">[] = [
  { name: "S&P 500", badge: "500", badgeColor: "#E5484D", level: 6812.45, changePct: 0.38 },
  { name: "Nasdaq 100", badge: "100", badgeColor: "#3B6FE0", level: 25410.2, changePct: 0.71 },
  { name: "Dow Jones", badge: "30", badgeColor: "#2BA3C9", level: 47120.88, changePct: -0.12 },
  { name: "Russell 2000", badge: "2K", badgeColor: "#8B46F0", level: 2488.31, changePct: 0.95 },
  { name: "US 10Y yield", badge: "10Y", badgeColor: "#111113", level: 4.07, unit: "%", changePct: -0.49, changeBp: -2 },
];

// Seeds and drift match the design script, so the sparklines match the PNG.
export const INDEX_TILES: IndexTile[] = INDEX_SPECS.map((d, i) => ({
  ...d,
  series: walk(11 + i * 7, 40, d.changePct * 7),
}));

// ── Watchlist ────────────────────────────────────────────────────────────

export type WatchGroup = "Tech" | "Semis" | "Consumer";
export const WATCH_GROUPS: readonly WatchGroup[] = ["Tech", "Semis", "Consumer"];

export type WatchRow = {
  symbol: string;
  name: string;
  group: WatchGroup;
  price: number;
  changePct: number;
  /** One-month change in %; colors the trend line. */
  monthPct: number;
  /** Daily closes over the last month. */
  trend: number[];
  low52: number;
  high52: number;
  /** USD. */
  marketCap: number;
  forwardPE: number | null;
  /** Next earnings date, YYYY-MM-DD. */
  nextEarnings: string | null;
};

type WatchSpec = Omit<WatchRow, "name" | "price" | "changePct" | "trend">;

const WATCH_SPECS: WatchSpec[] = [
  { symbol: "NVDA", group: "Semis", monthPct: 8.2, low52: 92.47, high52: 190.24, marketCap: 4.59e12, forwardPE: 27.9, nextEarnings: "2026-11-18" },
  { symbol: "AAPL", group: "Tech", monthPct: 3.1, low52: 169.21, high52: 260.1, marketCap: 3.77e12, forwardPE: 31.6, nextEarnings: "2027-01-29" },
  { symbol: "MSFT", group: "Tech", monthPct: -1.8, low52: 344.79, high52: 555.45, marketCap: 3.81e12, forwardPE: 32.4, nextEarnings: "2027-01-27" },
  { symbol: "AMZN", group: "Consumer", monthPct: 4.6, low52: 161.38, high52: 242.52, marketCap: 2.41e12, forwardPE: 30.2, nextEarnings: "2027-02-04" },
  { symbol: "GOOGL", group: "Tech", monthPct: 6.9, low52: 140.53, high52: 256.0, marketCap: 3.0e12, forwardPE: 22.4, nextEarnings: "2027-02-02" },
  { symbol: "META", group: "Tech", monthPct: -2.7, low52: 479.8, high52: 796.25, marketCap: 1.84e12, forwardPE: 25.1, nextEarnings: "2027-01-27" },
  { symbol: "AVGO", group: "Semis", monthPct: 5.4, low52: 138.1, high52: 374.23, marketCap: 1.61e12, forwardPE: 33.0, nextEarnings: "2026-12-10" },
  { symbol: "COST", group: "Consumer", monthPct: -3.9, low52: 867.34, high52: 1078.23, marketCap: 407.2e9, forwardPE: 46.8, nextEarnings: "2026-12-10" },
];

/** Watchlist rows; quotes come from the shared sample universe. */
export const WATCHLIST: WatchRow[] = WATCH_SPECS.map((w, i) => {
  const sec = findSecurity(w.symbol);
  if (!sec) throw new Error(`Unknown sample symbol ${w.symbol}`);
  return {
    ...w,
    name: sec.name,
    price: sec.price,
    changePct: sec.changePct,
    trend: walk(100 + i * 13, 30, w.monthPct * 2.4),
  };
});

/** A move of this size (%) fills a whole side of the movers bar chart. */
export const MOVERS_FULL_SCALE = 3.2;

// ── Sector performance ───────────────────────────────────────────────────

export type SectorPeriod = "1D" | "1W" | "1M";
export const SECTOR_PERIODS: readonly SectorPeriod[] = ["1D", "1W", "1M"];

export type SectorMove = { name: string; change: Record<SectorPeriod, number> };

const sector = (name: string, d1: number, w1: number, m1: number): SectorMove => ({
  name,
  change: { "1D": d1, "1W": w1, "1M": m1 },
});

export const SECTORS: SectorMove[] = [
  sector("Technology", 1.12, 2.8, 6.1),
  sector("Communication", 0.42, 1.6, 3.9),
  sector("Consumer disc.", 0.88, -0.6, 2.2),
  sector("Financials", 0.21, 0.9, 1.4),
  sector("Industrials", 0.15, 1.2, -0.8),
  sector("Materials", 0.33, -1.1, -2.4),
  sector("Health care", -0.35, -1.8, -4.2),
  sector("Utilities", -0.22, 0.4, 3.1),
  sector("Real estate", -0.41, -0.9, -1.7),
  sector("Consumer staples", -0.64, -1.4, -3.3),
  sector("Energy", -1.08, -2.6, -5.0),
];

/** Move (%) at which a heat tile reaches full strength, per period. */
export const SECTOR_HEAT_SCALE: Record<SectorPeriod, number> = { "1D": 1.1, "1W": 2.8, "1M": 6 };

// ── Upcoming earnings ────────────────────────────────────────────────────

export type EarningsEvent = {
  symbol: string;
  /** YYYY-MM-DD */
  date: string;
  period: string;
  timing: EarningsTiming;
  epsEstimate: number | null;
};

export const EARNINGS_WINDOW_DAYS = 45;

export const UPCOMING_EARNINGS: EarningsEvent[] = [
  { symbol: "NVDA", date: "2026-11-18", period: "Q3 FY27", timing: "After close", epsEstimate: 1.68 },
  { symbol: "AVGO", date: "2026-12-10", period: "Q4 FY26", timing: "After close", epsEstimate: 1.95 },
  { symbol: "COST", date: "2026-12-10", period: "Q1 FY27", timing: "After close", epsEstimate: 4.52 },
];

export const REPORTED_THIS_WEEK = ["AAPL", "AMZN", "GOOGL", "META", "MSFT"];

// ── Research queue ───────────────────────────────────────────────────────

export type QueueTask = {
  id: string;
  title: string;
  /** Due date or completion note, then the task type. */
  meta: string;
  symbol: string;
  done: boolean;
};

export const RESEARCH_QUEUE: QueueTask[] = [
  { id: "q1", title: "Finish the AVGO valuation model", meta: "Due Monday · Valuation", symbol: "AVGO", done: false },
  { id: "q2", title: "Read the COST Q4 call transcript", meta: "Done yesterday · Earnings", symbol: "COST", done: true },
  { id: "q3", title: "Update NVDA thesis after Nov 18", meta: "Nov 19 · Thesis", symbol: "NVDA", done: false },
];
