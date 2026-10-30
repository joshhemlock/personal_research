import "server-only";

import { HEADER_INDICES, MARKET_STATUS, type IndexQuote } from "@/lib/mock/market";
import { num } from "@/lib/format";
import { getQuotes, INDEX_IDS } from "./market";
import { isSample } from "./source";

/** The two index readouts in the top bar. */
export async function getHeaderIndices(): Promise<IndexQuote[]> {
  if (isSample) return HEADER_INDICES;
  const ids = [INDEX_IDS.SPX, INDEX_IDS.NDX];
  const labels = ["S&P 500", "Nasdaq 100"];
  const quotes = await getQuotes(ids);
  return ids.flatMap((id, i) => {
    const q = quotes[id];
    return q ? [{ name: labels[i], label: `${labels[i]}, USD`, value: num(q.price), changePct: q.changePct }] : [];
  });
}

/** Fixed "Market open · 11:51 ET" text for sample mode; live mode shows a clock. */
export const fixedMarketLabel = isSample ? MARKET_STATUS.label : undefined;
