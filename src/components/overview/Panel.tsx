import type { ReactNode } from "react";

/** Frosted section card shared by every Overview panel (add bottom padding per panel). */
export const PANEL = "glass rounded-[24px] px-[18px] pt-[14px]";

export const PANEL_TITLE = "text-[21px] font-normal tracking-[-0.01em]";

type PanelHeadingProps = {
  id: string;
  title: ReactNode;
  /** Muted text on the right ("Next 45 days"). */
  note?: ReactNode;
  className?: string;
};

/** Panel title with a muted note aligned to its baseline (aside panels). */
export function PanelHeading({ id, title, note, className = "" }: PanelHeadingProps) {
  return (
    <div className={`flex items-baseline justify-between gap-[10px] ${className}`}>
      <h2 id={id} className={PANEL_TITLE}>
        {title}
      </h2>
      {note != null && <span className="text-[13px] text-muted">{note}</span>}
    </div>
  );
}
