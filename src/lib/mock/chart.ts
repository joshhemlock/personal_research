// Sample data for the stock chart screen (/stock/[symbol]).
// All numbers are made up. Never ship them as real figures.
//
// NVDA is an exact port of design/source/02-stock-chart.dc.html (seeded RNG,
// same shape), so it reproduces design/screens/02-stock-chart.png. Every other
// UNIVERSE symbol gets a deterministic series seeded from its ticker and scaled
// to its sample price.

import { rng, seedFrom } from "./gen";
import { AS_OF, type Security } from "./market";
import { NOTE_INDEX } from "./note-index";

/** One daily bar. Volume is in millions of shares. */
export type Bar = { time: string; o: number; h: number; l: number; c: number; v: number };

export type CompareKey = "sector" | "market";

/** A comparison index drawn rebased onto the price axis (SOX, S&P 500…). */
export type CompareSeries = {
  key: CompareKey;
  symbol: string;
  /** "Semis index", "S&P 500". */
  name: string;
  /** Text in the round legend badge (number of constituents). */
  badge: string;
  /** Legend dot, chip dot and axis tag. */
  color: string;
  /** Line stroke on the chart. */
  stroke: string;
  /** Line width in CSS px. */
  width: number;
  /** Index quote shown in the legend. */
  last: string;
  change: string;
  up: boolean;
  /** Raw index level per bar (rebased on the client to the first visible bar). */
  values: number[];
};

export type ChartEvents = {
  /** Bar indexes of earnings reports, dividends and fired alerts. */
  earnings: number[];
  dividends: number[];
  alerts: number[];
};

export type ChartData = {
  symbol: string;
  bars: Bar[];
  compare: CompareSeries[];
  events: ChartEvents;
  /** Price of the user's active price alert, drawn as a red line. */
  alertLevel: number | null;
};

/** Number of daily bars every series carries (a bit over two years). */
export const BAR_COUNT = 520;

const round = (v: number, d = 4) => {
  const f = 10 ** d;
  return Math.round(v * f) / f;
};

/** Weekdays ending on the sample "as of" day (Fri Oct 30, 2026), as YYYY-MM-DD. */
function tradingDays(n: number): string[] {
  const out = new Array<string>(n);
  const d = new Date(Date.UTC(2026, 9, 30));
  for (let i = n - 1; i >= 0; i--) {
    out[i] = d.toISOString().slice(0, 10);
    do d.setUTCDate(d.getUTCDate() - 1);
    while (d.getUTCDay() === 0 || d.getUTCDay() === 6);
  }
  return out;
}

const DAYS = tradingDays(BAR_COUNT);

// ---------------------------------------------------------------------------
// Comparison indexes

type IndexInfo = Omit<CompareSeries, "key" | "values" | "color" | "stroke" | "width">;

const SOX: IndexInfo = { symbol: "SOX", name: "Semis index", badge: "30", last: "6,412.30", change: "+89.80 (+1.42%)", up: true };
const SPX: IndexInfo = { symbol: "SPX", name: "S&P 500", badge: "500", last: "6,812.45", change: "+25.78 (+0.38%)", up: true };

/** Sector index used as the gray comparison line, by industry. */
const SECTOR_INDEX: Record<string, IndexInfo> = {
  Semiconductors: SOX,
  "Semi equipment": SOX,
  Software: { symbol: "XLK", name: "Tech sector", badge: "70", last: "286.15", change: "+1.84 (+0.65%)", up: true },
  Networking: { symbol: "XLK", name: "Tech sector", badge: "70", last: "286.15", change: "+1.84 (+0.65%)", up: true },
  "Consumer electronics": { symbol: "XLK", name: "Tech sector", badge: "70", last: "286.15", change: "+1.84 (+0.65%)", up: true },
  "Interactive media": { symbol: "XLC", name: "Comm. services", badge: "22", last: "112.40", change: "−0.37 (−0.33%)", up: false },
  "Internet retail": { symbol: "XLY", name: "Cons. discretionary", badge: "50", last: "231.75", change: "+1.62 (+0.70%)", up: true },
  "Discount stores": { symbol: "XLP", name: "Cons. staples", badge: "38", last: "82.10", change: "−0.29 (−0.35%)", up: false },
  Pharmaceuticals: { symbol: "XLV", name: "Health care", badge: "60", last: "148.85", change: "−0.52 (−0.35%)", up: false },
  Biotechnology: { symbol: "XLV", name: "Health care", badge: "60", last: "148.85", change: "−0.52 (−0.35%)", up: false },
  "Health equipment": { symbol: "XLV", name: "Health care", badge: "60", last: "148.85", change: "−0.52 (−0.35%)", up: false },
};

const SECTOR_STYLE = { color: "#8A8A92", stroke: "#9A9AA2", width: 1.6 } as const;
const MARKET_STYLE = { color: "#A033E8", stroke: "#A033E8", width: 1.8 } as const;

/** SOX and S&P 500 walks from the design (one RNG, interleaved). */
function designIndexes(n: number): { sox: number[]; spx: number[] } {
  const r = rng(99);
  const sox: number[] = [];
  const spx: number[] = [];
  let a = 100;
  let b = 100;
  for (let i = 0; i < n; i++) {
    a *= 1 + 0.0011 + (r() - 0.5) * 0.026;
    b *= 1 + 0.0005 + (r() - 0.5) * 0.011;
    sox.push(round(a));
    spx.push(round(b));
  }
  return { sox, spx };
}

function sectorWalk(symbol: string, n: number): number[] {
  const r = rng(seedFrom(`index:${symbol}`));
  const out: number[] = [];
  let a = 100;
  for (let i = 0; i < n; i++) {
    a *= 1 + 0.0007 + (r() - 0.5) * 0.018;
    out.push(round(a));
  }
  return out;
}

// ---------------------------------------------------------------------------
// Price series

/** NVDA: exact port of data() in the design file. */
function nvdaBars(): { bars: Bar[]; earnings: number[]; dividends: number[] } {
  const N = BAR_COUNT;
  const r = rng(7);
  const c: number[] = [];
  let noise = 0;
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    const base = 62 + 126 * Math.pow(t, 1.7);
    const dip = -16 * Math.exp(-Math.pow((t - 0.83) / 0.045, 2));
    const wave = 5 * Math.sin(t * 34) + 2.2 * Math.sin(t * 91);
    noise = noise * 0.86 + (r() - 0.5) * 3.2;
    c.push(base + dip + wave + noise);
  }
  const k = 188.42 / c[N - 1];
  const raw: Omit<Bar, "time">[] = [];
  for (let i = 0; i < N; i++) {
    const cl = c[i] * k;
    const op = i ? c[i - 1] * k * (1 + (r() - 0.5) * 0.01) : cl;
    raw.push({ o: op, h: Math.max(op, cl) * (1 + r() * 0.013), l: Math.min(op, cl) * (1 - r() * 0.013), c: cl, v: 110 + r() * 95 });
  }
  const pv = raw[N - 2];
  pv.c = 184.47;
  pv.h = Math.max(pv.h, pv.c, pv.o);
  pv.l = Math.min(pv.l, pv.c, pv.o);
  Object.assign(raw[N - 1], { o: 185.1, h: 189.3, l: 184.62, c: 188.42, v: 162.4 });

  const earnings: number[] = [];
  const dividends: number[] = [];
  for (let i = N - 48; i > 0; i -= 63) {
    earnings.push(i);
    if (i + 1 < N) raw[i + 1].v *= 1.9;
  }
  for (let i = N - 30; i > 0; i -= 63) dividends.push(i);
  return { bars: toBars(raw), earnings, dividends };
}

/** Any other symbol: same recipe with shape parameters drawn from its seed. */
function sampleBars(sec: Security): { bars: Bar[]; earnings: number[]; dividends: number[] } {
  const N = BAR_COUNT;
  const r = rng(seedFrom(sec.symbol));
  const rise = 0.25 + r() * 1.5;
  const curve = 0.8 + r() * 1.4;
  const dipAt = 0.45 + r() * 0.45;
  const dipDepth = 4 + r() * 12;
  const f1 = 18 + r() * 24;
  const f2 = 60 + r() * 50;
  const phase = r() * Math.PI * 2;
  const volBase = 8 + r() * 70;

  const c: number[] = [];
  let noise = 0;
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    const base = 100 * (1 + rise * Math.pow(t, curve));
    const dip = -dipDepth * Math.exp(-Math.pow((t - dipAt) / 0.05, 2));
    const wave = 4 * Math.sin(t * f1 + phase) + 1.8 * Math.sin(t * f2);
    noise = noise * 0.86 + (r() - 0.5) * 3.2;
    c.push(base + dip + wave + noise);
  }
  const k = sec.price / c[N - 1];
  const raw: Omit<Bar, "time">[] = [];
  for (let i = 0; i < N; i++) {
    const cl = c[i] * k;
    const op = i ? c[i - 1] * k * (1 + (r() - 0.5) * 0.01) : cl;
    raw.push({ o: op, h: Math.max(op, cl) * (1 + r() * 0.013), l: Math.min(op, cl) * (1 - r() * 0.013), c: cl, v: volBase * (0.75 + r() * 0.6) });
  }
  // Make the last two bars agree with the sample quote (price and day change).
  const prev = raw[N - 2];
  prev.c = sec.price - sec.change;
  prev.h = Math.max(prev.h, prev.c, prev.o);
  prev.l = Math.min(prev.l, prev.c, prev.o);
  const last = raw[N - 1];
  last.o = prev.c * (1 + (r() - 0.5) * 0.006);
  last.c = sec.price;
  last.h = Math.max(last.o, last.c) * (1 + r() * 0.008);
  last.l = Math.min(last.o, last.c) * (1 - r() * 0.008);

  const earnings: number[] = [];
  const dividends: number[] = [];
  const eOff = 30 + Math.floor(r() * 30);
  const dOff = 12 + Math.floor(r() * 40);
  for (let i = N - eOff; i > 0; i -= 63) {
    earnings.push(i);
    if (i + 1 < N) raw[i + 1].v *= 1.9;
  }
  for (let i = N - dOff; i > 0; i -= 63) dividends.push(i);
  return { bars: toBars(raw), earnings, dividends };
}

function toBars(raw: Omit<Bar, "time">[]): Bar[] {
  return raw.map((b, i) => ({ time: DAYS[i], o: round(b.o), h: round(b.h), l: round(b.l), c: round(b.c), v: round(b.v, 2) }));
}

const cache = new Map<string, ChartData>();

/** Daily bars, comparison indexes and chart events for a sample security. */
export function getChartData(sec: Security): ChartData {
  const hit = cache.get(sec.symbol);
  if (hit) return hit;

  const N = BAR_COUNT;
  const nvda = sec.symbol === "NVDA";
  const { bars, earnings, dividends } = nvda ? nvdaBars() : sampleBars(sec);
  const { sox, spx } = designIndexes(N);
  const sectorInfo = SECTOR_INDEX[sec.industry] ?? SPX;
  const sectorValues = sectorInfo === SOX ? sox : sectorWalk(sectorInfo.symbol, N);

  const seed = seedFrom(`alerts:${sec.symbol}`);
  const data: ChartData = {
    symbol: sec.symbol,
    bars,
    compare: [
      { key: "sector", ...sectorInfo, ...SECTOR_STYLE, values: sectorValues },
      { key: "market", ...SPX, ...MARKET_STYLE, values: spx },
    ],
    events: {
      earnings,
      dividends,
      alerts: nvda ? [N - 12, N - 41, N - 77, N - 104] : [N - 9 - (seed % 9), N - 46 - (seed % 13), N - 95 - (seed % 17)],
    },
    alertLevel: nvda ? 175 : null,
  };
  cache.set(sec.symbol, data);
  return data;
}

// ---------------------------------------------------------------------------
// Right column and tabs

export type WatchRow = {
  symbol: string;
  /** Text in the round badge: first letter, or index size ("500"). */
  badge: string;
  badgeBg: string;
  last: string;
  change: number;
  changePct: number;
};

/** Pinned rows at the top of the watchlist panel. */
export const PINNED: WatchRow[] = [
  { symbol: "NVDA", badge: "N", badgeBg: "#111113", last: "188.42", change: 3.95, changePct: 2.14 },
  { symbol: "AVGO", badge: "A", badgeBg: "#111113", last: "342.15", change: 10.03, changePct: 3.02 },
  { symbol: "SPX", badge: "500", badgeBg: "#E5484D", last: "6,812.45", change: 25.78, changePct: 0.38 },
  { symbol: "NDX", badge: "100", badgeBg: "#3B6FE0", last: "25,410.20", change: 179.13, changePct: 0.71 },
];

export type WatchGroup = { id: string; name: string; items: { symbol: string; last: string; changePct: number }[] };

/** Collapsible watchlist groups. */
export const WATCH_GROUPS: WatchGroup[] = [
  {
    id: "semis",
    name: "Semiconductors",
    items: [
      { symbol: "AMD", last: "248.10", changePct: -0.84 },
      { symbol: "TSM", last: "296.40", changePct: 1.12 },
      { symbol: "QCOM", last: "168.25", changePct: 0.27 },
      { symbol: "MRVL", last: "92.60", changePct: 1.94 },
    ],
  },
  {
    id: "megacap",
    name: "Mega-cap tech",
    items: [
      { symbol: "AAPL", last: "254.10", changePct: -0.38 },
      { symbol: "MSFT", last: "512.66", changePct: 0.91 },
      { symbol: "GOOGL", last: "247.80", changePct: -0.62 },
      { symbol: "META", last: "731.20", changePct: 0.44 },
      { symbol: "AMZN", last: "226.35", changePct: 1.27 },
    ],
  },
];

export type AlertTab = "Alerts" | "History" | "System";
export type AlertItem = { text: string; symbol: string; scope: string; state: string; stateColor: string };

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const fd = (i: number) => {
  const [, m, d] = DAYS[i].split("-").map(Number);
  return `${MONTHS[m - 1]} ${d}`;
};
const LAST_EARNINGS = BAR_COUNT - 48;

/** Alerts panel content per tab (the panel shows the two most recent). */
export const ALERTS: Record<AlertTab, AlertItem[]> = {
  Alerts: [
    { text: "NVDA crossing down 175.00", symbol: "NVDA", scope: "NVDA, 1D", state: "Active", stateColor: "#1A7F4E" },
    { text: "RSI (14) crossing up 70 on NVDA", symbol: "NVDA", scope: "NVDA, 1D", state: "Active", stateColor: "#1A7F4E" },
    { text: "SOX crossing down its 50-day average", symbol: "SOX", scope: "SOX, 1D", state: "Paused", stateColor: "#55555C" },
  ],
  History: [
    { text: "NVDA crossing up 185.00", symbol: "NVDA", scope: "Today 10:42", state: "Triggered", stateColor: "#9A5B00" },
    { text: "AVGO up more than 3% on the day", symbol: "AVGO", scope: "Today 09:58", state: "Triggered", stateColor: "#9A5B00" },
    { text: "NVDA volume above 2× average", symbol: "NVDA", scope: fd(LAST_EARNINGS + 1), state: "Triggered", stateColor: "#9A5B00" },
  ],
  System: [
    { text: "10-Q filed for NVDA", symbol: "NVDA", scope: fd(LAST_EARNINGS), state: "Filing", stateColor: "#3B5CCC" },
    { text: "Earnings date confirmed: Nov 18", symbol: "NVDA", scope: "Oct 22", state: "Calendar", stateColor: "#3B5CCC" },
    { text: "Q2 FY27 call transcript ready", symbol: "NVDA", scope: fd(LAST_EARNINGS), state: "Transcript", stateColor: "#3B5CCC" },
  ],
};

/** Ticker tabs open along the bottom of the chart (the current symbol is added if missing). */
export const OPEN_TABS = ["AVGO", "MSFT", "COST", "NVDA"];

/** Long company names for the ticker card, where they differ from the short name. */
export const LEGAL_NAMES: Record<string, string> = {
  NVDA: "NVIDIA Corp",
  AVGO: "Broadcom Inc",
  MSFT: "Microsoft Corp",
  AAPL: "Apple Inc",
  AMZN: "Amazon.com Inc",
  GOOGL: "Alphabet Inc",
  COST: "Costco Wholesale Corp",
  KLAC: "KLA Corp",
  LLY: "Eli Lilly and Co",
  ANET: "Arista Networks Inc",
};

/** The user's base-case fair value per symbol (from their research notes). */
export function fairValue(sec: Security): number {
  if (sec.symbol === "NVDA") return 210;
  const r = rng(seedFrom(`fair:${sec.symbol}`));
  return Math.round(sec.price * (0.9 + r() * 0.35) * 100) / 100;
}

/** The research note for a symbol, if the user has one. */
export function noteHref(symbol: string): string {
  const note = NOTE_INDEX.find((n) => n.symbol === symbol && n.type === "Thesis") ?? NOTE_INDEX.find((n) => n.symbol === symbol);
  return note ? `/notes/${note.id}` : "/notes";
}

/** "Oct 30, 2026 at 11:51 AM": when the last tick arrived. */
export const LAST_TICK = `${AS_OF.date} at ${AS_OF.time.replace(/:\d\d(?= [AP]M)/, "")}`;
/** "11:51 AM" */
export const LAST_TICK_TIME = AS_OF.time.replace(/:\d\d(?= [AP]M)/, "");
