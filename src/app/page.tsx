import type { Metadata } from "next";
import { AppShell } from "@/components/shell/AppShell";
import { daysBetween, longDay } from "@/components/overview/format";
import { Greeting } from "@/components/overview/Greeting";
import { IndexTiles } from "@/components/overview/IndexTiles";
import { Movers } from "@/components/overview/Movers";
import { ResearchQueue } from "@/components/overview/ResearchQueue";
import { SectorPerformance } from "@/components/overview/SectorPerformance";
import { UpcomingEarnings } from "@/components/overview/UpcomingEarnings";
import { Watchlist } from "@/components/overview/Watchlist";
import {
  EARNINGS_WINDOW_DAYS,
  GREETING,
  INDEX_TILES,
  MARKET_DATE,
  MOVERS_FULL_SCALE,
  REPORTED_THIS_WEEK,
  RESEARCH_QUEUE,
  SECTOR_HEAT_SCALE,
  SECTOR_PERIODS,
  SECTORS,
  UPCOMING_EARNINGS,
  WATCHLIST,
} from "@/lib/mock/overview";

export const metadata: Metadata = { title: "Overview" };

export default function OverviewPage() {
  const up = WATCHLIST.filter((r) => r.changePct >= 0).length;
  const next = UPCOMING_EARNINGS[0];
  const summary = [
    longDay(MARKET_DATE),
    `${up} of ${WATCHLIST.length} watchlist names are up`,
    next && `${next.symbol} reports in ${daysBetween(MARKET_DATE, next.date)} days`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <AppShell active="overview">
      <main className="flex min-w-0 flex-[999_1_620px] flex-col gap-3 pb-1">
        <Greeting title={GREETING} summary={summary} />
        <IndexTiles tiles={INDEX_TILES} />
        <Watchlist rows={WATCHLIST} />
        <SectorPerformance sectors={SECTORS} periods={SECTOR_PERIODS} scale={SECTOR_HEAT_SCALE} />
      </main>
      <aside aria-label="Movers, earnings and research queue" className="flex min-w-0 flex-[1_1_330px] flex-col gap-3 pb-1">
        <Movers rows={WATCHLIST} fullScale={MOVERS_FULL_SCALE} />
        <UpcomingEarnings
          events={UPCOMING_EARNINGS}
          today={MARKET_DATE}
          windowDays={EARNINGS_WINDOW_DAYS}
          reported={REPORTED_THIS_WEEK}
        />
        <ResearchQueue tasks={RESEARCH_QUEUE} />
      </aside>
    </AppShell>
  );
}
