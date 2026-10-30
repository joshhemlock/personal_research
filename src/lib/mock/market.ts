// Sample market data shared by the shell (top bar, command palette).
// All numbers are made up. Never ship them as real figures.

export type IndexQuote = { name: string; label: string; value: string; changePct: number };

/** The two index readouts in the top bar. */
export const HEADER_INDICES: IndexQuote[] = [
  { name: "S&P 500", label: "S&P 500, USD", value: "6,812.45", changePct: 0.38 },
  { name: "Nasdaq 100", label: "Nasdaq 100, USD", value: "25,410.20", changePct: 0.71 },
];

export const MARKET_STATUS = { open: true, label: "Market open · 11:51 ET" };

/** "As of" moment the sample data describes. */
export const AS_OF = { date: "Oct 30, 2026", time: "11:51:04 AM", iso: "2026-10-30T11:51:04-04:00" };

export type Security = {
  symbol: string;
  name: string;
  exchange: "Nasdaq" | "NYSE";
  price: number;
  change: number;
  changePct: number;
  sector: string;
  industry: string;
};

/** Every symbol the sample data knows about. */
export const UNIVERSE: Security[] = [
  { symbol: "NVDA", name: "NVIDIA", exchange: "Nasdaq", price: 188.42, change: 3.95, changePct: 2.14, sector: "Technology", industry: "Semiconductors" },
  { symbol: "AAPL", name: "Apple", exchange: "Nasdaq", price: 254.1, change: -0.97, changePct: -0.38, sector: "Technology", industry: "Consumer electronics" },
  { symbol: "MSFT", name: "Microsoft", exchange: "Nasdaq", price: 512.66, change: 4.62, changePct: 0.91, sector: "Technology", industry: "Software" },
  { symbol: "AMZN", name: "Amazon", exchange: "Nasdaq", price: 226.35, change: 2.84, changePct: 1.27, sector: "Consumer", industry: "Internet retail" },
  { symbol: "GOOGL", name: "Alphabet", exchange: "Nasdaq", price: 247.8, change: -1.55, changePct: -0.62, sector: "Communication", industry: "Interactive media" },
  { symbol: "META", name: "Meta Platforms", exchange: "Nasdaq", price: 731.2, change: 3.2, changePct: 0.44, sector: "Communication", industry: "Interactive media" },
  { symbol: "AVGO", name: "Broadcom", exchange: "Nasdaq", price: 342.15, change: 10.03, changePct: 3.02, sector: "Technology", industry: "Semiconductors" },
  { symbol: "COST", name: "Costco", exchange: "Nasdaq", price: 918.4, change: -9.74, changePct: -1.05, sector: "Consumer", industry: "Discount stores" },
  { symbol: "KLAC", name: "KLA Corp", exchange: "Nasdaq", price: 1082.4, change: 15.15, changePct: 1.42, sector: "Technology", industry: "Semi equipment" },
  { symbol: "LLY", name: "Eli Lilly", exchange: "NYSE", price: 812.3, change: -5.89, changePct: -0.72, sector: "Health care", industry: "Pharmaceuticals" },
  { symbol: "ANET", name: "Arista Networks", exchange: "NYSE", price: 142.8, change: 2.6, changePct: 1.85, sector: "Technology", industry: "Networking" },
  { symbol: "TSM", name: "Taiwan Semiconductor", exchange: "NYSE", price: 296.4, change: 3.28, changePct: 1.12, sector: "Technology", industry: "Semiconductors" },
  { symbol: "VRTX", name: "Vertex Pharmaceuticals", exchange: "Nasdaq", price: 451.1, change: -1.63, changePct: -0.36, sector: "Health care", industry: "Biotechnology" },
  { symbol: "NOW", name: "ServiceNow", exchange: "NYSE", price: 948.2, change: -1.71, changePct: -0.18, sector: "Technology", industry: "Software" },
  { symbol: "ISRG", name: "Intuitive Surgical", exchange: "Nasdaq", price: 548.6, change: 1.8, changePct: 0.33, sector: "Health care", industry: "Health equipment" },
];

export function findSecurity(symbol: string): Security | undefined {
  const s = symbol.toUpperCase();
  return UNIVERSE.find((x) => x.symbol === s);
}
