"use client";

import { useState } from "react";
import { Segmented } from "@/components/ui/Segmented";
import { pct } from "@/lib/format";
import type { PeriodKey, Quarter, StatementKey, StatementRow } from "@/lib/mock/financials";
import { H2, PANEL, statementCell } from "./helpers";

const STATEMENTS = [
  { value: "income", label: "Income statement" },
  { value: "balance", label: "Balance sheet" },
  { value: "cash", label: "Cash flow" },
] as const satisfies readonly { value: StatementKey; label: string }[];

const PERIODS = [
  { value: "quarterly", label: "Quarterly" },
  { value: "annual", label: "Annual" },
] as const satisfies readonly { value: PeriodKey; label: string }[];

const SEG = "h-8 px-[14px] text-[14px]";
// Same tracks as the design (2fr label, 1fr numbers, 74px YoY) with lower minimums,
// so the table still fits its card at a 1280px-wide window; it scrolls below that.
const GRID = "grid grid-cols-[minmax(196px,2fr)_repeat(5,minmax(80px,1fr))_minmax(64px,74px)] gap-x-3";

type StatementsCardProps = {
  /** The four quarters the quarterly columns show, oldest first. */
  quarters: Quarter[];
  years: string[];
  statements: Record<StatementKey, StatementRow[]>;
};

/** Income statement / balance sheet / cash flow, quarterly or annual, with TTM and YoY. */
export function StatementsCard({ quarters, years, statements }: StatementsCardProps) {
  const [stmt, setStmt] = useState<StatementKey>("income");
  const [period, setPeriod] = useState<PeriodKey>("quarterly");
  const title = STATEMENTS.find((s) => s.value === stmt)!.label;
  const annual = period === "annual";
  const cols = annual
    ? years.map((y) => ({ key: y, a: y, b: "" }))
    : quarters.map((q) => ({ key: `${q.q} ${q.fy}`, a: `${q.q} ${q.fy}`, b: q.end }));
  // Balance-sheet lines are point-in-time: the last column is the latest quarter-end.
  const aggLabel = stmt === "balance" ? "Latest" : "TTM";

  return (
    <section aria-labelledby="is-h" className={`${PANEL} px-[18px] pt-3 pb-2`}>
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-[14px]">
          <h2 id="is-h" className={H2}>
            Statements
          </h2>
          <Segmented label="Statement" options={STATEMENTS} value={stmt} onChange={setStmt} buttonClassName={SEG} />
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Segmented label="Period" options={PERIODS} value={period} onChange={setPeriod} buttonClassName={SEG} />
          <span className="text-[12px] text-muted">USD millions, except per share</span>
        </div>
      </div>
      <div className="max-h-[360px] overflow-auto">
        <div role="table" aria-label={`${title}, ${period}`} className="min-w-[748px]">
          <div role="row" className={`${GRID} items-end px-2 py-1.5 text-[12px] text-muted`}>
            <span role="columnheader">{title}</span>
            {cols.map((c) => (
              <span key={c.key} role="columnheader" className="text-right leading-[1.25]">
                <span className="whitespace-nowrap">{c.a}</span>{" "}
                {c.b && <span className="whitespace-nowrap text-[#8A8A92]">{c.b}</span>}
              </span>
            ))}
            <span role="columnheader" className="text-right leading-[1.25] text-ink">
              {aggLabel}
            </span>
            <span role="columnheader" className="text-right">
              YoY
            </span>
          </div>
          {statements[stmt].map((r) => {
            const digits = r.kind === "eps" ? 2 : 0;
            const series = annual ? r.annual : r.quarterly;
            const agg =
              r.agg === "last" ? r.quarterly[r.quarterly.length - 1] : r.quarterly.reduce((s, v) => s + v, 0);
            const total = r.kind === "total";
            const item = r.kind === "item";
            return (
              <div
                key={r.label}
                role="row"
                className={`${GRID} min-h-[27px] items-center rounded-[10px] px-2 text-[14px] ${
                  total ? "bg-[rgba(17,17,19,0.035)] font-medium" : ""
                }`}
              >
                <span role="rowheader" className={item ? "pl-[14px] text-ink-3" : "text-ink"}>
                  {r.label}
                </span>
                {series.map((v, k) => (
                  <span key={cols[k]?.key ?? k} role="cell" className="text-right">
                    {statementCell(v, digits)}
                  </span>
                ))}
                <span role="cell" className="text-right">
                  {statementCell(digits ? Math.round(agg * 100) / 100 : agg, digits)}
                </span>
                <span role="cell" className={`text-right text-[13px] ${r.yoy >= 0 ? "text-up-text" : "text-down-text"}`}>
                  {pct(r.yoy, 1)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
