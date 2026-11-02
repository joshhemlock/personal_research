import type { Metadata } from "next";
import { Settle } from "@/components/motion/Settle";
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
        {/* contents: the two columns stay items of the shell's wrapping row.
            Settle retires the first-paint entrances (sparkline draws) once
            played, so returning to the screen doesn't replay them. */}
        <Settle className="contents">
          <FiltersPanel />
          <main aria-label="Screen results" className="flex min-w-0 flex-[999_1_620px] flex-col gap-4">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
              <h1 className="text-title-1-medium text-text-primary">Screener</h1>
              <ScreenTabs />
            </div>
            <SummaryTiles />
            <ResultsCard />
          </main>
        </Settle>
      </ScreenerProvider>
    </AppShell>
  );
}
