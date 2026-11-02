"use client";

import Link from "next/link";
import {
  RiBarChartBoxLine,
  RiBook2Line,
  RiDashboardLine,
  RiDatabase2Line,
  RiFilter3Line,
  RiFunctions,
  RiKeyboardBoxLine,
  RiNotification3Line,
  RiQuestionAnswerLine,
  RiSettings4Line,
  RiStarLine,
  RiStickyNoteLine,
  RiStockLine,
  RiUser3Line,
} from "@remixicon/react";
import {
  Collapsible,
  DashboardSidebar,
  type DashboardNavItem,
  type DashboardNavSection,
} from "@/components/application/dashboard/dashboard-sidebar";
import { DashboardTeamMenu, type MenuGroup } from "@/components/application/dashboard/dashboard-team-menu";
import { Avatar } from "@/components/base/avatar/avatar";
import { APP_NAME, APP_TAGLINE } from "@/lib/brand";
import { version } from "../../../package.json";
import { cx } from "@/utils/cx";
import { BrandMark } from "./Logo";
import type { NavKey } from "./nav";

export type SidebarProps = {
  active?: NavKey;
  /** Symbol the Chart and Financials rows open. */
  symbol: string;
  /** Label of the "ask" tool (scoped to the screen, e.g. "Ask about this note"). */
  askLabel: string;
  /** Live market data (TradingView) rather than the sample set. */
  live: boolean;
  /** Inside the phone drawer: always expanded, with a close button. */
  mobile?: boolean;
  onClose?: () => void;
  className?: string;
};

// The tools aren't built yet; their rows hold their place, as the rail's
// buttons did.
const notYet = () => {};

/** BoardUI's dashboard sidebar, set up with Compound's brand, screens and tools. */
export function Sidebar({ active, symbol, askLabel, live, mobile = false, onClose, className }: SidebarProps) {
  const items: DashboardNavItem[] = [
    { key: "overview", label: "Overview", icon: RiDashboardLine, href: "/" },
    { key: "chart", label: "Chart", icon: RiStockLine, href: `/stock/${symbol}` },
    { key: "financials", label: "Financials", icon: RiBarChartBoxLine, href: `/stock/${symbol}/financials` },
    { key: "screener", label: "Screener", icon: RiFilter3Line, href: "/screener" },
    { key: "notes", label: "Research notes", icon: RiStickyNoteLine, href: "/notes" },
  ];
  const tools: DashboardNavSection = {
    label: "Tools",
    items: [
      { key: "ask", label: askLabel, icon: RiQuestionAnswerLine, onPress: notYet },
      { key: "library", label: "Learning library", icon: RiBook2Line, onPress: notYet },
      { key: "formulas", label: "Custom formulas", icon: RiFunctions, onPress: notYet },
      { key: "favorites", label: "Favorites", icon: RiStarLine, onPress: notYet },
    ],
  };
  const accountGroups: MenuGroup[] = [
    {
      id: "account",
      items: [
        { icon: RiUser3Line, label: "Profile" },
        { icon: RiNotification3Line, label: "Notifications" },
        { icon: RiKeyboardBoxLine, label: "Keyboard shortcuts" },
      ],
    },
    {
      id: "data",
      label: "Market data",
      items: [{ icon: RiDatabase2Line, label: live ? "TradingView" : "Sample data", badge: live ? "Live" : "Demo" }],
    },
  ];

  return (
    <DashboardSidebar
      mobile={mobile}
      onClose={onClose}
      fluid={mobile}
      selected={active ?? ""}
      items={items}
      quickSearch={false}
      sections={[tools]}
      secondaryItems={[{ key: "settings", label: "Settings", icon: RiSettings4Line, onPress: notYet }]}
      header={({ collapsed }) => (
        <Link
          href="/"
          aria-label={`${APP_NAME}, overview`}
          className={cx(
            "flex min-w-0 items-center gap-2 rounded-full outline-none",
            "focus-visible:ring-2 focus-visible:ring-border-focus-ring focus-visible:ring-offset-2",
            collapsed && "w-9 justify-center gap-0",
          )}
        >
          <BrandMark />
          <Collapsible collapsed={collapsed}>
            <span className="flex min-w-0 flex-col">
              <span className="text-body-semibold whitespace-nowrap text-text-primary">{APP_NAME}</span>
              <span className="text-caption-1-regular whitespace-nowrap text-text-secondary">{APP_TAGLINE}</span>
            </span>
          </Collapsible>
        </Link>
      )}
      footer={({ collapsed }) => (
        <DashboardTeamMenu
          collapsed={collapsed}
          name="Account"
          detail={live ? "Live · TradingView" : "Sample data"}
          avatar={<Avatar size="md" color="neutral" icon={RiUser3Line} aria-hidden />}
          groups={accountGroups}
          footer={
            <>
              <span className="text-body-2-medium whitespace-nowrap text-text-tertiary">{APP_NAME}</span>
              <span className="inline-flex items-center justify-center rounded-sm bg-background-tertiary-default px-1 py-px text-body-2-medium whitespace-nowrap text-text-tertiary">
                v{version}
              </span>
            </>
          }
        />
      )}
      className={className}
    />
  );
}
