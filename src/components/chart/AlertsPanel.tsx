"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Segmented } from "@/components/ui/Segmented";
import type { AlertItem, AlertTab } from "@/lib/mock/chart";
import { CHART_ICONS } from "./icons";

const TABS: { value: AlertTab; label: string }[] = [
  { value: "Alerts", label: "Alerts" },
  { value: "History", label: "History" },
  { value: "System", label: "System" },
];

const ICON_BUTTON =
  "inline-flex size-9 items-center justify-center rounded-[10px] transition-colors hover:bg-[rgba(17,17,19,0.05)] hover:text-ink";

/** Alerts panel: active alerts, what fired, and system notices (latest two each). */
export function AlertsPanel({ alerts }: { alerts: Record<AlertTab, AlertItem[]> }) {
  const [tab, setTab] = useState<AlertTab>("Alerts");
  return (
    <section aria-label="Alerts" className="glass rounded-[24px] px-[18px] pt-3 pb-2">
      <Segmented options={TABS} value={tab} onChange={setTab} label="Alert views" className="flex-nowrap" buttonClassName="h-10 flex-1 text-[15px]" />
      <div className="mt-1 flex items-center justify-between text-ink-3">
        <button type="button" aria-label="New alert" className={ICON_BUTTON}>
          <Icon name="plus" size={19} />
        </button>
        <span className="inline-flex">
          <button type="button" aria-label="Search alerts" className={ICON_BUTTON}>
            <Icon name="search" size={18} />
          </button>
          <button type="button" aria-label="Sort alerts" className={ICON_BUTTON}>
            <Icon d={CHART_ICONS.sort} size={18} linejoin="round" />
          </button>
          <button type="button" aria-label="Alert settings" className={ICON_BUTTON}>
            <Icon name="sliders" size={18} />
          </button>
        </span>
      </div>
      <ul aria-label={tab}>
        {alerts[tab].slice(0, 2).map((a) => (
          <li key={a.text} className="flex flex-col gap-1 py-[7px]">
            <span className="text-[15px]">{a.text}</span>
            <span className="flex items-center gap-2 text-[13px] text-ink-2">
              <span
                aria-hidden="true"
                className="inline-flex size-5 items-center justify-center rounded-full bg-ink text-[10px] font-semibold text-white"
              >
                {a.symbol.charAt(0)}
              </span>
              {a.scope}
              <span aria-hidden="true" className="text-[#A1A1A8]">
                ·
              </span>
              <span style={{ color: a.stateColor }}>{a.state}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
