import { type NextRequest, NextResponse } from "next/server";
import { searchListings } from "@/lib/data/market";
import { isSample } from "@/lib/data/source";

// Live ticker search for the command palette. In sample mode the palette
// only searches the sample universe, so this answers with nothing.
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.slice(0, 40) ?? "";
  if (isSample || !q.trim()) return NextResponse.json({ results: [] });
  try {
    return NextResponse.json({ results: await searchListings(q) });
  } catch {
    return NextResponse.json({ results: [] }, { status: 502 });
  }
}
