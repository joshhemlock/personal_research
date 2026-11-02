import { AnimatedValue } from "@/components/motion/AnimatedValue";
import { pct } from "@/lib/format";
import type { WatchRow } from "@/lib/mock/overview";
import { cx } from "@/utils/cx";
import { Card } from "./Card";

type MoversProps = {
  rows: WatchRow[];
  /** A move of this size (%) fills one side of the bar. */
  fullScale: number;
};

/** Bars grow out of the center line on first paint, 30ms apart down the list (~240ms cap). */
const STAGGER_MS = 30;
const MAX_STAGGER_MS = 210;

/**
 * Today's watchlist moves, best to worst, as bars diverging from a center
 * line. Each bar grows from the center line (transform only, animate-grow).
 */
export function Movers({ rows, fullScale }: MoversProps) {
  const sorted = [...rows].sort((a, b) => b.changePct - a.changePct);
  return (
    <Card titleId="mv-h" title="Movers" note="Watchlist · today">
      <ul className="flex flex-col gap-1">
        {sorted.map((r, i) => {
          const up = r.changePct >= 0;
          const width = `${Math.min(100, (Math.abs(r.changePct) / fullScale) * 100).toFixed(0)}%`;
          // Physical origins: the bars are a chart, so they don't mirror in RTL.
          const bar = {
            width,
            transformOrigin: up ? "left" : "right",
            animationDelay: `${Math.min(i * STAGGER_MS, MAX_STAGGER_MS)}ms`,
          };
          return (
            <li key={r.symbol} className="grid min-h-7 grid-cols-[3.5rem_minmax(0,1fr)_4.5rem] items-center gap-3">
              <span className="text-body-medium text-text-primary">{r.symbol}</span>
              {/* Bars are drawn in physical left/right: a chart, not text. */}
              <span aria-hidden="true" className="flex h-2.5">
                <span className="flex flex-1 justify-end border-r border-separator-border">
                  {!up && <span className="block h-full animate-grow rounded-l-sm bg-chart-negative" style={bar} />}
                </span>
                <span className="flex flex-1">
                  {up && <span className="block h-full animate-grow rounded-r-sm bg-chart-positive" style={bar} />}
                </span>
              </span>
              <AnimatedValue
                value={pct(r.changePct)}
                className={cx("text-end text-body-medium", up ? "text-text-positive" : "text-text-negative")}
              />
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
