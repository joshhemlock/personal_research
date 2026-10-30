import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

type GreetingProps = {
  title: string;
  /** Date and day summary, e.g. "Friday, October 30 · 5 of 8 watchlist names are up". */
  summary: string;
};

/** Page heading with the Customize and Find ideas actions. */
export function Greeting({ title, summary }: GreetingProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 px-1">
      <div>
        <h1 className="text-[26px] font-normal tracking-[-0.02em]">{title}</h1>
        <p className="text-[14px] text-ink-3">{summary}</p>
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
