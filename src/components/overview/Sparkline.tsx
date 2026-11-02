import { linePath } from "@/lib/mock/gen";
import { cx } from "@/utils/cx";

const W = 100;
const H = 32;

type SparklineProps = {
  values: number[];
  /** Gain (positive token) or loss (negative token). */
  up: boolean;
  /** Fill under the line, fading out; needs a document-unique `id`. */
  area?: { id: string };
  /** Entrance stagger, ms: the line draws itself in after this delay. */
  delay?: number;
  className?: string;
};

/**
 * A small trend line in the gain/loss chart tokens. Decorative: the numbers
 * sit beside it. On first paint the line draws itself in (animate-draw) and
 * its fill fades in under it (paint only, no layout).
 */
export function Sparkline({ values, up, area, delay = 0, className }: SparklineProps) {
  const d = linePath(values, W, H, 3);
  const timing = delay ? { animationDelay: `${delay}ms` } : undefined;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true" className={cx("block", className)}>
      {area && (
        <>
          <defs>
            <linearGradient id={area.id} x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0"
                stopOpacity="0.22"
                className={up ? "[stop-color:var(--color-chart-positive)]" : "[stop-color:var(--color-chart-negative)]"}
              />
              <stop
                offset="1"
                stopOpacity="0"
                className={up ? "[stop-color:var(--color-chart-positive)]" : "[stop-color:var(--color-chart-negative)]"}
              />
            </linearGradient>
          </defs>
          <path d={`${d}L${W} ${H} L0 ${H} Z`} fill={`url(#${area.id})`} className="animate-fade" style={timing} />
        </>
      )}
      <path
        d={d}
        pathLength={1}
        fill="none"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        className={cx("animate-draw", up ? "stroke-chart-positive" : "stroke-chart-negative")}
        style={timing}
      />
    </svg>
  );
}
