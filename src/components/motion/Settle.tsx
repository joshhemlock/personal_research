"use client";

import { useEffect, useState, type ReactNode } from "react";

/** Long enough for a draw (600ms) plus a capped stagger (240ms). */
const ENTRANCE_MS = 1000;

/**
 * Wraps a screen's content and marks it `data-settled` once its entrance
 * animations (animate-enter, -draw, -grow…) have played. Next keeps recent
 * screens mounted but hidden (Activity); showing one again would restart
 * every CSS animation in it, and globals.css retires them under
 * `[data-settled]` instead. The state survives the hide, so a screen you
 * return to is simply there, with only the page transition.
 */
export function Settle({ className, children }: { className?: string; children: ReactNode }) {
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    if (settled) return;
    const id = setTimeout(() => setSettled(true), ENTRANCE_MS);
    return () => clearTimeout(id);
  }, [settled]);
  return (
    <div data-settled={settled || undefined} className={className}>
      {children}
    </div>
  );
}
