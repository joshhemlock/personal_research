"use client";

import { useState } from "react";
import { titleName, useNoteDraft } from "./NoteDraft";

/**
 * The note title, edited in place. The DOM owns the text once mounted (it
 * renders the initial title only), and each edit is mirrored into the draft
 * so the breadcrumb and the notes list follow along.
 */
export function NoteTitle({ id }: { id: string }) {
  const { title, setTitle } = useNoteDraft();
  const [initial] = useState(title);
  const [lastGood, setLastGood] = useState(title);

  return (
    <h1
      id={id}
      contentEditable="plaintext-only"
      suppressContentEditableWarning
      spellCheck={false}
      onInput={(e) => setTitle(e.currentTarget.textContent ?? "")}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === "Escape") {
          e.preventDefault();
          e.currentTarget.blur();
        }
      }}
      onBlur={(e) => {
        const text = (e.currentTarget.textContent ?? "").replace(/\s+/g, " ").trim();
        // An empty title falls back to the last one that had text.
        if (!text) e.currentTarget.textContent = lastGood;
        else if (text !== e.currentTarget.textContent) e.currentTarget.textContent = text;
        setTitle(text || lastGood);
        setLastGood(text || lastGood);
      }}
      className="rounded-[8px] text-[30px] font-normal tracking-[-0.02em] focus-visible:outline-offset-4 focus-visible:outline-[rgba(47,95,204,0.45)]"
    >
      {initial}
    </h1>
  );
}

/** Last breadcrumb item: the open note's (edited) name. */
export function BreadcrumbName() {
  const { title, symbol } = useNoteDraft();
  return (
    <span aria-current="page" className="text-ink">
      {titleName(title.trim(), symbol)}
    </span>
  );
}
