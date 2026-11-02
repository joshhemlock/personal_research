"use client";

import {
  createContext,
  lazy,
  Suspense,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { RiMenuLine } from "@remixicon/react";
import { IconButton } from "@/components/base/buttons/icon-button";
import { cx } from "@/utils/cx";
import { whenIdle } from "./preload";
import { ShellPageProvider } from "./ShellPage";
import { Sidebar, SidebarFallback } from "./Sidebar";

// One import() shared by the preload and the component (same chunk).
let navDrawer: Promise<typeof import("./NavDrawer")> | undefined;
const loadNavDrawer = () => (navDrawer ??= import("./NavDrawer"));
const NavDrawer = lazy(() => loadNavDrawer().then((m) => ({ default: m.NavDrawer })));

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
 *
 * Collapsing or expanding the rail: its slot takes the new width at once,
 * so the page column re-flows a single time (a chart redraws once, not on
 * every frame); the rail keeps BoardUI's own 300ms width morph inside the
 * slot, and the page glides from where it was with a transform on the same
 * clock, so both edges travel together.
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

  const [railCollapsed, setRailCollapsed] = useState(false);
  const pageRef = useRef<HTMLDivElement>(null);
  const glideFrom = useRef<number | null>(null);
  const glide = useRef<Animation | null>(null);
  const onCollapsedChange = (collapsed: boolean) => {
    glideFrom.current = pageRef.current?.getBoundingClientRect().left ?? null;
    setRailCollapsed(collapsed);
  };
  useLayoutEffect(() => {
    const page = pageRef.current;
    const from = glideFrom.current;
    glideFrom.current = null;
    if (!page || from === null) return;
    glide.current?.cancel();
    const dx = from - page.getBoundingClientRect().left;
    if (Math.abs(dx) < 1 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // BoardUI's rail morph: 300ms ease-in-out (dashboard-sidebar).
    glide.current = page.animate([{ transform: `translateX(${dx}px)` }, { transform: "none" }], {
      duration: 300,
      easing: "ease-in-out",
    });
  }, [railCollapsed]);

  // Below lg the drawer is the navigation: fetch it once the page is idle.
  useEffect(() => {
    if (window.matchMedia("(min-width: 64rem)").matches) return;
    return whenIdle(loadNavDrawer);
  }, []);

  return (
    <ShellPageProvider>
      <NavContext.Provider value={control}>
        {/* Clip: the page overhangs the viewport while it glides after a collapse. */}
        <div className="flex min-h-dvh items-start gap-4 overflow-x-clip bg-background-full p-3 max-sm:p-2">
          <div
            className={cx(
              "sticky top-3 hidden h-[calc(100dvh-24px)] shrink-0 lg:flex",
              // The rail's two widths (BoardUI's sidebar: 260px, 60px collapsed).
              railCollapsed ? "w-[60px]" : "w-[260px]",
            )}
          >
            {/* The sidebar follows the URL; a prerender that can't know it
                (a route param outside generateStaticParams) shows it with
                nothing selected until the request fills it in. */}
            <Suspense fallback={<SidebarFallback live={live} onCollapsedChange={onCollapsedChange} />}>
              <Sidebar live={live} onCollapsedChange={onCollapsedChange} />
            </Suspense>
          </div>
          {drawerUsed && (
            <Suspense fallback={null}>
              <NavDrawer isOpen={navOpen} onOpenChange={setNavOpen} live={live} />
            </Suspense>
          )}
          <div ref={pageRef} className="flex min-w-0 flex-1 flex-col gap-6 pt-1.5 pb-6">
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
