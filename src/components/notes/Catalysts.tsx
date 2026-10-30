import type { Catalyst } from "@/lib/mock/notes";
import { dateParts } from "@/lib/mock/notes";

/** Upcoming events as date cards; the first (next) one has a dark date. */
export function Catalysts({ items }: { items: Catalyst[] }) {
  return (
    <section aria-labelledby="note-catalysts-h" className="flex flex-col gap-2">
      <h2 id="note-catalysts-h" className="text-[17px] font-medium">
        Catalysts
      </h2>
      <ul className="flex flex-wrap gap-2">
        {items.map((c, i) => {
          const { mon, day } = dateParts(c.date);
          return (
            <li
              key={`${c.date}-${c.title}`}
              className="flex flex-[1_1_150px] items-center gap-[10px] rounded-[14px] bg-[rgba(17,17,19,0.04)] px-3 py-2"
            >
              <time
                dateTime={c.date}
                className={`inline-flex size-[42px] flex-none flex-col items-center justify-center rounded-[12px] leading-[1.05] ${
                  i === 0 ? "bg-ink text-white" : "bg-[rgba(17,17,19,0.08)] text-ink"
                }`}
              >
                <span className="text-[10px] uppercase">{mon}</span>
                <span className="text-[16px]">{day}</span>
              </time>
              <span className="flex flex-col leading-[1.25]">
                <span className="text-[14px]">{c.title}</span>
                <span className="text-[12px] text-muted">{c.meta}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
