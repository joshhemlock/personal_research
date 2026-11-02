import { pct } from "@/lib/format";
import type { WatchRow } from "@/lib/mock/overview";
import { cx } from "@/utils/cx";
import { Card } from "./Card";

type MoversProps = {
  rows: WatchRow[];
  /** A move of this size (%) fills one side of the bar. */
  fullScale: number;
};

/** Today's watchlist moves, best to worst, as bars diverging from a center line. */
export function Movers({ rows, fullScale }: MoversProps) {
  const sorted = [...rows].sort((a, b) => b.changePct - a.changePct);
  return (
    <Card titleId="mv-h" title="Movers" note="Watchlist · today">
      <ul className="flex flex-col gap-1">
        {sorted.map((r) => {
          const up = r.changePct >= 0;
          const width = `${Math.min(100, (Math.abs(r.changePct) / fullScale) * 100).toFixed(0)}%`;
          return (
            <li key={r.symbol} className="grid min-h-7 grid-cols-[3.5rem_minmax(0,1fr)_4.5rem] items-center gap-3">
              <span className="text-body-medium text-text-primary">{r.symbol}</span>
              {/* Bars are drawn in physical left/right: a chart, not text. */}
              <span aria-hidden="true" className="flex h-2.5">
                <span className="flex flex-1 justify-end border-r border-separator-border">
                  {!up && <span className="block h-full rounded-l-sm bg-chart-negative" style={{ width }} />}
                </span>
                <span className="flex flex-1">
                  {up && <span className="block h-full rounded-r-sm bg-chart-positive" style={{ width }} />}
                </span>
              </span>
              <span className={cx("text-end text-body-medium", up ? "text-text-positive" : "text-text-negative")}>
                {pct(r.changePct)}
              </span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
