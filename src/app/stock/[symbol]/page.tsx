import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { AlertsPanel } from "@/components/chart/AlertsPanel";
import { ChartWorkspace } from "@/components/chart/ChartWorkspace";
import { ASIDE, FLUSH_BOTTOM } from "@/components/chart/layout";
import { TickerCard } from "@/components/chart/TickerCard";
import { TickerTabs } from "@/components/chart/TickerTabs";
import { WatchlistPanel } from "@/components/chart/WatchlistPanel";
import { getChartPage } from "@/lib/data/chart";
import { UNIVERSE } from "@/lib/mock/market";

// Sample symbols are prerendered; other params render on request, so
// navigations into this route may block until the page is ready.
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
    <AppShell active="chart" symbol={page.symbol} railClassName="pb-4" quote={page.quote}>
      <ChartWorkspace
        security={page.security}
        data={page.chart}
        addNoteHref={page.addNoteHref}
        lastTick={page.lastTick}
        attribution={page.live}
      >
        <TickerTabs current={page.symbol} tabs={page.tabs} />
      </ChartWorkspace>
      <aside aria-label="Watchlist, alerts and details" className={`${ASIDE} ${FLUSH_BOTTOM}`}>
        <WatchlistPanel pinned={page.pinned} groups={page.groups} />
        <AlertsPanel alerts={page.alerts} />
        <TickerCard card={page.card} />
      </aside>
    </AppShell>
  );
}
