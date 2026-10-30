import type { Kpi } from "@/lib/mock/financials";

/**
 * Mini bar chart: eight bars scaled to the largest, the latest one dark.
 * With negative values the bars hang from a zero line instead; missing values leave a gap.
 */
function MiniBars({ values }: { values: (number | null)[] }) {
  const w = 72;
  const h = 34;
  const nums = values.filter((v): v is number => v != null);
  const top = Math.max(...nums, 0);
  const mx = top || 1;
  const mn = Math.min(...nums, 0);
  const slot = w / values.length;
  const bw = slot * 0.62;
  const scale = (h - 2) / (top - mn);
  const zero = 2 + top * scale;
  const bar = (v: number | null, k: number) => {
    if (v == null) return "";
    const x = k * slot + (slot - bw) / 2;
    if (mn < 0) {
      const [y0, y1] = v >= 0 ? [zero - v * scale, zero] : [zero, zero - v * scale];
      return `M${x.toFixed(1)} ${y0.toFixed(1)}h${bw.toFixed(1)}V${y1.toFixed(1)}h${(-bw).toFixed(1)}Z`;
    }
    const bh = (Math.max(v, 0) / mx) * (h - 2);
    return `M${x.toFixed(1)} ${(h - bh).toFixed(1)}h${bw.toFixed(1)}V${h}h${(-bw).toFixed(1)}Z`;
  };
  const last = values.length - 1;
  return (
    <svg width="60" height="30" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true" className="min-w-9">
      <path d={values.slice(0, last).map(bar).join("")} fill="#D4D4D9" />
      <path d={bar(values[last], last)} fill="#111113" />
    </svg>
  );
}

// Five in a row from 840px (as designed); narrower, wrap 3 + 2, then 2 + 2 + 1,
// then one per row, rather than leaving a single stretched tile on its own line.
const TILE =
  "glass-tile flex min-w-0 flex-[1_1_160px] flex-col gap-1 rounded-[20px] px-4 py-3 @max-[840px]:basis-[30%] @max-[500px]:basis-[40%] @max-[340px]:basis-full";

/** The five headline tiles above the charts. */
export function KpiTiles({ kpis }: { kpis: Kpi[] }) {
  return (
    <section aria-label="Headline numbers" className="@container flex flex-wrap gap-2.5">
      {kpis.map((k) => (
        <div key={k.label} className={TILE}>
          <span className="text-[13px] whitespace-nowrap text-ink-3">{k.label}</span>
          <div className="flex items-end justify-between gap-2">
            <div className="flex flex-col leading-[1.15]">
              <span className="text-[24px] font-normal tracking-[-0.02em]">{k.value}</span>
              {k.delta ? (
                <span className={`text-[12px] whitespace-nowrap ${k.up ? "text-up-text" : "text-down-text"}`}>
                  {k.delta}
                </span>
              ) : (
                <span className="text-[12px] whitespace-nowrap text-muted">TTM</span>
              )}
            </div>
            {k.bars.some((v) => v != null) && <MiniBars values={k.bars} />}
          </div>
        </div>
      ))}
    </section>
  );
}
