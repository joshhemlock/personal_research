import Link from "next/link";
import { Chip } from "@/components/base/badges/chip";
import { LinkButton } from "@/components/base/buttons/link-button";
import type { EarningsEvent } from "@/lib/mock/overview";
import { countdown, dayOfMonth, daysBetween, monthShort } from "./format";
import { Card } from "./Card";

type UpcomingEarningsProps = {
  events: EarningsEvent[];
  /** Today, YYYY-MM-DD; the countdowns run from here. */
  today: string;
  windowDays: number;
  /** Symbols that reported earlier this week. */
  reported: string[];
};

/** Rows condense in on first paint, 40ms apart (~240ms cap). */
const STAGGER_MS = 40;
const MAX_STAGGER_MS = 240;

/** Next earnings dates for watchlist names, each linking to its financials. */
export function UpcomingEarnings({ events, today, windowDays, reported }: UpcomingEarningsProps) {
  return (
    <Card titleId="er-h" title="Upcoming earnings" note={`Next ${windowDays} days`}>
      {events.length === 0 && <p className="text-body-regular text-text-secondary">No watchlist reports in this window.</p>}
      <ul className="-mx-2 flex flex-col">
        {events.map((e, i) => {
          const days = daysBetween(today, e.date);
          return (
            <li
              key={`${e.symbol}-${e.date}`}
              className="animate-enter"
              style={{ animationDelay: `${Math.min(i * STAGGER_MS, MAX_STAGGER_MS)}ms` }}
            >
              <Link
                href={`/stock/${e.symbol}/financials`}
                className="flex items-center gap-3 rounded-2xl p-2 outline-none transition-colors duration-150 ease hover:bg-background-primary-hover active:bg-background-primary-active focus-visible:ring-2 focus-visible:ring-border-focus-ring"
              >
                <span className="flex size-12 shrink-0 flex-col items-center justify-center rounded-xl bg-background-secondary-default">
                  <span className="text-caption-2-semibold text-text-secondary uppercase">{monthShort(e.date)}</span>
                  <span className="text-headline-semibold text-text-primary">{dayOfMonth(e.date)}</span>
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-body-medium text-text-primary">
                    {e.symbol} <span className="text-text-secondary">· {e.period}</span>
                  </span>
                  <span className="text-body-2-regular text-text-secondary">
                    {e.timing}
                    {e.epsEstimate != null && ` · EPS est. ${e.epsEstimate.toFixed(2)}`}
                  </span>
                </span>
                <Chip variant="caption" color={days <= 1 ? "orange" : "neutral"}>
                  {countdown(days)}
                </Chip>
              </Link>
            </li>
          );
        })}
      </ul>
      {reported.length > 0 && (
        <p className="text-body-2-regular text-text-secondary">
          Reported this week: {reported.join(", ")} ·{" "}
          <LinkButton href="/notes" size="xs" className="align-baseline">
            Transcripts
          </LinkButton>
        </p>
      )}
    </Card>
  );
}
