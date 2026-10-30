"use client";

import { useState } from "react";
import { Segmented } from "@/components/ui/Segmented";
import type { MultipleKey } from "@/lib/mock/financials";
import { H2, PANEL } from "./helpers";

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

/** Horizontal bars of one multiple for the company and its peers, with the peer median. */
export function ValuationCard({ symbols, values }: ValuationCardProps) {
  const [metric, setMetric] = useState<MultipleKey>("fwdPE");
  const vals = values[metric];
  const label = MULTIPLES.find((m) => m.value === metric)!.label;
  const peers = vals.slice(1).filter(usable);
  const med = peers.length ? median(peers.sort((a, b) => a - b)) : null;
  const own = vals[0];
  const vmax = Math.max(...vals.filter(usable), med ?? 0) * 1.08 || 1;
  const medPos = med == null ? null : ((med / vmax) * 100).toFixed(1);
  let summary: string;
  if (!usable(own)) {
    summary = `${symbols[0]} has no meaningful ${label}${own != null ? " (negative)" : ""}.`;
  } else if (med == null) {
    summary = `${symbols[0]} at ${own.toFixed(1)}×; no peer ${label} to compare with.`;
  } else {
    const ratio = own / med;
    const verdict =
      Math.abs(ratio - 1) < 0.03
        ? "in line with"
        : ratio > 1
          ? `${Math.round((ratio - 1) * 100)}% above`
          : `${Math.round((1 - ratio) * 100)}% below`;
    summary = `${symbols[0]} at ${own.toFixed(1)}× is ${verdict} the peer median.`;
  }

  return (
    <section aria-labelledby="va-h" className={`${PANEL} flex flex-col gap-2.5 px-[18px] pt-[14px] pb-4`}>
      <h2 id="va-h" className={H2}>
        Valuation vs peers
      </h2>
      <Segmented
        label="Multiple"
        options={MULTIPLES}
        value={metric}
        onChange={setMetric}
        buttonClassName="h-[34px] flex-1 text-[14px]"
      />
      <p aria-live="polite" className="m-0 text-[14px] text-ink-2">
        {summary}
      </p>
      <div className="flex flex-col gap-2">
        {symbols.map((s, k) => {
          const v = vals[k];
          return (
            <div key={s} className="grid grid-cols-[46px_minmax(0,1fr)_46px] items-center gap-2.5">
              <span className="text-[14px] font-medium whitespace-nowrap">{s}</span>
              <span aria-hidden="true" className="relative block h-[18px] rounded-[6px] bg-track">
                <span
                  className={`absolute inset-y-0 left-0 rounded-[6px] transition-[width] duration-300 ${
                    k === 0 ? "bg-ink" : "bg-[#CDCDD2]"
                  }`}
                  style={{ width: `${((usable(v) ? v / vmax : 0) * 100).toFixed(1)}%` }}
                />
                {medPos != null && (
                  <span
                    className="absolute -top-[3px] -bottom-[3px] border-l-[1.5px] border-dashed border-muted transition-[left] duration-300"
                    style={{ left: `${medPos}%` }}
                  />
                )}
              </span>
              <span className={`text-right text-[14px] ${usable(v) ? "" : "text-muted"}`}>{multiple(v)}</span>
            </div>
          );
        })}
      </div>
      {med != null && (
        <span className="inline-flex items-center gap-2 text-[12px] text-ink-3">
          <span aria-hidden="true" className="h-3 w-0 border-l-[1.5px] border-dashed border-muted" />
          Peer median {med.toFixed(1)}×
        </span>
      )}
    </section>
  );
}
