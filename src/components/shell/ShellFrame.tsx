"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { RiMenuLine } from "@remixicon/react";
import { IconButton } from "@/components/base/buttons/icon-button";
import { Drawer } from "@/components/base/drawer/drawer";
import { Sidebar, type SidebarProps } from "./Sidebar";

const OpenNavContext = createContext<(() => void) | null>(null);

type ShellFrameProps = {
  sidebar: Omit<SidebarProps, "mobile" | "onClose" | "className">;
  children: ReactNode;
};

/**
 * BoardUI's dashboard frame: the floating sidebar beside the page column from
 * `lg` up; below it the sidebar rides in from the start edge as a drawer,
 * opened by the top bar's menu button.
 */
export function ShellFrame({ sidebar, children }: ShellFrameProps) {
  const [navOpen, setNavOpen] = useState(false);
  return (
    <OpenNavContext.Provider value={() => setNavOpen(true)}>
      <div className="flex min-h-dvh items-start gap-4 bg-background-full p-3 max-sm:p-2">
        <div className="sticky top-3 hidden h-[calc(100dvh-24px)] shrink-0 lg:flex">
          <Sidebar {...sidebar} />
        </div>
        <Drawer
          isOpen={navOpen}
          onOpenChange={setNavOpen}
          placement="start"
          size="sm"
          aria-label="Navigation"
          className="gap-0 border-0 bg-transparent py-0 shadow-none"
        >
          {/* A link closes the drawer: the next screen should open without it. */}
          <div
            className="flex h-full"
            onClickCapture={(event) => {
              if ((event.target as HTMLElement).closest("a[href]")) setNavOpen(false);
            }}
          >
            <Sidebar {...sidebar} mobile onClose={() => setNavOpen(false)} />
          </div>
        </Drawer>
        <div className="flex min-w-0 flex-1 flex-col gap-6 pt-1.5 pb-6">{children}</div>
      </div>
    </OpenNavContext.Provider>
  );
}

/** Opens the navigation drawer; shown below `lg`, where the sidebar is hidden. */
export function NavMenuButton({ className }: { className?: string }) {
  const openNav = useContext(OpenNavContext);
  return (
    <IconButton
      icon={RiMenuLine}
      aria-label="Open navigation"
      aria-haspopup="dialog"
      onClick={() => openNav?.()}
      className={className}
    />
  );
}
