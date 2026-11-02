"use client";

import { Drawer } from "@/components/base/drawer/drawer";
import { Sidebar } from "./Sidebar";

type NavDrawerProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  live: boolean;
};

/**
 * The sidebar as a drawer, below `lg`. Loaded on demand (ShellFrame
 * preloads it when the menu button is hovered, focused or the browser is
 * idle), so it stays out of the bundle every screen loads first.
 */
export function NavDrawer({ isOpen, onOpenChange, live }: NavDrawerProps) {
  return (
    <Drawer
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      placement="start"
      size="sm"
      aria-label="Navigation"
      className="gap-0 border-0 bg-transparent py-0 shadow-none"
    >
      {/* A link closes the drawer: the next screen should open without it. */}
      <div
        className="flex h-full"
        onClickCapture={(event) => {
          if ((event.target as HTMLElement).closest("a[href]")) onOpenChange(false);
        }}
      >
        <Sidebar live={live} mobile onClose={() => onOpenChange(false)} />
      </div>
    </Drawer>
  );
}
