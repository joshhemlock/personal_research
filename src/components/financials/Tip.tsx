import type { ReactNode } from "react";
import { cx } from "@/utils/cx";

export type TipRow = {
  key: string;
  /** Classes for the series key, e.g. a short line in the series colour. */
  swatch?: string;
  value: ReactNode;
  label: ReactNode;
  /** Classes for the value (e.g. a gain/loss text token). */
  valueClassName?: string;
};

/** Tooltip body: a title, then one row per series. The value leads, the series name follows. */
export function TipBody({ title, rows }: { title: ReactNode; rows: TipRow[] }) {
  return (
    <span className="flex flex-col gap-1 py-0.5">
      <span className="text-caption-1-regular text-text-secondary">{title}</span>
      {rows.map((r) => (
        <span key={r.key} className="flex items-center gap-1.5 whitespace-nowrap">
          {r.swatch && <span aria-hidden="true" className={cx("h-0.5 w-2.5 shrink-0 rounded-full", r.swatch)} />}
          <span className={cx("text-caption-1-semibold text-text-primary", r.valueClassName)}>{r.value}</span>
          <span className="text-caption-1-regular text-text-secondary">{r.label}</span>
        </span>
      ))}
    </span>
  );
}
