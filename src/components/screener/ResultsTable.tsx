"use client";

import Link from "next/link";
import { ICONS } from "@/components/ui/Icon";
import { TickerDot } from "@/components/ui/Pill";
import { pct, tone } from "@/lib/format";
import { UNIVERSE } from "@/lib/mock/market";
import type { ScreenRow, ScreenSort } from "@/lib/mock/screener";
import {
  COLUMNS,
  LIVE_UNSORTABLE,
  defaultDir,
  fitSteps,
  fmtCap,
  fmtGrowth,
  fmtPct1,
  fmtPe,
  fmtPrice,
  gridTemplate,
  type ColumnDef,
  type ColumnKey,
} from "./screen";
import { useScreener } from "./ScreenerProvider";

// Rows take their tracks from --cols, which the fit stylesheet below sets.
const ROW = "grid items-center gap-x-[10px] px-1 [grid-template-columns:var(--cols)]";
const COMPANY = "flex items-center gap-[10px] text-ink";

// Symbols the chart screen has sample data for. With sample data, other rows
// show the same cell without a link (their /stock page would 404); with live
// data every row links.
const CHARTED = new Set(UNIVERSE.map((s) => s.symbol));

/** Shown for a value TradingView doesn't have. */
const MISSING = <span className="text-muted">—</span>;

function orMissing<T>(v: T | null, format: (v: T) => string) {
  return v === null ? MISSING : format(v);
}

function SortHeader({
  col,
  sort,
  sortable,
  onSort,
}: {
  col: ColumnDef;
  sort: ScreenSort;
  sortable: boolean;
  onSort: () => void;
}) {
  if (col.key === "watch") {
    return (
      <span role="columnheader" data-col="watch">
        <span className="sr-only">Watch</span>
      </span>
    );
  }
  if (!sortable) {
    return (
      <span role="columnheader" data-col={col.key} className={`whitespace-nowrap ${col.align === "right" ? "text-right" : ""}`}>
        {col.label}
      </span>
    );
  }
  const active = sort.key === col.key;
  const dir = active ? sort.dir : defaultDir(col.key);
  const right = col.align === "right";
  return (
    <span
      role="columnheader"
      data-col={col.key}
      aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : undefined}
      className={right ? "text-right" : undefined}
    >
      <button
        type="button"
        onClick={onSort}
        className="group relative leading-[inherit] whitespace-nowrap tabular-nums hover:text-ink"
      >
        {col.label}
        {/* Direction hint on hover/focus; the sort itself shows in "Sort by". */}
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={`pointer-events-none absolute top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 ${
            right ? "right-full mr-[2px]" : "left-full ml-[2px]"
          }`}
        >
          <path d={dir === "asc" ? "M12 19V5M6 11l6-6 6 6" : "M12 5v14M6 13l6 6 6-6"} />
        </svg>
      </button>
    </span>
  );
}

function Cell({
  col,
  s,
  linked,
  watched,
  onWatch,
}: {
  col: ColumnKey;
  s: ScreenRow;
  linked: boolean;
  watched: boolean;
  onWatch: () => void;
}) {
  switch (col) {
    case "company": {
      const body = (
        <>
          <TickerDot symbol={s.symbol} size={28} fontSize={12} />
          <span className="flex min-w-0 flex-col leading-[1.15]">
            <span className="font-medium">{s.symbol}</span>
            <span className="truncate text-[12px] text-muted">{s.name}</span>
          </span>
        </>
      );
      return (
        <span role="cell" data-col={col}>
          {linked ? (
            <Link href={`/stock/${s.symbol}`} className={`${COMPANY} hover:text-focus`}>
              {body}
            </Link>
          ) : (
            <span className={COMPANY}>{body}</span>
          )}
        </span>
      );
    }
    case "industry":
      return (
        <span role="cell" data-col={col} title={s.industry ?? undefined} className="truncate text-[13px] text-ink-3">
          {s.industry ?? MISSING}
        </span>
      );
    case "price":
      return (
        <span role="cell" data-col={col} className="text-right">
          {fmtPrice(s.price)}
        </span>
      );
    case "today":
      return (
        <span role="cell" data-col={col} className={`text-right text-[13px] ${s.changePct >= 0 ? "text-up-text" : "text-down-text"}`}>
          {pct(s.changePct)}
        </span>
      );
    case "cap":
      return (
        <span role="cell" data-col={col} className="text-right text-ink-2">
          {orMissing(s.marketCap, fmtCap)}
        </span>
      );
    case "pe":
      return (
        <span role="cell" data-col={col} className="text-right text-ink-2">
          {orMissing(s.fwdPe, fmtPe)}
        </span>
      );
    case "growth":
      return (
        <span role="cell" data-col={col} className="text-right text-ink-2">
          {orMissing(s.revGrowth, fmtGrowth)}
        </span>
      );
    case "gm":
      return (
        <span role="cell" data-col={col} className="text-right text-ink-2">
          {orMissing(s.grossMargin, fmtPct1)}
        </span>
      );
    case "roic":
      return (
        <span role="cell" data-col={col} className="text-right font-medium">
          {orMissing(s.roic, fmtPct1)}
        </span>
      );
    case "range": {
      if (s.rangePos === null || s.low52 === null || s.high52 === null) {
        return (
          <span role="cell" data-col={col}>
            {MISSING}
          </span>
        );
      }
      const label = `52-week range ${fmtPrice(s.low52)} to ${fmtPrice(s.high52)}`;
      return (
        <span role="cell" data-col={col} title={label} className="relative block h-1 rounded-[2px] bg-[rgba(17,17,19,0.08)]">
          <span className="sr-only">{`${label}, at ${s.rangePos}%`}</span>
          <span
            aria-hidden="true"
            className="absolute -top-1 -ml-[6px] size-3 rounded-full border-2 border-white bg-ink"
            style={{ left: `${s.rangePos}%` }}
          />
        </span>
      );
    }
    case "trend": {
      if (s.spark === null) {
        return (
          <span role="cell" data-col={col}>
            {MISSING}
          </span>
        );
      }
      const up = (s.trend ?? 0) >= 0;
      return (
        <span role="cell" data-col={col}>
          <span className="sr-only">{up ? "Up over 3 months" : "Down over 3 months"}</span>
          {/* Inline (not block) like the design, so it sits on the text baseline. */}
          <svg width="84" height="24" viewBox="0 0 84 24" aria-hidden="true" className="inline align-baseline">
            <path d={s.spark} fill="none" stroke={tone(s.trend ?? 0).stroke} strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
        </span>
      );
    }
    case "watch":
      return (
        <span role="cell" data-col={col}>
          <button
            type="button"
            aria-pressed={watched}
            aria-label={`${watched ? "Remove" : "Add"} ${s.symbol} ${watched ? "from" : "to"} watchlist`}
            onClick={onWatch}
            className={`inline-flex size-9 items-center justify-center rounded-[10px] border-0 bg-transparent p-0 hover:bg-track ${
              watched ? "text-[#C98500]" : "text-[#8A8A92] hover:text-ink-2"
            }`}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
              fill={watched ? "#F5A524" : "none"}
              aria-hidden="true"
            >
              <path d={ICONS.star} />
            </svg>
          </button>
        </span>
      );
  }
}

/**
 * Grid tracks for the shown columns, plus, below the split width (91.5rem,
 * --breakpoint-split in globals.css), container queries on the results card
 * that hide AUTO_HIDE columns and then tighten the rest so the table fits
 * without scrolling. CSS rather than a ResizeObserver: the server-rendered
 * page already has the right columns, so nothing jumps after hydration.
 */
function fitCss(cols: ColumnDef[]): string {
  const table = "[data-results-table]";
  const rules = fitSteps(cols).map((step, i) => {
    let css = `${table}{--cols:${step.template}}`;
    if (step.hide) css += `${table} [data-col="${step.hide}"]{display:none}[data-no-room="${step.hide}"]{display:inline}`;
    if (i === 0 && step.hide) css += "[data-no-room-note]{display:block}";
    return `@container results (width < ${step.below}px){${css}}`;
  });
  return `${table}{--cols:${gridTemplate(cols)}}@media (width < 91.5rem){${rules.join("")}}`;
}

/** The matching stocks: sortable headers, one row per stock on this page. */
export function ResultsTable() {
  const { state, dispatch, result, live, retry } = useScreener();
  const cols = COLUMNS.filter((c) => !state.hiddenColumns.includes(c.key));
  const sortable = (key: ColumnKey) => key !== "watch" && !(live && LIVE_UNSORTABLE.includes(key));

  return (
    <div className="overflow-x-auto">
      <style>{fitCss(cols)}</style>
      <div
        role="table"
        aria-label="Matching stocks"
        aria-rowcount={result.total + 1}
        aria-busy={result.loading || undefined}
        data-results-table=""
        className={`min-w-[960px] max-split:min-w-0${result.loading ? " opacity-60 transition-opacity" : ""}`}
      >
        <div role="row" aria-rowindex={1} className={`${ROW} py-[6px] text-[12px] text-muted`}>
          {cols.map((c) => (
            <SortHeader
              key={c.key}
              col={c}
              sort={state.sort}
              sortable={sortable(c.key)}
              onSort={() => c.key !== "watch" && dispatch({ type: "sortColumn", key: c.key })}
            />
          ))}
        </div>
        {result.rows.map((s, i) => (
          <div
            key={s.symbol}
            role="row"
            aria-rowindex={result.offset + i + 2}
            className={`${ROW} min-h-[45px] border-t border-hairline text-[14px]`}
          >
            {cols.map((c) => (
              <Cell
                key={c.key}
                col={c.key}
                s={s}
                linked={live !== null || CHARTED.has(s.symbol)}
                watched={state.watched.includes(s.symbol)}
                onWatch={() => dispatch({ type: "toggleWatch", symbol: s.symbol })}
              />
            ))}
          </div>
        ))}
        {result.rows.length === 0 && (
          <div role="row" className="border-t border-hairline px-1 py-8 text-center text-ink-3">
            {result.failed ? (
              <span role="cell">
                Couldn’t load results from TradingView.{" "}
                <button type="button" onClick={retry} className="text-ink underline">
                  Try again
                </button>
              </span>
            ) : result.loading ? (
              <span role="cell">Loading results…</span>
            ) : (
              <span role="cell">
                No stocks match these filters.{" "}
                <button type="button" onClick={() => dispatch({ type: "reset" })} className="text-ink underline">
                  Reset filters
                </button>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
