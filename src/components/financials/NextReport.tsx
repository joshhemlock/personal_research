import { Chip } from "@/components/base/badges/chip";
import type { FinancialsData } from "@/lib/mock/financials";
import { Card } from "./Card";

/** The next earnings date and the consensus going into it. */
export function NextReport({ id, report }: { id?: string; report: FinancialsData["nextReport"] }) {
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
    <Card
      id={id}
      titleId="nx-h"
      title="Next report"
      className="scroll-mt-6"
      note={
        <Chip variant="bold" color="orange">
          {report.when}
        </Chip>
      }
    >
      <dl className="grid grid-cols-[repeat(auto-fit,minmax(6rem,1fr))] gap-2">
        {stats.map((s) => (
          <div key={s.label} className="flex min-w-0 flex-col gap-0.5 rounded-xl bg-background-secondary-default px-2.5 py-2">
            <dt className="text-caption-1-regular text-text-secondary">{s.label}</dt>
            <dd className="text-headline-medium text-text-primary">{s.value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
