import Link from "next/link";
import { RiArrowRightUpLine, RiBarChartBoxLine, RiEdit2Line, RiFileTextLine } from "@remixicon/react";
import { Avatar } from "@/components/base/avatar/avatar";
import { Chip } from "@/components/base/badges/chip";
import { ButtonLink } from "@/components/base/buttons/button";
import { CARD, CARD_TITLE } from "@/components/overview/Card";
import { AnimatedValue } from "@/components/motion/AnimatedValue";
import { deltaColor } from "@/components/shell/delta";
import { num, pct, signed } from "@/lib/format";
import { cx } from "@/utils/cx";
import type { TickerCardData } from "./types";

/** Price card for the open symbol with the user's base-case fair value. */
export function TickerCard({ card }: { card: TickerCardData }) {
  const note = card.noteHref;
  const actions = [
    { href: `/stock/${card.symbol}/financials`, label: "Open financials", icon: RiBarChartBoxLine },
    { href: note, label: "Open research note", icon: RiFileTextLine },
    { href: note, label: "Edit thesis", icon: RiEdit2Line },
  ];
  return (
    <section aria-labelledby="tk-h" className={cx(CARD, "flex min-w-0 flex-col gap-4 p-5")}>
      <div className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2.5">
          <Avatar size="md" initials={card.symbol.charAt(0)} />
          <h2 id="tk-h" className={CARD_TITLE}>
            {card.symbol}
          </h2>
        </span>
        <span className="flex items-center gap-2">
          {actions.map((a) => (
            <ButtonLink key={a.label} href={a.href} variant="secondary" size="small" iconOnly leadingIcon={a.icon} aria-label={a.label} />
          ))}
        </span>
      </div>

      <div className="flex flex-col gap-0.5">
        <span className="text-body-medium text-text-primary">
          {card.name} <span className="text-text-secondary">· {card.exchange}</span>
        </span>
        {card.classification ? <span className="text-body-2-regular text-text-secondary">{card.classification}</span> : null}
      </div>

      <div className="flex flex-col gap-1">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {/* A new quote cross-fades in; first paint and re-shows don't animate. */}
          <AnimatedValue value={num(card.price)} className="text-title-1-medium text-text-primary" />
          <span className="text-caption-1-medium text-text-secondary">{card.currency}</span>
          <Chip color={deltaColor(card.changePct)}>
            <AnimatedValue value={`${signed(card.change)} (${pct(card.changePct)})`} />
          </Chip>
        </span>
        <span className="text-caption-1-regular text-text-tertiary">{card.lastUpdate}</span>
      </div>

      <Link
        href={note}
        className={cx(
          "group -mx-2 -mb-2 flex flex-col gap-1.5 rounded-2xl border-t border-separator-border p-2 pt-4",
          "transition-colors duration-150 hover:bg-background-primary-hover active:bg-background-primary-active",
          "outline-none focus-visible:ring-2 focus-visible:ring-border-focus-ring",
        )}
      >
        <span className="flex items-center justify-between gap-2 text-caption-1-medium text-text-secondary">
          My fair value · base case
          <RiArrowRightUpLine
            aria-hidden
            className="size-4 text-foreground-icon-tertiary transition-transform duration-150 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          />
        </span>
        {card.fairValue !== null ? (
          <FairValue fair={card.fairValue} price={card.price} currency={card.currency} />
        ) : (
          <span className="text-body-medium text-text-secondary">No fair value yet</span>
        )}
      </Link>
    </section>
  );
}

/** The user's fair value and its upside against the current price. */
function FairValue({ fair, price, currency }: { fair: number; price: number; currency: string }) {
  const upside = ((fair - price) / price) * 100;
  return (
    <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
      <span className="text-title-2-medium text-text-primary">{num(fair)}</span>
      <span className="text-caption-1-medium text-text-secondary">{currency}</span>
      <span className={cx("text-body-medium", upside >= 0 ? "text-text-positive" : "text-text-negative")}>
        {upside >= 0 ? "+" : "−"}
        {Math.abs(upside).toFixed(1)}% {upside >= 0 ? "upside" : "downside"}
      </span>
    </span>
  );
}
