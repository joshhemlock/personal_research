import type { Catalyst } from "@/lib/mock/notes";
import { dateParts } from "@/lib/mock/notes";
import { cx } from "@/utils/cx";
import { SECTION_TITLE } from "./constants";

/** Upcoming events as date cards; the next one's date is tinted. */
export function Catalysts({ items, headingId }: { items: Catalyst[]; headingId: string }) {
  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-2">
      <h2 id={headingId} className={SECTION_TITLE}>
        Catalysts
      </h2>
      <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(12rem,100%),1fr))] gap-2">
        {items.map((c, i) => {
          const { mon, day } = dateParts(c.date);
          return (
            <li
              key={`${c.date}-${c.title}`}
              className="flex min-w-0 items-center gap-3 rounded-2xl border border-border-button-default p-2 pe-3"
            >
              <time
                dateTime={c.date}
                className={cx(
                  "flex size-11 shrink-0 flex-col items-center justify-center rounded-xl",
                  i === 0
                    ? "bg-pill-tab-blue-selected-background text-button-ghost-foreground"
                    : "bg-background-secondary-default text-text-primary",
                )}
              >
                <span className={cx("text-caption-2-semibold uppercase", i !== 0 && "text-text-secondary")}>{mon}</span>
                <span className="text-headline-semibold">{day}</span>
              </time>
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-body-medium text-text-primary">{c.title}</span>
                <span className="truncate text-body-2-regular text-text-secondary">{c.meta}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
