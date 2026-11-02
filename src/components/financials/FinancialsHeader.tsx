import { RiQuillPenLine } from "@remixicon/react";
import { Chip } from "@/components/base/badges/chip";
import { ButtonLink } from "@/components/base/buttons/button";
import { deltaColor } from "@/components/shell/delta";
import { pct } from "@/lib/format";
import type { FinancialsData } from "@/lib/mock/financials";
import { ExportButton } from "./ExportButton";
import { quarterLabel } from "./helpers";

type FinancialsHeaderProps = {
  symbol: string;
  name: string;
  /** Today's change, %; null hides the chip. */
  changePct: number | null;
  /** The statements to export; null hides Export. */
  data: FinancialsData | null;
  thesisHref: string;
  /** Where the figures come from, for the export file. */
  source: string;
};

/** Page heading with the latest reported quarter, plus Export and "Add to thesis". */
export function FinancialsHeader({ symbol, name, changePct, data, thesisHref, source }: FinancialsHeaderProps) {
  const latest = data?.quarters[data.quarters.length - 1];
  const summary = [symbol, latest ? `Reported through ${quarterLabel(latest)} (${latest.end})` : "No statements"];
  if (data) summary.push(`${data.currency ?? "USD"} millions`);
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div className="flex min-w-0 flex-col gap-0.5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h1 className="text-title-1-medium text-text-primary">
            {name} <span className="text-text-tertiary">·</span> Financials
          </h1>
          {changePct != null && (
            <Chip color={deltaColor(changePct)}>
              {pct(changePct)}
              <span className="sr-only"> today</span>
            </Chip>
          )}
        </div>
        <p className="text-body-regular text-text-secondary">{summary.join(" · ")}</p>
      </div>
      <div className="flex flex-wrap gap-2.5">
        {data && (
          <ExportButton
            symbol={symbol}
            quarters={data.quarters.slice(-4)}
            years={data.years}
            statements={data.statements}
            currency={data.currency}
            source={source}
          />
        )}
        <ButtonLink href={thesisHref} leadingIcon={RiQuillPenLine}>
          Add to thesis
        </ButtonLink>
      </div>
    </div>
  );
}
