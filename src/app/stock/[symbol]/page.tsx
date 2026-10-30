import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { AlertsPanel } from "@/components/chart/AlertsPanel";
import { ChartWorkspace } from "@/components/chart/ChartWorkspace";
import { ASIDE, FLUSH_BOTTOM } from "@/components/chart/layout";
import { TickerCard } from "@/components/chart/TickerCard";
import { TickerTabs } from "@/components/chart/TickerTabs";
import { WatchlistPanel } from "@/components/chart/WatchlistPanel";
import { ALERTS, LAST_TICK, getChartData, isWatched } from "@/lib/mock/chart";
import { findSecurity, UNIVERSE, AS_OF } from "@/lib/mock/market";
import { num, pct, signed } from "@/lib/format";

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
  const sec = findSecurity(symbol);
  if (!sec) notFound();
  return (
    <AppShell
      active="chart"
      symbol={sec.symbol}
      railClassName="pb-4"
      quote={{
        symbol: sec.symbol,
        price: num(sec.price),
        change: `${signed(sec.change)} (${pct(sec.changePct)})`,
        up: sec.change >= 0,
        asOf: `${AS_OF.date} · ${AS_OF.time}`,
      }}
    >
      <ChartWorkspace
        security={{ symbol: sec.symbol, name: sec.name, exchange: sec.exchange, changePct: sec.changePct, watched: isWatched(sec.symbol) }}
        data={getChartData(sec)}
        addNoteHref={sec.symbol === "NVDA" ? "/notes/nvda-core-thesis" : "/notes"}
        lastTick={LAST_TICK}
      >
        <TickerTabs current={sec.symbol} />
      </ChartWorkspace>
      <aside aria-label="Watchlist, alerts and details" className={`${ASIDE} ${FLUSH_BOTTOM}`}>
        <WatchlistPanel />
        <AlertsPanel alerts={ALERTS} />
        <TickerCard sec={sec} />
      </aside>
    </AppShell>
  );
}
