import { Icon } from "@/components/ui/Icon";
import type { Bar, ChartEvents } from "@/lib/mock/chart";
import {
  AXIS,
  MONTHS,
  barsAcross,
  monthOf,
  monthStarts,
  pillDate,
  shortDate,
  visibleBars,
  xOf,
  yearOf,
  type Geometry,
} from "./scale";

type TimelineProps = {
  bars: readonly Bar[];
  geometry: Geometry;
  crossIndex: number;
  events: ChartEvents;
};

const pc = (f: number) => `${(f * 100).toFixed(3)}%`;
const mod = (a: number, b: number) => ((a % b) + b) % b;

type Marker = { key: string; x: number; letter: "E" | "D"; label: string };

/**
 * Time axis under the volume bars: day ticks, month (or date) labels,
 * earnings / dividend / alert markers and the crosshair date.
 */
export function Timeline({ bars, geometry: g, crossIndex, events }: TimelineProps) {
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
    ...events.earnings.filter(inView).map((i) => ({ key: `e${i}`, x: xOf(g, i), letter: "E" as const, label: `Earnings · ${shortDate(bars[i].time)}` })),
    ...events.dividends.filter(inView).map((i) => ({ key: `d${i}`, x: xOf(g, i), letter: "D" as const, label: `Dividend · ${shortDate(bars[i].time)}` })),
  ];
  const bells = events.alerts.filter(inView).map((i) => ({ key: `a${i}`, x: xOf(g, i), label: `Alert fired · ${shortDate(bars[i].time)}` }));
  const crossX = xOf(g, crossIndex);
  // A label gives way to anything it would touch: a 22px marker, a bell, or
  // the date pill (about 100px wide). Half a label is ~3.7px a character.
  const touches = (l: { x: number; text: string }, x: number, halfWidth: number) =>
    Math.abs(x - l.x) * g.width < l.text.length * 3.7 + 2 + halfWidth;
  labels = labels.filter(
    (l) => !markers.some((m) => touches(l, m.x, 13)) && !bells.some((b) => touches(l, b.x, 10)) && !touches(l, crossX, 54),
  );
  // Then keep them at least 56px apart, years first.
  const kept: Label[] = [];
  for (const l of [...labels.filter((l) => l.year), ...labels.filter((l) => !l.year)]) {
    if (kept.every((k) => Math.abs(k.x - l.x) * g.width >= 56)) kept.push(l);
  }
  labels = kept;
  // Keep the date pill inside the axis.
  const half = 52 / g.width;
  const pillX = Math.min(1 - half, Math.max(half, crossX));

  return (
    <div className="relative h-[39px] border-b border-[rgba(17,17,19,0.08)]" style={{ marginRight: AXIS }}>
      <svg viewBox="0 0 1000 10" preserveAspectRatio="none" aria-hidden="true" className="absolute inset-x-0 bottom-0 h-2 w-full">
        <path d={ticks || "M0 0"} fill="none" stroke="#B4B4BA" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      </svg>
      <span className="pointer-events-none absolute inset-y-0 border-l border-dashed border-ink" style={{ left: pc(crossX) }} />
      {labels.map((l) => (
        <span key={l.key} className="absolute top-1.5 -translate-x-1/2 text-[13px] whitespace-nowrap text-ink-2" style={{ left: pc(l.x) }}>
          {l.text}
        </span>
      ))}
      {markers.map((m) => (
        <span
          key={m.key}
          role="img"
          aria-label={m.label}
          title={m.label}
          className={`absolute top-1 flex size-[22px] -translate-x-1/2 items-center justify-center rounded-full text-[11px] font-semibold ${
            m.letter === "E" ? "bg-amber text-[#3D2400]" : "bg-blue text-white"
          }`}
          style={{ left: pc(m.x) }}
        >
          <span aria-hidden="true">{m.letter}</span>
        </span>
      ))}
      {bells.map((b) => (
        <span
          key={b.key}
          role="img"
          aria-label={b.label}
          title={b.label}
          className="absolute top-1.5 flex -translate-x-1/2 text-[#8A8A92]"
          style={{ left: pc(b.x) }}
        >
          <Icon name="bell" size={17} linejoin="round" />
        </span>
      ))}
      <span
        className="pointer-events-none absolute top-1 -translate-x-1/2 rounded-full bg-ink px-2.5 py-[3px] text-[12px] font-medium whitespace-nowrap text-white"
        style={{ left: pc(pillX) }}
      >
        {pillDate(bars[crossIndex].time)}
      </span>
    </div>
  );
}
