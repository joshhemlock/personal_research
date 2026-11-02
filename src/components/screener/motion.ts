/**
 * BoardUI entrances for things a click brings in (a starred star, the
 * "Saved" check, a filter row just added), played with the Web Animations
 * API on the element itself: unlike a CSS animation class, a screen that
 * Next hides and shows again doesn't replay them, and a Settle scope
 * (components/motion/Settle, which retires played CSS entrances) doesn't
 * touch them.
 */

/** globals.css `pop`: a small element condensing in. */
export const POP: Keyframe[] = [
  { opacity: 0, transform: "scale(0.95)", filter: "blur(2px)" },
  { opacity: 1, transform: "none", filter: "blur(0px)" },
];

/** globals.css `enter`: a block condensing into place. */
export const ENTER: Keyframe[] = [
  { opacity: 0, transform: "scale(0.985)", filter: "blur(2px)" },
  { opacity: 1, transform: "none", filter: "blur(0px)" },
];

/** BoardUI's ease-out for movement with presence (--ease-board). */
const EASE_BOARD = "cubic-bezier(0.22, 1, 0.36, 1)";

export function play(el: Element | null | undefined, keyframes: Keyframe[], duration: number) {
  if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  el.animate(keyframes, { duration, easing: EASE_BOARD });
}
