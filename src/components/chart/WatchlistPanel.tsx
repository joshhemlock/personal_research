"use client";

// React Aria tables only render their columns from a client module.

import Link from "next/link";
import { RiEqualizerLine } from "@remixicon/react";
import { Accordion, AccordionItem } from "@/components/base/accordion/accordion";
import { Badge } from "@/components/base/badges/badge";
import { IconButton } from "@/components/base/buttons/icon-button";
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@/components/base/table/table";
import { CARD, CARD_TITLE } from "@/components/overview/Card";
import { MINUS, num, pct } from "@/lib/format";
import { cx } from "@/utils/cx";
import { OpenPaletteButton } from "./OpenPaletteButton";
import type { GroupLinks, PinnedLink } from "./types";

const abs = (v: number) => (v < 0 ? MINUS : "") + num(Math.abs(v));
const tone = (v: number) => (v < 0 ? "text-text-negative" : "text-text-positive");

/** Header text aligned to the end of a numeric column (BoardUI's th aligns to the start). */
function End({ children }: { children: string }) {
  return <span className="block text-end">{children}</span>;
}

/** Watchlist panel: pinned symbols, then collapsible groups. */
export function WatchlistPanel({ pinned, groups }: { pinned: readonly PinnedLink[]; groups: readonly GroupLinks[] }) {
  return (
    <section aria-labelledby="wl-h" className={cx(CARD, "flex min-w-0 flex-col overflow-hidden")}>
      <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-3">
        <h2 id="wl-h" className={CARD_TITLE}>
          Watchlist
        </h2>
        <div className="flex items-center gap-2">
          <OpenPaletteButton label="Add symbol" />
          <IconButton size="small" icon={RiEqualizerLine} aria-label="Watchlist settings" />
        </div>
      </div>

      {/* relative: the screen-reader-only text in cells must stay inside the scroller. */}
      <Table aria-label="Pinned symbols" size="sm" containerClassName="relative">
        <TableHeader>
          <TableColumn isRowHeader textValue="Symbol">
            <span className="ps-2.5">Symbol</span>
          </TableColumn>
          <TableColumn textValue="Last">
            <End>Last</End>
          </TableColumn>
          <TableColumn textValue="Change">
            <End>Chg</End>
          </TableColumn>
          <TableColumn textValue="Change %">
            <span className="block pe-2.5 text-end">Chg %</span>
          </TableColumn>
        </TableHeader>
        <TableBody items={pinned.map((row) => ({ ...row, id: row.symbol }))}>
          {(row) => (
            <TableRow
              id={row.symbol}
              href={row.href ?? undefined}
              textValue={row.symbol}
              className={cx(row.href && "cursor-pointer hover:bg-background-primary-hover")}
            >
              <TableCell>
                <span className="block ps-2.5 text-body-2-semibold text-text-primary">{row.symbol}</span>
              </TableCell>
              <TableCell className="text-end">{row.last}</TableCell>
              {/* The table's cell colour is unlayered CSS: tone the content instead. */}
              <TableCell className="text-end">
                <span className={tone(row.change)}>{abs(row.change)}</span>
              </TableCell>
              <TableCell className="text-end">
                <span className={cx("block pe-2.5", tone(row.changePct))}>{abs(row.changePct)}%</span>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Accordion allowsMultipleExpanded className="border-t border-separator-border px-5 pb-1">
        {groups.map((g) => (
          <AccordionItem
            key={g.id}
            id={g.id}
            headingLevel={3}
            title={
              <span className="flex items-center gap-2 text-body-medium">
                {g.name}
                <Badge>{g.items.length}</Badge>
              </span>
            }
            className="[&_[slot=trigger]]:py-3"
          >
            <ul className="-mx-2 flex flex-col">
              {g.items.map((w) => {
                const cells = (
                  <>
                    <span className="text-body-2-semibold text-text-primary">{w.symbol}</span>
                    <span className="text-end text-body-2-medium text-text-primary">{w.last}</span>
                    <span className={cx("text-end text-body-2-medium", tone(w.changePct))}>{pct(w.changePct)}</span>
                  </>
                );
                const row = "grid min-h-8 grid-cols-[minmax(0,1fr)_minmax(0,1fr)_4.5rem] items-center gap-2 rounded-lg px-2";
                return (
                  <li key={w.symbol}>
                    {w.href ? (
                      <Link
                        href={w.href}
                        className={cx(
                          row,
                          "transition-colors duration-150 hover:bg-background-primary-hover active:bg-background-primary-active",
                          "outline-none focus-visible:ring-2 focus-visible:ring-border-focus-ring",
                        )}
                      >
                        {cells}
                      </Link>
                    ) : (
                      <span className={row}>{cells}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
