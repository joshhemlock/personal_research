"use client";

import { useState } from "react";
import { TickerDot } from "@/components/ui/Pill";
import type { QueueTask } from "@/lib/mock/overview";
import { PANEL, PanelHeading } from "./Panel";

/** Research to-dos. Checking one off strikes it through and updates the open count. */
export function ResearchQueue({ tasks }: { tasks: QueueTask[] }) {
  const [done, setDone] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(tasks.map((t) => [t.id, t.done])),
  );
  const open = tasks.filter((t) => !done[t.id]).length;
  return (
    <section aria-labelledby="q-h" className={`${PANEL} pb-1`}>
      <PanelHeading id="q-h" title="Research queue" note={`${open} open`} className="mb-1" />
      <ul>
        {tasks.map((t) => {
          const checked = done[t.id];
          return (
            <li key={t.id}>
              {/* 55px = the design's 50px content-box min-height + 2px padding ×2 + 1px border. */}
              <label className="flex min-h-[55px] cursor-pointer items-center gap-3 border-t border-hairline py-[2px]">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => setDone((d) => ({ ...d, [t.id]: !d[t.id] }))}
                  className="size-[18px] flex-none accent-ink"
                />
                <span className="flex min-w-0 flex-1 flex-col leading-[1.3]">
                  <span className={`text-[15px] ${checked ? "text-muted line-through" : "text-ink"}`}>{t.title}</span>
                  <span className="text-[13px] text-muted">{t.meta}</span>
                </span>
                <TickerDot symbol={t.symbol} size={26} fontSize={11} />
              </label>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
