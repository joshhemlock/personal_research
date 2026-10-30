"use client";

import type { KeyboardEvent, ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import { num } from "@/lib/format";
import type { Bar, CompareSeries } from "@/lib/mock/chart";
import { CHART_ICONS } from "./icons";
import { AXIS, barsAcross, monthStarts, priceAt, priceTicks, visibleBars, xOf, yOf, type Geometry } from "./scale";
import type { Cross, DisplayPrefs, SeriesKey, Tool } from "./types";

/** A comparison index with its rebased values and visibility. */
export type StageLine = CompareSeries & { rebased: readonly number[]; visible: boolean };

type ChartStageProps = {
  symbol: string;
  bars: readonly Bar[];
  geometry: Geometry;
  cross: Cross;
  lines: readonly StageLine[];
  smaVisible: boolean;
  smaLast: number | null;
  alertLevel: number | null;
  legend: boolean;
  prefs: DisplayPrefs;
  tool: Tool;
  onTool: (tool: Tool) => void;
  onToggle: (key: SeriesKey) => void;
  /** Height classes. */
  className: string;
  /** The chart canvas (ChartCanvas). */
  children: ReactNode;
};

/** Height of an axis tag; tags closer than this are pushed apart. */
const TAG_H = 23;

const pc = (f: number) => `${(f * 100).toFixed(3)}%`;

type Tag = { key: string; y: number; label: string; value: string; bg?: string; inner?: string };

/**
 * The 516px chart area: price grid and labels, the canvas, and everything
 * drawn over it — alert and last-price lines, crosshair, legend, drawing
 * tools and the tags on the price axis.
 */
export function ChartStage({
  symbol,
  bars,
  geometry: g,
  cross,
  lines,
  smaVisible,
  smaLast,
  alertLevel,
  legend,
  prefs,
  tool,
  onTool,
  onToggle,
  className,
  children,
}: ChartStageProps) {
  const N = bars.length;
  const last = bars[N - 1];
  const crossY = yOf(g, cross.price ?? bars[cross.index].c);
  const crossX = xOf(g, cross.index);
  const inside = (y: number) => y >= 0 && y <= 1;

  const tags: Tag[] = [{ key: "last", y: yOf(g, last.c), label: symbol, value: num(last.c) }];
  for (const line of lines) {
    if (!line.visible) continue;
    const v = line.rebased[N - 1];
    tags.push({ key: line.key, y: yOf(g, v), label: line.symbol, value: num(v), bg: line.color, inner: "rgba(255,255,255,0.18)" });
  }
  const alertY = alertLevel !== null && prefs.alertLine ? yOf(g, alertLevel) : null;
  const showAlert = alertY !== null && alertY > 0 && alertY < 1;
  if (showAlert && alertLevel !== null) {
    tags.push({ key: "alert", y: alertY, label: "Alert", value: num(alertLevel), bg: "#D93C42", inner: "rgba(255,255,255,0.2)" });
  }
  const placed = spread(tags.filter((t) => inside(t.y)), TAG_H / g.height);

  // Round price levels, minus the ones a tag or the crosshair would cover.
  const covered = [...placed.map((t) => t.y), crossY];
  const ticks = priceTicks(priceAt(g, 1), priceAt(g, 0))
    .map((v) => ({ v, y: yOf(g, v) }))
    .filter((t) => t.y > 0.03 && t.y < 0.97 && !covered.some((y) => Math.abs(y - t.y) < 0.028));

  const months = barsAcross(g) > 70 ? monthStarts(bars, visibleBars(g, N)) : [];
  const lastY = yOf(g, last.c);
  const pillY = Math.min(1 - 12 / g.height, Math.max(12 / g.height, crossY));

  return (
    <div className={`relative ${className}`}>
      {ticks.map((t) => (
        <div
          key={t.v}
          className="pointer-events-none absolute inset-x-0 flex -translate-y-1/2 items-center"
          style={{ top: pc(t.y) }}
        >
          <span className={`flex-1 border-t ${prefs.grid ? "border-hairline" : "border-transparent"}`} />
          <span className="w-[76px] pl-[14px] text-[13px] text-ink-2">{num(t.v)}</span>
        </div>
      ))}

      <div className="absolute inset-y-0 left-0" style={{ right: AXIS }}>
        {prefs.grid
          ? months.map((i) => (
              <span key={i} className="pointer-events-none absolute inset-y-0 border-l border-hairline" style={{ left: pc(xOf(g, i)) }} />
            ))
          : null}

        {children}

        {showAlert ? (
          <span
            className="pointer-events-none absolute inset-x-0 border-t-[1.5px] border-dashed border-[rgba(229,72,77,0.7)]"
            style={{ top: pc(alertY) }}
          />
        ) : null}
        {prefs.priceLine && inside(lastY) ? (
          <span className="pointer-events-none absolute inset-x-0 border-t border-dotted border-[rgba(17,17,19,0.35)]" style={{ top: pc(lastY) }} />
        ) : null}
        <span className="pointer-events-none absolute inset-y-0 border-l border-dashed border-ink" style={{ left: pc(crossX) }} />
        {inside(crossY) ? (
          <>
            <span className="pointer-events-none absolute inset-x-0 border-t border-dashed border-ink" style={{ top: pc(crossY) }} />
            <span
              className="pointer-events-none absolute -mt-[9px] -ml-[9px] flex size-[18px] items-center justify-center rounded-full border-[1.5px] border-ink bg-white/75"
              style={{ left: pc(crossX), top: pc(crossY) }}
            >
              <span className="size-1 rounded-full bg-ink" />
            </span>
          </>
        ) : null}

        {legend ? (
          <div className="pointer-events-none absolute top-1.5 left-1 flex flex-col gap-1.5">
            {smaVisible && smaLast !== null ? (
              <LegendRow badge="50" color="#7FA6F2" symbol="SMA" name="50-day" value={num(smaLast)} on onToggle={() => onToggle("sma")} toggleLabel="SMA 50" />
            ) : null}
            {lines.map((l) => (
              <LegendRow
                key={l.key}
                badge={l.badge}
                color={l.visible ? l.color : "#C4C4CA"}
                symbol={l.symbol}
                name={l.name}
                value={l.last}
                change={l.change}
                changeColor={l.visible ? (l.up ? "#1A7F4E" : "#C2362D") : "#8A8A92"}
                on={l.visible}
                onToggle={() => onToggle(l.key)}
                toggleLabel={l.symbol}
              />
            ))}
          </div>
        ) : null}

        <DrawingTools tool={tool} onTool={onTool} />
      </div>

      {placed.map((t) =>
        t.key === "last" ? (
          <span
            key={t.key}
            className="pointer-events-none absolute right-0 inline-flex -translate-y-1/2 overflow-hidden rounded-md text-[12px] font-medium text-white"
            style={{ top: pc(t.y) }}
          >
            <span className="bg-tag px-1.5 py-[3px]">{t.label}</span>
            <span className="bg-ink px-[7px] py-[3px]">{t.value}</span>
          </span>
        ) : (
          <span
            key={t.key}
            className="pointer-events-none absolute right-0 inline-flex -translate-y-1/2 overflow-hidden rounded-md text-[12px] font-medium text-white"
            style={{ top: pc(t.y), background: t.bg }}
          >
            <span className="px-1.5 py-[3px]" style={{ background: t.inner }}>
              {t.label}
            </span>
            <span className="px-[7px] py-[3px]">{t.value}</span>
          </span>
        ),
      )}
      <span
        className="pointer-events-none absolute right-0 inline-flex h-6 -translate-y-1/2 items-center gap-1 rounded-full border border-ink bg-white pr-2 pl-1 text-[12px] font-medium"
        style={{ top: pc(pillY) }}
      >
        <Icon d={CHART_ICONS.crossValue} size={14} strokeWidth={1.8} />
        {num(cross.price ?? bars[cross.index].c)}
      </span>
    </div>
  );
}

/** Push tags down so none overlap (sorted top to bottom). */
function spread(tags: Tag[], gap: number): Tag[] {
  const out = [...tags].sort((a, b) => a.y - b.y);
  for (let i = 1; i < out.length; i++) {
    if (out[i].y - out[i - 1].y < gap) out[i] = { ...out[i], y: out[i - 1].y + gap };
  }
  return out;
}

type LegendRowProps = {
  badge: string;
  color: string;
  symbol: string;
  name: string;
  value: string;
  change?: string;
  changeColor?: string;
  on: boolean;
  onToggle: () => void;
  toggleLabel: string;
};

function LegendRow({ badge, color, symbol, name, value, change = "", changeColor = "#55555C", on, onToggle, toggleLabel }: LegendRowProps) {
  return (
    <div className={`flex items-center gap-2 text-[14px] whitespace-nowrap ${on ? "text-ink" : "text-[#8A8A92]"}`}>
      <span
        aria-hidden="true"
        className="inline-flex size-[22px] items-center justify-center rounded-full text-[9px] font-semibold text-white"
        style={{ background: color }}
      >
        {badge}
      </span>
      <span className="font-medium">{symbol}</span>
      {/* Narrow charts keep just the symbol and value. */}
      <span className="text-muted @max-[560px]:hidden">·</span>
      <span className="text-ink-3 @max-[560px]:hidden">{name}</span>
      <span className="font-medium">{value}</span>
      <span className="@max-[560px]:hidden" style={{ color: changeColor }}>
        {change}
      </span>
      <button
        type="button"
        aria-pressed={on}
        aria-label={`${on ? "Hide" : "Show"} ${toggleLabel}`}
        onClick={onToggle}
        className="pointer-events-auto inline-flex size-8 items-center justify-center rounded-[10px] text-[#8A8A92] transition-colors hover:bg-[rgba(17,17,19,0.05)] hover:text-ink"
      >
        <Icon d={on ? CHART_ICONS.eyeOff : CHART_ICONS.eye} size={17} linejoin="round" />
      </button>
    </div>
  );
}

const TOOLS: { value: Tool; label: string; icon: string }[] = [
  { value: "select", label: "Pointer", icon: CHART_ICONS.pointer },
  { value: "cross", label: "Crosshair", icon: CHART_ICONS.crosshair },
  { value: "line", label: "Trend line", icon: CHART_ICONS.trendLine },
  { value: "text", label: "Text note", icon: CHART_ICONS.text },
  { value: "measure", label: "Measure", icon: CHART_ICONS.measure },
  { value: "target", label: "Price target", icon: CHART_ICONS.target },
];

/** Floating frosted-glass drawing toolbar. Arrow keys move between tools. */
function DrawingTools({ tool, onTool }: { tool: Tool; onTool: (tool: Tool) => void }) {
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const buttons = Array.from(e.currentTarget.querySelectorAll("button"));
    const at = buttons.indexOf(e.target as HTMLButtonElement);
    if (at < 0) return;
    const next =
      e.key === "ArrowRight" ? (at + 1) % buttons.length
      : e.key === "ArrowLeft" ? (at - 1 + buttons.length) % buttons.length
      : e.key === "Home" ? 0
      : e.key === "End" ? buttons.length - 1
      : -1;
    if (next < 0) return;
    e.preventDefault();
    buttons[next].focus();
  };
  return (
    <div
      role="toolbar"
      aria-label="Drawing tools"
      onKeyDown={onKeyDown}
      className="absolute bottom-[18px] left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-white/85 bg-white/50 p-1.5 shadow-[0_12px_36px_-10px_rgba(17,17,19,0.22)] backdrop-blur-[18px] backdrop-saturate-[1.4] @max-[560px]:gap-0.5 @max-[560px]:p-1"
    >
      {TOOLS.map((t) => {
        const on = t.value === tool;
        return (
          <button
            key={t.value}
            type="button"
            aria-pressed={on}
            aria-label={t.label}
            title={t.label}
            tabIndex={on ? 0 : -1}
            onClick={() => onTool(t.value)}
            className={`inline-flex size-12 items-center justify-center rounded-full text-ink transition-[background-color,box-shadow] duration-150 @max-[560px]:size-10 ${
              on ? "bg-white shadow-[0_2px_10px_rgba(17,17,19,0.14)]" : "hover:bg-white/60"
            }`}
          >
            <Icon d={t.icon} size={22} strokeWidth={1.5} linejoin="round" />
          </button>
        );
      })}
    </div>
  );
}
