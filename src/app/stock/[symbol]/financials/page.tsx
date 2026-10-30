import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { EpsCard } from "@/components/financials/EpsCard";
import { FinancialsHeader } from "@/components/financials/FinancialsHeader";
import { PANEL } from "@/components/financials/helpers";
import { KpiTiles } from "@/components/financials/KpiTiles";
import { MarginsChart } from "@/components/financials/MarginsChart";
import { NextReport } from "@/components/financials/NextReport";
import { RevenueChart } from "@/components/financials/RevenueChart";
import { RevenueMix } from "@/components/financials/RevenueMix";
import { StatementsCard } from "@/components/financials/StatementsCard";
import { ValuationCard } from "@/components/financials/ValuationCard";
import { getFinancialsPage, type FinancialsPage as PageData } from "@/lib/data/financials";
import { UNIVERSE } from "@/lib/mock/market";
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

/** "Data: TradingView", where the figures come from a data provider. */
function Attribution({ source, className = "" }: { source: NonNullable<PageData["attribution"]>; className?: string }) {
  return (
    <p className={`m-0 px-1 text-[12px] text-muted ${className}`}>
      Data:{" "}
      <a href={source.href} target="_blank" rel="noreferrer" className="link text-ink-2">
        {source.name}
      </a>
    </p>
  );
}

export default async function FinancialsPage({ params }: PageProps<"/stock/[symbol]/financials">) {
  const { symbol } = await params;
  const page = await getFinancialsPage(symbol);
  if (!page) notFound();
  const { data, quote, attribution } = page;
  const hasEps = data != null && (data.eps.actual.some((v) => v != null) || data.eps.next != null);
  return (
    <AppShell
      active="financials"
      symbol={page.symbol}
      askLabel="Ask about these numbers"
      quote={
        quote
          ? {
              symbol: page.symbol,
              price: num(quote.price),
              change: `${signed(quote.change)} (${pct(quote.changePct)})`,
              up: quote.change >= 0,
              asOf: quote.asOf,
            }
          : undefined
      }
    >
      <main aria-label={`${page.name} financials`} className="flex min-w-0 flex-[999_1_620px] flex-col gap-3 pb-1">
        <FinancialsHeader
          symbol={page.symbol}
          name={page.name}
          changePct={quote?.changePct ?? null}
          data={data}
          thesisHref={page.thesisHref}
          source={page.source}
        />
        {data ? (
          <>
            {data.kpis.length > 0 && <KpiTiles kpis={data.kpis} />}
            <div className="flex flex-wrap items-stretch gap-3">
              <RevenueChart quarters={data.quarters} revenue={data.revenue} netIncome={data.netIncome} />
              <MarginsChart margins={data.margins} />
            </div>
            <StatementsCard
              quarters={data.quarters.slice(-4)}
              years={data.years}
              statements={data.statements}
              currency={data.currency}
            />
          </>
        ) : (
          <section className={`${PANEL} flex flex-col gap-1 px-[18px] py-[14px]`}>
            <p className="m-0 text-[15px] text-ink">No financial statements for {page.symbol}.</p>
            <p className="m-0 text-[13px] text-ink-3">
              The data source has no income statement, balance sheet or cash flow for this symbol (funds and ETFs
              don’t report them).
            </p>
            {attribution && <Attribution source={attribution} className="mt-2 px-0" />}
          </section>
        )}
      </main>
      {data && (
        <aside
          aria-label="Valuation and earnings"
          className="grid min-w-0 flex-[1_1_330px] grid-cols-[repeat(auto-fit,minmax(min(420px,100%),1fr))] content-start gap-3 pb-1 max-split:basis-full"
        >
          <ValuationCard symbols={data.valuation.symbols} values={data.valuation.values} />
          {hasEps && <EpsCard quarters={data.eps.quarters ?? data.quarters} eps={data.eps} />}
          {data.mix && <RevenueMix period={data.mix.period} segments={data.mix.segments} />}
          <NextReport report={data.nextReport} />
          {attribution && <Attribution source={attribution} className="col-span-full" />}
        </aside>
      )}
    </AppShell>
  );
}
