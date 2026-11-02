import { ViewTransition } from "react";
import { Skeleton } from "@/components/base/skeleton/skeleton";
import { CARD } from "@/components/overview/Card";
import { INDEX_GRID } from "@/components/overview/IndexTiles";
import { cx } from "@/utils/cx";

/**
 * The Overview while its data loads: the screen's own layout in BoardUI
 * skeletons, inside the persistent shell (the sidebar and top bar stay).
 * It lives in the (overview) route group so other screens don't inherit it.
 * When the screen arrives the skeleton blurs out (skeleton-exit) as the
 * content condenses in (AppShell's page-enter).
 */
export default function OverviewLoading() {
  return (
    <ViewTransition exit="skeleton-exit" default="none">
      <div aria-busy="true" aria-label="Loading overview" className="flex min-w-0 flex-wrap items-stretch gap-4">
        <div className="@container min-w-0 flex-1 basis-full">
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
              <div className="flex min-w-0 flex-col gap-0.5">
                <Line className="h-8.5" bar="h-6 w-56" />
                <Line className="h-5" bar="h-3.5 w-104 max-w-full" />
              </div>
              <div className="flex gap-2.5">
                <Skeleton className="h-9 w-30 rounded-2lg" />
                <Skeleton className="h-9 w-28 rounded-2lg" />
              </div>
            </div>

            <div className="@container">
              <div className={cx("grid w-full grid-cols-2 gap-4", INDEX_GRID)}>
                {Array.from({ length: 5 }, (_, i) => (
                  <div
                    key={i}
                    className="flex min-h-[132px] min-w-0 flex-col justify-between gap-3 rounded-2xl bg-background-secondary-default p-4"
                  >
                    <Skeleton className="h-8 w-full" />
                    <div className="flex flex-col gap-0.5">
                      <Line className="h-5" bar="h-3.5 w-20" />
                      <Line className="h-8.5" bar="h-6 w-32" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid items-start gap-4 @min-[75rem]:grid-cols-[minmax(0,1fr)_21rem]">
              <div className="flex min-w-0 flex-col gap-4">
                <div className={cx(CARD, "flex flex-col overflow-hidden")}>
                  <div className="flex items-center gap-4 px-5 pt-5 pb-4">
                    <Line className="h-6.5" bar="h-4.5 w-24" />
                    <Skeleton className="h-9 w-72 max-w-[50%] rounded-2lg" />
                  </div>
                  <div className="h-8 border-y border-separator-border bg-background-secondary-default" />
                  {Array.from({ length: 8 }, (_, i) => (
                    <div
                      key={i}
                      className="flex h-12 items-center gap-6 border-b border-separator-border px-5 last:border-b-0"
                    >
                      <div className="flex w-24 flex-col gap-1.5">
                        <Skeleton shape="text" className="h-3 w-12" />
                        <Skeleton shape="text" className="h-2.5 w-16" />
                      </div>
                      <Skeleton shape="text" className="ms-auto h-3 w-14" />
                      <Skeleton shape="text" className="h-5 w-16" />
                      <Skeleton shape="text" className="h-5 w-24 max-md:hidden" />
                      <Skeleton shape="text" className="h-3 w-32 max-lg:hidden" />
                      <Skeleton shape="text" className="h-3 w-12 max-xl:hidden" />
                    </div>
                  ))}
                </div>
                <div className={cx(CARD, "flex flex-col gap-4 p-5")}>
                  <div className="flex items-center justify-between gap-3">
                    <Line className="h-6.5" bar="h-4.5 w-44" />
                    <Skeleton className="h-9 w-32 rounded-2lg" />
                  </div>
                  <div className="@container flex flex-wrap gap-2">
                    {Array.from({ length: 11 }, (_, i) => (
                      <Skeleton
                        key={i}
                        className="min-h-16 grow basis-[calc(50%-8px)] @md:basis-[calc(33.333%-8px)] @2xl:basis-[calc(16.666%-8px)]"
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid min-w-0 grid-cols-[repeat(auto-fit,minmax(min(18rem,100%),1fr))] items-start gap-4">
                <SideCard rows={8} row="h-7" />
                <SideCard rows={4} row="h-16" />
                <SideCard rows={4} row="h-12" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </ViewTransition>
  );
}

/** A text line's box with a shorter bar inside, so the skeleton keeps the text's height. */
function Line({ className, bar }: { className: string; bar: string }) {
  return (
    <span className={cx("flex items-center", className)}>
      <Skeleton shape="text" className={bar} />
    </span>
  );
}

/** One of the side column's cards: a title row, then a list. */
function SideCard({ rows, row }: { rows: number; row: string }) {
  return (
    <div className={cx(CARD, "flex min-w-0 flex-col gap-3 p-5")}>
      <div className="flex items-center justify-between gap-3">
        <Line className="h-6.5" bar="h-4.5 w-28" />
        <Line className="h-5" bar="h-3 w-20" />
      </div>
      <div className="flex flex-col gap-2">
        {Array.from({ length: rows }, (_, i) => (
          <Skeleton key={i} className={cx("w-full rounded-xl", row)} />
        ))}
      </div>
    </div>
  );
}
