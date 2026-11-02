import { ViewTransition } from "react";
import { Skeleton, SkeletonText } from "@/components/base/skeleton/skeleton";
import { NOTE_LIST } from "@/lib/mock/notes";
import { cx } from "@/utils/cx";
import { CARD, LIST_TRANSITION, NOTES_GRID } from "./constants";
import { NotesList } from "./NotesList";

/** A card's title row: the heading and, optionally, a figure at the end. */
function TitleRow({ end }: { end?: string }) {
  return (
    <span className="flex items-center justify-between gap-3">
      <Skeleton shape="text" className="h-4.5 w-32" />
      {end && <Skeleton shape="text" className={cx("h-4", end)} />}
    </span>
  );
}

/**
 * The notes screen while a note loads: the notes list, then the editor and
 * the context cards as skeletons in the screen's own grid and card shapes,
 * so the content lands exactly where the placeholders were.
 */
export function NotesSkeleton() {
  return (
    <div className={NOTES_GRID.root}>
      <div className={NOTES_GRID.grid}>
        {/* The real list: it is static, so it can be there at once (with the
            clicked note marked), and it stays put as the note arrives. */}
        <ViewTransition name={LIST_TRANSITION} share="auto" default="none">
          <NotesList notes={NOTE_LIST} headingId="loading-list-h" />
        </ViewTransition>

        <div className={cx(CARD, NOTES_GRID.editor)}>
          <span className="flex flex-wrap items-center justify-between gap-3">
            <Skeleton shape="text" className="h-3.5 w-56" />
            <span className="flex gap-1">
              {Array.from({ length: 6 }, (_, i) => (
                <Skeleton key={i} className="size-8 rounded-2lg" />
              ))}
            </span>
          </span>
          <span className="flex flex-col gap-2.5">
            <Skeleton shape="text" className="h-7 w-72 max-w-full" />
            <span className="flex flex-wrap gap-1.5">
              <Skeleton className="h-7 w-20 rounded-md" />
              <Skeleton className="h-7 w-16 rounded-md" />
              <Skeleton className="h-7 w-52 rounded-md" />
              <Skeleton className="h-7 w-24 rounded-md" />
            </span>
          </span>
          <span className="flex items-center gap-4">
            <Skeleton shape="text" className="h-3.5 w-20" />
            <Skeleton className="h-9 w-60 rounded-2lg" />
          </span>
          <Skeleton className="h-72 rounded-2xl" />
          <span className="flex flex-col gap-2.5">
            <Skeleton shape="text" className="h-4 w-20" />
            <SkeletonText lines={3} lineClassName="h-4" />
          </span>
          <span className="grid gap-6 @min-[34rem]:grid-cols-2">
            <span className="flex flex-col gap-2.5">
              <Skeleton shape="text" className="h-4 w-24" />
              <SkeletonText lines={3} />
            </span>
            <span className="flex flex-col gap-2.5">
              <Skeleton shape="text" className="h-4 w-16" />
              <SkeletonText lines={3} />
            </span>
          </span>
          <Skeleton className="h-20 rounded-2xl" />
        </div>

        <div className={NOTES_GRID.context}>
          <div className={cx(CARD, "flex min-w-0 flex-col gap-3 p-5")}>
            <TitleRow end="w-14" />
            <Skeleton className="h-18" />
            <SkeletonText lines={4} />
          </div>
          <div className={cx(CARD, "flex min-w-0 flex-col gap-3 p-5")}>
            <TitleRow end="w-12" />
            <Skeleton className="h-1 rounded-full" />
            <SkeletonText lines={6} lineClassName="h-4" className="gap-5 pt-2" />
          </div>
          <div className={cx(CARD, "flex min-w-0 flex-col gap-3 p-5")}>
            <TitleRow />
            {Array.from({ length: 3 }, (_, i) => (
              <span key={i} className="flex items-center gap-3">
                <Skeleton className="size-9" />
                <span className="flex flex-1 flex-col gap-1.5">
                  <Skeleton shape="text" className="h-3.5 w-4/5" />
                  <Skeleton shape="text" className="h-3 w-1/2" />
                </span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
