import { pct } from "@/lib/format";
import type { WatchRow } from "@/lib/mock/overview";
import { PANEL, PanelHeading } from "./Panel";

type MoversProps = {
  rows: WatchRow[];
  /** A move of this size (%) fills one side of the bar. */
  fullScale: number;
};

/** Today's watchlist moves, best to worst, as bars diverging from a center line. */
export function Movers({ rows, fullScale }: MoversProps) {
  const sorted = [...rows].sort((a, b) => b.changePct - a.changePct);
  return (
    <section aria-labelledby="mv-h" className={`${PANEL} pb-4`}>
      <PanelHeading id="mv-h" title="Movers" note="Watchlist · today" className="mb-[10px]" />
      <ul className="flex flex-col gap-[6px]">
        {sorted.map((r) => {
          const up = r.changePct >= 0;
          const width = `${Math.min(100, (Math.abs(r.changePct) / fullScale) * 100).toFixed(0)}%`;
          return (
            <li key={r.symbol} className="grid min-h-6 grid-cols-[54px_minmax(0,1fr)_64px] items-center gap-[10px]">
              <span className="text-[14px] font-medium">{r.symbol}</span>
              <span aria-hidden="true" className="flex h-3">
                <span className="flex flex-1 justify-end border-r border-[rgba(17,17,19,0.15)]">
                  {!up && <span className="block h-3 rounded-l-[6px] bg-down" style={{ width }} />}
                </span>
                <span className="flex flex-1">
                  {up && <span className="block h-3 rounded-r-[6px] bg-up" style={{ width }} />}
                </span>
              </span>
              <span className={`text-right text-[14px] ${up ? "text-up-text" : "text-down-text"}`}>
                {pct(r.changePct)}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
