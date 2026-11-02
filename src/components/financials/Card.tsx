import type { ReactNode } from "react";
import { cx } from "@/utils/cx";
import { CARD, CARD_NOTE, CARD_TITLE } from "./helpers";

type CardProps = {
  /** Id of the heading; the section is labelled by it. */
  titleId: string;
  title: ReactNode;
  /** Supporting text or a legend at the end of the header. */
  note?: ReactNode;
  /** Anchor id for in-page links (#earnings). */
  id?: string;
  className?: string;
  children: ReactNode;
};

/** A titled BoardUI card: heading row, then the content. */
export function Card({ titleId, title, note, id, className, children }: CardProps) {
  return (
    <section id={id} aria-labelledby={titleId} className={cx(CARD, "flex min-w-0 flex-col gap-4 p-5", className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 id={titleId} className={CARD_TITLE}>
          {title}
        </h2>
        {note != null &&
          (typeof note === "string" ? <span className={cx(CARD_NOTE, "whitespace-nowrap")}>{note}</span> : note)}
      </div>
      {children}
    </section>
  );
}

/** Legend entry: a swatch shaped like the mark (bar or line) and its name. */
export function LegendItem({ swatch, children }: { swatch: ReactNode; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-body-2-regular whitespace-nowrap text-text-secondary">
      {swatch}
      {children}
    </span>
  );
}
