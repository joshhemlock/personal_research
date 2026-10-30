"use client";

import { useId } from "react";
import { Icon } from "@/components/ui/Icon";
import type { SortKey } from "@/lib/mock/screener";
import { COLUMNS, SORT_OPTIONS, toCsv } from "./screen";
import { Popover } from "./Popover";
import { ResultsTable } from "./ResultsTable";
import { useScreener } from "./ScreenerProvider";

const ICON_BUTTON =
  "inline-flex size-10 items-center justify-center rounded-[12px] border-0 bg-transparent p-0 text-ink-3 hover:bg-track hover:text-ink disabled:opacity-40 disabled:hover:bg-transparent";

function ColumnsMenu() {
  const { state, dispatch } = useScreener();
  return (
    <Popover
      button={<Icon d="M4 5h16v14H4zM9.5 5v14M14.5 5v14" size={18} strokeWidth={1.6} linejoin="round" />}
      buttonLabel="Choose columns"
      buttonClassName={ICON_BUTTON}
      panelLabel="Columns"
      className="inline-flex"
      panelClassName="top-full right-0 mt-1 w-[224px]"
    >
      {() => (
        <>
          {COLUMNS.filter((c) => !c.fixed).map((c) => (
            <label key={c.key} className="flex h-9 items-center gap-[10px] rounded-[10px] px-3 hover:bg-track">
              <input
                type="checkbox"
                checked={!state.hiddenColumns.includes(c.key)}
                onChange={() => dispatch({ type: "toggleColumn", key: c.key })}
                className="size-4 accent-ink"
              />
              {c.label}
              {/* Shown by the table's fit stylesheet while the column is hidden for space. */}
              <span data-no-room={c.key} className="ml-auto hidden text-[12px] text-muted">
                No room
              </span>
            </label>
          ))}
          <p data-no-room-note="" className="hidden border-t border-hairline px-3 pt-2 pb-1 text-[12px] leading-[1.35] text-muted">
            Columns marked “No room” come back when the window is wider.
          </p>
        </>
      )}
    </Popover>
  );
}

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

function PageButton({ dir, enabled, onClick }: { dir: "prev" | "next"; enabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={dir === "prev" ? "Previous page" : "Next page"}
      disabled={!enabled}
      onClick={onClick}
      className={`inline-flex size-9 items-center justify-center rounded-[10px] border-0 p-0 ${
        enabled ? "bg-ink text-white hover:bg-[#2A2A2E]" : "bg-track text-[#8A8A92]"
      }`}
    >
      <Icon d={dir === "prev" ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"} size={16} strokeWidth={2} linejoin="round" />
    </button>
  );
}

/** "18 matches" card: sort and export tools, the table and pagination. */
export function ResultsCard() {
  const { state, dispatch, result } = useScreener();
  const headingId = useId();
  const total = result.matches.length;
  const first = result.offset + 1;
  const last = result.offset + result.rows.length;
  const pageLine =
    total === 0 ? "No matches" : first === last ? `Showing ${first} of ${total}` : `Showing ${first}–${last} of ${total}`;
  const screenName = state.screens.find((s) => s.id === state.activeId)?.name ?? "screen";

  return (
    // A size container: the table's fit stylesheet queries this card's width.
    <section aria-labelledby={headingId} className="glass @container/results rounded-[24px] px-[18px] pt-[14px] pb-2">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-[10px]">
        <h2 id={headingId} className="text-[21px] font-normal tracking-[-0.01em]">
          {`${total} ${total === 1 ? "match" : "matches"}`}
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex items-center gap-2 text-[13px] text-ink-3">
            Sort by
            {/* Fixed width: the design's auto width for "Revenue growth", so the
                extra options don't widen it. pb-[2px] puts the text where the
                snapshot shows it (1px above center). */}
            <select
              value={state.sort.key}
              onChange={(e) => dispatch({ type: "sortBy", key: e.target.value as SortKey })}
              className="h-[38px] w-[147px] rounded-full border border-[rgba(17,17,19,0.08)] bg-[rgba(255,255,255,0.9)] px-3 pb-[2px] text-[14px] text-ink"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <ColumnsMenu />
          <button
            type="button"
            aria-label="Export results"
            title="Export results (CSV)"
            disabled={total === 0}
            onClick={() => exportCsv(toCsv(result.matches), screenName)}
            className={ICON_BUTTON}
          >
            <Icon d="M12 4v11M7 10l5 5 5-5M5 20h14" size={18} strokeWidth={1.6} linejoin="round" />
          </button>
        </div>
      </div>
      <ResultsTable />
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-hairline px-1 pt-2 pb-1 text-[13px] text-ink-3">
        <span aria-live="polite">{pageLine}</span>
        <span className="inline-flex gap-1">
          <PageButton
            dir="prev"
            enabled={result.page > 0}
            onClick={() => dispatch({ type: "page", page: result.page - 1 })}
          />
          <PageButton
            dir="next"
            enabled={result.page < result.pageCount - 1}
            onClick={() => dispatch({ type: "page", page: result.page + 1 })}
          />
        </span>
      </div>
    </section>
  );
}
