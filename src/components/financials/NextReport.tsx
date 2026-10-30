import type { FinancialsData } from "@/lib/mock/financials";

/** Dark card with the next earnings date and consensus. */
export function NextReport({ report }: { report: FinancialsData["nextReport"] }) {
  const stats = [
    { label: "Revenue est.", value: report.revenueEst },
    { label: "EPS est.", value: report.epsEst },
    // Implied move needs options data; without it, show the growth the revenue estimate implies.
    report.impliedMove !== undefined
      ? { label: "Implied move", value: report.impliedMove }
      : report.revenueGrowthEst !== undefined
        ? { label: "Rev. est. YoY", value: report.revenueGrowthEst }
        : null,
  ].filter((s) => s !== null);
  return (
    <section
      aria-labelledby="nx-h"
      className="flex flex-col gap-2 rounded-[24px] bg-account px-[18px] py-[14px] text-white shadow-[0_14px_34px_-18px_rgba(17,17,19,0.5)]"
    >
      <div className="flex items-center justify-between gap-2.5">
        <h2 id="nx-h" className="m-0 text-[19px] font-normal">
          Next report
        </h2>
        <span className="inline-flex h-6 items-center rounded-[6px] bg-amber px-[9px] text-[12px] font-medium text-[#2A1A00]">
          {report.when}
        </span>
      </div>
      <dl className="m-0 grid grid-cols-3 gap-2.5">
        {stats.map((s) => (
          <div key={s.label} className="flex flex-col leading-[1.25]">
            <dt className="text-[12px] text-[#B4B4BB]">{s.label}</dt>
            <dd className="m-0 text-[18px]">{s.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
