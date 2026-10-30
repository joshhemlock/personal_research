import "server-only";

// TradingView's symbol search (the endpoint behind its search box).
// Unofficial; see scanner.ts.

import type { Listing } from "../types";

const SEARCH_URL = "https://symbol-search.tradingview.com/symbol_search/v3/";

type SearchHit = {
  symbol: string;
  description: string;
  type: string;
  exchange: string;
  country?: string;
  is_primary_listing?: boolean;
};

/** US-listed stocks, ETFs and ADRs matching `text`, best matches first. */
export async function searchSymbols(text: string, limit = 8): Promise<Listing[]> {
  const url = new URL(SEARCH_URL);
  url.search = new URLSearchParams({
    text,
    hl: "0",
    exchange: "",
    lang: "en",
    search_type: "undefined",
    domain: "production",
    sort_by_country: "US",
  }).toString();
  const res = await fetch(url, {
    headers: { Origin: "https://www.tradingview.com" },
    signal: AbortSignal.timeout(8_000),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`TradingView symbol search answered ${res.status}`);
  const json = (await res.json()) as { symbols?: SearchHit[] };
  const seen = new Set<string>();
  const out: Listing[] = [];
  for (const h of json.symbols ?? []) {
    if (h.country !== "US" || !["stock", "fund", "dr"].includes(h.type) || h.is_primary_listing === false) continue;
    const symbol = h.symbol.replace(/<\/?em>/g, "");
    if (seen.has(symbol)) continue;
    seen.add(symbol);
    out.push({ symbol, id: `${h.exchange}:${symbol}`, name: h.description, exchange: h.exchange });
    if (out.length >= limit) break;
  }
  return out;
}
