import { ViewTransition, type ReactNode } from "react";
import { isSample } from "@/lib/data/source";
import type { NavKey } from "./nav";
import { ShellFrame } from "./ShellFrame";
import { TopBar, type HeaderQuote } from "./TopBar";

type AppShellProps = {
  /** Which navigation item is the current page, if any. */
  active?: NavKey;
  /** Symbol the Chart and Financials links open. */
  symbol?: string;
  /** Show this quote in the top bar's search pill instead of the search prompt. */
  quote?: HeaderQuote;
  /** No longer used: the icon rail it padded is gone. Kept so callers compile. */
  railClassName?: string;
  /** Overrides the sidebar's "ask" tool label. */
  askLabel?: string;
  /** The screen's columns (main, aside…). They wrap when there's no room side by side. */
  children: ReactNode;
};

/**
 * BoardUI's dashboard layout around every screen: the sidebar (a drawer on
 * phones), the top bar, then the screen's columns on the page ground.
 */
export function AppShell({ active, symbol = "NVDA", quote, askLabel = "Ask a research question", children }: AppShellProps) {
  return (
    <ShellFrame sidebar={{ active, symbol, askLabel, live: !isSample }}>
      <TopBar quote={quote} />
      {/* Keyed by screen: navigating to another screen (or symbol) swaps the
          columns with BoardUI's blur-out / blur-in (see globals.css). */}
      <ViewTransition key={`${active ?? "page"}:${symbol}`} enter="page-enter" exit="page-exit" default="none">
        <div className="flex min-w-0 flex-wrap items-stretch gap-4">{children}</div>
      </ViewTransition>
    </ShellFrame>
  );
}
