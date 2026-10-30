"use client";

import Link from "next/link";

// Shown when a screen can't load, most often because the market data
// provider didn't answer.
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="box-border min-h-screen bg-page p-[14px]">
      <main className="glass mx-auto mt-24 flex max-w-[560px] flex-col items-start gap-3 rounded-[24px] px-[18px] py-6">
        <h1 className="m-0 text-[26px] font-normal tracking-[-0.02em]">Market data didn’t load</h1>
        <p className="m-0 text-[15px] text-ink-3">
          The data provider didn’t answer in time or returned something unexpected. It’s usually temporary.
        </p>
        {error.digest && <p className="m-0 text-[12px] text-muted">Reference {error.digest}</p>}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-[42px] items-center rounded-full bg-ink px-5 text-[15px] font-medium text-white"
          >
            Try again
          </button>
          <Link href="/" className="glass-chip inline-flex h-[42px] items-center rounded-full px-5 text-[15px]">
            Overview
          </Link>
        </div>
      </main>
    </div>
  );
}
