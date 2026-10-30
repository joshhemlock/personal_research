import "server-only";

// Price history from TradingView's chart data feed (the WebSocket its own
// charts use). Unofficial and undocumented; see scanner.ts. One connection
// serves a whole batch of symbols, one chart session each.

import type { Bar } from "../types";

const FEED_URL = "wss://data.tradingview.com/socket.io/websocket?type=chart";
const ORIGIN = "https://www.tradingview.com";
const TIMEOUT_MS = 20_000;

/** Wrap a message in the feed's `~m~<length>~m~<payload>` framing. */
function frame(payload: string): string {
  return `~m~${payload.length}~m~${payload}`;
}

function message(m: string, p: unknown[]): string {
  return frame(JSON.stringify({ m, p }));
}

/** Split a raw frame into payloads. Heartbeats come back as "~h~N". */
function payloads(raw: string): string[] {
  const out: string[] = [];
  let i = 0;
  while (i < raw.length) {
    const m = /^~m~(\d+)~m~/.exec(raw.slice(i));
    if (!m) break;
    const start = i + m[0].length;
    const len = Number(m[1]);
    out.push(raw.slice(start, start + len));
    i = start + len;
  }
  return out;
}

export class ChartFeedError extends Error {}

/**
 * Daily bars (oldest first) for each TradingView symbol, e.g. "NASDAQ:NVDA".
 * Symbols the feed can't resolve come back as empty arrays.
 */
export async function fetchDailyBars(tvSymbols: readonly string[], count: number): Promise<Record<string, Bar[]>> {
  const result: Record<string, Bar[]> = Object.fromEntries(tvSymbols.map((s) => [s, []]));
  if (tvSymbols.length === 0) return result;

  // Node's WebSocket (undici) accepts extra handshake headers as a second
  // argument; the feed only answers connections from TradingView's origin.
  const Ws = WebSocket as unknown as new (url: string, init: { headers: Record<string, string> }) => WebSocket;
  const ws = new Ws(FEED_URL, { headers: { Origin: ORIGIN } });

  const sessions = new Map(tvSymbols.map((s, i) => [`cs_${i}_${Math.random().toString(36).slice(2, 10)}`, s]));
  const pending = new Set(sessions.keys());

  return new Promise((resolve, reject) => {
    const finish = (err?: Error) => {
      clearTimeout(timer);
      try {
        ws.close();
      } catch {}
      if (err) reject(err);
      else resolve(result);
    };
    const timer = setTimeout(() => finish(new ChartFeedError("TradingView chart feed timed out")), TIMEOUT_MS);

    ws.onerror = () => finish(new ChartFeedError("TradingView chart feed connection failed"));
    ws.onopen = () => {
      ws.send(message("set_auth_token", ["unauthorized_user_token"]));
      for (const [cs, tvSymbol] of sessions) {
        ws.send(message("chart_create_session", [cs, ""]));
        ws.send(
          message("resolve_symbol", [cs, "sym", `=${JSON.stringify({ symbol: tvSymbol, adjustment: "splits", session: "regular" })}`]),
        );
        ws.send(message("create_series", [cs, "s", "s", "sym", "1D", count, ""]));
      }
    };
    ws.onmessage = (ev) => {
      for (const p of payloads(String(ev.data))) {
        if (p.startsWith("~h~")) {
          ws.send(frame(p));
          continue;
        }
        let msg: { m?: string; p?: unknown[] };
        try {
          msg = JSON.parse(p);
        } catch {
          continue;
        }
        const cs = typeof msg.p?.[0] === "string" ? (msg.p[0] as string) : "";
        const tvSymbol = sessions.get(cs);
        if (!tvSymbol) continue;
        if (msg.m === "timescale_update") {
          const points = (msg.p?.[1] as { s?: { s?: { v: number[] }[] } })?.s?.s ?? [];
          result[tvSymbol] = points.map(({ v }) => ({ time: v[0], open: v[1], high: v[2], low: v[3], close: v[4], volume: v[5] ?? 0 }));
        } else if (msg.m === "series_completed" || msg.m === "symbol_error" || msg.m === "series_error") {
          pending.delete(cs);
          if (pending.size === 0) finish();
        } else if (msg.m === "critical_error" || msg.m === "protocol_error") {
          finish(new ChartFeedError(`TradingView chart feed: ${msg.m}`));
        }
      }
    };
  });
}
