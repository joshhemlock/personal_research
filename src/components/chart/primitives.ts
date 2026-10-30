// Lightweight Charts series primitives used by the price chart.

import type {
  IChartApiBase,
  IPrimitivePaneRenderer,
  IPrimitivePaneView,
  ISeriesApi,
  ISeriesPrimitive,
  Logical,
  SeriesAttachedParameter,
  SeriesType,
  Time,
} from "lightweight-charts";

type DrawTarget = Parameters<IPrimitivePaneRenderer["draw"]>[0];

/**
 * Draws nothing; calls `onUpdate` every time the chart recomputes its views
 * (data, resize, scroll, zoom or a rescale). The HTML overlays re-measure the
 * chart's coordinates from there.
 */
export class ViewportProbe implements ISeriesPrimitive<Time> {
  constructor(private readonly onUpdate: () => void) {}

  updateAllViews() {
    this.onUpdate();
  }
}

export type DashStyle = { color: string; width: number; dash: number[] };

/**
 * A polyline through one value per bar, stroked with a round-capped dash
 * pattern (the design's dotted SMA: `stroke-dasharray: 2 4`, 1.4px). Built-in
 * line styles only offer square dots of the line width. Attach it to a series
 * on the same price scale; it hides with that series.
 */
export class DashedLine implements ISeriesPrimitive<Time> {
  private chart: IChartApiBase<Time> | null = null;
  private series: ISeriesApi<SeriesType, Time> | null = null;
  private requestUpdate: (() => void) | null = null;
  private values: readonly (number | null)[] = [];
  private readonly views: readonly IPrimitivePaneView[];

  constructor(private readonly style: DashStyle) {
    const renderer: IPrimitivePaneRenderer = { draw: (target) => this.draw(target) };
    this.views = [{ renderer: () => renderer }];
  }

  attached({ chart, series, requestUpdate }: SeriesAttachedParameter<Time>) {
    this.chart = chart;
    this.series = series;
    this.requestUpdate = requestUpdate;
  }

  detached() {
    this.chart = null;
    this.series = null;
    this.requestUpdate = null;
  }

  paneViews() {
    return this.views;
  }

  setValues(values: readonly (number | null)[]) {
    this.values = values;
    this.requestUpdate?.();
  }

  private draw(target: DrawTarget) {
    const { chart, series, values, style } = this;
    if (!chart || !series || !series.options().visible) return;
    const ts = chart.timeScale();
    const range = ts.getVisibleLogicalRange();
    if (!range) return;
    const from = Math.max(0, Math.floor(range.from) - 1);
    const to = Math.min(values.length - 1, Math.ceil(range.to) + 1);
    target.useMediaCoordinateSpace(({ context: ctx }) => {
      ctx.save();
      ctx.beginPath();
      let started = false;
      for (let i = from; i <= to; i++) {
        const v = values[i];
        if (v == null) continue;
        const x = ts.logicalToCoordinate(i as Logical);
        const y = series.priceToCoordinate(v);
        if (x === null || y === null) continue;
        if (started) ctx.lineTo(x, y);
        else ctx.moveTo(x, y);
        started = true;
      }
      ctx.setLineDash(style.dash);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = style.width;
      ctx.strokeStyle = style.color;
      ctx.stroke();
      ctx.restore();
    });
  }
}
