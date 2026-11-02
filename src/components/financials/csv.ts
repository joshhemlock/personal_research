// The statements as CSV, for Export. Loaded on demand when the reader exports.

import type { Quarter, StatementKey, StatementRow } from "@/lib/mock/financials";
import { statementTotal } from "./helpers";

const TITLES: Record<StatementKey, string> = {
  income: "Income statement",
  balance: "Balance sheet",
  cash: "Cash flow",
};

export type CsvInput = {
  symbol: string;
  /** The four quarters shown in the statements table, oldest first. */
  quarters: Quarter[];
  years: string[];
  statements: Record<StatementKey, StatementRow[]>;
  /** Reporting currency; USD when absent. */
  currency?: string;
  /** Where the figures come from, for the first line of the file. */
  source: string;
};

const cell = (v: string | number) => {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function toCsv({ symbol, quarters, years, statements, currency = "USD", source }: CsvInput): string {
  const lines = [`${symbol} financials — ${source}, ${currency} millions except per share`];
  (Object.keys(TITLES) as StatementKey[]).forEach((key) => {
    const agg = key === "balance" ? "Latest" : "TTM";
    lines.push("", [TITLES[key], ...quarters.map((q) => `${q.q} ${q.fy}`), agg, "YoY %", ...years].map(cell).join(","));
    statements[key].forEach((r) => {
      const digits = r.kind === "eps" ? 2 : 0;
      // Figures that aren't available are left empty.
      const fmt = (v: number | null) => (v == null ? "" : v.toFixed(digits));
      const yoy = r.yoy == null ? "" : r.yoy.toFixed(1);
      lines.push([r.label, ...r.quarterly.map(fmt), fmt(statementTotal(r)), yoy, ...r.annual.map(fmt)].map(cell).join(","));
    });
  });
  return lines.join("\n") + "\n";
}
