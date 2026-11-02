import { RiAddLine, RiEqualizerLine } from "@remixicon/react";
import { Button, ButtonLink } from "@/components/base/buttons/button";
import type { EarningsEvent, WatchRow } from "@/lib/mock/overview";
import { daysBetween, longDay, reportPhrase } from "./format";

type GreetingProps = {
  title: string;
  /** Today, YYYY-MM-DD. */
  today: string;
  watchlist: WatchRow[];
  nextEarnings?: EarningsEvent;
};

/** Page heading with a one-line summary of the day, plus the Customize and Find ideas actions. */
export function Greeting({ title, today, watchlist, nextEarnings }: GreetingProps) {
  const up = watchlist.filter((r) => r.changePct >= 0).length;
  const summary = [longDay(today), `${up} of ${watchlist.length} watchlist names are up`];
  if (nextEarnings) {
    summary.push(reportPhrase(nextEarnings.symbol, daysBetween(today, nextEarnings.date)));
  }
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div className="flex min-w-0 flex-col gap-0.5">
        <h1 className="text-title-1-medium text-text-primary">{title}</h1>
        <p className="text-body-regular text-text-secondary">{summary.join(" · ")}</p>
      </div>
      <div className="flex flex-wrap gap-2.5">
        <Button variant="secondary" leadingIcon={RiEqualizerLine}>
          Customize
        </Button>
        <ButtonLink href="/screener" leadingIcon={RiAddLine}>
          Find ideas
        </ButtonLink>
      </div>
    </div>
  );
}
