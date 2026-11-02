"use client";

import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { RiNotificationLine } from "@remixicon/react";
import { IconButton } from "@/components/base/buttons/icon-button";
import { cx } from "@/utils/cx";
import { whenIdle } from "./preload";

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

// The panel (BoardUI's notification center) loads on demand: fetched once
// the page is idle, or when the bell is hovered or focused, so a click
// still opens it at once.
// One import() shared by the preload and the component (same chunk).
let panel: Promise<typeof import("./NotificationPanel")> | undefined;
const loadPanel = () => (panel ??= import("./NotificationPanel"));
const NotificationPanel = lazy(() => loadPanel().then((m) => ({ default: m.NotificationPanel })));

/**
 * The top bar's bell: the unread count on the glyph, opening the
 * notification center with fired alerts and system notices.
 */
export function NotificationBell({ notices, className }: { notices: ShellNotice[]; className?: string }) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  // Mounted on first use, then kept so it can animate out.
  const [used, setUsed] = useState(false);
  const unread = notices.filter((n) => n.unread).length;
  const preload = () => void loadPanel();

  useEffect(() => whenIdle(loadPanel), []);

  return (
    <>
      <span className={cx("group relative inline-flex shrink-0", className)}>
        <IconButton
          ref={triggerRef}
          icon={RiNotificationLine}
          aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
          onClick={() => {
            setUsed(true);
            setIsOpen((open) => !open);
          }}
          onPointerEnter={preload}
          onFocus={preload}
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
      {used && (
        <Suspense fallback={null}>
          <NotificationPanel triggerRef={triggerRef} isOpen={isOpen} onOpenChange={setIsOpen} notices={notices} />
        </Suspense>
      )}
    </>
  );
}
