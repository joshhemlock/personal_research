"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { RiMenuLine } from "@remixicon/react";
import { IconButton } from "@/components/base/buttons/icon-button";
import { whenIdle } from "./preload";
import { ShellPageProvider } from "./ShellPage";
import { Sidebar } from "./Sidebar";

const loadNavDrawer = () => import("./NavDrawer");
const NavDrawer = dynamic(() => import("./NavDrawer").then((m) => m.NavDrawer), { ssr: false });

type NavControl = { open: () => void; preload: () => void };
const NavContext = createContext<NavControl | null>(null);

type ShellFrameProps = {
  /** Live market data (TradingView) rather than the sample set. */
  live: boolean;
  /** The top bar (a server component, rendered once in the root layout). */
  topBar: ReactNode;
  /** The screen, wrapped in its AppShell. */
  children: ReactNode;
};

/**
 * BoardUI's dashboard frame, rendered once in the root layout so it persists
 * across navigations: the floating sidebar beside the page column from `lg`
 * up; below it the sidebar rides in from the start edge as a drawer, opened
 * by the top bar's menu button. Screens publish their bits (active item,
 * symbol, quote) through ShellPage.
 */
export function ShellFrame({ live, topBar, children }: ShellFrameProps) {
  const [navOpen, setNavOpen] = useState(false);
  // The drawer mounts on first use and stays, so it can animate out.
  const [drawerUsed, setDrawerUsed] = useState(false);
  const [control] = useState<NavControl>(() => ({
    open: () => {
      setDrawerUsed(true);
      setNavOpen(true);
    },
    preload: () => void loadNavDrawer(),
  }));

  // Below lg the drawer is the navigation: fetch it once the page is idle.
  useEffect(() => {
    if (window.matchMedia("(min-width: 64rem)").matches) return;
    return whenIdle(loadNavDrawer);
  }, []);

  return (
    <ShellPageProvider>
      <NavContext.Provider value={control}>
        <div className="flex min-h-dvh items-start gap-4 bg-background-full p-3 max-sm:p-2">
          <div className="sticky top-3 hidden h-[calc(100dvh-24px)] shrink-0 lg:flex">
            <Sidebar live={live} />
          </div>
          {drawerUsed && <NavDrawer isOpen={navOpen} onOpenChange={setNavOpen} live={live} />}
          <div className="flex min-w-0 flex-1 flex-col gap-6 pt-1.5 pb-6">
            {topBar}
            {children}
          </div>
        </div>
      </NavContext.Provider>
    </ShellPageProvider>
  );
}

/** Opens the navigation drawer; shown below `lg`, where the sidebar is hidden. */
export function NavMenuButton({ className }: { className?: string }) {
  const nav = useContext(NavContext);
  return (
    <IconButton
      icon={RiMenuLine}
      aria-label="Open navigation"
      aria-haspopup="dialog"
      onClick={() => nav?.open()}
      onPointerEnter={() => nav?.preload()}
      onFocus={() => nav?.preload()}
      className={className}
    />
  );
}
