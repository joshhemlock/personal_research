"use client";

import {
  createContext,
  useContext,
  useLayoutEffect,
  useState,
  useSyncExternalStore,
  ViewTransition,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { pageForPath, type ShellPage } from "./page-state";

/**
 * How a screen hands its bits (active item, symbol, quote, ask label) to the
 * persistent shell in the root layout. The shell renders before the screen,
 * so it starts from what the URL implies (pageForPath) and the screen's
 * AppShell publishes the rest as it commits. An entry only counts for the
 * pathname it was published on: while the next screen loads, the shell
 * follows the new URL rather than the screen that just left.
 */
type Entry = ShellPage & { path: string };

type Store = {
  get: () => Entry | null;
  set: (entry: Entry | null) => void;
  /** The screen shown before the current one (kept when a screen withdraws). */
  previous: () => Entry | null;
  subscribe: (listener: () => void) => () => void;
};

function createStore(): Store {
  let entry: Entry | null = null;
  // The last two screens published, by route: survives withdrawals, so a
  // loading state in between doesn't lose where the user came from.
  let current: Entry | null = null;
  let previous: Entry | null = null;
  const listeners = new Set<() => void>();
  return {
    get: () => entry,
    set(next) {
      entry = next;
      if (next && next.path !== current?.path) {
        previous = current;
        current = next;
      }
      listeners.forEach((listener) => listener());
    },
    previous: () => previous,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

const StoreContext = createContext<Store | null>(null);

const serverSnapshot = () => null;

export function ShellPageProvider({ children }: { children: ReactNode }) {
  const [store] = useState(createStore);
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

function useStore(): Store {
  const store = useContext(StoreContext);
  if (!store) throw new Error("Shell components must render inside ShellPageProvider.");
  return store;
}

/** The shell's state for the screen on view. */
export function useShellPage(): ShellPage {
  const store = useStore();
  const pathname = usePathname();
  const entry = useSyncExternalStore(store.subscribe, store.get, serverSnapshot);
  return entry && entry.path === pathname ? entry : pageForPath(pathname);
}

/**
 * Hands a screen's shell state over while the screen is on view. Renders
 * nothing; a layout effect publishes before paint, so the sidebar and top
 * bar update in the same frame as the screen.
 */
export function ShellPagePublisher({ active, symbol, askLabel, quote }: ShellPage) {
  const store = useStore();
  const pathname = usePathname();
  // Server props arrive as fresh objects on every render: compare by value.
  const quoteKey = quote ? [quote.symbol, quote.price, quote.change, quote.up, quote.asOf].join("|") : "";
  useLayoutEffect(() => {
    const entry: Entry = { active, symbol, askLabel, quote, path: pathname };
    store.set(entry);
    // Hidden (Next keeps recent screens in an Activity) or gone: withdraw,
    // unless the next screen has already published.
    return () => {
      if (store.get() === entry) store.set(null);
    };
    // `quote` is covered by quoteKey.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store, pathname, active, symbol, askLabel, quoteKey]);
  return null;
}

/** The page transition's screen key: the nav item, or "page" for screens outside the nav. */
const screenKey = (active: string | undefined) => active ?? "page";

/** Takes one side of a running page transition out: the new side shows at once, the old one hides. */
function skip(name: string, side: "old" | "new") {
  const root = document.documentElement;
  const pseudo = `::view-transition-${side}(${name})`;
  for (const animation of root.getAnimations({ subtree: true })) {
    if ((animation.effect as KeyframeEffect | null)?.pseudoElement === pseudo) animation.cancel();
  }
  if (side === "old") root.animate({ opacity: [0, 0] }, { duration: 1, fill: "forwards", pseudoElement: pseudo });
}

/**
 * A screen's content in BoardUI's page transition: moving to another screen
 * blurs this one out (page-exit) and the next one in (page-enter).
 *
 * A route change within the same screen (note to note, ticker to ticker)
 * mounts a fresh copy of the screen too, but is left to the screen's own
 * transitions: the page-level swap is skipped on both sides, so nothing
 * double-animates. That is decided as each side animates, from where the
 * user came from (the store) and where they are going (the URL), since a
 * loading state can put the exit and the enter in separate transitions.
 */
export function ScreenTransition({ screen, children }: { screen: string; children: ReactNode }) {
  const store = useStore();
  return (
    <ViewTransition
      key={screen}
      enter="page-enter"
      exit="page-exit"
      default="none"
      onEnter={(instance) => {
        const from = store.previous();
        if (from && screenKey(from.active) === screen) skip(instance.name, "new");
      }}
      onExit={(instance) => {
        if (screenKey(pageForPath(window.location.pathname).active) === screen) skip(instance.name, "old");
      }}
    >
      {children}
    </ViewTransition>
  );
}
