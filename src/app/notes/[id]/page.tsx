import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { NOTE_INDEX } from "@/lib/mock/note-index";

// Sample symbols are prerendered; other params render on request, so
// navigations into this route may block until the page is ready.
export const instant = false;

export function generateStaticParams() {
  return NOTE_INDEX.map((n) => ({ id: n.id }));
}

export async function generateMetadata({ params }: PageProps<"/notes/[id]">): Promise<Metadata> {
  const { id } = await params;
  return { title: NOTE_INDEX.find((n) => n.id === id)?.title ?? "Research notes" };
}

export default async function NotePage({ params }: PageProps<"/notes/[id]">) {
  const { id } = await params;
  const note = NOTE_INDEX.find((n) => n.id === id);
  if (!note) notFound();
  return (
    <AppShell active="notes" askLabel="Ask about this note">
      <aside className="flex min-w-0 flex-[1_1_280px] flex-col" />
      <main className="flex min-w-0 flex-[999_1_560px] flex-col">{note.title}</main>
      <aside className="flex min-w-0 flex-[1_1_300px] flex-col gap-3" />
    </AppShell>
  );
}
