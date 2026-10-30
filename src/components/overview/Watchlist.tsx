import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { ChangePill, TickerDot } from "@/components/ui/Pill";
import { num, pct, tone } from "@/lib/format";
import { linePath } from "@/lib/mock/gen";
import { WATCH_GROUPS, type WatchRow } from "@/lib/mock/overview";
import { compactUsd, monthDay } from "./format";
import { PANEL, PANEL_TITLE } from "./Panel";
import { WatchlistFilter, type WatchFilter } from "./WatchlistFilter";

const GRID =
  "grid grid-cols-[minmax(170px,1.5fr)_84px_84px_108px_136px_76px_66px_96px] items-center gap-x-[14px]";

const TOOL =
  "inline-flex size-10 items-center justify-center rounded-[12px] transition-colors duration-150 hover:bg-track hover:text-ink";

/** Watchlist panel: group filter, then one row per symbol linking to its chart. */
export function Watchlist({ rows }: { rows: WatchRow[] }) {
  const filters: WatchFilter[] = ["All", ...WATCH_GROUPS];
  const tabs = filters.map((f) => ({
    value: f,
    label: `${f} ${f === "All" ? rows.length : rows.filter((r) => r.group === f).length}`,
  }));
  return (
    <section aria-labelledby="wl-h" className={`${PANEL} pb-1`}>
      <WatchlistFilter
        heading={
          <h2 id="wl-h" className={PANEL_TITLE}>
            Watchlist
          </h2>
        }
        tools={
          <span className="inline-flex text-ink-3">
            <button type="button" aria-label="Add symbol" className={TOOL}>
              <Icon name="plus" size={19} />
            </button>
            <button type="button" aria-label="Choose columns" className={TOOL}>
              <Icon name="columns" size={18} linejoin="round" />
            </button>
            <button type="button" aria-label="Watchlist settings" className={TOOL}>
              <Icon name="sliders" size={18} />
            </button>
          </span>
        }
        tabs={tabs}
        columns={
          <div role="row" className={`${GRID} px-1 py-[6px] text-[13px] text-muted`}>
            <span role="columnheader">Symbol</span>
            <span role="columnheader" className="text-right">
              Last
            </span>
            <span role="columnheader" className="text-right">
              Today
            </span>
            <span role="columnheader">1-month trend</span>
            <span role="columnheader">52-week range</span>
            <span role="columnheader" className="text-right">
              Mkt cap
            </span>
            <span role="columnheader" className="text-right">
              Fwd P/E
            </span>
            <span role="columnheader" className="text-right">
              Earnings
            </span>
          </div>
        }
        rows={rows.map((r) => ({ symbol: r.symbol, group: r.group, row: <WatchlistRow row={r} /> }))}
      />
    </section>
  );
}

function WatchlistRow({ row }: { row: WatchRow }) {
  const rangePos = Math.round(((row.price - row.low52) / (row.high52 - row.low52)) * 100);
  return (
    <div role="row" className={`${GRID} relative border-t border-hairline px-1 py-px text-[15px]`}>
      <span role="cell">
        {/* The link's ::after covers the row, so the whole row opens the chart. */}
        <Link
          href={`/stock/${row.symbol}`}
          className="flex min-h-[38px] items-center gap-3 text-ink after:absolute after:inset-0 hover:text-focus"
        >
          <TickerDot symbol={row.symbol} />
          <span className="flex min-w-0 flex-col leading-[1.15]">
            <span className="font-medium">{row.symbol}</span>
            <span className="truncate text-[12px] text-muted">{row.name}</span>
          </span>
        </Link>
      </span>
      <span role="cell" className="text-right">
        {num(row.price)}
      </span>
      <span role="cell" className="text-right">
        <ChangePill value={row.changePct}>{pct(row.changePct)}</ChangePill>
      </span>
      <span role="cell">
        <svg
          width="108"
          height="28"
          viewBox="0 0 96 28"
          preserveAspectRatio="none"
          aria-hidden="true"
          className="inline align-baseline"
        >
          <path
            d={linePath(row.trend, 96, 28, 3)}
            fill="none"
            stroke={tone(row.monthPct).stroke}
            strokeWidth="1.6"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </span>
      <span role="cell" className="flex flex-col gap-[5px]">
        <span className="relative block h-1 rounded-[2px] bg-[rgba(17,17,19,0.08)]">
          <span
            className="absolute -top-1 -ml-[6px] size-3 rounded-full border-2 border-white bg-ink"
            style={{ left: `${rangePos}%` }}
          />
        </span>
        <span className="flex justify-between text-[12px] text-muted">
          <span>{num(row.low52)}</span>
          <span>{num(row.high52)}</span>
        </span>
      </span>
      <span role="cell" className="text-right text-ink-2">
        {compactUsd(row.marketCap)}
      </span>
      <span role="cell" className="text-right text-ink-2">
        {row.forwardPE.toFixed(1)}
      </span>
      <span role="cell" className="text-right text-ink-2">
        {monthDay(row.nextEarnings)}
      </span>
    </div>
  );
}
