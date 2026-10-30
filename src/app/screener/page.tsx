import type { Metadata } from "next";
import { AppShell } from "@/components/shell/AppShell";
import { FiltersPanel } from "@/components/screener/FiltersPanel";
import { ResultsCard } from "@/components/screener/ResultsCard";
import { ScreenerProvider } from "@/components/screener/ScreenerProvider";
import { ScreenTabs } from "@/components/screener/ScreenTabs";
import { SummaryTiles } from "@/components/screener/SummaryTiles";
import { getLiveScreener } from "@/lib/data/screener";

export const metadata: Metadata = { title: "Screener" };

export default async function ScreenerPage() {
  // Null with sample data: the Screener then filters its sample universe itself.
  const live = await getLiveScreener();
  return (
    <AppShell active="screener">
      <ScreenerProvider live={live}>
        <FiltersPanel />
        <main aria-label="Screen results" className="flex min-w-0 flex-[999_1_620px] flex-col gap-3 pb-1">
          <div className="flex flex-wrap items-center gap-x-[14px] gap-y-[10px]">
            <h1 className="text-[26px] font-normal tracking-[-0.02em]">Screener</h1>
            <ScreenTabs />
          </div>
          <SummaryTiles />
          <ResultsCard />
        </main>
      </ScreenerProvider>
    </AppShell>
  );
}
