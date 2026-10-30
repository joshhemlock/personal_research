"use client";

import Link from "next/link";
import { ICONS } from "@/components/ui/Icon";
import { TickerDot } from "@/components/ui/Pill";
import { pct, tone } from "@/lib/format";
import { UNIVERSE } from "@/lib/mock/market";
import type { ScreenSort, ScreenStock } from "@/lib/mock/screener";
import {
  COLUMNS,
  defaultDir,
  fmtCap,
  fmtGrowth,
  fmtPct1,
  fmtPe,
  fmtPrice,
  type ColumnDef,
  type ColumnKey,
} from "./screen";
import { useScreener } from "./ScreenerProvider";

const ROW = "grid items-center gap-x-[10px] px-1";
const COMPANY = "flex items-center gap-[10px] text-ink";

// Symbols the chart screen has sample data for. Other rows show the same
// cell without a link (their /stock page would 404) until that data exists.
const CHARTED = new Set(UNIVERSE.map((s) => s.symbol));

function SortHeader({ col, sort, onSort }: { col: ColumnDef; sort: ScreenSort; onSort: () => void }) {
  if (col.key === "watch") {
    return (
      <span role="columnheader">
        <span className="sr-only">Watch</span>
      </span>
    );
  }
  const active = sort.key === col.key;
  const dir = active ? sort.dir : defaultDir(col.key);
  const right = col.align === "right";
  return (
    <span
      role="columnheader"
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

function Cell({ col, s, watched, onWatch }: { col: ColumnKey; s: ScreenStock; watched: boolean; onWatch: () => void }) {
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
        <span role="cell">
          {CHARTED.has(s.symbol) ? (
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
        <span role="cell" className="truncate text-[13px] text-ink-3">
          {s.industry}
        </span>
      );
    case "price":
      return (
        <span role="cell" className="text-right">
          {fmtPrice(s.price)}
        </span>
      );
    case "today":
      return (
        <span role="cell" className={`text-right text-[13px] ${s.changePct >= 0 ? "text-up-text" : "text-down-text"}`}>
          {pct(s.changePct)}
        </span>
      );
    case "cap":
      return (
        <span role="cell" className="text-right text-ink-2">
          {fmtCap(s.marketCap)}
        </span>
      );
    case "pe":
      return (
        <span role="cell" className="text-right text-ink-2">
          {fmtPe(s.fwdPe)}
        </span>
      );
    case "growth":
      return (
        <span role="cell" className="text-right text-ink-2">
          {fmtGrowth(s.revGrowth)}
        </span>
      );
    case "gm":
      return (
        <span role="cell" className="text-right text-ink-2">
          {fmtPct1(s.grossMargin)}
        </span>
      );
    case "roic":
      return (
        <span role="cell" className="text-right font-medium">
          {fmtPct1(s.roic)}
        </span>
      );
    case "range": {
      const label = `52-week range ${fmtPrice(s.low52)} to ${fmtPrice(s.high52)}`;
      return (
        <span role="cell" title={label} className="relative block h-1 rounded-[2px] bg-[rgba(17,17,19,0.08)]">
          <span className="sr-only">{`${label}, at ${s.rangePos}%`}</span>
          <span
            aria-hidden="true"
            className="absolute -top-1 -ml-[6px] size-3 rounded-full border-2 border-white bg-ink"
            style={{ left: `${s.rangePos}%` }}
          />
        </span>
      );
    }
    case "trend":
      return (
        <span role="cell">
          <span className="sr-only">{s.trend >= 0 ? "Up over 3 months" : "Down over 3 months"}</span>
          {/* Inline (not block) like the design, so it sits on the text baseline. */}
          <svg width="84" height="24" viewBox="0 0 84 24" aria-hidden="true" className="inline align-baseline">
            <path d={s.spark} fill="none" stroke={tone(s.trend).stroke} strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
        </span>
      );
    case "watch":
      return (
        <span role="cell">
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

/** The matching stocks: sortable headers, one row per stock on this page. */
export function ResultsTable() {
  const { state, dispatch, result } = useScreener();
  const cols = COLUMNS.filter((c) => !state.hiddenColumns.includes(c.key));
  const template = cols.map((c) => c.track).join(" ");

  return (
    <div className="overflow-x-auto">
      <div role="table" aria-label="Matching stocks" aria-rowcount={result.matches.length + 1} className="min-w-[960px]">
        <div
          role="row"
          aria-rowindex={1}
          className={`${ROW} py-[6px] text-[12px] text-muted`}
          style={{ gridTemplateColumns: template }}
        >
          {cols.map((c) => (
            <SortHeader
              key={c.key}
              col={c}
              sort={state.sort}
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
            style={{ gridTemplateColumns: template }}
          >
            {cols.map((c) => (
              <Cell
                key={c.key}
                col={c.key}
                s={s}
                watched={state.watched.includes(s.symbol)}
                onWatch={() => dispatch({ type: "toggleWatch", symbol: s.symbol })}
              />
            ))}
          </div>
        ))}
        {result.rows.length === 0 && (
          <div role="row" className="border-t border-hairline px-1 py-8 text-center text-ink-3">
            <span role="cell">
              No stocks match these filters.{" "}
              <button type="button" onClick={() => dispatch({ type: "reset" })} className="text-ink underline">
                Reset filters
              </button>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
