import type { Metadata } from "next";
import { AppShell } from "@/components/shell/AppShell";
import { FiltersPanel } from "@/components/screener/FiltersPanel";
import { ResultsCard } from "@/components/screener/ResultsCard";
import { ScreenerProvider } from "@/components/screener/ScreenerProvider";
import { ScreenTabs } from "@/components/screener/ScreenTabs";
import { SummaryTiles } from "@/components/screener/SummaryTiles";

export const metadata: Metadata = { title: "Screener" };

export default function ScreenerPage() {
  return (
    <AppShell active="screener">
      <ScreenerProvider>
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
