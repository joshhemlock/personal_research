import { ViewTransition } from "react";
import { Skeleton } from "@/components/base/skeleton/skeleton";
import { CARD } from "@/components/screener/styles";
import { cx } from "@/utils/cx";

/** A threshold row: label, then the small number field. */
function FieldRow({ label }: { label: string }) {
  return (
    <span className="flex min-h-10 items-center gap-2">
      <Skeleton shape="text" className={cx("h-3.5", label)} />
      <Skeleton className="ms-auto h-8 w-16 rounded-2lg" />
    </span>
  );
}

/** Chips: a label over a wrapping row of tag-sized blocks. */
function Chips({ widths }: { widths: string[] }) {
  return (
    <span className="flex flex-col gap-2">
      <Skeleton shape="text" className="h-3.5 w-20" />
      <span className="flex flex-wrap gap-1.5">
        {widths.map((w, i) => (
          <Skeleton key={i} className={cx("h-7 rounded-lg", w)} />
        ))}
      </span>
    </span>
  );
}

/**
 * Shown at once while the Screener's data loads (the shell stays): its
 * filters card, heading, summary tiles and results card in outline. Blurs out
 * as the page condenses in.
 */
export default function ScreenerLoading() {
  return (
    <ViewTransition exit="skeleton-exit" default="none">
      <div aria-busy="true" className="flex min-w-0 flex-wrap items-stretch gap-4">
        <p role="status" className="sr-only">
          Loading the Screener…
        </p>
        <div className={cx(CARD, "flex min-w-0 flex-[1_1_290px] flex-col gap-5 self-start p-5")}>
          <span className="flex items-center justify-between">
            <Skeleton shape="text" className="h-5 w-16" />
            <Skeleton shape="text" className="h-4 w-10" />
          </span>
          <span className="flex flex-col gap-2">
            <Skeleton shape="text" className="h-3.5 w-16" />
            <Skeleton className="h-9 w-full rounded-2lg" />
          </span>
          <Chips widths={["w-14", "w-14", "w-10", "w-12"]} />
          <Chips widths={["w-24", "w-28", "w-24", "w-20", "w-20", "w-24", "w-16"]} />
          <span className="flex flex-col gap-1 border-t border-separator-border pt-3">
            <FieldRow label="w-36" />
            <FieldRow label="w-24" />
            <FieldRow label="w-12" />
            <FieldRow label="w-20" />
            <FieldRow label="w-32" />
          </span>
          <span className="flex flex-col gap-2.5">
            <Skeleton className="h-9 w-full rounded-2lg" />
            <Skeleton className="h-9 w-full rounded-2lg" />
          </span>
        </div>
        <div className="flex min-w-0 flex-[999_1_620px] flex-col gap-4">
          <span className="flex flex-wrap items-center gap-x-4 gap-y-3">
            <Skeleton shape="text" className="h-7 w-28" />
            <Skeleton className="h-9 w-96 max-w-full rounded-2lg" />
            <Skeleton className="h-8 w-28 rounded-lg" />
          </span>
          <span className="flex flex-wrap gap-3">
            {Array.from({ length: 5 }, (_, i) => (
              <span key={i} className="flex min-w-0 flex-[1_1_8.5rem] flex-col gap-2.5 rounded-2xl bg-background-secondary-default p-4">
                <Skeleton shape="text" className="h-3.5 w-24 max-w-full" />
                <Skeleton shape="text" className="h-6 w-16" />
              </span>
            ))}
          </span>
          <div className={cx(CARD, "flex min-w-0 flex-col overflow-hidden")}>
            <span className="flex items-center justify-between gap-3 px-5 pt-5 pb-4">
              <Skeleton shape="text" className="h-5 w-28" />
              <span className="flex items-center gap-2">
                <Skeleton className="h-7 w-44 rounded-lg" />
                <Skeleton className="size-8 rounded-2lg" />
                <Skeleton className="size-8 rounded-2lg" />
              </span>
            </span>
            <span className="h-9 border-y border-separator-border bg-background-secondary-default" />
            {Array.from({ length: 8 }, (_, i) => (
              <span key={i} className="flex items-center gap-5 border-b border-separator-border px-5 py-2.5">
                <span className="flex w-36 shrink-0 flex-col gap-1.5">
                  <Skeleton shape="text" className="h-3.5 w-12" />
                  <Skeleton shape="text" className="h-3 w-24" />
                </span>
                {/* The figures: short bars at the end of each numeric column. */}
                <span className="flex min-w-0 flex-1 justify-end gap-5 overflow-hidden">
                  {Array.from({ length: 7 }, (_, j) => (
                    <Skeleton key={j} shape="text" className="h-3.5 w-12 shrink-0" />
                  ))}
                  <Skeleton shape="text" className="h-5 w-21 shrink-0" />
                </span>
                <Skeleton shape="circle" className="size-5 shrink-0" />
              </span>
            ))}
            <span className="flex items-center justify-between px-5 py-3">
              <Skeleton shape="text" className="h-3.5 w-32" />
              <Skeleton className="h-8 w-36 rounded-lg" />
            </span>
          </div>
        </div>
      </div>
    </ViewTransition>
  );
}
