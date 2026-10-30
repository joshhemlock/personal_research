import { MINUS } from "@/lib/format";
import type { MarginKey } from "@/lib/mock/financials";
import { Gridlines, YAxis } from "./Axes";
import { H2, PANEL, rangeAxis, ticks } from "./helpers";

type MarginsChartProps = {
  /** Up to eight quarters each, % of revenue, oldest first; missing lines are left out. */
  margins: Partial<Record<MarginKey, (number | null)[]>>;
};

const H = 220;
const STEP = 100;

// EBITDA stands in for operating margin where only EBITDA has a quarterly history.
const LINES: { key: MarginKey; label: string; color: string }[] = [
  { key: "gross", label: "Gross", color: "#111113" },
  { key: "operating", label: "Operating", color: "#3B6FE0" },
  { key: "ebitda", label: "EBITDA", color: "#3B6FE0" },
  { key: "net", label: "Net", color: "#A033E8" },
];

const isNum = (v: number | null): v is number => v != null;

/** Gross, operating (or EBITDA) and net margin lines with a legend of the latest values. */
export function MarginsChart({ margins }: MarginsChartProps) {
  const series = LINES.flatMap((l) => {
    const values = margins[l.key];
    return values?.some(isNum) ? [{ ...l, values }] : [];
  });
  const all = series.flatMap((s) => s.values.filter(isNum));
  const n = Math.max(0, ...series.map((s) => s.values.length));
  const axis = rangeAxis(Math.min(...all), Math.max(...all));
  const yTicks = ticks(axis, (v) => (v < 0 ? `${MINUS}${-v}%` : `${v}%`));
  // Missing quarters break the line rather than bridging the gap.
  const line = (vals: (number | null)[]) => {
    let d = "";
    let pen = false;
    vals.forEach((v, k) => {
      if (v == null) {
        pen = false;
        return;
      }
      d += `${pen ? "L" : "M"}${(k * STEP).toFixed(1)} ${((1 - (v - axis.lo) / (axis.hi - axis.lo)) * H).toFixed(1)}`;
      pen = true;
    });
    return d;
  };
  const latest = (vals: (number | null)[]) => vals[vals.length - 1];
  const names = series.map((s) => s.label.toLowerCase());
  const described = names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}` : names[0];
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
      {series.length === 0 || n < 2 ? (
        <p className="m-0 flex flex-1 items-center justify-center py-10 text-center text-[13px] text-muted">
          Not enough quarterly history to chart margins.
        </p>
      ) : (
        <>
          <div className="flex gap-2">
            <YAxis ticks={yTicks} className="w-[30px]" />
            <div className="relative h-[150px] min-w-0 flex-1">
              <Gridlines ticks={yTicks} />
              <svg
                viewBox={`0 0 ${STEP * (n - 1)} ${H}`}
                preserveAspectRatio="none"
                role="img"
                aria-label={`${described[0].toUpperCase()}${described.slice(1)} margin by quarter`}
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
            {series.map((s) => {
              const v = latest(s.values);
              return (
                <span
                  key={s.label}
                  className="flex flex-[1_1_100px] items-center gap-2 rounded-[12px] bg-[rgba(17,17,19,0.04)] px-2.5 py-1.5 text-[13px] whitespace-nowrap text-ink-2"
                >
                  <span className="h-[3px] w-3 rounded-[2px]" style={{ background: s.color }} />
                  {s.label}
                  <span className="ml-auto text-[15px] text-ink">
                    {v == null ? "—" : `${v < 0 ? MINUS : ""}${Math.abs(v).toFixed(1)}%`}
                  </span>
                </span>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
