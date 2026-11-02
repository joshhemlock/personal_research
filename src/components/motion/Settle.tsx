"use client";

import type { AnimationEvent, ReactNode } from "react";

/**
 * Wraps a screen's content so its one-off animations play once. Next keeps
 * recent screens mounted but hidden (Activity), and showing one again would
 * restart every CSS animation in it: sparklines redrawing, bars regrowing,
 * checkbox ticks redrawing. Each element whose animation has finished is
 * marked `data-played`, and globals.css retires the entrance utilities
 * (animate-enter, -draw, -grow…, BoardUI's animate-check-draw) on marked
 * elements inside a `data-settle` scope, leaving them in their end state.
 * Anything mounted later (a new row, a box ticked now) still animates once.
 */
export function Settle({ className, children }: { className?: string; children: ReactNode }) {
  const markPlayed = (event: AnimationEvent) => {
    if (event.target instanceof Element) event.target.setAttribute("data-played", "");
  };
  return (
    <div data-settle="" className={className} onAnimationEnd={markPlayed}>
      {children}
    </div>
  );
}
