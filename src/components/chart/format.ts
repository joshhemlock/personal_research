// Price formatting for the chart's hot paths (axis labels, tags, the
// crosshair): one shared Intl formatter, the same output as lib/format's num().

const PRICE = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** "1,234.50" */
export const price = (v: number) => PRICE.format(v);
