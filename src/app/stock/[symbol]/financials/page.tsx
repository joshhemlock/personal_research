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

export async function generateMetadata({ params }: PageProps<"/stock/[symbol]/financials">): Promise<Metadata> {
  const { symbol } = await params;
  return { title: `${symbol.toUpperCase()} financials` };
}

export default async function FinancialsPage({ params }: PageProps<"/stock/[symbol]/financials">) {
  const { symbol } = await params;
  const sec = findSecurity(symbol);
  if (!sec) notFound();
  return (
    <AppShell
      active="financials"
      symbol={sec.symbol}
      quote={{
        symbol: sec.symbol,
        price: num(sec.price),
        change: `${signed(sec.change)} (${pct(sec.changePct)})`,
        up: sec.change >= 0,
        asOf: `${AS_OF.date} · ${AS_OF.time}`,
      }}
    >
      <main className="flex min-w-0 flex-[999_1_620px] flex-col gap-3 pb-1">{sec.symbol} financials</main>
      <aside className="flex min-w-0 flex-[1_1_330px] flex-col gap-3 pb-1" />
    </AppShell>
  );
}
