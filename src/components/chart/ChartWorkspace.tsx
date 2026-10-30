"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { ICONS } from "@/components/ui/Icon";
import { TickerDot } from "@/components/ui/Pill";
import { num, pct } from "@/lib/format";
import type { ChartData } from "@/lib/mock/chart";
import { ChartCanvas, type ChartHandle, type ChartLine, type ChartPointer } from "./ChartCanvas";
import { ChartStage, type StageLine } from "./ChartStage";
import { ChartToolbar } from "./ChartToolbar";
import { SeriesChips } from "./SeriesChips";
import { Timeline } from "./Timeline";
import { VolumeStrip } from "./VolumeStrip";
import { FLUSH_BOTTOM } from "./layout";
import { designGeometry, pillDate, rebase, shortDate, sma, windowFor, type BarWindow, type Geometry, type Timeframe } from "./scale";
import type { ChartType, Cross, DisplayPrefs, SecurityInfo, SeriesKey, Tool, Visibility } from "./types";

type ChartWorkspaceProps = {
  security: SecurityInfo;
  data: ChartData;
  addNoteHref: string;
  /** "Oct 30, 2026 at 11:51 AM" */
  lastTick: string;
  /** Rendered last, pushed to the bottom (the open-ticker tabs). */
  children?: ReactNode;
};

// 516px at the design's 982px-tall viewport; taller windows get a taller chart.
const STAGE_HEIGHT = "h-[clamp(516px,calc(100vh-466px),880px)]";

/** Where the crosshair rests for a window (the design puts it 64% of the way in). */
const restingCross = (win: BarWindow): Cross => ({ index: win.from + Math.round((win.to - win.from + 1) * 0.64), price: null });

/**
 * The chart screen's main column: header, toolbar, price chart with its
 * overlays, series chips, volume, timeline. Owns the chart state.
 */
export function ChartWorkspace({ security, data, addNoteHref, lastTick, children }: ChartWorkspaceProps) {
  const { bars, compare } = data;
  const N = bars.length;
  const { symbol } = security;

  const [tf, setTf] = useState<Timeframe>("6M");
  const [type, setType] = useState<ChartType>("candles");
  const [show, setShow] = useState<Visibility>({ volume: true, sma: true, sector: true, market: true });
  const [legend, setLegend] = useState(true);
  const [prefs, setPrefs] = useState<DisplayPrefs>({ grid: true, priceLine: true, alertLine: true });
  const [tool, setTool] = useState<Tool>("select");
  const [watching, setWatching] = useState(true);
  const [cross, setCross] = useState<Cross>(() => restingCross(windowFor("6M", bars)));
  /** Bar under the pointer (the OHLC readout follows it); null when away. */
  const [hover, setHover] = useState<number | null>(null);
  const [measured, setMeasured] = useState<Geometry | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  const chartRef = useRef<ChartHandle>(null);

  const win = useMemo(() => windowFor(tf, bars), [tf, bars]);
  const sma50 = useMemo(() => sma(bars, 50), [bars]);
  const rebased = useMemo(() => compare.map((c) => rebase(c.values, bars, win.from)), [compare, bars, win.from]);
  const sectorOn = show.sector;
  const marketOn = show.market;
  const lines = useMemo<StageLine[]>(
    () => compare.map((c, i) => ({ ...c, rebased: rebased[i], visible: c.key === "sector" ? sectorOn : marketOn })),
    [compare, rebased, sectorOn, marketOn],
  );
  const chartLines = useMemo<ChartLine[]>(
    () => lines.map((l) => ({ key: l.key, stroke: l.stroke, width: l.width, values: l.rebased, visible: l.visible })),
    [lines],
  );
  // Until the chart reports its own coordinates (and on the server), place the
  // overlays with the same scale maths.
  const estimate = useMemo(
    () => designGeometry(bars, win, lines.filter((l) => l.visible).map((l) => l.rebased)),
    [bars, win, lines],
  );
  const g = measured ?? estimate;

  useEffect(() => {
    const main = mainRef.current;
    const onChange = () => setFullscreen(document.fullscreenElement !== null && document.fullscreenElement === main);
    document.addEventListener("fullscreenchange", onChange);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      // Leaving the page (Next keeps it alive, hidden) also leaves full screen.
      if (main && document.fullscreenElement === main) void document.exitFullscreen();
    };
  }, []);

  const changeTf = (next: Timeframe) => {
    setTf(next);
    setCross(restingCross(windowFor(next, bars)));
  };
  const setVisible = (key: SeriesKey, on: boolean) => setShow((s) => ({ ...s, [key]: on }));
  const toggle = (key: SeriesKey) => setShow((s) => ({ ...s, [key]: !s[key] }));

  const onPointer = (p: ChartPointer) => {
    if (!p) {
      setHover(null);
      return;
    }
    setHover(p.index);
    setCross({ index: p.index, price: tool === "cross" ? p.price : null });
  };

  // Keyboard: the chart is a slider over the visible bars.
  const first = Math.max(0, Math.ceil(g.from));
  const lastVisible = Math.min(N - 1, Math.floor(g.to));
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
    setCross({ index: Math.max(first, Math.min(lastVisible, next)), price: null });
  };

  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void mainRef.current?.requestFullscreen();
  };

  const bar = bars[hover ?? N - 1];
  const crossBar = bars[cross.index];
  const overlays = lines.filter((l) => l.visible).map((l) => (l.key === "market" ? l.name : l.symbol));
  const chartLabel =
    `${symbol} ${type === "candles" ? "candlestick" : "line"} chart, ${tf}, ${shortDate(bars[win.from].time)} to ${shortDate(bars[N - 1].time)}` +
    (overlays.length ? `, with ${overlays.join(" and ")} overlay${overlays.length > 1 ? "s" : ""}` : "");
  const up = security.changePct >= 0;

  return (
    <main
      ref={mainRef}
      aria-label={`${security.name} chart`}
      className={`@container flex min-w-0 flex-[999_1_640px] flex-col gap-2.5 ${FLUSH_BOTTOM} ${fullscreen ? "overflow-auto bg-shell p-4" : ""}`}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2.5">
        <span className="glass-chip inline-flex h-[46px] items-center gap-2.5 rounded-full pr-3 pl-[5px]">
          <TickerDot symbol={symbol} size={34} fontSize={15} />
          <h1 className="text-[16px] font-medium">
            {security.name} <span className="text-muted">·</span> {security.exchange}
          </h1>
          <span
            className={`inline-flex h-[22px] items-center rounded-full px-2 text-[12px] font-semibold ${
              up ? "bg-up-pill text-up-pill-text" : "bg-down-pill text-down-pill-text"
            }`}
          >
            {pct(security.changePct)}
          </span>
        </span>
        <Link
          href={addNoteHref}
          className="inline-flex h-11 items-center rounded-full bg-[#5E5E66] px-5 text-[15px] font-medium text-white transition-colors hover:bg-[#4A4A51]"
        >
          Add note
        </Link>
        <button
          type="button"
          aria-pressed={watching}
          onClick={() => setWatching((w) => !w)}
          className={`inline-flex h-11 items-center gap-2 rounded-full border px-5 text-[15px] font-medium transition-colors ${
            watching ? "border-go bg-go text-white hover:bg-[#247650]" : "border-[rgba(17,17,19,0.1)] bg-white/80 text-ink hover:bg-white"
          }`}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" fill={watching ? "#FFFFFF" : "none"} aria-hidden="true">
            <path d={ICONS.star} />
          </svg>
          {watching ? "Watching" : "Watch"}
        </button>
        <span className="pl-1 text-[15px] text-ink-2 [word-spacing:2px]">
          O {num(bar.o)} H {num(bar.h)} L {num(bar.l)} C {num(bar.c)}
        </span>
      </div>

      <ChartToolbar
        tf={tf}
        onTf={changeTf}
        type={type}
        onType={setType}
        compare={compare}
        show={show}
        onShow={setVisible}
        legend={legend}
        onLegend={setLegend}
        prefs={prefs}
        onPrefs={setPrefs}
        onSnapshot={() => chartRef.current?.snapshot(`${symbol}-${tf}.png`)}
        fullscreen={fullscreen}
        onFullscreen={toggleFullscreen}
      />

      <ChartStage
        symbol={symbol}
        bars={bars}
        geometry={g}
        cross={cross}
        lines={lines}
        smaVisible={show.sma}
        smaLast={sma50[N - 1]}
        alertLevel={data.alertLevel}
        legend={legend}
        prefs={prefs}
        tool={tool}
        onTool={setTool}
        onToggle={toggle}
        className={fullscreen ? "min-h-[360px] flex-1" : STAGE_HEIGHT}
      >
        <ChartCanvas
          bars={bars}
          sma={sma50}
          smaVisible={show.sma}
          lines={chartLines}
          window={win}
          candles={type === "candles"}
          onGeometry={setMeasured}
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
            "aria-valuetext": `${pillDate(crossBar.time)}: open ${num(crossBar.o)}, high ${num(crossBar.h)}, low ${num(crossBar.l)}, close ${num(crossBar.c)}`,
            onKeyDown: onChartKey,
          }}
        />
      </ChartStage>

      <SeriesChips symbol={symbol} compare={compare} show={show} onToggle={toggle} lastTick={lastTick} />
      {show.volume ? <VolumeStrip bars={bars} geometry={g} crossIndex={cross.index} /> : null}
      <Timeline bars={bars} geometry={g} crossIndex={cross.index} events={data.events} />
      {fullscreen ? null : children}
    </main>
  );
}
