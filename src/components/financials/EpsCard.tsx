import { MINUS } from "@/lib/format";
import type { FinancialsData, Quarter } from "@/lib/mock/financials";
import { cx } from "@/utils/cx";
import { Card, LegendItem } from "./Card";
import { ChartTip } from "./ChartTip";
import { Replay } from "./Replay";
import { isNum, periodsKey, stagger } from "./helpers";
import { TipBody, type TipRow } from "./Tip";

type EpsCardProps = {
  id?: string;
  quarters: Quarter[];
  eps: FinancialsData["eps"];
};

type Column = {
  key: string;
  a: string;
  b: string;
  title: string;
  est?: number;
  actual?: number;
  beat?: boolean;
  surprise: string;
  surpriseClass: string;
  upcoming?: boolean;
};

const eps2 = (v: number | null | undefined) => (v == null ? "—" : `${v < 0 ? MINUS : ""}${Math.abs(v).toFixed(2)}`);

// Estimate: an open ring; actual: a dot in the gain/loss colour of the surprise.
const RING = "size-3 rounded-full border-2 border-foreground-icon-tertiary bg-background-primary-default";

/** Estimate (ring) vs actual (dot) EPS per quarter, plus the upcoming quarter's estimate. */
export function EpsCard({ id, quarters, eps }: EpsCardProps) {
  const all = [...eps.est, ...eps.actual, eps.next?.est ?? null].filter(isNum);
  const min = Math.min(...all);
  const max = Math.max(...all);
  const span = max - min || Math.abs(max) || 1;
  // Pad the range a little and snap to 0.1 so dots never touch the box edges.
  const lo = Math.floor((min - 0.2 * span) * 10) / 10;
  const hi = Math.ceil((max + 0.15 * span) * 10) / 10;
  const pos = (v: number) => `${(((v - lo) / (hi - lo)) * 100).toFixed(1)}%`;

  const cols: Column[] = quarters.map((q, k) => {
    const est = eps.est[k];
    const actual = eps.actual[k];
    const base = {
      key: `${q.q}${q.fy}`,
      a: q.q,
      b: q.fy.replace("FY", "’"),
      title: `${q.q} ${q.fy}`,
      est: est ?? undefined,
      actual: actual ?? undefined,
    };
    if (est == null || actual == null || est === 0) {
      return { ...base, surprise: "—", surpriseClass: "text-text-tertiary" };
    }
    // Relative to the estimate's size, so a smaller loss than expected reads as a beat.
    // Rounded first, so a tiny miss that shows as 0.0 reads as in line, not "−0.0".
    const s = +((est > 0 ? actual / est - 1 : (actual - est) / -est) * 100).toFixed(1);
    const beat = s >= 0;
    return {
      ...base,
      beat,
      surprise: (beat ? "+" : MINUS) + Math.abs(s).toFixed(1),
      surpriseClass: beat ? "text-text-positive" : "text-text-negative",
    };
  });
  if (eps.next) {
    cols.push({
      key: "next",
      a: eps.next.q,
      b: eps.next.date,
      title: `${eps.next.q}, reports ${eps.next.date}`,
      est: eps.next.est,
      surprise: "est.",
      surpriseClass: "text-text-secondary",
      upcoming: true,
    });
  }
  const beats = cols.filter((c) => c.beat).length;
  const scored = cols.filter((c) => c.beat !== undefined).length;

  return (
    <Card
      id={id}
      titleId="ea-h"
      title="EPS vs estimate"
      className="scroll-mt-6"
      note={
        <span className="flex gap-3">
          <LegendItem swatch={<span className="size-2.5 rounded-full border-2 border-foreground-icon-tertiary" />}>
            Est.
          </LegendItem>
          <LegendItem swatch={<span className="size-2.5 rounded-full bg-foreground-icon-primary" />}>Actual</LegendItem>
        </span>
      }
    >
      <p className="-mt-2 text-body-2-regular text-text-secondary">
        {scored > 0 ? `Beat in ${beats} of the last ${scored} quarters · surprise in %` : "No reported quarters with an estimate yet"}
      </p>
      {/* The dots pop in again when a new quarter is reported. */}
      <Replay
        on={periodsKey(quarters)}
        selector="[data-dot]"
        effect="pop"
        role="group"
        aria-label="Earnings per share by quarter"
        className="flex gap-1"
      >
        {cols.map((c, i) => {
          const rows: TipRow[] = [];
          if (c.actual !== undefined) {
            rows.push({
              key: "actual",
              swatch: c.beat === false ? "bg-chart-negative" : c.beat ? "bg-chart-positive" : "bg-foreground-icon-primary",
              value: eps2(c.actual),
              label: "Actual",
            });
          }
          if (c.est !== undefined) rows.push({ key: "est", swatch: "bg-foreground-icon-tertiary", value: eps2(c.est), label: "Estimate" });
          if (c.beat !== undefined) {
            rows.push({
              key: "surprise",
              value: `${c.surprise}%`,
              label: c.beat ? "Beat" : "Miss",
              valueClassName: c.surpriseClass,
            });
          }
          const label = [
            c.title,
            c.actual !== undefined && `actual ${eps2(c.actual)}`,
            c.est !== undefined && `estimate ${eps2(c.est)}`,
            c.beat !== undefined && `${c.beat ? "beat" : "miss"} ${c.surprise}%`,
          ]
            .filter(Boolean)
            .join(", ");
          return (
            <div key={c.key} className="flex min-w-0 flex-1 flex-col items-center gap-1">
              <ChartTip
                label={label}
                tip={<TipBody title={c.title} rows={rows} />}
                className={cx(
                  "relative block h-24 w-full rounded-lg transition-colors duration-150 ease-out",
                  !c.upcoming && "bg-background-secondary-default hover:bg-background-tertiary-default",
                )}
                // The upcoming quarter takes a wash of the earnings-date colour.
                style={c.upcoming ? { background: "color-mix(in srgb, var(--color-chart-earnings) 16%, transparent)" } : undefined}
              >
                {c.est !== undefined && (
                  <span
                    className={cx("absolute left-1/2 -translate-x-1/2 translate-y-1/2", RING)}
                    style={{ bottom: pos(c.est) }}
                  />
                )}
                {c.actual !== undefined && (
                  <span
                    className="absolute left-1/2 -translate-x-1/2 translate-y-1/2"
                    style={{ bottom: pos(c.actual) }}
                  >
                    {/* The pop runs on an inner dot so it doesn't fight the centring transform. */}
                    <span
                      data-dot=""
                      className={cx(
                        "block size-2.5 animate-pop rounded-full ring-2 ring-background-primary-default",
                        c.beat === false ? "bg-chart-negative" : c.beat ? "bg-chart-positive" : "bg-foreground-icon-primary",
                      )}
                      style={stagger(i, 30, 240)}
                    />
                  </span>
                )}
              </ChartTip>
              <span aria-hidden="true" className={cx("text-caption-2-medium whitespace-nowrap", c.surpriseClass)}>
                {c.surprise}
              </span>
              <span aria-hidden="true" className="text-center text-caption-2-regular text-text-tertiary">
                {c.a}
                <br />
                {c.b}
              </span>
            </div>
          );
        })}
      </Replay>
    </Card>
  );
}
