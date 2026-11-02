import { memo } from "react";
import type { Bar } from "@/lib/mock/chart";
import type { Crosshair } from "./crosshair";
import { visibleBars, xOf, type Geometry } from "./scale";

type VolumeStripProps = {
  bars: readonly Bar[];
  geometry: Geometry;
  /** Tallest visible bar (it fills the strip). */
  vmax: number;
  crosshair: Crosshair;
};

// Drawn in a 1000×70 box stretched over the plot width.
const W = 1000;
const H = 70;

/** Tallest volume among the bars inside the plot. */
export function visibleVolumeMax(bars: readonly Bar[], g: Geometry): number {
  const vis = visibleBars(g, bars.length);
  let vmax = 0;
  for (let i = vis.from; i <= vis.to; i++) vmax = Math.max(vmax, bars[i].v);
  return vmax || 1;
}

/**
 * Volume bars under the chart: the latest one a step darker, the one under
 * the crosshair in the strongest icon colour (a bar the crosshair moves with
 * a transform). The bars rise from the baseline when the strip first paints.
 */
export const VolumeStrip = memo(function VolumeStrip({ bars, geometry: g, vmax, crosshair: xh }: VolumeStripProps) {
  const N = bars.length;
  const vis = visibleBars(g, N);
  const bw = 0.6 * g.bx * W;
  const rect = (i: number) => {
    const x = xOf(g, i) * W - bw / 2;
    const h = (bars[i].v / vmax) * H;
    return `M${x.toFixed(2)} ${(H - h).toFixed(2)}h${bw.toFixed(2)}V${H}h${(-bw).toFixed(2)}Z`;
  };
  let rest = "";
  for (let i = vis.from; i < Math.min(vis.to + 1, N - 1); i++) rest += rect(i);
  const latest = vis.to === N - 1 ? rect(N - 1) : "";

  return (
    <div className="relative h-14">
      <div className="absolute inset-y-0 right-19 left-0 overflow-hidden [container-type:size]">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          aria-hidden="true"
          className="absolute inset-0 size-full animate-rise"
        >
          <path d={rest || "M0 0"} className="fill-foreground-icon-quaternary" />
          <path d={latest || "M0 0"} className="fill-foreground-icon-tertiary" />
        </svg>
        <span
          ref={xh.ref("volume")}
          aria-hidden="true"
          className="absolute inset-y-0 left-0 origin-bottom bg-foreground-icon-primary will-change-transform"
        />
      </div>
      <span className="absolute top-1 right-0 rounded-md bg-background-secondary-default px-1.5 py-0.5 text-caption-1-medium text-text-primary">
        <span className="sr-only">Volume </span>
        {bars[N - 1].v.toFixed(1)}M
      </span>
    </div>
  );
});
