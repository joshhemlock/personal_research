"use client";

import { Icon, ICONS } from "@/components/ui/Icon";
import type { CompareSeries } from "@/lib/mock/chart";
import { CHART_ICONS } from "./icons";
import { CheckRow, Popover } from "./Popover";
import { TIMEFRAMES, type Timeframe } from "./scale";
import type { ChartType, DisplayPrefs, SeriesKey, Visibility } from "./types";

type ChartToolbarProps = {
  tf: Timeframe;
  onTf: (tf: Timeframe) => void;
  type: ChartType;
  onType: (type: ChartType) => void;
  compare: readonly Pick<CompareSeries, "key" | "symbol" | "name" | "color">[];
  show: Visibility;
  onShow: (key: SeriesKey, on: boolean) => void;
  legend: boolean;
  onLegend: (on: boolean) => void;
  prefs: DisplayPrefs;
  onPrefs: (prefs: DisplayPrefs) => void;
  onSnapshot: () => void;
  fullscreen: boolean;
  onFullscreen: () => void;
};

const SEGMENT = "rounded-full transition-colors duration-150";
const ON = "bg-ink text-white";
const OFF = "bg-transparent text-ink-3 hover:text-ink";
const PILL =
  "glass-chip inline-flex h-11 items-center gap-2 rounded-full px-4 text-[14px] text-ink transition-colors hover:bg-white aria-expanded:bg-white";
const ICON_BUTTON =
  "inline-flex size-10 items-center justify-center rounded-[12px] text-ink-3 transition-colors hover:bg-[rgba(17,17,19,0.05)] hover:text-ink aria-expanded:bg-[rgba(17,17,19,0.05)]";
// Compare / Indicators drop their labels when the main column gets narrow.
const NARROW_LABEL = "@max-[860px]:sr-only";

const TYPES: { value: ChartType; label: string; icon: string }[] = [
  { value: "candles", label: "Candlestick chart", icon: CHART_ICONS.candles },
  { value: "line", label: "Line chart", icon: CHART_ICONS.line },
];

/** Time range, chart type, Compare and Indicators menus, layers toggle and chart actions. */
export function ChartToolbar(p: ChartToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div role="group" aria-label="Time range" className="glass-chip flex flex-wrap gap-[2px] rounded-full p-[3px]">
        {TIMEFRAMES.map((tf) => (
          <button
            key={tf}
            type="button"
            aria-pressed={tf === p.tf}
            onClick={() => p.onTf(tf)}
            className={`${SEGMENT} h-[38px] min-w-11 px-3 text-[14px] font-medium ${tf === p.tf ? ON : OFF}`}
          >
            {tf}
          </button>
        ))}
      </div>

      <div role="group" aria-label="Chart type" className="glass-chip flex gap-[2px] rounded-full p-[3px]">
        {TYPES.map((t) => (
          <button
            key={t.value}
            type="button"
            aria-pressed={t.value === p.type}
            aria-label={t.label}
            onClick={() => p.onType(t.value)}
            className={`${SEGMENT} inline-flex h-[38px] w-11 items-center justify-center ${t.value === p.type ? ON : OFF}`}
          >
            <Icon d={t.icon} size={19} linejoin="round" />
          </button>
        ))}
      </div>

      <Popover label="Compare" icon={CHART_ICONS.compare} buttonClassName={PILL} labelClassName={NARROW_LABEL}>
        <p className="px-3 pt-1.5 pb-1 text-[12px] text-muted">Overlay, rebased to the first bar</p>
        {p.compare.map((c) => (
          <CheckRow key={c.key} checked={p.show[c.key]} onChange={(on) => p.onShow(c.key, on)} dot={c.color}>
            <span className="font-medium">{c.symbol}</span>
            <span className="truncate text-ink-3">{c.name}</span>
          </CheckRow>
        ))}
      </Popover>

      <Popover label="Indicators" icon={CHART_ICONS.indicators} buttonClassName={PILL} labelClassName={NARROW_LABEL}>
        <CheckRow checked={p.show.sma} onChange={(on) => p.onShow("sma", on)} dot="#7FA6F2">
          <span className="font-medium">SMA 50</span>
          <span className="truncate text-ink-3">50-day average</span>
        </CheckRow>
        <CheckRow checked={p.show.volume} onChange={(on) => p.onShow("volume", on)} dot="#111113">
          <span className="font-medium">Volume</span>
        </CheckRow>
      </Popover>

      <button
        type="button"
        aria-label="Chart layers"
        aria-pressed={p.legend}
        onClick={() => p.onLegend(!p.legend)}
        className={`inline-flex size-11 items-center justify-center rounded-[12px] text-ink-2 transition-colors ${
          p.legend ? "bg-track" : "hover:bg-track"
        }`}
      >
        <Icon d={CHART_ICONS.layers} size={19} />
      </button>

      <span className="flex-1" />

      <span className="inline-flex gap-[2px] text-ink-3">
        <button type="button" aria-label="Save snapshot" onClick={p.onSnapshot} className={ICON_BUTTON}>
          <Icon d={CHART_ICONS.snapshot} size={20} linejoin="round" />
        </button>
        <button
          type="button"
          aria-label={p.fullscreen ? "Exit full screen" : "Full screen"}
          onClick={p.onFullscreen}
          className={ICON_BUTTON}
        >
          <Icon d={p.fullscreen ? CHART_ICONS.exitFullscreen : CHART_ICONS.fullscreen} size={20} linejoin="round" />
        </button>
        <Popover label="Chart settings" icon={ICONS.sliders} iconOnly iconSize={20} align="right" buttonClassName={ICON_BUTTON}>
          <CheckRow checked={p.prefs.grid} onChange={(grid) => p.onPrefs({ ...p.prefs, grid })}>
            Grid lines
          </CheckRow>
          <CheckRow checked={p.prefs.priceLine} onChange={(priceLine) => p.onPrefs({ ...p.prefs, priceLine })}>
            Last price line
          </CheckRow>
          <CheckRow checked={p.prefs.alertLine} onChange={(alertLine) => p.onPrefs({ ...p.prefs, alertLine })}>
            Alert lines
          </CheckRow>
          <p className="mt-1 border-t border-[rgba(17,17,19,0.06)] px-3 pt-2 pb-1.5 text-[12px] text-muted">
            Charts by{" "}
            <a href="https://www.tradingview.com/" target="_blank" rel="noreferrer" className="link text-ink-2">
              TradingView
            </a>
          </p>
        </Popover>
      </span>
    </div>
  );
}
