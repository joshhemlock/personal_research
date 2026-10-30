import type { Metadata } from "next";
import { AppShell } from "@/components/shell/AppShell";

export const metadata: Metadata = { title: "Overview" };

export default function OverviewPage() {
  return (
    <AppShell active="overview">
      <main className="flex min-w-0 flex-[999_1_620px] flex-col gap-3 pb-1">Overview</main>
      <aside className="flex min-w-0 flex-[1_1_330px] flex-col gap-3 pb-1" />
    </AppShell>
  );
}
