import type { Quarter } from "@/lib/mock/financials";
import { Gridlines, YAxis } from "./Axes";
import { H2, millionsLabel, PANEL, rangeAxis, ticks, zeroAxis } from "./helpers";

type RevenueChartProps = {
  quarters: Quarter[];
  /** USD millions per quarter, oldest first; null where not reported. */
  revenue: (number | null)[];
  netIncome: (number | null)[];
};

// Plot coordinates: 100 units per quarter, 220 tall, stretched to the box.
const H = 220;
const SLOT = 100;

/** Grouped bars: revenue (black) and net income (green) for eight quarters. */
export function RevenueChart({ quarters, revenue, netIncome }: RevenueChartProps) {
  const all = [...revenue, ...netIncome].filter((v): v is number => v != null);
  const min = Math.min(...all, 0);
  // From zero as designed; with losses the axis extends below zero and those bars hang down.
  const axis = min < 0 ? rangeAxis(min, Math.max(...all, 0)) : zeroAxis(Math.max(...all));
  const yTicks = ticks(axis, millionsLabel);
  const y = (v: number) => H - ((v - axis.lo) / (axis.hi - axis.lo)) * H;
  const bars = (vals: (number | null)[], dx: number) =>
    vals
      .map((v, i) => {
        if (v == null) return "";
        if (min >= 0) return `M${i * SLOT + dx} ${(H - (Math.max(v, 0) / axis.hi) * H).toFixed(1)}h28V${H}h-28Z`;
        const [top, bottom] = v >= 0 ? [y(v), y(0)] : [y(0), y(v)];
        return `M${i * SLOT + dx} ${top.toFixed(1)}h28V${bottom.toFixed(1)}h-28Z`;
      })
      .join("");
  const first = quarters[0];
  const last = quarters[quarters.length - 1];
  return (
    <section
      aria-labelledby="rv-h"
      className={`${PANEL} flex min-w-0 flex-[3_1_458px] flex-col gap-2.5 px-[18px] pt-[14px] pb-3`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <h2 id="rv-h" className={H2}>
          Revenue &amp; net income
        </h2>
        <div className="flex gap-[14px] text-[13px] text-ink-2">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-[3px] bg-ink" />
            Revenue
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-[3px] bg-up" />
            Net income
          </span>
        </div>
      </div>
      <div className="flex gap-2">
        <YAxis ticks={yTicks} className="w-[34px]" />
        <div className="@container flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="relative h-[150px]">
            <Gridlines ticks={yTicks} />
            <svg
              viewBox={`0 0 ${SLOT * quarters.length} ${H}`}
              preserveAspectRatio="none"
              role="img"
              aria-label={`Quarterly revenue and net income, ${first.q} ${first.fy} to ${last.q} ${last.fy}`}
              className="absolute inset-0 size-full"
            >
              <path d={bars(revenue, 20)} fill="#111113" />
              <path d={bars(netIncome, 52)} fill="#4DB07F" />
            </svg>
          </div>
          <div aria-hidden="true" className="flex">
            {quarters.map((q) => (
              <span
                key={`${q.q}${q.fy}`}
                className="flex-1 text-center text-[12px] leading-[1.2] text-muted @max-[300px]:text-[10px]"
              >
                {q.q}
                <br />
                {q.fy}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
