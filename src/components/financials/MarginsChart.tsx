import type { MarginKey, Quarter } from "@/lib/mock/financials";
import { MINUS } from "@/lib/format";
import { cx } from "@/utils/cx";
import { Gridlines, YAxis } from "./Axes";
import { Card } from "./Card";
import { ChartTip } from "./ChartTip";
import { AnimatedValue } from "@/components/motion/AnimatedValue";
import { Replay } from "./Replay";
import { axisPos, isNum, percent, periodsKey, quarterLabel, rangeAxis, stagger, ticks } from "./helpers";
import { TipBody } from "./Tip";

type MarginsChartProps = {
  /** The quarters the margins belong to, oldest first. */
  quarters: Quarter[];
  /** Up to eight quarters each, % of revenue, oldest first; missing lines are left out. */
  margins: Partial<Record<MarginKey, (number | null)[]>>;
};

// Plot coordinates: 100 units per quarter, 220 tall, stretched to the box.
const H = 220;
const STEP = 100;

// EBITDA stands in for operating margin where only EBITDA has a quarterly history.
// Gross shares revenue's colour and net shares net income's, as in the chart beside it.
const LINES: { key: MarginKey; label: string; stroke: string; fill: string }[] = [
  { key: "gross", label: "Gross", stroke: "stroke-chart-1", fill: "bg-chart-1" },
  { key: "operating", label: "Operating", stroke: "stroke-chart-5", fill: "bg-chart-5" },
  { key: "ebitda", label: "EBITDA", stroke: "stroke-chart-5", fill: "bg-chart-5" },
  { key: "net", label: "Net", stroke: "stroke-chart-positive", fill: "bg-chart-positive" },
];

/** Path through the values; a missing quarter breaks the line rather than bridging the gap. */
function linePath(vals: (number | null)[], y: (v: number) => number): string {
  let d = "";
  let pen = false;
  vals.forEach((v, k) => {
    if (v == null) {
      pen = false;
      return;
    }
    d += `${pen ? "L" : "M"}${(k * STEP).toFixed(1)} ${y(v).toFixed(1)}`;
    pen = true;
  });
  return d;
}

/**
 * Gross, operating (or EBITDA) and net margin lines that draw themselves in,
 * a crosshair with a tooltip per quarter, and a legend of the latest values.
 */
export function MarginsChart({ quarters, margins }: MarginsChartProps) {
  const series = LINES.flatMap((l) => {
    const values = margins[l.key];
    return values?.some(isNum) ? [{ ...l, values }] : [];
  });
  const n = Math.max(0, ...series.map((s) => s.values.length));
  if (series.length === 0 || n < 2) {
    return (
      <Card titleId="mg-h" title="Margins" note="% of revenue">
        <p className="flex flex-1 items-center justify-center py-10 text-center text-body-regular text-text-secondary">
          Not enough quarterly history to chart margins.
        </p>
      </Card>
    );
  }

  const all = series.flatMap((s) => s.values.filter(isNum));
  const axis = rangeAxis(Math.min(...all), Math.max(...all));
  const yTicks = ticks(axis, (v) => (v < 0 ? `${MINUS}${-v}%` : `${v}%`));
  const top = (v: number) => 100 - axisPos(axis, v);
  const names = series.map((s) => s.label.toLowerCase());
  const described = names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}` : names[0];
  const shown = quarters.slice(-n);
  const key = periodsKey(shown);

  return (
    <Card titleId="mg-h" title="Margins" note="% of revenue">
      {/* The plot grows to the card's height when the card beside it is taller. */}
      <div className="grid min-h-0 flex-1 grid-cols-[2.25rem_minmax(0,1fr)] grid-rows-[minmax(10rem,1fr)] gap-x-2">
        <YAxis ticks={yTicks} />
        {/* The lines draw again when a new quarter arrives. */}
        <Replay on={key} selector="path" effect="draw" step={60} className="relative min-w-0">
          <Gridlines ticks={yTicks} />
          <svg
            viewBox={`0 0 ${STEP * (n - 1)} ${H}`}
            preserveAspectRatio="none"
            aria-hidden="true"
            className="absolute inset-0 size-full overflow-visible"
          >
            {series.map((s, i) => (
              <path
                key={s.key}
                d={linePath(s.values, (v) => (top(v) / 100) * H)}
                pathLength={1}
                fill="none"
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                className={cx("animate-draw", s.stroke)}
                style={stagger(i, 60)}
              />
            ))}
          </svg>
          <div role="group" aria-label={`${described[0].toUpperCase()}${described.slice(1)} margin by quarter`} className="absolute inset-0">
            {shown.map((q, k) => {
              // Each quarter's hit area reaches halfway to its neighbours.
              const x = (k / (n - 1)) * 100;
              const half = 50 / (n - 1);
              const start = Math.max(0, x - half);
              const end = Math.min(100, x + half);
              const at = ((x - start) / (end - start)) * 100;
              const name = `${quarterLabel(q)} (${q.end})`;
              return (
                <ChartTip
                  key={quarterLabel(q)}
                  label={`${name}: ${series.map((s) => `${s.label.toLowerCase()} margin ${percent(s.values[k])}`).join(", ")}`}
                  tip={
                    <TipBody
                      title={name}
                      rows={series.map((s) => ({ key: s.key, swatch: s.fill, value: percent(s.values[k]), label: s.label }))}
                    />
                  }
                  className="absolute inset-y-0"
                  style={{ left: `${start}%`, width: `${end - start}%` }}
                >
                  {/* Crosshair and markers, shown while the quarter is hovered or focused. */}
                  <span
                    aria-hidden="true"
                    className="absolute inset-y-0 w-px -translate-x-1/2 bg-chart-cursor opacity-0 transition-opacity duration-150 ease-out group-hover/mark:opacity-100 group-focus-visible/mark:opacity-100"
                    style={{ left: `${at}%` }}
                  />
                  {series.map((s) => {
                    const v = s.values[k];
                    return v == null ? null : (
                      <span
                        key={s.key}
                        aria-hidden="true"
                        className={cx(
                          "absolute size-2.5 -translate-1/2 rounded-full opacity-0 ring-2 ring-background-primary-default transition-opacity duration-150 ease-out group-hover/mark:opacity-100 group-focus-visible/mark:opacity-100",
                          s.fill,
                        )}
                        style={{ left: `${at}%`, top: `${top(v)}%` }}
                      />
                    );
                  })}
                </ChartTip>
              );
            })}
          </div>
        </Replay>
      </div>
      <ul aria-label="Latest quarter" className="grid grid-cols-[repeat(auto-fit,minmax(5.5rem,1fr))] gap-2">
        {series.map((s) => (
          <li key={s.key} className="flex min-w-0 flex-col gap-0.5 rounded-xl bg-background-secondary-default px-3 py-2">
            <span className="flex items-center gap-1.5 text-body-2-regular whitespace-nowrap text-text-secondary">
              <span aria-hidden="true" className={cx("h-0.5 w-3 shrink-0 rounded-full", s.fill)} />
              {s.label}
            </span>
            <AnimatedValue value={percent(s.values[s.values.length - 1])} className="text-headline-medium text-text-primary" />
          </li>
        ))}
      </ul>
    </Card>
  );
}
