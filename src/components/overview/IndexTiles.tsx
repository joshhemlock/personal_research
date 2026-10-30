import { ChangePill } from "@/components/ui/Pill";
import { num, pct, signed, tone } from "@/lib/format";
import { linePath } from "@/lib/mock/gen";
import type { IndexTile } from "@/lib/mock/overview";

/**
 * Row of market index tiles with area sparklines. A tile needs about 192px,
 * so when five no longer fit in one row (narrower than the design's 1512px
 * viewport) they reflow to 3 + 2, then stack.
 */
export function IndexTiles({ tiles }: { tiles: IndexTile[] }) {
  return (
    <section aria-label="Market indices" className="@container flex flex-wrap gap-[10px]">
      {tiles.map((ix) => (
        <IndexCard key={ix.name} ix={ix} />
      ))}
    </section>
  );
}

function IndexCard({ ix }: { ix: IndexTile }) {
  const t = tone(ix.changePct);
  const line = linePath(ix.series, 84, 30, 3);
  return (
    <div className="glass-tile flex min-w-0 flex-[1_1_150px] flex-col gap-[6px] rounded-[20px] px-4 py-3 @max-[1000px]:basis-[30%] @max-[600px]:basis-full">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex min-w-0 items-center gap-[7px] text-[13px] whitespace-nowrap text-ink-2">
          <span
            aria-hidden="true"
            className="inline-flex size-5 flex-none items-center justify-center rounded-full text-[8px] font-semibold text-white"
            style={{ background: ix.badgeColor }}
          >
            {ix.badge}
          </span>
          {ix.name}
        </span>
        <ChangePill value={ix.changePct} size="sm">
          {ix.changeBp != null ? `${signed(ix.changeBp, 0)} bp` : pct(ix.changePct)}
        </ChangePill>
      </div>
      <div className="flex items-end justify-between gap-2">
        <span className="text-[22px] font-normal tracking-[-0.02em]">
          {ix.unit === "%" ? `${ix.level.toFixed(2)}%` : num(ix.level)}
        </span>
        <svg width="70" height="28" viewBox="0 0 84 30" preserveAspectRatio="none" aria-hidden="true">
          <path d={`${line}L84 30 L0 30 Z`} fill={t.fill} />
          <path d={line} fill="none" stroke={t.stroke} strokeWidth="1.6" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}
