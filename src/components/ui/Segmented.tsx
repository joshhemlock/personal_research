"use client";

import type { ReactNode } from "react";

export type SegmentOption<T extends string> = { value: T; label: ReactNode; ariaLabel?: string };

type SegmentedProps<T extends string> = {
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Accessible name of the group. */
  label: string;
  /** Extra classes for the track (layout, width). */
  className?: string;
  /** Size classes for each segment: height, padding, font size. */
  buttonClassName?: string;
};

/**
 * Segmented control: a translucent track with one white, raised segment.
 * Toggle buttons with aria-pressed, as in the design markup.
 */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  className = "",
  buttonClassName = "h-[34px] px-[14px] text-[14px]",
}: SegmentedProps<T>) {
  return (
    <div role="group" aria-label={label} className={`flex flex-wrap gap-[2px] rounded-full bg-track p-1 ${className}`}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            aria-label={o.ariaLabel}
            onClick={() => onChange(o.value)}
            className={`rounded-full border-0 transition-[background-color,box-shadow,color] duration-150 ${
              on ? "bg-white text-ink shadow-seg" : "bg-transparent text-ink-3 hover:text-ink"
            } ${buttonClassName}`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
