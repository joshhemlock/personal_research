import { flushSync } from "react-dom";

/**
 * Animates an update that changes the results rows with a view transition:
 * rows that stay glide to their new places, new rows condense in (staggered),
 * leaving rows blur out. The recipes are the app's shared row classes
 * (globals.css) plus the stagger steps in screener.css. Only the rows are
 * named: named elements don't take clicks while a transition runs, and the
 * pager below must keep up with quick clicks.
 *
 * Why not a React <ViewTransition> per row: React Aria's table builds its
 * rows from a collection that reaches the DOM through useSyncExternalStore,
 * in a second, synchronous commit after the transition's own. React's
 * <ViewTransition> only sees the first commit, finds no row changed and
 * cancels itself. So the rows are named here, the way React names them
 * (an inline view-transition-name for the transition's lifetime), and the
 * update is flushed inside the browser's transition so both commits land in
 * the new snapshot.
 */

/** Entrance stagger: one step per row, capped so a full page lands within ~210ms. */
const STAGGER_STEPS = 7;

/** Bumped per transition: only the latest one clears the row names. */
let generation = 0;

function rowsOf(table: HTMLTableElement): HTMLTableRowElement[] {
  return [...table.querySelectorAll<HTMLTableRowElement>(":scope > tbody > tr[data-key]")];
}

function nameRows(table: HTMLTableElement) {
  rowsOf(table).forEach((tr, i) => {
    tr.style.setProperty("view-transition-name", `sr-${CSS.escape(tr.dataset.key ?? String(i))}`);
    // One class list for every row: which recipe applies depends on whether
    // the row has an old image, a new one, or both (see globals.css).
    tr.style.setProperty("view-transition-class", `row-move row-enter row-exit sr-d${Math.min(i, STAGGER_STEPS)}`);
  });
}

function unnameRows(table: HTMLTableElement) {
  for (const tr of rowsOf(table)) {
    tr.style.removeProperty("view-transition-name");
    tr.style.removeProperty("view-transition-class");
  }
}

function canAnimate(table: HTMLTableElement | null): table is HTMLTableElement {
  return (
    table !== null &&
    typeof document.startViewTransition === "function" &&
    document.visibilityState === "visible" &&
    // Next keeps visited screens alive while hidden: no snapshots of an unseen table.
    table.checkVisibility() &&
    !matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** Runs `update` (a state change that moves the rows of `table`) inside a view transition. */
export function transitionRows(table: HTMLTableElement | null, update: () => void) {
  if (!canAnimate(table)) {
    update();
    return;
  }
  const mine = ++generation;
  // Old snapshot: the rows as they are.
  nameRows(table);
  const transition = document.startViewTransition(() => {
    flushSync(update);
    // New snapshot: the rows as they are now, entering ones included.
    nameRows(table);
  });
  transition.finished.finally(() => {
    if (mine === generation) unnameRows(table);
  });
}
