"use client";

import { createContext, use, useMemo, useState, type ReactNode } from "react";
import type { Conviction } from "@/lib/mock/notes";

type NoteDraft = {
  noteId: string;
  symbol: string;
  /** Full title as edited, e.g. "NVDA — Core thesis". */
  title: string;
  conviction: Conviction;
  setTitle: (title: string) => void;
  setConviction: (conviction: Conviction) => void;
};

const DraftContext = createContext<NoteDraft | null>(null);

/**
 * Unsaved edits of the open note that other parts of the screen mirror:
 * the title (breadcrumb, notes list) and the conviction (list dot).
 * Renders no element, so the columns stay direct children of the shell row.
 */
export function NoteDraftProvider({
  noteId,
  symbol,
  title: initialTitle,
  conviction: initialConviction,
  children,
}: {
  noteId: string;
  symbol: string;
  title: string;
  conviction: Conviction;
  children: ReactNode;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [conviction, setConviction] = useState(initialConviction);
  const value = useMemo(
    () => ({ noteId, symbol, title, conviction, setTitle, setConviction }),
    [noteId, symbol, title, conviction],
  );
  return <DraftContext value={value}>{children}</DraftContext>;
}

export function useNoteDraft(): NoteDraft {
  const draft = use(DraftContext);
  if (!draft) throw new Error("useNoteDraft must be used inside <NoteDraftProvider>");
  return draft;
}

/** "NVDA — Core thesis" → "Core thesis" (the breadcrumb leaf). */
export function titleName(title: string, symbol: string): string {
  const prefix = `${symbol} — `;
  return title.startsWith(prefix) ? title.slice(prefix.length) : title;
}
