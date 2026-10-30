// US market calendar helpers, in New York time. Exchange holidays and early
// closes are not modelled.

const TZ = "America/New_York";

type Parts = Record<"year" | "month" | "day" | "weekday" | "hour" | "minute", string> & { minutes: number };

function parts(d: Date): Parts {
  const p: Record<string, string> = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: TZ,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(d)
      .map((x) => [x.type, x.value]),
  );
  return { ...(p as Omit<Parts, "minutes">), minutes: Number(p.hour) * 60 + Number(p.minute) };
}

/** Today's date in New York, YYYY-MM-DD. */
export function marketDate(d = new Date()): string {
  const p = parts(d);
  return `${p.year}-${p.month}-${p.day}`;
}

/** Unix seconds → YYYY-MM-DD in New York. */
export function marketDateOf(unixSeconds: number): string {
  return marketDate(new Date(unixSeconds * 1000));
}

export function isMarketOpen(d = new Date()): boolean {
  const p = parts(d);
  const weekday = !["Sat", "Sun"].includes(p.weekday);
  return weekday && p.minutes >= 9 * 60 + 30 && p.minutes < 16 * 60;
}

/** "Market open · 11:51 ET" */
export function marketStatusLabel(d = new Date()): string {
  const p = parts(d);
  return `Market ${isMarketOpen(d) ? "open" : "closed"} · ${Number(p.hour)}:${p.minute} ET`;
}

export function greeting(d = new Date()): string {
  const h = Number(parts(d).hour);
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}
