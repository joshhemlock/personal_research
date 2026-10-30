"use client";

import { useRef, useState, type ChangeEvent, type KeyboardEvent } from "react";
import type { Scenario, ScenarioKey } from "@/lib/mock/notes";
import { num, pct } from "@/lib/format";

const LOOK: Record<ScenarioKey, string> = {
  Bear: "bg-[rgba(234,91,82,0.12)] text-[#8E2A23]",
  Base: "bg-white text-ink",
  Bull: "bg-[rgba(77,176,127,0.16)] text-[#155C3B]",
};

type Field = "prob" | "value";
type DraftKey = `${ScenarioKey}-${Field}`;

function parseValue(text: string): number | null {
  const v = Number(text.replace(/[,\s]/g, ""));
  return text.trim() !== "" && Number.isFinite(v) && v > 0 && v < 1e7 ? v : null;
}

function parseProb(text: string): number | null {
  const t = text.replace(/[%\s]/g, "");
  if (!/^\d{1,3}(\.\d{1,2})?$/.test(t)) return null;
  const v = Number(t);
  return v <= 100 ? v : null;
}

/** Axis labels: "140", "1,082.5". */
function tick(v: number): string {
  return v.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

/** Position on the bear-to-bull track, in percent with one decimal. */
function position(v: number, lo: number, hi: number): string {
  const p = hi > lo ? ((v - lo) / (hi - lo)) * 100 : 50;
  // Round half up in decimal terms (40.35 → 40.4, not 40.3 from 40.3499…).
  return `${(Math.min(100, Math.max(0, p)) + 1e-9).toFixed(1)}%`;
}

const INPUT =
  "min-w-0 rounded-[6px] bg-transparent leading-[1.4] tabular-nums transition-colors duration-150 hover:bg-[rgba(17,17,19,0.05)] focus:bg-white/60";

/**
 * Bear / base / bull fair values with probabilities, their weighted value
 * and where today's price sits between them. Values and probabilities are
 * editable; everything else is recomputed as you type.
 */
export function Scenarios({ initial, price }: { initial: Scenario[]; price: number }) {
  const [rows, setRows] = useState(initial);
  // Text being typed, per field, while it is focused.
  const [drafts, setDrafts] = useState<Partial<Record<DraftKey, string>>>({});
  const before = useRef<Scenario[]>(initial);

  const set = (key: ScenarioKey, field: Field, text: string) => {
    setDrafts((d) => ({ ...d, [`${key}-${field}`]: text }));
    const v = field === "prob" ? parseProb(text) : parseValue(text);
    if (v != null) setRows((rs) => rs.map((r) => (r.key === key ? { ...r, [field]: v } : r)));
  };
  const done = (key: ScenarioKey, field: Field) =>
    setDrafts((d) => {
      const next = { ...d };
      delete next[`${key}-${field}`];
      return next;
    });
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>, key: ScenarioKey, field: Field) => {
    if (e.key === "Enter") e.currentTarget.blur();
    if (e.key === "Escape") {
      // Undo this field's edit.
      const old = before.current.find((r) => r.key === key);
      if (old) setRows((rs) => rs.map((r) => (r.key === key ? { ...r, [field]: old[field] } : r)));
      done(key, field);
      e.currentTarget.blur();
    }
  };
  const field = (key: ScenarioKey, f: Field, shown: string) => ({
    value: drafts[`${key}-${f}`] ?? shown,
    onFocus: () => {
      before.current = rows;
    },
    onChange: (e: ChangeEvent<HTMLInputElement>) => set(key, f, e.target.value),
    onBlur: () => done(key, f),
    onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => onKeyDown(e, key, f),
  });

  const probSum = rows.reduce((s, r) => s + r.prob, 0);
  const weighted = probSum > 0 ? rows.reduce((s, r) => s + r.prob * r.value, 0) / probSum : null;
  const upside = weighted == null ? null : (weighted / price - 1) * 100;
  const values = rows.map((r) => r.value);
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const ordered = [...rows].sort((a, b) => a.value - b.value);
  const off100 = Math.abs(probSum - 100) > 0.001;

  return (
    <section
      aria-label="Fair value scenarios"
      className="flex flex-col gap-3 rounded-[18px] bg-[rgba(17,17,19,0.035)] px-4 py-[14px]"
    >
      <div className="flex flex-wrap gap-[10px]">
        {rows.map((r) => {
          const prob = String(drafts[`${r.key}-prob`] ?? r.prob);
          return (
            <div key={r.key} className={`flex flex-[1_1_120px] flex-col gap-[2px] rounded-[14px] px-[14px] py-[10px] ${LOOK[r.key]}`}>
              <span className="text-[13px] opacity-80">
                {r.key} ·{" "}
                {/* A hidden copy of the text sizes the box, so the input is exactly as wide as its value. */}
                <span className="relative inline-block">
                  <span aria-hidden="true" className="invisible whitespace-pre">
                    {prob || "0"}
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    aria-label={`${r.key} case probability, percent`}
                    {...field(r.key, "prob", String(r.prob))}
                    className={`${INPUT} absolute inset-0 size-full text-[13px]`}
                  />
                </span>
                %
              </span>
              <div className="-mx-1">
                <input
                  type="text"
                  inputMode="decimal"
                  aria-label={`${r.key} case value`}
                  {...field(r.key, "value", num(r.value))}
                  className={`${INPUT} block w-full px-1 text-[24px] font-normal tracking-[-0.02em]`}
                />
                {/* Zero-height copy of the value: keeps the card from getting narrower than it. */}
                <span aria-hidden="true" className="invisible block h-0 overflow-hidden px-1 text-[24px] tracking-[-0.02em] whitespace-pre">
                  {drafts[`${r.key}-value`] || num(r.value)}
                </span>
              </div>
              <span className="text-[12px] opacity-85">{pct((r.value / price - 1) * 100, 1)}</span>
            </div>
          );
        })}
        <div aria-live="polite" className="flex flex-[1_1_140px] flex-col gap-[2px] rounded-[14px] bg-ink px-[14px] py-[10px] text-white">
          <span className="text-[13px] text-[#B4B4BB]">Weighted value</span>
          <span className="text-[24px] font-normal tracking-[-0.02em]">{weighted == null ? "—" : num(weighted)}</span>
          <span className={`text-[12px] ${upside != null && upside < 0 ? "text-[#F7B1AB]" : "text-[#9FE0BE]"}`}>
            {upside == null ? "Add probabilities" : `${pct(upside, 1)} from ${num(price)}`}
          </span>
        </div>
      </div>

      <p role="status" className={off100 ? "text-[12px] text-[#8A5A00]" : "sr-only"}>
        {off100 ? `Probabilities add up to ${tick(probSum)}%, so the weighted value is rescaled to 100%.` : ""}
      </p>

      <div
        role="img"
        aria-label={`Fair value range ${tick(lo)} to ${tick(hi)}; price now ${num(price)}`}
        className="relative mx-2 h-[34px]"
      >
        <span className="absolute inset-x-0 top-2 h-[6px] rounded-[3px] bg-[linear-gradient(90deg,rgba(234,91,82,0.35),rgba(17,17,19,0.12)_50%,rgba(77,176,127,0.45))]" />
        <span
          className="absolute top-[3px] -ml-2 size-4 rounded-full border-[3px] border-white bg-ink shadow-[0_0_0_1px_rgba(17,17,19,0.15)]"
          style={{ left: position(price, lo, hi) }}
        />
        <span
          className="absolute top-5 -translate-x-1/2 text-[11px] whitespace-nowrap text-ink"
          style={{ left: position(price, lo, hi) }}
        >
          Now {num(price)}
        </span>
        {ordered.map((r, i) => (
          <span
            key={r.key}
            className={`absolute top-5 text-[11px] text-muted ${i === 0 || i === ordered.length - 1 ? "" : "-translate-x-1/2"}`}
            style={
              i === 0 ? { left: 0 } : i === ordered.length - 1 ? { right: 0 } : { left: position(r.value, lo, hi) }
            }
          >
            {tick(r.value)}
          </span>
        ))}
      </div>
    </section>
  );
}
