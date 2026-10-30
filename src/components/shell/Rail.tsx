import Link from "next/link";
import { Icon, type IconName } from "@/components/ui/Icon";

export type NavKey = "overview" | "chart" | "financials" | "screener" | "notes";

const TILE =
  "inline-flex size-[52px] items-center justify-center rounded-[17px] border text-ink transition-colors duration-150";
const IDLE = "glass-chip hover:bg-white";
const CURRENT = "border-transparent bg-[rgba(17,17,19,0.07)] backdrop-blur-[20px]";

const TOOLS: { label: string; icon: IconName }[] = [
  { label: "Settings", icon: "settings" },
  { label: "Ask a research question", icon: "ask" },
  { label: "Learning library", icon: "library" },
  { label: "Custom formulas", icon: "formulas" },
  { label: "Favorites", icon: "star" },
];

// Column of 52px tiles on wide screens; one scrollable row above the content
// on narrow ones.
const GROUP =
  "flex w-[60px] flex-col flex-wrap justify-center gap-2 max-[1100px]:w-auto max-[1100px]:flex-none max-[1100px]:flex-row max-[1100px]:flex-nowrap";

type RailProps = {
  active?: NavKey;
  symbol: string;
  /** Label of the "ask" tool; the notes screen scopes it to the open note. */
  askLabel?: string;
  className?: string;
};

export function Rail({ active, symbol, askLabel = "Ask a research question", className = "" }: RailProps) {
  const nav: { key: NavKey; label: string; href: string; icon: IconName }[] = [
    { key: "overview", label: "Overview", href: "/", icon: "overview" },
    { key: "chart", label: "Chart", href: `/stock/${symbol}`, icon: "chart" },
    { key: "financials", label: "Financials", href: `/stock/${symbol}/financials`, icon: "financials" },
    { key: "screener", label: "Screener", href: "/screener", icon: "screener" },
    { key: "notes", label: "Research notes", href: "/notes", icon: "notes" },
  ];
  return (
    <nav
      aria-label="Main"
      className={`flex flex-[1_1_60px] flex-wrap content-start justify-center gap-5 max-[1100px]:order-first max-[1100px]:basis-full max-[1100px]:flex-nowrap max-[1100px]:justify-start max-[1100px]:overflow-x-auto max-[1100px]:pb-1 ${className}`}
    >
      <div className={GROUP}>
        <button type="button" aria-label="Notifications" title="Notifications" className={`relative ${TILE} ${IDLE}`}>
          <Icon name="bell" size={22} strokeWidth={1.5} linejoin="round" />
          <span className="absolute top-[14px] right-[15px] size-3 rounded-full border-2 border-white bg-[#E5484D]" />
        </button>
        {nav.map((n) => {
          const on = n.key === active;
          return (
            <Link
              key={n.key}
              href={n.href}
              aria-current={on ? "page" : undefined}
              aria-label={n.label}
              title={n.label}
              className={`${TILE} ${on ? CURRENT : IDLE}`}
            >
              <Icon name={n.icon} size={22} strokeWidth={1.5} linejoin="round" />
            </Link>
          );
        })}
      </div>
      <div className={GROUP}>
        {TOOLS.map((t) => {
          const label = t.icon === "ask" ? askLabel : t.label;
          return (
            <button key={t.icon} type="button" aria-label={label} title={label} className={`${TILE} ${IDLE}`}>
              <Icon name={t.icon} size={22} strokeWidth={1.5} linejoin="round" />
            </button>
          );
        })}
      </div>
    </nav>
  );
}
