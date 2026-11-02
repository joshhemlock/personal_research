import type { Metadata } from "next";
import { AppShell } from "@/components/shell/AppShell";
import { LinkButton } from "@/components/base/buttons/link-button";
import { Settle } from "@/components/motion/Settle";
import { Greeting } from "@/components/overview/Greeting";
import { IndexTiles } from "@/components/overview/IndexTiles";
import { Movers } from "@/components/overview/Movers";
import { ResearchQueue } from "@/components/overview/ResearchQueue";
import { SectorPerformance } from "@/components/overview/SectorPerformance";
import { UpcomingEarnings } from "@/components/overview/UpcomingEarnings";
import { Watchlist } from "@/components/overview/Watchlist";
import { EARNINGS_WINDOW_DAYS, MOVERS_FULL_SCALE, SECTOR_HEAT_SCALE, SECTOR_PERIODS } from "@/lib/mock/overview";
import { getOverviewData } from "@/lib/data/overview";
import { isSample } from "@/lib/data/source";

export const metadata: Metadata = { title: "Overview" };

export default async function OverviewPage() {
  const data = await getOverviewData();
  return (
    <AppShell active="overview">
      {/* Sized by its own width (the sidebar can collapse): the side column
          sits beside the watchlist once there is room for both. */}
      <main className="@container min-w-0 flex-1 basis-full">
        {/* Entrances (sparklines drawing, bars growing, lists staggering in)
            play once; coming back to the screen just shows it. */}
        <Settle className="flex flex-col gap-6">
          <Greeting
            title={data.greeting}
            today={data.marketDate}
            watchlist={data.watchlist}
            nextEarnings={data.upcomingEarnings[0]}
          />
          <IndexTiles tiles={data.indexTiles} />
          <div className="grid items-start gap-4 @min-[75rem]:grid-cols-[minmax(0,1fr)_21rem]">
            <div className="flex min-w-0 flex-col gap-4">
              <Watchlist rows={data.watchlist} />
              <SectorPerformance sectors={data.sectors} periods={SECTOR_PERIODS} scale={SECTOR_HEAT_SCALE} />
            </div>
            <aside
              aria-label="Movers, earnings and research queue"
              data-glide-with="watchlist"
              className="grid min-w-0 grid-cols-[repeat(auto-fit,minmax(min(18rem,100%),1fr))] items-start gap-4"
            >
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
          </div>
          {!isSample && (
            <p data-glide-with="watchlist" className="text-caption-1-regular text-text-tertiary">
              Market data:{" "}
              <LinkButton href="https://www.tradingview.com/" target="_blank" rel="noreferrer" variant="secondary" size="xs">
                TradingView
              </LinkButton>
            </p>
          )}
        </Settle>
      </main>
    </AppShell>
  );
}
