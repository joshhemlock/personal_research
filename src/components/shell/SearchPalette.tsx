"use client";

import { useEffect, useMemo, useState, type ComponentType } from "react";
import { useRouter } from "next/navigation";
import {
  RiBarChartBoxLine,
  RiDashboardLine,
  RiFilter3Line,
  RiLineChartLine,
  RiStickyNoteLine,
  RiStockLine,
} from "@remixicon/react";
import {
  CommandPalette,
  CommandPaletteItem,
  CommandPaletteSection,
} from "@/components/base/command-palette/command-palette";
import { UNIVERSE } from "@/lib/mock/market";
import { NOTE_INDEX } from "@/lib/mock/note-index";
import { num, pct } from "@/lib/format";
import { cx } from "@/utils/cx";

type IconComponent = ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>;

type Group = "Tickers" | "Go to" | "Notes";

type Item = {
  id: string;
  group: Group;
  label: string;
  sub: string;
  href: string;
  /** Extra words to match against. */
  keywords: string;
  symbol?: string;
  icon?: IconComponent;
  price?: number;
  changePct?: number;
};

const PAGES: Item[] = [
  { id: "p-overview", group: "Go to", label: "Overview", sub: "Markets, watchlist, earnings", href: "/", keywords: "home dashboard", icon: RiDashboardLine },
  { id: "p-chart", group: "Go to", label: "Chart", sub: "NVDA", href: "/stock/NVDA", keywords: "candles price", icon: RiStockLine },
  { id: "p-fin", group: "Go to", label: "Financials", sub: "NVDA statements and valuation", href: "/stock/NVDA/financials", keywords: "income balance cash flow", icon: RiBarChartBoxLine },
  { id: "p-screener", group: "Go to", label: "Screener", sub: "Quality compounders", href: "/screener", keywords: "filter screen ideas", icon: RiFilter3Line },
  { id: "p-notes", group: "Go to", label: "Research notes", sub: "Theses, earnings, ideas", href: "/notes", keywords: "thesis journal", icon: RiStickyNoteLine },
];

const ITEMS: Item[] = [
  ...UNIVERSE.map<Item>((s) => ({
    id: `t-${s.symbol}`,
    group: "Tickers",
    label: s.symbol,
    sub: `${s.name} · ${s.exchange}`,
    href: `/stock/${s.symbol}`,
    keywords: `${s.name} ${s.industry} ${s.sector}`,
    symbol: s.symbol,
    price: s.price,
    changePct: s.changePct,
  })),
  ...PAGES,
  ...NOTE_INDEX.map<Item>((n) => ({
    id: `n-${n.id}`,
    group: "Notes",
    label: n.title,
    sub: `${n.type} · ${n.date}`,
    href: `/notes/${n.id}`,
    keywords: `${n.symbol} ${n.type}`,
    icon: RiStickyNoteLine,
  })),
];

const GROUPS: Group[] = ["Tickers", "Go to", "Notes"];

type RemoteListing = { symbol: string; name: string; exchange: string };

/** Live ticker matches from /api/search (empty in sample mode). */
function useRemoteTickers(query: string): { query: string; items: Item[] } {
  const [state, setState] = useState<{ query: string; items: Item[] }>({ query: "", items: [] });
  useEffect(() => {
    const q = query.trim();
    if (!q) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: ctrl.signal });
        const { results } = (await res.json()) as { results: RemoteListing[] };
        setState({
          query,
          items: results.map((r) => ({
            id: `r-${r.symbol}`,
            group: "Tickers",
            label: r.symbol,
            sub: `${r.name} · ${r.exchange}`,
            href: `/stock/${r.symbol}`,
            keywords: r.name,
            symbol: r.symbol,
          })),
        });
      } catch {
        // Aborted or offline: keep the local matches.
      }
    }, 200);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [query]);
  return state;
}

/** Local matches first, then live tickers that aren't already listed. */
function merge(local: Item[], remote: Item[]): Item[] {
  const known = new Set(local.filter((i) => i.symbol).map((i) => i.symbol));
  const extra = remote.filter((r) => !known.has(r.symbol)).slice(0, 6);
  if (!extra.length) return local;
  const tickers = [...local.filter((i) => i.group === "Tickers"), ...extra];
  return [...tickers, ...local.filter((i) => i.group !== "Tickers")];
}

function search(query: string): Item[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    // A short default list: a few tickers, every page, recent notes.
    return [...ITEMS.filter((i) => i.group === "Tickers").slice(0, 5), ...PAGES, ...ITEMS.filter((i) => i.group === "Notes").slice(0, 3)];
  }
  const scored = ITEMS.map((i) => {
    const label = i.label.toLowerCase();
    let score = 0;
    if (label === q) score = 100;
    else if (label.startsWith(q)) score = 60;
    else if (label.includes(q)) score = 40;
    else if (`${i.sub} ${i.keywords}`.toLowerCase().includes(q)) score = 20;
    return { i, score };
  }).filter((x) => x.score > 0);
  scored.sort((a, b) => b.score - a.score);
  // Keep group order stable for display.
  const top = scored.slice(0, 12).map((x) => x.i);
  return GROUPS.flatMap((g) => top.filter((i) => i.group === g));
}

type SearchPaletteProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  /** Live data: the sample prices of local tickers would be wrong, so rows leave them out. */
  live: boolean;
};

/**
 * ⌘K / Ctrl+K search: jump to a ticker, a screen or a note. BoardUI's command
 * palette with Compound's own ranking: local tickers, pages and notes, plus
 * live listings from /api/search. Arrow keys move, Enter opens, Escape clears
 * and then closes.
 */
export function SearchPalette({ isOpen, onOpenChange, live }: SearchPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const remote = useRemoteTickers(query);
  const results = useMemo(
    () => merge(search(query), remote.query === query && query.trim() ? remote.items : []),
    [query, remote],
  );
  const hrefs = useMemo(() => new Map(results.map((r) => [r.id, r.href])), [results]);

  return (
    <CommandPalette
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      aria-label="Search"
      placeholder="Search tickers, companies, notes"
      inputValue={query}
      onInputChange={setQuery}
      filter={null}
      emptyState={`No matches for “${query}”.`}
      onAction={(key) => {
        const href = hrefs.get(String(key));
        if (href) router.push(href);
      }}
    >
      {GROUPS.map((group) => {
        const items = results.filter((r) => r.group === group);
        if (!items.length) return null;
        return (
          <CommandPaletteSection key={group} title={group}>
            {items.map((item) => (
              <CommandPaletteItem
                key={item.id}
                id={item.id}
                textValue={`${item.label} ${item.sub}`}
                icon={item.symbol ? RiLineChartLine : item.icon}
                description={live ? undefined : <ItemEnd item={item} />}
              >
                <span className="shrink-0">{item.label}</span>
                <span className="truncate text-body-regular text-text-secondary">{item.sub}</span>
              </CommandPaletteItem>
            ))}
          </CommandPaletteSection>
        );
      })}
    </CommandPalette>
  );
}

/** Sample price and day change, for tickers the sample data knows. */
function ItemEnd({ item }: { item: Item }) {
  if (item.price == null || item.changePct == null) return null;
  return (
    <span className="flex items-center gap-2 text-body-2-medium">
      <span className="text-text-secondary">{num(item.price)}</span>
      <span className={cx(item.changePct >= 0 ? "text-text-positive" : "text-text-negative")}>{pct(item.changePct)}</span>
    </span>
  );
}
