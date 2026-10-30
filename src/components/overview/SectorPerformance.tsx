"use client";

import { useState } from "react";
import { Segmented } from "@/components/ui/Segmented";
import { pct } from "@/lib/format";
import type { SectorMove, SectorPeriod } from "@/lib/mock/overview";
import { PANEL, PANEL_TITLE } from "./Panel";

// Three heat steps per direction, as in the design script.
const UP_HEAT = ["bg-[rgba(77,176,127,0.10)]", "bg-[rgba(77,176,127,0.20)]", "bg-[rgba(77,176,127,0.34)]"];
const DOWN_HEAT = ["bg-[rgba(234,91,82,0.09)]", "bg-[rgba(234,91,82,0.18)]", "bg-[rgba(234,91,82,0.30)]"];

const FIRST_ROW = 7;

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
    <section aria-labelledby="sec-h" className={`${PANEL} pb-4`}>
      <div className="mb-[10px] flex flex-wrap items-center justify-between gap-[10px]">
        <h2 id="sec-h" className={PANEL_TITLE}>
          Sector performance
        </h2>
        <Segmented
          label="Period"
          options={periods.map((p) => ({ value: p, label: p }))}
          value={period}
          onChange={setPeriod}
          buttonClassName="h-[34px] min-w-12 px-3 text-[14px] leading-[normal] normal-nums"
        />
      </div>
      {/* Two rows (7 + 4) as in the design, so wider screens keep its balance. */}
      <div className="flex flex-col gap-2">
        {[sectors.slice(0, FIRST_ROW), sectors.slice(FIRST_ROW)].map((row, i) => (
          <div key={i} className="flex flex-wrap gap-2">
            {row.map((s) => {
              const v = s.change[period];
              return (
                <div
                  key={s.name}
                  className={`flex min-h-[50px] flex-[1_1_128px] flex-col justify-between gap-[6px] rounded-[14px] px-[14px] py-[7px] transition-colors duration-200 ${heat(v, scale[period])}`}
                >
                  <span className="text-[13px] text-ink">{s.name}</span>
                  <span className={`text-[17px] font-normal ${v >= 0 ? "text-[#155C3B]" : "text-[#8E2A23]"}`}>
                    {pct(v)}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}
