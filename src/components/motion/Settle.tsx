"use client";

import { useEffect, useRef, type AnimationEvent, type ReactNode } from "react";

/**
 * The one-off animation utilities a Settle scope retires once played. Keep
 * in step with the `[data-settle] [data-played]` rules in globals.css.
 */
const ONE_OFF = [
  ".animate-enter",
  ".animate-pop",
  ".animate-number",
  ".animate-rise",
  ".animate-grow",
  ".animate-draw",
  ".animate-wipe",
  ".animate-fade",
  ".animate-wait",
  ".animate-number-fade",
  ".animate-check-draw",
].join(", ");

const markPlayed = (el: Element) => el.setAttribute("data-played", "");

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
  const ref = useRef<HTMLDivElement>(null);

  // Server-rendered entrances start at first paint, before hydration, and
  // many have ended by then (no animationend reached React): mark each one
  // once whatever is still running on it has finished.
  useEffect(() => {
    const scope = ref.current;
    if (!scope) return;
    let live = true;
    for (const el of scope.querySelectorAll(ONE_OFF)) {
      if (el.hasAttribute("data-played")) continue;
      Promise.all(el.getAnimations().map((animation) => animation.finished)).then(
        () => live && markPlayed(el),
        () => {},
      );
    }
    return () => {
      live = false;
    };
  }, []);

  return (
    <div
      ref={ref}
      data-settle=""
      className={className}
      onAnimationEnd={(event: AnimationEvent) => {
        if (event.target instanceof Element && event.target.matches(ONE_OFF)) markPlayed(event.target);
      }}
    >
      {children}
    </div>
  );
}
