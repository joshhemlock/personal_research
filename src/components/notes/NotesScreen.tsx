import Link from "next/link";
import type { NoteMarket } from "@/lib/data/notes";
import type { Note } from "@/lib/mock/notes";
import { NOTE_LIST, longDate, noteTitle, savedLabel, shortDate } from "@/lib/mock/notes";
import { num, pct, tone } from "@/lib/format";
import { Icon } from "@/components/ui/Icon";
import { TickerDot } from "@/components/ui/Pill";
import { Catalysts } from "./Catalysts";
import { Checklist } from "./Checklist";
import { ConvictionPicker } from "./ConvictionPicker";
import { FormatToolbar } from "./FormatToolbar";
import { LinkedItems } from "./LinkedItems";
import { NoteBody } from "./NoteBody";
import { NoteDraftProvider } from "./NoteDraft";
import { NotesList } from "./NotesList";
import { BreadcrumbName, NoteTitle } from "./NoteTitle";
import { Scenarios } from "./Scenarios";
import { SinceNote } from "./SinceNote";

const CHIP = "inline-flex h-7 items-center rounded-full bg-track text-[13px]";

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

/**
 * The research notes screen for one note: notes list, editor and context
 * column, rendered as the shell's columns (inside <AppShell>). Below the
 * `split` breakpoint the context column moves under the list and editor as
 * a row of panels, so the editor keeps its room.
 */
export function NotesScreen({ note, market, idPrefix }: NotesScreenProps) {
  const title = noteTitle(note);
  const { price, changePct: change, paths } = market;
  const t = tone(change ?? 0);
  const id = (part: string) => `${idPrefix}-${part}`;

  return (
    <NoteDraftProvider noteId={note.id} symbol={note.symbol} title={title} conviction={note.conviction}>
      <aside aria-labelledby={id("list-h")} className="glass flex min-w-0 flex-[1_1_280px] flex-col gap-3 rounded-[24px] p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 id={id("list-h")} className="text-[21px] font-normal tracking-[-0.01em]">
            Research notes
          </h2>
          {/* Creating notes arrives with persistence (build step 5). */}
          <button
            type="button"
            aria-label="New note"
            title="New note"
            className="inline-flex size-10 items-center justify-center rounded-full bg-ink text-white transition-colors duration-150 hover:bg-[#2A2A2E]"
          >
            <Icon name="plus" size={18} strokeWidth={1.8} />
          </button>
        </div>
        <NotesList notes={NOTE_LIST} />
      </aside>

      <main
        aria-labelledby={id("title")}
        className="glass flex min-w-0 flex-[999_1_560px] flex-col gap-[14px] rounded-[24px] px-6 pt-4 pb-5 max-sm:px-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-[13px] text-muted">
            <nav aria-label="Breadcrumb" className="inline">
              <Link href="/notes" className="hover:text-ink">
                Notes
              </Link>
              {" / "}
              <Link href={`/stock/${note.symbol}`} className="hover:text-ink">
                {note.symbol}
              </Link>
              {" / "}
              <BreadcrumbName />
            </nav>
            {` · Saved ${savedLabel(note)}`}
          </div>
          <FormatToolbar
            chart={
              paths && {
                caption: `${note.symbol} since ${shortDate(note.started.date)}${change == null ? "" : ` · ${pct(change, 1)}`}`,
                href: `/stock/${note.symbol}`,
                line: paths.line,
                area: paths.area,
                stroke: t.stroke,
                fill: t.fill,
              }
            }
          />
        </div>

        <div className="flex flex-col gap-2">
          <NoteTitle id={id("title")} />
          <div className="flex flex-wrap items-center gap-[6px]">
            <Link
              href={`/stock/${note.symbol}`}
              className={`${CHIP} gap-[6px] pr-[10px] pl-[3px] text-ink transition-colors duration-150 hover:bg-[rgba(17,17,19,0.08)]`}
            >
              <TickerDot symbol={note.symbol} size={22} fontSize={10} />
              {note.symbol}
            </Link>
            <span className={`${CHIP} px-[10px]`}>{note.type}</span>
            <span className={`${CHIP} px-[10px] text-ink-2`}>
              Started {longDate(note.started.date)} at {num(market.startPrice)}
            </span>
            {change != null && (
              <span
                className={`inline-flex h-7 items-center rounded-full px-[10px] text-[13px] ${
                  change >= 0 ? "bg-up-pill text-up-pill-text" : "bg-down-pill text-down-pill-text"
                }`}
              >
                {pct(change, 1)} since
              </span>
            )}
          </div>
        </div>

        <ConvictionPicker />
        <Scenarios initial={note.scenarios} price={price} />
        <NoteBody note={note} idPrefix={idPrefix} />
        <Catalysts items={market.catalysts} headingId={id("catalysts-h")} />
      </main>

      {/* No grow (the design has 1, worth 0.2px): with the shell's fixed rail
          column this puts every column within 0.01px of the design at 1512px. */}
      <aside
        aria-label="Note context"
        className="flex min-w-0 flex-[0_1_300px] flex-col gap-3 max-split:grid max-split:basis-full max-split:grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] max-split:content-start"
      >
        <SinceNote note={note} market={market} headingId={id("since-h")} />
        <Checklist items={note.checklist} headingId={id("checklist-h")} />
        <LinkedItems items={note.linked} headingId={id("linked-h")} />
      </aside>
    </NoteDraftProvider>
  );
}
