"use client";

import type { ReactNode } from "react";

/**
 * Opens the ⌘K command palette (to jump to another ticker) by sending the
 * shortcut the search pill listens for.
 */
export function OpenPaletteButton({ label, className, children }: { label: string; className: string; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-haspopup="dialog"
      aria-keyshortcuts="Meta+K Control+K"
      onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, ctrlKey: true }))}
      className={className}
    >
      {children}
    </button>
  );
}
