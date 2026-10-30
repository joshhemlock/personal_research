import "server-only";

// Market data API used by the screens. Provider-agnostic: today it is backed
// by TradingView (./tradingview); another provider only needs to implement
// these functions. Everything is cached with Next's "use cache":
//   quotes ~1 minute, price history and fundamentals ~1 day.

import { cacheLife } from "next/cache";
import { fetchDailyBars } from "./tradingview/chart";
import { numOrNull, scan, series, strOrNull } from "./tradingview/scanner";
import { searchSymbols } from "./tradingview/search";
import type { Bar, EarningsTiming, Fundamentals, Listing, Quote } from "./types";

/** Indices and rates, which aren't found by ticker lookup. */
export const INDEX_IDS: Record<string, string> = {
  SPX: "SP:SPX",
  NDX: "NASDAQ:NDX",
  DJI: "DJ:DJI",
  RUT: "TVC:RUT",
  US10Y: "TVC:US10Y",
  SOX: "NASDAQ:SOX",
};

/** Resolve plain tickers ("NVDA") to listings; unknown tickers are left out. */
export async function resolveSymbols(symbols: string[]): Promise<Record<string, Listing>> {
  "use cache";
  cacheLife("days");
  const wanted = [...new Set(symbols.map((s) => s.toUpperCase()))];
  const out: Record<string, Listing> = {};
  const lookup = wanted.filter((s) => !INDEX_IDS[s]);
  for (const s of wanted) {
    if (INDEX_IDS[s]) out[s] = { symbol: s, id: INDEX_IDS[s], name: s, exchange: INDEX_IDS[s].split(":")[0] };
  }
  if (lookup.length) {
    const { rows } = await scan({
      columns: ["name", "description", "exchange", "is_primary", "market_cap_basic"],
      filter: [
        { left: "name", operation: "in_range", right: lookup },
        { left: "type", operation: "in_range", right: ["stock", "dr", "fund"] },
      ],
      markets: ["america"],
      sort: { sortBy: "market_cap_basic", sortOrder: "desc" },
      range: [0, lookup.length * 4],
    });
    // Prefer the primary listing; rows are already largest first.
    const ranked = [...rows].sort((a, b) => Number(b.values.is_primary === true) - Number(a.values.is_primary === true));
    for (const r of ranked) {
      const symbol = String(r.values.name);
      if (out[symbol]) continue;
      out[symbol] = {
        symbol,
        id: r.tvSymbol,
        name: shortName(strOrNull(r.values.description) ?? symbol),
        exchange: strOrNull(r.values.exchange) ?? r.tvSymbol.split(":")[0],
      };
    }
  }
  return out;
}

/** Ticker search for the command palette. */
export async function searchListings(query: string): Promise<Listing[]> {
  "use cache";
  cacheLife("days");
  const q = query.trim();
  if (!q) return [];
  const hits = await searchSymbols(q);
  return hits.map((h) => ({ ...h, name: shortName(h.name) }));
}

const QUOTE_COLUMNS = [
  "name", "description", "exchange", "close", "change", "change_abs", "open", "high", "low", "volume",
  "market_cap_basic", "price_52_week_high", "price_52_week_low", "Perf.W", "Perf.1M", "sector", "industry",
] as const;

/** Latest quotes, keyed by provider id. */
export async function getQuotes(ids: string[]): Promise<Record<string, Quote>> {
  "use cache";
  cacheLife("minutes");
  if (ids.length === 0) return {};
  const { rows } = await scan({ columns: QUOTE_COLUMNS, tickers: ids });
  const asOf = Date.now();
  const out: Record<string, Quote> = {};
  for (const { tvSymbol, values: v } of rows) {
    const price = numOrNull(v.close);
    if (price == null) continue;
    out[tvSymbol] = {
      symbol: String(v.name),
      id: tvSymbol,
      name: shortName(strOrNull(v.description) ?? String(v.name)),
      exchange: strOrNull(v.exchange) ?? tvSymbol.split(":")[0],
      price,
      change: numOrNull(v.change_abs) ?? 0,
      changePct: numOrNull(v.change) ?? 0,
      open: numOrNull(v.open),
      high: numOrNull(v.high),
      low: numOrNull(v.low),
      volume: numOrNull(v.volume),
      marketCap: numOrNull(v.market_cap_basic),
      high52: numOrNull(v.price_52_week_high),
      low52: numOrNull(v.price_52_week_low),
      perfWeekPct: numOrNull(v["Perf.W"]),
      perfMonthPct: numOrNull(v["Perf.1M"]),
      sector: strOrNull(v.sector),
      industry: strOrNull(v.industry),
      asOf,
    };
  }
  return out;
}

/** Daily bars, oldest first, keyed by provider id. */
export async function getDailyBars(ids: string[], count: number): Promise<Record<string, Bar[]>> {
  "use cache";
  cacheLife("days");
  return fetchDailyBars(ids, count);
}

const FUNDAMENTAL_COLUMNS = [
  "price_earnings_forward_fy", "non_gaap_price_to_earnings_per_share_forecast_next_fy", "price_earnings_ttm",
  "enterprise_value_to_revenue_ttm", "price_free_cash_flow_ttm", "total_revenue_ttm", "total_revenue_yoy_growth_ttm",
  "gross_margin_ttm", "operating_margin_ttm", "net_margin_ttm", "net_income_ttm", "free_cash_flow_ttm",
  "return_on_invested_capital_fq", "net_debt_to_ebitda_fq", "dividends_yield_current", "earnings_per_share_diluted_ttm",
  "earnings_release_next_date", "earnings_release_next_time", "fiscal_period_current",
  "earnings_per_share_forecast_next_fq", "revenue_forecast_next_fq", "earnings_release_date", "eps_surprise_percent_fq",
  "total_revenue_fq_h", "gross_profit_fq_h", "net_income_fq_h", "earnings_per_share_diluted_fq_h", "free_cash_flow_fq_h",
  "total_revenue_fy_h", "net_income_fy_h",
] as const;

/** Fundamentals and earnings calendar, keyed by provider id. */
export async function getFundamentals(ids: string[]): Promise<Record<string, Fundamentals>> {
  "use cache";
  cacheLife("days");
  if (ids.length === 0) return {};
  const { rows } = await scan({ columns: FUNDAMENTAL_COLUMNS, tickers: ids });
  const out: Record<string, Fundamentals> = {};
  for (const { tvSymbol, values: v } of rows) {
    const quarter = /Q(\d)$/.exec(strOrNull(v.fiscal_period_current) ?? "");
    out[tvSymbol] = {
      id: tvSymbol,
      forwardPE: numOrNull(v.price_earnings_forward_fy) ?? numOrNull(v.non_gaap_price_to_earnings_per_share_forecast_next_fy),
      trailingPE: numOrNull(v.price_earnings_ttm),
      evToSales: numOrNull(v.enterprise_value_to_revenue_ttm),
      priceToFcf: numOrNull(v.price_free_cash_flow_ttm),
      revenueTtm: numOrNull(v.total_revenue_ttm),
      revenueGrowthYoyPct: numOrNull(v.total_revenue_yoy_growth_ttm),
      grossMarginPct: numOrNull(v.gross_margin_ttm),
      operatingMarginPct: numOrNull(v.operating_margin_ttm),
      netMarginPct: numOrNull(v.net_margin_ttm),
      netIncomeTtm: numOrNull(v.net_income_ttm),
      freeCashFlowTtm: numOrNull(v.free_cash_flow_ttm),
      roicPct: numOrNull(v.return_on_invested_capital_fq),
      netDebtToEbitda: numOrNull(v.net_debt_to_ebitda_fq),
      dividendYieldPct: numOrNull(v.dividends_yield_current),
      epsDilutedTtm: numOrNull(v.earnings_per_share_diluted_ttm),
      nextEarnings: numOrNull(v.earnings_release_next_date),
      nextEarningsTiming: earningsTiming(numOrNull(v.earnings_release_next_time)),
      nextEarningsQuarter: quarter ? (Number(quarter[1]) % 4) + 1 : null,
      nextEpsEstimate: numOrNull(v.earnings_per_share_forecast_next_fq),
      nextRevenueEstimate: numOrNull(v.revenue_forecast_next_fq),
      lastEarnings: numOrNull(v.earnings_release_date),
      lastEpsSurprisePct: numOrNull(v.eps_surprise_percent_fq),
      revenueQuarterly: series(v.total_revenue_fq_h),
      grossProfitQuarterly: series(v.gross_profit_fq_h),
      netIncomeQuarterly: series(v.net_income_fq_h),
      epsDilutedQuarterly: series(v.earnings_per_share_diluted_fq_h),
      freeCashFlowQuarterly: series(v.free_cash_flow_fq_h),
      revenueAnnual: series(v.total_revenue_fy_h),
      netIncomeAnnual: series(v.net_income_fy_h),
    };
  }
  return out;
}

/**
 * TradingView codes: -1 before the open, 1 after the close, 0 not confirmed.
 * With 0 the release time is a placeholder, so it isn't used to guess.
 */
function earningsTiming(code: number | null): EarningsTiming {
  if (code === -1) return "Before open";
  if (code === 1) return "After close";
  return "Time not confirmed";
}

/** "NVIDIA Corporation" → "NVIDIA", "JPMorgan Chase & Co." → "JPMorgan Chase". */
export function shortName(name: string): string {
  const SUFFIX =
    /,?\s+(Sponsored ADR.*|Class [A-C]\b.*|Inc\.?|Incorporated|Corporation|Corp\.?|Company|& Co\.?|Co\.?|Ltd\.?|Limited|plc|PLC|N\.?V\.?|S\.A\.|A\/S|AG|SE|Holdings?|Group)$/i;
  let out = name.trim();
  for (let i = 0; i < 4 && SUFFIX.test(out); i++) out = out.replace(SUFFIX, "").trim();
  return out.replace(/\.com$/i, "").replace(/[,&]$/, "").trim() || name;
}
