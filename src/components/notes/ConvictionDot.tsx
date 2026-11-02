import type { Conviction } from "@/lib/mock/notes";
import { cx } from "@/utils/cx";
import { CONVICTION, CONVICTIONS } from "./constants";

/**
 * The conviction colour as a small dot. One layer per level, stacked, so a
 * change cross-fades between colours on opacity alone (compositor only).
 * Decorative: the level is always spelled out next to it or for screen readers.
 */
export function ConvictionDot({ conviction, className }: { conviction: Conviction; className?: string }) {
  return (
    <span aria-hidden="true" className={cx("relative inline-block size-2 shrink-0", className)}>
      {CONVICTIONS.map((c) => (
        <span
          key={c}
          className={cx(
            "absolute inset-0 rounded-full transition-opacity duration-300 ease-board",
            c === conviction ? "opacity-100" : "opacity-0",
          )}
          style={{ backgroundColor: CONVICTION[c].color }}
        />
      ))}
    </span>
  );
}
