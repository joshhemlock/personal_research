// Pure helpers for the price chart: visible windows, the plot geometry the
// HTML overlays are positioned with, price ticks and date labels. Shared by
// the server render (first paint) and the client chart.

import type { Bar } from "@/lib/mock/chart";

export type Timeframe = "1M" | "3M" | "6M" | "YTD" | "1Y" | "2Y";
export const TIMEFRAMES: readonly Timeframe[] = ["1M", "3M", "6M", "YTD", "1Y", "2Y"];

const TF_BARS: Record<Exclude<Timeframe, "YTD">, number> = { "1M": 22, "3M": 64, "6M": 126, "1Y": 252, "2Y": 500 };

/** Width of the price-label gutter right of the plot (px). */
export const AXIS = 76;

/** Inclusive range of bar indexes. */
export type BarWindow = { from: number; to: number };

/** The bars a timeframe shows: always ends at the latest bar. */
export function windowFor(tf: Timeframe, bars: readonly Bar[]): BarWindow {
  const N = bars.length;
  let n: number;
  if (tf === "YTD") {
    const year = bars[N - 1].time.slice(0, 4);
    n = 0;
    while (n < N && bars[N - 1 - n].time.startsWith(year)) n++;
  } else {
    n = TF_BARS[tf];
  }
  n = Math.max(2, Math.min(N, n));
  return { from: N - n, to: N - 1 };
}

/**
 * Where things land in the plot area, as fractions of its width and height:
 * bar i is centred at x = ax + bx·i and price p sits at y = ay + by·p.
 * `from`/`to` is the visible logical range; `width`/`height` the plot size in px.
 *
 * Once the chart is mounted this comes from its coordinate APIs
 * (logicalToCoordinate / priceToCoordinate); before that from designGeometry,
 * which uses the same scale rules, so the first paint already lines up.
 */
export type Geometry = {
  ax: number;
  bx: number;
  ay: number;
  by: number;
  from: number;
  to: number;
  width: number;
  height: number;
};

export const xOf = (g: Geometry, i: number) => g.ax + g.bx * i;
export const yOf = (g: Geometry, price: number) => g.ay + g.by * price;
/** Price at a vertical fraction of the plot. */
export const priceAt = (g: Geometry, y: number) => (y - g.ay) / g.by;

/** Space added below and above the data, as a share of its range (design: 18% and 12%). */
export const PAD_BELOW = 0.18;
export const PAD_ABOVE = 0.12;

/** Same scale as the chart: fit candles and visible comparison lines, then pad. */
export function designGeometry(
  bars: readonly Bar[],
  win: BarWindow,
  lines: readonly (readonly number[])[],
  size = { width: 951, height: 516 },
): Geometry {
  const n = win.to - win.from + 1;
  let lo = Infinity;
  let hi = -Infinity;
  for (let i = win.from; i <= win.to; i++) {
    lo = Math.min(lo, bars[i].l);
    hi = Math.max(hi, bars[i].h);
  }
  for (const values of lines) {
    for (let i = win.from; i <= win.to; i++) {
      lo = Math.min(lo, values[i]);
      hi = Math.max(hi, values[i]);
    }
  }
  const range = hi - lo || 1;
  const ymin = lo - range * PAD_BELOW;
  const ymax = hi + range * PAD_ABOVE;
  const span = ymax - ymin;
  return { ax: (0.5 - win.from) / n, bx: 1 / n, ay: ymax / span, by: -1 / span, from: win.from, to: win.to, ...size };
}

/** First and last bar index (inclusive) at least partly inside the plot. */
export function visibleBars(g: Geometry, count: number): BarWindow {
  return { from: Math.max(0, Math.floor(g.from)), to: Math.min(count - 1, Math.ceil(g.to)) };
}

/** Number of bars across the plot (the design switches label styles at 70). */
export const barsAcross = (g: Geometry) => Math.round(g.to - g.from + 1);

/** Round price levels for the axis: about 8 steps of 1, 2, 2.5 or 5 × 10ⁿ (design rules). */
export function priceTicks(ymin: number, ymax: number): number[] {
  const span = ymax - ymin;
  if (!(span > 0)) return [];
  const raw = span / 8;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  let step = mag * 10;
  for (const s of [1, 2, 2.5, 5, 10]) if (Math.abs(s * mag - raw) < Math.abs(step - raw)) step = s * mag;
  const out: number[] = [];
  for (let v = Math.ceil(ymin / step) * step; v <= ymax; v += step) out.push(Math.round(v / step) * step);
  return out;
}

// ---------------------------------------------------------------------------
// Series maths

/** Simple moving average of closes; null until there are enough bars. */
export function sma(bars: readonly Bar[], period: number): (number | null)[] {
  const out: (number | null)[] = [];
  let sum = 0;
  for (let i = 0; i < bars.length; i++) {
    sum += bars[i].c;
    if (i >= period) sum -= bars[i - period].c;
    out.push(i >= period - 1 ? sum / period : null);
  }
  return out;
}

/** Scale an index so it starts at the stock's close on bar `start` (design "rebase"). */
export function rebase(values: readonly number[], bars: readonly Bar[], start: number): number[] {
  const k = bars[start].c / values[start];
  return values.map((v) => v * k);
}

// ---------------------------------------------------------------------------
// Dates (bars carry YYYY-MM-DD in exchange time)

export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function parts(time: string) {
  const [y, m, d] = time.split("-").map(Number);
  return { y, m: m - 1, d, wd: new Date(Date.UTC(y, m - 1, d)).getUTCDay() };
}

/** "Aug 26" */
export function shortDate(time: string): string {
  const p = parts(time);
  return `${MONTHS[p.m]} ${p.d}`;
}

/** "Mon, Aug 31 ’26" (crosshair date pill). */
export function pillDate(time: string): string {
  const p = parts(time);
  return `${WEEKDAYS[p.wd]}, ${MONTHS[p.m]} ${p.d} ’${String(p.y).slice(2)}`;
}

export const monthOf = (time: string) => Number(time.slice(5, 7)) - 1;
export const yearOf = (time: string) => Number(time.slice(0, 4));

/** Bars that open a new month inside a window (month gridlines and labels). */
export function monthStarts(bars: readonly Bar[], win: BarWindow): number[] {
  const out: number[] = [];
  for (let i = Math.max(1, win.from + 1); i <= win.to; i++) {
    if (monthOf(bars[i].time) !== monthOf(bars[i - 1].time)) out.push(i);
  }
  return out;
}
