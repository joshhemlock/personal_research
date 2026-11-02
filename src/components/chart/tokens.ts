// Colours of the chart screen, all BoardUI / app tokens. HTML parts use the
// utility classes below; the canvas (Lightweight Charts) reads the same
// tokens' current values through `readPalette` and re-reads them when the
// theme flips.

import type { CompareKey } from "@/lib/mock/chart";
import type { SeriesKey } from "./types";

/** Dot / badge fill per series (legend, chips, menus). */
export const SERIES_FILL: Record<SeriesKey, string> = {
  volume: "bg-foreground-icon-tertiary",
  sma: "bg-chart-4",
  sector: "bg-foreground-icon-secondary",
  market: "bg-chart-compare",
};

/** Axis tag colour per comparison line (BoardUI chip pairs). */
export const COMPARE_CHIP: Record<CompareKey, "gray" | "purple"> = {
  sector: "gray",
  market: "purple",
};

/** CSS custom properties the canvas draws with. */
const VARS = {
  up: "--color-candle-up",
  down: "--color-candle-down",
  positive: "--color-chart-positive",
  negative: "--color-chart-negative",
  sma: "--color-chart-4",
  sector: "--color-foreground-icon-secondary",
  market: "--color-chart-compare",
  surface: "--color-background-primary-default",
  text: "--color-text-secondary",
} as const;

export type Rgba = readonly [number, number, number, number];
export type Palette = Record<keyof typeof VARS, Rgba> & { font: string };

export const rgba = ([r, g, b, a]: Rgba, alpha = 1) => `rgba(${r}, ${g}, ${b}, ${+(a * alpha).toFixed(3)})`;

let probe: CanvasRenderingContext2D | null = null;

/**
 * A token's current value as RGBA. Tokens resolve to oklch(); drawing one
 * pixel and reading it back converts any CSS colour to sRGB, which every
 * canvas API (and the chart's own colour maths) accepts.
 */
function resolve(value: string): Rgba {
  probe ??= Object.assign(document.createElement("canvas"), { width: 1, height: 1 }).getContext("2d", {
    willReadFrequently: true,
  });
  if (!probe || !value) return [0, 0, 0, 0];
  probe.clearRect(0, 0, 1, 1);
  probe.fillStyle = "rgba(0, 0, 0, 0)";
  probe.fillStyle = value;
  probe.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = probe.getImageData(0, 0, 1, 1).data;
  return [r, g, b, a / 255];
}

/** The chart's colours and font as the page currently renders them (light or dark). */
export function readPalette(): Palette {
  const style = getComputedStyle(document.documentElement);
  const out = { font: getComputedStyle(document.body).fontFamily } as Palette;
  for (const [key, name] of Object.entries(VARS) as [keyof typeof VARS, string][]) {
    out[key] = resolve(style.getPropertyValue(name).trim());
  }
  return out;
}

/** Calls `onChange` whenever the theme class on <html> changes. */
export function observeTheme(onChange: () => void): () => void {
  const root = document.documentElement;
  let dark = root.classList.contains("dark");
  const mo = new MutationObserver(() => {
    const next = root.classList.contains("dark");
    if (next === dark) return;
    dark = next;
    onChange();
  });
  mo.observe(root, { attributes: true, attributeFilter: ["class"] });
  return () => mo.disconnect();
}
