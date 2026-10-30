import type { Metadata } from "next";
import { AppShell } from "@/components/shell/AppShell";
import { NotesScreen } from "@/components/notes/NotesScreen";
import { latestNote } from "@/lib/mock/notes";

export const metadata: Metadata = { title: "Research notes" };

// /notes opens the most recently saved note.
export default function NotesIndexPage() {
  const note = latestNote();
  return (
    <AppShell active="notes" symbol={note.symbol} askLabel="Ask about this note">
      <NotesScreen note={note} idPrefix="latest" />
    </AppShell>
  );
}
