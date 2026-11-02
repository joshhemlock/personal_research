import type { ChipColor } from "@/components/base/badges/chip";

/** Chip color for a % change: lime up, rose down, neutral when it rounds to zero. */
export function deltaColor(changePct: number, digits = 2): Extract<ChipColor, "lime" | "rose" | "neutral"> {
  const rounded = Number(changePct.toFixed(digits));
  return rounded > 0 ? "lime" : rounded < 0 ? "rose" : "neutral";
}
