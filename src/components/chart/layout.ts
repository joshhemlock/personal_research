// Layout classes shared by the chart page (server) and its client columns.

/**
 * This screen's frame has no bottom padding (static: `padding: 16px 16px 0`),
 * so the tabs sit near the frame's edge. The shared shell pads every side;
 * while the columns sit side by side (≥1124px), they hang into that padding.
 */
export const FLUSH_BOTTOM = "min-[1124px]:-mb-4";
