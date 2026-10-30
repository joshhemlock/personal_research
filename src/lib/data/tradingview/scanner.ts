import "server-only";

// TradingView's screener endpoint (the one its own screener page calls).
// Undocumented and unofficial: field names can change without notice, and
// automated use is against TradingView's terms. Keep every call server-side
// and cached (see ../market.ts).

const SCAN_URL = "https://scanner.tradingview.com/global/scan";
const TIMEOUT_MS = 12_000;

export type ScanFilter = {
  left: string;
  operation: "equal" | "nequal" | "greater" | "egreater" | "less" | "eless" | "in_range" | "not_in_range" | "match";
  right: unknown;
};

export type ScanRequest<C extends string> = {
  columns: readonly C[];
  /** Exact TradingView symbols ("NASDAQ:NVDA"). */
  tickers?: readonly string[];
  filter?: ScanFilter[];
  /** Restrict a filtered scan to these markets, e.g. ["america"]. */
  markets?: string[];
  sort?: { sortBy: string; sortOrder: "asc" | "desc" };
  range?: [number, number];
};

export type ScanRow<C extends string> = { tvSymbol: string; values: Record<C, unknown> };

export class ScannerError extends Error {}

export async function scan<C extends string>(req: ScanRequest<C>): Promise<{ total: number; rows: ScanRow<C>[] }> {
  const body: Record<string, unknown> = { columns: req.columns };
  if (req.tickers) body.symbols = { tickers: req.tickers };
  if (req.filter) body.filter = req.filter;
  if (req.markets) body.markets = req.markets;
  if (req.sort) body.sort = req.sort;
  if (req.range) body.range = req.range;

  const res = await fetch(SCAN_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
    cache: "no-store",
  });
  if (!res.ok) throw new ScannerError(`TradingView scanner answered ${res.status}`);
  const json = (await res.json()) as { totalCount?: number; data?: { s: string; d: unknown[] }[]; error?: string };
  if (!json.data) throw new ScannerError(`TradingView scanner error: ${json.error ?? "no data"}`);

  return {
    total: json.totalCount ?? json.data.length,
    rows: json.data.map((r) => ({
      tvSymbol: r.s,
      values: Object.fromEntries(req.columns.map((c, i) => [c, r.d[i]])) as Record<C, unknown>,
    })),
  };
}

/** A finite number, or null for missing / non-numeric scanner values. */
export function numOrNull(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

export function strOrNull(v: unknown): string | null {
  return typeof v === "string" && v ? v : null;
}

/** Numeric history array (newest first), or an empty array. */
export function series(v: unknown): number[] {
  return Array.isArray(v) ? v.filter((x): x is number => typeof x === "number" && Number.isFinite(x)) : [];
}
