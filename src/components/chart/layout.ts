// Layout classes shared by the chart page (server) and its client columns.

/**
 * This screen's frame has no bottom padding (static: `padding: 16px 16px 0`),
 * so the tabs sit near the frame's edge. The shared shell pads every side;
 * while the columns sit side by side (`split` and up) they hang into that
 * padding. Below `split` the right column moves under the chart.
 */
export const FLUSH_BOTTOM = "split:-mb-4";

/** Right column: one stack beside the chart, a row of panels under it below `split`. */
export const ASIDE =
  "grid min-w-0 flex-[1_1_330px] grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] content-start gap-3 max-split:basis-full split:pb-4";
