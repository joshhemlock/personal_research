"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { CommandPalette } from "./CommandPalette";
import type { HeaderQuote } from "./TopBar";

const PILL =
  "mx-auto flex h-[52px] max-w-[520px] flex-[1_1_340px] items-center gap-3 rounded-full border border-white/95 bg-white/80 px-[18px] text-ink shadow-[0_1px_2px_rgba(17,17,19,0.04),0_10px_30px_-14px_rgba(17,17,19,0.14)] backdrop-blur-[20px] transition-shadow hover:shadow-[0_1px_2px_rgba(17,17,19,0.06),0_12px_32px_-14px_rgba(17,17,19,0.22)]";

/** The center search pill. Opens the command palette on click or ⌘K / Ctrl+K. */
export function SearchTrigger({ quote }: { quote?: HeaderQuote }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <button
        type="button"
        aria-label={
          quote
            ? `Search tickers, companies and notes — current symbol ${quote.symbol}`
            : "Search tickers, companies and notes"
        }
        aria-haspopup="dialog"
        aria-keyshortcuts="Meta+K Control+K"
        onClick={() => setOpen(true)}
        className={PILL}
      >
        <Icon name="search" size={22} />
        {quote ? (
          <>
            <span className="flex flex-1 flex-col items-center leading-[1.25]">
              <span className="text-[15px] font-medium">
                {quote.symbol} {quote.price}{" "}
                <span className={quote.up ? "text-up-text" : "text-down-text"}>{quote.change}</span>
              </span>
              <span className="text-[12px] text-muted">{quote.asOf}</span>
            </span>
            <Icon name="filterLines" size={22} />
          </>
        ) : (
          <>
            <span className="flex-1 text-left text-[15px] text-ink-3">Search tickers, companies, notes</span>
            <span className="rounded-full bg-[rgba(17,17,19,0.06)] px-[9px] py-1 text-[12px] text-ink-2">⌘K</span>
          </>
        )}
      </button>
      <CommandPalette open={open} onClose={() => setOpen(false)} />
    </>
  );
}
