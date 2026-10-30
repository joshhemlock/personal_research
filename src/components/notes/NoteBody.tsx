import type { ReactNode } from "react";
import type { Note } from "@/lib/mock/notes";
import { RICH_TEXT } from "./constants";

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
      className={`${RICH_TEXT} ${className}`}
    >
      {children}
    </div>
  );
}

const H2 = "text-[17px] font-medium";
const BODY = "text-[#2A2A2E]";

/** Thesis, key drivers, risks and "what would change my mind". */
export function NoteBody({ note, idPrefix }: { note: Note; idPrefix: string }) {
  const id = (part: string) => `${idPrefix}-${part}`;
  return (
    <>
      <section aria-labelledby={id("thesis-h")} className="flex flex-col gap-[6px]">
        <h2 id={id("thesis-h")} className={H2}>
          Thesis
        </h2>
        <Editable labelledBy={id("thesis-h")} className={`text-[15px] leading-[1.6] ${BODY}`}>
          <p>{note.thesis}</p>
        </Editable>
      </section>

      <div className="flex flex-wrap gap-[14px]">
        <section aria-labelledby={id("drivers-h")} className="flex flex-[1_1_240px] flex-col gap-[6px]">
          <h2 id={id("drivers-h")} className={H2}>
            Key drivers
          </h2>
          <Editable labelledBy={id("drivers-h")} className={`text-[14px] leading-[1.6] ${BODY}`}>
            <ul>
              {note.drivers.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </Editable>
        </section>
        <section aria-labelledby={id("risks-h")} className="flex flex-[1_1_240px] flex-col gap-[6px]">
          <h2 id={id("risks-h")} className={H2}>
            Risks
          </h2>
          <Editable labelledBy={id("risks-h")} className={`text-[14px] leading-[1.6] ${BODY}`}>
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
        className="flex flex-col gap-[6px] rounded-[16px] border border-dashed border-[rgba(17,17,19,0.18)] px-4 py-3"
      >
        <h2 id={id("mind-h")} className="text-[15px] font-medium">
          What would change my mind
        </h2>
        <Editable labelledBy={id("mind-h")} className={`text-[14px] ${BODY}`}>
          <p>{note.changeMind}</p>
        </Editable>
      </section>
    </>
  );
}
