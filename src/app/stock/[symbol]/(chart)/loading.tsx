import { ViewTransition } from "react";
import { Skeleton, SkeletonText } from "@/components/base/skeleton/skeleton";
import { CHART_ASIDE, CHART_COLUMNS, STAGE_HEIGHT } from "@/components/chart/columns";
import { CARD } from "@/components/overview/Card";
import { cx } from "@/utils/cx";

/** A skeleton bar centred in a line box of the text it stands in for. */
function Line({ className, bar }: { className: string; bar: string }) {
  return (
    <span className={cx("flex items-center", className)}>
      <Skeleton shape="text" className={bar} />
    </span>
  );
}

/** A side-column card: title and actions, then lines. */
function PanelSkeleton({ lines }: { lines: number }) {
  return (
    <div className={cx(CARD, "flex flex-col gap-4 p-5")}>
      <div className="flex items-center justify-between gap-3">
        <Line className="h-6.5" bar="h-4.5 w-24" />
        <div className="flex gap-2">
          <Skeleton className="size-8 rounded-2lg" />
          <Skeleton className="size-8 rounded-2lg" />
        </div>
      </div>
      <SkeletonText lines={lines} />
    </div>
  );
}

/**
 * The chart screen while its data is on the way (a ticker opened from search
 * waits for TradingView): the screen's own layout in BoardUI skeletons,
 * inside the persistent shell. It lives in the (chart) route group so
 * /stock/[symbol]/financials doesn't inherit it. When the chart arrives the
 * skeleton blurs out (skeleton-exit) as the screen condenses in (AppShell's
 * page-enter).
 */
export default function ChartLoading() {
  return (
    <ViewTransition exit="skeleton-exit" default="none">
      {/* AppShell's column row, then the page's own container. */}
      <div aria-busy="true" aria-label="Loading chart" className="flex min-w-0 flex-wrap items-stretch gap-4">
        <div className="@container min-w-0 flex-1 basis-full">
          <div className={CHART_COLUMNS}>
            <div className="flex min-w-0 flex-col gap-4">
              {/* Header: avatar, name and readout; Add note and Watch. */}
              <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton shape="circle" className="size-9" />
                  <div className="flex flex-col gap-0.5">
                    <Line className="h-8" bar="h-6 w-64" />
                    <Line className="h-5" bar="h-3.5 w-72 max-w-full" />
                  </div>
                </div>
                <div className="flex gap-2.5">
                  <Skeleton className="h-9 w-28 rounded-2lg" />
                  <Skeleton className="h-9 w-30 rounded-2lg" />
                </div>
              </div>

              <div className={cx(CARD, "flex flex-col gap-4 p-4 @min-[40rem]:p-5")}>
                {/* Toolbar */}
                <div className="flex flex-wrap items-center gap-2">
                  <Skeleton className="h-9 w-64 rounded-2lg" />
                  <Skeleton className="h-9 w-20 rounded-2lg" />
                  <Skeleton className="h-9 w-32 rounded-2lg" />
                  <Skeleton className="h-9 w-34 rounded-2lg" />
                  <span className="flex-1" />
                  <Skeleton className="h-9 w-30 rounded-2lg" />
                </div>
                {/* Price chart, volume, time axis */}
                <div className="flex flex-col gap-1">
                  <Skeleton className={cx(STAGE_HEIGHT, "w-full rounded-2xl")} />
                  <Skeleton className="h-14 w-full rounded-xl" />
                  <Line className="h-10" bar="h-3 w-full" />
                </div>
                {/* Series chips */}
                <div className="flex flex-wrap gap-2">
                  {["w-24", "w-20", "w-24", "w-18", "w-18"].map((w, i) => (
                    <Skeleton key={i} className={cx("h-8 rounded-lg", w)} />
                  ))}
                </div>
              </div>

              {/* Open tickers */}
              <div className="flex gap-2">
                {["w-8", "w-28", "w-28", "w-28", "w-24"].map((w, i) => (
                  <Skeleton key={i} className={cx("h-8 rounded-2lg", w)} />
                ))}
              </div>
            </div>

            <div className={CHART_ASIDE}>
              <PanelSkeleton lines={6} />
              <PanelSkeleton lines={4} />
              <PanelSkeleton lines={5} />
            </div>
          </div>
        </div>
      </div>
    </ViewTransition>
  );
}
