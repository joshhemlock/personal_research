import type { ReactNode } from "react";
import { cx } from "@/utils/cx";

/** BoardUI's card surface, shared by every Overview section. */
export const CARD = "rounded-3xl border border-border-button-default bg-background-primary-default";

/** Card title (BoardUI's card-title style). */
export const CARD_TITLE = "text-title-3-medium text-text-primary";

type CardProps = {
  /** Id of the heading; the section is labelled by it. */
  titleId: string;
  title: ReactNode;
  /** Supporting text at the end of the header ("Next 45 days"). */
  note?: ReactNode;
  className?: string;
  children: ReactNode;
};

/** A titled card: heading row, then the content. */
export function Card({ titleId, title, note, className, children }: CardProps) {
  return (
    <section aria-labelledby={titleId} className={cx(CARD, "flex min-w-0 flex-col gap-3 p-5", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 id={titleId} className={CARD_TITLE}>
          {title}
        </h2>
        {note != null && <span className="text-body-regular whitespace-nowrap text-text-secondary">{note}</span>}
      </div>
      {children}
    </section>
  );
}
