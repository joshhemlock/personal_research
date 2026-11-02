import { RiArrowLeftLine } from "@remixicon/react";
import { ButtonLink } from "@/components/base/buttons/button";
import { AppShell } from "@/components/shell/AppShell";

export default function NotFound() {
  return (
    <AppShell>
      <main className="flex min-w-0 flex-1 basis-full flex-col">
        <section className="flex flex-col items-start gap-3 rounded-3xl border border-border-button-default bg-background-primary-default p-6">
          <h1 className="text-title-1-medium text-text-primary">Not found</h1>
          <p className="text-body-regular text-text-secondary">
            There’s nothing here. The symbol or note may not exist in the sample data yet — try search (⌘K).
          </p>
          <ButtonLink href="/" variant="secondary" leadingIcon={RiArrowLeftLine}>
            Back to overview
          </ButtonLink>
        </section>
      </main>
    </AppShell>
  );
}
