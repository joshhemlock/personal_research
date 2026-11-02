import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LinkButton } from "@/components/base/buttons/link-button";
import { Settle } from "@/components/motion/Settle";
import { AppShell } from "@/components/shell/AppShell";
import { Card } from "@/components/financials/Card";
import { EpsCard } from "@/components/financials/EpsCard";
import { FinancialsHeader } from "@/components/financials/FinancialsHeader";
import { KpiTiles } from "@/components/financials/KpiTiles";
import { MarginsChart } from "@/components/financials/MarginsChart";
import { NextReport } from "@/components/financials/NextReport";
import { RevenueChart } from "@/components/financials/RevenueChart";
import { RevenueMix } from "@/components/financials/RevenueMix";
import { SectionTabs } from "@/components/financials/SectionTabs";
import { StatementsCard } from "@/components/financials/StatementsCard";
import { periodsKey } from "@/components/financials/helpers";
import { ValuationCard } from "@/components/financials/ValuationCard";
import { getFinancialsPage, type FinancialsPage as PageData } from "@/lib/data/financials";
import { UNIVERSE } from "@/lib/mock/market";
import { num, pct, signed } from "@/lib/format";

// Sample symbols are prerendered; other params render on request, so
// navigations into this route may block until the page is ready (loading.tsx
// shows the skeleton meanwhile).
export const instant = false;

export function generateStaticParams() {
  return UNIVERSE.map((s) => ({ symbol: s.symbol }));
}

export async function generateMetadata({ params }: PageProps<"/stock/[symbol]/financials">): Promise<Metadata> {
  const { symbol } = await params;
  return { title: `${symbol.toUpperCase()} financials` };
}

/** "Data: TradingView", where the figures come from a data provider. */
function Attribution({ source }: { source: NonNullable<PageData["attribution"]> }) {
  return (
    <p className="text-caption-1-regular text-text-tertiary">
      Data:{" "}
      <LinkButton href={source.href} target="_blank" rel="noreferrer" variant="secondary" size="xs">
        {source.name}
      </LinkButton>
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
      {/* Sized by its own width (the sidebar can collapse): the valuation and
          earnings column sits beside the statements once there is room. */}
      <main aria-label={`${page.name} financials`} className="@container min-w-0 flex-1 basis-full">
        {/* Settle retires the first-paint entrances (bars rising, lines drawing)
            once they have played, so a screen Next shows again doesn't replay them. */}
        <Settle className="flex flex-col gap-6">
          <FinancialsHeader
            symbol={page.symbol}
            name={page.name}
            changePct={quote?.changePct ?? null}
            data={data}
            thesisHref={page.thesisHref}
            source={page.source}
          />
          <SectionTabs symbol={page.symbol} earningsHref={data ? "#earnings" : undefined}>
            {data ? (
              <>
                {data.kpis.length > 0 && <KpiTiles kpis={data.kpis} periods={periodsKey(data.quarters)} />}
                <div className="grid items-start gap-4 @min-[75rem]:grid-cols-[minmax(0,1fr)_22rem]">
                  <div className="@container flex min-w-0 flex-col gap-4">
                    <div className="grid items-stretch gap-4 @min-[46rem]:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
                      <RevenueChart quarters={data.quarters} revenue={data.revenue} netIncome={data.netIncome} />
                      <MarginsChart quarters={data.quarters} margins={data.margins} />
                    </div>
                    <StatementsCard
                      quarters={data.quarters.slice(-4)}
                      years={data.years}
                      statements={data.statements}
                      currency={data.currency}
                    />
                  </div>
                  <aside
                    aria-label="Valuation and earnings"
                    className="grid min-w-0 grid-cols-[repeat(auto-fit,minmax(min(20rem,100%),1fr))] items-start gap-4"
                  >
                    <ValuationCard symbols={data.valuation.symbols} values={data.valuation.values} />
                    {hasEps && <EpsCard id="earnings" quarters={data.eps.quarters ?? data.quarters} eps={data.eps} />}
                    {data.mix && <RevenueMix period={data.mix.period} segments={data.mix.segments} />}
                    <NextReport id={hasEps ? undefined : "earnings"} report={data.nextReport} />
                  </aside>
                </div>
              </>
            ) : (
              <Card titleId="none-h" title={`No financial statements for ${page.symbol}`}>
                <p className="-mt-2 text-body-regular text-text-secondary">
                  The data source has no income statement, balance sheet or cash flow for this symbol (funds and ETFs
                  don’t report them).
                </p>
              </Card>
            )}
            {attribution && <Attribution source={attribution} />}
          </SectionTabs>
        </Settle>
      </main>
    </AppShell>
  );
}
