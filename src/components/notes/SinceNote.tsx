import type { Note } from "@/lib/mock/notes";
import { notePrice, shortDate, sinceChangePct, sincePaths } from "@/lib/mock/notes";
import { num, pct, tone } from "@/lib/format";

const ROW = "grid grid-cols-[minmax(0,1.3fr)_1fr_1fr] gap-2";

/** Price since the note was started, and key metrics then vs. now. */
export function SinceNote({ note, headingId }: { note: Note; headingId: string }) {
  const change = sinceChangePct(note);
  const t = tone(change);
  const { line, area } = sincePaths(note);
  const since = shortDate(note.started.date);
  const rows = [{ metric: "Price", then: num(note.started.price), now: num(notePrice(note)) }, ...note.metrics];

  return (
    <section aria-labelledby={headingId} className="glass flex flex-col gap-2 rounded-[24px] px-[18px] py-[14px]">
      <div className="flex items-baseline justify-between gap-2">
        <h2 id={headingId} className="text-[19px] font-normal">
          Since this note
        </h2>
        <span className="text-[17px]" style={{ color: t.color }}>
          {pct(change, 1)}
        </span>
      </div>
      <svg
        viewBox="0 0 300 70"
        preserveAspectRatio="none"
        role="img"
        aria-label={`${note.symbol} price since ${since}, ${change >= 0 ? "up" : "down"} ${Math.abs(change).toFixed(1)} percent`}
        className="h-[70px] w-full"
      >
        <path d={area} fill={t.fill} />
        <path d={line} fill="none" stroke={t.stroke} strokeWidth={1.8} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      </svg>
      <div role="table" aria-label="Then versus now">
        <div role="row" className={`${ROW} py-1 text-[12px] text-muted`}>
          <span role="columnheader">Metric</span>
          <span role="columnheader" className="text-right">
            {since}
          </span>
          <span role="columnheader" className="text-right">
            Now
          </span>
        </div>
        {rows.map((r) => (
          <div key={r.metric} role="row" className={`${ROW} border-t border-hairline py-[5px] text-[14px]`}>
            <span role="rowheader" className="text-ink-2">
              {r.metric}
            </span>
            <span role="cell" className="text-right text-muted">
              {r.then}
            </span>
            <span role="cell" className="text-right">
              {r.now}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
