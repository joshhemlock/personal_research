"use client";

import { memo, useEffect, useId, useLayoutEffect, useRef, useState, type Dispatch } from "react";
import { RiAddLine, RiCheckLine, RiCloseLine } from "@remixicon/react";
import type { Selection } from "react-aria-components";
import { Button, buttonStyles } from "@/components/base/buttons/button";
import { Dropdown, DropdownItem, DropdownPopover, DropdownTrigger } from "@/components/base/dropdown/dropdown";
import { NumberField } from "@/components/base/number-field/number-field";
import { Select, SelectItem } from "@/components/base/select/select";
import { Tag, TagGroup } from "@/components/base/tag-group/tag-group";
import {
  BASE_METRICS,
  CAP_BUCKETS,
  SECTORS,
  UNIVERSES,
  type LiveScreener,
  type MetricKey,
  type ScreenFilters,
  type UniverseId,
} from "@/lib/mock/screener";
import { cx } from "@/utils/cx";
import { AnimatedValue } from "@/components/motion/AnimatedValue";
import { ENTER, POP, play } from "./motion";
import { EXTRA_METRICS, METRICS, parseThreshold, thresholdAria } from "./screen";
import { useScreener, type ScreenerAction } from "./ScreenerProvider";
import { CARD, CARD_TITLE, QUIET_ICON_BUTTON } from "./styles";

/** Typing pause before a threshold applies; leaving the field (or Enter, or the arrow keys) applies it at once. */
const TYPE_DELAY_MS = 200;

/** Plain numbers: no grouping, so what is typed is what is parsed. Stable, or the field would reformat. */
const THRESHOLD_FORMAT: Intl.NumberFormatOptions = { maximumFractionDigits: 2, useGrouping: false };

function keysOf<T extends string>(selection: Selection, all: readonly T[]): T[] {
  return selection === "all" ? [...all] : all.filter((k) => selection.has(k));
}

function ChipGroup<T extends string>({
  label,
  options,
  selected,
  onChange,
  help,
}: {
  label: string;
  options: readonly T[];
  selected: readonly T[];
  onChange: (value: T[]) => void;
  /** Hover text per option (live data: what a bucket or sector covers). */
  help?: Record<T, string>;
}) {
  return (
    <TagGroup
      label={label}
      selectionMode="multiple"
      selectedKeys={selected}
      onSelectionChange={(keys) => onChange(keysOf(keys, options))}
    >
      {options.map((o) => (
        // "soft": the neutral tag's tertiary fill matches the card in dark mode.
        <Tag
          key={o}
          id={o}
          textValue={o}
          color="soft"
          className="data-hovered:not-data-selected:bg-background-secondary-hover data-hovered:not-data-selected:text-text-primary"
        >
          <span title={help?.[o]}>{o}</span>
        </Tag>
      ))}
    </TagGroup>
  );
}

function ThresholdRow({
  metric,
  value,
  version,
  autoFocus,
  removeSlot,
  dispatch,
}: {
  metric: MetricKey;
  value: string;
  /** The form's version: a new one restarts the field from `value`. */
  version: number;
  autoFocus: boolean;
  /** "button" for added rows, "space" to line base rows up with them, none when no row is removable. */
  removeSlot?: "button" | "space";
  dispatch: Dispatch<ScreenerAction>;
}) {
  const m = METRICS[metric];
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  // A row just added with "Add filter" condenses into place, once.
  const rowRef = useRef<HTMLDivElement>(null);
  const entered = useRef(false);
  useLayoutEffect(() => {
    if (!autoFocus || entered.current) return;
    entered.current = true;
    play(rowRef.current, ENTER, 360);
  }, [autoFocus]);

  const apply = (text: string) => {
    clearTimeout(timer.current);
    dispatch({ type: "threshold", key: metric, value: text });
  };

  return (
    <div ref={rowRef} className="flex min-h-10 items-center gap-1.5">
      <span className="me-0.5 min-w-0 flex-1 text-body-regular text-text-primary">{m.label}</span>
      <span aria-hidden="true" className="text-body-regular text-text-tertiary">
        {m.bound === "min" ? "≥" : "≤"}
      </span>
      {/* The field keeps its own text and reports a value when it commits
          (blur, Enter, arrow keys); its input events apply typing as it goes. */}
      <div
        className="w-14 shrink-0"
        onInput={(e) => {
          const text = (e.target as HTMLInputElement).value;
          clearTimeout(timer.current);
          timer.current = setTimeout(() => apply(text), TYPE_DELAY_MS);
        }}
      >
        <NumberField
          key={version}
          size="small"
          hideSteppers
          aria-label={thresholdAria(metric)}
          placeholder="–"
          defaultValue={parseThreshold(value) ?? Number.NaN}
          step={m.step}
          formatOptions={THRESHOLD_FORMAT}
          autoFocus={autoFocus}
          onChange={(v) => {
            const next = Number.isNaN(v) ? null : v;
            if (next !== parseThreshold(value)) apply(next === null ? "" : String(next));
            else clearTimeout(timer.current);
          }}
          // The secondary surface: the field's default (tertiary) matches the card in dark mode.
          fieldClassName="bg-background-secondary-default [&_input]:text-end"
        />
      </div>
      <span aria-hidden="true" className="w-3 text-body-regular text-text-tertiary">
        {m.unit}
      </span>
      {removeSlot === "button" ? (
        <Button
          variant="ghost"
          size="xs"
          iconOnly
          leadingIcon={RiCloseLine}
          aria-label={`Remove ${m.label} filter`}
          title="Remove filter"
          className={QUIET_ICON_BUTTON}
          onClick={() => dispatch({ type: "removeThreshold", key: metric })}
        />
      ) : removeSlot === "space" ? (
        <span aria-hidden="true" className="size-6 shrink-0" />
      ) : null}
    </div>
  );
}

function AddFilter({
  thresholds,
  live,
  dispatch,
}: {
  thresholds: ScreenFilters["thresholds"];
  live: boolean;
  dispatch: Dispatch<ScreenerAction>;
}) {
  const [open, setOpen] = useState(false);
  const available = EXTRA_METRICS.filter((k) => !thresholds.some((t) => t.key === k));
  return (
    <Dropdown isOpen={open} onOpenChange={setOpen}>
      <DropdownTrigger
        isDisabled={available.length === 0}
        className={cx(buttonStyles.base, buttonStyles.size.medium, buttonStyles.variant.secondary, "w-full")}
      >
        <RiAddLine className={buttonStyles.icon.medium} aria-hidden />
        <span className={buttonStyles.label.medium}>Add filter</span>
      </DropdownTrigger>
      <DropdownPopover aria-label="Filters you can add" placement="bottom start" className="w-(--trigger-width) p-2">
        {available.map((key) => (
          <DropdownItem
            key={key}
            className="justify-between gap-3 px-2 py-1.5"
            onSelect={() => {
              dispatch({ type: "addThreshold", key });
              setOpen(false);
            }}
          >
            <span className="truncate text-body-medium text-text-primary">
              {(live && METRICS[key].liveMenuLabel) || METRICS[key].menuLabel || METRICS[key].label}
            </span>
            <span className="text-body-regular whitespace-nowrap text-text-tertiary">
              {METRICS[key].bound === "min" ? "≥" : "≤"} {METRICS[key].unit}
            </span>
          </DropdownItem>
        ))}
      </DropdownPopover>
    </Dropdown>
  );
}

function SaveButton({ name, dispatch }: { name: string; dispatch: Dispatch<ScreenerAction> }) {
  const [saved, setSaved] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);
  const shown = useRef(saved);

  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 1600);
    return () => clearTimeout(t);
  }, [saved]);

  // The check pops in beside "Saved" (the label itself cross-fades).
  useLayoutEffect(() => {
    if (shown.current === saved) return;
    shown.current = saved;
    if (saved) play(ref.current?.querySelector("svg"), POP, 200);
  }, [saved]);

  return (
    <>
      <Button
        ref={ref}
        className="w-full"
        leadingIcon={saved ? RiCheckLine : undefined}
        onClick={() => {
          dispatch({ type: "saveScreen" });
          setSaved(true);
        }}
      >
        <AnimatedValue value={saved ? "Saved" : "Save screen"} />
      </Button>
      <span className="sr-only" aria-live="polite">
        {saved ? `Saved “${name}”` : ""}
      </span>
    </>
  );
}

/** Left column: universe, size and sector chips, numeric thresholds. */
export function FiltersPanel() {
  const { state, dispatch, live } = useScreener();
  return (
    <FiltersForm
      filters={state.filters}
      formVersion={state.formVersion}
      lastAdded={state.lastAdded}
      screenName={state.screens.find((s) => s.id === state.activeId)?.name ?? "screen"}
      live={live}
      dispatch={dispatch}
    />
  );
}

type FiltersFormProps = {
  filters: ScreenFilters;
  formVersion: number;
  lastAdded: MetricKey | null;
  screenName: string;
  live: LiveScreener | null;
  dispatch: Dispatch<ScreenerAction>;
};

/** Memoised on the filters: sorting, paging and stars don't re-render the form. */
const FiltersForm = memo(function FiltersForm({
  filters,
  formVersion,
  lastAdded,
  screenName,
  live,
  dispatch,
}: FiltersFormProps) {
  const headingId = useId();
  const removable = filters.thresholds.some((t) => !BASE_METRICS.includes(t.key));

  return (
    <aside
      aria-labelledby={headingId}
      className={cx(CARD, "flex min-w-0 flex-[1_1_290px] flex-col gap-5 self-start p-5")}
    >
      <div className="flex items-center justify-between gap-2">
        <h2 id={headingId} className={CARD_TITLE}>
          Filters
        </h2>
        <Button variant="secondary" size="small" onClick={() => dispatch({ type: "reset" })}>
          Reset
        </Button>
      </div>
      <Select
        label="Universe"
        value={filters.universe}
        onChange={(key) => key && dispatch({ type: "universe", value: key as UniverseId })}
        className="w-full"
        popoverClassName="w-(--trigger-width)"
      >
        {UNIVERSES.map((u) => (
          <SelectItem key={u.value} id={u.value} textValue={u.label}>
            {u.label}
          </SelectItem>
        ))}
      </Select>
      <ChipGroup
        label="Market cap"
        options={CAP_BUCKETS}
        selected={filters.caps}
        onChange={(value) => dispatch({ type: "caps", value })}
        help={live?.capHelp}
      />
      <ChipGroup
        label="Sector"
        options={SECTORS}
        selected={filters.sectors}
        onChange={(value) => dispatch({ type: "sectors", value })}
        help={live?.sectorHelp}
      />
      <div role="group" aria-label="Thresholds" className="flex flex-col gap-1 border-t border-separator-border pt-3">
        {filters.thresholds.map((t) => (
          <ThresholdRow
            key={t.key}
            metric={t.key}
            value={t.value}
            version={formVersion}
            autoFocus={t.key === lastAdded}
            removeSlot={!removable ? undefined : BASE_METRICS.includes(t.key) ? "space" : "button"}
            dispatch={dispatch}
          />
        ))}
      </div>
      <div className="flex flex-col gap-2.5">
        <AddFilter thresholds={filters.thresholds} live={live !== null} dispatch={dispatch} />
        <SaveButton name={screenName} dispatch={dispatch} />
      </div>
    </aside>
  );
});
