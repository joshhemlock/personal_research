"use client";

import { Focusable } from "react-aria-components";
import { RiAddLine } from "@remixicon/react";
import { IconButton } from "@/components/base/buttons/icon-button";
import { Tooltip, TooltipTrigger } from "@/components/base/tooltip/tooltip";

type OpenPaletteButtonProps = {
  label: string;
  size?: "small" | "medium";
  className?: string;
};

/**
 * A plus icon button (usable from server components) that opens the ⌘K command palette (to jump to another
 * ticker) by sending the shortcut the palette listens for.
 */
export function OpenPaletteButton({ label, size = "small", className }: OpenPaletteButtonProps) {
  return (
    <TooltipTrigger>
      <Focusable>
        <IconButton
          size={size}
          icon={RiAddLine}
          aria-label={label}
          aria-haspopup="dialog"
          aria-keyshortcuts="Meta+K Control+K"
          onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, ctrlKey: true }))}
          className={className}
        />
      </Focusable>
      <Tooltip>{label}</Tooltip>
    </TooltipTrigger>
  );
}
