// Deterministic sample-data helpers ported from the design files
// (design/source/*.dc.html). Same seeds give the same sparklines as the PNGs.

/** Seeded PRNG (mulberry32), identical to `rng()` in the design scripts. */
export function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Random walk starting at 100, identical to `walk()` in the design scripts. */
export function walk(seed: number, n: number, drift: number): number[] {
  const r = rng(seed);
  let v = 100;
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    v += (r() - 0.5) * 3 + drift / n;
    out.push(v);
  }
  return out;
}

/** SVG path through `vals`, scaled to w×h with vertical padding `pad`. */
export function linePath(vals: number[], w: number, h: number, pad: number): string {
  const mn = Math.min(...vals);
  const mx = Math.max(...vals);
  const rg = mx - mn || 1;
  let d = "";
  for (let i = 0; i < vals.length; i++) {
    const x = (i / (vals.length - 1)) * w;
    const y = pad + (1 - (vals[i] - mn) / rg) * (h - pad * 2);
    d += (i ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(1) + " ";
  }
  return d;
}

/** Stable numeric seed from a string (for symbols without hand-made data). */
export function seedFrom(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}
