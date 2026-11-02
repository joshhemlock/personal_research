"use client";

import { memo, useState, type ComponentProps, type ComponentType, type ReactNode } from "react";
import { Focusable } from "react-aria-components";
import {
  RiArrowDownSLine,
  RiCameraLine,
  RiFullscreenExitLine,
  RiFullscreenLine,
  RiFunctionAddLine,
  RiLineChartLine,
  RiListCheck3,
  RiSettings4Line,
  RiStackLine,
  RiStockLine,
} from "@remixicon/react";
import { buttonStyles } from "@/components/base/buttons/button";
import { IconButton } from "@/components/base/buttons/icon-button";
import { LinkButton } from "@/components/base/buttons/link-button";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Dropdown, DropdownDivider, DropdownGroup, DropdownPopover, DropdownTrigger } from "@/components/base/dropdown/dropdown";
import { SegmentedControl, SegmentedControlItem } from "@/components/base/segmented-control/segmented-control";
import { Switch } from "@/components/base/switch/switch";
import { Tooltip, TooltipTrigger } from "@/components/base/tooltip/tooltip";
import type { CompareSeries } from "@/lib/mock/chart";
import { cx } from "@/utils/cx";
import { TIMEFRAMES, type Timeframe } from "./scale";
import { SERIES_FILL } from "./tokens";
import type { ChartType, DisplayPrefs, SeriesKey, Visibility } from "./types";

type ChartToolbarProps = {
  tf: Timeframe;
  onTf: (tf: Timeframe) => void;
  type: ChartType;
  onType: (type: ChartType) => void;
  compare: readonly Pick<CompareSeries, "key" | "symbol" | "name">[];
  show: Visibility;
  onShow: (key: SeriesKey, on: boolean) => void;
  legend: boolean;
  onLegend: (on: boolean) => void;
  prefs: DisplayPrefs;
  onPrefs: (prefs: DisplayPrefs) => void;
  onSnapshot: () => void;
  fullscreen: boolean;
  onFullscreen: () => void;
};

type IconComponent = ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>;

const TYPES: { value: ChartType; label: string; icon: IconComponent }[] = [
  { value: "candles", label: "Candlestick chart", icon: RiStockLine },
  { value: "line", label: "Line chart", icon: RiLineChartLine },
];

/** A single-select change handler for BoardUI's segmented control. */
const pick =
  <T extends string>(set: (value: T) => void) =>
  (keys: Iterable<unknown>) => {
    const next = [...keys][0] as T | undefined;
    if (next !== undefined) set(next);
  };

/**
 * Time range, chart type, Compare and Indicators menus, legend toggle and
 * chart actions. Each group is memoised on its own props, so a change
 * re-renders only the control that shows it.
 */
export function ChartToolbar(p: ChartToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <RangeControl tf={p.tf} onTf={p.onTf} />
      <TypeControl type={p.type} onType={p.onType} />
      <CompareMenu compare={p.compare} show={p.show} onShow={p.onShow} />
      <IndicatorsMenu sma={p.show.sma} volume={p.show.volume} onShow={p.onShow} />
      <LegendToggle legend={p.legend} onLegend={p.onLegend} />
      <span className="flex-1" />
      <ChartActions
        prefs={p.prefs}
        onPrefs={p.onPrefs}
        onSnapshot={p.onSnapshot}
        fullscreen={p.fullscreen}
        onFullscreen={p.onFullscreen}
      />
    </div>
  );
}

const RangeControl = memo(function RangeControl({ tf, onTf }: Pick<ChartToolbarProps, "tf" | "onTf">) {
  return (
    <SegmentedControl aria-label="Time range" selectedKeys={[tf]} onSelectionChange={pick(onTf)}>
      {TIMEFRAMES.map((t) => (
        <SegmentedControlItem key={t} id={t} className="min-w-9">
          {t}
        </SegmentedControlItem>
      ))}
    </SegmentedControl>
  );
});

const TypeControl = memo(function TypeControl({ type, onType }: Pick<ChartToolbarProps, "type" | "onType">) {
  return (
    <SegmentedControl aria-label="Chart type" selectedKeys={[type]} onSelectionChange={pick(onType)}>
      {TYPES.map(({ value, label, icon: Icon }) => (
        <TooltipTrigger key={value}>
          <SegmentedControlItem id={value} aria-label={label} className="px-2">
            <Icon aria-hidden className="size-5" />
          </SegmentedControlItem>
          <Tooltip>{label}</Tooltip>
        </TooltipTrigger>
      ))}
    </SegmentedControl>
  );
});

const CompareMenu = memo(function CompareMenu({ compare, show, onShow }: Pick<ChartToolbarProps, "compare" | "show" | "onShow">) {
  return (
    <Menu label="Compare" icon={RiStackLine}>
      <DropdownGroup label="Overlay, rebased to the first bar">
        {compare.map((c) => (
          <MenuCheck key={c.key} checked={show[c.key]} onChange={(on) => onShow(c.key, on)} dot={SERIES_FILL[c.key]}>
            <span className="text-text-primary">{c.symbol}</span>
            <span className="truncate text-text-secondary">{c.name}</span>
          </MenuCheck>
        ))}
      </DropdownGroup>
    </Menu>
  );
});

type IndicatorsProps = { sma: boolean; volume: boolean; onShow: ChartToolbarProps["onShow"] };

const IndicatorsMenu = memo(function IndicatorsMenu({ sma, volume, onShow }: IndicatorsProps) {
  return (
    <Menu label="Indicators" icon={RiFunctionAddLine}>
      <MenuCheck checked={sma} onChange={(on) => onShow("sma", on)} dot={SERIES_FILL.sma}>
        <span className="text-text-primary">SMA 50</span>
        <span className="truncate text-text-secondary">50-day average</span>
      </MenuCheck>
      <MenuCheck checked={volume} onChange={(on) => onShow("volume", on)} dot={SERIES_FILL.volume}>
        <span className="text-text-primary">Volume</span>
      </MenuCheck>
    </Menu>
  );
});

const LegendToggle = memo(function LegendToggle({ legend, onLegend }: Pick<ChartToolbarProps, "legend" | "onLegend">) {
  return (
    <Hint label={legend ? "Hide legend" : "Show legend"}>
      <IconButton
        icon={RiListCheck3}
        aria-label="Legend"
        aria-pressed={legend}
        onClick={() => onLegend(!legend)}
        className="aria-pressed:border-border-button-hover aria-pressed:bg-background-secondary-default"
      />
    </Hint>
  );
});

type ActionsProps = Pick<ChartToolbarProps, "prefs" | "onPrefs" | "onSnapshot" | "fullscreen" | "onFullscreen">;

const ChartActions = memo(function ChartActions({ prefs, onPrefs, onSnapshot, fullscreen, onFullscreen }: ActionsProps) {
  return (
    <div className="flex items-center gap-2">
      <Hint label="Save snapshot">
        <IconButton icon={RiCameraLine} aria-label="Save snapshot" onClick={onSnapshot} />
      </Hint>
      <Hint label={fullscreen ? "Exit full screen" : "Full screen"}>
        <IconButton
          icon={fullscreen ? RiFullscreenExitLine : RiFullscreenLine}
          aria-label={fullscreen ? "Exit full screen" : "Full screen"}
          onClick={onFullscreen}
        />
      </Hint>
      <Menu label="Chart settings" icon={RiSettings4Line} iconOnly placement="bottom end">
        <DropdownGroup label="Show">
          <SettingRow isSelected={prefs.grid} onChange={(grid) => onPrefs({ ...prefs, grid })}>
            Grid lines
          </SettingRow>
          <SettingRow isSelected={prefs.priceLine} onChange={(priceLine) => onPrefs({ ...prefs, priceLine })}>
            Last price line
          </SettingRow>
          <SettingRow isSelected={prefs.alertLine} onChange={(alertLine) => onPrefs({ ...prefs, alertLine })}>
            Alert lines
          </SettingRow>
        </DropdownGroup>
        <DropdownDivider />
        <p className="px-2 pb-1 text-caption-1-regular text-text-secondary">
          Charts by{" "}
          <LinkButton href="https://www.tradingview.com/" target="_blank" rel="noreferrer" variant="secondary" size="xs">
            TradingView
          </LinkButton>
        </p>
      </Menu>
    </div>
  );
});

/** BoardUI tooltip on a plain button (Focusable adapts it into a trigger). */
function Hint({ label, children }: { label: string; children: ComponentProps<typeof Focusable>["children"] }) {
  return (
    <TooltipTrigger>
      <Focusable>{children}</Focusable>
      <Tooltip>{label}</Tooltip>
    </TooltipTrigger>
  );
}

type MenuProps = {
  label: string;
  icon: IconComponent;
  /** Only the icon (the label is its accessible name and tooltip). */
  iconOnly?: boolean;
  placement?: "bottom start" | "bottom end";
  children: ReactNode;
};

// The trigger wears BoardUI's secondary button / icon button recipe.
const TRIGGER = cx(buttonStyles.base, buttonStyles.size.medium, buttonStyles.variant.secondary, "shadow-xs");
const ICON_TRIGGER = cx(
  "inline-flex size-9 shrink-0 items-center justify-center rounded-2lg border border-border-button-default bg-background-primary-default text-foreground-icon-primary shadow-xs",
  "transition-[background-color,border-color] duration-150 ease hover:border-border-button-hover hover:bg-background-primary-hover",
  "active:border-border-button-active active:bg-background-primary-active",
);

/** A toolbar button that opens a BoardUI dropdown panel; its chevron turns while open. */
function Menu({ label, icon: Icon, iconOnly = false, placement = "bottom start", children }: MenuProps) {
  const [open, setOpen] = useState(false);
  const trigger = (
    <DropdownTrigger
      aria-label={iconOnly ? label : undefined}
      className={cx(iconOnly ? ICON_TRIGGER : TRIGGER, open && "border-border-button-hover bg-background-primary-hover")}
    >
      <Icon aria-hidden className="size-5 shrink-0" />
      {iconOnly ? null : (
        <>
          {/* Compare / Indicators drop their labels when the column gets narrow. */}
          <span className="px-1 @max-[44rem]:sr-only">{label}</span>
          <RiArrowDownSLine
            aria-hidden
            className={cx("size-4 shrink-0 text-foreground-icon-secondary transition-transform duration-200 ease-out", open && "rotate-180")}
          />
        </>
      )}
    </DropdownTrigger>
  );
  return (
    <Dropdown isOpen={open} onOpenChange={setOpen}>
      {iconOnly ? (
        <TooltipTrigger isDisabled={open}>
          {trigger}
          <Tooltip>{label}</Tooltip>
        </TooltipTrigger>
      ) : (
        trigger
      )}
      <DropdownPopover aria-label={label} placement={placement} className="w-64">
        {children}
      </DropdownPopover>
    </Dropdown>
  );
}

type MenuCheckProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Series colour (a token fill class). */
  dot: string;
  children: ReactNode;
};

/** A checkbox row in a menu, in BoardUI's menu-row shape. */
function MenuCheck({ checked, onChange, dot, children }: MenuCheckProps) {
  return (
    <Checkbox
      isSelected={checked}
      onChange={onChange}
      className="w-full rounded-2lg p-2 transition-colors hover:bg-dropdown-item-hover-background"
    >
      <span className="flex min-w-0 items-center gap-2">
        <span aria-hidden="true" className={cx("size-2 shrink-0 rounded-full", dot)} />
        {children}
      </span>
    </Checkbox>
  );
}

/** A switch row in the settings menu: label first, switch at the end. */
function SettingRow({ isSelected, onChange, children }: { isSelected: boolean; onChange: (on: boolean) => void; children: ReactNode }) {
  return (
    <Switch
      size="sm"
      isSelected={isSelected}
      onChange={onChange}
      className="w-full flex-row-reverse justify-between rounded-2lg p-2 transition-colors hover:bg-dropdown-item-hover-background"
    >
      <span className="text-body-medium text-text-primary">{children}</span>
    </Switch>
  );
}
