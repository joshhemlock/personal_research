"use client";

import { useState } from "react";
import type { ChecklistItem } from "@/lib/mock/notes";

/** Research checklist with real checkboxes; the count follows them. */
export function Checklist({ items }: { items: ChecklistItem[] }) {
  const [done, setDone] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(items.map((i) => [i.id, i.done])),
  );
  const count = items.filter((i) => done[i.id]).length;

  return (
    <section aria-labelledby="ck-h" className="glass rounded-[24px] px-[18px] pt-[14px] pb-[6px]">
      <div className="mb-[2px] flex items-baseline justify-between gap-2">
        <h2 id="ck-h" className="text-[19px] font-normal">
          Checklist
        </h2>
        <span className="text-[13px] text-muted" aria-live="polite">
          {count} of {items.length}
        </span>
      </div>
      {items.map((item) => (
        // 38px rows plus the 1px top border (content-box in the design).
        <label
          key={item.id}
          className="flex min-h-[39px] cursor-pointer items-center gap-[10px] border-t border-hairline text-[14px]"
        >
          <input
            type="checkbox"
            checked={!!done[item.id]}
            onChange={(e) => setDone((d) => ({ ...d, [item.id]: e.target.checked }))}
            className="m-0 size-[17px] flex-none cursor-pointer accent-ink"
          />
          <span className={done[item.id] ? "text-muted" : "text-ink"}>{item.text}</span>
        </label>
      ))}
    </section>
  );
}
