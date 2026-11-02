// The crosshair follows the pointer without React: pointer moves are batched
// to one animation frame, then the overlay pieces (lines, dot, axis pills,
// the volume bar under it and the OHLC readout) are moved with transforms
// and their text swapped in place. React only hears about the crosshair when
// it comes to rest (pointer leaves, keyboard steps).

import type { Bar } from "@/lib/mock/chart";
import { price } from "./format";
import { pillDate, xOf, yOf, type Geometry } from "./scale";

/** A bar, plus a free price level with the crosshair tool (null snaps to the close). */
export type CrossPoint = { index: number; price: number | null };

export type CrosshairSlot =
  | "plotX" // vertical line over the price chart
  | "plotY" // horizontal line
  | "dot"
  | "priceTag" // price pill on the axis (moves)
  | "priceText"
  | "axisX" // vertical line over the time axis
  | "dateTag" // date pill on the time axis (moves)
  | "dateText"
  | "volume" // the volume bar under the crosshair
  | "o"
  | "h"
  | "l"
  | "c";

/** Half the date pill's width: it stays inside the axis. */
const DATE_HALF = 54;
/** Half the price pill's height: it stays inside the plot. */
const PRICE_HALF = 12;

export class Crosshair {
  private readonly els = new Map<CrosshairSlot, HTMLElement>();
  private readonly refs = new Map<CrosshairSlot, (el: HTMLElement | null) => void>();
  private bars: readonly Bar[] = [];
  private g: Geometry | null = null;
  private vmax = 1;
  private rest: CrossPoint = { index: 0, price: null };
  private hovered: CrossPoint | null = null;
  /** The OHLC readout follows the resting crosshair while the chart has keyboard focus. */
  private focused = false;
  private frame = 0;

  /** Stable callback ref for an overlay piece. */
  ref(slot: CrosshairSlot) {
    let fn = this.refs.get(slot);
    if (!fn) {
      fn = (el: HTMLElement | null) => {
        if (el) {
          this.els.set(slot, el);
          this.paint();
        } else this.els.delete(slot);
      };
      this.refs.set(slot, fn);
    }
    return fn;
  }

  /** New geometry, bars or resting position from React (a commit): repaint now. */
  sync(bars: readonly Bar[], g: Geometry, vmax: number, rest: CrossPoint, focused: boolean) {
    this.bars = bars;
    this.g = g;
    this.vmax = vmax || 1;
    this.rest = rest;
    this.focused = focused;
    this.paint();
  }

  /** Pointer over the chart (null when it leaves). Painted on the next frame. */
  hover(p: CrossPoint | null) {
    this.hovered = p;
    if (!this.frame) {
      this.frame = requestAnimationFrame(() => {
        this.frame = 0;
        this.paint();
      });
    }
  }

  /** Where the pointer last was, if it is over the chart. */
  get pointer(): CrossPoint | null {
    return this.hovered;
  }

  dispose() {
    cancelAnimationFrame(this.frame);
    this.frame = 0;
  }

  private paint() {
    const { g, bars } = this;
    if (!g || !bars.length) return;
    const at = this.hovered ?? this.rest;
    const index = Math.max(0, Math.min(bars.length - 1, at.index));
    const bar = bars[index];
    const level = at.price ?? bar.c;
    // Fractions of the plot; the overlay containers turn them into pixels
    // with container units (cqw / cqh), so this never measures the DOM.
    const x = xOf(g, index);
    const y = yOf(g, level);
    const inside = y >= 0 && y <= 1;

    this.move("plotX", `translate3d(calc(${x} * 100cqw), 0, 0)`);
    this.move("axisX", `translate3d(calc(${x} * 100cqw), 0, 0)`);
    this.move("plotY", `translate3d(0, calc(${y} * 100cqh), 0)`, inside);
    this.move("dot", `translate3d(calc(${x} * 100cqw - 50%), calc(${y} * 100cqh - 50%), 0)`, inside);
    this.move(
      "priceTag",
      `translate3d(0, calc(clamp(${PRICE_HALF}px, ${y} * 100cqh, 100cqh - ${PRICE_HALF}px) - 50%), 0)`,
    );
    this.move("dateTag", `translate3d(calc(clamp(${DATE_HALF}px, ${x} * 100cqw, 100cqw - ${DATE_HALF}px) - 50%), 0, 0)`);
    this.text("priceText", price(level));
    this.text("dateText", pillDate(bar.time));

    const vol = this.els.get("volume");
    if (vol) {
      const w = 0.6 * g.bx;
      vol.style.width = `calc(${w} * 100cqw)`;
      vol.style.transform = `translate3d(calc(${x - w / 2} * 100cqw), 0, 0) scaleY(${Math.min(1, bar.v / this.vmax)})`;
    }

    // The readout shows the bar under the pointer, else the latest one.
    const shown = this.hovered || this.focused ? bar : bars[bars.length - 1];
    this.text("o", price(shown.o));
    this.text("h", price(shown.h));
    this.text("l", price(shown.l));
    this.text("c", price(shown.c));
  }

  private move(slot: CrosshairSlot, transform: string, visible = true) {
    const el = this.els.get(slot);
    if (!el) return;
    el.style.transform = transform;
    el.style.opacity = visible ? "1" : "0";
  }

  private text(slot: CrosshairSlot, value: string) {
    const el = this.els.get(slot);
    if (!el || el.textContent === value) return;
    // Rewrite the text node React rendered (if any) rather than replacing it.
    const node = el.firstChild;
    if (node && node.nodeType === Node.TEXT_NODE && !node.nextSibling) node.nodeValue = value;
    else el.textContent = value;
  }
}
