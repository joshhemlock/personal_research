import type { Metadata } from "next";
import { AppShell } from "@/components/shell/AppShell";
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

// Sample data for now; swap these imports for the data layer later.
export default function OverviewPage() {
  return (
    <AppShell active="overview">
      <main className="flex min-w-0 flex-[999_1_620px] flex-col gap-3 pb-1">
        <Greeting
          title={GREETING}
          today={MARKET_DATE}
          watchlist={WATCHLIST}
          nextEarnings={UPCOMING_EARNINGS[0]}
        />
        <IndexTiles tiles={INDEX_TILES} />
        <Watchlist rows={WATCHLIST} />
        <SectorPerformance sectors={SECTORS} periods={SECTOR_PERIODS} scale={SECTOR_HEAT_SCALE} />
      </main>
      <aside aria-label="Movers, earnings and research queue" className="grid min-w-0 flex-[1_1_330px] grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] content-start gap-3 pb-1 max-split:basis-full">
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
