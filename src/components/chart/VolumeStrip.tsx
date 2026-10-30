import type { Bar } from "@/lib/mock/chart";
import { AXIS, visibleBars, xOf, type Geometry } from "./scale";

type VolumeStripProps = {
  bars: readonly Bar[];
  geometry: Geometry;
  /** Bar under the crosshair, drawn in ink. */
  crossIndex: number;
};

// Drawn in a 1000×70 box stretched over the plot width, like the design.
const W = 1000;
const H = 70;
const MAX_BAR = 62;

/** Volume bars under the chart: the crosshair bar in ink, the latest in dark gray. */
export function VolumeStrip({ bars, geometry: g, crossIndex }: VolumeStripProps) {
  const N = bars.length;
  const vis = visibleBars(g, N);
  let vmax = 0;
  for (let i = vis.from; i <= vis.to; i++) vmax = Math.max(vmax, bars[i].v);
  const bw = 0.6 * g.bx * W;
  const rect = (i: number) => {
    const x = xOf(g, i) * W - bw / 2;
    const h = (bars[i].v / (vmax || 1)) * MAX_BAR;
    return `M${x.toFixed(2)} ${(H - h).toFixed(2)}h${bw.toFixed(2)}V${H}h${(-bw).toFixed(2)}Z`;
  };
  let rest = "";
  for (let i = vis.from; i <= vis.to; i++) if (i !== N - 1 && i !== crossIndex) rest += rect(i);
  const latest = vis.to === N - 1 ? rect(N - 1) : "";
  const cross = crossIndex !== N - 1 && crossIndex >= vis.from && crossIndex <= vis.to ? rect(crossIndex) : "";

  return (
    <div className="relative h-14">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        aria-hidden="true"
        className="absolute top-0 left-0 h-14"
        style={{ width: `calc(100% - ${AXIS}px)` }}
      >
        <path d={rest || "M0 0"} fill="#D4D4D9" />
        <path d={latest || "M0 0"} fill="#8E8E96" />
        <path d={cross || "M0 0"} fill="#111113" />
      </svg>
      <span className="absolute top-2.5 right-0 rounded-md bg-ink px-[7px] py-[3px] text-[12px] font-medium text-white">
        <span className="sr-only">Volume </span>
        {bars[N - 1].v.toFixed(1)}M
      </span>
    </div>
  );
}
