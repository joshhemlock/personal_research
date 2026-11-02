import { flushSync } from "react-dom";

/**
 * Animates an update that changes the rows of a React Aria table with a view
 * transition: rows that stay glide to their new places (row-move), new rows
 * condense in top to bottom (row-enter, staggered 30ms a row up to 210ms by
 * the row-d1…row-d7 steps), leaving rows blur out (row-exit), and content
 * below the table that the change moves glides with it (card-move). The
 * recipes live in globals.css. Shared by the Overview watchlist and the
 * Screener results.
 *
 * Why not a React <ViewTransition> per row: React Aria's table builds its
 * rows from a collection that reaches the DOM through useSyncExternalStore,
 * in a second, synchronous commit after the transition's own. React's
 * <ViewTransition> only sees the first commit, finds no row changed and
 * cancels itself. So the rows are named here the way React names them (an
 * inline view-transition-name for the transition's lifetime), and the update
 * is flushed inside the browser's transition (flushSync also flushes React
 * Aria's follow-up commit) so both land in the new snapshot.
 *
 * Only rows and the followers are named: named elements don't take clicks
 * while a transition runs, so the controls that drive the change (filters,
 * a pager) stay outside it and keep up with quick clicks. Like React, it
 * leaves the document root out of the capture, so the rest of the page
 * stays live. Without the API, in a hidden tab, for a table Next is keeping
 * hidden, or under reduced motion, the update simply runs.
 */

type RowTransitionOptions = {
  /** Prefix for the transition names, unique among tables on screen. */
  name?: string;
  /** Content below the table that moves when it changes height. */
  followers?: () => Iterable<HTMLElement> | null | undefined;
};

/** Entrance stagger: one step per row, capped so a full page lands within ~210ms. */
const STAGGER_STEPS = 7;

/** Bumped per transition; an element is cleared only by the last transition that named it. */
let generation = 0;
const namedBy = new WeakMap<HTMLElement, number>();
let rootNamedBy = 0;

function rowsOf(table: HTMLTableElement): HTMLTableRowElement[] {
  return [...table.querySelectorAll<HTMLTableRowElement>(":scope > tbody > tr[data-key]")];
}

function canAnimate(table: HTMLTableElement | null): table is HTMLTableElement {
  return (
    table !== null &&
    typeof document.startViewTransition === "function" &&
    document.visibilityState === "visible" &&
    // Next keeps visited screens alive while hidden: no snapshots of an unseen table.
    table.checkVisibility() &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** Runs `update` (a state change that moves the rows of `table`) inside a view transition. */
export function transitionRows(table: HTMLTableElement | null, update: () => void, options: RowTransitionOptions = {}) {
  if (!canAnimate(table)) {
    update();
    return;
  }
  const prefix = options.name ?? "rows";
  const mine = ++generation;
  const named = new Set<HTMLElement>();
  const name = (el: HTMLElement, vtName: string, vtClass: string) => {
    el.style.setProperty("view-transition-name", vtName);
    el.style.setProperty("view-transition-class", vtClass);
    namedBy.set(el, mine);
    named.add(el);
  };
  const nameAll = () => {
    rowsOf(table).forEach((tr, i) => {
      // One class list for every row: which recipe applies depends on whether
      // the row has an old image, a new one, or both (see globals.css).
      const step = Math.min(i, STAGGER_STEPS);
      name(tr, `${prefix}-${CSS.escape(tr.dataset.key ?? String(i))}`, `row-move row-enter row-exit row-d${step}`);
    });
    let i = 0;
    for (const el of options.followers?.() ?? []) name(el, `${prefix}-follower-${i++}`, "card-move");
  };

  const root = document.documentElement;
  // Old snapshot: the rows as they are.
  nameAll();
  root.style.setProperty("view-transition-name", "none");
  rootNamedBy = mine;
  const transition = document.startViewTransition(() => {
    flushSync(update);
    // New snapshot: the rows as they are now, entering ones included.
    nameAll();
  });
  const clear = () => {
    for (const el of named) {
      if (namedBy.get(el) !== mine) continue;
      el.style.removeProperty("view-transition-name");
      el.style.removeProperty("view-transition-class");
    }
    if (rootNamedBy === mine) root.style.removeProperty("view-transition-name");
  };
  // A transition skipped by a newer one rejects `ready`; its update still ran.
  transition.ready.catch(() => {});
  transition.finished.then(clear, clear);
}
