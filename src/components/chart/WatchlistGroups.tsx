"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { pct } from "@/lib/format";
import type { GroupLinks } from "./types";

const ROW = "grid min-h-[34px] grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_64px] items-center gap-2 text-[14px] text-ink";

/** Collapsible watchlist groups ("Semiconductors 4", "Mega-cap tech 5"). */
export function WatchlistGroups({ groups }: { groups: readonly GroupLinks[] }) {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const baseId = useId();
  return (
    <div className="mt-1.5 flex flex-col border-t border-[rgba(17,17,19,0.06)]">
      {groups.map((g) => {
        const expanded = !!open[g.id];
        const panelId = `${baseId}-${g.id}`;
        return (
          <div key={g.id}>
            <button
              type="button"
              aria-expanded={expanded}
              aria-controls={panelId}
              onClick={() => setOpen((o) => ({ ...o, [g.id]: !o[g.id] }))}
              className="flex h-[42px] w-full items-center gap-3 rounded-[10px] px-1 text-left text-[15px] text-ink transition-colors hover:bg-[rgba(17,17,19,0.03)]"
            >
              <Icon
                name="chevronRight"
                size={14}
                strokeWidth={2.2}
                linejoin="round"
                className={`transition-transform duration-150 ${expanded ? "rotate-90" : ""}`}
              />
              <span className="flex-1">{g.name}</span>
              <span className="text-[13px] text-muted">{g.items.length}</span>
            </button>
            <div id={panelId} hidden={!expanded} className="pb-2 pl-[26px]">
              {g.items.map((w) => {
                const cells = (
                  <>
                    <span>{w.symbol}</span>
                    <span className="text-right">{w.last}</span>
                    <span className={`text-right ${w.changePct < 0 ? "text-down-text" : "text-up-text"}`}>{pct(w.changePct)}</span>
                  </>
                );
                return w.href ? (
                  <Link key={w.symbol} href={w.href} className={`${ROW} rounded-md hover:text-focus`}>
                    {cells}
                  </Link>
                ) : (
                  <div key={w.symbol} className={ROW}>
                    {cells}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
