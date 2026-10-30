// Sample research notes for the Notes screen (/notes, /notes/[id]).
// All numbers are made up. Never ship them as real figures.
//
// This module is the single source of truth for notes: note-index.ts (used
// by the ⌘K palette) and the notes list are derived from NOTES.

import { rng } from "./gen";
import { AS_OF, findSecurity } from "./market";

export type NoteType = "Thesis" | "Earnings" | "Idea";
export type Conviction = "Low" | "Medium" | "High";
export type ScenarioKey = "Bear" | "Base" | "Bull";

/** One fair-value scenario: a price target and its probability in percent. */
export type Scenario = { key: ScenarioKey; prob: number; value: number };

/** A dated event that could move the stock. `date` is YYYY-MM-DD. */
export type Catalyst = { date: string; title: string; meta: string };

/** A metric when the note was started vs. now (the price row is derived). */
export type MetricRow = { metric: string; then: string; now: string };

export type ChecklistItem = { id: string; text: string; done: boolean };

export type LinkKind = "transcript" | "financials" | "screen" | "note";
export type LinkedItem = { kind: LinkKind; title: string; meta: string; href: string };

export type Note = {
  id: string;
  symbol: string;
  type: NoteType;
  /** Title without the symbol, e.g. "Core thesis". */
  name: string;
  /** One line for the notes list. */
  summary: string;
  /** Last saved, local market time (YYYY-MM-DDTHH:mm). */
  updated: string;
  /** When the note was started (YYYY-MM-DD) and the price then. */
  started: { date: string; price: number };
  conviction: Conviction;
  scenarios: [Scenario, Scenario, Scenario];
  // Rich-text body sections.
  thesis: string;
  drivers: string[];
  risks: string[];
  changeMind: string;
  catalysts: Catalyst[];
  metrics: MetricRow[];
  checklist: ChecklistItem[];
  linked: LinkedItem[];
  /** Seed and length of the sample "since this note" price path. */
  path: { seed: number; points: number };
};

const THESIS_CHECKLIST = [
  "How the company makes money",
  "Read the last two earnings calls",
  "Modeled three scenarios",
  "Compared valuation to five peers",
  "Wrote down exit criteria",
  "Sized the position by conviction",
];
const EARNINGS_CHECKLIST = [
  "Read the transcript",
  "Updated the model",
  "Checked guidance against consensus",
  "Logged management's key quotes",
  "Reviewed the next quarter's setup",
  "Revisited the thesis",
];
const IDEA_CHECKLIST = [
  "Understand the product",
  "Size the market",
  "Write the bear case",
  "Check the valuation",
  "Decide on a starter position",
  "Set a review date",
];

/** Checklist items c1…c6; `done` lists the ids that are ticked. */
function checklist(texts: string[], done: number[]): ChecklistItem[] {
  return texts.map((text, i) => ({ id: `c${i + 1}`, text, done: done.includes(i + 1) }));
}

function scenarios(bear: [number, number], base: [number, number], bull: [number, number]): Note["scenarios"] {
  return [
    { key: "Bear", prob: bear[0], value: bear[1] },
    { key: "Base", prob: base[0], value: base[1] },
    { key: "Bull", prob: bull[0], value: bull[1] },
  ];
}

const SHARED_LINKS = {
  screener: { kind: "screen", title: "Quality compounders screen", meta: "Screener · 18 matches", href: "/screener" },
  nvdaNote: { kind: "note", title: "NVDA — Core thesis", meta: "Note · Thesis", href: "/notes/nvda-core-thesis" },
} satisfies Record<string, LinkedItem>;

export const NOTES: Note[] = [
  {
    id: "nvda-core-thesis",
    symbol: "NVDA",
    type: "Thesis",
    name: "Core thesis",
    summary: "Data-center demand outlasts the capex cycle",
    updated: "2026-10-30T11:40",
    started: { date: "2026-08-12", price: 163.8 },
    conviction: "High",
    scenarios: scenarios([25, 140], [50, 210], [25, 260]),
    thesis:
      "Data-center compute demand outlasts the current capex cycle. The full stack — chips, networking, systems and software — keeps share and margins above peers even as custom accelerators ramp at the largest buyers.",
    drivers: [
      "Hyperscaler capex guidance for 2027",
      "Networking attach rate per rack",
      "Gross margin holds above 70% through the next product cycle",
    ],
    risks: [
      "Custom silicon takes share at the top four buyers",
      "Export restrictions widen",
      "Customer concentration in a capex downturn",
    ],
    changeMind: "Two straight quarters of data-center revenue decline, or gross margin below 65%.",
    catalysts: [
      { date: "2026-11-18", title: "Q3 FY27 earnings", meta: "After close · est. 1.68" },
      { date: "2027-02-24", title: "Q4 FY27 earnings", meta: "Expected" },
      { date: "2027-03-16", title: "Developer conference", meta: "Product roadmap" },
    ],
    metrics: [
      { metric: "Forward P/E", then: "31.2", now: "27.9" },
      { metric: "Rev growth", then: "+61.8%", now: "+54.6%" },
      { metric: "Gross margin", then: "72.4%", now: "72.9%" },
    ],
    checklist: checklist(THESIS_CHECKLIST, [1, 2, 3, 5]),
    linked: [
      { kind: "transcript", title: "Q2 FY27 call transcript", meta: "Aug 26 · 14 highlights", href: "/stock/NVDA" },
      { kind: "financials", title: "Income statement, last 4 quarters", meta: "Financials", href: "/stock/NVDA/financials" },
      SHARED_LINKS.screener,
    ],
    path: { seed: 31, points: 56 },
  },
  {
    id: "avgo-valuation-model",
    symbol: "AVGO",
    type: "Thesis",
    name: "Valuation model",
    summary: "Base case 380, bear 290, bull 450",
    updated: "2026-10-27T16:05",
    started: { date: "2026-06-09", price: 268.4 },
    conviction: "Medium",
    scenarios: scenarios([25, 290], [50, 380], [25, 450]),
    thesis:
      "Custom accelerators and Ethernet switching make Broadcom the second AI compute franchise, while the VMware software base funds the dividend. The model assumes AI chip revenue doubles over two years and infrastructure software grows in the mid single digits.",
    drivers: [
      "Custom accelerator customers in volume production",
      "AI networking revenue each quarter",
      "VMware renewal pricing and churn",
    ],
    risks: [
      "A large accelerator customer takes its design in-house",
      "Gross margin dilution as rack-scale systems grow",
      "VMware debt limits buybacks",
    ],
    changeMind: "A top-three accelerator customer moves to another design partner, or AI revenue guidance is cut twice in a row.",
    catalysts: [
      { date: "2026-12-10", title: "Q4 FY26 earnings", meta: "After close · est. 1.87" },
      { date: "2027-03-04", title: "Q1 FY27 earnings", meta: "Expected" },
      { date: "2027-04-20", title: "Dividend increase", meta: "Annual decision" },
    ],
    metrics: [
      { metric: "Forward P/E", then: "34.6", now: "38.1" },
      { metric: "Rev growth", then: "+20.4%", now: "+24.8%" },
      { metric: "Gross margin", then: "77.9%", now: "78.3%" },
    ],
    checklist: checklist(THESIS_CHECKLIST, [1, 2, 3, 4]),
    linked: [
      { kind: "transcript", title: "Q3 FY26 call transcript", meta: "Sep 11 · 9 highlights", href: "/stock/AVGO" },
      { kind: "financials", title: "Valuation vs peers", meta: "Financials", href: "/stock/AVGO/financials" },
      SHARED_LINKS.nvdaNote,
    ],
    path: { seed: 9, points: 100 },
  },
  {
    id: "cost-q4-fy26-call",
    symbol: "COST",
    type: "Earnings",
    name: "Q4 FY26 call",
    summary: "Renewal rates, traffic and membership fees",
    updated: "2026-10-29T09:12",
    started: { date: "2026-09-25", price: 945.1 },
    conviction: "High",
    scenarios: scenarios([25, 780], [50, 960], [25, 1080]),
    thesis:
      "Renewal rates near 90% and steady traffic matter more than this quarter's margin noise. The fee increase flows through over the next year, so membership income should grow faster than sales into FY27.",
    drivers: [
      "U.S. and Canada renewal rate",
      "Comparable traffic, excluding gas",
      "Executive membership share of members",
    ],
    risks: [
      "The valuation leaves no room for a slowdown",
      "Fuel and food prices squeeze margins",
      "Tariffs on general merchandise",
    ],
    changeMind: "Renewal rates fall below 89%, or traffic turns negative for two months in a row.",
    catalysts: [
      { date: "2026-11-04", title: "October sales", meta: "Monthly comps" },
      { date: "2026-12-10", title: "Q1 FY27 earnings", meta: "After close · est. 4.31" },
      { date: "2027-01-06", title: "December sales", meta: "Holiday comps" },
    ],
    metrics: [
      { metric: "Forward P/E", then: "49.8", now: "47.6" },
      { metric: "Comp sales", then: "+6.4%", now: "+6.1%" },
      { metric: "Renewal rate", then: "90.2%", now: "90.1%" },
    ],
    checklist: checklist(EARNINGS_CHECKLIST, [1, 2, 3, 4, 6]),
    linked: [
      { kind: "transcript", title: "Q4 FY26 call transcript", meta: "Sep 25 · 11 highlights", href: "/stock/COST" },
      { kind: "financials", title: "Income statement, last 4 quarters", meta: "Financials", href: "/stock/COST/financials" },
      { kind: "screen", title: "Steady consumer screen", meta: "Screener · 12 matches", href: "/screener" },
    ],
    path: { seed: 13, points: 26 },
  },
  {
    id: "anet-networking-for-ai",
    symbol: "ANET",
    type: "Idea",
    name: "Networking for AI",
    summary: "Back-end clusters moving to Ethernet",
    updated: "2026-10-14T20:31",
    started: { date: "2026-10-14", price: 131.6 },
    conviction: "Medium",
    scenarios: scenarios([30, 110], [50, 155], [20, 190]),
    thesis:
      "AI back-end networks are moving from InfiniBand to Ethernet as clusters grow past 100,000 accelerators. Arista has the switching software and the cloud customers to win a large share of that build-out.",
    drivers: [
      "Share of AI back-end networks on Ethernet",
      "800G switch shipments",
      "Revenue from customers beyond the top two clouds",
    ],
    risks: [
      "Two customers make up over a third of revenue",
      "White-box switches at the largest clouds",
      "NVIDIA's own Ethernet platform gains share",
    ],
    changeMind: "A top-two customer moves its back-end network to white-box switches, or AI revenue targets come down.",
    catalysts: [
      { date: "2026-11-03", title: "Q3 earnings", meta: "After close · est. 0.71" },
      { date: "2026-11-18", title: "NVDA earnings", meta: "Networking read-through" },
      { date: "2026-12-08", title: "Investor day", meta: "AI revenue targets" },
    ],
    metrics: [
      { metric: "Forward P/E", then: "44.2", now: "47.9" },
      { metric: "Rev growth", then: "+26.9%", now: "+27.8%" },
      { metric: "Gross margin", then: "64.1%", now: "64.3%" },
    ],
    checklist: checklist(IDEA_CHECKLIST, [1, 2]),
    linked: [
      SHARED_LINKS.nvdaNote,
      { kind: "transcript", title: "Q2 call transcript", meta: "Aug 4 · 8 highlights", href: "/stock/ANET" },
      SHARED_LINKS.screener,
    ],
    path: { seed: 26, points: 13 },
  },
  {
    id: "lly-obesity-franchise",
    symbol: "LLY",
    type: "Thesis",
    name: "Obesity franchise",
    summary: "Supply ramp vs. pricing pressure",
    updated: "2026-10-02T07:48",
    started: { date: "2026-07-08", price: 768.9 },
    conviction: "Medium",
    scenarios: scenarios([25, 640], [50, 900], [25, 1100]),
    thesis:
      "Demand for incretin drugs still exceeds supply, so volume growth depends on manufacturing more than on pricing. New plants and the oral pill widen the market faster than net prices fall.",
    drivers: [
      "Manufacturing capacity coming online",
      "Oral GLP-1 approval and launch",
      "Employer and Medicare coverage",
    ],
    risks: [
      "Net prices fall faster than volume grows",
      "Compounded and generic competition",
      "Safety findings in long-term data",
    ],
    changeMind: "Net price per prescription falls more than 20% in a year without a matching rise in volume.",
    catalysts: [
      { date: "2026-11-05", title: "Q3 earnings", meta: "Before open · est. 6.21" },
      { date: "2026-12-15", title: "Oral GLP-1 decision", meta: "FDA action date" },
      { date: "2027-02-04", title: "Q4 earnings", meta: "Expected" },
    ],
    metrics: [
      { metric: "Forward P/E", then: "33.4", now: "31.8" },
      { metric: "Rev growth", then: "+38.2%", now: "+41.0%" },
      { metric: "Gross margin", then: "82.6%", now: "83.1%" },
    ],
    checklist: checklist(THESIS_CHECKLIST, [1, 2, 3]),
    linked: [
      { kind: "transcript", title: "Q2 call transcript", meta: "Aug 6 · 12 highlights", href: "/stock/LLY" },
      { kind: "financials", title: "Income statement, last 4 quarters", meta: "Financials", href: "/stock/LLY/financials" },
      { kind: "screen", title: "Health care growth screen", meta: "Screener · 9 matches", href: "/screener" },
    ],
    path: { seed: 9, points: 82 },
  },
  {
    id: "msft-cloud-growth-tracker",
    symbol: "MSFT",
    type: "Earnings",
    name: "Cloud growth tracker",
    summary: "Quarterly growth vs. capacity adds",
    updated: "2026-10-29T18:22",
    started: { date: "2026-04-30", price: 471.2 },
    conviction: "High",
    scenarios: scenarios([20, 430], [55, 560], [25, 640]),
    thesis:
      "Azure growth is limited by capacity, not demand, so growth should track data-center additions. Each quarter, compare Azure growth with capital spending and the backlog to see whether the spending is turning into revenue.",
    drivers: [
      "Azure growth in constant currency",
      "Capital spending including finance leases",
      "Commercial remaining performance obligation",
    ],
    risks: [
      "Depreciation grows faster than cloud revenue",
      "Capacity runs ahead of AI demand in 2027",
      "Changes to the OpenAI partnership",
    ],
    changeMind: "Azure growth falls below 30% while capital spending keeps rising.",
    catalysts: [
      { date: "2026-11-17", title: "Ignite", meta: "Copilot and Azure updates" },
      { date: "2027-01-26", title: "Q2 FY27 earnings", meta: "After close · est. 3.92" },
      { date: "2027-04-27", title: "Q3 FY27 earnings", meta: "Expected" },
    ],
    metrics: [
      { metric: "Forward P/E", then: "32.1", now: "33.0" },
      { metric: "Azure growth", then: "+35%", now: "+39%" },
      { metric: "Op margin", then: "45.7%", now: "47.1%" },
    ],
    checklist: checklist(EARNINGS_CHECKLIST, [1, 2, 3, 4, 5, 6]),
    linked: [
      { kind: "transcript", title: "Q1 FY27 call transcript", meta: "Oct 28 · 16 highlights", href: "/stock/MSFT" },
      { kind: "financials", title: "Cash flow, last 4 quarters", meta: "Financials", href: "/stock/MSFT/financials" },
      SHARED_LINKS.nvdaNote,
    ],
    path: { seed: 9, points: 130 },
  },
  {
    id: "klac-screen-follow-up",
    symbol: "KLAC",
    type: "Idea",
    name: "Screen follow-up",
    summary: "Why ROIC stays above 40%",
    updated: "2026-09-30T13:05",
    started: { date: "2026-09-30", price: 1112.5 },
    conviction: "Low",
    scenarios: scenarios([30, 860], [50, 1150], [20, 1320]),
    thesis:
      "Process control is a small slice of fab spending but decides yield, which gives KLA pricing power and returns on capital above 40%. The open question is whether that holds as spending in China slows.",
    drivers: [
      "Process control share of fab equipment spending",
      "Services revenue growth",
      "Leading-edge foundry and memory spending",
    ],
    risks: [
      "China is a large share of recent sales",
      "Fab equipment spending turns down in 2027",
      "Export rules on inspection tools",
    ],
    changeMind: "Return on invested capital drops below 30% outside a downturn, or services growth stalls.",
    catalysts: [
      { date: "2026-12-15", title: "Equipment forecast", meta: "Industry outlook" },
      { date: "2027-01-27", title: "Q2 FY27 earnings", meta: "After close · est. 8.95" },
      { date: "2027-02-17", title: "Dividend decision", meta: "Expected" },
    ],
    metrics: [
      { metric: "Forward P/E", then: "30.6", now: "29.4" },
      { metric: "ROIC", then: "41.8%", now: "42.5%" },
      { metric: "Gross margin", then: "61.9%", now: "62.2%" },
    ],
    checklist: checklist(IDEA_CHECKLIST, [1]),
    linked: [
      SHARED_LINKS.screener,
      { kind: "financials", title: "Balance sheet, last 4 quarters", meta: "Financials", href: "/stock/KLAC/financials" },
      { kind: "transcript", title: "Q1 FY27 call transcript", meta: "Oct 29 · 7 highlights", href: "/stock/KLAC" },
    ],
    path: { seed: 63, points: 23 },
  },
];

// ---------------------------------------------------------------------------
// Derived values

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const TODAY = AS_OF.iso.slice(0, 10);

/** "2026-08-12" → { mon: "Aug", day: 12, year: 2026 } without time zones. */
export function dateParts(iso: string): { mon: string; day: number; year: number } {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return { mon: MONTHS[m - 1], day: d, year: y };
}

/** "Aug 12" */
export function shortDate(iso: string): string {
  const p = dateParts(iso);
  return `${p.mon} ${p.day}`;
}

/** "Aug 12, 2026" */
export function longDate(iso: string): string {
  return `${shortDate(iso)}, ${dateParts(iso).year}`;
}

/** "NVDA — Core thesis" */
export function noteTitle(n: Pick<Note, "symbol" | "name">): string {
  return `${n.symbol} — ${n.name}`;
}

/** "today" for notes saved today, else "Oct 27". */
export function listDate(n: Note): string {
  return n.updated.startsWith(TODAY) ? "today" : shortDate(n.updated);
}

/** "11:40" for notes saved today, else "Oct 27". */
export function savedLabel(n: Note): string {
  return n.updated.startsWith(TODAY) ? n.updated.slice(11, 16) : shortDate(n.updated);
}

/** Latest sample price of the note's symbol. */
export function notePrice(n: Note): number {
  return findSecurity(n.symbol)?.price ?? n.started.price;
}

/** Percent change since the note was started. */
export function sinceChangePct(n: Note): number {
  return (notePrice(n) / n.started.price - 1) * 100;
}

export function findNote(id: string): Note | undefined {
  return NOTES.find((n) => n.id === id);
}

/** The most recently saved note (what /notes opens). */
export function latestNote(): Note {
  return NOTES.reduce((a, b) => (b.updated > a.updated ? b : a));
}

/** Row of the notes list. */
export type NoteListItem = {
  id: string;
  symbol: string;
  title: string;
  summary: string;
  type: NoteType;
  date: string;
  conviction: Conviction;
};

export const NOTE_LIST: NoteListItem[] = NOTES.map((n) => ({
  id: n.id,
  symbol: n.symbol,
  title: noteTitle(n),
  summary: n.summary,
  type: n.type,
  date: listDate(n),
  conviction: n.conviction,
}));

/**
 * Sample daily closes from the start of the note to now, as in the design
 * script: a seeded walk rescaled so it starts at the note's price and ends
 * at today's, with the early part damped.
 */
export function sincePrices(n: Note): number[] {
  const { seed, points } = n.path;
  const start = n.started.price;
  const now = notePrice(n);
  const last = points - 1;
  const r = rng(seed);
  let v = start;
  const walk: number[] = [];
  for (let i = 0; i < points; i++) {
    v += (r() - 0.47) * 3.4;
    walk.push(v);
  }
  const k = (now - start) / (walk[last] - start || 1);
  const out = walk.map((p, j) => start + (p - start) * k * (0.4 + (0.6 * j) / last));
  out[last] = now;
  return out;
}

/** Line and area paths of the price since the note, in a 300×70 box. */
export function sincePaths(n: Note): { line: string; area: string } {
  const pts = sincePrices(n);
  const last = pts.length - 1;
  const mn = Math.min(...pts);
  const mx = Math.max(...pts);
  let line = "";
  pts.forEach((p, j) => {
    line += (j ? "L" : "M") + ((j / last) * 300).toFixed(1) + " " + (4 + (1 - (p - mn) / (mx - mn || 1)) * 62).toFixed(1);
  });
  return { line, area: line + "L300 70L0 70Z" };
}
