/**
 * Runs `load` once the browser is idle after first paint (or after a short
 * delay where requestIdleCallback is missing). Used to fetch lazily loaded
 * shell UI (search, notifications, the nav drawer) off the critical path, so
 * it still opens instantly on first use. Returns a cancel function.
 */
export function whenIdle(load: () => unknown): () => void {
  if (typeof window === "undefined") return () => {};
  if ("requestIdleCallback" in window) {
    const id = window.requestIdleCallback(() => void load(), { timeout: 4000 });
    return () => window.cancelIdleCallback(id);
  }
  const id = setTimeout(() => void load(), 1500);
  return () => clearTimeout(id);
}
