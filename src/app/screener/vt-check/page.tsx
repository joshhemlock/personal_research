// TEMPORARY test harness — deleted before hand-off.
import { FiltersPanel } from "@/components/screener/FiltersPanel";
import { ResultsCard } from "@/components/screener/ResultsCard";
import { ScreenerProvider } from "@/components/screener/ScreenerProvider";
import { ScreenTabs } from "@/components/screener/ScreenTabs";
import { SummaryTiles } from "@/components/screener/SummaryTiles";
import { getLiveScreener } from "@/lib/data/screener";
import { Prof } from "./Prof";

export default async function Page() {
  const live = await getLiveScreener();
  return (
    <div className="flex min-w-0 flex-wrap items-stretch gap-4">
      <ScreenerProvider live={live}>
        <Prof id="filters"><FiltersPanel /></Prof>
        <main className="flex min-w-0 flex-[999_1_620px] flex-col gap-4">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
            <h1 className="text-title-1-medium text-text-primary">Screener</h1>
            <Prof id="tabs"><ScreenTabs /></Prof>
          </div>
          <Prof id="tiles"><SummaryTiles /></Prof>
          <Prof id="results"><ResultsCard /></Prof>
        </main>
      </ScreenerProvider>
    </div>
  );
}
