import { Suspense } from "react";
import Link from "next/link";
import { Chip } from "@/components/base/badges/chip";
import { Skeleton } from "@/components/base/skeleton/skeleton";
import { AnimatedValue } from "@/components/motion/AnimatedValue";
import { APP_NAME } from "@/lib/brand";
import { fixedMarketLabel, getHeaderIndices } from "@/lib/data/shell";
import { pct } from "@/lib/format";
import { ALERTS } from "@/lib/mock/chart";
import { deltaColor } from "./delta";
import { BrandMark } from "./Logo";
import { MarketClock } from "./MarketClock";
import { NotificationBell, type ShellNotice } from "./NotificationBell";
import { SearchTrigger } from "./SearchTrigger";
import { NavMenuButton } from "./ShellFrame";

// Stock data modules import the quote type from here.
export type { HeaderQuote } from "./page-state";

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

const INDEX_NAMES = ["S&P 500", "Nasdaq 100"];

/**
 * Above every screen, in the persistent shell: market clock, search (or the
 * current quote on stock pages), the S&P 500 and Nasdaq 100, and
 * notifications. Below `lg` the menu button and brand lead the first row,
 * and the clock and indices move to a row of their own.
 */
export function TopBar({ live }: { live: boolean }) {
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

      <SearchTrigger live={live} className="order-2 max-lg:ms-auto" />

      {/* Its own row below lg; from lg up its children join the bar. */}
      <div className="order-4 flex basis-full flex-wrap items-center justify-between gap-x-6 gap-y-2 lg:contents">
        <MarketClock fixedLabel={fixedMarketLabel} className="lg:order-1" />
        <dl className="flex items-center gap-6 lg:order-3 lg:ms-auto">
          {/* The quotes stream in; the rest of the shell never waits on them. */}
          <Suspense fallback={<IndexReadoutSkeletons />}>
            <IndexReadouts />
          </Suspense>
        </dl>
      </div>

      <NotificationBell notices={NOTICES} className="order-3 lg:order-4" />
    </header>
  );
}

async function IndexReadouts() {
  // A failed quote read leaves the readouts out rather than taking the
  // shell (and every screen) down with it.
  const indices = await getHeaderIndices().catch(() => []);
  return indices.map((ix) => (
    <div key={ix.name} className="flex flex-col">
      <dt className="text-caption-1-medium whitespace-nowrap text-text-secondary">{ix.name}</dt>
      <dd className="flex items-center gap-2">
        <AnimatedValue value={ix.value} className="text-body-semibold text-text-primary" />
        <Chip variant="caption" color={deltaColor(ix.changePct)} className="transition-colors duration-200 ease-out">
          <AnimatedValue value={pct(ix.changePct)} />
        </Chip>
      </dd>
    </div>
  ));
}

function IndexReadoutSkeletons() {
  return INDEX_NAMES.map((name) => (
    <div key={name} className="flex flex-col">
      <dt className="text-caption-1-medium whitespace-nowrap text-text-secondary">{name}</dt>
      <dd className="flex h-6 items-center gap-2">
        <Skeleton shape="text" className="h-4 w-16" />
        <Skeleton shape="text" className="h-4 w-12" />
      </dd>
    </div>
  ));
}
