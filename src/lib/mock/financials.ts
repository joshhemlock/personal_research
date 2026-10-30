// Sample data for the Financials screen (/stock/[symbol]/financials).
// All numbers are made up. Never ship them as real figures.
//
// NVDA is a port of the design script (design/source/03-stock-financials.dc.html),
// so the screen reproduces the target PNG. Every other symbol gets deterministic
// generated figures, seeded from its ticker.

import { NOTE_INDEX } from "./note-index";
import { rng, seedFrom } from "./gen";
import { findSecurity, UNIVERSE, type Security } from "./market";
import { pct, signed } from "../format";

export type StatementKey = "income" | "balance" | "cash";
export type PeriodKey = "quarterly" | "annual";
export type MultipleKey = "fwdPE" | "evSales" | "pFcf";

/** A fiscal quarter, e.g. { q: "Q3", fy: "FY26", end: "Oct ’25" }. */
export type Quarter = { q: string; fy: string; end: string };

/**
 * total: bold line on a shaded band (Revenue, Net income…)
 * item:  indented secondary line (Cost of revenue, R&D…)
 * plain: regular line
 * eps:   regular line shown with two decimals
 */
export type RowKind = "total" | "item" | "plain" | "eps";

export type StatementRow = {
  label: string;
  kind: RowKind;
  /** Last four quarters, oldest first. USD millions (EPS in USD). */
  quarterly: number[];
  /** Last four fiscal years, oldest first. */
  annual: number[];
  /** TTM column: sum of the four quarters, or the latest one (balance sheet, shares). */
  agg: "sum" | "last";
  /** Year-over-year change, %. */
  yoy: number;
};

export type Kpi = {
  label: string;
  value: string;
  /** e.g. "+54.6% YoY" or "+3.1 pt YoY" */
  delta: string;
  up: boolean;
  /** Eight quarters for the mini bar chart, oldest first; the last bar is dark. */
  bars: number[];
};

export type Segment = { name: string; share: number; color: string };

export type FinancialsData = {
  symbol: string;
  name: string;
  /** Eight reported quarters, oldest first. */
  quarters: Quarter[];
  /** Four fiscal years, oldest first. */
  years: string[];
  kpis: Kpi[];
  /** Eight quarters, USD millions. */
  revenue: number[];
  netIncome: number[];
  /** Eight quarters, % of revenue. */
  margins: { gross: number[]; operating: number[]; net: number[] };
  statements: Record<StatementKey, StatementRow[]>;
  /** symbols[0] is this company; values are multiples (×) in the same order. */
  valuation: { symbols: string[]; values: Record<MultipleKey, number[]> };
  /** Eight quarters of EPS (USD), then the upcoming quarter's consensus. */
  eps: { est: number[]; actual: number[]; next: { q: string; date: string; est: number } };
  mix: { period: string; segments: Segment[] };
  nextReport: { when: string; revenueEst: string; epsEst: string; impliedMove: string };
  /** The research note behind the "Add to thesis" button. */
  thesisHref: string;
};

export const SEGMENT_COLORS = ["#111113", "#4DB07F", "#3B6FE0", "#A033E8", "#B4B4BA"];

const sum = (a: number[]) => a.reduce((s, v) => s + v, 0);
const round2 = (v: number) => Math.round(v * 100) / 100;
const round1 = (v: number) => Math.round(v * 10) / 10;
const billions = (millions: number) => (millions / 1000).toFixed(1) + "B";
/** Change from `prev` to `cur`, %, signed so that a shrinking negative reads as a fall. */
const change = (cur: number, prev: number) => (prev === 0 ? 0 : ((cur - prev) / Math.abs(prev)) * 100);

function thesisHref(symbol: string): string {
  const note = NOTE_INDEX.find((n) => n.symbol === symbol && n.type === "Thesis");
  return note ? `/notes/${note.id}` : "/notes";
}

// ---------------------------------------------------------------------------
// NVDA: hand-made sample data from the design file.

const NVDA_QUARTERS: Quarter[] = [
  { q: "Q3", fy: "FY25", end: "Oct ’24" },
  { q: "Q4", fy: "FY25", end: "Jan ’25" },
  { q: "Q1", fy: "FY26", end: "Apr ’25" },
  { q: "Q2", fy: "FY26", end: "Jul ’25" },
  { q: "Q3", fy: "FY26", end: "Oct ’25" },
  { q: "Q4", fy: "FY26", end: "Jan ’26" },
  { q: "Q1", fy: "FY27", end: "Apr ’26" },
  { q: "Q2", fy: "FY27", end: "Jul ’26" },
];

function nvda(sec: Security): FinancialsData {
  const rev = [46743, 54920, 61180, 66810];
  const gm = [0.724, 0.734, 0.73, 0.728];
  const cogs = rev.map((r, k) => Math.round(r * (1 - gm[k])));
  const gross = rev.map((r, k) => r - cogs[k]);
  const rnd = [4291, 4705, 5120, 5470];
  const sga = [1146, 1210, 1290, 1340];
  const op = gross.map((g, k) => g - rnd[k] - sga[k]);
  const oth = [580, 640, 710, 760];
  const pre = op.map((o, k) => o + oth[k]);
  const tax = pre.map((p) => Math.round(p * 0.155));
  const net = pre.map((p, k) => p - tax[k]);
  const shares = [24532, 24470, 24410, 24360];
  const eps = net.map((n, k) => round2(n / shares[k]));

  const rev8 = [30040, 35082, 39331, 44062, ...rev];
  const net8 = [16599, 19309, 22091, 18775, ...net];
  const gm8 = [75.0, 73.5, 73.0, 60.5, ...gm.map((g) => g * 100)];
  const op8 = [62.3, 61.1, 61.5, 49.1, ...op.map((o, k) => (o / rev[k]) * 100)];
  const nm8 = net8.map((n, k) => (n / rev8[k]) * 100);

  const ocf = [23751, 27414, 31840, 35102];
  const capex = [-1636, -1854, -2104, -2350];
  const fcf = ocf.map((o, k) => o + capex[k]);

  const ttmRev = sum(rev);
  const ttmNet = sum(net);
  const priorRev = sum(rev8.slice(0, 4));
  const priorNet = sum(net8.slice(0, 4));

  const row = (label: string, kind: RowKind, quarterly: number[], agg: "sum" | "last", yoy: number, annual: number[]): StatementRow => ({
    label,
    kind,
    quarterly,
    annual,
    agg,
    yoy,
  });

  return {
    symbol: sec.symbol,
    name: sec.name,
    quarters: NVDA_QUARTERS,
    years: ["FY23", "FY24", "FY25", "FY26"],
    kpis: [
      { label: "Revenue · TTM", value: billions(ttmRev), delta: pct((ttmRev / priorRev - 1) * 100, 1) + " YoY", up: true, bars: rev8 },
      { label: "Gross margin", value: ((sum(gross) / ttmRev) * 100).toFixed(1) + "%", delta: "+3.1 pt YoY", up: true, bars: gm8 },
      { label: "Operating margin", value: ((sum(op) / ttmRev) * 100).toFixed(1) + "%", delta: "+4.3 pt YoY", up: true, bars: op8 },
      { label: "Net income · TTM", value: billions(ttmNet), delta: pct((ttmNet / priorNet - 1) * 100, 1) + " YoY", up: true, bars: net8 },
      { label: "Free cash flow · TTM", value: billions(sum(fcf)), delta: "+51.0% YoY", up: true, bars: [14100, 15500, 26200, 13450, ...fcf] },
    ],
    revenue: rev8,
    netIncome: net8,
    margins: { gross: gm8, operating: op8, net: nm8 },
    statements: {
      income: [
        row("Revenue", "total", rev, "sum", 56.0, [26974, 60922, 130497, 192355]),
        row("Cost of revenue", "item", cogs, "sum", 60.2, [11618, 16621, 32639, 54011]),
        row("Gross profit", "total", gross, "sum", 54.5, [15356, 44301, 97858, 138344]),
        row("Research & development", "item", rnd, "sum", 38.1, [7339, 8675, 12914, 17260]),
        row("Sales, general & admin", "item", sga, "sum", 21.4, [2440, 2654, 3491, 4410]),
        row("Operating income", "total", op, "sum", 59.3, [4224, 32972, 81453, 116674]),
        row("Other income, net", "item", oth, "sum", 31.0, [-43, 846, 1034, 2380]),
        row("Pre-tax income", "plain", pre, "sum", 58.4, [4181, 33818, 84026, 119054]),
        row("Income tax", "item", tax, "sum", 61.0, [-187, 4058, 11146, 18454]),
        row("Net income", "total", net, "sum", 58.0, [4368, 29760, 72880, 100600]),
        row("Diluted EPS", "eps", eps, "sum", 59.1, [0.17, 1.19, 2.94, 4.09]),
        row("Diluted shares", "plain", shares, "last", -0.8, [25070, 24940, 24804, 24580]),
      ],
      balance: [
        row("Cash & short-term investments", "plain", [38487, 43210, 53691, 61204], "last", 59.0, [13296, 25984, 43210, 53691]),
        row("Accounts receivable", "item", [17693, 23065, 22132, 27808], "last", 57.2, [3827, 9999, 23065, 22132]),
        row("Inventories", "item", [14962, 15002, 14998, 16842], "last", 12.6, [5159, 5282, 10080, 15002]),
        row("Total assets", "total", [140740, 151301, 168503, 186417], "last", 32.5, [41182, 65728, 111601, 151301]),
        row("Total liabilities", "plain", [36230, 38114, 41403, 44112], "last", 21.8, [19081, 22750, 32274, 38114]),
        row("Total debt", "item", [8466, 8463, 8461, 8468], "last", 0.0, [10953, 9709, 8463, 8463]),
        row("Shareholders’ equity", "total", [104510, 113187, 127100, 142305], "last", 36.2, [22101, 42978, 79327, 113187]),
        row("Net cash", "total", [30021, 34747, 45230, 52736], "last", 75.7, [2343, 16275, 34747, 45228]),
      ],
      cash: [
        row("Operating cash flow", "total", ocf, "sum", 47.8, [5641, 28090, 64089, 101420]),
        row("Capital expenditures", "item", capex, "sum", 43.6, [-1833, -1069, -3236, -6880]),
        row("Free cash flow", "total", fcf, "sum", 48.1, [3808, 27021, 60853, 94540]),
        row("Stock-based compensation", "item", [1424, 1529, 1612, 1704], "sum", 19.7, [2710, 3549, 4737, 6020]),
        row("Share repurchases", "item", [-12814, -14100, -15820, -16450], "sum", 28.4, [-10039, -9533, -33706, -52400]),
        row("Dividends paid", "item", [-244, -243, -243, -242], "sum", -0.8, [-398, -395, -834, -975]),
      ],
    },
    valuation: {
      symbols: ["NVDA", "AMD", "AVGO", "TSM", "QCOM"],
      values: {
        fwdPE: [27.9, 34.2, 33.0, 22.6, 14.8],
        evSales: [19.7, 9.8, 21.0, 9.2, 3.9],
        pFcf: [41.7, 48.0, 40.2, 29.5, 16.1],
      },
    },
    eps: {
      est: [0.64, 0.75, 0.85, 0.8, 0.97, 1.15, 1.3, 1.42],
      actual: [16599 / 24600, 19309 / 24580, 22091 / 24560, 18775 / 24540].map(round2).concat(eps),
      next: { q: "Q3", date: "Nov 18", est: 1.68 },
    },
    mix: {
      period: "Q2 FY27",
      segments: [
        { name: "Data center", share: 88.6, color: SEGMENT_COLORS[0] },
        { name: "Gaming", share: 6.4, color: SEGMENT_COLORS[1] },
        { name: "Pro viz", share: 1.9, color: SEGMENT_COLORS[2] },
        { name: "Auto", share: 1.7, color: SEGMENT_COLORS[3] },
        { name: "Other", share: 1.4, color: SEGMENT_COLORS[4] },
      ],
    },
    nextReport: { when: "Nov 18 · after close", revenueEst: "72.1B", epsEst: "1.68", impliedMove: "±7.2%" },
    thesisHref: thesisHref(sec.symbol),
  };
}

// ---------------------------------------------------------------------------
// Every other symbol: generated from a seed. Calendar fiscal years, so the
// latest reported quarter is Q3 FY26 (Sep ’26) and Q4 reports in early Feb.

const CALENDAR_QUARTERS: Quarter[] = [
  { q: "Q4", fy: "FY24", end: "Dec ’24" },
  { q: "Q1", fy: "FY25", end: "Mar ’25" },
  { q: "Q2", fy: "FY25", end: "Jun ’25" },
  { q: "Q3", fy: "FY25", end: "Sep ’25" },
  { q: "Q4", fy: "FY25", end: "Dec ’25" },
  { q: "Q1", fy: "FY26", end: "Mar ’26" },
  { q: "Q2", fy: "FY26", end: "Jun ’26" },
  { q: "Q3", fy: "FY26", end: "Sep ’26" },
];

const SEGMENT_NAMES: Record<string, string[]> = {
  Technology: ["Products", "Services", "Licensing"],
  Consumer: ["Stores", "Online", "Membership"],
  Communication: ["Advertising", "Subscriptions", "Cloud"],
  "Health care": ["Pharma", "Devices", "Diagnostics"],
};

/** Four peers: same industry first, then same sector, then the rest of the universe. */
function peersOf(sec: Security): string[] {
  const others = UNIVERSE.filter((s) => s.symbol !== sec.symbol);
  const rank = (s: Security) => (s.industry === sec.industry ? 0 : s.sector === sec.sector ? 1 : 2);
  return [...others]
    .sort((a, b) => rank(a) - rank(b) || (seedFrom(sec.symbol + a.symbol) % 97) - (seedFrom(sec.symbol + b.symbol) % 97))
    .slice(0, 4)
    .map((s) => s.symbol);
}

function generated(sec: Security): FinancialsData {
  const r = rng(seedFrom(sec.symbol));
  const between = (lo: number, hi: number) => lo + (hi - lo) * r();
  const last4 = (a: number[]) => a.slice(4);
  const first4 = (a: number[]) => a.slice(0, 4);

  // Revenue (USD millions), eight quarters then four fiscal years.
  const base = between(2500, 60000);
  const g = between(0.006, 0.06); // quarterly growth
  const gy = (1 + g) ** 4 - 1;
  const rev8 = Array.from({ length: 8 }, (_, i) => Math.round(base * (1 + g) ** i * between(0.975, 1.025)));
  const lastFy = sum(first4(rev8));
  const revA = [3, 2, 1, 0].map((k) => Math.round((lastFy / (1 + gy) ** k) * (k ? between(0.97, 1.03) : 1)));

  // Cost structure as shares of revenue; operating margin stays at 8% or more.
  const gm = between(0.4, 0.76);
  let rd = between(0.04, 0.2);
  let sg = between(0.05, 0.16);
  if (gm - rd - sg < 0.08) {
    const f = (gm - 0.08) / (rd + sg);
    rd *= f;
    sg *= f;
  }
  const otherRate = between(0.003, 0.02);
  const taxRate = between(0.12, 0.21);

  const income = (rev: number[]) => {
    const cogs = rev.map((v) => Math.round(v * (1 - gm + between(-0.012, 0.012))));
    const gross = rev.map((v, k) => v - cogs[k]);
    const rnd = rev.map((v) => Math.round(v * rd * between(0.95, 1.05)));
    const sga = rev.map((v) => Math.round(v * sg * between(0.95, 1.05)));
    const op = gross.map((v, k) => v - rnd[k] - sga[k]);
    const other = rev.map((v) => Math.round(v * otherRate * between(0.8, 1.2)));
    const pre = op.map((v, k) => v + other[k]);
    const tax = pre.map((v) => Math.round(v * taxRate));
    const net = pre.map((v, k) => v - tax[k]);
    return { cogs, gross, rnd, sga, op, other, pre, tax, net };
  };
  const q = income(rev8);
  const a = income(revA);

  // Shares (millions) sized so the trailing P/E is plausible at today's price.
  const pe = between(18, 42);
  const sharesNow = sum(last4(q.net)) / (sec.price / pe);
  const shares8 = rev8.map((_, i) => Math.round(sharesNow * (1 + 0.0025 * (7 - i))));
  const sharesA = [3, 2, 1, 0].map((k) => Math.round(sharesNow * (1 + 0.012 * (k + 1))));
  const eps8 = q.net.map((n, i) => round2(n / shares8[i]));
  const epsA = a.net.map((n, k) => round2(n / sharesA[k]));

  // Cash flow.
  const ocfRate = between(1.05, 1.3);
  const capexRate = between(0.1, 0.45);
  const sbcRate = between(0.01, 0.05);
  const buybackRate = between(0.2, 0.8);
  const divRate = between(0.02, 0.35);
  const cash = (rev: number[], net: number[]) => {
    const ocf = net.map((v) => Math.round(v * ocfRate * between(0.95, 1.05)));
    const capex = ocf.map((v) => -Math.round(v * capexRate * between(0.9, 1.1)));
    const fcf = ocf.map((v, k) => v + capex[k]);
    const sbc = rev.map((v) => Math.round(v * sbcRate * between(0.95, 1.05)));
    const buyback = fcf.map((v) => -Math.round(v * buybackRate * between(0.85, 1.15)));
    const dividends = net.map((v) => -Math.round(v * divRate * between(0.97, 1.03)));
    return { ocf, capex, fcf, sbc, buyback, dividends };
  };
  const cq = cash(rev8, q.net);
  const ca = cash(revA, a.net);

  // Balance sheet: point-in-time lines, eight quarter-ends and four year-ends.
  const ttmRev = sum(last4(rev8));
  const line = (level: number, gq: number) => {
    const qv = rev8.map((_, i) => Math.round(level * (1 + gq) ** (i - 7) * between(0.97, 1.03)));
    const av = [3, 2, 1, 0].map((k) => Math.round((qv[3] / (1 + gq) ** (4 * k)) * between(0.95, 1.05)));
    return { qv, av };
  };
  const cashBal = line(ttmRev * between(0.15, 0.6), between(0.01, 0.05));
  const receivables = line(rev8[7] * between(0.35, 0.7), g);
  const inventories = line(q.cogs[7] * between(0.3, 1.1), g);
  const otherAssets = line(ttmRev * between(0.4, 1.1), between(0.005, 0.03));
  const liabRate = between(0.25, 0.6);
  const debtRate = between(0.15, 0.55);
  const combine = (f: (k: number, key: "qv" | "av") => number) => ({
    qv: rev8.map((_, k) => f(k, "qv")),
    av: revA.map((_, k) => f(k, "av")),
  });
  const assets = combine((k, key) => cashBal[key][k] + receivables[key][k] + inventories[key][k] + otherAssets[key][k]);
  const liabilities = combine((k, key) => Math.round(assets[key][k] * liabRate));
  const debt = combine((k, key) => Math.round(liabilities[key][k] * debtRate));
  const equity = combine((k, key) => assets[key][k] - liabilities[key][k]);
  const netCash = combine((k, key) => cashBal[key][k] - debt[key][k]);

  const flowRow = (label: string, kind: RowKind, q8: number[], annual: number[]): StatementRow => ({
    label,
    kind,
    quarterly: last4(q8),
    annual,
    agg: "sum",
    yoy: round1(change(sum(last4(q8)), sum(first4(q8)))),
  });
  const pointRow = (label: string, kind: RowKind, s: { qv: number[]; av: number[] }): StatementRow => ({
    label,
    kind,
    quarterly: last4(s.qv),
    annual: s.av,
    agg: "last",
    yoy: round1(change(s.qv[7], s.qv[3])),
  });

  // Headline tiles.
  const pctOf = (part: number[], whole: number[]) => part.map((v, k) => (v / whole[k]) * 100);
  const gm8 = pctOf(q.gross, rev8);
  const op8 = pctOf(q.op, rev8);
  const marginTtm = (part: number[], which: (x: number[]) => number[]) => (sum(which(part)) / sum(which(rev8))) * 100;
  const kpiFlow = (label: string, s: number[]): Kpi => {
    const d = change(sum(last4(s)), sum(first4(s)));
    return { label, value: billions(sum(last4(s))), delta: pct(d, 1) + " YoY", up: d >= 0, bars: s };
  };
  const kpiMargin = (label: string, part: number[], bars: number[]): Kpi => {
    const d = marginTtm(part, last4) - marginTtm(part, first4);
    return { label, value: marginTtm(part, last4).toFixed(1) + "%", delta: signed(d, 1) + " pt YoY", up: d >= 0, bars };
  };

  // Valuation: this company's multiples from its own numbers; peers scattered around them.
  const price = sec.price;
  const marketCap = price * sharesNow;
  const own = {
    fwdPE: round1(price / (sum(last4(eps8)) * (1 + gy))),
    evSales: round1((marketCap - netCash.qv[7]) / ttmRev),
    pFcf: round1(marketCap / sum(last4(cq.fcf))),
  };
  const peers = peersOf(sec);
  const spread = (v: number) => [v, ...peers.map(() => round1(v * between(0.5, 1.4)))];

  // Earnings: estimates a few percent off the reported EPS.
  const est8 = eps8.map((v) => round2(v / (1 + between(-0.05, 0.08))));
  const nextEst = round2(eps8[7] * (1 + g) * between(0.99, 1.04));

  // Revenue mix: one dominant segment, two smaller ones, then "Other" (gray).
  const names = [...(SEGMENT_NAMES[sec.sector] ?? ["Core", "Growth", "Services"]), "Other"];
  const lead = between(48, 80);
  const w = [between(0.5, 1), between(0.2, 0.5), between(0.1, 0.3)];
  const mix = [lead, ...w.map((x) => ((100 - lead) * x) / sum(w))].map(round1);
  mix[3] = round1(100 - sum(mix.slice(0, 3)));
  const segments = names.map((name, k) => ({ name, share: mix[k], color: SEGMENT_COLORS[k === 3 ? 4 : k] }));

  const day = 3 + Math.floor(between(0, 10));
  const when = `Feb ${day} · ${r() < 0.65 ? "after close" : "before open"}`;

  return {
    symbol: sec.symbol,
    name: sec.name,
    quarters: CALENDAR_QUARTERS,
    years: ["FY22", "FY23", "FY24", "FY25"],
    kpis: [
      kpiFlow("Revenue · TTM", rev8),
      kpiMargin("Gross margin", q.gross, gm8),
      kpiMargin("Operating margin", q.op, op8),
      kpiFlow("Net income · TTM", q.net),
      kpiFlow("Free cash flow · TTM", cq.fcf),
    ],
    revenue: rev8,
    netIncome: q.net,
    margins: { gross: gm8, operating: op8, net: pctOf(q.net, rev8) },
    statements: {
      income: [
        flowRow("Revenue", "total", rev8, revA),
        flowRow("Cost of revenue", "item", q.cogs, a.cogs),
        flowRow("Gross profit", "total", q.gross, a.gross),
        flowRow("Research & development", "item", q.rnd, a.rnd),
        flowRow("Sales, general & admin", "item", q.sga, a.sga),
        flowRow("Operating income", "total", q.op, a.op),
        flowRow("Other income, net", "item", q.other, a.other),
        flowRow("Pre-tax income", "plain", q.pre, a.pre),
        flowRow("Income tax", "item", q.tax, a.tax),
        flowRow("Net income", "total", q.net, a.net),
        flowRow("Diluted EPS", "eps", eps8, epsA),
        pointRow("Diluted shares", "plain", { qv: shares8, av: sharesA }),
      ],
      balance: [
        pointRow("Cash & short-term investments", "plain", cashBal),
        pointRow("Accounts receivable", "item", receivables),
        pointRow("Inventories", "item", inventories),
        pointRow("Total assets", "total", assets),
        pointRow("Total liabilities", "plain", liabilities),
        pointRow("Total debt", "item", debt),
        pointRow("Shareholders’ equity", "total", equity),
        pointRow("Net cash", "total", netCash),
      ],
      cash: [
        flowRow("Operating cash flow", "total", cq.ocf, ca.ocf),
        flowRow("Capital expenditures", "item", cq.capex, ca.capex),
        flowRow("Free cash flow", "total", cq.fcf, ca.fcf),
        flowRow("Stock-based compensation", "item", cq.sbc, ca.sbc),
        flowRow("Share repurchases", "item", cq.buyback, ca.buyback),
        flowRow("Dividends paid", "item", cq.dividends, ca.dividends),
      ],
    },
    valuation: {
      symbols: [sec.symbol, ...peers],
      values: { fwdPE: spread(own.fwdPE), evSales: spread(own.evSales), pFcf: spread(own.pFcf) },
    },
    eps: { est: est8, actual: eps8, next: { q: "Q4", date: `Feb ${day}`, est: nextEst } },
    mix: { period: "Q3 FY26", segments },
    nextReport: {
      when,
      revenueEst: billions(rev8[7] * (1 + g)),
      epsEst: nextEst.toFixed(2),
      impliedMove: `±${between(3.5, 9).toFixed(1)}%`,
    },
    thesisHref: thesisHref(sec.symbol),
  };
}

/** Financials sample data for a symbol, or undefined if it isn't in the universe. */
export function getFinancials(symbol: string): FinancialsData | undefined {
  const sec = findSecurity(symbol);
  if (!sec) return undefined;
  return sec.symbol === "NVDA" ? nvda(sec) : generated(sec);
}
