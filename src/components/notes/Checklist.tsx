"use client";

import { useState } from "react";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { ProgressBar } from "@/components/base/progress/progress";
import { AnimatedValue } from "@/components/motion/AnimatedValue";
import type { ChecklistItem } from "@/lib/mock/notes";
import { cx } from "@/utils/cx";
import { CARD, CARD_TITLE } from "./constants";

/**
 * Research checklist with BoardUI checkboxes (the tick draws itself), and
 * a progress bar whose fill glides to the new count.
 */
export function Checklist({ items, headingId }: { items: ChecklistItem[]; headingId: string }) {
  const [done, setDone] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(items.map((i) => [i.id, i.done])),
  );
  const count = items.filter((i) => done[i.id]).length;
  const label = `${count} of ${items.length}`;

  return (
    <section aria-labelledby={headingId} className={cx(CARD, "flex min-w-0 flex-col gap-3 p-5")}>
      <div className="flex flex-col gap-2.5">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id={headingId} className={CARD_TITLE}>
            Checklist
          </h2>
          <span className="text-body-regular whitespace-nowrap text-text-secondary">
            <AnimatedValue value={label} />
          </span>
        </div>
        <ProgressBar aria-label="Checklist progress" value={count} maxValue={items.length} valueLabel={label} size="sm" />
      </div>
      <ul className="flex flex-col">
        {items.map((item) => {
          const checked = !!done[item.id];
          return (
            <li key={item.id} className="border-t border-separator-border first:border-t-0">
              <Checkbox
                isSelected={checked}
                onChange={(isSelected) => setDone((d) => ({ ...d, [item.id]: isSelected }))}
                className="flex min-h-10 w-full py-2"
              >
                <span
                  className={cx(
                    "text-body-regular transition-colors duration-200 ease",
                    checked ? "text-text-tertiary" : "text-text-primary",
                  )}
                >
                  {item.text}
                </span>
              </Checkbox>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
