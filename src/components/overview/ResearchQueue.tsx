"use client";

import { useState } from "react";
import { Chip } from "@/components/base/badges/chip";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { AnimatedValue } from "@/components/motion/AnimatedValue";
import type { QueueTask } from "@/lib/mock/overview";
import { cx } from "@/utils/cx";
import { Card } from "./Card";

/** Rows condense in on first paint, 40ms apart (~240ms cap). */
const STAGGER_MS = 40;
const MAX_STAGGER_MS = 240;

/**
 * Research to-dos. Checking one off draws the tick (BoardUI's checkbox),
 * fades the title to the done colour and swaps the open count in place.
 * Ticks drawn once stay drawn when the screen is shown again (Settle).
 */
export function ResearchQueue({ tasks }: { tasks: QueueTask[] }) {
  const [done, setDone] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(tasks.map((t) => [t.id, t.done])),
  );
  const open = tasks.filter((t) => !done[t.id]).length;
  return (
    <Card titleId="q-h" title="Research queue" note={<AnimatedValue value={open}>{`${open} open`}</AnimatedValue>}>
      <ul className="flex flex-col">
        {tasks.map((t, i) => {
          const checked = done[t.id];
          return (
            <li
              key={t.id}
              className="flex animate-enter items-center gap-3 border-t border-separator-border py-3 first:border-t-0 first:pt-1"
              style={{ animationDelay: `${Math.min(i * STAGGER_MS, MAX_STAGGER_MS)}ms` }}
            >
              <Checkbox
                isSelected={checked}
                onChange={(isSelected) => setDone((d) => ({ ...d, [t.id]: isSelected }))}
                className="min-w-0 flex-1 items-start"
              >
                <span className="flex min-w-0 flex-col">
                  <span
                    className={cx(
                      "text-body-medium transition-colors duration-200 ease-out",
                      checked ? "text-text-tertiary line-through" : "text-text-primary",
                    )}
                  >
                    {t.title}
                  </span>
                  <span className="text-body-2-regular text-text-secondary">{t.meta}</span>
                </span>
              </Checkbox>
              <Chip variant="caption" color="neutral" className="shrink-0">
                {t.symbol}
              </Chip>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
