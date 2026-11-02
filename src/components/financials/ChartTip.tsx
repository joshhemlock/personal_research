"use client";

import type { CSSProperties, ReactNode } from "react";
import { Focusable } from "react-aria-components";
import { Tooltip, TooltipTrigger } from "@/components/base/tooltip/tooltip";
import { cx } from "@/utils/cx";
import { FOCUS_RING } from "./helpers";

type ChartTipProps = {
  /** Accessible name of the mark: everything the tooltip says, as one phrase. */
  label: string;
  /** Tooltip content (see TipBody). */
  tip: ReactNode;
  placement?: "top" | "bottom" | "start" | "end";
  className?: string;
  style?: CSSProperties;
  /** The mark (bars, dots…). Children style their hover state with `group-hover/mark:`. */
  children?: ReactNode;
};

/**
 * A chart mark's hit area with BoardUI's tooltip: opens on hover and on
 * keyboard focus, so every value a chart draws can be read out. The marks
 * themselves are server-rendered children; only this wrapper is a client leaf.
 */
export function ChartTip({ label, tip, placement = "top", className, style, children }: ChartTipProps) {
  return (
    <TooltipTrigger>
      <Focusable>
        <span role="img" aria-label={label} tabIndex={0} className={cx("group/mark", FOCUS_RING, className)} style={style}>
          {children}
        </span>
      </Focusable>
      <Tooltip placement={placement}>{tip}</Tooltip>
    </TooltipTrigger>
  );
}
