import { flushSync } from "react-dom";

type ListTransitionOptions = {
  /** Prefix for the transition names, unique on the page. */
  name: string;
  /** The list's rows, read before and after the change. */
  rows: () => Iterable<HTMLElement> | undefined;
  /** A row's stable identity (e.g. React Aria's data-key). */
  keyOf: (row: HTMLElement) => string | undefined;
  /** The card holding the list: it resizes with it. */
  frame?: HTMLElement | null;
  /** Content below the list that moves when the list changes height. */
  followers?: () => Iterable<HTMLElement> | undefined;
};

const ident = (key: string) => key.replace(/[^A-Za-z0-9_-]/g, "_");

/**
 * Runs `update` (a state change) as a view transition in which every row of
 * a list is its own group: rows that leave blur out (row-exit), rows that
 * arrive condense in (row-enter), rows that stay glide to their new place
 * (row-move), and the card and the content below glide with the list's new
 * height (card-move). The CSS lives in globals.css.
 *
 * React's <ViewTransition> does this declaratively, but React Aria's
 * collections (Table, GridList…) render their rows in a follow-up render
 * after the commit that changed the data, outside React's transition, so
 * their rows never animate. Here the update is flushed synchronously
 * (flushSync also flushes React Aria's follow-up render) inside
 * document.startViewTransition, and the names exist only for the length of
 * the transition, so page and theme transitions never see them. Like
 * React's, the document root isn't captured: everything else stays live.
 *
 * Falls back to a plain update without the API, under reduced motion, or
 * in a hidden tab.
 */
export function runListTransition(update: () => void, options: ListTransitionOptions) {
  const doc = document;
  if (
    typeof doc.startViewTransition !== "function" ||
    doc.visibilityState !== "visible" ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    update();
    return;
  }

  const named = new Set<HTMLElement>();
  const name = (el: HTMLElement, vtName: string, vtClass: string) => {
    el.style.viewTransitionName = vtName;
    el.style.setProperty("view-transition-class", vtClass);
    named.add(el);
  };
  const tag = () => {
    for (const row of options.rows() ?? []) {
      const key = options.keyOf(row);
      if (key) name(row, `${options.name}-row-${ident(key)}`, "row-enter row-exit row-move");
    }
    if (options.frame) name(options.frame, `${options.name}-frame`, "card-move");
    let i = 0;
    for (const el of options.followers?.() ?? []) name(el, `${options.name}-follower-${i++}`, "card-move");
  };

  const root = doc.documentElement;
  const rootName = root.style.viewTransitionName;
  tag();
  root.style.viewTransitionName = "none";
  const transition = doc.startViewTransition(() => {
    flushSync(update);
    tag();
  });
  const clear = () => {
    for (const el of named) {
      el.style.viewTransitionName = "";
      el.style.removeProperty("view-transition-class");
    }
    root.style.viewTransitionName = rootName;
  };
  // A transition skipped by a newer one rejects `ready`; the update still ran.
  transition.ready.catch(() => {});
  transition.finished.then(clear, clear);
}
