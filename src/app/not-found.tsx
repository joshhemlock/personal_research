import Link from "next/link";
import { AppShell } from "@/components/shell/AppShell";

export default function NotFound() {
  return (
    <AppShell>
      <main className="flex min-w-0 flex-[999_1_620px] flex-col">
        <section className="glass flex flex-col items-start gap-3 rounded-[24px] px-[18px] py-6">
          <h1 className="m-0 text-[26px] font-normal tracking-[-0.02em]">Not found</h1>
          <p className="m-0 text-[15px] text-ink-3">
            There’s nothing here. The symbol or note may not exist in the sample data yet — try search (⌘K).
          </p>
          <Link
            href="/"
            className="inline-flex h-[42px] items-center gap-2 rounded-full bg-ink px-5 text-[15px] font-medium text-white"
          >
            Back to overview
          </Link>
        </section>
      </main>
    </AppShell>
  );
}
