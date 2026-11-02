"use client";

import {
  ViewTransition,
  addTransitionType,
  startTransition,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CARD } from "@/components/overview/Card";
import type { ChartData } from "@/lib/mock/chart";
import { cx } from "@/utils/cx";
import { ChartBody } from "./ChartBody";
import type { ChartHandle } from "./ChartCanvas";
import { ChartHeader } from "./ChartHeader";
import { ChartToolbar } from "./ChartToolbar";
import { Crosshair } from "./crosshair";
import { STAGE_HEIGHT } from "./columns";
import { windowFor, type Timeframe } from "./scale";
import { SeriesChips } from "./SeriesChips";
import type { ChartType, DisplayPrefs, SecurityInfo, SeriesKey, Tool, Visibility } from "./types";
// The chart's own view-transition recipe (`chart-swap`).
import "./chart.css";

type ChartWorkspaceProps = {
  security: SecurityInfo;
  data: ChartData;
  addNoteHref: string;
  /** "Oct 30, 2026 at 11:51 AM" */
  lastTick: string;
  /** Credit TradingView for the chart and data (live data). */
  attribution?: boolean;
  /** Rendered last (the open-ticker tabs). */
  children?: ReactNode;
};

const STAGE_FULLSCREEN = "h-[max(20rem,calc(100dvh-17rem))]";

/** The plot cross-fades when what it shows changes (see chart.css); nothing else animates it. */
const SWAP = { "chart-swap": "chart-swap", default: "none" };

/**
 * Run a chart change as a transition tagged `chart-swap`: the plot, volume and
 * time axis cross-fade from the old picture to the new one on the compositor,
 * while the controls that caused it update in place.
 */
function swap(update: () => void) {
  startTransition(() => {
    addTransitionType("chart-swap");
    update();
  });
}

/**
 * The chart screen's main column: header, then a card with the toolbar,
 * price chart, volume, time axis and series chips. Owns the chart settings;
 * the plot's geometry and crosshair live further down (ChartBody, Crosshair)
 * so pointer moves and scrolls never re-render the controls.
 */
export function ChartWorkspace({ security, data, addNoteHref, lastTick, attribution = false, children }: ChartWorkspaceProps) {
  const { bars, compare } = data;
  const { symbol } = security;

  const [tf, setTf] = useState<Timeframe>("6M");
  const [type, setType] = useState<ChartType>("candles");
  const [show, setShow] = useState<Visibility>({ volume: true, sma: true, sector: true, market: true });
  const [legend, setLegend] = useState(true);
  const [prefs, setPrefs] = useState<DisplayPrefs>({ grid: true, priceLine: true, alertLine: true });
  const [tool, setTool] = useState<Tool>("select");
  const [fullscreen, setFullscreen] = useState(false);
  const [crosshair] = useState(() => new Crosshair());
  const mainRef = useRef<HTMLElement>(null);
  const chartRef = useRef<ChartHandle>(null);

  const win = useMemo(() => windowFor(tf, bars), [tf, bars]);

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

  const onTf = useCallback((next: Timeframe) => swap(() => setTf(next)), []);
  const onType = useCallback((next: ChartType) => swap(() => setType(next)), []);
  const onShow = useCallback((key: SeriesKey, on: boolean) => swap(() => setShow((s) => ({ ...s, [key]: on }))), []);
  const onToggle = useCallback((key: SeriesKey) => swap(() => setShow((s) => ({ ...s, [key]: !s[key] }))), []);
  const onLegend = useCallback((on: boolean) => swap(() => setLegend(on)), []);
  const onPrefs = useCallback((next: DisplayPrefs) => swap(() => setPrefs(next)), []);
  const fileName = useRef("");
  useLayoutEffect(() => {
    fileName.current = `${symbol}-${tf}.png`;
  });
  const onSnapshot = useCallback(() => chartRef.current?.snapshot(fileName.current), []);
  const onFullscreen = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void mainRef.current?.requestFullscreen();
  }, []);

  return (
    <main
      ref={mainRef}
      aria-label={`${security.name} chart`}
      className={cx("@container flex min-w-0 flex-col gap-4", fullscreen && "overflow-auto bg-background-full p-4")}
    >
      <ChartHeader security={security} latest={bars[bars.length - 1]} addNoteHref={addNoteHref} crosshair={crosshair} />

      <section aria-label="Price chart" className={cx(CARD, "flex min-w-0 flex-col gap-4 p-4 @min-[40rem]:p-5")}>
        <ChartToolbar
          tf={tf}
          onTf={onTf}
          type={type}
          onType={onType}
          compare={compare}
          show={show}
          onShow={onShow}
          legend={legend}
          onLegend={onLegend}
          prefs={prefs}
          onPrefs={onPrefs}
          onSnapshot={onSnapshot}
          fullscreen={fullscreen}
          onFullscreen={onFullscreen}
        />
        <ViewTransition update={SWAP} default="none">
          <ChartBody
            symbol={symbol}
            bars={bars}
            compare={compare}
            events={data.events}
            alertLevel={data.alertLevel}
            dayUp={security.changePct >= 0}
            tf={tf}
            win={win}
            type={type}
            show={show}
            legend={legend}
            prefs={prefs}
            tool={tool}
            onTool={setTool}
            onToggle={onToggle}
            crosshair={crosshair}
            chartRef={chartRef}
            stageClassName={fullscreen ? STAGE_FULLSCREEN : STAGE_HEIGHT}
          />
        </ViewTransition>
        <SeriesChips symbol={symbol} compare={compare} show={show} onToggle={onToggle} lastTick={lastTick} attribution={attribution} />
      </section>

      {fullscreen ? null : children}
    </main>
  );
}
