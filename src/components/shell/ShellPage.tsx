"use client";

import { createContext, useContext, useLayoutEffect, useState, useSyncExternalStore, type ReactNode } from "react";
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
  subscribe: (listener: () => void) => () => void;
};

function createStore(): Store {
  let entry: Entry | null = null;
  const listeners = new Set<() => void>();
  return {
    get: () => entry,
    set(next) {
      entry = next;
      listeners.forEach((listener) => listener());
    },
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
