// Layout classes shared by the chart page and its loading skeleton.

/** Chart column and side column, side by side once the page column is 66rem wide. */
export const CHART_COLUMNS = "grid items-start gap-4 @min-[66rem]:grid-cols-[minmax(0,1fr)_20rem]";

/** Side column: one stack beside the chart; under it, as many cards across as fit. */
export const CHART_ASIDE =
  "grid min-w-0 grid-cols-[repeat(auto-fit,minmax(min(18rem,100%),1fr))] items-start gap-4 @min-[66rem]:grid-cols-1";

/** The price chart's height: what the viewport leaves, 320–832px. */
export const STAGE_HEIGHT = "h-[clamp(20rem,calc(100dvh-29rem),52rem)]";
