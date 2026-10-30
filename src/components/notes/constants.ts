import type { Conviction, LinkKind } from "@/lib/mock/notes";
import { ICONS } from "@/components/ui/Icon";

/** Dot color and suggested position size for each conviction level. */
export const CONVICTION: Record<Conviction, { dot: string; size: string }> = {
  Low: { dot: "#B4B4BA", size: "starter, up to 1%" },
  Medium: { dot: "#F5A524", size: "standard, 2–3%" },
  High: { dot: "#2E9B63", size: "core, 4–5%" },
};

export const CONVICTIONS: Conviction[] = ["Low", "Medium", "High"];

/** Stroke icons (24 grid) used only on the notes screen, from the design. */
export const NOTE_ICONS = {
  bold: "M7 5h6a3.5 3.5 0 0 1 0 7H7zM7 12h7a3.5 3.5 0 0 1 0 7H7z",
  italic: "M10 5h8M6 19h8M14 5l-4 14",
  list: "M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01",
  link: "M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1",
  chart: "M4 18l5-6 4 3 7-8",
  share: "M12 4v11M7 9l5-5 5 5M5 20h14",
  mic: "M12 4a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V7a3 3 0 0 0-3-3zM6 11a6 6 0 0 0 12 0M12 17v3",
} as const;

export const LINK_ICONS: Record<LinkKind, string> = {
  transcript: NOTE_ICONS.mic,
  financials: ICONS.financials,
  screen: ICONS.screener,
  note: ICONS.notes,
};

/**
 * Styles for the editable rich-text regions of a note (thesis, drivers…),
 * including what the toolbar can insert: bold, italic, lists, links and
 * chart embeds. A softer focus ring than the global one suits a text body.
 */
export const RICH_TEXT =
  "min-h-[1.4em] rounded-[6px] focus-visible:outline-offset-[6px] focus-visible:outline-[rgba(47,95,204,0.45)] " +
  "[&_b]:font-semibold [&_strong]:font-semibold [&_a]:underline [&_a]:underline-offset-2 " +
  "[&_ul]:list-disc [&_ul]:pl-[18px] [&_ol]:list-decimal [&_ol]:pl-[18px]";

/** Selector of the editable rich-text regions the formatting toolbar acts on. */
export const RICH_TEXT_SELECTOR = "[data-rich-text]";
