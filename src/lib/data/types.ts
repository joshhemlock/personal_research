// Market data types shared by every provider.

/** One daily candle. `time` is the session start in Unix seconds. */
export type Bar = { time: number; open: number; high: number; low: number; close: number; volume: number };

/** A tradable symbol, resolved to the provider's own identifier. */
export type Listing = {
  /** Plain ticker as used in routes, e.g. "NVDA". */
  symbol: string;
  /** Provider identifier, e.g. "NASDAQ:NVDA". */
  id: string;
  name: string;
  exchange: string;
};

export type Quote = Listing & {
  price: number;
  change: number;
  changePct: number;
  open: number | null;
  high: number | null;
  low: number | null;
  volume: number | null;
  marketCap: number | null;
  high52: number | null;
  low52: number | null;
  perfWeekPct: number | null;
  perfMonthPct: number | null;
  sector: string | null;
  industry: string | null;
  /** When the quote was fetched, Unix ms. */
  asOf: number;
};

export type EarningsTiming = "Before open" | "After close" | "Time not confirmed";

/** Slow-moving fundamentals and the earnings calendar. */
export type Fundamentals = {
  id: string;
  forwardPE: number | null;
  trailingPE: number | null;
  evToSales: number | null;
  priceToFcf: number | null;
  revenueTtm: number | null;
  revenueGrowthYoyPct: number | null;
  grossMarginPct: number | null;
  operatingMarginPct: number | null;
  netMarginPct: number | null;
  netIncomeTtm: number | null;
  freeCashFlowTtm: number | null;
  roicPct: number | null;
  netDebtToEbitda: number | null;
  dividendYieldPct: number | null;
  epsDilutedTtm: number | null;
  /** Unix seconds. */
  nextEarnings: number | null;
  nextEarningsTiming: EarningsTiming;
  /** Quarter number (1–4) of the next report. */
  nextEarningsQuarter: number | null;
  nextEpsEstimate: number | null;
  nextRevenueEstimate: number | null;
  /** Unix seconds. */
  lastEarnings: number | null;
  lastEpsSurprisePct: number | null;
  /** Quarterly history, newest first. */
  revenueQuarterly: number[];
  grossProfitQuarterly: number[];
  netIncomeQuarterly: number[];
  epsDilutedQuarterly: number[];
  freeCashFlowQuarterly: number[];
  /** Annual history, newest first. */
  revenueAnnual: number[];
  netIncomeAnnual: number[];
};
