import { StatCards, type Stat } from "@/components/application/dashboard/stat-cards";
import { deltaColor } from "@/components/shell/delta";
import { num, pct, signed } from "@/lib/format";
import type { IndexTile } from "@/lib/mock/overview";
import { Sparkline } from "./Sparkline";

// Five across when the row has room; otherwise three over two (a six-column
// grid with spans), and two up on phones with the last card full width.
const GRID = [
  "@max-2xl:[&>*:last-child]:col-span-2",
  "@2xl:grid-cols-6 @2xl:@max-6xl:*:col-span-2 @2xl:@max-6xl:[&>*:nth-child(n+4)]:col-span-3",
  "@6xl:grid-cols-5",
].join(" ");

/** Market indices as BoardUI stat cards, each with its intraday sparkline in place of the icon tile. */
export function IndexTiles({ tiles }: { tiles: IndexTile[] }) {
  const stats: Stat[] = tiles.map((ix, i) => ({
    label: ix.name,
    value: ix.unit === "%" ? `${ix.level.toFixed(2)}%` : num(ix.level),
    // Yields quote their change in basis points.
    delta: ix.changeBp != null ? `${signed(ix.changeBp, 0)} bp` : pct(ix.changePct),
    deltaColor: deltaColor(ix.changePct),
    visual: (
      <Sparkline values={ix.series} up={ix.changePct >= 0} area={{ id: `index-spark-${i}` }} className="h-8 w-full" />
    ),
  }));
  return (
    <section aria-label="Market indices" className="@container">
      <StatCards stats={stats} columns={2} className={GRID} />
    </section>
  );
}
