"use client";

import { useSyncExternalStore } from "react";
import { RiTimeLine } from "@remixicon/react";
import { StatusDot } from "@/components/base/badges/status-dot";
import { marketStatusLabel } from "@/lib/data/clock";
import { cx } from "@/utils/cx";

function subscribe(onChange: () => void) {
  const id = setInterval(onChange, 15_000);
  return () => clearInterval(id);
}

/** "Market open · 11:51 ET", kept current in the browser; a green dot while the market is open. */
export function MarketClock({ fixedLabel, className }: { fixedLabel?: string; className?: string }) {
  const live = useSyncExternalStore(
    subscribe,
    () => marketStatusLabel(),
    () => null,
  );
  const label = fixedLabel ?? live ?? "Market hours";
  const open = label.startsWith("Market open");
  return (
    <span className={cx("inline-flex items-center gap-2 text-body-medium whitespace-nowrap text-text-secondary", className)}>
      {open ? (
        <StatusDot color="green" />
      ) : (
        <RiTimeLine className="size-4 shrink-0 text-foreground-icon-tertiary" aria-hidden />
      )}
      {label}
    </span>
  );
}
