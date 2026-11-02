"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { RiSearchLine } from "@remixicon/react";
import { IconButton } from "@/components/base/buttons/icon-button";
import { Kbd } from "@/components/base/kbd/kbd";
import { Skeleton } from "@/components/base/skeleton/skeleton";
import { AnimatedValue } from "@/components/motion/AnimatedValue";
import { cx } from "@/utils/cx";
import { whenIdle } from "./preload";
import { useShellPage } from "./ShellPage";

// The palette (React Aria's autocomplete, the ticker universe, the note
// index) loads on demand: fetched once the page is idle, or as soon as the
// pill is hovered or focused, so ⌘K and clicks still open it at once.
const loadPalette = () => import("./SearchPalette");
const SearchPalette = dynamic(() => import("./SearchPalette").then((m) => m.SearchPalette), { ssr: false });

// BoardUI's quick-search pill (the dashboard sidebar's Quick Search row).
const PILL = cx(
  "flex min-w-0 cursor-pointer items-center gap-2 rounded-full bg-background-tertiary-default py-2 ps-3 pe-2 text-start",
  "transition-colors duration-150 ease hover:bg-background-tertiary-hover active:bg-background-quaternary-hover",
  "outline-none focus-visible:ring-2 focus-visible:ring-border-focus-ring",
);

const LABEL = "Search tickers, companies and notes";

/**
 * The top bar's search: a pill that opens the ⌘K palette (an icon button on
 * phones). On stock pages the pill shows the current quote instead of the
 * prompt, and still opens search.
 */
export function SearchTrigger({ live, className }: { live: boolean; className?: string }) {
  const { quote, quotePending, symbol } = useShellPage();
  const [open, setOpen] = useState(false);
  // Mounted on first use, then kept so it can animate out.
  const [used, setUsed] = useState(false);
  const show = () => {
    setUsed(true);
    setOpen(true);
  };

  useEffect(() => whenIdle(loadPalette), []);

  // ⌘K / Ctrl+K toggles the palette from anywhere, before it has loaded too.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "k") return;
      event.preventDefault();
      setUsed(true);
      setOpen((isOpen) => !isOpen);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const shownSymbol = quote?.symbol ?? (quotePending ? symbol : undefined);
  const preload = () => void loadPalette();

  return (
    <>
      <button
        type="button"
        aria-label={shownSymbol ? `${LABEL} — current symbol ${shownSymbol}` : LABEL}
        aria-haspopup="dialog"
        aria-keyshortcuts="Meta+K Control+K"
        onClick={show}
        onPointerEnter={preload}
        onFocus={preload}
        className={cx(
          PILL,
          shownSymbol ? "max-sm:order-last max-sm:basis-full" : "max-sm:hidden",
          "w-full max-w-[440px] flex-1",
          className,
        )}
      >
        <RiSearchLine className="size-5 shrink-0 text-foreground-icon-secondary" aria-hidden />
        {shownSymbol ? (
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="flex min-w-0 items-baseline gap-1.5 truncate text-body-semibold text-text-primary">
              {shownSymbol}
              {quote ? (
                <>
                  <AnimatedValue value={quote.price} className="text-body-medium" />
                  <AnimatedValue
                    value={quote.change}
                    className={cx(
                      "text-body-medium transition-colors duration-200 ease-out",
                      quote.up ? "text-text-positive" : "text-text-negative",
                    )}
                  />
                </>
              ) : (
                <span aria-hidden className="flex items-center gap-1.5 self-center">
                  <Skeleton shape="text" className="h-3.5 w-14" />
                  <Skeleton shape="text" className="h-3.5 w-24" />
                </span>
              )}
            </span>
            {quote ? (
              <AnimatedValue value={quote.asOf} className="truncate text-caption-1-regular text-text-tertiary" />
            ) : (
              <span aria-hidden className="flex h-4 items-center">
                <Skeleton shape="text" className="h-3 w-36" />
              </span>
            )}
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
        onClick={show}
        onPointerEnter={preload}
        onFocus={preload}
        className={cx("sm:hidden", className)}
      />
      {used && <SearchPalette isOpen={open} onOpenChange={setOpen} live={live} />}
    </>
  );
}
