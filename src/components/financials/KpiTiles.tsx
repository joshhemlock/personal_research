import { Chip } from "@/components/base/badges/chip";
import type { Kpi } from "@/lib/mock/financials";
import { cx } from "@/utils/cx";
import { AnimatedValue } from "@/components/motion/AnimatedValue";
import { Replay } from "./Replay";
import { isNum, stagger } from "./helpers";

/**
 * Mini bar chart for a tile: eight quarters, the latest in the gain/loss
 * colour of the tile's change, the earlier ones neutral. With negative values
 * the bars hang from a zero line; a missing quarter leaves a gap. The bars
 * rise in once, left to right.
 */
function MiniBars({ values, up }: { values: (number | null)[]; up: boolean }) {
  const nums = values.filter(isNum);
  const top = Math.max(...nums, 0);
  const bottom = Math.min(...nums, 0);
  const span = top - bottom || 1;
  // Distance of the zero line from the bottom, %.
  const zero = (-bottom / span) * 100;
  const last = values.length - 1;
  return (
    <span aria-hidden="true" className="flex h-8 w-24 gap-0.5">
      {values.map((v, k) => (
        <span key={k} className="relative h-full min-w-0 flex-1">
          {v != null && (
            <span
              data-rise=""
              className={cx(
                "absolute inset-x-0 animate-rise",
                v >= 0 ? "rounded-t-xs" : "rounded-b-xs",
                k === last ? (up ? "bg-chart-positive" : "bg-chart-negative") : "bg-foreground-icon-quaternary",
              )}
              style={{
                ...(v >= 0 ? { bottom: `${zero}%` } : { top: `${100 - zero}%`, transformOrigin: "top" }),
                // At least a sliver, so a tiny quarter still reads as reported.
                height: `max(2px, ${((Math.abs(v) / span) * 100).toFixed(2)}%)`,
                ...stagger(k),
              }}
            />
          )}
        </span>
      ))}
    </span>
  );
}

/**
 * "+83.4% YoY": in a narrow tile the period suffix is left to screen readers,
 * so the change stays on one line with the figure.
 */
function Delta({ text }: { text: string }) {
  const m = /^(.*?)(\s+YoY)$/.exec(text);
  if (!m) return text;
  return (
    <>
      {m[1]}
      <span className="whitespace-pre @max-[12.25rem]:sr-only">{m[2]}</span>
    </>
  );
}

/** Lime up, rose down; neutral without a year-ago figure or when the change rounds to zero ("+0.0 pt"). */
function deltaTone(k: Kpi): "lime" | "rose" | "neutral" {
  if (!k.delta) return "neutral";
  const n = Number(/\d+(?:\.\d+)?/.exec(k.delta)?.[0] ?? NaN);
  if (n === 0) return "neutral";
  return k.up ? "lime" : "rose";
}

type KpiTilesProps = {
  kpis: Kpi[];
  /** Changes when a new quarter is reported: the mini bars rise again. */
  periods: string;
};

/** The headline tiles above the charts, in BoardUI's plain stat-card recipe with mini bars as the visual. */
export function KpiTiles({ kpis, periods }: KpiTilesProps) {
  return (
    <section aria-label="Headline numbers" className="@container">
      {/* One row when there is room; three over two, then two up with the last tile full width. */}
      <Replay on={periods} selector="[data-rise]" effect="rise" step={8} className="flex flex-wrap gap-4">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="@container flex min-h-33 min-w-0 grow basis-[calc(50%-0.5rem)] flex-col items-start justify-between gap-3 rounded-2xl bg-background-secondary-default p-4 @xl:basis-[calc(33.333%-0.75rem)] @4xl:basis-0"
          >
            {k.bars.some(isNum) && <MiniBars values={k.bars} up={k.up} />}
            <div className="mt-auto flex w-full flex-col gap-0.5">
              <p className="truncate text-body-medium text-text-secondary">{k.label}</p>
              <div className="flex w-full flex-wrap items-center gap-x-2 gap-y-1">
                <AnimatedValue value={k.value} className="text-title-1-medium whitespace-nowrap text-text-primary" />
                <Chip variant="bold" color={deltaTone(k)}>
                  {k.delta ? <Delta text={k.delta} /> : "TTM"}
                </Chip>
              </div>
            </div>
          </div>
        ))}
      </Replay>
    </section>
  );
}
