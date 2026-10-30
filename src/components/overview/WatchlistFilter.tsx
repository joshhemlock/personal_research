"use client";

import { Fragment, useState, type ReactNode } from "react";
import { Segmented, type SegmentOption } from "@/components/ui/Segmented";
import type { WatchGroup } from "@/lib/mock/overview";

export type WatchFilter = "All" | WatchGroup;

export type WatchlistRowSlot = { symbol: string; group: WatchGroup; row: ReactNode };

type WatchlistFilterProps = {
  heading: ReactNode;
  tools: ReactNode;
  tabs: SegmentOption<WatchFilter>[];
  /** Column header row. */
  columns: ReactNode;
  /** Rows rendered on the server; the filter only picks which ones show. */
  rows: WatchlistRowSlot[];
};

/** Watchlist header with the group filter, and the table it filters. */
export function WatchlistFilter({ heading, tools, tabs, columns, rows }: WatchlistFilterProps) {
  const [filter, setFilter] = useState<WatchFilter>("All");
  const shown = filter === "All" ? rows : rows.filter((r) => r.group === filter);
  return (
    <>
      <div className="mb-[2px] flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4">
          {heading}
          <Segmented
            label="Watchlist filter"
            options={tabs}
            value={filter}
            onChange={setFilter}
            buttonClassName="h-[34px] px-[14px] text-[14px] leading-[normal] normal-nums"
          />
        </div>
        {tools}
      </div>
      <div className="overflow-x-auto">
        <div role="table" aria-label="Watchlist" className="min-w-[900px]">
          {columns}
          {shown.map((r) => (
            <Fragment key={r.symbol}>{r.row}</Fragment>
          ))}
        </div>
      </div>
    </>
  );
}
