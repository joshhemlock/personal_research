import { ViewTransition } from "react";
import { Skeleton } from "@/components/base/skeleton/skeleton";
import { CARD } from "@/components/financials/helpers";
import { cx } from "@/utils/cx";

/** A card placeholder: its title, then a block in the shape of its content. */
function CardSkeleton({ title, body, className }: { title: string; body: string; className?: string }) {
  return (
    <div className={cx(CARD, "flex flex-col gap-4 p-5", className)}>
      <div className="flex items-center justify-between gap-3">
        <Skeleton shape="text" className={cx("h-4", title)} />
        <Skeleton shape="text" className="h-3 w-20" />
      </div>
      <Skeleton className={body} />
    </div>
  );
}

/**
 * Shown while a symbol's financials load (a ticker opened from search waits
 * on the data provider). Content only: the shell stays put around it. It
 * blurs out as the page arrives.
 */
export default function FinancialsLoading() {
  return (
    <ViewTransition exit="skeleton-exit" default="none">
      <main aria-busy="true" aria-label="Loading financials" className="@container w-full min-w-0">
        <div className="flex flex-col gap-6">
          {/* Heading and actions */}
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
            <div className="flex flex-col gap-2.5 py-1">
              <Skeleton shape="text" className="h-6 w-64" />
              <Skeleton shape="text" className="h-3.5 w-80 max-w-full" />
            </div>
            <div className="flex gap-2.5">
              <Skeleton className="h-9 w-24 rounded-2lg" />
              <Skeleton className="h-9 w-36 rounded-2lg" />
            </div>
          </div>
          {/* Section tabs */}
          <div className="flex gap-6 border-b border-separator-border px-2.5 pb-3">
            {["w-10", "w-16", "w-14", "w-11", "w-10"].map((w, i) => (
              <Skeleton key={i} shape="text" className={cx("h-3.5", w)} />
            ))}
          </div>
          {/* Headline tiles */}
          <div className="@container">
            <div className="flex flex-wrap gap-4">
              {Array.from({ length: 5 }, (_, i) => (
                <div
                  key={i}
                  className="flex min-h-33 min-w-0 grow basis-[calc(50%-0.5rem)] flex-col justify-between gap-3 rounded-2xl bg-background-secondary-default p-4 @xl:basis-[calc(33.333%-0.75rem)] @4xl:basis-0"
                >
                  <Skeleton className="h-8 w-24 rounded-md" />
                  <div className="flex flex-col gap-2">
                    <Skeleton shape="text" className="h-3.5 w-24" />
                    <Skeleton shape="text" className="h-6 w-32" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="grid items-start gap-4 @min-[75rem]:grid-cols-[minmax(0,1fr)_22rem]">
            <div className="@container flex min-w-0 flex-col gap-4">
              <div className="grid gap-4 @min-[46rem]:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
                <CardSkeleton title="w-44" body="h-52 w-full" />
                <CardSkeleton title="w-20" body="h-52 w-full" />
              </div>
              <CardSkeleton title="w-24" body="h-96 w-full" />
            </div>
            <div className="grid min-w-0 grid-cols-[repeat(auto-fit,minmax(min(20rem,100%),1fr))] items-start gap-4">
              <CardSkeleton title="w-36" body="h-64 w-full" />
              <CardSkeleton title="w-32" body="h-40 w-full" />
              <CardSkeleton title="w-24" body="h-16 w-full" />
            </div>
          </div>
          <span role="status" className="sr-only">Loading financials…</span>
        </div>
      </main>
    </ViewTransition>
  );
}
