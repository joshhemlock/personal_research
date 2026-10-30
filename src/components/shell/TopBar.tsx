import Link from "next/link";
import { APP_NAME, APP_TAGLINE } from "@/lib/brand";
import { HEADER_INDICES, MARKET_STATUS } from "@/lib/mock/market";
import { pct } from "@/lib/format";
import { Icon } from "@/components/ui/Icon";
import { ChangePill } from "@/components/ui/Pill";
import { SearchTrigger } from "./SearchTrigger";

export type HeaderQuote = {
  symbol: string;
  price: string;
  /** e.g. "+3.95 (+2.14%)" */
  change: string;
  up: boolean;
  /** e.g. "Oct 30, 2026 · 11:51:04 AM" */
  asOf: string;
};

export function Logo({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 26 26" aria-hidden="true">
      <circle cx="13" cy="13" r="12" fill="#111113" />
      <path
        d="M6.5 17.5c3.8 0 5.5-2 6.6-4.6C14.2 10.3 15.8 8.2 19 8.2"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="19" cy="8.2" r="2" fill="#4DB07F" />
    </svg>
  );
}

export function TopBar({ quote }: { quote?: HeaderQuote }) {
  return (
    <header className="flex flex-wrap items-center gap-x-5 gap-y-3 px-1">
      <Link href="/" className="flex min-h-12 items-center gap-3 text-ink">
        <span className="inline-flex size-12 flex-none items-center justify-center rounded-full border-[1.5px] border-[#D4D4D8]">
          <Logo />
        </span>
        <span className="flex flex-col leading-[1.2]">
          <span className="text-[19px] font-semibold tracking-[-0.01em]">{APP_NAME}</span>
          <span className="text-[13px] text-muted">{APP_TAGLINE}</span>
        </span>
      </Link>
      <span aria-hidden="true" className="h-8 w-px bg-[rgba(17,17,19,0.1)] max-md:hidden" />
      <span className="inline-flex items-center gap-2 text-[14px] text-ink-2 max-sm:order-2 max-sm:basis-full">
        <Icon name="clock" size={20} />
        {MARKET_STATUS.label}
      </span>
      <SearchTrigger quote={quote} />
      <div className="ml-auto flex flex-wrap items-center gap-[22px] max-sm:order-4 max-sm:ml-0">
        {HEADER_INDICES.map((ix) => (
          <div key={ix.name} className="flex flex-col leading-[1.3]">
            <span className="flex items-center gap-2 text-[16px] font-medium">
              {ix.value}
              <ChangePill value={ix.changePct} size="sm">
                {pct(ix.changePct)}
              </ChangePill>
            </span>
            <span className="text-[12px] text-muted">{ix.label}</span>
          </div>
        ))}
      </div>
      {/* On phones the account pill moves up beside the logo. */}
      <button
        type="button"
        aria-label="Account menu"
        className="ml-[2px] inline-flex h-[52px] items-center gap-3 rounded-full border-0 bg-account pr-4 pl-[5px] text-white shadow-[0_10px_24px_-12px_rgba(17,17,19,0.5)] max-sm:order-1 max-sm:ml-auto"
      >
        <span className="inline-flex size-[42px] items-center justify-center rounded-full bg-tag">
          <Icon name="user" size={22} />
        </span>
        <Icon name="menu" size={20} strokeWidth={1.8} />
      </button>
    </header>
  );
}
