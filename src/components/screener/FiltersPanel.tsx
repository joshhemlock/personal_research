"use client";

import { useEffect, useId, useState } from "react";
import {
  BASE_METRICS,
  CAP_BUCKETS,
  SECTORS,
  UNIVERSES,
  type MetricKey,
  type UniverseId,
} from "@/lib/mock/screener";
import { EXTRA_METRICS, METRICS, thresholdAria } from "./screen";
import { Popover } from "./Popover";
import { useScreener } from "./ScreenerProvider";

function ChipGroup<T extends string>({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: readonly T[];
  selected: readonly T[];
  onToggle: (value: T) => void;
}) {
  const id = useId();
  return (
    <div role="group" aria-labelledby={id} className="flex flex-col gap-2">
      <span id={id} className="text-[13px] text-ink-3">
        {label}
      </span>
      <div className="flex flex-wrap gap-[6px]">
        {options.map((o) => {
          const on = selected.includes(o);
          return (
            <button
              key={o}
              type="button"
              aria-pressed={on}
              onClick={() => onToggle(o)}
              className={`h-[34px] rounded-full border px-3 text-[13px] transition-colors duration-150 ${
                on
                  ? "border-ink bg-ink text-white"
                  : "border-[rgba(17,17,19,0.1)] bg-[rgba(255,255,255,0.7)] text-ink-2 hover:bg-white hover:text-ink"
              }`}
            >
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ThresholdRow({ metric, value, autoFocus }: { metric: MetricKey; value: string; autoFocus: boolean }) {
  const { dispatch } = useScreener();
  const m = METRICS[metric];
  const removable = !BASE_METRICS.includes(metric);
  const row = (
    <label className="flex min-h-[46px] min-w-0 flex-1 items-center gap-[10px] text-[14px] text-ink">
      <span className="min-w-0 flex-1">{m.label}</span>
      <span className="text-[13px] text-muted">{m.bound === "min" ? "≥" : "≤"}</span>
      <span className="inline-flex h-[38px] items-center rounded-[10px] border border-[rgba(17,17,19,0.08)] bg-[rgba(255,255,255,0.9)] px-[10px] outline-offset-2 outline-focus focus-within:outline-2">
        <input
          type="number"
          inputMode="decimal"
          step={m.step}
          value={value}
          placeholder="–"
          aria-label={thresholdAria(metric)}
          autoFocus={autoFocus}
          onChange={(e) => dispatch({ type: "threshold", key: metric, value: e.target.value })}
          className="w-[38px] border-0 bg-transparent px-[2px] py-px text-right text-[14px] text-ink [appearance:textfield] placeholder:text-muted focus-visible:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <span className="pl-[2px] text-[13px] text-muted">{m.unit}</span>
      </span>
    </label>
  );
  if (!removable) return row;
  return (
    <div className="flex items-center gap-1">
      {row}
      <button
        type="button"
        aria-label={`Remove ${m.label} filter`}
        title="Remove filter"
        onClick={() => dispatch({ type: "removeThreshold", key: metric })}
        className="inline-flex size-7 flex-none items-center justify-center rounded-full text-muted hover:bg-track hover:text-ink"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </div>
  );
}

function AddFilter() {
  const { state, dispatch } = useScreener();
  const available = EXTRA_METRICS.filter((k) => !state.filters.thresholds.some((t) => t.key === k));
  return (
    <Popover
      button="Add filter"
      buttonClassName="h-[42px] w-full rounded-full border border-dashed border-[rgba(17,17,19,0.2)] bg-transparent text-[14px] text-ink-2 hover:border-[rgba(17,17,19,0.35)] hover:text-ink disabled:cursor-default disabled:opacity-60"
      disabled={available.length === 0}
      panelLabel="Filters you can add"
      panelClassName="top-full right-0 left-0 mt-2"
    >
      {(close) =>
        available.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              dispatch({ type: "addThreshold", key });
              close();
            }}
            className="flex h-9 w-full items-center justify-between gap-3 rounded-[10px] px-3 text-left hover:bg-track"
          >
            {METRICS[key].menuLabel ?? METRICS[key].label}
            <span className="text-[13px] whitespace-nowrap text-muted">
              {METRICS[key].bound === "min" ? "≥" : "≤"} {METRICS[key].unit}
            </span>
          </button>
        ))
      }
    </Popover>
  );
}

function SaveButton() {
  const { state, dispatch } = useScreener();
  const [saved, setSaved] = useState(false);
  const name = state.screens.find((s) => s.id === state.activeId)?.name ?? "screen";

  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 1600);
    return () => clearTimeout(t);
  }, [saved]);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          dispatch({ type: "saveScreen" });
          setSaved(true);
        }}
        className="h-[46px] rounded-full border-0 bg-ink text-[15px] font-medium text-white hover:bg-[#2A2A2E]"
      >
        {saved ? "Saved" : "Save screen"}
      </button>
      <span className="sr-only" aria-live="polite">
        {saved ? `Saved “${name}”` : ""}
      </span>
    </>
  );
}

/** Left column: universe, size and sector chips, numeric thresholds. */
export function FiltersPanel() {
  const { state, dispatch } = useScreener();
  const { filters } = state;
  const headingId = useId();

  return (
    <aside
      aria-labelledby={headingId}
      className="glass flex min-w-0 flex-[1_1_290px] flex-col gap-[14px] self-start rounded-[24px] px-[18px] py-4"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 id={headingId} className="text-[21px] font-normal tracking-[-0.01em]">
          Filters
        </h2>
        <button
          type="button"
          onClick={() => dispatch({ type: "reset" })}
          className="h-9 rounded-full border-0 bg-transparent px-3 text-[14px] text-ink-2 underline hover:text-ink"
        >
          Reset
        </button>
      </div>
      <label className="flex flex-col gap-[6px] text-[13px] text-ink-3">
        Universe
        <select
          value={filters.universe}
          onChange={(e) => dispatch({ type: "universe", value: e.target.value as UniverseId })}
          className="h-[42px] rounded-[12px] border border-[rgba(17,17,19,0.08)] bg-[rgba(255,255,255,0.9)] px-[14px] text-[14px] text-ink"
        >
          {UNIVERSES.map((u) => (
            <option key={u.value} value={u.value}>
              {u.label}
            </option>
          ))}
        </select>
      </label>
      <ChipGroup
        label="Market cap"
        options={CAP_BUCKETS}
        selected={filters.caps}
        onToggle={(value) => dispatch({ type: "toggleCap", value })}
      />
      <ChipGroup
        label="Sector"
        options={SECTORS}
        selected={filters.sectors}
        onToggle={(value) => dispatch({ type: "toggleSector", value })}
      />
      <div className="flex flex-col gap-[2px] border-t border-[rgba(17,17,19,0.06)] pt-2">
        {filters.thresholds.map((t) => (
          <ThresholdRow key={t.key} metric={t.key} value={t.value} autoFocus={t.key === state.lastAdded} />
        ))}
      </div>
      <AddFilter />
      <SaveButton />
    </aside>
  );
}
