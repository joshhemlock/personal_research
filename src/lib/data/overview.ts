import "server-only";

import { cacheLife } from "next/cache";
import * as sample from "@/lib/mock/overview";
import type { EarningsEvent, IndexTile, QueueTask, SectorMove, WatchRow } from "@/lib/mock/overview";
import { greeting, marketDate, marketDateOf } from "./clock";
import { getDailyBars, getFundamentals, getQuotes, INDEX_IDS, resolveSymbols } from "./market";
import { isSample } from "./source";
import type { Bar, Quote } from "./types";

export type OverviewData = {
  greeting: string;
  /** Today in New York, YYYY-MM-DD. */
  marketDate: string;
  indexTiles: IndexTile[];
  watchlist: WatchRow[];
  sectors: SectorMove[];
  upcomingEarnings: EarningsEvent[];
  reportedThisWeek: string[];
  researchQueue: QueueTask[];
};

const INDEX_TILES = [
  { key: "SPX", name: "S&P 500", badge: "500", badgeColor: "#E5484D" },
  { key: "NDX", name: "Nasdaq 100", badge: "100", badgeColor: "#3B6FE0" },
  { key: "DJI", name: "Dow Jones", badge: "30", badgeColor: "#2BA3C9" },
  { key: "RUT", name: "Russell 2000", badge: "2K", badgeColor: "#8B46F0" },
  { key: "US10Y", name: "US 10Y yield", badge: "10Y", badgeColor: "#111113", unit: "%" as const },
];

/** Sector performance is read from the Select Sector SPDR ETFs. */
const SECTOR_ETFS: [string, string][] = [
  ["Technology", "AMEX:XLK"],
  ["Communication", "AMEX:XLC"],
  ["Consumer disc.", "AMEX:XLY"],
  ["Financials", "AMEX:XLF"],
  ["Industrials", "AMEX:XLI"],
  ["Materials", "AMEX:XLB"],
  ["Health care", "AMEX:XLV"],
  ["Utilities", "AMEX:XLU"],
  ["Real estate", "AMEX:XLRE"],
  ["Consumer staples", "AMEX:XLP"],
  ["Energy", "AMEX:XLE"],
];

const EARNINGS_WINDOW_DAYS = sample.EARNINGS_WINDOW_DAYS;
const DAY = 86_400;

export async function getOverviewData(): Promise<OverviewData> {
  if (isSample) {
    return {
      greeting: sample.GREETING,
      marketDate: sample.MARKET_DATE,
      indexTiles: sample.INDEX_TILES,
      watchlist: sample.WATCHLIST,
      sectors: sample.SECTORS,
      upcomingEarnings: sample.UPCOMING_EARNINGS,
      reportedThisWeek: sample.REPORTED_THIS_WEEK,
      researchQueue: sample.RESEARCH_QUEUE,
    };
  }
  return liveOverview();
}

async function liveOverview(): Promise<OverviewData> {
  "use cache";
  cacheLife("minutes");

  // The user's watchlist and research queue aren't market data; they stay
  // as in the sample until watchlists and tasks are saved per user.
  const watch = sample.WATCHLIST.map(({ symbol, group }) => ({ symbol, group }));
  const listings = await resolveSymbols(watch.map((w) => w.symbol));
  const watchIds = watch.flatMap((w) => (listings[w.symbol] ? [listings[w.symbol].id] : []));
  const indexIds = INDEX_TILES.map((t) => INDEX_IDS[t.key]);

  const [quotes, fundamentals, bars] = await Promise.all([
    getQuotes([...indexIds, ...watchIds, ...SECTOR_ETFS.map(([, id]) => id)]),
    getFundamentals(watchIds),
    getDailyBars([...indexIds, ...watchIds], 30),
  ]);

  const now = new Date();
  const today = marketDate(now);
  const nowSec = Math.floor(now.getTime() / 1000);

  const indexTiles: IndexTile[] = INDEX_TILES.flatMap((t) => {
    const q = quotes[INDEX_IDS[t.key]];
    if (!q) return [];
    return [
      {
        name: t.name,
        badge: t.badge,
        badgeColor: t.badgeColor,
        level: q.price,
        unit: t.unit,
        changePct: q.changePct,
        changeBp: t.unit === "%" ? Math.round(q.change * 100) : undefined,
        series: closesWithLive(bars[q.id], q, today),
      },
    ];
  });

  const watchlist: WatchRow[] = watch.flatMap((w) => {
    const listing = listings[w.symbol];
    const q = listing && quotes[listing.id];
    if (!q) return [];
    const f = fundamentals[listing.id];
    const trend = closesWithLive(bars[listing.id], q, today).slice(-22);
    return [
      {
        symbol: w.symbol,
        name: listing.name,
        group: w.group,
        price: q.price,
        changePct: q.changePct,
        monthPct: q.perfMonthPct ?? pctChange(trend[0], trend[trend.length - 1]),
        trend,
        low52: q.low52 ?? Math.min(...trend),
        high52: q.high52 ?? Math.max(...trend),
        marketCap: q.marketCap ?? 0,
        forwardPE: f?.forwardPE ?? null,
        nextEarnings: f?.nextEarnings ? marketDateOf(f.nextEarnings) : null,
      },
    ];
  });

  const sectors: SectorMove[] = SECTOR_ETFS.flatMap(([name, id]) => {
    const q = quotes[id];
    return q ? [{ name, change: { "1D": q.changePct, "1W": q.perfWeekPct ?? 0, "1M": q.perfMonthPct ?? 0 } }] : [];
  });

  const upcomingEarnings: EarningsEvent[] = watch
    .flatMap((w) => {
      const f = listings[w.symbol] && fundamentals[listings[w.symbol].id];
      if (!f?.nextEarnings || f.nextEarnings < nowSec - DAY || f.nextEarnings > nowSec + EARNINGS_WINDOW_DAYS * DAY) return [];
      return [
        {
          symbol: w.symbol,
          date: marketDateOf(f.nextEarnings),
          period: f.nextEarningsQuarter ? `Q${f.nextEarningsQuarter}` : "Earnings",
          timing: f.nextEarningsTiming,
          epsEstimate: f.nextEpsEstimate,
        },
      ];
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  const reportedThisWeek = watch.flatMap((w) => {
    const f = listings[w.symbol] && fundamentals[listings[w.symbol].id];
    return f?.lastEarnings && f.lastEarnings <= nowSec && f.lastEarnings > nowSec - 7 * DAY ? [w.symbol] : [];
  });

  return {
    greeting: greeting(now),
    marketDate: today,
    indexTiles,
    watchlist,
    sectors,
    upcomingEarnings,
    reportedThisWeek,
    researchQueue: sample.RESEARCH_QUEUE,
  };
}

/** Daily closes with today's live price as the last point. */
function closesWithLive(bars: Bar[] | undefined, q: Quote, today: string): number[] {
  const closes = (bars ?? []).map((b) => b.close);
  const last = bars?.[bars.length - 1];
  if (last && marketDateOf(last.time) === today) closes[closes.length - 1] = q.price;
  else closes.push(q.price);
  return closes.length > 1 ? closes : [q.price, q.price];
}

function pctChange(from: number, to: number): number {
  return from ? ((to - from) / from) * 100 : 0;
}
