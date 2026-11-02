"use client";

import { useLayoutEffect, useRef, useState, type HTMLAttributes, type ReactNode, type RefObject } from "react";

// BoardUI's ease-out for movement with presence (globals.css --ease-board).
const EASE_BOARD = "cubic-bezier(0.22, 1, 0.36, 1)";

// The same entrances as the CSS utilities (animate-rise, -grow, -draw, -pop,
// -enter), as Web Animations. Transform, opacity, filter and dash offset only.
const EFFECTS = {
  rise: { keyframes: [{ transform: "scaleY(0)" }, { transform: "scaleY(1)" }], duration: 360 },
  grow: { keyframes: [{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], duration: 360 },
  draw: { keyframes: [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], duration: 600 },
  pop: {
    keyframes: [
      { opacity: 0, transform: "scale(0.95)", filter: "blur(2px)" },
      { opacity: 1, transform: "scale(1)", filter: "blur(0px)" },
    ],
    duration: 200,
  },
  enter: {
    keyframes: [
      { opacity: 0, transform: "scale(0.985)", filter: "blur(2px)" },
      { opacity: 1, transform: "scale(1)", filter: "blur(0px)" },
    ],
    duration: 360,
  },
} satisfies Record<string, { keyframes: Keyframe[]; duration: number }>;

export type ReplayEffect = keyof typeof EFFECTS;

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function play(el: Element, effect: ReplayEffect, delay: number) {
  const { keyframes, duration } = EFFECTS[effect];
  el.animate(keyframes, { duration, easing: EASE_BOARD, delay: Math.min(delay, 240), fill: "backwards" });
}

/** Elements that have already been on screen: they never enter again. */
const seen = new WeakSet<Element>();

/**
 * For lists whose items mount after the render that changed them (React
 * Aria builds a table's rows in a later commit): returns a ref callback per
 * item index that plays the entrance when that item's element first mounts.
 * It arms once `on` has changed (the reader switched statement or period),
 * so the items of the first paint, and any re-render of them, never move;
 * each element enters at most once, so a refresh moves nothing either.
 */
export function useEnterOnMount(on: string, effect: ReplayEffect, step = 30) {
  const [initial] = useState(on);
  const [armed, setArmed] = useState(false);
  if (!armed && on !== initial) setArmed(true);
  const live = armed || on !== initial;
  return (index: number) => (el: Element | null) => {
    if (!el || !(el instanceof HTMLElement) || seen.has(el)) return;
    seen.add(el);
    if (live && !reducedMotion()) play(el, effect, index * step);
  };
}

/**
 * Replays an entrance on the elements matching `selector` inside `ref` when
 * `on` changes (a new quarter reported, another statement or multiple
 * picked), never on first paint: the CSS utilities cover that, and the
 * screen's Settle retires them. Web Animations rather than re-keyed CSS, so
 * a screen Next hides and shows again (Activity) doesn't replay anything.
 * Staggered `step` ms apart, capped at 240ms; skipped under reduced motion.
 */
export function useReplay(
  ref: RefObject<Element | null>,
  on: string,
  selector: string,
  effect: ReplayEffect,
  step = 30,
) {
  const shown = useRef(on);
  useLayoutEffect(() => {
    if (shown.current === on) return;
    shown.current = on;
    const root = ref.current;
    if (!root || reducedMotion()) return;
    root.querySelectorAll(selector).forEach((el, i) => play(el, effect, i * step));
  }, [on, ref, selector, effect, step]);
}

type ReplayProps = HTMLAttributes<HTMLDivElement> & {
  /** A change of this value replays the entrance. */
  on: string;
  selector: string;
  effect: ReplayEffect;
  step?: number;
  children: ReactNode;
};

/** A div that replays its marks' entrance when `on` changes (see useReplay). */
export function Replay({ on, selector, effect, step, children, ...props }: ReplayProps) {
  const ref = useRef<HTMLDivElement>(null);
  useReplay(ref, on, selector, effect, step);
  return (
    <div ref={ref} {...props}>
      {children}
    </div>
  );
}
