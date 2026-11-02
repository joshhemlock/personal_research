"use client";

import { memo, useLayoutEffect, useRef, useState } from "react";
import { RiStarFill, RiStarLine, RiStickyNoteAddLine } from "@remixicon/react";
import { Avatar } from "@/components/base/avatar/avatar";
import { Chip } from "@/components/base/badges/chip";
import { Button, ButtonLink } from "@/components/base/buttons/button";
import { deltaColor } from "@/components/shell/delta";
import { num, pct } from "@/lib/format";
import type { Bar } from "@/lib/mock/chart";
import type { Crosshair, CrosshairSlot } from "./crosshair";
import { playEntrance } from "./motion";
import type { SecurityInfo } from "./types";

type ChartHeaderProps = {
  security: SecurityInfo;
  /** The latest bar (the readout's server-rendered values). */
  latest: Bar;
  addNoteHref: string;
  crosshair: Crosshair;
};

const READOUT: { slot: CrosshairSlot; label: string; key: "o" | "h" | "l" | "c" }[] = [
  { slot: "o", label: "O", key: "o" },
  { slot: "h", label: "H", key: "h" },
  { slot: "l", label: "L", key: "l" },
  { slot: "c", label: "C", key: "c" },
];

/**
 * Page heading: the security, today's move, the OHLC readout (it follows the
 * crosshair, written in place by the Crosshair controller), and the Add note
 * and Watch actions.
 */
export const ChartHeader = memo(function ChartHeader({ security, latest, addNoteHref, crosshair: xh }: ChartHeaderProps) {
  const [watching, setWatching] = useState(security.watched);
  const watchRef = useRef<HTMLButtonElement>(null);
  const pressed = useRef(false);
  // The new star condenses in when the user toggles it (not on first paint).
  useLayoutEffect(() => {
    if (!pressed.current) return;
    pressed.current = false;
    playEntrance(watchRef.current?.querySelector("svg"), "pop");
  }, [watching]);
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar size="lg" initials={security.symbol.charAt(0)} />
        <div className="flex min-w-0 flex-col gap-0.5">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1">
            <h1 className="truncate text-title-1-medium text-text-primary">{security.name}</h1>
            <span className="text-body-regular whitespace-nowrap text-text-secondary">
              {security.symbol} · {security.exchange}
            </span>
            <Chip color={deltaColor(security.changePct)}>{pct(security.changePct)}</Chip>
          </div>
          <p className="flex flex-wrap gap-x-3 text-body-regular text-text-tertiary">
            <span className="sr-only">Open, high, low and close:</span>
            {READOUT.map(({ slot, label, key }) => (
              <span key={slot} className="whitespace-nowrap">
                {label}{" "}
                <span ref={xh.ref(slot)} className="text-text-primary">
                  {num(latest[key])}
                </span>
              </span>
            ))}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2.5">
        <ButtonLink href={addNoteHref} variant="secondary" leadingIcon={RiStickyNoteAddLine}>
          Add note
        </ButtonLink>
        <Button
          ref={watchRef}
          variant={watching ? "secondary" : "primary"}
          aria-pressed={watching}
          leadingIcon={watching ? RiStarFill : RiStarLine}
          onClick={() => {
            pressed.current = true;
            setWatching((w) => !w);
          }}
          className="min-w-30"
        >
          {watching ? "Watching" : "Watch"}
        </Button>
      </div>
    </div>
  );
});
