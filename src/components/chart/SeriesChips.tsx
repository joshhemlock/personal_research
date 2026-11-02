import { memo } from "react";
import { RiEyeLine, RiEyeOffLine } from "@remixicon/react";
import { LinkButton } from "@/components/base/buttons/link-button";
import type { CompareSeries } from "@/lib/mock/chart";
import { cx } from "@/utils/cx";
import { SERIES_FILL } from "./tokens";
import type { SeriesKey, Visibility } from "./types";

type SeriesChipsProps = {
  symbol: string;
  compare: readonly Pick<CompareSeries, "key" | "symbol">[];
  show: Visibility;
  onToggle: (key: SeriesKey) => void;
  lastTick: string;
  /** Credit TradingView for the chart and data (live data). */
  attribution?: boolean;
};

// BoardUI's small secondary button, as a toggle: hidden series step back to
// the secondary surface with tertiary text.
const CHIP = cx(
  "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 text-body-medium shadow-xs select-none",
  "transition-[background-color,border-color,color,box-shadow] duration-150 ease",
  "outline-none focus-visible:ring-2 focus-visible:ring-border-focus-ring focus-visible:ring-offset-2",
);
const ON = "border-border-button-default bg-background-primary-default text-text-primary hover:border-border-button-hover hover:bg-background-primary-hover active:bg-background-primary-active";
const OFF = "border-transparent bg-background-secondary-default text-text-tertiary shadow-none hover:bg-background-secondary-hover hover:text-text-secondary";

/** Series chips under the chart; each (but the price itself) shows or hides its series. */
export const SeriesChips = memo(function SeriesChips({ symbol, compare, show, onToggle, lastTick, attribution = false }: SeriesChipsProps) {
  const chips: { key: SeriesKey; label: string }[] = [
    { key: "volume", label: "Volume" },
    { key: "sma", label: "SMA 50" },
    ...compare.map((c) => ({ key: c.key, label: c.symbol })),
  ];
  const chip = ({ key, label }: (typeof chips)[number]) => {
    const on = show[key];
    const Eye = on ? RiEyeLine : RiEyeOffLine;
    return (
      <button key={key} type="button" aria-pressed={on} onClick={() => onToggle(key)} className={cx(CHIP, on ? ON : OFF)}>
        <span
          aria-hidden="true"
          className={cx("size-2 rounded-full transition-colors duration-150", on ? SERIES_FILL[key] : "bg-foreground-icon-quaternary")}
        />
        {label}
        <Eye aria-hidden className={cx("size-4", on ? "text-foreground-icon-secondary" : "text-foreground-icon-tertiary")} />
      </button>
    );
  };
  return (
    <div className="flex flex-wrap items-center gap-2">
      {chip(chips[0])}
      {/* The price series itself is always shown. */}
      <span className={cx(CHIP, "cursor-default border-border-button-default bg-background-primary-default text-text-primary")}>
        <span aria-hidden="true" className="size-2 rounded-full bg-foreground-icon-primary" />
        {symbol}
      </span>
      {chips.slice(1).map(chip)}
      <span className="flex-1" />
      <span className="text-caption-1-regular text-text-tertiary">
        {attribution ? (
          <>
            Chart and data:{" "}
            <LinkButton href="https://www.tradingview.com/" target="_blank" rel="noreferrer" variant="secondary" size="xs">
              TradingView
            </LinkButton>
            {" · "}
          </>
        ) : null}
        Last tick {lastTick}
      </span>
    </div>
  );
});
