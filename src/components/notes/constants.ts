import type { ComponentType } from "react";
import { RiBarChartBoxLine, RiFilter3Line, RiMicLine, RiStickyNoteLine } from "@remixicon/react";
import type { Conviction, LinkKind } from "@/lib/mock/notes";

/** BoardUI's card surface (as on the Overview). */
export const CARD = "rounded-3xl border border-border-button-default bg-background-primary-default";

/** Card title (BoardUI's card-title style). */
export const CARD_TITLE = "text-title-3-medium text-text-primary";

/**
 * The screen's grid, sized by its own width (the sidebar can collapse):
 * one column on phones; the list beside the editor from 50rem, with the
 * context cards in a row underneath; all three side by side from 74rem.
 * The loading skeleton uses the same classes.
 */
export const NOTES_GRID = {
  root: "@container/notes min-w-0 flex-1 basis-full",
  grid: "grid grid-cols-1 items-start gap-4 @min-[50rem]/notes:grid-cols-[17.5rem_minmax(0,1fr)] @min-[74rem]/notes:grid-cols-[17.5rem_minmax(0,1fr)_18.5rem]",
  editor: "@container flex min-w-0 flex-col gap-5 p-4 @min-[50rem]/notes:p-6",
  context:
    "grid min-w-0 grid-cols-[repeat(auto-fit,minmax(min(18rem,100%),1fr))] items-start gap-4 @min-[50rem]/notes:col-span-2 @min-[74rem]/notes:col-span-1 @min-[74rem]/notes:grid-cols-1",
};

/**
 * View-transition name of the notes list. The list is the same on every note
 * (and in the loading state), so as a named pair it cross-fades into itself
 * (nothing moves but the open row) instead of swapping with the rest.
 */
export const LIST_TRANSITION = "notes-list";

/** Section heading inside the note editor. */
export const SECTION_TITLE = "text-headline-semibold text-text-primary";

/**
 * Dot colour and suggested position size for each conviction level. The
 * colours are CSS variables of BoardUI / app tokens, applied inline because
 * they follow data: grey for low, amber for medium, the gain green for high.
 */
export const CONVICTION: Record<Conviction, { color: string; size: string }> = {
  Low: { color: "var(--color-foreground-icon-tertiary)", size: "starter, up to 1%" },
  Medium: { color: "var(--color-chart-earnings)", size: "standard, 2–3%" },
  High: { color: "var(--color-chart-positive)", size: "core, 4–5%" },
};

export const CONVICTIONS: Conviction[] = ["Low", "Medium", "High"];

type IconComponent = ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>;

/** Icon of each kind of linked item. */
export const LINK_ICONS: Record<LinkKind, IconComponent> = {
  transcript: RiMicLine,
  financials: RiBarChartBoxLine,
  screen: RiFilter3Line,
  note: RiStickyNoteLine,
};

/**
 * Styles for the editable rich-text regions of a note (thesis, drivers…),
 * including what the toolbar can insert: bold, italic, lists, links and
 * chart embeds. The focus ring is BoardUI's, softened for a text body.
 */
export const RICH_TEXT = [
  "min-h-[1.4em] rounded-lg outline-none",
  "focus-visible:ring-2 focus-visible:ring-border-focus-ring/40 focus-visible:ring-offset-4 focus-visible:ring-offset-background-primary-default",
  "[&_b]:font-semibold [&_strong]:font-semibold",
  "[&_a]:text-text-primary [&_a]:underline [&_a]:decoration-text-tertiary [&_a]:underline-offset-2",
  "[&_ul]:list-disc [&_ul]:ps-5 [&_ol]:list-decimal [&_ol]:ps-5 marker:text-text-tertiary",
].join(" ");

/** Selector of the editable rich-text regions the formatting toolbar acts on. */
export const RICH_TEXT_SELECTOR = "[data-rich-text]";

/** Marks the note editor; the toolbar acts on the regions inside it. */
export const EDITOR_ATTR = "data-note-editor";
