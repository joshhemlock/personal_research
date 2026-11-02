"use client";

import { memo, type CSSProperties } from "react";
import { Button as AriaButton, Focusable } from "react-aria-components";
import { RiNotification3Line } from "@remixicon/react";
import { Tooltip, TooltipTrigger } from "@/components/base/tooltip/tooltip";
import type { Bar, ChartEvents } from "@/lib/mock/chart";
import { cx } from "@/utils/cx";
import type { Crosshair } from "./crosshair";
import { MONTHS, barsAcross, monthOf, monthStarts, shortDate, visibleBars, xOf, yearOf, type Geometry } from "./scale";

type TimelineProps = {
  bars: readonly Bar[];
  geometry: Geometry;
  events: ChartEvents;
  crosshair: Crosshair;
  /** Move the crosshair to a bar (a marker was pressed). */
  onJump: (index: number) => void;
};

const mod = (a: number, b: number) => ((a % b) + b) % b;

/** Centred on a fraction of the axis width (the axis is an inline-size container). */
const atX = (x: number): CSSProperties => ({ transform: `translate3d(calc(${x} * 100cqw - 50%), 0, 0)` });

type Marker = { key: string; index: number; x: number; letter: "E" | "D"; label: string };

// Event markers: BoardUI status chip pairs (earnings amber-yellow, dividends blue).
const MARKER = {
  E: "bg-status-yellow-background text-status-yellow-text",
  D: "bg-status-blue-background text-status-blue-text",
} as const;

const MARKER_BUTTON =
  "flex size-5.5 cursor-pointer items-center justify-center rounded-full text-caption-2-semibold outline-none transition-[filter] duration-150 hover:brightness-95 focus-visible:ring-2 focus-visible:ring-border-focus-ring";

/**
 * Time axis under the volume bars: day ticks, month (or date) labels,
 * earnings / dividend / alert markers (each moves the crosshair to its bar)
 * and the crosshair's date.
 */
export const Timeline = memo(function Timeline({ bars, geometry: g, events, crosshair: xh, onJump }: TimelineProps) {
  const N = bars.length;
  const vis = visibleBars(g, N);
  const n = barsAcross(g);
  const inView = (i: number) => i >= g.from - 0.5 && i <= g.to + 0.5;

  // A tick per bar (thinned on long ranges), a taller one every fifth.
  const every = Math.max(1, Math.round(n / 120));
  const anchor = N - n;
  let ticks = "";
  for (let i = vis.from; i <= vis.to; i++) {
    const k = i - anchor;
    if (mod(k, every) !== 0) continue;
    ticks += `M${(xOf(g, i) * 1000).toFixed(1)} ${mod(k, every * 5) === 0 ? 2 : 5}V10`;
  }

  // Short ranges label six dates; longer ones label month starts (the year
  // in January).
  type Label = { key: number; x: number; text: string; year: boolean };
  let labels: Label[] = [];
  if (n <= 70) {
    for (let j = 0; j < 6; j++) {
      const i = vis.from + Math.round(((j + 0.5) * (n - 1)) / 6);
      if (i <= vis.to) labels.push({ key: i, x: xOf(g, i), text: shortDate(bars[i].time), year: false });
    }
  } else {
    for (const i of monthStarts(bars, vis)) {
      const m = monthOf(bars[i].time);
      labels.push({ key: i, x: xOf(g, i), text: m === 0 ? String(yearOf(bars[i].time)) : MONTHS[m], year: m === 0 });
    }
  }

  const markers: Marker[] = [
    ...events.earnings
      .filter(inView)
      .map((i) => ({ key: `e${i}`, index: i, x: xOf(g, i), letter: "E" as const, label: `Earnings · ${shortDate(bars[i].time)}` })),
    ...events.dividends
      .filter(inView)
      .map((i) => ({ key: `d${i}`, index: i, x: xOf(g, i), letter: "D" as const, label: `Dividend · ${shortDate(bars[i].time)}` })),
  ];
  const bells = events.alerts
    .filter(inView)
    .map((i) => ({ key: `a${i}`, index: i, x: xOf(g, i), label: `Alert fired · ${shortDate(bars[i].time)}` }));
  // A label gives way to anything it would touch: a 22px marker or a bell.
  // Half a label is ~3.7px a character.
  const touches = (l: { x: number; text: string }, x: number, halfWidth: number) =>
    Math.abs(x - l.x) * g.width < l.text.length * 3.7 + 2 + halfWidth;
  labels = labels.filter((l) => !markers.some((m) => touches(l, m.x, 13)) && !bells.some((b) => touches(l, b.x, 10)));
  // Then keep them at least 56px apart, years first.
  const kept: Label[] = [];
  for (const l of [...labels.filter((l) => l.year), ...labels.filter((l) => !l.year)]) {
    if (kept.every((k) => Math.abs(k.x - l.x) * g.width >= 56)) kept.push(l);
  }
  labels = kept;

  return (
    <div className="relative h-10 border-b border-separator-border-strong">
      <div className="absolute inset-y-0 right-19 left-0 [container-type:size]">
        <svg viewBox="0 0 1000 10" preserveAspectRatio="none" aria-hidden="true" className="absolute inset-x-0 bottom-0 h-2 w-full">
          <path
            d={ticks || "M0 0"}
            fill="none"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
            className="stroke-foreground-icon-quaternary"
          />
        </svg>
        <span
          ref={xh.ref("axisX")}
          className="pointer-events-none absolute inset-y-0 left-0 border-l border-dashed border-foreground-icon-secondary opacity-0 will-change-transform"
        />
        {labels.map((l) => (
          <span
            key={l.key}
            className={cx(
              "absolute top-2 left-0 text-caption-1-regular whitespace-nowrap",
              l.year ? "text-text-primary" : "text-text-secondary",
            )}
            style={atX(l.x)}
          >
            {l.text}
          </span>
        ))}
        {markers.map((m) => (
          <span key={m.key} className="absolute top-1.5 left-0" style={atX(m.x)}>
            <TooltipTrigger>
              <AriaButton aria-label={m.label} onPress={() => onJump(m.index)} className={cx(MARKER_BUTTON, MARKER[m.letter])}>
                <span aria-hidden="true">{m.letter}</span>
              </AriaButton>
              <Tooltip>{m.label}</Tooltip>
            </TooltipTrigger>
          </span>
        ))}
        {bells.map((b) => (
          <span key={b.key} className="absolute top-1.5 left-0" style={atX(b.x)}>
            <TooltipTrigger>
              <AriaButton
                aria-label={b.label}
                onPress={() => onJump(b.index)}
                className={cx(MARKER_BUTTON, "text-foreground-icon-tertiary hover:text-foreground-icon-primary")}
              >
                <RiNotification3Line aria-hidden className="size-4" />
              </AriaButton>
              <Tooltip>{b.label}</Tooltip>
            </TooltipTrigger>
          </span>
        ))}
        <span
          ref={xh.ref("dateTag")}
          className="pointer-events-none absolute top-1.5 left-0 z-10 rounded-md border border-border-button-default bg-background-primary-default px-2 py-0.5 text-caption-1-medium whitespace-nowrap text-text-primary opacity-0 shadow-xs will-change-transform"
        >
          <span ref={xh.ref("dateText")} />
        </span>
      </div>
      {events.next ? (
        // The next report or ex-dividend date is past the last bar: it sits
        // in the price-axis gutter, outlined.
        <span className="absolute top-1.5 right-0 flex w-19 items-center justify-end gap-1">
          <TooltipTrigger>
            <Focusable>
              <span
                role="img"
                tabIndex={0}
                aria-label={events.next.label}
                className="flex items-center gap-1 rounded-full text-caption-1-regular whitespace-nowrap text-text-secondary outline-none focus-visible:ring-2 focus-visible:ring-border-focus-ring"
              >
                <span
                  aria-hidden="true"
                  className={cx(
                    "flex size-5.5 items-center justify-center rounded-full border border-dashed text-caption-2-semibold",
                    events.next.letter === "E" ? "border-status-yellow-text text-status-yellow-text" : "border-status-blue-text text-status-blue-text",
                  )}
                >
                  {events.next.letter}
                </span>
                <span aria-hidden="true">{events.next.date}</span>
              </span>
            </Focusable>
            <Tooltip>{events.next.label}</Tooltip>
          </TooltipTrigger>
        </span>
      ) : null}
    </div>
  );
});
