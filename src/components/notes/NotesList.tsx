"use client";

import { useDeferredValue, useEffect, useSyncExternalStore, ViewTransition } from "react";
import Link from "next/link";
import { Focusable } from "react-aria-components";
import { RiAddLine } from "@remixicon/react";
import { Avatar } from "@/components/base/avatar/avatar";
import { IconButton } from "@/components/base/buttons/icon-button";
import { LinkButton } from "@/components/base/buttons/link-button";
import { SearchField } from "@/components/base/search-field/search-field";
import { SegmentedControl, SegmentedControlItem } from "@/components/base/segmented-control/segmented-control";
import { Tooltip, TooltipTrigger } from "@/components/base/tooltip/tooltip";
import type { NoteListItem, NoteType } from "@/lib/mock/notes";
import { cx } from "@/utils/cx";
import { CARD, CARD_TITLE } from "./constants";
import { ConvictionDot } from "./ConvictionDot";
import { useOptionalNoteDraft, type NoteDraft } from "./NoteDraft";

type Kind = "All" | "Theses" | "Earnings" | "Ideas";

const KINDS: { kind: Kind; type?: NoteType }[] = [
  { kind: "All" },
  { kind: "Theses", type: "Thesis" },
  { kind: "Earnings", type: "Earnings" },
  { kind: "Ideas", type: "Idea" },
];

// Search and type filter, shared by every notes page: the list is the same
// sidebar whichever note is open, so they survive switching notes.
type ListFilter = { query: string; kind: Kind };
const ALL: ListFilter = { query: "", kind: "All" };
let filter = ALL;
const listeners = new Set<() => void>();
const filterStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  get: () => filter,
  getServer: () => ALL,
  set(next: Partial<ListFilter>) {
    filter = { ...filter, ...next };
    listeners.forEach((l) => l());
  },
};

// The note whose row was just clicked: while it loads, the list in the
// loading state marks it, so the click answers at once.
let opening: string | null = null;
const openingListeners = new Set<() => void>();
const openingStore = {
  subscribe(listener: () => void) {
    openingListeners.add(listener);
    return () => {
      openingListeners.delete(listener);
    };
  },
  get: () => opening,
  getServer: () => null,
  set(id: string | null) {
    if (id === opening) return;
    opening = id;
    openingListeners.forEach((l) => l());
  },
};

/** The notes that pass a filter; the open note shows its unsaved title and conviction. */
function visibleNotes(notes: NoteListItem[], f: ListFilter, draft: NoteDraft | null): NoteListItem[] {
  const type = KINDS.find((k) => k.kind === f.kind)?.type;
  const q = f.query.trim().toLowerCase();
  return notes
    .map((n) => (n.id === draft?.noteId ? { ...n, title: draft.title.trim() || n.title, conviction: draft.conviction } : n))
    .filter((n) => !type || n.type === type)
    .filter((n) => !q || `${n.title} ${n.summary} ${n.type}`.toLowerCase().includes(q));
}

/**
 * The notes column: search, type filter and the list of notes.
 *
 * The search field and the filter answer at once; the rows follow in a
 * deferred render, which React runs as a view transition: rows that leave
 * blur out, rows that arrive blur in, and the rest glide to their new places.
 *
 * Outside a note (the loading state) there is no draft: the list then marks
 * the row that was clicked, if any.
 */
export function NotesList({ notes, headingId }: { notes: NoteListItem[]; headingId: string }) {
  const draft = useOptionalNoteDraft();
  const clicked = useSyncExternalStore(openingStore.subscribe, openingStore.get, openingStore.getServer);
  const openId = draft ? draft.noteId : clicked;
  // A note on screen: nothing is on its way any more.
  useEffect(() => {
    if (draft) openingStore.set(null);
  }, [draft]);
  const current = useSyncExternalStore(filterStore.subscribe, filterStore.get, filterStore.getServer);
  const shownFilter = useDeferredValue(current);
  const shown = visibleNotes(notes, shownFilter, draft);
  const filtered = shownFilter.query.trim() !== "" || shownFilter.kind !== "All";

  return (
    <section aria-labelledby={headingId} className={cx(CARD, "flex min-w-0 flex-col gap-4 p-4")}>
      <div className="flex items-center justify-between gap-2 ps-1">
        <h2 id={headingId} className={CARD_TITLE}>
          Research notes
        </h2>
        {/* Creating notes arrives with persistence (build step 5). */}
        <TooltipTrigger delay={300}>
          <Focusable>
            <IconButton size="small" icon={RiAddLine} aria-label="New note" />
          </Focusable>
          <Tooltip>New note</Tooltip>
        </TooltipTrigger>
      </div>

      <div className="flex flex-col gap-2.5">
        <SearchField
          aria-label="Search notes"
          placeholder="Search notes"
          value={current.query}
          onChange={(query) => filterStore.set({ query })}
        />
        <SegmentedControl
          aria-label="Note type"
          selectedKeys={[current.kind]}
          onSelectionChange={(keys) => {
            const next = [...keys][0] as Kind | undefined;
            if (next) filterStore.set({ kind: next });
          }}
          className="flex w-full"
        >
          {KINDS.map(({ kind }) => (
            <SegmentedControlItem key={kind} id={kind} className="flex-1 px-2">
              {kind}
            </SegmentedControlItem>
          ))}
        </SegmentedControl>
      </div>

      <p className="sr-only" aria-live="polite">
        {filtered ? `${shown.length} ${shown.length === 1 ? "note" : "notes"}` : ""}
      </p>

      {/* No enter or exit of its own: it stops the rows' entrance from playing
          when the whole page appears (a navigation or a loading reveal). */}
      <ViewTransition default="none">
        {shown.length === 0 && (
          <ViewTransition enter="row-enter" exit="row-exit" default="none">
            <p className="px-1 text-body-regular text-text-secondary">
              No notes match.{" "}
              <LinkButton size="small" onClick={() => filterStore.set(ALL)}>
                Clear filters
              </LinkButton>
            </p>
          </ViewTransition>
        )}
        <ul className="-mx-1 flex flex-col gap-0.5">
          {shown.map((n) => {
            const on = n.id === openId;
            return (
              <ViewTransition key={n.id} enter="row-enter" exit="row-exit" update="row-move" default="none">
                <li>
                  <Link
                    href={`/notes/${n.id}`}
                    aria-current={on ? "page" : undefined}
                    onClick={(e) => {
                      // A plain click on another note: this tab is about to open it.
                      const plain = e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;
                      if (plain && !on) openingStore.set(n.id);
                    }}
                    className={cx(
                      "flex items-start gap-3 rounded-2xl p-2.5 outline-none",
                      "transition-colors duration-150 ease focus-visible:ring-2 focus-visible:ring-border-focus-ring",
                      on
                        ? "bg-background-secondary-default"
                        : "hover:bg-background-primary-hover active:bg-background-primary-active",
                    )}
                  >
                    {/* A step above the card in both themes (the neutral avatar matches the card in dark). */}
                    <Avatar size="md" initials={n.symbol.charAt(0)} className="bg-background-quaternary-default" />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-body-medium text-text-primary">{n.title}</span>
                        <ConvictionDot conviction={n.conviction} />
                      </span>
                      <span className="truncate text-body-2-regular text-text-secondary">{n.summary}</span>
                      <span className="text-caption-1-regular text-text-tertiary">
                        {n.type} · {n.date}
                        <span className="sr-only">, {n.conviction.toLowerCase()} conviction</span>
                      </span>
                    </span>
                  </Link>
                </li>
              </ViewTransition>
            );
          })}
        </ul>
      </ViewTransition>
    </section>
  );
}
