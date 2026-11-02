"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";

// BoardUI's number swap (globals.css `number-in`): the new figure fades in
// from a 1px blur over 220ms.
const NUMBER_IN: Keyframe[] = [
  { opacity: 0, filter: "blur(1px)" },
  { opacity: 1, filter: "blur(0px)" },
];

type AnimatedValueProps = {
  /** The figure; a change replays the swap. */
  value: string | number;
  className?: string;
  /** What to render, when it isn't the value itself. */
  children?: ReactNode;
};

/**
 * A figure that cross-fades in when it changes (a live refresh, a period
 * switch), never on first paint. It runs the swap with the Web Animations
 * API on the same element instead of re-keying a CSS animation, so a screen
 * that Next hides and shows again (Activity) doesn't replay it, and nothing
 * remounts. Opacity and filter only; skipped under reduced motion.
 */
export function AnimatedValue({ value, className, children }: AnimatedValueProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const shown = useRef(value);
  useLayoutEffect(() => {
    if (shown.current === value) return;
    shown.current = value;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    ref.current?.animate(NUMBER_IN, { duration: 220, easing: "ease-out" });
  }, [value]);
  return (
    <span ref={ref} className={className}>
      {children ?? value}
    </span>
  );
}
