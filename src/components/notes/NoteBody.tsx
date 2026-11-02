import type { ReactNode } from "react";
import { RiSignpostLine } from "@remixicon/react";
import type { Note } from "@/lib/mock/notes";
import { cx } from "@/utils/cx";
import { RICH_TEXT, SECTION_TITLE } from "./constants";

/**
 * A rich-text region of the note: edited in place (contentEditable) and
 * formatted by the toolbar, which finds regions by `data-rich-text`.
 * Rendered on the server; once in the page the browser owns its contents.
 */
function Editable({ labelledBy, className, children }: { labelledBy: string; className: string; children: ReactNode }) {
  return (
    <div
      contentEditable
      suppressContentEditableWarning
      data-rich-text=""
      role="textbox"
      aria-multiline="true"
      aria-labelledby={labelledBy}
      className={cx(RICH_TEXT, className)}
    >
      {children}
    </div>
  );
}

/** Thesis, key drivers, risks and "what would change my mind". */
export function NoteBody({ note, idPrefix }: { note: Note; idPrefix: string }) {
  const id = (part: string) => `${idPrefix}-${part}`;
  return (
    <>
      <section aria-labelledby={id("thesis-h")} className="flex flex-col gap-1.5">
        <h2 id={id("thesis-h")} className={SECTION_TITLE}>
          Thesis
        </h2>
        <Editable labelledBy={id("thesis-h")} className="text-headline-regular text-text-primary">
          <p>{note.thesis}</p>
        </Editable>
      </section>

      <div className="grid gap-x-6 gap-y-5 @min-[34rem]:grid-cols-2">
        <section aria-labelledby={id("drivers-h")} className="flex min-w-0 flex-col gap-1.5">
          <h2 id={id("drivers-h")} className={SECTION_TITLE}>
            Key drivers
          </h2>
          <Editable labelledBy={id("drivers-h")} className="text-body-regular text-text-primary">
            <ul>
              {note.drivers.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </Editable>
        </section>
        <section aria-labelledby={id("risks-h")} className="flex min-w-0 flex-col gap-1.5">
          <h2 id={id("risks-h")} className={SECTION_TITLE}>
            Risks
          </h2>
          <Editable labelledBy={id("risks-h")} className="text-body-regular text-text-primary">
            <ul>
              {note.risks.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </Editable>
        </section>
      </div>

      <section
        aria-labelledby={id("mind-h")}
        className="flex gap-3 rounded-2xl border border-dashed border-border-button-hover p-4"
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-background-secondary-default">
          <RiSignpostLine aria-hidden className="size-4 text-foreground-icon-secondary" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h2 id={id("mind-h")} className="text-body-semibold text-text-primary">
            What would change my mind
          </h2>
          <Editable labelledBy={id("mind-h")} className="text-body-regular text-text-secondary">
            <p>{note.changeMind}</p>
          </Editable>
        </div>
      </section>
    </>
  );
}
