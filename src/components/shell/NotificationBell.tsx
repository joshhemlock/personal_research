"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  RiAlarmLine,
  RiCalendarLine,
  RiChatQuoteLine,
  RiFileTextLine,
  RiNotificationLine,
} from "@remixicon/react";
import { Dialog, Popover } from "react-aria-components";
import {
  NotificationCenter,
  type NotificationCenterItem,
} from "@/components/application/notification-center/notification-center";
import { IconButton } from "@/components/base/buttons/icon-button";
import { useDismissOnOutsidePress } from "@/utils/use-dismiss-on-outside-press";
import { cx } from "@/utils/cx";

/** One alert or notice, as the server hands it over. */
export type ShellNotice = {
  id: string;
  /** "alert": a price or indicator alert that fired; "system": filings, calendar, transcripts. */
  kind: "alert" | "system";
  title: string;
  symbol: string;
  /** "Today 10:42", "Oct 22". */
  when: string;
  /** "Triggered", "Filing", "Calendar", "Transcript". */
  state: string;
  unread: boolean;
};

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

/**
 * The top bar's bell: the unread count on the glyph and BoardUI's
 * notification center in a popover, holding fired alerts and system notices.
 */
export function NotificationBell({ notices, className }: { notices: ShellNotice[]; className?: string }) {
  const router = useRouter();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const items = notices.map(toItem);
  const unread = items.filter((item) => item.unread).length;

  useDismissOnOutsidePress(isOpen, () => setIsOpen(false), [triggerRef, popoverRef]);

  return (
    <>
      <span className={cx("group relative inline-flex shrink-0", className)}>
        <IconButton
          ref={triggerRef}
          icon={RiNotificationLine}
          aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
          onClick={() => setIsOpen((open) => !open)}
        />
        {unread > 0 && (
          <span
            aria-hidden
            className="pointer-events-none absolute top-0.5 start-[18px] flex size-4 items-center justify-center rounded-full border-[1.5px] border-background-primary-default bg-foreground-icon-error text-caption-2-bold text-text-white"
          >
            {unread}
          </span>
        )}
      </span>
      <Popover
        ref={popoverRef}
        triggerRef={triggerRef}
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        placement="bottom end"
        offset={8}
        isNonModal
        className={cx(
          "z-50 w-[440px] max-w-[calc(100vw-24px)] outline-none",
          "transition duration-150 ease-out",
          "data-[entering]:scale-95 data-[entering]:opacity-0 data-[entering]:blur-[2px]",
          "data-[exiting]:scale-95 data-[exiting]:opacity-0 data-[exiting]:blur-[2px]",
          "origin-top-right",
        )}
      >
        <Dialog aria-label="Notifications" className="outline-none">
          <NotificationCenter
            notifications={items}
            tabLabels={{ mentions: "Alerts" }}
            onAction={(id, action) => {
              const notice = notices.find((n) => n.id === id);
              if (!notice) return;
              setIsOpen(false);
              router.push(action === "chart" ? `/stock/${notice.symbol}` : `/stock/${notice.symbol}/financials`);
            }}
          />
        </Dialog>
      </Popover>
    </>
  );
}
