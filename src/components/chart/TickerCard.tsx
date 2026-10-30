import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { TickerDot } from "@/components/ui/Pill";
import { num, signed, pct } from "@/lib/format";
import { CHART_ICONS } from "./icons";
import type { TickerCardData } from "./types";

const ICON_LINK =
  "inline-flex size-9 items-center justify-center rounded-[10px] transition-colors hover:bg-[rgba(17,17,19,0.05)] hover:text-ink";

const tone = (v: number) => (v < 0 ? "text-down-text" : "text-up-text");

/** Price card for the open symbol with the user's base-case fair value. */
export function TickerCard({ card }: { card: TickerCardData }) {
  const note = card.noteHref;
  return (
    <section aria-labelledby="tk-h" className="glass flex flex-col gap-[9px] rounded-[24px] px-[18px] py-4">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-2.5">
          <TickerDot symbol={card.symbol} size={34} fontSize={15} />
          <h2 id="tk-h" className="text-[22px] font-medium">
            {card.symbol}
          </h2>
        </span>
        <span className="inline-flex text-ink-3">
          <Link href={`/stock/${card.symbol}/financials`} aria-label="Open financials" className={ICON_LINK}>
            <Icon name="financials" size={18} />
          </Link>
          <Link href={note} aria-label="Open research note" className={ICON_LINK}>
            <Icon name="notes" size={18} linejoin="round" />
          </Link>
          <Link href={note} aria-label="Edit thesis" className={ICON_LINK}>
            <Icon d={CHART_ICONS.edit} size={18} linejoin="round" />
          </Link>
        </span>
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-[16px]">
          {card.name} <span className="text-muted">↗ ·</span> {card.exchange}
        </span>
        {card.classification ? <span className="text-[13px] text-ink-3">{card.classification}</span> : null}
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="flex flex-wrap items-baseline gap-2">
          <span className="text-[28px] font-normal tracking-[-0.02em]">{num(card.price)}</span>
          <span className="text-[14px]">{card.currency}</span>
          <span className={`text-[18px] ${tone(card.change)}`}>
            {signed(card.change)} ({pct(card.changePct)})
          </span>
        </span>
        <span className="text-[13px] text-muted">{card.lastUpdate}</span>
      </div>
      <span aria-hidden="true" className="h-px bg-[rgba(17,17,19,0.07)]" />
      <Link href={note} className="group flex flex-col gap-1 text-ink">
        {card.fairValue !== null ? (
          <FairValue fair={card.fairValue} price={card.price} currency={card.currency} />
        ) : (
          <span className="text-[15px] text-muted group-hover:text-focus">No fair value yet</span>
        )}
        <span className="inline-flex h-[22px] items-center self-start rounded-md bg-ink px-[9px] text-[12px] font-medium text-white">
          My fair value · base case
        </span>
      </Link>
    </section>
  );
}

/** The user's fair value and its upside against the current price. */
function FairValue({ fair, price, currency }: { fair: number; price: number; currency: string }) {
  const upside = ((fair - price) / price) * 100;
  return (
    <span className="flex flex-wrap items-baseline gap-2">
      <span className="text-[24px] font-normal tracking-[-0.02em] group-hover:text-focus">{num(fair)}</span>
      <span className="text-[14px]">{currency}</span>
      <span className={`text-[17px] ${tone(upside)}`}>
        {upside >= 0 ? "+" : "−"}
        {Math.abs(upside).toFixed(1)}% {upside >= 0 ? "upside" : "downside"}
      </span>
    </span>
  );
}
