"use client";

import { lazy, Suspense, useEffect, useState } from "react";
import { RiSearchLine } from "@remixicon/react";
import { IconButton } from "@/components/base/buttons/icon-button";
import { Kbd } from "@/components/base/kbd/kbd";
import { Skeleton } from "@/components/base/skeleton/skeleton";
import { AnimatedValue } from "@/components/motion/AnimatedValue";
import { cx } from "@/utils/cx";
import { whenIdle } from "./preload";
import type { ShellPage } from "./page-state";
import { useShellPage } from "./ShellPage";

// The palette (React Aria's autocomplete, the ticker universe, the note
// index) loads on demand: fetched once the page is idle, or as soon as the
// pill is hovered or focused, so ⌘K and clicks still open it at once.
// One import() shared by the preload and the component, so both use the
// same chunk (next/dynamic would build a second copy of it).
let palette: Promise<typeof import("./SearchPalette")> | undefined;
const loadPalette = () => (palette ??= import("./SearchPalette"));
const SearchPalette = lazy(() => loadPalette().then((m) => ({ default: m.SearchPalette })));

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
  const [open, setOpen] = useState(false);
  // Mounted on first use, then kept so it can animate out.
  const [used, setUsed] = useState(false);
  const show = () => {
    setUsed(true);
    setOpen(true);
  };
  const preload = () => void loadPalette();

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

  return (
    <>
      {/* The pill follows the URL (the quote on stock pages); a prerender
          that can't know it (a route param outside generateStaticParams)
          shows the search prompt until the request fills it in. */}
      <Suspense fallback={<SearchPill onOpen={show} onIntent={preload} className={className} />}>
        <RoutedSearchPill onOpen={show} onIntent={preload} className={className} />
      </Suspense>
      <IconButton
        icon={RiSearchLine}
        aria-label={LABEL}
        aria-haspopup="dialog"
        onClick={show}
        onPointerEnter={preload}
        onFocus={preload}
        className={cx("sm:hidden", className)}
      />
      {used && (
        <Suspense fallback={null}>
          <SearchPalette isOpen={open} onOpenChange={setOpen} live={live} />
        </Suspense>
      )}
    </>
  );
}

type PillProps = {
  onOpen: () => void;
  /** Hover or focus: fetch the palette ahead of the click. */
  onIntent: () => void;
  className?: string;
};

function RoutedSearchPill(props: PillProps) {
  return <SearchPill page={useShellPage()} {...props} />;
}

function SearchPill({ page, onOpen, onIntent, className }: PillProps & { page?: ShellPage }) {
  const quote = page?.quote;
  const shownSymbol = quote?.symbol ?? (page?.quotePending ? page.symbol : undefined);
  return (
    <button
      type="button"
      aria-label={shownSymbol ? `${LABEL} — current symbol ${shownSymbol}` : LABEL}
      aria-haspopup="dialog"
      aria-keyshortcuts="Meta+K Control+K"
      onClick={onOpen}
      onPointerEnter={onIntent}
      onFocus={onIntent}
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
              // Until the stock page hands its quote over. Usually that's
              // the same frame; the placeholder only shows if it isn't.
              <span aria-hidden className="flex animate-wait items-center gap-1.5 self-center">
                <Skeleton shape="text" className="h-3.5 w-14" />
                <Skeleton shape="text" className="h-3.5 w-24" />
              </span>
            )}
          </span>
          {quote ? (
            <AnimatedValue value={quote.asOf} className="truncate text-caption-1-regular text-text-tertiary" />
          ) : (
            <span aria-hidden className="flex h-4 animate-wait items-center">
              <Skeleton shape="text" className="h-3 w-36" />
            </span>
          )}
        </span>
      ) : (
        <span className="min-w-0 flex-1 truncate text-body-medium text-text-secondary">Search tickers, companies, notes</span>
      )}
      <Kbd className="max-sm:hidden">⌘K</Kbd>
    </button>
  );
}
