import type { ReactNode } from "react";

type ChangePillProps = {
  value: number;
  children: ReactNode;
  /** sm: 20px tall, 11px text (top bar, tiles). md: 24px, 12px (tables). */
  size?: "sm" | "md";
  className?: string;
};

/** Green or red rounded change badge, e.g. "+2.14%". */
export function ChangePill({ value, children, size = "md", className = "" }: ChangePillProps) {
  const up = value >= 0;
  const dims = size === "sm" ? "h-5 px-[7px] text-[11px]" : "h-6 px-2 text-[12px]";
  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold whitespace-nowrap ${dims} ${
        up ? "bg-up-pill text-up-pill-text" : "bg-down-pill text-down-pill-text"
      } ${className}`}
    >
      {children}
    </span>
  );
}

type TickerDotProps = { symbol: string; size?: number; fontSize?: number; className?: string };

/** Black disc with the symbol's first letter, used for every ticker. */
export function TickerDot({ symbol, size = 30, fontSize = 13, className = "" }: TickerDotProps) {
  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size, fontSize }}
      className={`inline-flex flex-none items-center justify-center rounded-full bg-ink font-semibold text-white ${className}`}
    >
      {symbol.charAt(0)}
    </span>
  );
}
