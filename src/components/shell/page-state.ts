import type { NavKey } from "./nav";

/** The current stock in the top bar's search pill (stock pages). */
export type HeaderQuote = {
  symbol: string;
  price: string;
  /** e.g. "+3.95 (+2.14%)" */
  change: string;
  up: boolean;
  /** e.g. "Oct 30, 2026 · 11:51:04 AM" */
  asOf: string;
};

/** What the persistent shell shows for the screen on view. */
export type ShellPage = {
  /** The navigation item that is the current screen, if any. */
  active?: NavKey;
  /** Symbol the Chart and Financials links open. */
  symbol: string;
  /** Label of the sidebar's "ask" tool. */
  askLabel: string;
  /** Shown in the top bar's search pill instead of the search prompt. */
  quote?: HeaderQuote;
  /**
   * A stock screen whose quote hasn't reached the shell yet (first paint
   * before hydration, or while the screen loads): the pill holds the symbol
   * with placeholders, rather than flashing the search prompt.
   */
  quotePending?: boolean;
};

export const DEFAULT_SYMBOL = "NVDA";
export const DEFAULT_ASK_LABEL = "Ask a research question";

/**
 * The shell's state for a URL, before (or without) the screen handing over
 * its own. It matches what each screen passes to AppShell, so the first
 * paint and the loading state already mark the right navigation item and
 * label; the screen's AppShell then refines it (a note's symbol, the quote).
 */
export function pageForPath(pathname: string): ShellPage {
  const parts = pathname.split("/").filter(Boolean);
  const [first, second, third] = parts;
  const base = { symbol: DEFAULT_SYMBOL, askLabel: DEFAULT_ASK_LABEL };
  if (parts.length === 0) return { ...base, active: "overview" };
  if (first === "stock" && second && parts.length <= 3) {
    let symbol = second;
    try {
      symbol = decodeURIComponent(second);
    } catch {
      // A malformed escape: keep it as typed.
    }
    symbol = symbol.toUpperCase();
    if (parts.length === 2) return { ...base, active: "chart", symbol, quotePending: true };
    if (third === "financials") {
      return { active: "financials", symbol, askLabel: "Ask about these numbers", quotePending: true };
    }
  }
  if (first === "screener" && parts.length === 1) return { ...base, active: "screener" };
  if (first === "notes" && parts.length <= 2) return { ...base, active: "notes", askLabel: "Ask about this note" };
  return base;
}
