import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
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
      <main className="flex min-w-0 flex-[999_1_640px] flex-col gap-2.5">{sec.symbol} chart</main>
      <aside className="flex min-w-0 flex-[1_1_330px] flex-col gap-3 pb-4" />
    </AppShell>
  );
}
