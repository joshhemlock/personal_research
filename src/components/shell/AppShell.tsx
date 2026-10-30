import type { ReactNode } from "react";
import { TopBar, type HeaderQuote } from "./TopBar";
import { Rail, type NavKey } from "./Rail";

type AppShellProps = {
  /** Which rail item is the current page. */
  active: NavKey;
  /** Symbol the Chart and Financials rail links open. */
  symbol?: string;
  /** Show this quote in the center pill instead of the search prompt. */
  quote?: HeaderQuote;
  /** Extra classes for the rail (e.g. bottom padding on the chart screen). */
  railClassName?: string;
  /** Overrides the rail's "ask" tool label. */
  askLabel?: string;
  /** The screen's columns (main, aside…). The rail is appended after them. */
  children: ReactNode;
};

/**
 * Page background, the rounded app frame, the top bar and the icon rail.
 * Screens render their columns as children; they wrap on narrow viewports.
 */
export function AppShell({ active, symbol = "NVDA", quote, railClassName, askLabel, children }: AppShellProps) {
  return (
    <div className="box-border min-h-screen bg-page p-[14px] max-sm:p-2">
      <div className="mx-auto box-border flex min-h-[calc(100vh-28px)] max-w-[1600px] flex-col gap-[14px] overflow-hidden rounded-[32px] border border-white bg-shell p-4 shadow-shell max-sm:rounded-[24px] max-sm:p-3">
        <TopBar quote={quote} />
        <div className="flex flex-wrap items-stretch gap-4">
          {children}
          <Rail active={active} symbol={symbol} askLabel={askLabel} className={railClassName} />
        </div>
      </div>
    </div>
  );
}
