"use client";

import { memo, useMemo, type CSSProperties, type ReactNode } from "react";
import {
  RiCrosshair2Line,
  RiCursorLine,
  RiEyeLine,
  RiEyeOffLine,
  RiFocus3Line,
  RiPencilLine,
  RiRulerLine,
  RiText,
  type RemixiconComponentType,
} from "@remixicon/react";
import { Button } from "@/components/base/buttons/button";
import { Chip } from "@/components/base/badges/chip";
import { SegmentedControl, SegmentedControlItem } from "@/components/base/segmented-control/segmented-control";
import { Tooltip, TooltipTrigger } from "@/components/base/tooltip/tooltip";
import type { Bar, CompareSeries } from "@/lib/mock/chart";
import { cx } from "@/utils/cx";
import type { Crosshair } from "./crosshair";
import { price } from "./format";
import { barsAcross, monthStarts, priceAt, priceTicks, visibleBars, xOf, yOf, type Geometry } from "./scale";
import { COMPARE_CHIP, SERIES_FILL } from "./tokens";
import type { DisplayPrefs, SeriesKey, Tool } from "./types";

/** A comparison index with its rebased values and visibility. */
export type StageLine = CompareSeries & { rebased: readonly number[]; visible: boolean };

type ChartStageProps = {
  symbol: string;
  bars: readonly Bar[];
  geometry: Geometry;
  lines: readonly StageLine[];
  smaVisible: boolean;
  smaLast: number | null;
  alertLevel: number | null;
  /** Today's move, for the colour of the last-price tag. */
  dayUp: boolean;
  legend: boolean;
  prefs: DisplayPrefs;
  tool: Tool;
  onTool: (tool: Tool) => void;
  onToggle: (key: SeriesKey) => void;
  crosshair: Crosshair;
  /** Height classes. */
  className: string;
  /** The chart canvas (ChartCanvas). */
  children: ReactNode;
};

/** Height of an axis tag plus a hairline; tags closer than this are pushed apart. */
const TAG_H = 26;

// Overlays are placed with transforms in container units (the plot and the
// stage are size containers), so they line up on the server render too and
// moving one never triggers layout.
const atY = (y: number): CSSProperties => ({ transform: `translate3d(0, calc(${y} * 100cqh - 50%), 0)` });
const lineAtY = (y: number): CSSProperties => ({ transform: `translate3d(0, calc(${y} * 100cqh), 0)` });
const lineAtX = (x: number): CSSProperties => ({ transform: `translate3d(calc(${x} * 100cqw), 0, 0)` });

type Tag = { key: string; y: number; label: string; value: string; color: "lime" | "rose" | "gray" | "purple" | "alert" };

const inside = (y: number) => y >= 0 && y <= 1;

/**
 * The chart area: price grid and labels, the canvas, and everything drawn
 * over it — alert and last-price lines, the crosshair (moved by `crosshair`,
 * never by a render), legend, drawing tools and the tags on the price axis.
 * The plot is the left part; the price labels sit in a 76px gutter (right-19).
 * Each layer is memoised on what it draws, so a change only re-renders the
 * layers it touches (a scroll: grid and tags; a tool: the toolbar).
 */
export function ChartStage({
  symbol,
  bars,
  geometry: g,
  lines,
  smaVisible,
  smaLast,
  alertLevel,
  dayUp,
  legend,
  prefs,
  tool,
  onTool,
  onToggle,
  crosshair: xh,
  className,
  children,
}: ChartStageProps) {
  const last = bars[bars.length - 1];
  const alertY = alertLevel !== null && prefs.alertLine ? yOf(g, alertLevel) : null;
  const showAlert = alertY !== null && alertY > 0 && alertY < 1;

  const placed = useMemo(() => {
    const tags: Tag[] = [{ key: "last", y: yOf(g, last.c), label: symbol, value: price(last.c), color: dayUp ? "lime" : "rose" }];
    for (const line of lines) {
      if (!line.visible) continue;
      const v = line.rebased[line.rebased.length - 1];
      tags.push({ key: line.key, y: yOf(g, v), label: line.symbol, value: price(v), color: COMPARE_CHIP[line.key] });
    }
    if (showAlert && alertLevel !== null) tags.push({ key: "alert", y: alertY, label: "Alert", value: price(alertLevel), color: "alert" });
    return spread(tags.filter((t) => inside(t.y)), TAG_H / g.height);
  }, [g, last, symbol, dayUp, lines, showAlert, alertLevel, alertY]);

  return (
    <div className={cx("relative [container-type:size]", className)}>
      <PriceGrid geometry={g} grid={prefs.grid} placed={placed} />

      <div className="absolute inset-y-0 right-19 left-0 [container-type:size]">
        <MonthGrid bars={bars} geometry={g} grid={prefs.grid} />
        {children}
        <PlotLines alertY={showAlert ? alertY : null} lastY={prefs.priceLine ? yOf(g, last.c) : null} />
        <CrosshairLines crosshair={xh} />
        {legend ? <Legend smaVisible={smaVisible} smaLast={smaLast} lines={lines} onToggle={onToggle} /> : null}
        <DrawingTools tool={tool} onTool={onTool} />
      </div>

      <AxisTags placed={placed} />
      <CrosshairPrice crosshair={xh} />
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

/** Round price levels across the plot, labelled in the gutter (minus those a tag covers). */
const PriceGrid = memo(function PriceGrid({ geometry: g, grid, placed }: { geometry: Geometry; grid: boolean; placed: readonly Tag[] }) {
  const ticks = priceTicks(priceAt(g, 1), priceAt(g, 0))
    .map((v) => ({ v, y: yOf(g, v) }))
    .filter((t) => t.y > 0.03 && t.y < 0.97 && !placed.some((p) => Math.abs(p.y - t.y) < 0.028));
  return ticks.map((t) => (
    <div key={t.v} className="pointer-events-none absolute inset-x-0 top-0 flex items-center" style={atY(t.y)}>
      <span className={cx("flex-1 border-t", grid ? "border-separator-border-strong" : "border-transparent")} />
      <span className="w-19 ps-3.5 text-caption-1-regular text-text-secondary">{price(t.v)}</span>
    </div>
  ));
});

/** A hairline at each month start on long ranges. */
const MonthGrid = memo(function MonthGrid({ bars, geometry: g, grid }: { bars: readonly Bar[]; geometry: Geometry; grid: boolean }) {
  if (!grid || barsAcross(g) <= 70) return null;
  return monthStarts(bars, visibleBars(g, bars.length)).map((i) => (
    <span
      key={i}
      className="pointer-events-none absolute inset-y-0 left-0 border-l border-separator-border-strong"
      style={lineAtX(xOf(g, i))}
    />
  ));
});

/** The alert level (dashed, alert token) and the last price (dotted). */
const PlotLines = memo(function PlotLines({ alertY, lastY }: { alertY: number | null; lastY: number | null }) {
  return (
    <>
      {alertY !== null ? (
        <span
          className="pointer-events-none absolute inset-x-0 top-0 border-t-[1.5px] border-dashed border-chart-alert opacity-70"
          style={lineAtY(alertY)}
        />
      ) : null}
      {lastY !== null && inside(lastY) ? (
        <span
          className="pointer-events-none absolute inset-x-0 top-0 border-t border-dotted border-foreground-icon-tertiary"
          style={lineAtY(lastY)}
        />
      ) : null}
    </>
  );
});

/** Crosshair lines and dot: rendered once, moved by the Crosshair controller. */
const CrosshairLines = memo(function CrosshairLines({ crosshair: xh }: { crosshair: Crosshair }) {
  return (
    <>
      <span
        ref={xh.ref("plotX")}
        className="pointer-events-none absolute inset-y-0 left-0 border-l border-dashed border-foreground-icon-secondary opacity-0 will-change-transform"
      />
      <span
        ref={xh.ref("plotY")}
        className="pointer-events-none absolute inset-x-0 top-0 border-t border-dashed border-foreground-icon-secondary opacity-0 will-change-transform"
      />
      <span
        ref={xh.ref("dot")}
        className="pointer-events-none absolute top-0 left-0 flex size-4.5 items-center justify-center rounded-full border-[1.5px] border-foreground-icon-primary bg-background-primary-default/75 opacity-0 will-change-transform"
      >
        <span className="size-1 rounded-full bg-foreground-icon-primary" />
      </span>
    </>
  );
});

/** The crosshair's price on the axis: a BoardUI tooltip-style pill. */
const CrosshairPrice = memo(function CrosshairPrice({ crosshair: xh }: { crosshair: Crosshair }) {
  return (
    <span
      ref={xh.ref("priceTag")}
      className="pointer-events-none absolute top-0 right-0 z-10 inline-flex items-center gap-1 rounded-md border border-border-button-default bg-background-primary-default px-1.5 py-0.5 text-caption-1-medium text-text-primary opacity-0 shadow-xs will-change-transform"
    >
      <RiCrosshair2Line aria-hidden className="size-3.5 text-foreground-icon-secondary" />
      <span ref={xh.ref("priceText")} />
    </span>
  );
});

/** Last price, comparison lines and the alert level, tagged on the axis. */
const AxisTags = memo(function AxisTags({ placed }: { placed: readonly Tag[] }) {
  return placed.map((t) => (
    <span key={t.key} className="pointer-events-none absolute top-0 right-0" style={atY(t.y)}>
      {t.color === "alert" ? (
        <span className="inline-flex items-center gap-1 rounded-md border border-border-button-default bg-background-primary-default px-1.5 py-0.5 text-caption-1-medium text-chart-alert">
          {t.label}
          <span className="text-text-primary">{t.value}</span>
        </span>
      ) : (
        <Chip variant="caption" color={t.color} className="gap-1 py-0.5 ring-2 ring-background-primary-default">
          <span className="opacity-80">{t.label}</span>
          {t.value}
        </Chip>
      )}
    </span>
  ));
});

type LegendProps = {
  smaVisible: boolean;
  smaLast: number | null;
  lines: readonly StageLine[];
  onToggle: (key: SeriesKey) => void;
};

/** Overlay values in the plot's corner, each with a show / hide toggle. */
const Legend = memo(function Legend({ smaVisible, smaLast, lines, onToggle }: LegendProps) {
  return (
    <div className="pointer-events-none absolute top-1.5 left-1.5 flex flex-col items-start gap-1">
      {smaVisible && smaLast !== null ? (
        <LegendRow series="sma" symbol="SMA" name="50-day" value={price(smaLast)} on onToggle={onToggle} toggleLabel="SMA 50" />
      ) : null}
      {lines.map((l) => (
        <LegendRow
          key={l.key}
          series={l.key}
          symbol={l.symbol}
          name={l.name}
          value={l.last}
          change={l.change}
          up={l.up}
          on={l.visible}
          onToggle={onToggle}
          toggleLabel={l.symbol}
        />
      ))}
    </div>
  );
});

type LegendRowProps = {
  series: SeriesKey;
  symbol: string;
  name: string;
  value: string;
  change?: string;
  up?: boolean;
  on: boolean;
  onToggle: (key: SeriesKey) => void;
  toggleLabel: string;
};

function LegendRow({ series, symbol, name, value, change, up, on, onToggle, toggleLabel }: LegendRowProps) {
  return (
    <div
      className={cx(
        "flex items-center gap-1.5 rounded-lg bg-background-primary-default/80 py-0.5 ps-2 pe-0.5 text-body-2-regular whitespace-nowrap transition-colors duration-150",
        on ? "text-text-primary" : "text-text-tertiary",
      )}
    >
      <span
        aria-hidden="true"
        className={cx("size-2 rounded-full transition-colors duration-150", on ? SERIES_FILL[series] : "bg-foreground-icon-quaternary")}
      />
      <span className="text-body-2-semibold">{symbol}</span>
      {/* Narrow charts keep just the symbol and value. */}
      <span className="text-text-secondary @max-[35rem]:hidden">{name}</span>
      <span className="text-body-2-medium">{value}</span>
      {change ? (
        <span className={cx("@max-[35rem]:hidden", !on ? "text-text-tertiary" : up ? "text-text-positive" : "text-text-negative")}>
          {change}
        </span>
      ) : null}
      <Button
        variant="ghost"
        size="xs"
        iconOnly
        leadingIcon={on ? RiEyeLine : RiEyeOffLine}
        aria-pressed={on}
        aria-label={`${on ? "Hide" : "Show"} ${toggleLabel}`}
        onClick={() => onToggle(series)}
        // Quiet until hovered: the legend sits on the plot.
        className="pointer-events-auto bg-transparent text-foreground-icon-tertiary hover:bg-background-primary-hover hover:text-foreground-icon-primary active:bg-background-primary-active"
      />
    </div>
  );
}

const TOOLS: { value: Tool; label: string; icon: RemixiconComponentType }[] = [
  { value: "select", label: "Pointer", icon: RiCursorLine },
  { value: "cross", label: "Crosshair", icon: RiCrosshair2Line },
  { value: "line", label: "Trend line", icon: RiPencilLine },
  { value: "text", label: "Text note", icon: RiText },
  { value: "measure", label: "Measure", icon: RiRulerLine },
  { value: "target", label: "Price target", icon: RiFocus3Line },
];

/**
 * Floating drawing toolbar: BoardUI's segmented control (its thumb slides to
 * the picked tool) on a raised card surface. Arrow keys move between tools.
 */
const DrawingTools = memo(function DrawingTools({ tool, onTool }: { tool: Tool; onTool: (tool: Tool) => void }) {
  return (
    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-2xl border border-border-button-default bg-background-primary-default p-1 shadow-lg">
      <SegmentedControl
        aria-label="Drawing tools"
        selectedKeys={[tool]}
        onSelectionChange={(keys) => {
          const next = [...keys][0] as Tool | undefined;
          if (next) onTool(next);
        }}
        className="rounded-xl"
      >
        {TOOLS.map(({ value, label, icon: Icon }) => (
          <TooltipTrigger key={value}>
            <SegmentedControlItem id={value} aria-label={label} className="p-1.5 @max-[35rem]:p-1">
              <Icon aria-hidden className="size-5" />
            </SegmentedControlItem>
            <Tooltip placement="top">{label}</Tooltip>
          </TooltipTrigger>
        ))}
      </SegmentedControl>
    </div>
  );
});
