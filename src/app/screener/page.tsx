import type { Metadata } from "next";
import { AppShell } from "@/components/shell/AppShell";

export const metadata: Metadata = { title: "Screener" };

export default function ScreenerPage() {
  return (
    <AppShell active="screener">
      <aside className="flex min-w-0 flex-[1_1_290px] flex-col self-start" />
      <main className="flex min-w-0 flex-[999_1_620px] flex-col gap-3 pb-1">Screener</main>
    </AppShell>
  );
}
