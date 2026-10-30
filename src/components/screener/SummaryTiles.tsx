"use client";

import { fmtCount, fmtGrowth, fmtPct1, fmtPe } from "./screen";
import { useScreener } from "./ScreenerProvider";

const DASH = "—";

/** Five frosted tiles summarising the current matches. */
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
    <section aria-label="Match summary" className="flex flex-wrap gap-[10px]">
      {tiles.map((t) => (
        // Below the split width the five tiles stay on one row longer: labels
        // may wrap, and values keep to the bottom so they still line up.
        <div
          key={t.k}
          className="glass-tile flex min-w-0 flex-[1_1_150px] flex-col gap-[2px] rounded-[20px] px-4 py-3 max-split:basis-[110px] max-split:justify-between"
        >
          <span className="text-[13px] whitespace-nowrap text-ink-3 max-split:text-balance max-split:whitespace-normal">
            {t.k}
          </span>
          <span className="text-[24px] font-normal tracking-[-0.02em]">{t.v}</span>
        </div>
      ))}
      {medianBase !== null && (
        // Live data: medians are fetched for a capped number of matches.
        <p className="basis-full px-1 text-[12px] text-muted">
          {`Medians are of the ${fmtCount(medianBase)} largest matches by market cap.`}
        </p>
      )}
    </section>
  );
}
