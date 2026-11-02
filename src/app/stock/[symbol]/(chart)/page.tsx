import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { AlertsPanel } from "@/components/chart/AlertsPanel";
import { ChartWorkspace } from "@/components/chart/ChartWorkspace";
import { CHART_ASIDE, CHART_COLUMNS } from "@/components/chart/columns";
import { TickerCard } from "@/components/chart/TickerCard";
import { TickerTabs } from "@/components/chart/TickerTabs";
import { WatchlistPanel } from "@/components/chart/WatchlistPanel";
import { Settle } from "@/components/motion/Settle";
import { getChartPage } from "@/lib/data/chart";
import { UNIVERSE } from "@/lib/mock/market";

// Sample symbols are prerendered; other params render on request. Until one
// is ready, this route group's loading skeleton stands in for it (the group
// keeps that skeleton off /stock/[symbol]/financials).
export const instant = false;

export function generateStaticParams() {
  return UNIVERSE.map((s) => ({ symbol: s.symbol }));
}

export async function generateMetadata({ params }: PageProps<"/stock/[symbol]">): Promise<Metadata> {
  const { symbol } = await params;
  return { title: `${symbol.toUpperCase()} chart` };
}

export default async function StockChartPage({ params }: PageProps<"/stock/[symbol]">) {
  const { symbol } = await params;
  const page = await getChartPage(symbol);
  if (!page) notFound();
  return (
    <AppShell active="chart" symbol={page.symbol} quote={page.quote}>
      {/* Sized by its own width (the sidebar can collapse): the side column
          sits beside the chart once there is room for both. Settle retires
          the entrances (volume bars rising) once they've played. */}
      <Settle className="@container min-w-0 flex-1 basis-full">
        <div className={CHART_COLUMNS}>
          <ChartWorkspace
            security={page.security}
            data={page.chart}
            addNoteHref={page.addNoteHref}
            lastTick={page.lastTick}
            attribution={page.live}
          >
            <TickerTabs current={page.symbol} tabs={page.tabs} />
          </ChartWorkspace>
          <aside aria-label="Watchlist, alerts and details" className={CHART_ASIDE}>
            <WatchlistPanel pinned={page.pinned} groups={page.groups} />
            <AlertsPanel alerts={page.alerts} />
            <TickerCard card={page.card} />
          </aside>
        </div>
      </Settle>
    </AppShell>
  );
}
