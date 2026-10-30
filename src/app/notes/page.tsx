import type { Metadata } from "next";
import { AppShell } from "@/components/shell/AppShell";
import { NOTE_INDEX } from "@/lib/mock/note-index";

export const metadata: Metadata = { title: "Research notes" };

// /notes opens the most recent note.
export default function NotesIndexPage() {
  const note = NOTE_INDEX[0];
  return (
    <AppShell active="notes" askLabel="Ask about this note">
      <aside className="flex min-w-0 flex-[1_1_280px] flex-col" />
      <main className="flex min-w-0 flex-[999_1_560px] flex-col">{note.title}</main>
      <aside className="flex min-w-0 flex-[1_1_300px] flex-col gap-3" />
    </AppShell>
  );
}
