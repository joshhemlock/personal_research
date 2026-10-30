import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { TickerDot } from "@/components/ui/Pill";
import { pct } from "@/lib/format";
import type { FinancialsData } from "@/lib/mock/financials";
import { ExportButton } from "./ExportButton";

const TAB = "inline-flex h-9 items-center rounded-full px-4 text-[14px] transition-colors duration-150";
const TAB_ON = "bg-white text-ink shadow-seg";
const TAB_OFF = "text-ink-3 hover:text-ink";

type FinancialsHeaderProps = {
  data: FinancialsData;
  changePct: number;
};

/** Ticker chip, stock section tabs, Export and "Add to thesis". */
export function FinancialsHeader({ data, changePct }: FinancialsHeaderProps) {
  const { symbol, name } = data;
  const up = changePct >= 0;
  const tabs = [
    { label: "Chart", href: `/stock/${symbol}` },
    { label: "Financials", href: `/stock/${symbol}/financials`, current: true },
    { label: "Earnings", href: "#earnings", hash: true },
    { label: "Filings", href: `/stock/${symbol}` },
    { label: "Notes", href: "/notes" },
  ];
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2.5">
      <div className="glass-chip inline-flex h-[46px] items-center gap-2.5 rounded-full pr-3 pl-[5px]">
        <TickerDot symbol={symbol} size={34} fontSize={15} />
        <h1 className="m-0 text-[16px] font-medium">
          {name} <span className="text-muted">·</span> Financials
        </h1>
        <span
          className={`inline-flex h-[22px] items-center rounded-full px-2 text-[12px] font-semibold ${
            up ? "bg-up-pill text-up-pill-text" : "bg-down-pill text-down-pill-text"
          }`}
        >
          {pct(changePct)}
        </span>
      </div>
      <nav aria-label="Stock sections" className="flex flex-wrap gap-[2px] rounded-full bg-track p-1">
        {tabs.map((t) =>
          t.hash ? (
            <a key={t.label} href={t.href} className={`${TAB} ${TAB_OFF}`}>
              {t.label}
            </a>
          ) : (
            <Link
              key={t.label}
              href={t.href}
              aria-current={t.current ? "page" : undefined}
              className={`${TAB} ${t.current ? TAB_ON : TAB_OFF}`}
            >
              {t.label}
            </Link>
          ),
        )}
      </nav>
      {/* Actions stay together and right-aligned, also when they wrap to their own line. */}
      <div className="ml-auto flex items-center gap-3">
        <ExportButton
          symbol={symbol}
          quarters={data.quarters.slice(4)}
          years={data.years}
          statements={data.statements}
        />
        <Link
          href={data.thesisHref}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-[15px] font-medium text-white transition-colors duration-150 hover:bg-[#2A2A2E]"
        >
          <Icon d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4" size={18} linejoin="round" />
          Add to thesis
        </Link>
      </div>
    </div>
  );
}
