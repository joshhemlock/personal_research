import type { CSSProperties } from "react";
import type { Quarter } from "@/lib/mock/financials";
import { cx } from "@/utils/cx";
import { Gridlines, YAxis } from "./Axes";
import { Card, LegendItem } from "./Card";
import { ChartTip } from "./ChartTip";
import { Replay } from "./Replay";
import {
  axisPos,
  compactMillions,
  isNum,
  millionsLabel,
  periodsKey,
  quarterLabel,
  rangeAxis,
  stagger,
  ticks,
  zeroAxis,
  type Axis,
} from "./helpers";
import { TipBody } from "./Tip";

type RevenueChartProps = {
  quarters: Quarter[];
  /** USD millions per quarter, oldest first; null where not reported. */
  revenue: (number | null)[];
  netIncome: (number | null)[];
};

/**
 * One bar from the zero line: up for gains, hanging down for losses, with a
 * 4px rounded data end and a square base. It rises in on first paint.
 */
function Bar({ v, axis, className, style }: { v: number | null; axis: Axis; className: string; style: CSSProperties }) {
  const zero = axisPos(axis, 0);
  return (
    <span className="relative h-full w-[30%] max-w-6">
      {v != null && (
        <span
          data-rise=""
          className={cx(
            "absolute inset-x-0 animate-rise transition-colors duration-150 ease-out",
            v >= 0 ? "rounded-t-sm" : "rounded-b-sm",
            className,
          )}
          style={{
            ...(v >= 0 ? { bottom: `${zero}%` } : { top: `${100 - zero}%`, transformOrigin: "top" }),
            height: `max(1px, ${(axisPos(axis, v) - zero) * (v >= 0 ? 1 : -1)}%)`,
            ...style,
          }}
        />
      )}
    </span>
  );
}

/** Grouped bars: revenue and net income for eight quarters, with a tooltip per quarter. */
export function RevenueChart({ quarters, revenue, netIncome }: RevenueChartProps) {
  const all = [...revenue, ...netIncome].filter(isNum);
  const min = Math.min(...all, 0);
  // From zero; with losses the axis extends below zero and those bars hang down.
  const axis = min < 0 ? rangeAxis(min, Math.max(...all, 0)) : zeroAxis(Math.max(...all, 1));
  const yTicks = ticks(axis, millionsLabel);
  const first = quarters[0];
  const last = quarters[quarters.length - 1];
  return (
    <Card
      titleId="rv-h"
      title="Revenue & net income"
      note={
        <span className="flex gap-3">
          <LegendItem swatch={<span className="size-2.5 rounded-xs bg-chart-1" />}>Revenue</LegendItem>
          <LegendItem swatch={<span className="size-2.5 rounded-xs bg-chart-positive" />}>Net income</LegendItem>
        </span>
      }
    >
      {/* The plot grows to the card's height when the card beside it is taller. */}
      <div className="grid min-h-0 flex-1 grid-cols-[2.25rem_minmax(0,1fr)] grid-rows-[minmax(10rem,1fr)_auto] gap-x-2 gap-y-2">
        <YAxis ticks={yTicks} />
        {/* The bars rise again when a new quarter is reported, not when a figure is revised. */}
        <Replay on={periodsKey(quarters)} selector="[data-rise]" effect="rise" step={15} className="relative">
          <Gridlines ticks={yTicks} zero={min < 0} />
          <div
            role="group"
            aria-label={`Quarterly revenue and net income, ${quarterLabel(first)} to ${quarterLabel(last)}`}
            className="absolute inset-0 flex"
          >
            {quarters.map((q, i) => {
              const rev = revenue[i];
              const net = netIncome[i];
              const name = `${quarterLabel(q)} (${q.end})`;
              return (
                <ChartTip
                  key={quarterLabel(q)}
                  label={`${name}: revenue ${compactMillions(rev)}, net income ${compactMillions(net)}`}
                  tip={
                    <TipBody
                      title={name}
                      rows={[
                        { key: "rev", swatch: "bg-chart-1", value: compactMillions(rev), label: "Revenue" },
                        {
                          key: "net",
                          swatch: (net ?? 0) < 0 ? "bg-chart-negative" : "bg-chart-positive",
                          value: compactMillions(net),
                          label: "Net income",
                        },
                      ]}
                    />
                  }
                  className="relative flex h-full min-w-0 flex-1 justify-center gap-0.5 rounded-lg transition-colors duration-150 ease-out hover:bg-background-primary-hover/60"
                >
                  <Bar v={rev} axis={axis} className="bg-chart-1 group-hover/mark:bg-chart-1-active" style={stagger(i)} />
                  <Bar
                    v={net}
                    axis={axis}
                    className={(net ?? 0) < 0 ? "bg-chart-negative" : "bg-chart-positive"}
                    style={stagger(i)}
                  />
                </ChartTip>
              );
            })}
          </div>
        </Replay>
        <div aria-hidden="true" className="@container col-start-2 flex">
          {quarters.map((q) => (
            <span
              key={quarterLabel(q)}
              className="flex min-w-0 flex-1 flex-col items-center text-caption-1-regular text-text-tertiary @max-xs:text-caption-2-regular"
            >
              <span>{q.q}</span>
              <span>{q.fy}</span>
            </span>
          ))}
        </div>
      </div>
    </Card>
  );
}
