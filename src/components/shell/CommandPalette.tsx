"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { UNIVERSE } from "@/lib/mock/market";
import { NOTE_INDEX } from "@/lib/mock/note-index";
import { num, pct } from "@/lib/format";
import { Icon, type IconName } from "@/components/ui/Icon";
import { TickerDot } from "@/components/ui/Pill";

type Item = {
  id: string;
  group: "Tickers" | "Go to" | "Notes";
  label: string;
  sub: string;
  href: string;
  /** Extra words to match against. */
  keywords: string;
  symbol?: string;
  icon?: IconName;
  price?: number;
  changePct?: number;
};

const PAGES: Item[] = [
  { id: "p-overview", group: "Go to", label: "Overview", sub: "Markets, watchlist, earnings", href: "/", keywords: "home dashboard", icon: "overview" },
  { id: "p-chart", group: "Go to", label: "Chart", sub: "NVDA", href: "/stock/NVDA", keywords: "candles price", icon: "chart" },
  { id: "p-fin", group: "Go to", label: "Financials", sub: "NVDA statements and valuation", href: "/stock/NVDA/financials", keywords: "income balance cash flow", icon: "financials" },
  { id: "p-screener", group: "Go to", label: "Screener", sub: "Quality compounders", href: "/screener", keywords: "filter screen ideas", icon: "screener" },
  { id: "p-notes", group: "Go to", label: "Research notes", sub: "Theses, earnings, ideas", href: "/notes", keywords: "thesis journal", icon: "notes" },
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
    icon: "notes",
  })),
];

const GROUPS: Item["group"][] = ["Tickers", "Go to", "Notes"];

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

/** ⌘K palette: jump to a ticker, a screen or a note. */
export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const results = useMemo(() => search(query), [query]);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (open && !d.open) {
      setQuery("");
      setActive(0);
      d.showModal();
    } else if (!open && d.open) {
      d.close();
    }
  }, [open]);

  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const go = (item: Item | undefined) => {
    if (!item) return;
    onClose();
    router.push(item.href);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(results.length - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(results[active]);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      aria-label="Search"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="glass mx-auto mt-[88px] w-[min(640px,calc(100vw-32px))] overflow-hidden rounded-[24px] p-0 text-ink backdrop:bg-[rgba(17,17,19,0.18)] backdrop:backdrop-blur-[2px]"
    >
      <div className="flex h-[60px] items-center gap-3 border-b border-hairline px-5">
        <Icon name="search" size={22} />
        <input
          autoFocus
          role="combobox"
          aria-expanded="true"
          aria-controls="cmdk-list"
          aria-autocomplete="list"
          aria-activedescendant={results[active] ? `cmdk-${results[active].id}` : undefined}
          aria-label="Search tickers, companies, notes"
          placeholder="Search tickers, companies, notes"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
          className="h-full flex-1 bg-transparent text-[16px] text-ink outline-none placeholder:text-ink-3"
        />
        <kbd className="rounded-full bg-[rgba(17,17,19,0.06)] px-[9px] py-1 font-sans text-[12px] text-ink-2">esc</kbd>
      </div>
      <div ref={listRef} id="cmdk-list" role="listbox" aria-label="Results" className="max-h-[min(440px,60vh)] overflow-y-auto p-2">
        {results.length === 0 && <p className="px-3 py-6 text-center text-[14px] text-muted">No matches for “{query}”.</p>}
        {GROUPS.map((g) => {
          const items = results.filter((r) => r.group === g);
          if (!items.length) return null;
          return (
            <div key={g} role="group" aria-labelledby={`cmdk-g-${g}`} className="pb-1">
              <div id={`cmdk-g-${g}`} className="px-3 pt-2 pb-1 text-[12px] text-muted">
                {g}
              </div>
              {items.map((item) => {
                // Results are already in group order, so this is the flat index.
                const i = results.indexOf(item);
                const on = i === active;
                return (
                  <div
                    key={item.id}
                    id={`cmdk-${item.id}`}
                    role="option"
                    aria-selected={on}
                    data-index={i}
                    onMouseMove={() => setActive(i)}
                    onClick={() => go(item)}
                    className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-[14px] px-3 py-1.5 ${on ? "bg-[rgba(17,17,19,0.06)]" : ""}`}
                  >
                    {item.symbol ? (
                      <TickerDot symbol={item.symbol} size={28} fontSize={12} />
                    ) : (
                      <span className="inline-flex size-7 flex-none items-center justify-center rounded-[9px] bg-[rgba(17,17,19,0.05)] text-ink-2">
                        <Icon name={item.icon ?? "search"} size={16} strokeWidth={1.6} linejoin="round" />
                      </span>
                    )}
                    <span className="flex min-w-0 flex-1 flex-col leading-[1.2]">
                      <span className="truncate text-[15px] font-medium">{item.label}</span>
                      <span className="truncate text-[12px] text-muted">{item.sub}</span>
                    </span>
                    {item.price != null && item.changePct != null && (
                      <span className="flex flex-col items-end text-[13px] leading-[1.2]">
                        <span>{num(item.price)}</span>
                        <span className={item.changePct >= 0 ? "text-up-text" : "text-down-text"}>{pct(item.changePct)}</span>
                      </span>
                    )}
                    {on && <Icon name="enter" size={16} className="text-muted" />}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </dialog>
  );
}
