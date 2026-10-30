// Stroke icons from the design (24×24 grid). Pass a path from ICONS or any
// `d` copied from design/static.

export const ICONS = {
  // shell
  clock: "M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18zM12 7.5V12l3 2",
  search: "M11 4a7 7 0 1 0 0 14a7 7 0 1 0 0-14zM20 20l-4-4",
  filterLines: "M4 7h16M7 12h10M10 17h4",
  user: "M12 12a4 4 0 1 0 0-8a4 4 0 1 0 0 8zM4.5 20.5c1.4-3.6 4.2-5.5 7.5-5.5s6.1 1.9 7.5 5.5",
  menu: "M5 8h14M5 12h14M5 16h14",
  bell: "M6 16v-5a6 6 0 1 1 12 0v5l1.5 2h-15zM10 20.5a2 2 0 0 0 4 0",
  overview: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  chart: "M7 3v3M7 15v6M5 6h4v9H5zM17 3v5M17 17v4M15 8h4v9h-4z",
  financials: "M4 20h16M7 16v-5M12 16V6M17 16V9",
  screener: "M4 5h16l-6 7.5V19l-4 2v-8.5z",
  notes: "M6 3h9l4 4v14H6zM15 3v4h4M9 12h7M9 16h5",
  settings:
    "M12 9a3 3 0 1 0 0 6a3 3 0 1 0 0-6zM19 12a7 7 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7 7 0 0 0-2-1.2L14 3h-4l-.5 2.6a7 7 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6A7 7 0 0 0 5 12a7 7 0 0 0 .1 1.2l-2 1.6 2 3.4 2.4-1a7 7 0 0 0 2 1.2L10 21h4l.5-2.6a7 7 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2z",
  ask: "M4 5h16v11H9l-5 4z",
  library: "M4 5c3-1 5-1 8 1v14c-3-2-5-2-8-1zM20 5c-3-1-5-1-8 1v14c3-2 5-2 8-1z",
  formulas: "M14 4h-2a2 2 0 0 0-2 2v12a2 2 0 0 1-2 2H6M7 11h6M15 13l4 5M19 13l-4 5",
  star: "M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8-4.3-4.1 5.9-.9z",
  // common controls
  plus: "M12 5v14M5 12h14",
  sliders: "M4 7h9M17 7h3M4 17h3M11 17h9M15 5v4M9 15v4",
  columns: "M4 5h16v14H4zM9.5 5v14M14.5 5v14",
  chevronRight: "M9 6l6 6-6 6",
  chevronLeft: "M15 6l-6 6 6 6",
  chevronDown: "M6 9l6 6 6-6",
  close: "M6 6l12 12M18 6L6 18",
  arrowUpRight: "M7 17L17 7M9 7h8v8",
  enter: "M9 10l-4 4 4 4M5 14h11a3 3 0 0 0 3-3V5",
} as const;

export type IconName = keyof typeof ICONS;

type IconProps = {
  /** A key of ICONS, or a raw path `d`. */
  name?: IconName;
  d?: string;
  size?: number;
  strokeWidth?: number;
  linejoin?: "round" | "miter" | "bevel";
  className?: string;
};

export function Icon({ name, d, size = 22, strokeWidth = 1.6, linejoin, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin={linejoin}
      aria-hidden="true"
      className={className}
    >
      <path d={d ?? (name ? ICONS[name] : "")} />
    </svg>
  );
}
