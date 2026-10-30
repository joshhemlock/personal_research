import { MINUS } from "@/lib/format";
import type { FinancialsData, Quarter } from "@/lib/mock/financials";
import { H2, PANEL } from "./helpers";

type EpsCardProps = {
  quarters: Quarter[];
  eps: FinancialsData["eps"];
};

type Column = {
  key: string;
  a: string;
  b: string;
  label: string;
  est?: number;
  actual?: number;
  beat?: boolean;
  surprise: string;
  surpriseClass: string;
  dot?: string;
  bg: string;
};

const eps2 = (v: number | null) => (v == null ? "not available" : v.toFixed(2));

/** Estimate (ring) vs actual (dot) EPS per quarter, plus the upcoming quarter. */
export function EpsCard({ quarters, eps }: EpsCardProps) {
  const all = [...eps.est, ...eps.actual, eps.next?.est ?? null].filter((v): v is number => v != null);
  const min = Math.min(...all);
  const max = Math.max(...all);
  const span = max - min || Math.abs(max) || 1;
  // Pad the range a little and snap to 0.1 so dots never touch the box edges.
  const lo = Math.floor((min - 0.2 * span) * 10) / 10;
  const hi = Math.ceil((max + 0.1 * span) * 10) / 10;
  const pos = (v: number) => (((v - lo) / (hi - lo)) * 100).toFixed(1);

  const cols: Column[] = quarters.map((q, k) => {
    const est = eps.est[k];
    const actual = eps.actual[k];
    const label = `${q.q} ${q.fy.replace("FY", "’")}`;
    const base = {
      key: `${q.q}${q.fy}`,
      a: q.q,
      b: q.fy.replace("FY", "’"),
      label: `${label}: estimate ${eps2(est)}, actual ${eps2(actual)}`,
      est: est ?? undefined,
      actual: actual ?? undefined,
      bg: "rgba(17,17,19,0.04)",
    };
    if (est == null || actual == null || est === 0) {
      return { ...base, surprise: "—", surpriseClass: "text-muted", dot: "#111113" };
    }
    // Relative to the estimate's size, so a smaller loss than expected reads as a beat.
    // Rounded first, so a tiny miss that shows as 0.0 reads as in line, not "−0.0".
    const s = +((est > 0 ? actual / est - 1 : (actual - est) / -est) * 100).toFixed(1);
    const beat = s >= 0;
    return {
      ...base,
      beat,
      surprise: (beat ? "+" : MINUS) + Math.abs(s).toFixed(1),
      surpriseClass: beat ? "text-up-text" : "text-down-text",
      dot: beat ? "#111113" : "#E5484D",
    };
  });
  if (eps.next) {
    cols.push({
      key: "next",
      a: eps.next.q,
      b: eps.next.date,
      label: `${eps.next.q}, reports ${eps.next.date}: estimate ${eps.next.est.toFixed(2)}`,
      est: eps.next.est,
      surprise: "est.",
      surpriseClass: "text-ink-3",
      bg: "rgba(245,165,36,0.16)",
    });
  }
  const beats = cols.filter((c) => c.beat).length;
  const scored = cols.filter((c) => c.beat !== undefined).length;

  return (
    <section id="earnings" aria-labelledby="ea-h" className={`${PANEL} flex flex-col gap-2.5 px-[18px] py-[14px]`}>
      <div className="flex items-center justify-between gap-2.5">
        <h2 id="ea-h" className={H2}>
          EPS vs estimate
        </h2>
        <span className="flex gap-2.5 text-[12px] text-ink-2">
          <span className="inline-flex items-center gap-[5px]">
            <span className="size-[9px] rounded-full border-2 border-[#8A8A92]" />
            Est.
          </span>
          <span className="inline-flex items-center gap-[5px]">
            <span className="size-[9px] rounded-full bg-ink" />
            Actual
          </span>
        </span>
      </div>
      <p className="m-0 text-[13px] text-ink-3">
        Beat in {beats} of the last {scored} quarters · surprise in %
      </p>
      <div className="flex gap-[3px]">
        {cols.map((c) => (
          <div key={c.key} className="flex min-w-0 flex-1 flex-col items-center gap-1">
            <div
              role="img"
              aria-label={c.label}
              className="relative h-[92px] w-full rounded-[9px]"
              style={{ background: c.bg }}
            >
              {c.est !== undefined && (
                <span
                  className="absolute left-1/2 -mb-[6.5px] -ml-[6.5px] size-[13px] rounded-full border-2 border-[#8A8A92] bg-white"
                  style={{ bottom: `${pos(c.est)}%` }}
                />
              )}
              {c.actual !== undefined && (
                <span
                  className="absolute left-1/2 -mb-[5.5px] -ml-[5.5px] size-[11px] rounded-full"
                  style={{ bottom: `${pos(c.actual)}%`, background: c.dot }}
                />
              )}
            </div>
            <span className={`text-[11px] whitespace-nowrap ${c.surpriseClass}`}>{c.surprise}</span>
            <span className="text-center text-[11px] leading-[1.2] text-muted">
              {c.a}
              <br />
              {c.b}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
