// Small presentational helpers shared by the Financials screen components.
// Kept free of data imports so client components can use them cheaply.

/** Glass card: the shared recipe plus the 24px panel radius. */
export const PANEL = "glass rounded-[24px]";

/** Card heading (h2). */
export const H2 = "m-0 text-[19px] font-normal tracking-[-0.01em]";

/** Statement cell: thousands separators, negatives in parentheses. */
export function statementCell(v: number, digits = 0): string {
  const s = Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
  return v < 0 ? `(${s})` : s;
}

export type Axis = { lo: number; hi: number; step: number };
export type Tick = { value: number; label: string; top: number };

const NICE = [1, 2, 2.5, 5, 10];

/** Smallest "nice" step (1, 2, 2.5, 5 × 10ⁿ) that is at least `raw`. */
export function niceStep(raw: number): number {
  if (!(raw > 0)) return 1;
  const p = 10 ** Math.floor(Math.log10(raw));
  for (const n of NICE) if (n * p >= raw - 1e-9) return n * p;
  return 10 * p;
}

/** Axis from zero with `steps` equal intervals covering `max`. */
export function zeroAxis(max: number, steps = 4): Axis {
  const step = niceStep(max / steps);
  return { lo: 0, hi: step * steps, step };
}

/** Axis with `steps` equal intervals covering [min, max], starting on a step multiple. */
export function rangeAxis(min: number, max: number, steps = 4): Axis {
  let step = niceStep((max - min) / steps);
  for (let guard = 0; guard < 20; guard++) {
    const lo = Math.floor(min / step) * step;
    if (lo + step * steps >= max) return { lo, hi: lo + step * steps, step };
    step = niceStep(step * 1.01);
  }
  return { lo: min, hi: max, step: (max - min) / steps };
}

/** Tick labels with their distance from the top of the plot, in %. */
export function ticks(axis: Axis, label: (v: number) => string): Tick[] {
  const n = Math.round((axis.hi - axis.lo) / axis.step);
  return Array.from({ length: n + 1 }, (_, i) => {
    const value = axis.lo + i * axis.step;
    return { value, label: label(value), top: (1 - (value - axis.lo) / (axis.hi - axis.lo)) * 100 };
  });
}

/** "20B", "2.5B", "500M": axis labels for USD millions. */
export function millionsLabel(v: number): string {
  if (v === 0) return "0";
  return v >= 1000 ? `${+(v / 1000).toFixed(1)}B` : `${v}M`;
}
