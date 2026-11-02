"use client";

import { useRef, type RefObject } from "react";
import { useRouter } from "next/navigation";
import { RiAlarmLine, RiCalendarLine, RiChatQuoteLine, RiFileTextLine } from "@remixicon/react";
import { Dialog, Popover } from "react-aria-components";
import {
  NotificationCenter,
  type NotificationCenterItem,
} from "@/components/application/notification-center/notification-center";
import { useDismissOnOutsidePress } from "@/utils/use-dismiss-on-outside-press";
import { cx } from "@/utils/cx";
import type { ShellNotice } from "./NotificationBell";

const SYSTEM_ICONS: Record<string, NotificationCenterItem["icon"]> = {
  Filing: RiFileTextLine,
  Calendar: RiCalendarLine,
  Transcript: RiChatQuoteLine,
};

function toItem(n: ShellNotice): NotificationCenterItem {
  const today = n.when.startsWith("Today");
  return {
    id: n.id,
    // The center's "mentions" tab is relabelled "Alerts" below.
    category: n.kind === "alert" ? "mentions" : "system",
    group: today ? "Today" : "Earlier",
    title: n.title,
    description: `${n.symbol} · ${n.state}`,
    timestamp: today ? n.when.slice("Today ".length) : n.when,
    unread: n.unread,
    status: n.kind === "alert" ? "information" : "neutral",
    icon: n.kind === "alert" ? RiAlarmLine : SYSTEM_ICONS[n.state],
    actions: [{ id: n.kind === "alert" ? "chart" : "financials", label: n.kind === "alert" ? "Open chart" : "Open financials" }],
  };
}

type NotificationPanelProps = {
  triggerRef: RefObject<HTMLButtonElement | null>;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  notices: ShellNotice[];
};

/**
 * BoardUI's notification center in a popover under the bell, holding fired
 * alerts and system notices. Loaded on demand by NotificationBell. Opens
 * and closes with BoardUI's popover blur-in (150ms, scale 95%, 2px blur),
 * growing out of the bell.
 */
export function NotificationPanel({ triggerRef, isOpen, onOpenChange, notices }: NotificationPanelProps) {
  const router = useRouter();
  const popoverRef = useRef<HTMLElement>(null);
  const items = notices.map(toItem);

  useDismissOnOutsidePress(isOpen, () => onOpenChange(false), [triggerRef, popoverRef]);

  return (
    <Popover
      ref={popoverRef}
      triggerRef={triggerRef}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      placement="bottom end"
      offset={8}
      isNonModal
      className={cx(
        "z-50 w-[440px] max-w-[calc(100vw-24px)] origin-top-right outline-none",
        "transform-gpu transition duration-150 ease-out",
        "data-[entering]:scale-95 data-[entering]:opacity-0 data-[entering]:blur-[2px]",
        "data-[exiting]:scale-95 data-[exiting]:opacity-0 data-[exiting]:blur-[2px]",
      )}
    >
      <Dialog aria-label="Notifications" className="outline-none">
        <NotificationCenter
          notifications={items}
          tabLabels={{ mentions: "Alerts" }}
          onAction={(id, action) => {
            const notice = notices.find((n) => n.id === id);
            if (!notice) return;
            onOpenChange(false);
            router.push(action === "chart" ? `/stock/${notice.symbol}` : `/stock/${notice.symbol}/financials`);
          }}
        />
      </Dialog>
    </Popover>
  );
}
