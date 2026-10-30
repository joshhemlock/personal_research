import type { CompareKey } from "@/lib/mock/chart";

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
};
