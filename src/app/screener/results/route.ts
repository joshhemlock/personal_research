import { type NextRequest, NextResponse } from "next/server";
import { exportLiveScreen, parseScreenQuery, runLiveScreen } from "@/lib/data/screener";
import { isSample } from "@/lib/data/source";

// Live Screener results for the client as the screen is edited:
//   GET /screener/results?q=<ScreenQuery JSON>            one page (ScreenPage)
//   GET /screener/results?q=<ScreenQuery JSON>&export=1   { rows } for the CSV
// In sample mode the Screener filters its sample universe itself.
export async function GET(request: NextRequest) {
  if (isSample) return NextResponse.json({ error: "Live data is off" }, { status: 404 });
  const params = request.nextUrl.searchParams;
  const query = parseScreenQuery(params.get("q"));
  if (!query) return NextResponse.json({ error: "Malformed screen" }, { status: 400 });
  try {
    if (params.get("export") === "1") return NextResponse.json({ rows: await exportLiveScreen(query) });
    return NextResponse.json(await runLiveScreen(query));
  } catch {
    return NextResponse.json({ error: "TradingView didn't answer" }, { status: 502 });
  }
}
