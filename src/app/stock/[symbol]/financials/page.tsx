import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { EpsCard } from "@/components/financials/EpsCard";
import { FinancialsHeader } from "@/components/financials/FinancialsHeader";
import { KpiTiles } from "@/components/financials/KpiTiles";
import { MarginsChart } from "@/components/financials/MarginsChart";
import { NextReport } from "@/components/financials/NextReport";
import { RevenueChart } from "@/components/financials/RevenueChart";
import { RevenueMix } from "@/components/financials/RevenueMix";
import { StatementsCard } from "@/components/financials/StatementsCard";
import { ValuationCard } from "@/components/financials/ValuationCard";
import { getFinancials } from "@/lib/mock/financials";
import { findSecurity, UNIVERSE, AS_OF } from "@/lib/mock/market";
import { num, pct, signed } from "@/lib/format";

// Sample symbols are prerendered; other params render on request, so
// navigations into this route may block until the page is ready.
export const instant = false;

export function generateStaticParams() {
  return UNIVERSE.map((s) => ({ symbol: s.symbol }));
}

export async function generateMetadata({ params }: PageProps<"/stock/[symbol]/financials">): Promise<Metadata> {
  const { symbol } = await params;
  return { title: `${symbol.toUpperCase()} financials` };
}

export default async function FinancialsPage({ params }: PageProps<"/stock/[symbol]/financials">) {
  const { symbol } = await params;
  const sec = findSecurity(symbol);
  const data = getFinancials(symbol);
  if (!sec || !data) notFound();
  return (
    <AppShell
      active="financials"
      symbol={sec.symbol}
      askLabel="Ask about these numbers"
      quote={{
        symbol: sec.symbol,
        price: num(sec.price),
        change: `${signed(sec.change)} (${pct(sec.changePct)})`,
        up: sec.change >= 0,
        asOf: `${AS_OF.date} · ${AS_OF.time}`,
      }}
    >
      <main aria-label={`${sec.name} financials`} className="flex min-w-0 flex-[999_1_620px] flex-col gap-3 pb-1">
        <FinancialsHeader data={data} changePct={sec.changePct} />
        <KpiTiles kpis={data.kpis} />
        <div className="flex flex-wrap items-stretch gap-3">
          <RevenueChart quarters={data.quarters} revenue={data.revenue} netIncome={data.netIncome} />
          <MarginsChart margins={data.margins} />
        </div>
        <StatementsCard quarters={data.quarters.slice(4)} years={data.years} statements={data.statements} />
      </main>
      <aside aria-label="Valuation and earnings" className="grid min-w-0 flex-[1_1_330px] grid-cols-[repeat(auto-fit,minmax(min(420px,100%),1fr))] content-start gap-3 pb-1 max-split:basis-full">
        <ValuationCard symbols={data.valuation.symbols} values={data.valuation.values} />
        <EpsCard quarters={data.quarters} eps={data.eps} />
        <RevenueMix period={data.mix.period} segments={data.mix.segments} />
        <NextReport report={data.nextReport} />
      </aside>
    </AppShell>
  );
}
