"use client";

// React Aria tables only render their columns from a client module.

import Link from "next/link";
import { memo, useLayoutEffect, useMemo, useRef, type Dispatch, type RefObject } from "react";
import { RiStarFill, RiStarLine } from "@remixicon/react";
import { Button } from "@/components/base/buttons/button";
import { LinkButton } from "@/components/base/buttons/link-button";
import { Skeleton } from "@/components/base/skeleton/skeleton";
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@/components/base/table/table";
import { ChevronSortDown } from "@/components/foundations/icons/chevrons";
import { pct } from "@/lib/format";
import { UNIVERSE } from "@/lib/mock/market";
import type { ScreenRow, ScreenSort, SortKey } from "@/lib/mock/screener";
import { cx } from "@/utils/cx";
import {
  COLUMNS,
  LIVE_UNSORTABLE,
  TIGHT_PAD,
  fitSteps,
  fmtCap,
  fmtGrowth,
  fmtPct1,
  fmtPe,
  fmtPrice,
  type ColumnDef,
  type ColumnKey,
} from "./screen";
import { POP, play } from "./motion";
import { useScreener, useWatch, type ScreenerAction } from "./ScreenerProvider";
import { QUIET_ICON_BUTTON } from "./styles";
import "./screener.css";

// Symbols the chart screen has sample data for. With sample data, other rows
// show the same cell without a link (their /stock page would 404); with live
// data every row links.
const CHARTED = new Set(UNIVERSE.map((s) => s.symbol));

/** Shown for a value TradingView doesn't have. */
const MISSING = <span className="text-text-tertiary">—</span>;

function orMissing<T>(v: T | null, format: (v: T) => string) {
  return v === null ? MISSING : format(v);
}

function ColumnHead({ col, direction }: { col: ColumnDef; direction: "ascending" | "descending" | undefined }) {
  if (col.key === "watch") return <span className="sr-only">Watch</span>;
  const end = col.align === "end";
  return (
    <span className={cx("flex", end && "justify-end")}>
      <span className="relative">
        {col.label}
        {/* In the gap beside the label, on its outer side: headers stay as
            narrow as their labels and line up with their values. Shown on
            the sorted column, a hint of it on hover elsewhere. */}
        <ChevronSortDown
          className={cx(
            "absolute top-1/2 size-4 -translate-y-1/2 transition-[rotate,opacity] duration-150 ease-out",
            end ? "end-full" : "start-full",
            direction === "ascending" && "rotate-180",
            direction ? "text-text-secondary opacity-100" : "opacity-0 group-hover:opacity-60",
          )}
        />
      </span>
    </span>
  );
}

function Company({ s, linked }: { s: ScreenRow; linked: boolean }) {
  const body = (
    <>
      <span className="text-body-2-semibold text-text-primary transition-colors duration-150 group-hover:text-accent-600">
        {s.symbol}
      </span>
      <span className="max-w-36 truncate text-caption-1-regular text-text-secondary">{s.name}</span>
    </>
  );
  return linked ? (
    <Link
      href={`/stock/${s.symbol}`}
      className="group flex min-w-0 flex-col rounded-md outline-none focus-visible:ring-2 focus-visible:ring-border-focus-ring"
    >
      {body}
    </Link>
  ) : (
    <span className="flex min-w-0 flex-col">{body}</span>
  );
}

/** Where the price sits in its 52-week range: a track with a marker, low and high beneath. */
function RangeBar({ s }: { s: ScreenRow }) {
  if (s.rangePos === null || s.low52 === null || s.high52 === null) return MISSING;
  const low = fmtPrice(s.low52);
  const high = fmtPrice(s.high52);
  return (
    <span className="flex w-28 flex-col gap-1.5 pt-1">
      {/* The track takes the control-border token: it shows on the card in both themes. */}
      <span aria-hidden="true" className="relative h-1 rounded-full bg-border-button-default">
        <span
          className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground-icon-primary ring-2 ring-background-primary-default"
          style={{ left: `${s.rangePos}%` }}
        />
      </span>
      <span aria-hidden="true" className="flex justify-between gap-2 text-caption-1-regular text-text-tertiary">
        <span>{low}</span>
        <span>{high}</span>
      </span>
      <span className="sr-only">{`52-week range ${low} to ${high}, at ${s.rangePos}%`}</span>
    </span>
  );
}

/** 3-month trend line. It draws itself on the screen's first paint (Settle then retires the draw). */
function Sparkline({ s }: { s: ScreenRow }) {
  if (s.spark === null) return MISSING;
  const up = (s.trend ?? 0) >= 0;
  return (
    <>
      <span className="sr-only">{up ? "Up over 3 months" : "Down over 3 months"}</span>
      <svg viewBox="0 0 84 24" aria-hidden="true" className="block h-6 w-21">
        <path
          d={s.spark}
          pathLength={1}
          fill="none"
          strokeWidth={1.5}
          strokeLinejoin="round"
          strokeLinecap="round"
          className={cx("animate-draw", up ? "stroke-chart-positive" : "stroke-chart-negative")}
        />
      </svg>
    </>
  );
}

/** The row's watchlist star. It reads the stars on its own (useWatch), so a toggle re-renders only the stars. */
function WatchButton({ symbol }: { symbol: string }) {
  const { watched: list, toggle } = useWatch();
  const watched = list.includes(symbol);
  const ref = useRef<HTMLButtonElement>(null);
  const pressed = useRef(false);
  // The star pops in when the user stars the row (never on first paint).
  useLayoutEffect(() => {
    if (!pressed.current) return;
    pressed.current = false;
    if (watched) play(ref.current?.querySelector("svg"), POP, 200);
  }, [watched]);
  return (
    <Button
      ref={ref}
      variant="ghost"
      size="small"
      iconOnly
      aria-label={`Watch ${symbol}`}
      aria-pressed={watched}
      leadingIcon={watched ? RiStarFill : RiStarLine}
      className={cx(QUIET_ICON_BUTTON, watched && "text-ticket-detail-favorite hover:text-ticket-detail-favorite")}
      onClick={() => {
        pressed.current = true;
        toggle(symbol);
      }}
    />
  );
}

/**
 * Below its full width, the results card hides AUTO_HIDE columns one by one
 * and then tightens the cells, so the table fits without scrolling. Container
 * queries on the card rather than a ResizeObserver: the server-rendered page
 * already has the right columns, so nothing jumps after hydration.
 */
function fitCss(cols: ColumnDef[]): string {
  const table = "table.sr-table";
  return fitSteps(cols)
    .map((step) => {
      const css = step.hide
        ? `${table} [data-col="${step.hide}"]{display:none}`
        : `${table} :is(th,td){padding-inline:${TIGHT_PAD}px}`;
      return `@container results (width < ${step.below}px){${css}}`;
    })
    .join("");
}

type TableViewProps = {
  rows: ScreenRow[];
  hiddenColumns: ColumnKey[];
  sort: ScreenSort;
  /** Live: a query for other filters is on its way; the rows are the previous answer. */
  pending: boolean;
  loading: boolean;
  failed: boolean;
  live: boolean;
  dispatch: Dispatch<ScreenerAction>;
  retry: () => void;
  tableRef: RefObject<HTMLTableElement | null>;
};

/** The matching stocks: sortable headers, one row per stock on this page. */
export function ResultsTable() {
  const { state, dispatch, tableRef, result, live, retry } = useScreener();
  return (
    <TableView
      rows={result.rows}
      hiddenColumns={state.hiddenColumns}
      sort={state.sort}
      pending={result.loading && result.rows.length > 0}
      loading={result.loading}
      failed={result.failed}
      live={live !== null}
      dispatch={dispatch}
      retry={retry}
      tableRef={tableRef}
    />
  );
}

/**
 * Memoised on narrow props: edits elsewhere (a star, a typed threshold that
 * hasn't applied yet, the column menu opening) don't re-render the rows.
 */
const TableView = memo(function TableView({
  rows,
  hiddenColumns,
  sort,
  pending,
  loading,
  failed,
  live,
  dispatch,
  retry,
  tableRef,
}: TableViewProps) {
  const cols = useMemo(() => COLUMNS.filter((c) => !hiddenColumns.includes(c.key)), [hiddenColumns]);
  const sortable = (key: ColumnKey) => key !== "watch" && !(live && LIVE_UNSORTABLE.includes(key));
  const direction = sort.dir === "asc" ? "ascending" : "descending";

  return (
    // aria-busy while a live query runs: the rows on screen are the previous answer.
    <div aria-busy={loading || undefined} className="min-w-0">
      <style>{fitCss(cols)}</style>
      {/* relative: the screen-reader-only text in cells must stay inside the scroller.
          data-pending dims the old rows a touch, after a beat (screener.css). */}
      <Table
        ref={tableRef}
        aria-label="Matching stocks"
        size="sm"
        containerClassName="relative"
        className="sr-table"
        data-pending={pending || undefined}
        sortDescriptor={{ column: sort.key, direction }}
        onSortChange={(d) => dispatch({ type: "sortColumn", key: d.column as SortKey })}
      >
        <TableHeader>
          {cols.map((c) => (
            <TableColumn
              key={c.key}
              id={c.key}
              data-col={c.key}
              isRowHeader={c.key === "company"}
              allowsSorting={sortable(c.key)}
              textValue={c.label}
              className={cx(
                "group",
                sortable(c.key) && "cursor-pointer transition-colors duration-150 hover:text-text-secondary",
              )}
            >
              <ColumnHead col={c} direction={sort.key === c.key ? direction : undefined} />
            </TableColumn>
          ))}
        </TableHeader>
        <TableBody
          // Items, so React Aria caches each row's render by its data: a re-sort
          // moves the rows it already has instead of re-rendering them.
          items={rows}
          dependencies={[cols, live]}
          renderEmptyState={() => (
            <div className="py-10 text-center text-body-regular text-text-secondary">
              {failed ? (
                <>
                  Couldn’t load results from TradingView.{" "}
                  <LinkButton size="small" onClick={retry}>
                    Try again
                  </LinkButton>
                </>
              ) : loading ? (
                // After a beat (animate-wait), so a quick answer never flashes it.
                <span className="flex animate-wait flex-col gap-3" aria-label="Loading results">
                  {Array.from({ length: 6 }, (_, i) => (
                    <Skeleton key={i} className="h-8 w-full" />
                  ))}
                </span>
              ) : (
                <>
                  No stocks match these filters.{" "}
                  <LinkButton size="small" onClick={() => dispatch({ type: "reset" })}>
                    Reset filters
                  </LinkButton>
                </>
              )}
            </div>
          )}
        >
          {(s) => (
            <TableRow
              id={s.symbol}
              textValue={`${s.symbol} ${s.name}`}
              // Opaque, so rows gliding past each other in a transition don't show through.
              className="bg-background-primary-default hover:bg-background-primary-hover"
            >
              {cols.map((c) => (
                <TableCell key={c.key} data-col={c.key} className={c.align === "end" ? "text-end" : undefined}>
                  <Cell col={c.key} s={s} linked={live || CHARTED.has(s.symbol)} />
                </TableCell>
              ))}
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
});

function Cell({ col, s, linked }: { col: ColumnKey; s: ScreenRow; linked: boolean }) {
  switch (col) {
    case "company":
      return <Company s={s} linked={linked} />;
    case "industry":
      return (
        <span title={s.industry ?? undefined} className="block max-w-32 truncate text-body-2-regular text-text-secondary">
          {s.industry ?? MISSING}
        </span>
      );
    case "price":
      return <span className="text-text-primary">{fmtPrice(s.price)}</span>;
    case "today":
      return (
        <span className={s.changePct >= 0 ? "text-text-positive" : "text-text-negative"}>{pct(s.changePct)}</span>
      );
    case "cap":
      return <span className="text-text-secondary">{orMissing(s.marketCap, fmtCap)}</span>;
    case "pe":
      return <span className="text-text-secondary">{orMissing(s.fwdPe, fmtPe)}</span>;
    case "growth":
      return <span className="text-text-secondary">{orMissing(s.revGrowth, fmtGrowth)}</span>;
    case "gm":
      return <span className="text-text-secondary">{orMissing(s.grossMargin, fmtPct1)}</span>;
    case "roic":
      return <span className="text-body-2-semibold text-text-primary">{orMissing(s.roic, fmtPct1)}</span>;
    case "range":
      return <RangeBar s={s} />;
    case "trend":
      return <Sparkline s={s} />;
    case "watch":
      return <WatchButton symbol={s.symbol} />;
  }
}
