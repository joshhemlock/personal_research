"use client";

import { useLayoutEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { RiErrorWarningLine } from "@remixicon/react";
import { Chip } from "@/components/base/badges/chip";
import { TextFieldContext } from "@/components/base/input/input";
import { NumberField } from "@/components/base/number-field/number-field";
import { AnimatedValue } from "@/components/motion/AnimatedValue";
import { deltaColor } from "@/components/shell/delta";
import { num, pct } from "@/lib/format";
import type { Scenario, ScenarioKey } from "@/lib/mock/notes";
import { cx } from "@/utils/cx";
import { SECTION_TITLE } from "./constants";

type Field = "prob" | "value";
type FieldKey = `${ScenarioKey}-${Field}`;

/** Colour of each case's dot: loss, neutral, gain. */
const CASE_COLOR: Record<ScenarioKey, string> = {
  Bear: "var(--color-chart-negative)",
  Base: "var(--color-foreground-icon-tertiary)",
  Bull: "var(--color-chart-positive)",
};

const VALUE_FORMAT: Intl.NumberFormatOptions = { minimumFractionDigits: 2, maximumFractionDigits: 2 };
const PROB_FORMAT: Intl.NumberFormatOptions = { style: "unit", unit: "percent", maximumFractionDigits: 2 };
const LIMITS: Record<Field, { min: number; max: number }> = {
  value: { min: 0.01, max: 9_999_999 },
  prob: { min: 0, max: 100 },
};

/** The number being typed (en-US), within the field's limits; null while it isn't one yet. */
function parseTyped(text: string, field: Field): number | null {
  const t = text.replace(/[,%\s]/g, "");
  if (!/^\d+(\.\d*)?$|^\.\d+$/.test(t)) return null;
  const v = Number(t);
  const { min, max } = LIMITS[field];
  return v >= min && v <= max ? v : null;
}

/** Axis labels: "140", "1,082.5". */
function tick(v: number): string {
  return v.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

/** Position on the bear-to-bull track, 0–100. */
function position(v: number, lo: number, hi: number): number {
  const p = hi > lo ? ((v - lo) / (hi - lo)) * 100 : 50;
  return Math.min(100, Math.max(0, p));
}

/** Percent from today's price to a value, or "—" without a price. */
function fromPrice(value: number, price: number | null): string {
  return price == null ? "—" : pct((value / price - 1) * 100, 1);
}

/** Least space between the "Now" label and a value label on the track, px. */
const LABEL_GAP = 8;

/**
 * Keeps the "Now" label inside the track and hides the value labels it
 * would overlap (each value is in its card above). Works from the target
 * positions rather than the rendered boxes, which may still be gliding.
 */
function fitTrackLabels(track: HTMLElement, now: number | null) {
  const label = track.querySelector<HTMLElement>("[data-now]");
  const ticks = [...track.querySelectorAll<HTMLElement>("[data-tick]")];
  for (const t of ticks) t.style.visibility = "";
  if (!label || now == null) return;
  const width = track.clientWidth;
  const w = label.offsetWidth;
  const left = (now / 100) * width - w / 2;
  const shift = left < 0 ? -left : left + w > width ? width - (left + w) : 0;
  label.style.marginLeft = `${shift}px`;
  const a = left + shift;
  const b = a + w;
  for (const t of ticks) {
    const p = Number(t.dataset.tick);
    const tw = t.offsetWidth;
    const start = t.dataset.align === "start" ? 0 : t.dataset.align === "end" ? width - tw : (p / 100) * width - tw / 2;
    if (start < b + LABEL_GAP && a < start + tw + LABEL_GAP) t.style.visibility = "hidden";
  }
}

/** Moves its content along the track by transform, so a change of position glides. */
const GLIDE = "pointer-events-none absolute inset-0 transition-transform duration-300 ease-board motion-reduce:transition-none";

/**
 * Bear / base / bull fair values with probabilities, their weighted value
 * and where today's price sits between them. Values and probabilities are
 * BoardUI number fields; everything else is recomputed as you type (the
 * fields commit on blur, Enter or a step; Escape puts the field back).
 * Without a price (market data unavailable) the upsides show "—" and the
 * marker is hidden.
 */
export function Scenarios({ initial, price, headingId }: { initial: Scenario[]; price: number | null; headingId: string }) {
  const [rows, setRows] = useState(initial);
  // Numbers being typed, per field, before the field commits them.
  const [live, setLive] = useState<Partial<Record<FieldKey, number>>>({});
  // Bumped by Escape: remounts the fields so they show the committed values again.
  const [resets, setResets] = useState(0);
  const resetsRef = useRef(0);
  const atFocus = useRef<Scenario[]>(initial);
  const track = useRef<HTMLDivElement>(null);

  const current = rows.map((r) => ({
    ...r,
    prob: live[`${r.key}-prob`] ?? r.prob,
    value: live[`${r.key}-value`] ?? r.value,
  }));
  const probSum = current.reduce((s, r) => s + r.prob, 0);
  const weighted = probSum > 0 ? current.reduce((s, r) => s + r.prob * r.value, 0) / probSum : null;
  const upside = weighted == null || price == null ? null : (weighted / price - 1) * 100;
  const values = current.map((r) => r.value);
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const ordered = [...current].sort((a, b) => a.value - b.value);
  const off100 = Math.abs(probSum - 100) > 0.001;
  const now = price == null ? null : position(price, lo, hi);
  const weightedText = weighted == null ? "—" : num(weighted);

  // Re-fit the track's labels whenever the price or a value moves them.
  useLayoutEffect(() => {
    const el = track.current;
    if (!el) return;
    fitTrackLabels(el, now);
    const observer = new ResizeObserver(() => fitTrackLabels(el, now));
    observer.observe(el);
    return () => observer.disconnect();
  }, [now, lo, hi]);

  const clearLive = (k: FieldKey) =>
    setLive((l) => {
      if (!(k in l)) return l;
      const next = { ...l };
      delete next[k];
      return next;
    });

  /** Props for the wrapper of one field: live typing, Enter and Escape. */
  const fieldEvents = (key: ScenarioKey, field: Field) => {
    const k: FieldKey = `${key}-${field}`;
    return {
      onFocus: () => {
        atFocus.current = rows;
      },
      onInput: (e: FormEvent<HTMLDivElement>) => {
        const v = parseTyped((e.target as HTMLInputElement).value, field);
        if (v == null) clearLive(k);
        else setLive((l) => ({ ...l, [k]: v }));
      },
      onBlur: () => clearLive(k),
      onKeyDownCapture: (e: KeyboardEvent<HTMLDivElement>) => {
        if (e.key === "Enter") (e.target as HTMLElement).blur();
        if (e.key === "Escape") {
          e.preventDefault();
          const old = atFocus.current.find((r) => r.key === key);
          if (old) setRows((rs) => rs.map((r) => (r.key === key ? { ...r, [field]: old[field] } : r)));
          clearLive(k);
          resetsRef.current += 1;
          setResets(resetsRef.current);
        }
      },
    };
  };

  const commit = (key: ScenarioKey, field: Field, token: number) => (v: number) => {
    // Ignore a commit from a field that Escape has just replaced.
    if (token !== resetsRef.current || Number.isNaN(v)) return;
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, [field]: v } : r)));
  };

  return (
    <section aria-labelledby={headingId} className="@container flex flex-col gap-2 overflow-hidden rounded-2xl bg-background-secondary-default p-2">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-2 pt-1">
        <h2 id={headingId} className={SECTION_TITLE}>
          Fair value
        </h2>
        <p
          role="status"
          className={cx(
            "flex items-center gap-1 text-caption-1-medium transition-colors duration-200 ease",
            off100 ? "text-status-orange-text" : "text-text-tertiary",
          )}
        >
          {off100 && <RiErrorWarningLine aria-hidden className="size-3.5 shrink-0 animate-number" />}
          {off100 ? `Weights add up to ${tick(probSum)}%, rescaled to 100%` : "Weights add up to 100%"}
        </p>
      </div>

      <div className="grid gap-2 @min-[30rem]:grid-cols-3">
        {current.map((r) => (
          <div key={r.key} className="@container flex min-w-0 flex-col gap-2 rounded-xl bg-background-inner-default p-3 shadow-card">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-body-medium text-text-primary">
                <span aria-hidden="true" className="size-2 rounded-full" style={{ backgroundColor: CASE_COLOR[r.key] }} />
                {r.key}
              </span>
              {price != null && (
                <AnimatedValue value={String(r.value)}>
                  <Chip variant="caption" color={deltaColor((r.value / price - 1) * 100, 1)}>
                    {fromPrice(r.value, price)}
                  </Chip>
                </AnimatedValue>
              )}
            </div>
            <div className="flex flex-col gap-1.5 @min-[17rem]:flex-row">
              <div className="min-w-0 flex-1" {...fieldEvents(r.key, "value")}>
                <TextFieldContext value={{ inputClassName: "text-title-3-medium" }}>
                  <NumberField
                    key={`value-${resets}`}
                    aria-label={`${r.key} case value`}
                    value={rows.find((x) => x.key === r.key)?.value}
                    onChange={commit(r.key, "value", resets)}
                    formatOptions={VALUE_FORMAT}
                    minValue={LIMITS.value.min}
                    maxValue={LIMITS.value.max}
                    hideSteppers
                    isWheelDisabled
                  />
                </TextFieldContext>
              </div>
              <div className="min-w-0 @min-[17rem]:w-32" {...fieldEvents(r.key, "prob")}>
                <NumberField
                  key={`prob-${resets}`}
                  aria-label={`${r.key} case probability`}
                  size="small"
                  value={rows.find((x) => x.key === r.key)?.prob}
                  onChange={commit(r.key, "prob", resets)}
                  formatOptions={PROB_FORMAT}
                  minValue={LIMITS.prob.min}
                  maxValue={LIMITS.prob.max}
                  isWheelDisabled
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-4 rounded-xl bg-background-inner-default p-4 shadow-card @min-[30rem]:flex-row @min-[30rem]:items-center @min-[30rem]:gap-6">
        <div aria-live="polite" className="flex shrink-0 flex-col gap-0.5">
          <span className="text-body-medium text-text-secondary">Weighted value</span>
          <AnimatedValue value={weightedText} className="text-title-1-medium text-text-primary" />
          <span className="flex items-center gap-1.5 text-body-2-regular whitespace-nowrap text-text-secondary">
            {weighted == null ? (
              "Add probabilities"
            ) : upside == null || price == null ? (
              "No price now"
            ) : (
              <>
                <AnimatedValue value={weightedText}>
                  <Chip variant="caption" color={deltaColor(upside, 1)}>
                    {pct(upside, 1)}
                  </Chip>
                </AnimatedValue>
                from {num(price)}
              </>
            )}
          </span>
        </div>

        {/* A chart, so physical left/right in either direction. */}
        <div
          ref={track}
          role="img"
          aria-label={`Fair value range ${tick(lo)} to ${tick(hi)}${price == null ? "" : `; price now ${num(price)}`}`}
          dir="ltr"
          className="relative mx-2 h-10 min-w-0 shrink-0 @min-[30rem]:flex-1"
        >
          <span className="absolute inset-x-0 top-2 h-1.5 rounded-full bg-linear-to-r from-chart-negative/40 via-chart-track to-chart-positive/50" />
          {ordered.map((r, i) => {
            const align = i === 0 ? "start" : i === ordered.length - 1 ? "end" : "middle";
            const p = position(r.value, lo, hi);
            return align === "middle" ? (
              <span key={r.key} className={GLIDE} style={{ transform: `translateX(${p}%)` }}>
                <span
                  data-tick={p}
                  data-align={align}
                  className="absolute top-6 left-0 -translate-x-1/2 text-caption-1-regular whitespace-nowrap text-text-tertiary"
                >
                  {tick(r.value)}
                </span>
              </span>
            ) : (
              <span
                key={r.key}
                data-tick={p}
                data-align={align}
                className={cx("absolute top-6 text-caption-1-regular text-text-tertiary", align === "start" ? "left-0" : "right-0")}
              >
                {tick(r.value)}
              </span>
            );
          })}
          {now != null && price != null && (
            <>
              <span className={GLIDE} style={{ transform: `translateX(${now}%)` }}>
                <span className="absolute top-0.5 left-0 size-3.5 -translate-x-1/2 rounded-full bg-foreground-icon-primary shadow-xs ring-2 ring-background-primary-default" />
              </span>
              <span className={GLIDE} style={{ transform: `translateX(${now}%)` }}>
                <span
                  data-now=""
                  className="absolute top-6 left-0 -translate-x-1/2 text-caption-1-medium whitespace-nowrap text-text-primary"
                >
                  Now {num(price)}
                </span>
              </span>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
