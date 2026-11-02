"use client";

import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type Ref } from "react";
import type { Bar, ChartEvents, CompareSeries } from "@/lib/mock/chart";
import { ChartCanvas, type ChartHandle, type ChartLine, type ChartPointer } from "./ChartCanvas";
import { ChartStage, type StageLine } from "./ChartStage";
import type { Crosshair, CrossPoint } from "./crosshair";
import { price } from "./format";
import { designGeometry, pillDate, rebase, shortDate, sma, visibleBars, type BarWindow, type Geometry, type Timeframe } from "./scale";
import { Timeline } from "./Timeline";
import type { ChartType, DisplayPrefs, SeriesKey, Tool, Visibility } from "./types";
import { VolumeStrip, visibleVolumeMax } from "./VolumeStrip";

type ChartBodyProps = {
  symbol: string;
  bars: readonly Bar[];
  compare: readonly CompareSeries[];
  events: ChartEvents;
  alertLevel: number | null;
  dayUp: boolean;
  tf: Timeframe;
  win: BarWindow;
  type: ChartType;
  show: Visibility;
  legend: boolean;
  prefs: DisplayPrefs;
  tool: Tool;
  onTool: (tool: Tool) => void;
  onToggle: (key: SeriesKey) => void;
  crosshair: Crosshair;
  chartRef: Ref<ChartHandle>;
  /** Height classes for the price chart. */
  stageClassName: string;
};

/** Where the crosshair rests for a window: 64% of the way in. */
const restingCross = (win: BarWindow): CrossPoint => ({ index: win.from + Math.round((win.to - win.from + 1) * 0.64), price: null });

/**
 * Price chart, volume and time axis: everything drawn from the plot geometry.
 * It owns the geometry the canvas reports and the resting crosshair, so a
 * scroll or a keyboard step re-renders only this part; the pointer moves the
 * crosshair without rendering at all.
 */
export const ChartBody = memo(function ChartBody({
  symbol,
  bars,
  compare,
  events,
  alertLevel,
  dayUp,
  tf,
  win,
  type,
  show,
  legend,
  prefs,
  tool,
  onTool,
  onToggle,
  crosshair: xh,
  chartRef,
  stageClassName,
}: ChartBodyProps) {
  const N = bars.length;
  const sma50 = useMemo(() => sma(bars, 50), [bars]);
  const rebased = useMemo(() => compare.map((c) => rebase(c.values, bars, win.from)), [compare, bars, win.from]);
  const sectorOn = show.sector;
  const marketOn = show.market;
  const lines = useMemo<StageLine[]>(
    () => compare.map((c, i) => ({ ...c, rebased: rebased[i], visible: c.key === "sector" ? sectorOn : marketOn })),
    [compare, rebased, sectorOn, marketOn],
  );
  const chartLines = useMemo<ChartLine[]>(
    () => lines.map((l) => ({ key: l.key, width: l.width, values: l.rebased, visible: l.visible })),
    [lines],
  );

  // The canvas reports its exact geometry after it draws. A report belongs to
  // the window and overlays it was drawn with (`scale`); until a report for
  // the current one arrives (first paint, or the frame a range changes) the
  // overlays use the same scale maths at the last measured size.
  const scale = `${win.from}:${win.to}:${lines.map((l) => (l.visible ? l.key : "")).join()}`;
  const scaleRef = useRef(scale);
  useLayoutEffect(() => {
    scaleRef.current = scale;
  });
  const [measured, setMeasured] = useState<{ scale: string; g: Geometry } | null>(null);
  const onGeometry = useCallback((g: Geometry) => setMeasured({ scale: scaleRef.current, g }), []);
  const estimate = useMemo(
    () =>
      designGeometry(
        bars,
        win,
        lines.filter((l) => l.visible).map((l) => l.rebased),
        measured ? { width: measured.g.width, height: measured.g.height } : undefined,
      ),
    [bars, win, lines, measured],
  );
  const g = measured && measured.scale === scale ? measured.g : estimate;
  const vmax = useMemo(() => visibleVolumeMax(bars, g), [bars, g]);

  // Resting crosshair: 64% into the window until the pointer or the keyboard
  // moves it; a new range starts it over.
  const [rest, setRest] = useState<{ tf: Timeframe; at: CrossPoint } | null>(null);
  const cross = rest && rest.tf === tf ? rest.at : restingCross(win);
  const [focused, setFocused] = useState(false);

  // Hand the controller this commit's geometry and resting point (before paint).
  useLayoutEffect(() => {
    xh.sync(bars, g, vmax, cross, focused);
  });
  useEffect(() => () => xh.dispose(), [xh]);

  const freePrice = tool === "cross";
  const onPointer = useCallback(
    (p: ChartPointer) => {
      if (p) {
        xh.hover({ index: p.index, price: freePrice ? p.price : null });
        return;
      }
      // The pointer left: the crosshair stays where it was.
      const last = xh.pointer;
      xh.hover(null);
      if (last) setRest({ tf, at: last });
    },
    [xh, freePrice, tf],
  );
  const jump = useCallback((index: number) => setRest({ tf, at: { index, price: null } }), [tf]);

  // Keyboard: the chart is a slider over the visible bars.
  const { from: first, to: lastVisible } = visibleBars(g, N);
  const onChartKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 5 : 1;
    const next =
      e.key === "ArrowLeft" || e.key === "ArrowDown" ? cross.index - step
      : e.key === "ArrowRight" || e.key === "ArrowUp" ? cross.index + step
      : e.key === "Home" ? first
      : e.key === "End" ? lastVisible
      : null;
    if (next === null) return;
    e.preventDefault();
    setRest({ tf, at: { index: Math.max(first, Math.min(lastVisible, next)), price: null } });
  };

  const crossBar = bars[cross.index];
  const overlays = lines.filter((l) => l.visible).map((l) => (l.key === "market" ? l.name : l.symbol));
  const chartLabel =
    `${symbol} ${type === "candles" ? "candlestick" : "line"} chart, ${tf}, ${shortDate(bars[win.from].time)} to ${shortDate(bars[N - 1].time)}` +
    (overlays.length ? `, with ${overlays.join(" and ")} overlay${overlays.length > 1 ? "s" : ""}` : "");

  return (
    <div className="flex flex-col gap-1">
      <ChartStage
        symbol={symbol}
        bars={bars}
        geometry={g}
        lines={lines}
        smaVisible={show.sma}
        smaLast={sma50[N - 1]}
        alertLevel={alertLevel}
        dayUp={dayUp}
        legend={legend}
        prefs={prefs}
        tool={tool}
        onTool={onTool}
        onToggle={onToggle}
        crosshair={xh}
        className={stageClassName}
      >
        <ChartCanvas
          bars={bars}
          sma={sma50}
          smaVisible={show.sma}
          lines={chartLines}
          window={win}
          candles={type === "candles"}
          onGeometry={onGeometry}
          onPointer={onPointer}
          handleRef={chartRef}
          className={tool === "select" ? "cursor-default" : "cursor-crosshair"}
          hostProps={{
            role: "slider",
            tabIndex: 0,
            "aria-label": chartLabel,
            "aria-valuemin": first,
            "aria-valuemax": lastVisible,
            "aria-valuenow": cross.index,
            "aria-valuetext": `${pillDate(crossBar.time)}: open ${price(crossBar.o)}, high ${price(crossBar.h)}, low ${price(crossBar.l)}, close ${price(crossBar.c)}`,
            onKeyDown: onChartKey,
            onFocus: () => setFocused(true),
            onBlur: () => setFocused(false),
          }}
        />
      </ChartStage>
      {show.volume ? <VolumeStrip bars={bars} geometry={g} vmax={vmax} crosshair={xh} /> : null}
      <Timeline bars={bars} geometry={g} events={events} crosshair={xh} onJump={jump} />
    </div>
  );
});
