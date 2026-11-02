/** BoardUI's card surface, as on the Overview. */
export const CARD = "rounded-3xl border border-border-button-default bg-background-primary-default";

/** Card title (BoardUI's card-title style). */
export const CARD_TITLE = "text-title-3-medium text-text-primary";

/**
 * A quiet icon-only button on BoardUI's ghost Button: no tint at rest, the
 * secondary surface on hover and one step darker on press. For glyphs repeated
 * down a list (watch stars, remove-filter crosses), where tinted or bordered
 * buttons would crowd the rows.
 */
export const QUIET_ICON_BUTTON =
  "bg-transparent text-foreground-icon-tertiary transition-colors duration-150 hover:bg-background-secondary-default hover:text-foreground-icon-primary active:bg-background-secondary-hover";
