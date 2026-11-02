"use client";

import { RiDownload2Line } from "@remixicon/react";
import { Button } from "@/components/base/buttons/button";
import type { CsvInput } from "./csv";

/** Downloads every statement (quarterly and annual columns) as a CSV file. */
export function ExportButton(props: CsvInput) {
  const download = async () => {
    // The CSV writer is only needed once someone exports.
    const { toCsv } = await import("./csv");
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
    <Button variant="secondary" leadingIcon={RiDownload2Line} onClick={download} title="Download the statements as CSV">
      Export
    </Button>
  );
}
