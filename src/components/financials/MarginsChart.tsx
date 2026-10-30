import { Gridlines, YAxis } from "./Axes";
import { H2, PANEL, rangeAxis, ticks } from "./helpers";

type MarginsChartProps = {
  /** Eight quarters each, % of revenue, oldest first. */
  margins: { gross: number[]; operating: number[]; net: number[] };
};

const H = 220;
const STEP = 100;

/** Gross, operating and net margin lines with a legend of the latest values. */
export function MarginsChart({ margins }: MarginsChartProps) {
  const series = [
    { label: "Gross", values: margins.gross, color: "#111113" },
    { label: "Operating", values: margins.operating, color: "#3B6FE0" },
    { label: "Net", values: margins.net, color: "#A033E8" },
  ];
  const all = series.flatMap((s) => s.values);
  const axis = rangeAxis(Math.min(...all), Math.max(...all));
  const yTicks = ticks(axis, (v) => `${v}%`);
  const n = margins.gross.length;
  const line = (vals: number[]) =>
    vals
      .map((v, k) => `${k ? "L" : "M"}${(k * STEP).toFixed(1)} ${((1 - (v - axis.lo) / (axis.hi - axis.lo)) * H).toFixed(1)}`)
      .join("");
  return (
    <section
      aria-labelledby="mg-h"
      className={`${PANEL} flex min-w-0 flex-[2_1_358px] flex-col gap-2.5 px-[18px] pt-[14px] pb-3`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <h2 id="mg-h" className={H2}>
          Margins
        </h2>
        <span className="text-[13px] text-muted">% of revenue</span>
      </div>
      <div className="flex gap-2">
        <YAxis ticks={yTicks} className="w-[30px]" />
        <div className="relative h-[150px] min-w-0 flex-1">
          <Gridlines ticks={yTicks} />
          <svg
            viewBox={`0 0 ${STEP * (n - 1)} ${H}`}
            preserveAspectRatio="none"
            role="img"
            aria-label="Gross, operating and net margin by quarter"
            className="absolute inset-0 size-full"
          >
            {series.map((s) => (
              <path
                key={s.label}
                d={line(s.values)}
                fill="none"
                stroke={s.color}
                strokeWidth="2"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </svg>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {series.map((s) => (
          <span
            key={s.label}
            className="flex flex-[1_1_100px] items-center gap-2 rounded-[12px] bg-[rgba(17,17,19,0.04)] px-2.5 py-1.5 text-[13px] whitespace-nowrap text-ink-2"
          >
            <span className="h-[3px] w-3 rounded-[2px]" style={{ background: s.color }} />
            {s.label}
            <span className="ml-auto text-[15px] text-ink">{s.values[n - 1].toFixed(1)}%</span>
          </span>
        ))}
      </div>
    </section>
  );
}
