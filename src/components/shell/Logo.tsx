import { cx } from "@/utils/cx";

/**
 * Compound's mark: a rising line ending in a gain-colored point, on a disc.
 * Drawn with semantic tokens, so it inverts with the theme.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 26 26" aria-hidden="true" className={cx("size-8 shrink-0", className)}>
      <circle cx="13" cy="13" r="13" className="fill-foreground-icon-primary" />
      <path
        d="M6.5 17.5c3.8 0 5.5-2 6.6-4.6C14.2 10.3 15.8 8.2 19 8.2"
        fill="none"
        strokeWidth="2"
        strokeLinecap="round"
        className="stroke-background-primary-default"
      />
      <circle cx="19" cy="8.2" r="2" className="fill-chart-positive" />
    </svg>
  );
}
