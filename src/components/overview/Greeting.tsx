import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import type { EarningsEvent, WatchRow } from "@/lib/mock/overview";
import { daysBetween, longDay } from "./format";

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
    summary.push(`${nextEarnings.symbol} reports in ${daysBetween(today, nextEarnings.date)} days`);
  }
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 px-1">
      <div>
        <h1 className="text-[26px] font-normal tracking-[-0.02em]">{title}</h1>
        <p className="text-[14px] text-ink-3">{summary.join(" · ")}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="glass-chip inline-flex h-[42px] items-center gap-2 rounded-full px-[18px] text-[15px] text-ink transition-colors duration-150 hover:bg-white"
        >
          <Icon name="sliders" size={18} />
          Customize
        </button>
        <Link
          href="/screener"
          className="inline-flex h-[42px] items-center gap-2 rounded-full bg-ink px-5 text-[15px] font-medium text-white transition-colors duration-150 hover:bg-[#2C2C31]"
        >
          <Icon name="plus" size={18} strokeWidth={1.8} />
          Find ideas
        </Link>
      </div>
    </div>
  );
}
