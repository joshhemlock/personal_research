"use client";

import { useRef, useState } from "react";
import { AnimatedValue } from "@/components/motion/AnimatedValue";
import { SegmentedControl, SegmentedControlItem } from "@/components/base/segmented-control/segmented-control";
import type { MultipleKey } from "@/lib/mock/financials";
import { cx } from "@/utils/cx";
import { ChartTip } from "./ChartTip";
import { useReplay } from "./Replay";
import { CARD, CARD_TITLE, stagger } from "./helpers";
import { TipBody, type TipRow } from "./Tip";

const MULTIPLES = [
  { value: "fwdPE", label: "Fwd P/E" },
  { value: "evSales", label: "EV/Sales" },
  { value: "pFcf", label: "P/FCF" },
] as const satisfies readonly { value: MultipleKey; label: string }[];

type ValuationCardProps = {
  /** symbols[0] is this company, the rest are peers. */
  symbols: string[];
  /** Multiples in the order of `symbols`; null where not available. */
  values: Record<MultipleKey, (number | null)[]>;
};

function median(sorted: number[]): number {
  const m = sorted.length >> 1;
  return sorted.length % 2 ? sorted[m] : (sorted[m - 1] + sorted[m]) / 2;
}

/** A multiple worth charting: negative ones (losses, cash burn) aren't meaningful. */
const usable = (v: number | null): v is number => v != null && v > 0;

/** "27.9×", "n/m" for a negative multiple, "—" when there is none. */
const multiple = (v: number | null) => (v == null ? "—" : v > 0 ? `${v.toFixed(1)}×` : "n/m");

/** "23% above", "in line with", "12% below" the median. */
function versus(v: number, med: number): string {
  const ratio = v / med;
  if (Math.abs(ratio - 1) < 0.03) return "in line with";
  return ratio > 1 ? `${Math.round((ratio - 1) * 100)}% above` : `${Math.round((1 - ratio) * 100)}% below`;
}

// Bar rows: symbol (w-12), bar track, value (w-14), with gap-3 and px-2. The
// median overlay sits over the track column: 0.5 + 3 + 0.75 = 4.25rem from the
// left, 0.5 + 3.5 + 0.75 = 4.75rem from the right.
const ROW = "grid grid-cols-[3rem_minmax(0,1fr)_3.5rem] items-center gap-3 rounded-lg px-2 py-1";

/**
 * Horizontal bars of one multiple for the company and its peers, with the
 * peer median. Switching the multiple re-grows the bars and glides the
 * median line to its new place.
 */
export function ValuationCard({ symbols, values }: ValuationCardProps) {
  const [metric, setMetric] = useState<MultipleKey>("fwdPE");
  const bars = useRef<HTMLDivElement>(null);
  // Each switch grows the bars from zero again (the median line glides by itself).
  useReplay(bars, metric, "[data-bar]", "grow");
  const vals = values[metric];
  const label = MULTIPLES.find((m) => m.value === metric)!.label;
  const peers = vals.slice(1).filter(usable);
  const med = peers.length ? median([...peers].sort((a, b) => a - b)) : null;
  const own = vals[0];
  const vmax = Math.max(...vals.filter(usable), med ?? 0) * 1.08 || 1;
  let summary: string;
  if (!usable(own)) {
    summary = `${symbols[0]} has no meaningful ${label}${own != null ? " (negative)" : ""}.`;
  } else if (med == null) {
    summary = `${symbols[0]} at ${own.toFixed(1)}×; no peer ${label} to compare with.`;
  } else {
    summary = `${symbols[0]} at ${own.toFixed(1)}× is ${versus(own, med)} the peer median.`;
  }

  return (
    <section aria-labelledby="va-h" className={cx(CARD, "flex min-w-0 flex-col gap-4 p-5")}>
      <h2 id="va-h" className={CARD_TITLE}>
        Valuation vs peers
      </h2>
      <SegmentedControl
        aria-label="Multiple"
        selectedKeys={[metric]}
        onSelectionChange={(keys) => {
          const next = [...keys][0] as MultipleKey | undefined;
          if (next) setMetric(next);
        }}
        className="w-full"
      >
        {MULTIPLES.map((m) => (
          <SegmentedControlItem key={m.value} id={m.value} className="flex-1">
            {m.label}
          </SegmentedControlItem>
        ))}
      </SegmentedControl>
      <p aria-live="polite" className="-mt-1 min-h-10 text-body-regular text-text-secondary">
        <AnimatedValue value={summary} />
      </p>
      <div ref={bars} className="relative -mx-2 -mt-2 flex flex-col">
        {symbols.map((s, k) => {
          const v = vals[k];
          const tipRows: TipRow[] = [{ key: "v", value: multiple(v), label }];
          if (usable(v) && med != null && k > 0) tipRows.push({ key: "m", value: versus(v, med), label: "peer median" });
          return (
            <ChartTip
              key={s}
              label={`${s}: ${label} ${multiple(v)}${usable(v) && med != null ? `, ${versus(v, med)} the peer median` : ""}`}
              tip={<TipBody title={k === 0 ? `${s} · this company` : s} rows={tipRows} />}
              className={cx(ROW, "transition-colors duration-150 ease-out hover:bg-background-primary-hover")}
            >
              <span className={cx("truncate text-body-medium text-text-primary", k === 0 && "text-body-semibold")}>{s}</span>
              <span className="relative block h-4 rounded-sm bg-background-secondary-default">
                {usable(v) && (
                  <span
                    data-bar=""
                    className={cx(
                      "absolute inset-y-0 left-0 animate-grow rounded-r-sm transition-colors duration-150 ease-out",
                      k === 0 ? "bg-chart-1 group-hover/mark:bg-chart-1-active" : "bg-foreground-icon-quaternary",
                    )}
                    style={{ width: `${((v / vmax) * 100).toFixed(2)}%`, transformOrigin: "left", ...stagger(k, 30) }}
                  />
                )}
              </span>
              <span className={cx("text-end text-body-medium", usable(v) ? "text-text-primary" : "text-text-tertiary")}>
                <AnimatedValue value={multiple(v)} />
              </span>
            </ChartTip>
          );
        })}
        {/* The peer median: one dashed line over every track, gliding (a transform) between multiples. */}
        {med != null && (
          <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-19 left-17 overflow-hidden">
            <span
              className="absolute inset-0 transition-transform duration-360 ease-board"
              style={{ transform: `translateX(${((med / vmax) * 100).toFixed(2)}%)` }}
            >
              <span className="absolute inset-y-0 left-0 border-l-[1.5px] border-dashed border-foreground-icon-secondary" />
            </span>
          </span>
        )}
      </div>
      {med != null && (
        <span className="inline-flex items-center gap-2 text-body-2-regular text-text-secondary">
          <span aria-hidden="true" className="h-3 w-0 border-l-[1.5px] border-dashed border-foreground-icon-secondary" />
          Peer median <AnimatedValue value={`${med.toFixed(1)}×`} className="text-text-primary" />
        </span>
      )}
    </section>
  );
}
