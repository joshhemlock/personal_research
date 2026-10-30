import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { MINUS } from "@/lib/format";
import { PINNED, WATCH_GROUPS, type WatchRow } from "@/lib/mock/chart";
import { findSecurity } from "@/lib/mock/market";
import { CHART_ICONS } from "./icons";
import { OpenPaletteButton } from "./OpenPaletteButton";
import { WatchlistGroups } from "./WatchlistGroups";

const COLS = "grid grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_64px_64px] gap-2";
const ICON_BUTTON =
  "inline-flex size-9 items-center justify-center rounded-[10px] transition-colors hover:bg-[rgba(17,17,19,0.05)] hover:text-ink";

/** Symbols that have a chart page link to it; indexes don't. */
export const chartHref = (symbol: string) => (findSecurity(symbol) ? `/stock/${symbol}` : null);

const abs = (v: number) => (v < 0 ? MINUS : "") + Math.abs(v).toFixed(2);

/** Watchlist panel: pinned symbols, then collapsible groups. */
export function WatchlistPanel() {
  return (
    <section aria-labelledby="wl-h" className="glass rounded-[24px] px-[18px] pt-4 pb-1.5">
      <div className="mb-1 flex items-center justify-between gap-2">
        <h2 id="wl-h" className="text-[21px] font-normal tracking-[-0.01em]">
          Watchlist
        </h2>
        <span className="inline-flex text-ink-3">
          <OpenPaletteButton label="Add symbol" className={ICON_BUTTON}>
            <Icon name="plus" size={19} />
          </OpenPaletteButton>
          <button type="button" aria-label="Open in new window" className={ICON_BUTTON}>
            <Icon d={CHART_ICONS.external} size={18} linejoin="round" />
          </button>
          <button type="button" aria-label="Watchlist settings" className={ICON_BUTTON}>
            <Icon name="sliders" size={18} />
          </button>
        </span>
      </div>
      <div role="table" aria-label="Watchlist">
        <div role="row" className={`${COLS} pt-1 pb-2 text-[13px] text-muted`}>
          <span role="columnheader">Symbol</span>
          <span role="columnheader" className="text-right">
            Last
          </span>
          <span role="columnheader" className="text-right">
            Change
          </span>
          <span role="columnheader" className="text-right">
            Chg %
          </span>
        </div>
        {PINNED.map((row) => (
          <PinnedRow key={row.symbol} row={row} href={chartHref(row.symbol)} />
        ))}
      </div>
      <WatchlistGroups groups={WATCH_GROUPS.map((g) => ({ ...g, items: g.items.map((w) => ({ ...w, href: chartHref(w.symbol) })) }))} />
    </section>
  );
}

function PinnedRow({ row, href }: { row: WatchRow; href: string | null }) {
  const tone = row.change < 0 ? "text-down-text" : "text-up-text";
  return (
    <div
      role="row"
      className={`${COLS} relative min-h-[33px] items-center rounded-lg text-[14px] text-ink has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-focus`}
    >
      <span role="cell" className="flex items-center gap-2.5">
        <span
          aria-hidden="true"
          className="inline-flex size-[22px] flex-none items-center justify-center rounded-full font-semibold text-white"
          style={{ background: row.badgeBg, fontSize: row.badge.length > 2 ? 8 : row.badge.length > 1 ? 9 : 11 }}
        >
          {row.badge}
        </span>
        {href ? (
          <Link href={href} className="after:absolute after:inset-0 hover:text-focus focus-visible:outline-none">
            {row.symbol}
          </Link>
        ) : (
          row.symbol
        )}
      </span>
      <span role="cell" className="text-right">
        {row.last}
      </span>
      <span role="cell" className={`text-right ${tone}`}>
        {abs(row.change)}
      </span>
      <span role="cell" className={`text-right ${tone}`}>
        {abs(row.changePct)}%
      </span>
    </div>
  );
}
