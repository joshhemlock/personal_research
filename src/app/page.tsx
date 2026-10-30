import type { Metadata } from "next";
import { AppShell } from "@/components/shell/AppShell";
import { Greeting } from "@/components/overview/Greeting";
import { IndexTiles } from "@/components/overview/IndexTiles";
import { Movers } from "@/components/overview/Movers";
import { ResearchQueue } from "@/components/overview/ResearchQueue";
import { SectorPerformance } from "@/components/overview/SectorPerformance";
import { UpcomingEarnings } from "@/components/overview/UpcomingEarnings";
import { Watchlist } from "@/components/overview/Watchlist";
import { EARNINGS_WINDOW_DAYS, MOVERS_FULL_SCALE, SECTOR_HEAT_SCALE, SECTOR_PERIODS } from "@/lib/mock/overview";
import { getOverviewData } from "@/lib/data/overview";

export const metadata: Metadata = { title: "Overview" };

export default async function OverviewPage() {
  const data = await getOverviewData();
  return (
    <AppShell active="overview">
      <main className="flex min-w-0 flex-[999_1_620px] flex-col gap-3 pb-1">
        <Greeting
          title={data.greeting}
          today={data.marketDate}
          watchlist={data.watchlist}
          nextEarnings={data.upcomingEarnings[0]}
        />
        <IndexTiles tiles={data.indexTiles} />
        <Watchlist rows={data.watchlist} />
        <SectorPerformance sectors={data.sectors} periods={SECTOR_PERIODS} scale={SECTOR_HEAT_SCALE} />
      </main>
      <aside aria-label="Movers, earnings and research queue" className="grid min-w-0 flex-[1_1_330px] grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] content-start gap-3 pb-1 max-split:basis-full">
        <Movers
          rows={data.watchlist}
          fullScale={Math.max(MOVERS_FULL_SCALE, ...data.watchlist.map((r) => Math.abs(r.changePct)))}
        />
        <UpcomingEarnings
          events={data.upcomingEarnings}
          today={data.marketDate}
          windowDays={EARNINGS_WINDOW_DAYS}
          reported={data.reportedThisWeek}
        />
        <ResearchQueue tasks={data.researchQueue} />
      </aside>
    </AppShell>
  );
}
