"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { RouterProvider } from "react-aria-components";
import { DirectionProvider } from "@/components/foundations/direction/direction";

declare module "react-aria-components" {
  interface RouterConfig {
    routerOptions: NonNullable<Parameters<ReturnType<typeof useRouter>["push"]>[1]>;
  }
}

/**
 * App-wide React Aria setup: the locale and direction BoardUI's components
 * read, and Next's router for React Aria links (table rows, menu items), so
 * they navigate client-side like <Link>.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  const router = useRouter();
  return (
    <DirectionProvider locale="en-US">
      <RouterProvider navigate={router.push}>{children}</RouterProvider>
    </DirectionProvider>
  );
}
