// BoardUI entrances for things that appear in response to the user (a tab's
// panel, the Watch star), run with the Web Animations API: unlike the CSS
// animate-* utilities they never replay when Next shows a hidden page again,
// and the screen's Settle wrapper doesn't retire them.

const EASE_BOARD = "cubic-bezier(0.22, 1, 0.36, 1)";

const RECIPES = {
  /** A block condensing into place (globals.css `enter`). */
  enter: {
    keyframes: [
      { opacity: 0, transform: "scale(0.985)", filter: "blur(2px)" },
      { opacity: 1, transform: "none", filter: "blur(0px)" },
    ],
    duration: 360,
  },
  /** A small element condensing in (globals.css `pop`). */
  pop: {
    keyframes: [
      { opacity: 0, transform: "scale(0.95)", filter: "blur(2px)" },
      { opacity: 1, transform: "none", filter: "blur(0px)" },
    ],
    duration: 200,
  },
} satisfies Record<string, { keyframes: Keyframe[]; duration: number }>;

/** Play an entrance on an element (skipped under reduced motion). */
export function playEntrance(el: Element | null | undefined, recipe: keyof typeof RECIPES) {
  if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const { keyframes, duration } = RECIPES[recipe];
  el.animate(keyframes, { duration, easing: EASE_BOARD });
}
