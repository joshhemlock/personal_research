import { SEGMENT_COLORS, type Segment } from "@/lib/mock/financials";
import { cx } from "@/utils/cx";
import { Card } from "./Card";

// BoardUI's categorical chart colours in their fixed order; the data's last
// palette slot is "Other", which takes the neutral chart colour.
const SLOTS = ["bg-chart-1", "bg-chart-2", "bg-chart-3", "bg-chart-4", "bg-chart-neutral"];

/** The segment's colour: its palette slot in the data, or its position when the data names no slot. */
function fill(s: Segment, k: number): string {
  const slot = SEGMENT_COLORS.indexOf(s.color);
  return SLOTS[slot >= 0 ? slot : Math.min(k, SLOTS.length - 2)];
}

/** Thin segmented bar of revenue by segment (it grows in from the start), with a legend. */
export function RevenueMix({ period, segments }: { period: string; segments: Segment[] }) {
  const summary = segments.map((s) => `${s.name} ${s.share.toFixed(1)}%`).join(", ");
  return (
    <Card titleId="sg-h" title="Revenue mix" note={period}>
      <div
        role="img"
        aria-label={`Revenue by segment: ${summary}`}
        className="flex h-2 animate-grow gap-0.5"
        style={{ transformOrigin: "left" }}
      >
        {segments.map((s, k) => (
          <span
            key={s.name}
            className={cx("min-w-1 rounded-xs first:rounded-l-full last:rounded-r-full", fill(s, k))}
            style={{ flex: s.share }}
          />
        ))}
      </div>
      <ul aria-hidden="true" className="flex flex-wrap gap-x-3 gap-y-1.5">
        {segments.map((s, k) => (
          <li key={s.name} className="inline-flex items-center gap-1.5 text-body-2-regular whitespace-nowrap text-text-secondary">
            <span className={cx("size-2 rounded-full", fill(s, k))} />
            {s.name}
            <span className="text-body-2-medium text-text-primary">{s.share.toFixed(1)}%</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
