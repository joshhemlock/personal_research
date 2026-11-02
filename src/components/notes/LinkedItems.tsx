import Link from "next/link";
import type { LinkedItem } from "@/lib/mock/notes";
import { cx } from "@/utils/cx";
import { CARD, CARD_TITLE, LINK_ICONS } from "./constants";

/** Transcripts, statements, screens and notes this note refers to. */
export function LinkedItems({ items, headingId }: { items: LinkedItem[]; headingId: string }) {
  return (
    <section aria-labelledby={headingId} className={cx(CARD, "flex min-w-0 flex-col gap-2 p-5 pb-3")}>
      <h2 id={headingId} className={CARD_TITLE}>
        Linked
      </h2>
      <ul className="-mx-2 flex flex-col">
        {items.map((l) => {
          const Icon = LINK_ICONS[l.kind];
          return (
            <li key={l.href + l.title}>
              <Link
                href={l.href}
                className={cx(
                  "flex items-center gap-3 rounded-2xl p-2 outline-none",
                  "transition-colors duration-150 ease hover:bg-background-primary-hover active:bg-background-primary-active",
                  "focus-visible:ring-2 focus-visible:ring-border-focus-ring",
                )}
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-background-secondary-default">
                  <Icon aria-hidden className="size-4.5 text-foreground-icon-secondary" />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-body-medium text-text-primary">{l.title}</span>
                  <span className="truncate text-body-2-regular text-text-secondary">{l.meta}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
