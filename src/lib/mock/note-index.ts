// Lightweight list of sample research notes, used by the command palette.
// Sample data only.

export type NoteSummary = {
  id: string;
  symbol: string;
  title: string;
  type: "Thesis" | "Earnings" | "Idea";
  date: string;
};

export const NOTE_INDEX: NoteSummary[] = [
  { id: "nvda-core-thesis", symbol: "NVDA", title: "NVDA — Core thesis", type: "Thesis", date: "today" },
  { id: "avgo-valuation-model", symbol: "AVGO", title: "AVGO — Valuation model", type: "Thesis", date: "Oct 27" },
  { id: "cost-q4-fy26-call", symbol: "COST", title: "COST — Q4 FY26 call", type: "Earnings", date: "Oct 29" },
  { id: "anet-networking-for-ai", symbol: "ANET", title: "ANET — Networking for AI", type: "Idea", date: "Oct 14" },
  { id: "lly-obesity-franchise", symbol: "LLY", title: "LLY — Obesity franchise", type: "Thesis", date: "Oct 2" },
  { id: "msft-cloud-growth-tracker", symbol: "MSFT", title: "MSFT — Cloud growth tracker", type: "Earnings", date: "Oct 29" },
  { id: "klac-screen-follow-up", symbol: "KLAC", title: "KLAC — Screen follow-up", type: "Idea", date: "Sep 30" },
];
