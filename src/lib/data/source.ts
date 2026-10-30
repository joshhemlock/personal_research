// Where market data comes from.
//
//   DATA_SOURCE=tradingview (default)  live data from TradingView, server-side
//   DATA_SOURCE=sample                 the made-up design data in src/lib/mock,
//                                      used to compare screens with design/screens
export type DataSource = "tradingview" | "sample";

export const DATA_SOURCE: DataSource = process.env.DATA_SOURCE === "sample" ? "sample" : "tradingview";

export const isSample = DATA_SOURCE === "sample";
