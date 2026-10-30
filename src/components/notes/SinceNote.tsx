import type { NoteMarket } from "@/lib/data/notes";
import type { Note } from "@/lib/mock/notes";
import { shortDate } from "@/lib/mock/notes";
import { pct, tone } from "@/lib/format";

const ROW = "grid grid-cols-[minmax(0,1.3fr)_1fr_1fr] gap-2";

/** Price since the note was started, and key metrics then vs. now. */
export function SinceNote({ note, market, headingId }: { note: Note; market: NoteMarket; headingId: string }) {
  const { changePct: change, paths, rows, attribution } = market;
  const t = tone(change ?? 0);
  const since = shortDate(note.started.date);
  const trend = change == null ? "" : `, ${change >= 0 ? "up" : "down"} ${Math.abs(change).toFixed(1)} percent`;

  return (
    <section aria-labelledby={headingId} className="glass flex flex-col gap-2 rounded-[24px] px-[18px] py-[14px]">
      <div className="flex items-baseline justify-between gap-2">
        <h2 id={headingId} className="text-[19px] font-normal">
          Since this note
        </h2>
        <span className="text-[17px]" style={change == null ? undefined : { color: t.color }}>
          {change == null ? "—" : pct(change, 1)}
        </span>
      </div>
      {paths ? (
        <svg
          viewBox="0 0 300 70"
          preserveAspectRatio="none"
          role="img"
          aria-label={`${note.symbol} price since ${since}${trend}`}
          className="h-[70px] w-full"
        >
          <path d={paths.area} fill={t.fill} />
          <path d={paths.line} fill="none" stroke={t.stroke} strokeWidth={1.8} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        </svg>
      ) : (
        <p className="flex h-[70px] items-center justify-center rounded-[12px] bg-[rgba(17,17,19,0.035)] text-[13px] text-muted">
          Price history unavailable
        </p>
      )}
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
      {attribution && (
        <a
          href={attribution.href}
          target="_blank"
          rel="noopener noreferrer"
          className="self-end text-[12px] text-muted hover:text-ink-2 hover:underline"
        >
          Data: {attribution.name}
        </a>
      )}
    </section>
  );
}
