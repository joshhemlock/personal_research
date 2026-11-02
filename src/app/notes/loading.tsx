import { ViewTransition } from "react";
import { NotesSkeleton } from "@/components/notes/NotesSkeleton";

/**
 * Shown at once when a notes page isn't prefetched: the screen's shape in
 * BoardUI skeletons (the shell around it stays). It blurs out quickly as
 * the note arrives, and the note's columns blur in through the shell's
 * page transition.
 */
export default function NotesLoading() {
  return (
    <ViewTransition exit="skeleton-exit" default="none">
      <div aria-busy="true" className="flex min-w-0 flex-wrap items-stretch gap-4">
        <p role="status" className="sr-only">
          Loading note…
        </p>
        <NotesSkeleton />
      </div>
    </ViewTransition>
  );
}
