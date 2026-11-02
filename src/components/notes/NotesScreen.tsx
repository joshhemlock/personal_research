import { ViewTransition } from "react";
import Link from "next/link";
import { Avatar } from "@/components/base/avatar/avatar";
import { Chip } from "@/components/base/badges/chip";
import { Breadcrumb, BreadcrumbItem } from "@/components/base/breadcrumb/breadcrumb";
import { Settle } from "@/components/motion/Settle";
import { deltaColor } from "@/components/shell/delta";
import type { NoteMarket } from "@/lib/data/notes";
import type { Note } from "@/lib/mock/notes";
import { NOTE_LIST, longDate, noteTitle, savedLabel, shortDate } from "@/lib/mock/notes";
import { num, pct } from "@/lib/format";
import { cx } from "@/utils/cx";
import { Catalysts } from "./Catalysts";
import { Checklist } from "./Checklist";
import { CARD, EDITOR_ATTR, LIST_TRANSITION, NOTES_GRID } from "./constants";
import { ConvictionPicker } from "./ConvictionPicker";
import { FormatToolbar } from "./FormatToolbar";
import { LinkedItems } from "./LinkedItems";
import { NoteBody } from "./NoteBody";
import { NoteDraftProvider } from "./NoteDraft";
import { NotesList } from "./NotesList";
import { BreadcrumbName, NoteTitle } from "./NoteTitle";
import { Scenarios } from "./Scenarios";
import { SinceNote } from "./SinceNote";

/**
 * Switching notes is a navigation inside this screen: the editor and the
 * context cards cross-fade from the old note to the new one (BoardUI's quick
 * blur-out and condensing blur-in). Named pairs, so it works whichever page
 * instance the router shows; the notes list stays put.
 */
const SWAP = "page-exit page-enter";

type NotesScreenProps = {
  note: Note;
  /** Prices and metrics around the note (sample or live). */
  market: NoteMarket;
  /**
   * Prefix for element ids. Next keeps recently visited pages mounted (hidden),
   * so two note pages can share the document: each route passes its own.
   */
  idPrefix: string;
};

/** The research notes screen for one note: notes list, editor and context cards. */
export function NotesScreen({ note, market, idPrefix }: NotesScreenProps) {
  const title = noteTitle(note);
  const { price, changePct: change, paths } = market;
  const id = (part: string) => `${idPrefix}-${part}`;

  return (
    <NoteDraftProvider noteId={note.id} symbol={note.symbol} title={title} conviction={note.conviction}>
      {/* Entrances (the chart's draw-in) play once, not again when Next
          shows this note's page again. */}
      <Settle className={NOTES_GRID.root}>
        <div className={NOTES_GRID.grid}>
          <ViewTransition name={LIST_TRANSITION} share="auto" default="none">
            <NotesList notes={NOTE_LIST} headingId={id("list-h")} />
          </ViewTransition>

          <ViewTransition name="note-editor" share={SWAP} default="none">
            <article {...{ [EDITOR_ATTR]: "" }} aria-labelledby={id("title")} className={cx(CARD, NOTES_GRID.editor)}>
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 @min-[34rem]:flex-nowrap">
                <Breadcrumb className="-ms-1 w-auto min-w-0">
                  <BreadcrumbItem href="/notes">Notes</BreadcrumbItem>
                  <BreadcrumbItem href={`/stock/${note.symbol}`}>{note.symbol}</BreadcrumbItem>
                  <BreadcrumbItem current>
                    <BreadcrumbName />
                  </BreadcrumbItem>
                </Breadcrumb>
                <FormatToolbar
                  chart={
                    paths && {
                      caption: `${note.symbol} since ${shortDate(note.started.date)}${change == null ? "" : ` · ${pct(change, 1)}`}`,
                      href: `/stock/${note.symbol}`,
                      line: paths.line,
                      area: paths.area,
                      up: (change ?? 0) >= 0,
                    }
                  }
                />
              </div>

              <div className="flex flex-col gap-2.5">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <NoteTitle id={id("title")} />
                  <span className="text-caption-1-medium whitespace-nowrap text-text-tertiary">Saved {savedLabel(note)}</span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Link
                    href={`/stock/${note.symbol}`}
                    className="group rounded-md outline-none focus-visible:ring-2 focus-visible:ring-border-focus-ring"
                  >
                    <Chip
                      color="gray"
                      variant="subtle"
                      className="gap-1.5 ps-1 transition-colors duration-150 ease group-hover:bg-background-secondary-hover"
                    >
                      <Avatar size="xs" initials={note.symbol.charAt(0)} className="bg-background-quaternary-default" />
                      {note.symbol}
                    </Chip>
                  </Link>
                  <Chip color="soft" variant="subtle">
                    {note.type}
                  </Chip>
                  <Chip color="soft" variant="subtle">
                    Started {longDate(note.started.date)} at {num(market.startPrice)}
                  </Chip>
                  {change != null && (
                    <Chip color={deltaColor(change, 1)} variant="subtle">
                      {pct(change, 1)} since
                    </Chip>
                  )}
                </div>
              </div>

              <ConvictionPicker labelId={id("conviction-l")} />
              <Scenarios initial={note.scenarios} price={price} headingId={id("fv-h")} />
              <NoteBody note={note} idPrefix={idPrefix} />
              <Catalysts items={market.catalysts} headingId={id("catalysts-h")} />
            </article>
          </ViewTransition>

          <ViewTransition name="note-context" share={SWAP} default="none">
            <aside aria-label="Note context" className={NOTES_GRID.context}>
              <SinceNote note={note} market={market} headingId={id("since-h")} gradientId={id("since-fill")} />
              <Checklist items={note.checklist} headingId={id("checklist-h")} />
              <LinkedItems items={note.linked} headingId={id("linked-h")} />
            </aside>
          </ViewTransition>
        </div>
      </Settle>
    </NoteDraftProvider>
  );
}
