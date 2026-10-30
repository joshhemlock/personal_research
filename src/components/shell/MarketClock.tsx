"use client";

import { useSyncExternalStore } from "react";
import { marketStatusLabel } from "@/lib/data/clock";
import { Icon } from "@/components/ui/Icon";

function subscribe(onChange: () => void) {
  const id = setInterval(onChange, 15_000);
  return () => clearInterval(id);
}

/** "Market open · 11:51 ET", kept current in the browser. */
export function MarketClock({ fixedLabel }: { fixedLabel?: string }) {
  const live = useSyncExternalStore(
    subscribe,
    () => marketStatusLabel(),
    () => null,
  );
  const label = fixedLabel ?? live ?? "Market hours";
  return (
    <span className="inline-flex items-center gap-2 text-[14px] text-ink-2 max-sm:order-2 max-sm:basis-full">
      <Icon name="clock" size={20} />
      {label}
    </span>
  );
}
