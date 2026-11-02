import Link from "next/link";
import { Avatar } from "@/components/base/avatar/avatar";
import { cx } from "@/utils/cx";
import { OpenPaletteButton } from "./OpenPaletteButton";
import type { OpenTab } from "./types";

// BoardUI's gray pill tab, as links: the open ticker sits on the tertiary
// surface, the others take the hover surface.
const TAB = cx(
  "flex shrink-0 items-center gap-2 rounded-2lg py-1.5 ps-1.5 pe-2.5 text-body-medium whitespace-nowrap",
  "transition-colors duration-150 ease outline-none focus-visible:ring-2 focus-visible:ring-border-focus-ring",
);

/** Tabs for the tickers the user has open; the current one is selected. */
export function TickerTabs({ current, tabs }: { current: string; tabs: readonly OpenTab[] }) {
  return (
    <nav aria-label="Open tickers" className="flex flex-wrap items-center gap-1">
      <OpenPaletteButton label="Open another ticker" className="me-1" />
      {tabs.map(({ symbol, name }) => {
        const on = symbol === current;
        return (
          <Link
            key={symbol}
            href={`/stock/${symbol}`}
            aria-current={on ? "page" : undefined}
            className={cx(
              TAB,
              on
                ? "bg-background-tertiary-default text-text-primary"
                : "text-text-secondary hover:bg-background-primary-hover hover:text-text-primary active:bg-background-primary-active",
            )}
          >
            <Avatar size="xs" initials={symbol.charAt(0)} />
            {name}
          </Link>
        );
      })}
    </nav>
  );
}
