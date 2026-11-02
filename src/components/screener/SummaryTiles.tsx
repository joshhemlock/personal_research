"use client";

import { AnimatedValue } from "@/components/motion/AnimatedValue";
import { fmtCount, fmtGrowth, fmtPct1, fmtPe } from "./screen";
import { useScreener } from "./ScreenerProvider";

const DASH = "—";

/** Five stat tiles (BoardUI's plain stat-card look) summarising the current matches. */
export function SummaryTiles() {
  const { summary: s, medianBase } = useScreener().result;
  const tiles = [
    { k: "Matches", v: fmtCount(s.count) },
    { k: "Median fwd P/E", v: s.fwdPe === null ? DASH : fmtPe(s.fwdPe) },
    { k: "Median rev growth", v: s.revGrowth === null ? DASH : fmtGrowth(s.revGrowth) },
    { k: "Median gross margin", v: s.grossMargin === null ? DASH : fmtPct1(s.grossMargin) },
    { k: "Median ROIC", v: s.roic === null ? DASH : fmtPct1(s.roic) },
  ];
  return (
    <section aria-label="Match summary" className="flex flex-col gap-2">
      <dl className="flex flex-wrap gap-3">
        {tiles.map((t) => (
          // Labels may wrap on narrow tiles; values keep to the bottom so they line up.
          <div
            key={t.k}
            className="flex min-w-0 flex-[1_1_8.5rem] flex-col justify-between gap-0.5 rounded-2xl bg-background-secondary-default p-4"
          >
            <dt className="text-body-medium text-text-secondary">{t.k}</dt>
            <dd className="text-title-1-medium whitespace-nowrap text-text-primary">
              <AnimatedValue value={t.v} />
            </dd>
          </div>
        ))}
      </dl>
      {medianBase !== null && (
        // Live data: medians are fetched for a capped number of matches.
        <p className="px-1 text-caption-1-regular text-text-tertiary">
          {`Medians are of the ${fmtCount(medianBase)} largest matches by market cap.`}
        </p>
      )}
    </section>
  );
}
