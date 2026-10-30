import type { CompareKey, WatchGroup, WatchRow } from "@/lib/mock/chart";

export type ChartType = "candles" | "line";

/** Series the user can show or hide (chips, legend, Compare and Indicators menus). */
export type SeriesKey = "volume" | "sma" | CompareKey;
export type Visibility = Record<SeriesKey, boolean>;

export type Tool = "select" | "cross" | "line" | "text" | "measure" | "target";

/**
 * Crosshair position: a bar, plus a free price level with the crosshair tool
 * (null snaps to the bar's close, as the pointer tool does).
 */
export type Cross = { index: number; price: number | null };

/** Display options from the chart settings menu. */
export type DisplayPrefs = { grid: boolean; priceLine: boolean; alertLine: boolean };

/** Security fields the client components need (serializable). */
export type SecurityInfo = {
  symbol: string;
  name: string;
  exchange: string;
  changePct: number;
  /** On the user's watchlist (the Watching toggle's starting state). */
  watched: boolean;
};

/** A ticker tab along the bottom of the chart. */
export type OpenTab = { symbol: string; name: string };

/** Price card for the open symbol (right column). */
export type TickerCardData = {
  symbol: string;
  /** Full company name, e.g. "NVIDIA Corp". */
  name: string;
  exchange: string;
  /** "Semiconductors · Technology"; null hides the line. */
  classification: string | null;
  price: number;
  change: number;
  changePct: number;
  currency: string;
  /** "Last update at 11:51 AM, UTC−4" */
  lastUpdate: string;
  /** The user's base-case fair value; null when they haven't set one. */
  fairValue: number | null;
  noteHref: string;
};

/** A pinned watchlist row; `href` opens its chart (null for indexes). */
export type PinnedLink = WatchRow & { href: string | null };

/** A watchlist group whose rows link to their charts. */
export type GroupLinks = Omit<WatchGroup, "items"> & { items: (WatchGroup["items"][number] & { href: string | null })[] };
