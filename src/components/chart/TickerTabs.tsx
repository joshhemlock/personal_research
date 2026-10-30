import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { OpenPaletteButton } from "./OpenPaletteButton";
import type { OpenTab } from "./types";

/** Browser-style tabs for the tickers the user has open; the current one is raised. */
export function TickerTabs({ current, tabs }: { current: string; tabs: readonly OpenTab[] }) {
  return (
    <nav aria-label="Open tickers" className="mt-auto flex flex-wrap items-end gap-1 pt-1">
      <OpenPaletteButton
        label="Open another ticker"
        className="inline-flex size-12 items-center justify-center rounded-[14px] text-ink-2 transition-colors hover:bg-[rgba(17,17,19,0.05)]"
      >
        <Icon name="plus" size={22} />
      </OpenPaletteButton>
      {tabs.map(({ symbol, name }) => {
        const on = symbol === current;
        return (
          <Link
            key={symbol}
            href={`/stock/${symbol}`}
            aria-current={on ? "page" : undefined}
            className={`inline-flex h-12 items-center gap-2.5 rounded-t-2xl px-[18px] text-[15px] transition-colors ${
              on ? "bg-white text-ink shadow-[0_-6px_16px_-10px_rgba(17,17,19,0.2)]" : "text-muted hover:text-ink"
            }`}
          >
            <span
              aria-hidden="true"
              className={`inline-flex size-[26px] items-center justify-center rounded-full text-[12px] font-semibold text-white ${
                on ? "bg-ink" : "bg-[#8A8A92]"
              }`}
            >
              {symbol.charAt(0)}
            </span>
            {name}
          </Link>
        );
      })}
    </nav>
  );
}
