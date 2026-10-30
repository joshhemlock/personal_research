import type { Kpi } from "@/lib/mock/financials";

/** Mini bar chart: eight bars scaled to the largest, the latest one dark. */
function MiniBars({ values }: { values: number[] }) {
  const w = 72;
  const h = 34;
  const mx = Math.max(...values, 0) || 1;
  const slot = w / values.length;
  const bw = slot * 0.62;
  const bar = (v: number, k: number) => {
    const bh = (Math.max(v, 0) / mx) * (h - 2);
    const x = k * slot + (slot - bw) / 2;
    return `M${x.toFixed(1)} ${(h - bh).toFixed(1)}h${bw.toFixed(1)}V${h}h${(-bw).toFixed(1)}Z`;
  };
  const last = values.length - 1;
  return (
    <svg width="60" height="30" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true" className="flex-none">
      <path d={values.slice(0, last).map(bar).join("")} fill="#D4D4D9" />
      <path d={bar(values[last], last)} fill="#111113" />
    </svg>
  );
}

/** The five headline tiles above the charts. */
export function KpiTiles({ kpis }: { kpis: Kpi[] }) {
  return (
    <section aria-label="Headline numbers" className="flex flex-wrap gap-2.5">
      {kpis.map((k) => (
        <div
          key={k.label}
          className="glass-tile flex min-w-0 flex-[1_1_160px] flex-col gap-1 rounded-[20px] px-4 py-3"
        >
          <span className="text-[13px] whitespace-nowrap text-ink-3">{k.label}</span>
          <div className="flex items-end justify-between gap-2">
            <div className="flex flex-col leading-[1.15]">
              <span className="text-[24px] font-normal tracking-[-0.02em]">{k.value}</span>
              <span className={`text-[12px] whitespace-nowrap ${k.up ? "text-up-text" : "text-down-text"}`}>
                {k.delta}
              </span>
            </div>
            <MiniBars values={k.bars} />
          </div>
        </div>
      ))}
    </section>
  );
}
