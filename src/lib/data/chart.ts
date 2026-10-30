import "server-only";

// Data for the stock chart screen (/stock/[symbol]). Sample mode returns the
// design data; live mode maps TradingView quotes, daily bars and the earnings
// / dividend calendar onto the same view models. The user's own data
// (watchlist membership, alerts, open tabs, notes, fair values) stays as in
// the sample until it is saved per user; live prices and names fill it in.

import { cacheLife } from "next/cache";
import { pillDate, shortDate } from "@/components/chart/scale";
import type { GroupLinks, OpenTab, PinnedLink, SecurityInfo, TickerCardData } from "@/components/chart/types";
import type { HeaderQuote } from "@/components/shell/TopBar";
import { MINUS, num, pct, signed } from "@/lib/format";
import * as sample from "@/lib/mock/chart";
import type { AlertItem, AlertTab, Bar, ChartData, CompareSeries, UpcomingEvent } from "@/lib/mock/chart";
import { AS_OF, findSecurity } from "@/lib/mock/market";
import { marketDate, marketDateOf } from "./clock";
import { getDailyBars, getFundamentals, getQuotes, INDEX_IDS, resolveSymbols } from "./market";
import { isSample } from "./source";
import { numOrNull, scan, strOrNull } from "./tradingview/scanner";
import type { Bar as DailyBar, Quote } from "./types";

export type ChartPage = {
  symbol: string;
  /** Live market data: the page credits TradingView. */
  live: boolean;
  /** Header quote pill. */
  quote: HeaderQuote;
  security: SecurityInfo;
  chart: ChartData;
  addNoteHref: string;
  /** "Oct 30, 2026 at 11:51 AM" */
  lastTick: string;
  tabs: OpenTab[];
  pinned: PinnedLink[];
  groups: GroupLinks[];
  alerts: Record<AlertTab, AlertItem[]>;
  card: TickerCardData;
};

/** Plain US tickers, share classes included ("BRK.B"). */
const TICKER = /^[A-Z0-9][A-Z0-9.-]{0,11}$/;

/** Everything the chart screen shows for `symbol`; null when the ticker is unknown. */
export async function getChartPage(symbol: string): Promise<ChartPage | null> {
  const s = symbol.toUpperCase();
  if (!TICKER.test(s)) return null;
  return isSample ? samplePage(s) : livePage(s);
}

/** Open tabs, plus the current symbol when it isn't one of them. */
const tabSymbols = (current: string) => (sample.OPEN_TABS.includes(current) ? sample.OPEN_TABS : [...sample.OPEN_TABS, current]);

const changeText = (change: number, changePct: number) => `${signed(change)} (${pct(changePct)})`;

// ---------------------------------------------------------------------------
// Sample

function samplePage(symbol: string): ChartPage | null {
  const sec = findSecurity(symbol);
  if (!sec) return null;
  // Symbols that have a sample chart page link to it; indexes don't.
  const href = (s: string) => (findSecurity(s) ? `/stock/${s}` : null);
  return {
    symbol: sec.symbol,
    live: false,
    quote: {
      symbol: sec.symbol,
      price: num(sec.price),
      change: changeText(sec.change, sec.changePct),
      up: sec.change >= 0,
      asOf: `${AS_OF.date} · ${AS_OF.time}`,
    },
    security: { symbol: sec.symbol, name: sec.name, exchange: sec.exchange, changePct: sec.changePct, watched: sample.isWatched(sec.symbol) },
    chart: sample.getChartData(sec),
    addNoteHref: noteFor(sec.symbol),
    lastTick: sample.LAST_TICK,
    tabs: tabSymbols(sec.symbol).map((s) => ({ symbol: s, name: findSecurity(s)?.name ?? s })),
    pinned: sample.PINNED.map((r) => ({ ...r, href: href(r.symbol) })),
    groups: sample.WATCH_GROUPS.map((g) => ({ ...g, items: g.items.map((w) => ({ ...w, href: href(w.symbol) })) })),
    alerts: sample.ALERTS,
    card: {
      symbol: sec.symbol,
      name: sample.LEGAL_NAMES[sec.symbol] ?? sec.name,
      exchange: sec.exchange,
      classification: `${sec.industry} · ${sec.sector}`,
      price: sec.price,
      change: sec.change,
      changePct: sec.changePct,
      currency: "USD",
      lastUpdate: `Last update at ${sample.LAST_TICK_TIME}, UTC−4`,
      fairValue: sample.fairValue(sec),
      noteHref: sample.noteHref(sec.symbol),
    },
  };
}

/** "Add note" target: the NVDA thesis in the sample notes, else the notes list. */
const noteFor = (symbol: string) => (symbol === "NVDA" ? "/notes/nvda-core-thesis" : "/notes");

// ---------------------------------------------------------------------------
// Comparison lines: the stock's sector index and the S&P 500

type CompareIndex = { id: string; symbol: string; name: string; badge: string };

const SOX: CompareIndex = { id: INDEX_IDS.SOX, symbol: "SOX", name: "Semis index", badge: "30" };
const SPX: CompareIndex = { id: INDEX_IDS.SPX, symbol: "SPX", name: "S&P 500", badge: "500" };

/** Select Sector SPDR funds (badge: number of holdings, read live). */
const FUNDS = {
  XLK: "Tech sector",
  XLC: "Comm. services",
  XLY: "Cons. discretionary",
  XLP: "Cons. staples",
  XLV: "Health care",
  XLF: "Financials",
  XLI: "Industrials",
  XLB: "Materials",
  XLU: "Utilities",
  XLRE: "Real estate",
  XLE: "Energy",
} as const;
type Fund = keyof typeof FUNDS;
const fundId = (f: Fund) => `AMEX:${f}`;
const FUND_IDS = (Object.keys(FUNDS) as Fund[]).map(fundId);

/** TradingView sector → sector fund. Funds and indexes ("Miscellaneous") get none. */
const SECTOR_FUND: Record<string, Fund> = {
  "Electronic Technology": "XLK",
  "Technology Services": "XLK",
  Communications: "XLC",
  "Retail Trade": "XLY",
  "Consumer Durables": "XLY",
  "Consumer Services": "XLY",
  "Consumer Non-Durables": "XLP",
  Finance: "XLF",
  "Health Technology": "XLV",
  "Health Services": "XLV",
  Utilities: "XLU",
  "Energy Minerals": "XLE",
  "Industrial Services": "XLI",
  "Producer Manufacturing": "XLI",
  Transportation: "XLI",
  "Commercial Services": "XLI",
  "Distribution Services": "XLI",
  "Process Industries": "XLB",
  "Non-Energy Minerals": "XLB",
};

/** Industries that belong with another index than their TradingView sector's fund. */
const INDUSTRY_INDEX: Record<string, Fund | "SOX"> = {
  Semiconductors: "SOX",
  "Electronic Production Equipment": "SOX",
  "Aerospace & Defense": "XLI",
  "Internet Software/Services": "XLC",
  "Advertising/Marketing Services": "XLC",
  Broadcasting: "XLC",
  "Cable/Satellite TV": "XLC",
  "Media Conglomerates": "XLC",
  "Movies/Entertainment": "XLC",
  "Publishing: Books/Magazines": "XLC",
  "Publishing: Newspapers": "XLC",
  "Apparel/Footwear": "XLY",
  "Discount Stores": "XLP",
  "Food Retail": "XLP",
  "Drugstore Chains": "XLP",
  "Food Distributors": "XLP",
  "Agricultural Commodities/Milling": "XLP",
  "Medical Distributors": "XLV",
  "Real Estate Investment Trusts": "XLRE",
  "Real Estate Development": "XLRE",
  "Oilfield Services/Equipment": "XLE",
  "Contract Drilling": "XLE",
  "Oil & Gas Pipelines": "XLE",
};

function sectorIndex(sector: string | null, industry: string | null, holdings: Record<string, number>): CompareIndex | null {
  const key = (industry && INDUSTRY_INDEX[industry]) || (sector && SECTOR_FUND[sector]) || null;
  if (!key) return null;
  if (key === "SOX") return SOX;
  const id = fundId(key);
  return { id, symbol: key, name: FUNDS[key], badge: holdings[id] ? String(holdings[id]) : "" };
}

// ---------------------------------------------------------------------------
// Live

/** The user's saved symbols: watchlist (pinned and groups) and open tabs. */
const WATCH_SYMBOLS = [...sample.PINNED.map((r) => r.symbol), ...sample.WATCH_GROUPS.flatMap((g) => g.items.map((w) => w.symbol))];
const SAVED_SYMBOLS = [...new Set([...WATCH_SYMBOLS, ...sample.OPEN_TABS])];

/** The open stock's quote with its session, last tick and dividend calendar. */
type Snapshot = Pick<Quote, "price" | "change" | "changePct" | "open" | "high" | "low" | "volume" | "sector" | "industry"> & {
  description: string | null;
  exchange: string | null;
  currency: string | null;
  /** Start of the session the quote belongs to, Unix seconds. */
  sessionStart: number | null;
  /** Time of the last price, Unix seconds. */
  lastTick: number | null;
  /** Quote delay in minutes; null when real time. */
  delayMinutes: number | null;
  /** Ex-dividend dates, YYYY-MM-DD. */
  exDividendRecent: string | null;
  exDividendNext: string | null;
  /** When the quote was fetched, Unix ms. */
  asOf: number;
};

const SNAPSHOT_COLUMNS = [
  "description", "exchange", "currency", "close", "change", "change_abs", "open", "high", "low", "volume", "sector", "industry",
  "time", "last-price-update-time", "update_mode", "ex_dividend_date_recent", "ex_dividend_date_upcoming", "etf_holdings_count",
] as const;

/**
 * One scan for the open stock (quote, session, delay, ex-dividend dates) and
 * the sector funds' holdings counts (their legend badges).
 */
async function getChartSnapshot(id: string): Promise<{ stock: Snapshot | null; holdings: Record<string, number> }> {
  "use cache";
  cacheLife("minutes");
  const { rows } = await scan({ columns: SNAPSHOT_COLUMNS, tickers: [...new Set([id, ...FUND_IDS])] });
  const asOf = Date.now();
  const holdings: Record<string, number> = {};
  let stock: Snapshot | null = null;
  for (const { tvSymbol, values: v } of rows) {
    const count = numOrNull(v.etf_holdings_count);
    if (count != null && FUND_IDS.includes(tvSymbol)) holdings[tvSymbol] = count;
    const price = numOrNull(v.close);
    if (tvSymbol !== id || price == null) continue;
    const delay = /^delayed\w*?_(\d+)$/.exec(strOrNull(v.update_mode) ?? "");
    stock = {
      price,
      change: numOrNull(v.change_abs) ?? 0,
      changePct: numOrNull(v.change) ?? 0,
      open: numOrNull(v.open),
      high: numOrNull(v.high),
      low: numOrNull(v.low),
      volume: numOrNull(v.volume),
      sector: strOrNull(v.sector),
      industry: strOrNull(v.industry),
      description: strOrNull(v.description),
      exchange: strOrNull(v.exchange),
      currency: strOrNull(v.currency),
      sessionStart: numOrNull(v.time),
      lastTick: numOrNull(v["last-price-update-time"]),
      delayMinutes: delay ? Math.round(Number(delay[1]) / 60) : null,
      exDividendRecent: utcDate(numOrNull(v.ex_dividend_date_recent)),
      exDividendNext: utcDate(numOrNull(v.ex_dividend_date_upcoming)),
      asOf,
    };
  }
  return { stock, holdings };
}

/** Calendar dates the scanner sends as midnight UTC. */
const utcDate = (t: number | null) => (t == null ? null : new Date(t * 1000).toISOString().slice(0, 10));

async function livePage(symbol: string): Promise<ChartPage | null> {
  "use cache";
  cacheLife("minutes");

  const saved = await resolveSymbols(SAVED_SYMBOLS);
  const listing = saved[symbol] ?? (await resolveSymbols([symbol]))[symbol];
  if (!listing) return null;

  const watchIds = WATCH_SYMBOLS.flatMap((s) => (saved[s] ? [saved[s].id] : []));
  // The same list on every chart page, so one cached scan serves them all.
  const contextIds = [...new Set([SPX.id, SOX.id, INDEX_IDS.NDX, ...FUND_IDS, ...watchIds])];
  const [{ stock, holdings }, quotes, fundamentals] = await Promise.all([
    getChartSnapshot(listing.id),
    getQuotes(contextIds),
    getFundamentals([listing.id]),
  ]);
  if (!stock) return null;

  const sector = sectorIndex(stock.sector, stock.industry, holdings);
  const history = await getDailyBars([...new Set([listing.id, ...(sector ? [sector.id] : []), SPX.id])], sample.BAR_COUNT);
  const bars = withLiveBar(toBars(history[listing.id] ?? []), stock);
  if (bars.length < 2) return null;
  const N = bars.length;
  const dates = bars.map((b) => b.time);

  // Sector index and S&P 500 closes on the stock's dates, ending at their live levels.
  const compare: CompareSeries[] = [];
  for (const [key, index, style] of [
    ["sector", sector, sample.SECTOR_STYLE],
    ["market", SPX, sample.MARKET_STYLE],
  ] as const) {
    const q = index && quotes[index.id];
    const values = q && closesOn(dates, history[index.id], q.price);
    if (!q || !values) continue;
    compare.push({
      key,
      symbol: index.symbol,
      name: index.name,
      badge: index.badge,
      ...style,
      last: num(q.price),
      change: changeText(q.change, q.changePct),
      up: q.change >= 0,
      values,
    });
  }

  // Earnings and ex-dividend dates: on the chart when they fall inside it,
  // the next one beside the time axis.
  const f = fundamentals[listing.id];
  const earningsDates = [f?.lastEarnings, f?.nextEarnings].flatMap((t) => (t ? [marketDateOf(t)] : []));
  const dividendDates = [stock.exDividendRecent, stock.exDividendNext].flatMap((d) => (d ? [d] : []));
  const barOf = (date: string) => (date < dates[0] || date > dates[N - 1] ? -1 : dates.findIndex((d) => d >= date));
  const onChart = (list: string[]) => [...new Set(list.map(barOf).filter((i) => i >= 0))];
  const upcoming: UpcomingEvent[] = [
    ...earningsDates
      .filter((d) => d > dates[N - 1])
      .map((d) => ({ letter: "E" as const, date: d, label: `Next earnings · ${pillDate(d)} · ${f?.nextEarningsTiming ?? "Time not confirmed"}` })),
    ...dividendDates.filter((d) => d > dates[N - 1]).map((d) => ({ letter: "D" as const, date: d, label: `Next ex-dividend date · ${pillDate(d)}` })),
  ].sort((a, b) => a.date.localeCompare(b.date));
  const next = upcoming[0] ? { ...upcoming[0], date: shortDate(upcoming[0].date) } : null;

  // The user's alerts exist only for sample symbols; keep their distance from the latest bar.
  const sec = findSecurity(symbol);
  const userChart = sec ? sample.getChartData(sec) : null;
  const alerts = (userChart?.events.alerts ?? []).map((i) => N - (sample.BAR_COUNT - i)).filter((i) => i >= 0);

  const quoteOf = (s: string): { price: number; change: number; changePct: number } | undefined =>
    s === listing.symbol ? stock : saved[s] && quotes[saved[s].id];
  const href = (s: string) => (INDEX_IDS[s] ? null : `/stock/${s}`);
  const pinned: PinnedLink[] = sample.PINNED.flatMap((r) => {
    const q = quoteOf(r.symbol);
    return q ? [{ ...r, last: num(q.price), change: q.change, changePct: q.changePct, href: href(r.symbol) }] : [];
  });
  const groups: GroupLinks[] = sample.WATCH_GROUPS.map((g) => ({
    ...g,
    items: g.items.flatMap((w) => {
      const q = quoteOf(w.symbol);
      return q ? [{ symbol: w.symbol, last: num(q.price), changePct: q.changePct, href: href(w.symbol) }] : [];
    }),
  }));

  const tick = stock.lastTick != null ? stock.lastTick * 1000 : stock.asOf;
  const exchange = exchangeName(stock.exchange ?? listing.exchange);
  const name = listing.name;
  const fair = sec ? sample.fairValue(sec) : null;

  return {
    symbol: listing.symbol,
    live: true,
    quote: {
      symbol: listing.symbol,
      price: num(stock.price),
      change: changeText(stock.change, stock.changePct),
      up: stock.change >= 0,
      asOf: `${nyFormat(tick, { month: "short", day: "numeric", year: "numeric" })} · ${nyFormat(tick, { hour: "numeric", minute: "2-digit", second: "2-digit" })}`,
    },
    security: { symbol: listing.symbol, name, exchange, changePct: stock.changePct, watched: sample.isWatched(listing.symbol) },
    chart: {
      symbol: listing.symbol,
      bars,
      compare,
      events: { earnings: onChart(earningsDates), dividends: onChart(dividendDates), alerts, next },
      alertLevel: userChart?.alertLevel ?? null,
    },
    addNoteHref: noteFor(listing.symbol),
    lastTick: `${nyFormat(tick, { month: "short", day: "numeric", year: "numeric" })} at ${nyFormat(tick, { hour: "numeric", minute: "2-digit" })}`,
    tabs: tabSymbols(listing.symbol).map((s) => ({ symbol: s, name: s === listing.symbol ? name : (saved[s]?.name ?? s) })),
    pinned,
    groups,
    alerts: sample.ALERTS,
    card: {
      symbol: listing.symbol,
      name: stock.description ?? name,
      exchange,
      classification: [stock.industry, stock.sector].filter(Boolean).join(" · ") || null,
      price: stock.price,
      change: stock.change,
      changePct: stock.changePct,
      currency: stock.currency ?? "USD",
      lastUpdate:
        `Last update at ${nyFormat(tick, { hour: "numeric", minute: "2-digit" })}, ${utcOffset(tick)}` +
        (stock.delayMinutes ? ` · ${stock.delayMinutes} min delayed` : ""),
      fairValue: fair,
      noteHref: sample.noteHref(listing.symbol),
    },
  };
}

/** Provider bars → chart bars (exchange dates, volume in millions). */
function toBars(history: DailyBar[]): Bar[] {
  return history.map((b) => ({ time: marketDateOf(b.time), o: b.open, h: b.high, l: b.low, c: b.close, v: b.volume / 1e6 }));
}

/**
 * Bring the latest bar up to the live quote: update it when the quote is for
 * the same session, or add the session's bar when the cached history ends
 * before it.
 */
function withLiveBar(bars: Bar[], q: Snapshot): Bar[] {
  const session = q.sessionStart != null ? marketDateOf(q.sessionStart) : marketDate(new Date(q.asOf));
  const last = bars[bars.length - 1];
  const c = q.price;
  const v = q.volume != null ? q.volume / 1e6 : null;
  if (last && last.time === session) {
    const o = q.open ?? last.o;
    const updated = { ...last, o, h: Math.max(q.high ?? last.h, o, c), l: Math.min(q.low ?? last.l, o, c), c, v: v ?? last.v };
    return [...bars.slice(0, -1), updated];
  }
  // Only a session that has opened (it has an opening price) gets a new bar.
  if (q.sessionStart != null && q.open != null && (!last || last.time < session)) {
    const o = q.open;
    return [...bars, { time: session, o, h: Math.max(q.high ?? c, o, c), l: Math.min(q.low ?? c, o, c), c, v: v ?? 0 }];
  }
  return bars;
}

/**
 * An index's closes on the given dates (carrying the last close over days it
 * has no bar, and its first close back before its history starts), ending at
 * its live level. Null without history.
 */
function closesOn(dates: string[], history: DailyBar[] | undefined, live: number): number[] | null {
  if (!history?.length) return null;
  const byDate = new Map(history.map((b) => [marketDateOf(b.time), b.close]));
  const first = history[0].close;
  let prev: number | null = null;
  const out = dates.map((d) => {
    prev = byDate.get(d) ?? prev;
    return prev ?? first;
  });
  out[out.length - 1] = live;
  return out;
}

/** "Nasdaq" as in the design; other exchanges as TradingView names them (NYSE, AMEX…). */
const exchangeName = (e: string) => (e === "NASDAQ" ? "Nasdaq" : e);

const NY = "America/New_York";

/** Date / time parts in New York ("Oct 30, 2026", "2:58 PM"). */
function nyFormat(ms: number, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: NY, ...options }).format(ms).replace(/ /g, " ");
}

/** "UTC−4" in summer, "UTC−5" in winter. */
function utcOffset(ms: number): string {
  const tz = new Intl.DateTimeFormat("en-US", { timeZone: NY, timeZoneName: "shortOffset" }).formatToParts(ms).find((p) => p.type === "timeZoneName");
  return (tz?.value ?? "GMT-5").replace("GMT", "UTC").replace("-", MINUS);
}
