import { LinkButton } from "@/components/base/buttons/link-button";
import type { NoteMarket } from "@/lib/data/notes";
import type { Note } from "@/lib/mock/notes";
import { shortDate } from "@/lib/mock/notes";
import { pct } from "@/lib/format";
import { cx } from "@/utils/cx";
import { CARD, CARD_TITLE } from "./constants";

type SinceNoteProps = {
  note: Note;
  market: NoteMarket;
  headingId: string;
  /** Document-unique id for the chart's fill gradient. */
  gradientId: string;
};

/**
 * Price since the note was started, and key metrics then vs. now. The line
 * draws itself in when the note opens; later data refreshes only move it.
 */
export function SinceNote({ note, market, headingId, gradientId }: SinceNoteProps) {
  const { changePct: change, paths, rows, attribution } = market;
  const up = (change ?? 0) >= 0;
  const tone = up ? "var(--color-chart-positive)" : "var(--color-chart-negative)";
  const since = shortDate(note.started.date);
  const trend = change == null ? "" : `, ${up ? "up" : "down"} ${Math.abs(change).toFixed(1)} percent`;

  return (
    <section aria-labelledby={headingId} className={cx(CARD, "flex min-w-0 flex-col gap-3 overflow-hidden pt-5")}>
      <div className="flex items-baseline justify-between gap-3 px-5">
        <h2 id={headingId} className={CARD_TITLE}>
          Since this note
        </h2>
        <span
          className="text-title-3-medium"
          style={{ color: change == null ? "var(--color-text-secondary)" : up ? "var(--color-text-positive)" : "var(--color-text-negative)" }}
        >
          {change == null ? "—" : pct(change, 1)}
        </span>
      </div>

      <div className="px-5">
        {paths ? (
          <svg
            viewBox="0 0 300 70"
            preserveAspectRatio="none"
            role="img"
            aria-label={`${note.symbol} price since ${since}${trend}`}
            className="block h-18 w-full animate-enter"
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopOpacity="0.24" style={{ stopColor: tone }} />
                <stop offset="1" stopOpacity="0" style={{ stopColor: tone }} />
              </linearGradient>
            </defs>
            <path d={paths.area} fill={`url(#${gradientId})`} />
            <path
              d={paths.line}
              pathLength={1}
              fill="none"
              strokeWidth={1.75}
              strokeLinejoin="round"
              strokeLinecap="round"
              // No non-scaling-stroke: with it Chrome measures the draw's
              // dashes in screen space and stops short on a stretched chart.
              // The card barely stretches the box, so the stroke stays even.
              className="animate-draw"
              style={{ stroke: tone }}
            />
          </svg>
        ) : (
          <p className="flex h-18 items-center justify-center rounded-xl bg-background-secondary-default text-body-2-regular text-text-secondary">
            Price history unavailable
          </p>
        )}
      </div>

      <table className="bui-table bui-table-sm">
        <caption className="sr-only">Then versus now</caption>
        <thead>
          <tr>
            {/* BoardUI's cells set their own padding and start alignment:
                the inner spans line the columns up with the card's edges. */}
            <th scope="col">
              <span className="block ps-2.5">Metric</span>
            </th>
            <th scope="col">
              <span className="block text-end">{since}</span>
            </th>
            <th scope="col">
              <span className="block pe-2.5 text-end">Now</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.metric}>
              <td>
                <span className="block ps-2.5 text-text-secondary">{r.metric}</span>
              </td>
              <td>
                <span className="block text-end text-text-secondary">{r.then}</span>
              </td>
              <td>
                <span className="block pe-2.5 text-end">{r.now}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {attribution ? (
        <p className="-mt-1 px-5 pb-4 text-end text-caption-1-regular text-text-tertiary">
          Data:{" "}
          <LinkButton href={attribution.href} target="_blank" rel="noopener noreferrer" variant="secondary" size="xs">
            {attribution.name}
          </LinkButton>
        </p>
      ) : (
        <span aria-hidden="true" className="-mt-3 h-2" />
      )}
    </section>
  );
}
