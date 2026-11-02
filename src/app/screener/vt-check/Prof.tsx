"use client";
// TEMPORARY profiler wrapper — deleted before hand-off.
import { Profiler, type ReactNode } from "react";
declare global { interface Window { __prof?: [string, string, number][] } }
export function Prof({ id, children }: { id: string; children: ReactNode }) {
  return (
    <Profiler id={id} onRender={(pid, phase, actual) => { (window.__prof ??= []).push([pid, phase, Math.round(actual * 10) / 10]); }}>
      {children}
    </Profiler>
  );
}
