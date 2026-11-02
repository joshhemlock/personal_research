import Link from "next/link";
import { Chip } from "@/components/base/badges/chip";
import { APP_NAME } from "@/lib/brand";
import { fixedMarketLabel, getHeaderIndices } from "@/lib/data/shell";
import { isSample } from "@/lib/data/source";
import { pct } from "@/lib/format";
import { ALERTS } from "@/lib/mock/chart";
import { deltaColor } from "./delta";
import { BrandMark } from "./Logo";
import { MarketClock } from "./MarketClock";
import { NotificationBell, type ShellNotice } from "./NotificationBell";
import { SearchTrigger } from "./SearchTrigger";
import { NavMenuButton } from "./ShellFrame";

export type HeaderQuote = {
  symbol: string;
  price: string;
  /** e.g. "+3.95 (+2.14%)" */
  change: string;
  up: boolean;
  /** e.g. "Oct 30, 2026 · 11:51:04 AM" */
  asOf: string;
};

// The user's fired alerts and system notices. Like the watchlist, they are
// user data that stays as in the sample until it is saved per user (the
// chart's alerts panel shows the same lists).
const NOTICES: ShellNotice[] = [
  ...ALERTS.History.map((a, i) => ({
    id: `alert-${i}`,
    kind: "alert" as const,
    title: a.text,
    symbol: a.symbol,
    when: a.scope,
    state: a.state,
    unread: a.scope.startsWith("Today"),
  })),
  ...ALERTS.System.map((a, i) => ({
    id: `system-${i}`,
    kind: "system" as const,
    title: a.text,
    symbol: a.symbol,
    when: a.scope,
    state: a.state,
    unread: false,
  })),
];

/**
 * Above every screen: market clock, search (or the current quote on stock
 * pages), the S&P 500 and Nasdaq 100, and notifications. Below `lg` the
 * menu button and brand lead the first row, and the clock and indices move
 * to a row of their own.
 */
export async function TopBar({ quote }: { quote?: HeaderQuote }) {
  const indices = await getHeaderIndices();
  return (
    <header className="flex flex-wrap items-center gap-x-4 gap-y-3">
      <div className="order-1 flex items-center gap-3 lg:hidden">
        <NavMenuButton />
        <Link
          href="/"
          className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-border-focus-ring"
        >
          <BrandMark className="size-7" />
          <span className="text-headline-semibold text-text-primary">{APP_NAME}</span>
        </Link>
      </div>

      <SearchTrigger quote={quote} live={!isSample} className="order-2 max-lg:ms-auto" />

      {/* Its own row below lg; from lg up its children join the bar. */}
      <div className="order-4 flex basis-full flex-wrap items-center justify-between gap-x-6 gap-y-2 lg:contents">
        <MarketClock fixedLabel={fixedMarketLabel} className="lg:order-1" />
        <dl className="flex items-center gap-6 lg:order-3 lg:ms-auto">
          {indices.map((ix) => (
            <div key={ix.name} className="flex flex-col">
              <dt className="text-caption-1-medium whitespace-nowrap text-text-secondary">{ix.name}</dt>
              <dd className="flex items-center gap-2">
                <span className="text-body-semibold text-text-primary">{ix.value}</span>
                <Chip variant="caption" color={deltaColor(ix.changePct)}>
                  {pct(ix.changePct)}
                </Chip>
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <NotificationBell notices={NOTICES} className="order-3 lg:order-4" />
    </header>
  );
}
