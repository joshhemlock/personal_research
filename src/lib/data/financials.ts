import "server-only";

// Data for the Financials screen (/stock/[symbol]/financials).
//
// Sample mode returns the made-up design data. Live mode reads TradingView's
// screener fields for one company (one scan) plus its largest same-industry
// peers (one scan, shared by every company in the industry), and maps them
// into the view-model types the components use (src/lib/mock/financials.ts).
//
// TradingView only keeps a quarterly / annual / TTM history for some lines
// (revenue, gross profit, EBITDA, net income, EPS, free cash flow, capex,
// total assets, total debt). Other lines only have their latest value; they
// are shown in the latest column with the history left empty ("—"), never
// filled in. Derived figures are exact identities of reported ones: cost of
// revenue = revenue − gross profit, operating cash flow = free cash flow +
// capex (checked against the reported latest value before it is used).

import { cacheLife } from "next/cache";
import { MINUS, pct, signed } from "@/lib/format";
import * as sample from "@/lib/mock/financials";
import type { FinancialsData, Kpi, MultipleKey, Quarter, RowKind, StatementRow } from "@/lib/mock/financials";
import { AS_OF, findSecurity } from "@/lib/mock/market";
import { getQuotes, resolveSymbols } from "./market";
import { isSample } from "./source";
import { numOrNull, scan, strOrNull, type ScanFilter } from "./tradingview/scanner";

export type FinancialsPage = {
  symbol: string;
  name: string;
  /** Latest quote for the top bar, or null if there is none. */
  quote: { price: number; change: number; changePct: number; asOf: string } | null;
  /** Null when the data source has no financial statements for the symbol (e.g. a fund). */
  data: FinancialsData | null;
  /** The user's thesis note behind "Add to thesis". */
  thesisHref: string;
  /** Where the figures come from: the export's first line. */
  source: string;
  /** Provider attribution to show on the page (live data only). */
  attribution: { name: string; href: string } | null;
};

/** Everything the Financials page shows for a symbol, or null if the symbol is unknown. */
export async function getFinancialsPage(symbol: string): Promise<FinancialsPage | null> {
  if (isSample) {
    const sec = findSecurity(symbol);
    const data = sec && sample.getFinancials(sec.symbol);
    if (!sec || !data) return null;
    return {
      symbol: sec.symbol,
      name: sec.name,
      quote: { price: sec.price, change: sec.change, changePct: sec.changePct, asOf: `${AS_OF.date} · ${AS_OF.time}` },
      data,
      thesisHref: data.thesisHref,
      source: "sample data",
      attribution: null,
    };
  }

  const listing = (await resolveSymbols([symbol]))[symbol.toUpperCase()];
  if (!listing) return null;
  const [quotes, data] = await Promise.all([getQuotes([listing.id]), liveFinancials(listing.id, listing.symbol, listing.name)]);
  const q = quotes[listing.id];
  return {
    symbol: listing.symbol,
    name: listing.name.replace(/\s*&$/, ""), // "JPMorgan Chase & Co." is shortened to "JPMorgan Chase &"
    quote: q ? { price: q.price, change: q.change, changePct: q.changePct, asOf: asOfLabel(q.asOf) } : null,
    data,
    thesisHref: sample.thesisHref(listing.symbol),
    source: "data from TradingView (https://www.tradingview.com/)",
    attribution: { name: "TradingView", href: "https://www.tradingview.com/" },
  };
}

// ---------------------------------------------------------------------------
// Peers

export type PeerMultiples = {
  id: string;
  symbol: string;
  /** TradingView's company logo id: share classes of one company share it. */
  logoid: string | null;
  multiples: Record<MultipleKey, number | null>;
};

const MULTIPLE_COLUMNS = [
  "price_earnings_forward_fy",
  "non_gaap_price_to_earnings_per_share_forecast_next_fy",
  "enterprise_value_to_revenue_ttm",
  "price_free_cash_flow_ttm",
] as const;

type MultipleColumn = (typeof MULTIPLE_COLUMNS)[number];

function multiplesOf(v: Record<MultipleColumn, unknown>): Record<MultipleKey, number | null> {
  return {
    fwdPE: numOrNull(v.price_earnings_forward_fy) ?? numOrNull(v.non_gaap_price_to_earnings_per_share_forecast_next_fy),
    evSales: numOrNull(v.enterprise_value_to_revenue_ttm),
    pFcf: numOrNull(v.price_free_cash_flow_ttm),
  };
}

// The scanner also takes "has_none_of" on array fields such as typespecs;
// ScanFilter's operation list doesn't name it yet.
const NOT_PREFERRED = { left: "typespecs", operation: "has_none_of", right: ["preferred"] } as unknown as ScanFilter;

/**
 * The largest US-listed companies (common shares and ADRs, one listing each)
 * in a TradingView industry, by market cap, with their valuation multiples.
 */
export async function getIndustryPeers(industry: string, count = 10): Promise<PeerMultiples[]> {
  "use cache";
  cacheLife("hours");
  const { rows } = await scan({
    columns: ["name", "logoid", ...MULTIPLE_COLUMNS],
    filter: [
      { left: "industry", operation: "equal", right: industry },
      { left: "type", operation: "in_range", right: ["stock", "dr"] },
      { left: "exchange", operation: "in_range", right: ["NASDAQ", "NYSE", "AMEX"] },
      NOT_PREFERRED,
    ],
    markets: ["america"],
    sort: { sortBy: "market_cap_basic", sortOrder: "desc" },
    range: [0, count + 4],
  });
  const seen = new Set<string>();
  const out: PeerMultiples[] = [];
  for (const { tvSymbol, values: v } of rows) {
    const logoid = strOrNull(v.logoid);
    if (logoid && seen.has(logoid)) continue; // another share class of a company already listed
    if (logoid) seen.add(logoid);
    out.push({ id: tvSymbol, symbol: String(v.name), logoid, multiples: multiplesOf(v) });
  }
  return out.slice(0, count);
}

// ---------------------------------------------------------------------------
// One company

const COLUMNS = [
  "industry", "logoid", "fundamental_currency_code",
  "fiscal_period_current", "fiscal_period_end_fq", "fiscal_period_fy", "fiscal_period_end_fy", "fiscal_period_fy_h",
  // History, newest first: quarterly, annual and trailing twelve months.
  "total_revenue_fq_h", "total_revenue_fy_h", "total_revenue_ttm_h",
  "gross_profit_fq_h", "gross_profit_fy_h", "gross_profit_ttm_h",
  "ebitda_fq_h", "ebitda_fy_h", "ebitda_ttm_h",
  "net_income_fq_h", "net_income_fy_h", "net_income_ttm_h",
  "earnings_per_share_diluted_fq_h", "earnings_per_share_diluted_fy_h", "earnings_per_share_diluted_ttm_h",
  "free_cash_flow_fq_h", "free_cash_flow_fy_h", "free_cash_flow_ttm_h",
  "capital_expenditures_unchanged_fq_h", "capital_expenditures_unchanged_fy_h", "capital_expenditures_unchanged_ttm_h",
  "total_assets_fq_h", "total_assets_fy_h",
  "total_debt_fq_h", "total_debt_fy_h",
  // Latest period only.
  "research_and_dev_fq", "research_and_dev_ttm", "research_and_dev_fy",
  "sell_gen_admin_exp_other_ttm", "sell_gen_admin_exp_other_fy",
  "oper_income_fq", "oper_income_ttm", "oper_income_fy", "operating_margin_ttm",
  "diluted_shares_outstanding_fq",
  "cash_n_short_term_invest_fq", "cash_n_short_term_invest_fy",
  "total_liabilities_fq", "total_liabilities_fy",
  "shrhldrs_equity_fq", "shrhldrs_equity_fy",
  "net_debt_fq", "net_debt_fy",
  "cash_f_operating_activities_fq", "cash_f_operating_activities_ttm", "cash_f_operating_activities_fy",
  "total_cash_dividends_paid_fq", "total_cash_dividends_paid_ttm", "total_cash_dividends_paid_fy",
  // Earnings: per-quarter EPS actual vs estimate, and the next report.
  "earnings_fq_h", "revenues_fq_h", "earnings_release_next_date", "earnings_release_next_time",
  "earnings_per_share_forecast_next_fq", "revenue_forecast_next_fq",
  ...MULTIPLE_COLUMNS,
] as const;

type Values = Record<(typeof COLUMNS)[number], unknown>;

/** A history, newest first; null where a period has no figure. */
type Hist = (number | null)[];
/** One statement line: quarterly, annual and TTM histories (newest first). */
type Line = { q: Hist; a: Hist; ttm: Hist };

const PEERS = 4;
const MILLION = 1e6;

async function liveFinancials(id: string, symbol: string, name: string): Promise<FinancialsData | null> {
  "use cache";
  cacheLife("hours");

  const { rows } = await scan({ columns: COLUMNS, tickers: [id] });
  const v = rows[0]?.values;
  if (!v) return null;

  const rev = line(v.total_revenue_fq_h, v.total_revenue_fy_h, v.total_revenue_ttm_h);
  if (!rev.q.some(isNum)) return null; // no statements, e.g. a fund

  const fiscal = fiscalCalendar(v);
  if (!fiscal) return null;

  const industry = strOrNull(v.industry);
  const self = { id, logoid: strOrNull(v.logoid) };
  const peers = industry
    ? (await getIndustryPeers(industry))
        .filter((p) => p.id !== self.id && (!self.logoid || p.logoid !== self.logoid))
        .slice(0, PEERS)
    : [];
  const own = multiplesOf(v);
  const valuation = {
    symbols: [symbol, ...peers.map((p) => p.symbol)],
    values: Object.fromEntries(
      (["fwdPE", "evSales", "pFcf"] as const).map((k) => [k, [own[k], ...peers.map((p) => p.multiples[k])]]),
    ) as Record<MultipleKey, (number | null)[]>,
  };

  const gross = line(v.gross_profit_fq_h, v.gross_profit_fy_h, v.gross_profit_ttm_h);
  const ebitda = line(v.ebitda_fq_h, v.ebitda_fy_h, v.ebitda_ttm_h);
  const net = line(v.net_income_fq_h, v.net_income_fy_h, v.net_income_ttm_h);
  const eps = line(v.earnings_per_share_diluted_fq_h, v.earnings_per_share_diluted_fy_h, v.earnings_per_share_diluted_ttm_h, 1);
  const fcf = line(v.free_cash_flow_fq_h, v.free_cash_flow_fy_h, v.free_cash_flow_ttm_h);
  const capex = line(v.capital_expenditures_unchanged_fq_h, v.capital_expenditures_unchanged_fy_h, v.capital_expenditures_unchanged_ttm_h);
  const assets = line(v.total_assets_fq_h, v.total_assets_fy_h, []);
  const debt = line(v.total_debt_fq_h, v.total_debt_fy_h, []);
  const cogs = combine(rev, gross, (r, g) => r - g);
  // Free cash flow is operating cash flow less capex (capex as a positive outlay).
  const ocf = {
    q: derived(latest(v.cash_f_operating_activities_fq), zip(fcf.q, capex.q, (f, c) => f + Math.abs(c))),
    a: derived(latest(v.cash_f_operating_activities_fy), zip(fcf.a, capex.a, (f, c) => f + Math.abs(c))),
    ttm: derived(latest(v.cash_f_operating_activities_ttm), zip(fcf.ttm, capex.ttm, (f, c) => f + Math.abs(c))),
  };
  const expense = (h: Hist) => h.map((x) => (x == null ? null : Math.abs(x)));
  const outflow = (h: Hist) => h.map((x) => (x == null ? null : -Math.abs(x)));

  const statements: FinancialsData["statements"] = {
    income: [
      flowRow("Revenue", "total", rev),
      flowRow("Cost of revenue", "item", cogs),
      flowRow("Gross profit", "total", gross),
      flowRow("Research & development", "item", {
        q: expense(latestOnly(v.research_and_dev_fq)),
        a: expense(latestOnly(v.research_and_dev_fy)),
        ttm: expense(latestOnly(v.research_and_dev_ttm)),
      }),
      flowRow("Sales, general & admin", "item", {
        q: [],
        a: expense(latestOnly(v.sell_gen_admin_exp_other_fy)),
        ttm: expense(latestOnly(v.sell_gen_admin_exp_other_ttm)),
      }),
      flowRow("Operating income", "total", {
        q: latestOnly(v.oper_income_fq),
        a: latestOnly(v.oper_income_fy),
        ttm: latestOnly(v.oper_income_ttm),
      }),
      flowRow("EBITDA", "plain", ebitda),
      flowRow("Net income", "total", net),
      flowRow("Diluted EPS", "eps", eps),
      pointRow("Diluted shares", "plain", { q: latestOnly(v.diluted_shares_outstanding_fq), a: [] }),
    ],
    balance: [
      pointRow("Cash & short-term investments", "plain", {
        q: latestOnly(v.cash_n_short_term_invest_fq),
        a: latestOnly(v.cash_n_short_term_invest_fy),
      }),
      pointRow("Total assets", "total", assets),
      pointRow("Total liabilities", "plain", { q: latestOnly(v.total_liabilities_fq), a: latestOnly(v.total_liabilities_fy) }),
      pointRow("Total debt", "item", debt),
      pointRow("Shareholders’ equity", "total", { q: latestOnly(v.shrhldrs_equity_fq), a: latestOnly(v.shrhldrs_equity_fy) }),
      pointRow("Net cash", "total", {
        q: latestOnly(v.net_debt_fq).map((x) => (x == null ? null : -x)),
        a: latestOnly(v.net_debt_fy).map((x) => (x == null ? null : -x)),
      }),
    ],
    cash: [
      flowRow("Operating cash flow", "total", ocf),
      flowRow("Capital expenditures", "item", { q: outflow(capex.q), a: outflow(capex.a), ttm: outflow(capex.ttm) }, true),
      flowRow("Free cash flow", "total", fcf),
      flowRow(
        "Dividends paid",
        "item",
        {
          q: outflow(latestOnly(v.total_cash_dividends_paid_fq)),
          a: outflow(latestOnly(v.total_cash_dividends_paid_fy)),
          ttm: outflow(latestOnly(v.total_cash_dividends_paid_ttm)),
        },
        true,
      ),
    ],
  };
  for (const key of ["income", "balance", "cash"] as const) {
    // Leave out lines with nothing to show (no R&D at a bank, no dividends at a grower).
    statements[key] = statements[key].filter((r) => [...r.quarterly, ...r.annual, r.total].some((x) => x != null && x !== 0));
  }

  // Margins, % of revenue.
  const marginOf = (part: Hist, whole: Hist) => zip(part, whole, (p, w) => (w > 0 ? (p / w) * 100 : null));
  const grossM = { q: marginOf(gross.q, rev.q), ttm: marginOf(gross.ttm, rev.ttm) };
  const ebitdaM = { q: marginOf(ebitda.q, rev.q), ttm: marginOf(ebitda.ttm, rev.ttm) };
  const netM = { q: marginOf(net.q, rev.q) };

  const kpis: Kpi[] = [];
  const flowKpi = (label: string, l: Line) => {
    const ttm = ttmOf(l);
    if (ttm == null) return;
    const d = round1(change(ttm, yearAgoTtmOf(l)));
    kpis.push({ label, value: money(ttm), delta: d == null ? undefined : `${pct(d, 1)} YoY`, up: (d ?? 0) >= 0, bars: last(l.q, 8) });
  };
  const marginKpi = (label: string, m: { q: Hist; ttm: Hist }) => {
    const now = at(m.ttm, 0);
    if (now == null) return false;
    const d = round1(diff(now, at(m.ttm, 4)));
    kpis.push({
      label,
      value: `${now < 0 ? MINUS : ""}${Math.abs(now).toFixed(1)}%`,
      delta: d == null ? undefined : `${signed(d, 1)} pt YoY`,
      up: (d ?? 0) >= 0,
      bars: last(m.q, 8),
    });
    return true;
  };
  flowKpi("Revenue · TTM", rev);
  marginKpi("Gross margin", grossM);
  // Operating income has no history at TradingView, so the tile shows EBITDA margin;
  // without EBITDA (e.g. banks), the latest TTM operating margin on its own.
  if (!marginKpi("EBITDA margin", ebitdaM)) {
    const op = numOrNull(v.operating_margin_ttm);
    if (op != null) kpis.push({ label: "Operating margin", value: `${op < 0 ? MINUS : ""}${Math.abs(op).toFixed(1)}%`, up: op >= 0, bars: [] });
  }
  flowKpi("Net income · TTM", net);
  flowKpi("Free cash flow · TTM", fcf);

  // EPS actual vs estimate, from TradingView's earnings history (oldest first).
  const earnings = earningsHistory(v.earnings_fq_h);
  const reported = earnings.filter((e) => e.reported).slice(-8);
  const upcoming = earnings.find((e) => !e.reported && (!reported.length || e.index > reported[reported.length - 1].index));
  const nextDate = numOrNull(v.earnings_release_next_date);
  const nextEps = numOrNull(v.earnings_per_share_forecast_next_fq) ?? upcoming?.estimate ?? null;
  const nextRevenue = numOrNull(v.revenue_forecast_next_fq);
  const nextQuarter = upcoming ? fiscal.label(upcoming.index) : fiscal.label(fiscal.current + 1);
  // Revenue of the same quarter a year earlier, to put the estimate in context. Taken from
  // TradingView's revenue actual-vs-estimate history, which is on the estimates' basis (for
  // banks that is net revenue, smaller than the total revenue in the statements).
  const yearAgoRevenue = earningsHistory(v.revenues_fq_h).find((e) => e.index === nextQuarter.index - 4)?.actual ?? null;

  return {
    symbol,
    name,
    quarters: fiscal.quarters(8),
    years: fiscal.years(4),
    kpis,
    revenue: last(rev.q, 8),
    netIncome: last(net.q, 8),
    margins: { gross: last(grossM.q, 8), ebitda: last(ebitdaM.q, 8), net: last(netM.q, 8) },
    statements,
    currency: strOrNull(v.fundamental_currency_code) ?? undefined,
    valuation,
    eps: {
      quarters: reported.map((e) => fiscal.label(e.index).quarter),
      est: reported.map((e) => e.estimate),
      actual: reported.map((e) => e.actual),
      next: nextEps == null ? null : { q: nextQuarter.quarter.q, date: nextDate ? shortDate(nextDate) : "TBA", est: nextEps },
    },
    mix: null, // TradingView has no revenue by segment
    nextReport: {
      when: nextDate ? `${shortDate(nextDate)}${timingLabel(numOrNull(v.earnings_release_next_time))}` : "Date not announced",
      revenueEst: nextRevenue == null ? "—" : money(nextRevenue / MILLION),
      epsEst: nextEps == null ? "—" : `${nextEps < 0 ? MINUS : ""}${Math.abs(nextEps).toFixed(2)}`,
      revenueGrowthEst: (() => {
        const g = change(nextRevenue, yearAgoRevenue);
        return g == null ? undefined : pct(g, 1);
      })(),
    },
    thesisHref: sample.thesisHref(symbol),
  };
}

// ---------------------------------------------------------------------------
// Fiscal calendar

type FiscalLabel = { index: number; quarter: Quarter };

/**
 * Quarter and year labels. TradingView names periods "2026-Q2" with its own
 * fiscal-year numbering; the labels follow the common company convention of
 * naming a fiscal year for the calendar year it ends in (NVIDIA's quarter to
 * July 2026 is Q2 FY27). Quarter-end months step back three months from the
 * latest reported quarter-end.
 */
function fiscalCalendar(v: Values) {
  const m = /^(\d{4})-Q([1-4])$/.exec(strOrNull(v.fiscal_period_current) ?? "");
  if (!m) return null;
  // Periods are counted in quarters: index = year × 4 + (quarter − 1).
  const current = Number(m[1]) * 4 + Number(m[2]) - 1;
  const endFq = numOrNull(v.fiscal_period_end_fq);
  // A 52/53-week year can end in the first days of the next month; count it in the month before.
  const endMonth = endFq == null ? null : monthIndex(endFq - 7 * 86_400);
  const endFy = numOrNull(v.fiscal_period_end_fy);
  const fy = numOrNull(v.fiscal_period_fy);
  const offset =
    endFy != null && fy != null
      ? Math.floor(monthIndex(endFy - 7 * 86_400) / 12) - fy
      : endMonth != null
        ? Math.floor((endMonth + 3 * (3 - (current % 4))) / 12) - Math.floor(current / 4)
        : 0;
  const fyLabel = (year: number) => `FY${String(year + offset).slice(-2)}`;
  const label = (index: number): FiscalLabel => {
    const month = endMonth == null ? null : endMonth - 3 * (current - index);
    return {
      index,
      quarter: {
        q: `Q${(index % 4) + 1}`,
        fy: fyLabel(Math.floor(index / 4)),
        end: month == null ? "" : `${MONTHS[month % 12]} ’${String(Math.floor(month / 12)).slice(-2)}`,
      },
    };
  };
  const yearsH = hist(v.fiscal_period_fy_h);
  const latestYear = at(yearsH, 0) ?? fy ?? Math.floor(current / 4);
  return {
    /** Index of the latest reported quarter. */
    current,
    label,
    /** The last `n` quarters, oldest first. */
    quarters: (n: number) => Array.from({ length: n }, (_, k) => label(current - (n - 1 - k)).quarter),
    /** The last `n` fiscal years, oldest first. */
    years: (n: number) => Array.from({ length: n }, (_, k) => fyLabel(latestYear - (n - 1 - k))),
  };
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Unix seconds → months since year 0 (UTC). */
function monthIndex(unixSeconds: number): number {
  const d = new Date(unixSeconds * 1000);
  return d.getUTCFullYear() * 12 + d.getUTCMonth();
}

type Earnings = { index: number; actual: number | null; estimate: number | null; reported: boolean };

/**
 * TradingView's earnings_fq_h / revenues_fq_h: [{ FiscalPeriod: "2026-Q2", Actual,
 * Estimate, IsReported }], oldest first, running into future quarters' estimates.
 */
function earningsHistory(raw: unknown): Earnings[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((e: Record<string, unknown>) => {
    const m = /^(\d{4})-Q([1-4])$/.exec(strOrNull(e?.FiscalPeriod) ?? "");
    if (!m) return [];
    return [
      {
        index: Number(m[1]) * 4 + Number(m[2]) - 1,
        actual: numOrNull(e.Actual),
        estimate: numOrNull(e.Estimate),
        reported: e.IsReported === true,
      },
    ];
  });
}

// ---------------------------------------------------------------------------
// Statement rows

/** A flow line (income, cash flow): TTM from the TTM history, YoY against the TTM a year earlier. */
function flowRow(label: string, kind: RowKind, l: Line, magnitude = false): StatementRow {
  const ttm = ttmOf(l);
  const prior = yearAgoTtmOf(l);
  // Outflows (capex, dividends) grow when they get more negative: compare sizes.
  const yoy = magnitude ? change(abs(ttm), abs(prior)) : change(ttm, prior);
  return { label, kind, quarterly: last(l.q, 4), annual: last(l.a, 4), agg: "sum", total: ttm, yoy: round1(yoy) };
}

/** A point-in-time line (balance sheet, shares): latest value, YoY against four quarters earlier. */
function pointRow(label: string, kind: RowKind, l: { q: Hist; a: Hist }): StatementRow {
  return {
    label,
    kind,
    quarterly: last(l.q, 4),
    annual: last(l.a, 4),
    agg: "last",
    total: at(l.q, 0),
    yoy: round1(change(at(l.q, 0), at(l.q, 4))),
  };
}

function ttmOf(l: Line): number | null {
  return at(l.ttm, 0) ?? sumOf(l.q, 0);
}

function yearAgoTtmOf(l: Line): number | null {
  return at(l.ttm, 4) ?? sumOf(l.q, 4);
}

/** Sum of four quarters starting at `from` (newest first), or null if one is missing. */
function sumOf(h: Hist, from: number): number | null {
  const four = [0, 1, 2, 3].map((k) => at(h, from + k));
  return four.every(isNum) ? four.reduce((s, x) => s + x, 0) : null;
}

// ---------------------------------------------------------------------------
// Small helpers

const isNum = (x: number | null): x is number => x != null;

/** Scanner history (newest first) divided by `unit`; missing periods stay in place as null. */
function hist(raw: unknown, unit = 1): Hist {
  return Array.isArray(raw) ? raw.map((x) => numOrNull(x)).map((x) => (x == null ? null : x / unit)) : [];
}

function line(q: unknown, a: unknown, ttm: unknown, unit = MILLION): Line {
  return { q: hist(q, unit), a: hist(a, unit), ttm: hist(ttm, unit) };
}

/** A latest-period value as a one-entry history, in millions. */
function latestOnly(raw: unknown): Hist {
  const x = numOrNull(raw);
  return x == null ? [] : [x / MILLION];
}

function latest(raw: unknown): number | null {
  const x = numOrNull(raw);
  return x == null ? null : x / MILLION;
}

function at(h: Hist, i: number): number | null {
  return i >= 0 ? (h[i] ?? null) : null;
}

/** The latest `n` periods, oldest first, padded with null where the history is shorter. */
function last(h: Hist, n: number): Hist {
  return Array.from({ length: n }, (_, k) => at(h, n - 1 - k));
}

function zip(a: Hist, b: Hist, f: (x: number, y: number) => number | null): Hist {
  return Array.from({ length: Math.max(a.length, b.length) }, (_, i) => {
    const x = at(a, i);
    const y = at(b, i);
    return x == null || y == null ? null : f(x, y);
  });
}

function combine(a: Line, b: Line, f: (x: number, y: number) => number): Line {
  return { q: zip(a.q, b.q, f), a: zip(a.a, b.a, f), ttm: zip(a.ttm, b.ttm, f) };
}

/**
 * A history computed from others, kept only if its latest value matches the
 * reported one; otherwise just the reported latest value.
 */
function derived(reported: number | null, computed: Hist): Hist {
  const first = at(computed, 0);
  if (reported == null) return [];
  return first != null && Math.abs(first - reported) <= Math.max(1, Math.abs(reported) * 0.005) ? computed : [reported];
}

/** Change from `prev` to `cur`, %, signed so that a shrinking loss reads as a rise. */
function change(cur: number | null, prev: number | null): number | null {
  return cur == null || prev == null || prev === 0 ? null : ((cur - prev) / Math.abs(prev)) * 100;
}

function diff(cur: number | null, prev: number | null): number | null {
  return cur == null || prev == null ? null : cur - prev;
}

function abs(x: number | null): number | null {
  return x == null ? null : Math.abs(x);
}

function round1(x: number | null): number | null {
  return x == null ? null : Math.round(x * 10) / 10;
}

/** USD millions → "303.0B", "1.21T", "512M". */
function money(millions: number): string {
  const a = Math.abs(millions);
  const sign = millions < 0 ? MINUS : "";
  if (a >= 1e6) return `${sign}${(a / 1e6).toFixed(2)}T`;
  if (a >= 1e3) return `${sign}${(a / 1e3).toFixed(1)}B`;
  return `${sign}${a.toFixed(a >= 100 ? 0 : 1)}M`;
}

const NY = "America/New_York";

/** Unix seconds → "Nov 18" (New York). */
function shortDate(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toLocaleDateString("en-US", { timeZone: NY, month: "short", day: "numeric" });
}

/**
 * " · after close" / " · before open" from TradingView's code (1 / −1). Code 0 means the
 * time isn't confirmed (the timestamp then holds a placeholder hour), so nothing is shown.
 */
function timingLabel(code: number | null): string {
  return code === 1 ? " · after close" : code === -1 ? " · before open" : "";
}

/** Unix ms → "Oct 30, 2026 · 3:11:04 PM" (New York), as the top bar shows it. */
function asOfLabel(ms: number): string {
  const d = new Date(ms);
  const date = d.toLocaleDateString("en-US", { timeZone: NY, month: "short", day: "numeric", year: "numeric" });
  const time = d.toLocaleTimeString("en-US", { timeZone: NY, hour: "numeric", minute: "2-digit", second: "2-digit" });
  return `${date} · ${time}`;
}
