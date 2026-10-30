import type { Tick } from "./helpers";

/** Y-axis labels, right-aligned and centred on their gridline. */
export function YAxis({ ticks, className }: { ticks: Tick[]; className: string }) {
  return (
    <div aria-hidden="true" className={`relative h-[150px] flex-none ${className}`}>
      {ticks.map((t) => (
        <span
          key={t.value}
          className="absolute right-0 -translate-y-1/2 text-[12px] text-muted"
          style={{ top: `${t.top.toFixed(2)}%` }}
        >
          {t.label}
        </span>
      ))}
    </div>
  );
}

/** Horizontal gridlines across a relatively positioned plot. */
export function Gridlines({ ticks }: { ticks: Tick[] }) {
  return ticks.map((t) => (
    <span
      key={t.value}
      aria-hidden="true"
      className="absolute inset-x-0 border-t border-[rgba(17,17,19,0.06)]"
      style={{ top: `${t.top.toFixed(2)}%` }}
    />
  ));
}
