"use client";

import {
  useEffect,
  useEffectEvent,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  type HTMLAttributes,
  type Ref,
} from "react";
import {
  AreaSeries,
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  LineSeries,
  LineType,
  createChart,
  type IChartApi,
  type IRange,
  type ISeriesApi,
  type LineWidth,
  type Logical,
  type MouseEventParams,
  type Time,
} from "lightweight-charts";
import type { Bar, CompareKey } from "@/lib/mock/chart";
import { cx } from "@/utils/cx";
import { DashedLine, ViewportProbe } from "./primitives";
import { PAD_ABOVE, PAD_BELOW, type BarWindow, type Geometry } from "./scale";
import { observeTheme, readPalette, rgba, type Palette } from "./tokens";

/** A rebased comparison line. */
export type ChartLine = { key: CompareKey; width: number; values: readonly number[]; visible: boolean };

/** Bar under the pointer and the price at its height; null when it leaves the chart. */
export type ChartPointer = { index: number; price: number } | null;

export type ChartHandle = {
  /** Download the chart as a PNG. */
  snapshot: (fileName: string) => void;
};

type ChartCanvasProps = {
  bars: readonly Bar[];
  sma: readonly (number | null)[];
  smaVisible: boolean;
  lines: readonly ChartLine[];
  /** Bars to fit across the plot. */
  window: BarWindow;
  candles: boolean;
  onGeometry: (g: Geometry) => void;
  onPointer: (p: ChartPointer) => void;
  handleRef?: Ref<ChartHandle>;
  /** Attributes for the focusable chart element (role, labels, key handling). */
  hostProps?: HTMLAttributes<HTMLDivElement>;
  className?: string;
};

type Api = {
  chart: IChartApi;
  candles: ISeriesApi<"Candlestick">;
  area: ISeriesApi<"Area">;
  sma: ISeriesApi<"Line">;
  smaLine: DashedLine;
  lines: Record<CompareKey, ISeriesApi<"Line">>;
};

type Box = { width: number; height: number };

const CLEAR = "rgba(0, 0, 0, 0)";

// The library types line widths as whole pixels, but its renderer takes any
// number; the comparison lines are stroked at 1.6 and 1.8px.
const width = (w: number) => w as LineWidth;

// Overlay series never show their own labels or markers.
const QUIET = { priceScaleId: "right", lastValueVisible: false, priceLineVisible: false, crosshairMarkerVisible: false } as const;

/**
 * Canvas size and offset inside the plot box. The library only draws on even
 * pixel sizes and centres bar i at (i + 0.5) × spacing − 1px; pick the even
 * width and whole-pixel shift that put bar centres within half a pixel of
 * the overlays' grid, (i + 0.5) × box / bars.
 */
function canvasFit(box: Box) {
  const w = Math.round(box.width);
  const odd = w % 2 === 1;
  return { width: odd ? w + 1 : w, height: 2 * Math.floor(box.height / 2), shift: odd ? 0 : 1 };
}

/**
 * Room above and below the data (12% and 18% of its range). The library maps
 * prices onto height − 1 px; a pixel off the bottom margin puts every price
 * where the overlays' scale does.
 */
function scaleMargins(paneHeight: number) {
  const span = 1 + PAD_ABOVE + PAD_BELOW;
  const bottom = PAD_BELOW / span;
  return { top: PAD_ABOVE / span, bottom: paneHeight > 20 ? bottom - 1 / paneHeight : bottom };
}

/**
 * The price chart itself: TradingView Lightweight Charts drawing candles (or a
 * line), the comparison lines and the dotted SMA on a transparent background,
 * in the theme's chart tokens (re-read when the theme flips). Axes, grid,
 * crosshair and labels are HTML overlays drawn by the parent from the
 * geometry this component reports through `onGeometry`.
 *
 * Every change to what is drawn is applied in a layout effect, inside the
 * same commit as the overlays, so a view transition captures them together.
 */
export function ChartCanvas({
  bars,
  sma,
  smaVisible,
  lines,
  window: win,
  candles,
  onGeometry,
  onPointer,
  handleRef,
  hostProps,
  className,
}: ChartCanvasProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<Api | null>(null);
  const paletteRef = useRef<Palette | null>(null);
  const shiftRef = useRef(0);
  /** The range we last fitted; any other range means the user scrolled or zoomed. */
  const fittedRef = useRef<IRange<number> | null>(null);
  const reported = useRef<Geometry | null>(null);

  const report = useEffectEvent(() => {
    const api = apiRef.current;
    const host = hostRef.current;
    const g = api && host && measure(api, host.getBoundingClientRect(), shiftRef.current);
    if (!g || (reported.current && sameGeometry(reported.current, g))) return;
    reported.current = g;
    onGeometry(g);
  });

  /** Show the window's bars across the plot at exactly box width ÷ bars spacing. */
  const fit = useEffectEvent(() => {
    const api = apiRef.current;
    const host = hostRef.current;
    if (!api || !host) return;
    const box = host.getBoundingClientRect();
    if (!box.width) return;
    const n = win.to - win.from + 1;
    const range = { from: win.to + 1 - (n * canvasFit(box).width) / box.width, to: win.to };
    fittedRef.current = range;
    api.chart.timeScale().setVisibleLogicalRange(range);
  });

  const move = useEffectEvent((p: MouseEventParams<Time>) => {
    const api = apiRef.current;
    if (!p.point) {
      // The library also clears its crosshair on internal updates; only a
      // pointer that really left the chart counts as leaving.
      if (!hostRef.current?.matches(":hover")) onPointer(null);
      return;
    }
    const price = api ? api.candles.coordinateToPrice(p.point.y) : null;
    if (p.logical === undefined || price === null) return;
    onPointer({ index: Math.max(0, Math.min(bars.length - 1, Math.round(p.logical))), price });
  });

  // ---------------------------------------------------------------- appliers

  const applyBars = useEffectEvent(() => {
    const api = apiRef.current;
    if (!api) return;
    api.candles.setData(bars.map((b) => ({ time: b.time, open: b.o, high: b.h, low: b.l, close: b.c })));
    api.area.setData(bars.map((b) => ({ time: b.time, value: b.c })));
  });

  const applySma = useEffectEvent(() => {
    const api = apiRef.current;
    if (!api) return;
    const points: { time: string; value: number }[] = [];
    sma.forEach((value, i) => {
      if (value !== null) points.push({ time: bars[i].time, value });
    });
    api.sma.setData(points);
    api.smaLine.setValues(sma);
  });

  const applySmaVisible = useEffectEvent(() => {
    apiRef.current?.sma.applyOptions({ visible: smaVisible });
  });

  const applyLines = useEffectEvent(() => {
    const api = apiRef.current;
    if (!api) return;
    for (const line of lines) {
      api.lines[line.key].applyOptions({ lineWidth: width(line.width), visible: line.visible });
      api.lines[line.key].setData(line.values.map((value, i) => ({ time: bars[i].time, value })));
    }
    // A symbol without a sector index has only the market line.
    for (const key of Object.keys(api.lines) as CompareKey[]) {
      if (!lines.some((l) => l.key === key)) api.lines[key].setData([]);
    }
  });

  /** Colours from the theme tokens, for the current mode, chart type and window. */
  const applyColors = useEffectEvent(() => {
    const api = apiRef.current;
    const p = (paletteRef.current ??= readPalette());
    if (!api) return;
    api.chart.applyOptions({ layout: { textColor: rgba(p.text), fontFamily: p.font } });
    api.candles.applyOptions(
      candles
        ? { upColor: rgba(p.up), downColor: rgba(p.down), wickUpColor: rgba(p.up), wickDownColor: rgba(p.down), wickVisible: true }
        : { upColor: CLEAR, downColor: CLEAR, wickVisible: false },
    );
    // Line mode follows the sparklines: the gain or loss token over the window.
    const rising = bars[win.to].c >= bars[win.from].c;
    const tone = rising ? p.positive : p.negative;
    api.area.applyOptions({
      visible: !candles,
      lineColor: rgba(tone),
      topColor: rgba(tone, 0.18),
      bottomColor: rgba(tone, 0),
    });
    api.smaLine.setColor(rgba(p.sma));
    api.lines.sector.applyOptions({ color: rgba(p.sector) });
    api.lines.market.applyOptions({ color: rgba(p.market) });
  });

  // Create the chart once; the effects below feed it data and options.
  useEffect(() => {
    const host = hostRef.current;
    const container = canvasRef.current;
    if (!host || !container) return;

    const place = (box: Box) => {
      const c = canvasFit(box);
      shiftRef.current = c.shift;
      container.style.transform = `translateX(${c.shift}px)`;
      return c;
    };
    const size = place(host.getBoundingClientRect());
    const chart = createChart(container, {
      width: size.width,
      height: size.height,
      layout: {
        background: { type: ColorType.Solid, color: CLEAR },
        // The TradingView credit sits under the chart and in the settings menu.
        attributionLogo: false,
      },
      grid: { vertLines: { visible: false }, horzLines: { visible: false } },
      leftPriceScale: { visible: false },
      rightPriceScale: { visible: false, scaleMargins: scaleMargins(size.height) },
      timeScale: {
        visible: false,
        rightOffset: 0,
        fixLeftEdge: true,
        fixRightEdge: true,
        lockVisibleTimeRangeOnResize: true,
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { visible: false, labelVisible: false },
        horzLine: { visible: false, labelVisible: false },
      },
      handleScroll: { mouseWheel: false, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: false },
      handleScale: { mouseWheel: false, pinch: true, axisPressedMouseMove: false, axisDoubleClickReset: false },
    });

    // Added bottom to top: comparison lines, SMA, line-mode area, candles.
    const sector = chart.addSeries(LineSeries, { ...QUIET, lineType: LineType.Simple });
    const market = chart.addSeries(LineSeries, { ...QUIET, lineType: LineType.Simple });
    const smaSeries = chart.addSeries(LineSeries, { ...QUIET, lineVisible: false, autoscaleInfoProvider: () => null });
    const smaLine = new DashedLine({ color: CLEAR, width: 1.4, dash: [2, 4] });
    smaSeries.attachPrimitive(smaLine);
    const area = chart.addSeries(AreaSeries, {
      ...QUIET,
      visible: false,
      lineWidth: width(1.8),
      // Candles stay on the scale (transparent) in line mode.
      autoscaleInfoProvider: () => null,
    });
    const candleSeries = chart.addSeries(CandlestickSeries, {
      priceScaleId: "right",
      lastValueVisible: false,
      priceLineVisible: false,
      borderVisible: false,
    });
    candleSeries.attachPrimitive(new ViewportProbe(() => report()));
    apiRef.current = { chart, candles: candleSeries, area, sma: smaSeries, smaLine, lines: { sector, market } };

    paletteRef.current = readPalette();
    applyBars();
    applySma();
    applyLines();
    applyColors();
    applySmaVisible();
    fit();

    const onMove = (p: MouseEventParams<Time>) => move(p);
    const onDoubleClick = () => fit();
    chart.subscribeCrosshairMove(onMove);
    chart.subscribeDblClick(onDoubleClick);

    // Light / dark: re-read the tokens and recolour.
    const stopTheme = observeTheme(() => {
      paletteRef.current = readPalette();
      applyColors();
    });

    // Grow with the page. Keep the exact fit unless the user has scrolled or zoomed.
    const resize = new ResizeObserver(([entry]) => {
      // Zero while the page is hidden (Next keeps visited pages alive).
      if (entry.contentRect.width < 4 || entry.contentRect.height < 4) return;
      const c = place(entry.contentRect);
      const fitted = fittedRef.current;
      const current = chart.timeScale().getVisibleLogicalRange();
      chart.priceScale("right").applyOptions({ scaleMargins: scaleMargins(c.height) });
      chart.resize(c.width, c.height, true);
      if (fitted && current && Math.abs(current.from - fitted.from) < 1e-6 && Math.abs(current.to - fitted.to) < 1e-6) fit();
      report();
    });
    resize.observe(host);

    // Fade the plot in once its first frame is drawn. The attribute stays
    // when Next hides the page (Activity), so a page shown again (which
    // re-creates the chart) doesn't fade in a second time.
    const reveal = requestAnimationFrame(() => container.setAttribute("data-ready", ""));

    return () => {
      cancelAnimationFrame(reveal);
      stopTheme();
      resize.disconnect();
      chart.unsubscribeCrosshairMove(onMove);
      chart.unsubscribeDblClick(onDoubleClick);
      chart.remove();
      apiRef.current = null;
      fittedRef.current = null;
      reported.current = null;
    };
  }, []);

  useLayoutEffect(() => applyBars(), [bars]);
  useLayoutEffect(() => applySma(), [bars, sma]);
  useLayoutEffect(() => applySmaVisible(), [smaVisible]);
  useLayoutEffect(() => applyLines(), [bars, lines]);
  useLayoutEffect(() => applyColors(), [candles, bars, win.from, win.to]);
  useLayoutEffect(() => fit(), [win.from, win.to]);

  useImperativeHandle(
    handleRef,
    () => ({
      snapshot(fileName) {
        const api = apiRef.current;
        if (!api) return;
        const shot = api.chart.takeScreenshot(true);
        const canvas = document.createElement("canvas");
        canvas.width = shot.width;
        canvas.height = shot.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.fillStyle = rgba((paletteRef.current ??= readPalette()).surface);
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(shot, 0, 0);
        canvas.toBlob((blob) => {
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = fileName;
          a.click();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        }, "image/png");
      },
    }),
    [],
  );

  // `isolate`: the library z-indexes its canvases; keep them under the overlays.
  return (
    <div
      ref={hostRef}
      {...hostProps}
      className={cx(
        "absolute inset-0 isolate rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-border-focus-ring",
        className,
      )}
    >
      <div
        ref={canvasRef}
        className="absolute top-0 left-0 opacity-0 transition-opacity duration-300 ease-out data-ready:opacity-100"
      />
    </div>
  );
}

/**
 * Linear maps from bar index and price to fractions of the plot box, read
 * from the chart's coordinate APIs (the canvas sits `shift` px into the box).
 */
function measure({ chart, candles }: Api, box: Box, shift: number): Geometry | null {
  const ts = chart.timeScale();
  const { width, height } = box;
  const range = ts.getVisibleLogicalRange();
  const x0 = ts.logicalToCoordinate(0 as Logical);
  const x1 = ts.logicalToCoordinate(1 as Logical);
  const y0 = candles.priceToCoordinate(0);
  const y1 = candles.priceToCoordinate(100);
  if (!width || !height || !range || x0 === null || x1 === null || y0 === null || y1 === null) return null;
  if (x1 === x0 || y1 === y0) return null;
  return {
    ax: (x0 + shift) / width,
    bx: (x1 - x0) / width,
    ay: y0 / height,
    by: (y1 - y0) / 100 / height,
    from: range.from,
    to: range.to,
    width,
    height,
  };
}

function sameGeometry(a: Geometry, b: Geometry): boolean {
  return (
    a.width === b.width &&
    a.height === b.height &&
    a.from === b.from &&
    a.to === b.to &&
    Math.abs(a.ax - b.ax) < 1e-9 &&
    Math.abs(a.bx - b.bx) < 1e-9 &&
    Math.abs(a.ay - b.ay) < 1e-9 &&
    Math.abs(a.by - b.by) < 1e-12
  );
}
