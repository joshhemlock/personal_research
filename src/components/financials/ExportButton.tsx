"use client";

import { Icon } from "@/components/ui/Icon";
import type { Quarter, StatementKey, StatementRow } from "@/lib/mock/financials";

const TITLES: Record<StatementKey, string> = {
  income: "Income statement",
  balance: "Balance sheet",
  cash: "Cash flow",
};

type ExportButtonProps = {
  symbol: string;
  /** The four quarters shown in the statements table, oldest first. */
  quarters: Quarter[];
  years: string[];
  statements: Record<StatementKey, StatementRow[]>;
};

const cell = (v: string | number) => {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

function toCsv({ symbol, quarters, years, statements }: ExportButtonProps): string {
  const lines = [`${symbol} financials — sample data, USD millions except per share`];
  (Object.keys(TITLES) as StatementKey[]).forEach((key) => {
    const agg = key === "balance" ? "Latest" : "TTM";
    lines.push("", [TITLES[key], ...quarters.map((q) => `${q.q} ${q.fy}`), agg, "YoY %", ...years].map(cell).join(","));
    statements[key].forEach((r) => {
      const total = r.agg === "last" ? r.quarterly[r.quarterly.length - 1] : r.quarterly.reduce((s, v) => s + v, 0);
      const digits = r.kind === "eps" ? 2 : 0;
      const fmt = (v: number) => v.toFixed(digits);
      lines.push([r.label, ...r.quarterly.map(fmt), fmt(total), r.yoy.toFixed(1), ...r.annual.map(fmt)].map(cell).join(","));
    });
  });
  return lines.join("\n") + "\n";
}

/** Downloads every statement (quarterly and annual columns) as a CSV file. */
export function ExportButton(props: ExportButtonProps) {
  const download = () => {
    const url = URL.createObjectURL(new Blob([toCsv(props)], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${props.symbol}-financials.csv`;
    document.body.append(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };
  return (
    <button
      type="button"
      onClick={download}
      title="Download the statements as CSV"
      className="glass-chip inline-flex h-11 items-center gap-2 rounded-full px-[18px] text-[15px] text-ink transition-colors duration-150 hover:bg-white"
    >
      <Icon d="M12 4v11M7 10l5 5 5-5M5 20h14" size={18} linejoin="round" />
      Export
    </button>
  );
}
