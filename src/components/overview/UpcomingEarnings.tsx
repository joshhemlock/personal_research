import Link from "next/link";
import type { EarningsEvent } from "@/lib/mock/overview";
import { dayCount, dayOfMonth, daysBetween, monthShort } from "./format";
import { PANEL, PanelHeading } from "./Panel";

type UpcomingEarningsProps = {
  events: EarningsEvent[];
  /** Today, YYYY-MM-DD; the badges count days from here. */
  today: string;
  windowDays: number;
  /** Symbols that reported earlier this week. */
  reported: string[];
};

/** Next earnings dates for watchlist names, each linking to its financials. */
export function UpcomingEarnings({ events, today, windowDays, reported }: UpcomingEarningsProps) {
  return (
    <section aria-labelledby="er-h" className={`${PANEL} pb-[14px]`}>
      <PanelHeading id="er-h" title="Upcoming earnings" note={`Next ${windowDays} days`} className="mb-[2px]" />
      <ul>
        {events.map((e) => (
          <li key={`${e.symbol}-${e.date}`}>
            <Link
              href={`/stock/${e.symbol}/financials`}
              className="flex items-center gap-[14px] py-[6px] text-ink hover:text-focus"
            >
              <span className="flex size-[50px] flex-none flex-col items-center justify-center rounded-[15px] bg-track leading-[1.1]">
                <span className="text-[12px] tracking-[0.04em] text-muted uppercase">{monthShort(e.date)}</span>
                <span className="text-[20px] font-normal">{dayOfMonth(e.date)}</span>
              </span>
              <span className="flex min-w-0 flex-1 flex-col leading-[1.35]">
                <span className="text-[15px]">
                  <span className="font-medium">{e.symbol}</span> <span className="text-ink-3">· {e.period}</span>
                </span>
                <span className="text-[13px] text-muted">
                  {e.timing} · EPS est. {e.epsEstimate.toFixed(2)}
                </span>
              </span>
              <span className="inline-flex h-6 flex-none items-center rounded-[6px] bg-ink px-[9px] text-[12px] text-white">
                {dayCount(daysBetween(today, e.date))}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-[6px] text-[13px] text-ink-3">
        Reported this week: {reported.join(", ")} ·{" "}
        {/* Plain underline: the design uses the browser's default offset (the `link` utility adds 2px). */}
        <Link href="/notes" className="text-ink underline hover:text-focus">
          Transcripts
        </Link>
      </p>
    </section>
  );
}
