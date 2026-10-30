import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { NotesScreen } from "@/components/notes/NotesScreen";
import { NOTE_INDEX } from "@/lib/mock/note-index";
import { findNote, noteTitle } from "@/lib/mock/notes";

// Sample symbols are prerendered; other params render on request, so
// navigations into this route may block until the page is ready.
export const instant = false;

export function generateStaticParams() {
  return NOTE_INDEX.map((n) => ({ id: n.id }));
}

export async function generateMetadata({ params }: PageProps<"/notes/[id]">): Promise<Metadata> {
  const { id } = await params;
  const note = findNote(id);
  return { title: note ? noteTitle(note) : "Research notes" };
}

export default async function NotePage({ params }: PageProps<"/notes/[id]">) {
  const { id } = await params;
  const note = findNote(id);
  if (!note) notFound();
  return (
    <AppShell active="notes" symbol={note.symbol} askLabel="Ask about this note">
      <NotesScreen note={note} />
    </AppShell>
  );
}
