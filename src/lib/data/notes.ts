import "server-only";

// Market data around a research note (/notes, /notes/[id]).
//
// The notes themselves are the user's own data: title, body, conviction,
// scenarios, catalysts, checklist, links, the date the note was started and
// the price then, and the "then" column of the then-vs-now table. They stay
// in src/lib/mock/notes.ts until notes are saved per user. What goes live is
// the market data around a note: today's price (the change since the note,
// the scenarios' upside), the closes since the note was started, the "Now"
// column of the table and the date of the company's next earnings report.
//
// Live data is fetched in one batch for the tickers of every note, so moving
// between notes reuses the same cache entries: one quote scan a minute, one
// fundamentals scan and one price-history request a day.

import { cacheLife } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { MINUS, num, pct } from "@/lib/format";
import { NOTES, notePrice, sinceChangePct, sincePaths } from "@/lib/mock/notes";
import type { Catalyst, MetricRow, Note } from "@/lib/mock/notes";
import { marketDate, marketDateOf } from "./clock";
import { getDailyBars, getFundamentals, getQuotes, resolveSymbols } from "./market";
import { isSample } from "./source";
import type { EarningsTiming, Fundamentals } from "./types";

export type NoteMarket = {
  /** Latest price of the note's ticker; null when there is no quote. */
  price: number | null;
  /**
   * Price when the note was started. Live mode reads the split-adjusted
   * close for that day, since the sample notes' stored prices are made up.
   */
  startPrice: number;
  /** Percent change from `startPrice` to `price`. */
  changePct: number | null;
  /** Price since the note was started, in a 300×70 box; null without history. */
  paths: { line: string; area: string } | null;
  /** Then-vs-now rows, the price first. "—" where today's value isn't available. */
  rows: MetricRow[];
  /** The note's catalysts, with the company's next earnings date from the provider. */
  catalysts: Catalyst[];
  /** Provider credit to show next to the figures (live data only). */
  attribution: { name: string; href: string } | null;
};

const TRADINGVIEW = { name: "TradingView", href: "https://www.tradingview.com/" };
const NA = "—";

/** Market data for one note: the design's sample figures, or live data. */
export async function getNoteMarket(note: Note): Promise<NoteMarket> {
  if (isSample) {
    const price = notePrice(note);
    return {
      price,
      startPrice: note.started.price,
      changePct: sinceChangePct(note),
      paths: sincePaths(note),
      rows: [{ metric: "Price", then: num(note.started.price), now: num(price) }, ...note.metrics],
      catalysts: note.catalysts,
      attribution: null,
    };
  }

  // Until notes are saved per user, the batch is the sample notes' tickers.
  const symbols = [...new Set([...NOTES.map((n) => n.symbol), note.symbol])].sort();
  const since = [...NOTES.map((n) => n.started.date), note.started.date].sort()[0];
  let batch: LiveBatch | null = null;
  try {
    batch = await liveBatch(symbols, since);
  } catch (err) {
    unstable_rethrow(err);
    console.error(`Notes: market data for ${note.symbol} unavailable`, err);
  }
  return liveNoteMarket(note, batch);
}

// ---------------------------------------------------------------------------
// Live data

type LiveFundamentals = Pick<
  Fundamentals,
  | "forwardPE"
  | "revenueGrowthYoyPct"
  | "grossMarginPct"
  | "operatingMarginPct"
  | "roicPct"
  | "nextEarnings"
  | "nextEarningsTiming"
  | "nextEpsEstimate"
>;

type TickerMarket = {
  price: number;
  /** Daily closes since the batch's start date, oldest first; empty without history. */
  closes: { date: string; close: number }[];
  fundamentals: LiveFundamentals | null;
};

type LiveBatch = {
  /** Today in New York, YYYY-MM-DD. */
  today: string;
  /** Keyed by plain ticker. */
  tickers: Record<string, TickerMarket>;
};

/** Quotes, closes since `since` and fundamentals for a batch of tickers. */
async function liveBatch(symbols: string[], since: string): Promise<LiveBatch> {
  "use cache";
  cacheLife("minutes");

  const today = marketDate(new Date());
  const listings = await resolveSymbols(symbols);
  const ids = symbols.flatMap((s) => (listings[s] ? [listings[s].id] : []));

  // History and fundamentals are extras: without them the note still shows
  // today's price.
  const [quotes, bars, fundamentals] = await Promise.all([
    getQuotes(ids),
    getDailyBars(ids, barCount(since, today)).catch((err: unknown) => {
      console.error("Notes: price history unavailable", err);
      return {} as Awaited<ReturnType<typeof getDailyBars>>;
    }),
    getFundamentals(ids).catch((err: unknown) => {
      console.error("Notes: fundamentals unavailable", err);
      return {} as Awaited<ReturnType<typeof getFundamentals>>;
    }),
  ]);

  const tickers: Record<string, TickerMarket> = {};
  for (const s of symbols) {
    const id = listings[s]?.id;
    const q = id ? quotes[id] : undefined;
    if (!id || !q) continue;
    const f = fundamentals[id];
    tickers[s] = {
      price: q.price,
      closes: (bars[id] ?? []).map((b) => ({ date: marketDateOf(b.time), close: b.close })).filter((c) => c.date >= since),
      fundamentals: f
        ? {
            forwardPE: f.forwardPE,
            revenueGrowthYoyPct: f.revenueGrowthYoyPct,
            grossMarginPct: f.grossMarginPct,
            operatingMarginPct: f.operatingMarginPct,
            roicPct: f.roicPct,
            nextEarnings: f.nextEarnings,
            nextEarningsTiming: f.nextEarningsTiming,
            nextEpsEstimate: f.nextEpsEstimate,
          }
        : null,
    };
  }
  return { today, tickers };
}

/**
 * Daily bars to ask for to reach back to `since`, rounded up so the request
 * (and its cache entry) stays the same for weeks.
 */
function barCount(since: string, today: string): number {
  const days = Math.max(0, (Date.parse(today) - Date.parse(since)) / 86_400_000);
  return Math.ceil(((days * 5) / 7 + 10) / 50) * 50;
}

function liveNoteMarket(note: Note, batch: LiveBatch | null): NoteMarket {
  const t = batch?.tickers[note.symbol];
  const f = t?.fundamentals ?? null;
  const price = t?.price ?? null;

  // Closes since the note's day, with today's price as the last point.
  let paths: NoteMarket["paths"] = null;
  let startPrice = note.started.price;
  if (t && batch && t.closes.length > 0) {
    const closes = t.closes.filter((c) => c.date >= note.started.date);
    if (closes.length > 0) startPrice = closes[0].close;
    const points = closes.map((c) => c.close);
    if (closes.at(-1)?.date === batch.today) points[points.length - 1] = t.price;
    else points.push(t.price);
    paths = linePaths(points.length > 1 ? points : [t.price, t.price]);
  }

  const rows: MetricRow[] = [
    { metric: "Price", then: num(startPrice), now: price == null ? NA : num(price) },
    ...note.metrics.map((m) => ({ metric: m.metric, then: m.then, now: (f && NOW[m.metric]?.(f)) ?? NA })),
  ];

  return {
    price,
    startPrice,
    changePct: price == null ? null : (price / startPrice - 1) * 100,
    paths,
    rows,
    catalysts: batch && f ? withNextEarnings(note.catalysts, f, batch.today) : note.catalysts,
    attribution: TRADINGVIEW,
  };
}

/** "72.9%", "−4.1%" */
function percent(v: number | null): string | null {
  return v == null ? null : `${v < 0 ? MINUS : ""}${num(Math.abs(v), 1)}%`;
}

/**
 * Today's value of the then-vs-now metrics the provider has, by the label
 * used in the note. Others (comp sales, renewal rate…) show "—".
 */
const NOW: Record<string, (f: LiveFundamentals) => string | null> = {
  "Forward P/E": (f) => (f.forwardPE != null && f.forwardPE > 0 ? num(f.forwardPE, 1) : null),
  "Rev growth": (f) => (f.revenueGrowthYoyPct == null ? null : pct(f.revenueGrowthYoyPct, 1)),
  "Gross margin": (f) => percent(f.grossMarginPct),
  "Op margin": (f) => percent(f.operatingMarginPct),
  ROIC: (f) => percent(f.roicPct),
};

/** The company's own quarterly report, e.g. "Q3 FY27 earnings" (not "NVDA earnings"). */
const OWN_EARNINGS = /^Q[1-4](\s+FY\d{2,4})?\s+earnings$/i;
const EARNINGS_MATCH_DAYS = 45;
const DAY_MS = 86_400_000;

/** Catalyst wording for the report's timing; "Time not confirmed" is too long for a card. */
const TIMING_META: Record<EarningsTiming, string> = {
  "Before open": "Before open",
  "After close": "After close",
  "Time not confirmed": "Not confirmed",
};

/**
 * Puts the provider's date, timing and EPS estimate on the catalyst for the
 * company's next report: the note's upcoming quarterly report closest to the
 * provider's date, if within 45 days of it (else it's likely another quarter,
 * and the note is left as written).
 */
function withNextEarnings(items: Catalyst[], f: LiveFundamentals, today: string): Catalyst[] {
  if (f.nextEarnings == null) return items;
  const date = marketDateOf(f.nextEarnings);
  if (date < today) return items;
  const gap = (c: Catalyst) => Math.abs(Date.parse(c.date) - Date.parse(date)) / DAY_MS;
  const match = items
    .filter((c) => OWN_EARNINGS.test(c.title) && c.date >= today && gap(c) <= EARNINGS_MATCH_DAYS)
    .sort((a, b) => gap(a) - gap(b))[0];
  if (!match) return items;
  const eps = f.nextEpsEstimate;
  const timing = TIMING_META[f.nextEarningsTiming];
  const meta = eps == null ? timing : `${timing} · est. ${eps < 0 ? MINUS : ""}${num(Math.abs(eps))}`;
  return items.map((c) => (c === match ? { ...c, date, meta } : c)).sort((a, b) => a.date.localeCompare(b.date));
}

/** Line and area paths of a price series in a 300×70 box (as the sample's sincePaths). */
function linePaths(pts: number[]): { line: string; area: string } {
  const last = pts.length - 1;
  const mn = Math.min(...pts);
  const mx = Math.max(...pts);
  let line = "";
  pts.forEach((p, j) => {
    line += (j ? "L" : "M") + ((j / last) * 300).toFixed(1) + " " + (4 + (1 - (p - mn) / (mx - mn || 1)) * 62).toFixed(1);
  });
  return { line, area: line + "L300 70L0 70Z" };
}
