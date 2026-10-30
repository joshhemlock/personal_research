// Number formatting shared by every screen. Negative values use a true
// minus sign (U+2212), as in the designs.

export const MINUS = "−";

export function signed(v: number, digits = 2): string {
  return (v >= 0 ? "+" : MINUS) + Math.abs(v).toFixed(digits);
}

export function pct(v: number, digits = 2): string {
  return signed(v, digits) + "%";
}

export function num(v: number, digits = 2): string {
  return v.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export type Tone = {
  pillBg: string;
  pillFg: string;
  /** Line color for sparklines. */
  stroke: string;
  /** Area fill under sparklines. */
  fill: string;
  /** Text color for changes. */
  color: string;
};

const UP: Tone = {
  pillBg: "#DDF3E6",
  pillFg: "#1A6B45",
  stroke: "#2E9B63",
  fill: "rgba(77,176,127,0.16)",
  color: "#1A7F4E",
};
const DOWN: Tone = {
  pillBg: "#FCE4E2",
  pillFg: "#A82C24",
  stroke: "#E5484D",
  fill: "rgba(234,91,82,0.13)",
  color: "#C2362D",
};

export function tone(v: number): Tone {
  return v >= 0 ? UP : DOWN;
}
