// Lightweight list of sample research notes, used by the command palette.
// Sample data only. Derived from NOTES in ./notes, the single source of truth.

import { NOTES, listDate, noteTitle, type NoteType } from "./notes";

export type NoteSummary = {
  id: string;
  symbol: string;
  title: string;
  type: NoteType;
  date: string;
};

export const NOTE_INDEX: NoteSummary[] = NOTES.map((n) => ({
  id: n.id,
  symbol: n.symbol,
  title: noteTitle(n),
  type: n.type,
  date: listDate(n),
}));
