import type { ReactNode } from "react";
import type { NavKey } from "./nav";
import { DEFAULT_ASK_LABEL, DEFAULT_SYMBOL, type HeaderQuote } from "./page-state";
import { ScreenTransition, ShellPagePublisher } from "./ShellPage";

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
 * A screen's content inside the persistent shell. The sidebar and top bar
 * live in the root layout (ShellFrame) and stay mounted across navigations;
 * this hands them the screen's bits (active item, symbol, quote, ask label)
 * and lays out the screen's columns.
 *
 * The columns sit in a React <ViewTransition> (ScreenTransition) with no
 * DOM node above it in the screen, so moving to another screen swaps them
 * with BoardUI's blur-out / blur-in (page-exit / page-enter in globals.css)
 * while the shell stays put. It is keyed on the screen only: a route change
 * within a screen (note to note, ticker to ticker) is left to the screen's
 * own transitions, with no page swap on top.
 */
export function AppShell({
  active,
  symbol = DEFAULT_SYMBOL,
  quote,
  askLabel = DEFAULT_ASK_LABEL,
  children,
}: AppShellProps) {
  return (
    <>
      <ShellPagePublisher active={active} symbol={symbol} quote={quote} askLabel={askLabel} />
      <ScreenTransition screen={active ?? "page"}>
        <div className="flex min-w-0 flex-wrap items-stretch gap-4">{children}</div>
      </ScreenTransition>
    </>
  );
}
