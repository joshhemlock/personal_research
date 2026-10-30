// Stroke icon paths (24×24 grid) used by the chart screen, copied from
// design/static/02-stock-chart.html. Render with <Icon d={…} />.

import { ICONS } from "@/components/ui/Icon";

export const CHART_ICONS = {
  candles: ICONS.chart,
  line: "M4 17l5-6 4 3 7-8",
  compare: "M4 17l5-5 4 3 7-8M15 7h5v5",
  indicators: "M4 12h3l2-6 4 12 2-6h5",
  layers: "M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01",
  snapshot: "M4 5h16v14H4zM12 9a3 3 0 1 0 0 6a3 3 0 1 0 0-6z",
  fullscreen: "M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5",
  exitFullscreen: "M9 4v5H4M15 4v5h5M20 15h-5v5M4 15h5v5",
  eye: "M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12s-3.5 6.5-9.5 6.5S2.5 12 2.5 12zM12 9.5a2.5 2.5 0 1 0 0 5a2.5 2.5 0 1 0 0-5z",
  eyeOff:
    "M3 3l18 18M10.6 6.1A9.6 9.6 0 0 1 12 6c6 0 9.5 6 9.5 6a16 16 0 0 1-2.6 3.3M6.4 7.6A16 16 0 0 0 2.5 12s3.5 6 9.5 6a9 9 0 0 0 4.2-1M9.9 10a2.5 2.5 0 0 0 3.5 3.6",
  crossValue: "M12 4a8 8 0 1 0 0 16a8 8 0 1 0 0-16zM12 8v8M8 12h8",
  external: "M14 4h6v6M20 4l-8 8M18 14v6H4V6h6",
  sort: "M7 4v16M4 17l3 3 3-3M14 6h6M14 12h4M14 18h2",
  edit: "M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4",
  // drawing tools
  pointer: "M6 3.5l12 8.6-5.4 1.1 3.1 6.4-2.4 1.2-3.1-6.4L6 18.2z",
  crosshair: "M12 3v5M12 16v5M3 12h5M16 12h5M12 9.5a2.5 2.5 0 1 0 0 5a2.5 2.5 0 1 0 0-5z",
  trendLine: "M6.5 17.5L17.5 6.5M4 17.5a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0M15 6.5a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0",
  text: "M5 7V5h14v2M12 5v14M9 19h6",
  measure: "M4 8h16M4 12h16M4 16h16M6 20h3",
  target: "M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18zM12 8a4 4 0 1 0 0 8a4 4 0 1 0 0-8z",
} as const;
