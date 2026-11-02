"use client";

import { useState } from "react";
import { RiSearchLine } from "@remixicon/react";
import { IconButton } from "@/components/base/buttons/icon-button";
import { Kbd } from "@/components/base/kbd/kbd";
import { cx } from "@/utils/cx";
import { SearchPalette } from "./SearchPalette";
import type { HeaderQuote } from "./TopBar";

// BoardUI's quick-search pill (the dashboard sidebar's Quick Search row).
const PILL = cx(
  "flex min-w-0 cursor-pointer items-center gap-2 rounded-full bg-background-tertiary-default py-2 ps-3 pe-2 text-start",
  "transition-colors duration-150 ease hover:bg-background-tertiary-hover",
  "outline-none focus-visible:ring-2 focus-visible:ring-border-focus-ring",
);

const LABEL = "Search tickers, companies and notes";

/**
 * The top bar's search: a pill that opens the ⌘K palette (an icon button on
 * phones). On stock pages the pill shows the current quote instead of the
 * prompt, and still opens search.
 */
export function SearchTrigger({ quote, live, className }: { quote?: HeaderQuote; live: boolean; className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        aria-label={quote ? `${LABEL} — current symbol ${quote.symbol}` : LABEL}
        aria-haspopup="dialog"
        aria-keyshortcuts="Meta+K Control+K"
        onClick={() => setOpen(true)}
        className={cx(
          PILL,
          quote ? "max-sm:order-last max-sm:basis-full" : "max-sm:hidden",
          "w-full max-w-[440px] flex-1",
          className,
        )}
      >
        <RiSearchLine className="size-5 shrink-0 text-foreground-icon-secondary" aria-hidden />
        {quote ? (
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="flex min-w-0 items-baseline gap-1.5 truncate text-body-semibold text-text-primary">
              {quote.symbol}
              <span className="text-body-medium">{quote.price}</span>
              <span className={cx("text-body-medium", quote.up ? "text-text-positive" : "text-text-negative")}>
                {quote.change}
              </span>
            </span>
            <span className="truncate text-caption-1-regular text-text-tertiary">{quote.asOf}</span>
          </span>
        ) : (
          <span className="min-w-0 flex-1 truncate text-body-medium text-text-secondary">Search tickers, companies, notes</span>
        )}
        <Kbd className="max-sm:hidden">⌘K</Kbd>
      </button>
      <IconButton
        icon={RiSearchLine}
        aria-label={LABEL}
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
        className={cx("sm:hidden", className)}
      />
      <SearchPalette isOpen={open} onOpenChange={setOpen} live={live} />
    </>
  );
}
