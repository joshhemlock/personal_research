import type { Segment } from "@/lib/mock/financials";
import { H2, PANEL } from "./helpers";

/** Stacked bar of revenue by segment, with a legend. */
export function RevenueMix({ period, segments }: { period: string; segments: Segment[] }) {
  const summary = segments.map((s) => `${s.name} ${s.share.toFixed(1)}%`).join(", ");
  return (
    <section aria-labelledby="sg-h" className={`${PANEL} flex flex-col gap-2.5 px-[18px] py-[14px]`}>
      <div className="flex items-center justify-between gap-2.5">
        <h2 id="sg-h" className={H2}>
          Revenue mix
        </h2>
        <span className="text-[13px] text-muted">{period}</span>
      </div>
      <div role="img" aria-label={`Revenue by segment: ${summary}`} className="flex h-3 gap-[2px]">
        {segments.map((s) => (
          <span key={s.name} className="min-w-1 rounded-[4px]" style={{ flex: s.share, background: s.color }} />
        ))}
      </div>
      <div aria-hidden="true" className="flex flex-wrap gap-x-2.5 gap-y-1">
        {segments.map((s) => (
          <span key={s.name} className="inline-flex items-center gap-[5px] text-[12px] whitespace-nowrap text-ink-2">
            <span className="size-2 rounded-full" style={{ background: s.color }} />
            {s.name} <span className="text-ink">{s.share.toFixed(1)}%</span>
          </span>
        ))}
      </div>
    </section>
  );
}
