"use client";

import type { ReactNode } from "react";
import { Tab, TabList, TabPanel, Tabs } from "@/components/base/tabs/tabs";

type SectionTabsProps = {
  symbol: string;
  /** In-page target of the Earnings tab; the tab is left out without one. */
  earningsHref?: string;
  /** The Financials section itself: the panel of the selected tab. */
  children: ReactNode;
};

/**
 * The stock's sections as BoardUI underline tabs. They are links (React Aria
 * routes them through Next's router); Financials is the current one and its
 * panel is this page's content.
 */
export function SectionTabs({ symbol, earningsHref, children }: SectionTabsProps) {
  const sections = [
    { id: "chart", label: "Chart", href: `/stock/${symbol}` },
    { id: "financials", label: "Financials", href: `/stock/${symbol}/financials` },
    ...(earningsHref ? [{ id: "earnings", label: "Earnings", href: earningsHref }] : []),
    { id: "filings", label: "Filings", href: `/stock/${symbol}` },
    { id: "notes", label: "Notes", href: "/notes" },
  ];
  return (
    // Arrow keys only move focus: a link tab opens on Enter or click, never on focus.
    <Tabs selectedKey="financials" keyboardActivation="manual" className="gap-6">
      <TabList aria-label="Stock sections" items={sections}>
        {(s) => (
          <Tab id={s.id} href={s.href}>
            {s.label}
          </Tab>
        )}
      </TabList>
      <TabPanel id="financials" className="flex min-w-0 flex-col gap-6">
        {children}
      </TabPanel>
    </Tabs>
  );
}
