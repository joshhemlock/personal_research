"use client";

// React Aria tables only render their columns from a client module.

import { useState } from "react";
import { RiAddLine, RiLayoutColumnLine } from "@remixicon/react";
import { Chip } from "@/components/base/badges/chip";
import { IconButton } from "@/components/base/buttons/icon-button";
import { SegmentedControl, SegmentedControlItem } from "@/components/base/segmented-control/segmented-control";
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@/components/base/table/table";
import { deltaColor } from "@/components/shell/delta";
import { num, pct } from "@/lib/format";
import { WATCH_GROUPS, type WatchGroup, type WatchRow } from "@/lib/mock/overview";
import { cx } from "@/utils/cx";
import { CARD, CARD_TITLE } from "./Card";
import { compactUsd, monthDay } from "./format";
import { Sparkline } from "./Sparkline";

type WatchFilter = "All" | WatchGroup;
const FILTERS: WatchFilter[] = ["All", ...WATCH_GROUPS];

/** Header text aligned to the end of a numeric column (BoardUI's th aligns to the start). */
function End({ children }: { children: string }) {
  return <span className="block text-end">{children}</span>;
}

/** Watchlist card: a group filter, then one row per symbol linking to its chart. */
export function Watchlist({ rows }: { rows: WatchRow[] }) {
  const [filter, setFilter] = useState<WatchFilter>("All");
  const shown = filter === "All" ? rows : rows.filter((r) => r.group === filter);
  const count = (f: WatchFilter) => (f === "All" ? rows.length : rows.filter((r) => r.group === f).length);

  return (
    <section aria-labelledby="wl-h" className={cx(CARD, "flex min-w-0 flex-col overflow-hidden")}>
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5 pb-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <h2 id="wl-h" className={CARD_TITLE}>
            Watchlist
          </h2>
          <SegmentedControl
            aria-label="Watchlist filter"
            selectedKeys={[filter]}
            onSelectionChange={(keys) => {
              const next = [...keys][0] as WatchFilter | undefined;
              if (next) setFilter(next);
            }}
          >
            {FILTERS.map((f) => (
              <SegmentedControlItem key={f} id={f}>
                {f}
                <span className="ms-1.5 text-text-tertiary">{count(f)}</span>
              </SegmentedControlItem>
            ))}
          </SegmentedControl>
        </div>
        <div className="flex items-center gap-2">
          <IconButton size="small" icon={RiAddLine} aria-label="Add symbol" />
          <IconButton size="small" icon={RiLayoutColumnLine} aria-label="Choose columns" />
        </div>
      </div>

      {/* relative: the screen-reader-only text in cells must stay inside the scroller. */}
      <Table aria-label="Watchlist" size="sm" className="min-w-[50rem]" containerClassName="relative">
        <TableHeader>
          <TableColumn isRowHeader textValue="Symbol">
            <span className="ps-2.5">Symbol</span>
          </TableColumn>
          <TableColumn textValue="Last">
            <End>Last</End>
          </TableColumn>
          <TableColumn textValue="Today">
            <End>Today</End>
          </TableColumn>
          <TableColumn>1-month trend</TableColumn>
          <TableColumn>52-week range</TableColumn>
          <TableColumn textValue="Mkt cap">
            <End>Mkt cap</End>
          </TableColumn>
          <TableColumn textValue="Fwd P/E">
            <End>Fwd P/E</End>
          </TableColumn>
          <TableColumn textValue="Earnings">
            <span className="block pe-2.5 text-end">Earnings</span>
          </TableColumn>
        </TableHeader>
        <TableBody items={shown}>
          {(row) => (
            <TableRow
              id={row.symbol}
              href={`/stock/${row.symbol}`}
              textValue={`${row.symbol} ${row.name}`}
              className="cursor-pointer hover:bg-background-primary-hover"
            >
              <TableCell>
                <span className="flex min-w-0 flex-col ps-2.5">
                  <span className="text-body-2-semibold text-text-primary">{row.symbol}</span>
                  <span className="max-w-40 truncate text-caption-1-regular text-text-secondary">{row.name}</span>
                </span>
              </TableCell>
              <TableCell className="text-end">{num(row.price)}</TableCell>
              <TableCell className="text-end">
                <Chip color={deltaColor(row.changePct)}>{pct(row.changePct)}</Chip>
              </TableCell>
              <TableCell>
                <Sparkline values={row.trend} up={row.monthPct >= 0} className="h-7 w-24" />
                <span className="sr-only">One month {pct(row.monthPct, 1)}</span>
              </TableCell>
              <TableCell>
                <RangeBar low={row.low52} high={row.high52} price={row.price} />
              </TableCell>
              <TableCell className="text-end">
                <span className="text-text-secondary">{compactUsd(row.marketCap)}</span>
              </TableCell>
              <TableCell className="text-end">
                <span className="text-text-secondary">{row.forwardPE == null ? "—" : row.forwardPE.toFixed(1)}</span>
              </TableCell>
              <TableCell className="text-end">
                <span className="block pe-2.5 text-text-secondary">{row.nextEarnings ? monthDay(row.nextEarnings) : "—"}</span>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </section>
  );
}

/** Where the price sits in its 52-week range: a track with a marker, low and high beneath. */
function RangeBar({ low, high, price }: { low: number; high: number; price: number }) {
  const span = high - low;
  const pos = span > 0 ? Math.min(100, Math.max(0, Math.round(((price - low) / span) * 100))) : 50;
  return (
    <span className="flex w-32 flex-col gap-1.5 pt-1">
      {/* The track takes the control-border token: chart-track matches the card in dark mode. */}
      <span aria-hidden="true" className="relative h-1 rounded-full bg-border-button-default">
        <span
          className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground-icon-primary ring-2 ring-background-primary-default"
          style={{ left: `${pos}%` }}
        />
      </span>
      <span aria-hidden="true" className="flex justify-between text-caption-1-regular text-text-secondary">
        <span>{num(low)}</span>
        <span>{num(high)}</span>
      </span>
      <span className="sr-only">
        {num(low)} to {num(high)}, at {pos}% of the range
      </span>
    </span>
  );
}
