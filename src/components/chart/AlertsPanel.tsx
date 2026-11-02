"use client";

import { useCallback, useRef, useState } from "react";
import type { Key } from "react-aria-components";
import { RiAddLine, RiArrowUpDownLine, RiSearchLine } from "@remixicon/react";
import { Avatar } from "@/components/base/avatar/avatar";
import { Chip, type ChipColor } from "@/components/base/badges/chip";
import { IconButton } from "@/components/base/buttons/icon-button";
import { Tab, TabList, TabPanel, Tabs } from "@/components/base/tabs/tabs";
import { CARD, CARD_TITLE } from "@/components/overview/Card";
import type { AlertItem, AlertTab } from "@/lib/mock/chart";
import { cx } from "@/utils/cx";
import { playEntrance } from "./motion";

const TABS: AlertTab[] = ["Alerts", "History", "System"];

/** Chip colour for an alert's state ("Active", "Triggered", "Filing"…). */
function stateColor(state: string): ChipColor {
  switch (state) {
    case "Active":
      return "lime";
    case "Triggered":
      return "yellow";
    case "Filing":
    case "Calendar":
    case "Transcript":
      return "blue";
    default:
      return "gray";
  }
}

/** Alerts panel: active alerts, what fired, and system notices (latest two each), as BoardUI tabs. */
export function AlertsPanel({ alerts }: { alerts: Record<AlertTab, AlertItem[]> }) {
  const [tab, setTab] = useState<Key>("Alerts");
  // The first panel is part of the page's entrance; a panel the user
  // switches to condenses in as it mounts.
  const switched = useRef(false);
  const enter = useCallback((el: HTMLDivElement | null) => {
    if (switched.current) playEntrance(el, "enter");
  }, []);
  return (
    <section aria-labelledby="al-h" className={cx(CARD, "flex min-w-0 flex-col gap-2 p-5")}>
      <div className="flex items-center justify-between gap-3">
        <h2 id="al-h" className={CARD_TITLE}>
          Alerts
        </h2>
        <div className="flex items-center gap-2">
          <IconButton size="small" icon={RiSearchLine} aria-label="Search alerts" />
          <IconButton size="small" icon={RiArrowUpDownLine} aria-label="Sort alerts" />
          <IconButton size="small" icon={RiAddLine} aria-label="New alert" />
        </div>
      </div>
      <Tabs
        selectedKey={tab}
        onSelectionChange={(key) => {
          switched.current = true;
          setTab(key);
        }}
        className="gap-1"
      >
        <TabList aria-label="Alert views">
          {TABS.map((t) => (
            <Tab key={t} id={t} count={alerts[t].length}>
              {t}
            </Tab>
          ))}
        </TabList>
        {TABS.map((t) => (
          <TabPanel key={t} id={t} ref={enter}>
            <ul className="flex flex-col">
              {alerts[t].slice(0, 2).map((a) => (
                <li key={a.text} className="flex flex-col gap-1.5 border-b border-separator-border py-3 last:border-b-0 last:pb-0">
                  <span className="text-body-medium text-text-primary">{a.text}</span>
                  <span className="flex items-center gap-2 text-body-2-regular text-text-secondary">
                    <Avatar size="xs" initials={a.symbol.charAt(0)} />
                    <span className="min-w-0 truncate">{a.scope}</span>
                    <Chip variant="caption" color={stateColor(a.state)} className="ms-auto py-0.5">
                      {a.state}
                    </Chip>
                  </span>
                </li>
              ))}
            </ul>
          </TabPanel>
        ))}
      </Tabs>
    </section>
  );
}
