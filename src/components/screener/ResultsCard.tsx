"use client";

import { memo, useId, useRef, useState, type Dispatch, type RefObject } from "react";
import { RiDownload2Line, RiLayoutColumnLine } from "@remixicon/react";
import { Focusable } from "react-aria-components";
import { IconButton } from "@/components/base/buttons/icon-button";
import { LinkButton } from "@/components/base/buttons/link-button";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Dropdown, DropdownPopover, DropdownTrigger } from "@/components/base/dropdown/dropdown";
import { Pagination } from "@/components/base/pagination/pagination";
import { Select, SelectItem } from "@/components/base/select/select";
import { Spinner } from "@/components/base/spinner/spinner";
import { Tooltip, TooltipTrigger } from "@/components/base/tooltip/tooltip";
import { AnimatedValue } from "@/components/motion/AnimatedValue";
import type { ScreenRow, SortKey } from "@/lib/mock/screener";
import { cx } from "@/utils/cx";
import { COLUMNS, LIVE_UNSORTABLE, SORT_OPTIONS, fmtCount, hiddenForRoom, toCsv, type ColumnKey } from "./screen";
import { ResultsTable } from "./ResultsTable";
import { useScreener, type ScreenerAction } from "./ScreenerProvider";
import { CARD, CARD_TITLE } from "./styles";

/** IconButton's small secondary recipe, for a menu trigger (a React Aria button, so no nested <button>). */
const ICON_TRIGGER = [
  "relative inline-flex size-8 shrink-0 items-center justify-center rounded-2lg",
  "border border-border-button-default bg-background-primary-default text-foreground-icon-primary shadow-xs",
  "transition-[background-color,border-color,box-shadow,color] duration-150 ease",
  "hover:border-border-button-hover hover:bg-background-primary-hover",
  "active:border-border-button-active active:bg-background-primary-active",
].join(" ");

const ColumnsMenu = memo(function ColumnsMenu({
  hiddenColumns,
  dispatch,
  cardRef,
}: {
  hiddenColumns: ColumnKey[];
  dispatch: Dispatch<ScreenerAction>;
  cardRef: RefObject<HTMLElement | null>;
}) {
  const [open, setOpen] = useState(false);
  // The card's width when the menu opened: which columns the table hides for room.
  const [cardWidth, setCardWidth] = useState(Number.POSITIVE_INFINITY);
  const noRoom = hiddenForRoom(
    COLUMNS.filter((c) => !hiddenColumns.includes(c.key)),
    cardWidth,
  );

  return (
    <Dropdown
      isOpen={open}
      onOpenChange={(next) => {
        if (next) setCardWidth(cardRef.current?.clientWidth ?? Number.POSITIVE_INFINITY);
        setOpen(next);
      }}
    >
      <TooltipTrigger delay={300}>
        <DropdownTrigger
          aria-label="Choose columns"
          className={cx(ICON_TRIGGER, open && "border-border-button-active bg-background-primary-active")}
        >
          <RiLayoutColumnLine className="size-4 shrink-0" aria-hidden />
        </DropdownTrigger>
        <Tooltip>Choose columns</Tooltip>
      </TooltipTrigger>
      <DropdownPopover aria-label="Columns" placement="bottom end" className="w-60 p-2" dialogClassName="gap-0.5">
        {COLUMNS.filter((c) => !c.fixed).map((c) => (
          <div
            key={c.key}
            className="flex items-center justify-between gap-2 rounded-2lg px-2 py-1.5 transition-colors hover:bg-dropdown-item-hover-background"
          >
            <Checkbox
              size="sm"
              isSelected={!hiddenColumns.includes(c.key)}
              onChange={() => dispatch({ type: "toggleColumn", key: c.key })}
              className="min-w-0 flex-1"
            >
              {c.label}
            </Checkbox>
            {noRoom.includes(c.key) && <span className="text-caption-1-regular text-text-tertiary">No room</span>}
          </div>
        ))}
        {noRoom.length > 0 && (
          <p className="mt-1 border-t border-separator-border px-2 pt-2 pb-1 text-caption-1-regular text-text-tertiary">
            Columns marked “No room” come back when the window is wider.
          </p>
        )}
      </DropdownPopover>
    </Dropdown>
  );
});

function exportCsv(csv: string, name: string) {
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "screen"}.csv`;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const ExportButton = memo(function ExportButton({
  total,
  exportCap,
  exportMatches,
  screenName,
}: {
  total: number;
  /** Live: most rows an export downloads; null with sample data. */
  exportCap: number | null;
  exportMatches: () => Promise<ScreenRow[]>;
  screenName: string;
}) {
  const [failed, setFailed] = useState(false);
  const [exporting, setExporting] = useState(false);
  const hint = failed
    ? "Export failed. Try again"
    : exportCap !== null && total > exportCap
      ? `Export results (CSV, first ${fmtCount(exportCap)})`
      : "Export results (CSV)";

  async function exportResults() {
    setExporting(true);
    try {
      exportCsv(toCsv(await exportMatches()), screenName);
      setFailed(false);
    } catch {
      setFailed(true);
    } finally {
      setExporting(false);
    }
  }

  return (
    <TooltipTrigger delay={300}>
      <Focusable>
        <IconButton
          size="small"
          icon={RiDownload2Line}
          aria-label="Export results"
          disabled={total === 0 || exporting}
          onClick={exportResults}
        />
      </Focusable>
      <Tooltip>{hint}</Tooltip>
    </TooltipTrigger>
  );
});

const SortSelect = memo(function SortSelect({
  sortKey,
  live,
  dispatch,
}: {
  sortKey: SortKey;
  live: boolean;
  dispatch: Dispatch<ScreenerAction>;
}) {
  const options = live ? SORT_OPTIONS.filter((o) => !LIVE_UNSORTABLE.includes(o.value)) : SORT_OPTIONS;
  return (
    <Select
      label={<span className="text-text-secondary">Sort by</span>}
      size="sm"
      value={sortKey}
      onChange={(key) => key && dispatch({ type: "sortBy", key: key as SortKey })}
      className="flex-row items-center gap-2"
      triggerClassName="w-36"
      popoverClassName="w-48"
    >
      {options.map((o) => (
        <SelectItem key={o.value} id={o.value} textValue={o.label}>
          {o.label}
        </SelectItem>
      ))}
    </Select>
  );
});

const Pager = memo(function Pager({
  page,
  pageCount,
  dispatch,
}: {
  page: number;
  pageCount: number;
  dispatch: Dispatch<ScreenerAction>;
}) {
  return (
    <Pagination
      page={page + 1}
      totalPages={pageCount}
      onChange={(p) => dispatch({ type: "page", page: p - 1 })}
      className="w-auto"
      aria-label="Results pages"
    />
  );
});

/** "31 matches" card: sort, columns and export, the table, then paging. */
export function ResultsCard() {
  const { state, dispatch, result, live, retry, exportMatches } = useScreener();
  const headingId = useId();
  const cardRef = useRef<HTMLElement>(null);
  const total = result.total;
  const first = result.offset + 1;
  const last = result.offset + result.rows.length;
  const of = fmtCount(total);
  const pageLine =
    total === 0 ? "No matches" : first === last ? `Showing ${first} of ${of}` : `Showing ${first}–${last} of ${of}`;
  const screenName = state.screens.find((s) => s.id === state.activeId)?.name ?? "screen";
  // Live: the pager follows a click at once, while the rows wait for the answer.
  const page = result.loading ? Math.min(state.page, result.pageCount - 1) : result.page;

  return (
    // A size container: the table's fit stylesheet queries this card's width.
    <section
      ref={cardRef}
      aria-labelledby={headingId}
      className={cx(CARD, "@container/results flex min-w-0 flex-col overflow-hidden")}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5 pb-4">
        <div className="flex items-center gap-2.5">
          <h2 id={headingId} className={CARD_TITLE}>
            <AnimatedValue value={`${of} ${total === 1 ? "match" : "matches"}`} />
          </h2>
          {result.loading && result.rows.length > 0 && (
            // After a beat (animate-wait), so a quick answer never flashes it.
            <span className="flex animate-wait">
              <Spinner size="xs" aria-label="Updating results" />
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SortSelect sortKey={state.sort.key} live={live !== null} dispatch={dispatch} />
          <ColumnsMenu hiddenColumns={state.hiddenColumns} dispatch={dispatch} cardRef={cardRef} />
          <ExportButton
            total={total}
            exportCap={live?.exportCap ?? null}
            exportMatches={exportMatches}
            screenName={screenName}
          />
        </div>
      </div>
      <ResultsTable />
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-separator-border px-5 py-3">
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-body-regular text-text-secondary">
          <span aria-live="polite">{pageLine}</span>
          {result.failed && result.rows.length > 0 && (
            <span className="text-text-error-primary">
              Couldn’t update.{" "}
              <LinkButton size="small" onClick={retry}>
                Try again
              </LinkButton>
            </span>
          )}
          {live && (
            // Muted credit for live data, which TradingView's terms ask for.
            <span className="text-caption-1-regular text-text-tertiary">
              Data:{" "}
              <LinkButton href="https://www.tradingview.com/" target="_blank" rel="noopener noreferrer" variant="secondary" size="xs">
                TradingView
              </LinkButton>
            </span>
          )}
        </p>
        <Pager page={page} pageCount={result.pageCount} dispatch={dispatch} />
      </div>
    </section>
  );
}
