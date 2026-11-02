"use client";

import { RiRefreshLine } from "@remixicon/react";
import { Button, ButtonLink } from "@/components/base/buttons/button";

// Shown in place of a screen that can't load, most often because the market
// data provider didn't answer. The sidebar and top bar (root layout) stay.
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-w-0 flex-col">
      <section className="flex max-w-[560px] animate-enter flex-col items-start gap-3 rounded-3xl border border-border-button-default bg-background-primary-default p-6">
        <h1 className="text-title-1-medium text-text-primary">Market data didn’t load</h1>
        <p className="text-body-regular text-text-secondary">
          The data provider didn’t answer in time or returned something unexpected. It’s usually temporary.
        </p>
        {error.digest && <p className="text-caption-1-regular text-text-tertiary">Reference {error.digest}</p>}
        <div className="flex gap-2.5">
          <Button leadingIcon={RiRefreshLine} onClick={reset}>
            Try again
          </Button>
          <ButtonLink href="/" variant="secondary">
            Overview
          </ButtonLink>
        </div>
      </section>
    </main>
  );
}
