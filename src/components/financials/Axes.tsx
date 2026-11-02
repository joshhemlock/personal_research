import { cx } from "@/utils/cx";
import type { Tick } from "./helpers";

/**
 * Y-axis labels, end-aligned and centred on their gridline; as tall as the
 * plot beside it. Drawn in physical coordinates: a chart, not text flow.
 */
export function YAxis({ ticks, className }: { ticks: Tick[]; className?: string }) {
  return (
    <div aria-hidden="true" className={cx("relative", className)}>
      {ticks.map((t) => (
        <span
          key={t.value}
          className="absolute right-0 -translate-y-1/2 text-caption-1-regular whitespace-nowrap text-text-tertiary"
          style={{ top: `${t.top.toFixed(2)}%` }}
        >
          {t.label}
        </span>
      ))}
    </div>
  );
}

/** Hairline gridlines across a relatively positioned plot; the zero line, when shown, a step stronger. */
export function Gridlines({ ticks, zero = false }: { ticks: Tick[]; zero?: boolean }) {
  return ticks.map((t) => (
    <span
      key={t.value}
      aria-hidden="true"
      className={cx(
        "absolute inset-x-0 border-t",
        zero && t.value === 0 ? "border-border-button-hover" : "border-separator-border",
      )}
      style={{ top: `${t.top.toFixed(2)}%` }}
    />
  ));
}
