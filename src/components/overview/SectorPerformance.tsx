"use client";

import { useState } from "react";
import { SegmentedControl, SegmentedControlItem } from "@/components/base/segmented-control/segmented-control";
import { pct } from "@/lib/format";
import type { SectorMove, SectorPeriod } from "@/lib/mock/overview";
import { cx } from "@/utils/cx";
import { CARD, CARD_TITLE } from "./Card";

// Three heat steps per direction.
const UP_HEAT = ["bg-heat-positive-1", "bg-heat-positive-2", "bg-heat-positive-3"];
const DOWN_HEAT = ["bg-heat-negative-1", "bg-heat-negative-2", "bg-heat-negative-3"];

/** Tile background for a move `v`, relative to the move that counts as full strength. */
function heat(v: number, full: number): string {
  const a = Math.abs(v) / full;
  const step = a > 0.6 ? 2 : a > 0.25 ? 1 : 0;
  return (v >= 0 ? UP_HEAT : DOWN_HEAT)[step];
}

type SectorPerformanceProps = {
  sectors: SectorMove[];
  periods: readonly SectorPeriod[];
  /** Move (%) at which a tile reaches full strength, per period. */
  scale: Record<SectorPeriod, number>;
};

/** Sector heat tiles with a 1D / 1W / 1M period toggle. */
export function SectorPerformance({ sectors, periods, scale }: SectorPerformanceProps) {
  const [period, setPeriod] = useState<SectorPeriod>(periods[0]);
  return (
    <section aria-labelledby="sec-h" className={cx(CARD, "flex min-w-0 flex-col gap-4 p-5")}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="sec-h" className={CARD_TITLE}>
          Sector performance
        </h2>
        <SegmentedControl
          aria-label="Period"
          selectedKeys={[period]}
          onSelectionChange={(keys) => {
            const next = [...keys][0] as SectorPeriod | undefined;
            if (next) setPeriod(next);
          }}
        >
          {periods.map((p) => (
            <SegmentedControlItem key={p} id={p} className="min-w-10">
              {p}
            </SegmentedControlItem>
          ))}
        </SegmentedControl>
      </div>
      {/* Two, three, then six tiles to a row as the card widens (eleven
          sectors make 6 + 5); a short last row's tiles widen to fill it. */}
      <ul className="@container flex flex-wrap gap-2">
        {sectors.map((s) => {
          const v = s.change[period];
          return (
            <li
              key={s.name}
              className={cx(
                "flex min-h-16 grow basis-[calc(50%-8px)] flex-col justify-between gap-1 rounded-xl px-3 py-2.5 transition-colors duration-200 ease",
                "@md:basis-[calc(33.333%-8px)] @2xl:basis-[calc(16.666%-8px)]",
                heat(v, scale[period]),
              )}
            >
              <span className="text-body-2-medium text-text-primary">{s.name}</span>
              <span className={cx("text-headline-medium", v >= 0 ? "text-text-positive" : "text-text-negative")}>
                {pct(v)}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
