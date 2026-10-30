import { Icon } from "@/components/ui/Icon";
import type { CompareSeries } from "@/lib/mock/chart";
import { CHART_ICONS } from "./icons";
import type { SeriesKey, Visibility } from "./types";

type SeriesChipsProps = {
  symbol: string;
  compare: readonly Pick<CompareSeries, "key" | "symbol" | "color">[];
  show: Visibility;
  onToggle: (key: SeriesKey) => void;
  lastTick: string;
};

const CHIP = "inline-flex h-[42px] items-center gap-2 rounded-full border px-4 text-[15px]";
const ON = "glass-chip text-ink";
const OFF = "border-transparent bg-[rgba(17,17,19,0.04)] text-muted";

/** Series chips under the chart; each (but the price itself) toggles its series. */
export function SeriesChips({ symbol, compare, show, onToggle, lastTick }: SeriesChipsProps) {
  const chips: { key: SeriesKey; label: string; dot: string }[] = [
    { key: "volume", label: "Volume", dot: "#111113" },
    { key: "sma", label: "SMA 50", dot: "#7FA6F2" },
    ...compare.map((c) => ({ key: c.key, label: c.symbol, dot: c.color })),
  ];
  const chip = (c: (typeof chips)[number]) => {
    const on = show[c.key];
    return (
      <button key={c.key} type="button" aria-pressed={on} onClick={() => onToggle(c.key)} className={`${CHIP} ${on ? ON : OFF}`}>
        <span aria-hidden="true" className="size-[7px] rounded-full" style={{ background: on ? c.dot : "#C4C4CA" }} />
        {c.label}
        <Icon d={on ? CHART_ICONS.eye : CHART_ICONS.eyeOff} size={17} linejoin="round" />
      </button>
    );
  };
  return (
    <div className="flex flex-wrap items-center gap-2">
      {chip(chips[0])}
      {/* The price series itself is always shown. */}
      <span className={`${CHIP} ${ON}`}>
        <span aria-hidden="true" className="size-[7px] rounded-full bg-ink" />
        {symbol}
        <span aria-hidden="true" className="size-[17px]" />
      </span>
      {chips.slice(1).map(chip)}
      <span className="flex-1" />
      <span className="text-[12px] text-muted">Last tick {lastTick}</span>
    </div>
  );
}
