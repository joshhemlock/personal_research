"use client";

// React Aria tables only render their columns from a client module.

import { memo, useDeferredValue, useState } from "react";
import { AnimatedValue } from "@/components/motion/AnimatedValue";
import { SegmentedControl, SegmentedControlItem } from "@/components/base/segmented-control/segmented-control";
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@/components/base/table/table";
import { Tab, TabList, TabPanel, Tabs } from "@/components/base/tabs/tabs";
import { pct } from "@/lib/format";
import type { PeriodKey, Quarter, StatementKey, StatementRow } from "@/lib/mock/financials";
import { cx } from "@/utils/cx";
import { useEnterOnMount } from "./Replay";
import { CARD, CARD_TITLE, quarterLabel, statementCell, statementTotal } from "./helpers";

const STATEMENTS = [
  { value: "income", label: "Income statement" },
  { value: "balance", label: "Balance sheet" },
  { value: "cash", label: "Cash flow" },
] as const satisfies readonly { value: StatementKey; label: string }[];

const PERIODS = [
  { value: "quarterly", label: "Quarterly" },
  { value: "annual", label: "Annual" },
] as const satisfies readonly { value: PeriodKey; label: string }[];

type StatementsCardProps = {
  /** The four quarters the quarterly columns show, oldest first. */
  quarters: Quarter[];
  years: string[];
  statements: Record<StatementKey, StatementRow[]>;
  /** Reporting currency; USD when absent. */
  currency?: string;
};

/** Column header text aligned to the end of a numeric column, with a second line (BoardUI's th aligns to the start). */
function NumHeader({ a, b, className }: { a: string; b?: string; className?: string }) {
  return (
    <span className={cx("flex flex-col items-end", className)}>
      <AnimatedValue value={a} />
      {/* Always two lines, so the header keeps its height between quarterly and annual. */}
      <span className="text-caption-1-regular text-text-tertiary">{b || " "}</span>
    </span>
  );
}

type StatementTableProps = {
  stmt: StatementKey;
  period: PeriodKey;
  rows: StatementRow[];
  quarters: Quarter[];
  years: string[];
  currency: string;
};

/** Memoized, so a click re-renders only the controls; the table follows in a deferred, interruptible render. */
const StatementTable = memo(function StatementTable({
  stmt,
  period,
  rows,
  quarters,
  years,
  currency,
}: StatementTableProps) {
  // Switching statement or period remounts the rows (they are keyed by both),
  // and each new row condenses in; the rows of the first paint don't.
  const enter = useEnterOnMount(`${stmt}:${period}`, "enter", 25);
  const annual = period === "annual";
  const title = STATEMENTS.find((s) => s.value === stmt)!.label;
  const cols = annual
    ? years.map((y) => ({ a: y, b: "Fiscal year" }))
    : quarters.map((q) => ({ a: quarterLabel(q), b: q.end }));
  // Balance-sheet lines are point-in-time: the last column is the latest quarter-end.
  const aggLabel = stmt === "balance" ? "Latest" : "TTM";
  return (
    // relative: the screen-reader-only text in cells must stay inside the scroller.
    <Table aria-label={`${title}, ${period}`} size="sm" className="min-w-[46rem]" containerClassName="relative">
      <TableHeader>
        <TableColumn id="label" isRowHeader textValue={`${currency} millions, except per share`}>
          <span className="flex flex-col ps-2.5">
            <span>{currency} millions</span>
            <span className="text-caption-1-regular text-text-tertiary">except per share</span>
          </span>
        </TableColumn>
        {[0, 1, 2, 3].map((k) => (
          <TableColumn key={k} id={`p${k}`} textValue={cols[k] ? `${cols[k].a} ${cols[k].b}` : ""}>
            {cols[k] && <NumHeader a={cols[k].a} b={cols[k].b} />}
          </TableColumn>
        ))}
        <TableColumn id="agg" textValue={aggLabel}>
          <NumHeader a={aggLabel} className="text-text-secondary" />
        </TableColumn>
        <TableColumn id="yoy" textValue="YoY">
          <NumHeader a="YoY" className="pe-2.5" />
        </TableColumn>
      </TableHeader>
      <TableBody>
        {rows.map((r, i) => {
          const digits = r.kind === "eps" ? 2 : 0;
          const series = annual ? r.annual : r.quarterly;
          const agg = statementTotal(r);
          const total = r.kind === "total";
          const num = (v: number | null) => (
            <span className={cx("block text-end", v == null && "text-text-tertiary", total && "text-body-2-semibold")}>
              {statementCell(v, digits)}
            </span>
          );
          return (
            <TableRow
              key={`${stmt}:${period}:${r.label}`}
              id={`${stmt}:${period}:${r.label}`}
              textValue={r.label}
              ref={enter(i)}
              className={cx(
                "hover:bg-background-primary-hover",
                total && "bg-background-secondary-default/60",
              )}
            >
              <TableCell>
                <span
                  className={cx(
                    "block whitespace-nowrap",
                    r.kind === "item" ? "ps-6 text-body-2-regular text-text-secondary" : "ps-2.5",
                    total ? "text-body-2-semibold" : r.kind !== "item" && "text-body-2-regular",
                  )}
                >
                  {r.label}
                </span>
              </TableCell>
              {[0, 1, 2, 3].map((k) => (
                <TableCell key={k}>{num(series[k] ?? null)}</TableCell>
              ))}
              <TableCell>{num(digits && agg != null ? Math.round(agg * 100) / 100 : agg)}</TableCell>
              <TableCell>
                <span
                  className={cx(
                    "block pe-2.5 text-end",
                    r.yoy == null ? "text-text-tertiary" : r.yoy >= 0 ? "text-text-positive" : "text-text-negative",
                  )}
                >
                  {r.yoy == null ? "—" : pct(r.yoy, 1)}
                </span>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
});

/** Income statement / balance sheet / cash flow, quarterly or annual, with TTM and YoY. */
export function StatementsCard({ quarters, years, statements, currency = "USD" }: StatementsCardProps) {
  const [stmt, setStmt] = useState<StatementKey>("income");
  const [period, setPeriod] = useState<PeriodKey>("quarterly");
  // The tabs and the segmented control answer at once; the table (a React Aria
  // collection, the costly part) re-renders in a deferred, time-sliced pass,
  // so a click never blocks a frame. Its rows then condense in.
  const shownStmt = useDeferredValue(stmt);
  const shownPeriod = useDeferredValue(period);

  return (
    <section aria-labelledby="is-h" className={cx(CARD, "flex min-w-0 flex-col overflow-hidden")}>
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5 pb-2">
        <h2 id="is-h" className={CARD_TITLE}>
          Statements
        </h2>
        <SegmentedControl
          aria-label="Period"
          selectedKeys={[period]}
          onSelectionChange={(keys) => {
            const next = [...keys][0] as PeriodKey | undefined;
            if (next) setPeriod(next);
          }}
        >
          {PERIODS.map((p) => (
            <SegmentedControlItem key={p.value} id={p.value}>
              {p.label}
            </SegmentedControlItem>
          ))}
        </SegmentedControl>
      </div>
      <Tabs
        selectedKey={stmt}
        onSelectionChange={(key) => setStmt(key as StatementKey)}
        className="gap-0"
      >
        {/* The tabs sit straight on the table's header band, which is their baseline. */}
        <TabList aria-label="Statement" className="border-b-0 px-3">
          {STATEMENTS.map((s) => (
            <Tab key={s.value} id={s.value}>
              {s.label}
            </Tab>
          ))}
        </TabList>
        {/* One panel, following the selected tab; the table inside shows the deferred selection. */}
        <TabPanel id={stmt} className="focus-visible:ring-inset">
          <StatementTable
            stmt={shownStmt}
            period={shownPeriod}
            rows={statements[shownStmt]}
            quarters={quarters}
            years={years}
            currency={currency}
          />
        </TabPanel>
      </Tabs>
    </section>
  );
}
