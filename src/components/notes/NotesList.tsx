"use client";

import { useState } from "react";
import Link from "next/link";
import type { NoteListItem, NoteType } from "@/lib/mock/notes";
import { Icon } from "@/components/ui/Icon";
import { TickerDot } from "@/components/ui/Pill";
import { CONVICTION } from "./constants";
import { useNoteDraft } from "./NoteDraft";

type Kind = "All" | "Theses" | "Earnings" | "Ideas";

const KINDS: { kind: Kind; type?: NoteType }[] = [
  { kind: "All" },
  { kind: "Theses", type: "Thesis" },
  { kind: "Earnings", type: "Earnings" },
  { kind: "Ideas", type: "Idea" },
];

const RAISED = "bg-white shadow-[0_1px_3px_rgba(17,17,19,0.08),0_8px_20px_-12px_rgba(17,17,19,0.2)]";

/** Search box, type filter chips and the list of notes (left column). */
export function NotesList({ notes }: { notes: NoteListItem[] }) {
  const draft = useNoteDraft();
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<Kind>("All");

  const type = KINDS.find((k) => k.kind === kind)?.type;
  const q = query.trim().toLowerCase();
  // The open note shows its unsaved title and conviction.
  const shown = notes
    .map((n) => (n.id === draft.noteId ? { ...n, title: draft.title.trim() || n.title, conviction: draft.conviction } : n))
    .filter((n) => !type || n.type === type)
    .filter((n) => !q || `${n.title} ${n.summary} ${n.type}`.toLowerCase().includes(q));
  const filtered = q !== "" || kind !== "All";

  return (
    <>
      <label className="flex h-[42px] items-center gap-2 rounded-full bg-track px-[14px] text-ink-3 has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-focus">
        <Icon name="search" size={17} />
        <input
          type="search"
          aria-label="Search notes"
          placeholder="Search notes"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="min-w-0 flex-1 border-0 bg-transparent px-[2px] text-[14px] text-ink outline-none placeholder:text-muted"
        />
      </label>

      <div role="group" aria-label="Note type" className="flex flex-wrap gap-[6px]">
        {KINDS.map(({ kind: k }) => {
          const on = k === kind;
          return (
            <button
              key={k}
              type="button"
              aria-pressed={on}
              onClick={() => setKind(k)}
              className={`h-8 rounded-full border px-3 text-[13px] transition-colors duration-150 ${
                on ? "border-ink bg-ink text-white" : "border-[rgba(17,17,19,0.1)] bg-white/70 text-ink-2 hover:bg-white hover:text-ink"
              }`}
            >
              {k}
            </button>
          );
        })}
      </div>

      <p className="sr-only" aria-live="polite">
        {filtered ? `${shown.length} ${shown.length === 1 ? "note" : "notes"}` : ""}
      </p>

      {shown.length > 0 ? (
        <ul className="-mx-[6px] flex flex-col gap-1">
          {shown.map((n) => {
            const on = n.id === draft.noteId;
            return (
              <li key={n.id}>
                <Link
                  href={`/notes/${n.id}`}
                  aria-current={on ? "page" : undefined}
                  // Rows were <button>s in the design: browser line height, proportional digits.
                  className={`flex w-full items-start gap-[10px] rounded-[16px] p-[10px] text-left leading-[normal] text-ink normal-nums transition-[background-color,box-shadow] duration-150 ${
                    on ? RAISED : "hover:bg-white/70"
                  }`}
                >
                  <TickerDot symbol={n.symbol} size={30} fontSize={12} />
                  <span className="flex min-w-0 flex-1 flex-col gap-px">
                    <span className="flex items-center justify-between gap-[6px]">
                      <span className="truncate text-[14px] font-medium">{n.title}</span>
                      <span
                        aria-hidden="true"
                        className="size-2 flex-none rounded-full"
                        style={{ background: CONVICTION[n.conviction].dot }}
                      />
                    </span>
                    <span className="truncate text-[13px] text-ink-3">{n.summary}</span>
                    <span className="text-[12px] text-muted">
                      {n.type} · {n.date}
                      <span className="sr-only">, {n.conviction.toLowerCase()} conviction</span>
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="px-1 py-2 text-[13px] text-muted">
          No notes match.{" "}
          <button
            type="button"
            className="link text-ink"
            onClick={() => {
              setQuery("");
              setKind("All");
            }}
          >
            Clear filters
          </button>
        </p>
      )}
    </>
  );
}
