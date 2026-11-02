"use client";

import { useEffect, useRef, useState, type ComponentType, type KeyboardEvent } from "react";
import { Focusable } from "react-aria-components";
import { RiBold, RiItalic, RiLineChartLine, RiLinkM, RiListUnordered, RiShareForwardLine } from "@remixicon/react";
import { IconButton } from "@/components/base/buttons/icon-button";
import { Tooltip, TooltipTrigger } from "@/components/base/tooltip/tooltip";
import { EDITOR_ATTR, RICH_TEXT_SELECTOR } from "./constants";

type Toggle = "bold" | "italic" | "list";
type Action = Toggle | "link" | "chart" | "share";

type IconComponent = ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>;

const BUTTONS: { action: Action; label: string; icon: IconComponent }[] = [
  { action: "bold", label: "Bold", icon: RiBold },
  { action: "italic", label: "Italic", icon: RiItalic },
  { action: "list", label: "Bulleted list", icon: RiListUnordered },
  { action: "link", label: "Link", icon: RiLinkM },
  { action: "chart", label: "Embed chart", icon: RiLineChartLine },
  { action: "share", label: "Share", icon: RiShareForwardLine },
];

const COMMANDS: Record<Toggle, string> = { bold: "bold", italic: "italic", list: "insertUnorderedList" };
const NONE: Record<Toggle, boolean> = { bold: false, italic: false, list: false };
const isToggle = (a: Action): a is Toggle => a in COMMANDS;

/** A toggle that is on: BoardUI's selected tint, one step stronger border. */
const PRESSED =
  "aria-pressed:border-border-button-active aria-pressed:bg-pill-tab-blue-selected-background aria-pressed:text-button-ghost-foreground";

/** What "Embed chart" inserts: the price since the note as a small figure. */
export type ChartEmbed = {
  /** e.g. "NVDA since Aug 12 · +15.0%" */
  caption: string;
  href: string;
  /** Line and area paths in a 300×70 box. */
  line: string;
  area: string;
  /** Gain or loss colours. */
  up: boolean;
};

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

/**
 * The editable rich-text region containing `node`, if it belongs to `editor`.
 * (Next keeps recently visited pages mounted but hidden, so the document can
 * hold other notes' regions too.)
 */
function regionOf(editor: Element, node: Node | null): HTMLElement | null {
  const el = node instanceof Element ? node : (node?.parentElement ?? null);
  const region = el?.closest<HTMLElement>(RICH_TEXT_SELECTOR) ?? null;
  return region && editor.contains(region) ? region : null;
}

/** The live selection, when it sits inside this editor's note body. */
function bodyRange(editor: Element): Range | null {
  const sel = document.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  const range = sel.getRangeAt(0);
  return regionOf(editor, range.commonAncestorContainer) ? range : null;
}

/**
 * Puts the selection back in the note body before running a command: the
 * live one if it is still there, else the last one the user made (focus may
 * have moved to the toolbar), else the end of the first region.
 */
function restoreSelection(editor: Element, saved: Range | null): Range | null {
  const live = bodyRange(editor);
  if (live) return live;
  let range = saved && saved.startContainer.isConnected && regionOf(editor, saved.startContainer) ? saved : null;
  const region = range ? regionOf(editor, range.startContainer) : editor.querySelector<HTMLElement>(RICH_TEXT_SELECTOR);
  if (!region) return null;
  region.focus({ preventScroll: true });
  if (!range) {
    range = document.createRange();
    range.selectNodeContents(region);
    range.collapse(false);
  }
  const sel = document.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(range);
  return range;
}

/** Accepts http(s), mailto and in-app paths; adds https:// when missing. */
function safeHref(raw: string | null): string | null {
  const v = raw?.trim();
  if (!v || v === "https://") return null;
  if (v.startsWith("/") && !v.startsWith("//")) return v;
  try {
    const url = new URL(/^[a-z][a-z\d+.-]*:/i.test(v) ? v : `https://${v}`);
    return ["http:", "https:", "mailto:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

/**
 * The embedded chart: BoardUI tokens throughout (the classes are written out
 * here so Tailwind generates them). Its entrance runs once, from script
 * (embedIn), so it never replays when the page is shown again.
 */
function chartHtml(c: ChartEmbed): string {
  const tone = c.up ? "var(--color-chart-positive)" : "var(--color-chart-negative)";
  return (
    `<figure contenteditable="false" data-embed="chart" class="my-2 flex flex-col gap-1.5 rounded-2xl border border-border-button-default bg-background-secondary-default px-3 py-2.5">` +
    `<svg viewBox="0 0 300 70" preserveAspectRatio="none" role="img" aria-label="${esc(c.caption)}" class="block h-14 w-full">` +
    `<path d="${esc(c.area)}" style="fill: color-mix(in srgb, ${tone} 14%, transparent)"></path>` +
    `<path d="${esc(c.line)}" fill="none" stroke-width="1.75" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke" style="stroke: ${tone}"></path>` +
    `</svg>` +
    `<figcaption class="text-caption-1-regular text-text-secondary">${esc(c.caption)} · <a href="${esc(c.href)}">Open chart</a></figcaption>` +
    `</figure><p><br></p>`
  );
}

const EASE_BOARD = "cubic-bezier(0.22, 1, 0.36, 1)";

/**
 * Plays the entrance of charts just embedded in `root`: the figure condenses
 * in (BoardUI's enter) while the chart is revealed from its start, as if
 * drawn (a clip, since a dash draw stops short on a stretched chart).
 * Skipped under reduced motion.
 */
function embedIn(root: Element) {
  const figures = root.querySelectorAll<HTMLElement>('[data-embed="chart"]:not([data-shown])');
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  for (const fig of figures) {
    fig.setAttribute("data-shown", "");
    if (still) continue;
    fig.animate(
      [
        { opacity: 0, transform: "scale(0.985)", filter: "blur(2px)" },
        { opacity: 1, transform: "none", filter: "none" },
      ],
      { duration: 360, easing: EASE_BOARD },
    );
    fig.querySelector("svg")?.animate([{ clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0 0 0)" }], {
      duration: 600,
      easing: EASE_BOARD,
    });
  }
}

/**
 * Formatting toolbar of the note editor. Acts on the selection inside the
 * contentEditable body regions (marked with data-rich-text) through
 * document.execCommand, so edits stay on the browser's undo stack.
 *
 * BoardUI icon buttons, each named by a tooltip; the toggles report their
 * state with aria-pressed. Short confirmations ("Link copied") show in the
 * tooltip of the button that caused them, and in a live region.
 */
export function FormatToolbar({ chart }: { chart: ChartEmbed | null }) {
  const saved = useRef<Range | null>(null);
  const toolbar = useRef<HTMLDivElement>(null);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const timer = useRef<number | undefined>(undefined);
  const [pressed, setPressed] = useState(NONE);
  const [focusIndex, setFocusIndex] = useState(0);
  const [hovered, setHovered] = useState<Action | null>(null);
  const [flash, setFlash] = useState<{ action: Action; message: string } | null>(null);
  /** The editor this toolbar belongs to. */
  const editor = (): Element => toolbar.current?.closest(`[${EDITOR_ATTR}]`) ?? document.body;

  useEffect(() => {
    document.execCommand("defaultParagraphSeparator", false, "p");
    const onSelection = () => {
      const range = bodyRange(toolbar.current?.closest(`[${EDITOR_ATTR}]`) ?? document.body);
      if (range) {
        saved.current = range.cloneRange();
        const next = {
          bold: document.queryCommandState("bold"),
          italic: document.queryCommandState("italic"),
          list: document.queryCommandState("insertUnorderedList"),
        };
        setPressed((p) => (p.bold === next.bold && p.italic === next.italic && p.list === next.list ? p : next));
      } else if (!toolbar.current?.contains(document.activeElement)) {
        setPressed(NONE);
      }
    };
    document.addEventListener("selectionchange", onSelection);
    return () => {
      // Also runs when the page is hidden on navigation: drop transient UI.
      document.removeEventListener("selectionchange", onSelection);
      window.clearTimeout(timer.current);
      setFlash(null);
      setHovered(null);
    };
  }, []);

  const notify = (action: Action, message: string) => {
    setFlash({ action, message });
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setFlash(null), 2400);
  };

  const toggleLink = () => {
    const range = restoreSelection(editor(), saved.current);
    if (!range) return;
    const node = range.commonAncestorContainer;
    const anchor = (node instanceof Element ? node : node.parentElement)?.closest("a");
    if (anchor && regionOf(editor(), anchor)) {
      // Already in a link: remove it.
      const all = document.createRange();
      all.selectNodeContents(anchor);
      document.getSelection()?.removeAllRanges();
      document.getSelection()?.addRange(all);
      document.execCommand("unlink");
      return;
    }
    const keep = range.cloneRange();
    const input = window.prompt("Link address (a URL or an app path like /screener)", "https://");
    const href = safeHref(input);
    if (!href) return;
    const target = restoreSelection(editor(), keep);
    if (!target) return;
    if (target.collapsed) {
      document.execCommand("insertHTML", false, `<a href="${esc(href)}">${esc(input?.trim() ?? href)}</a>`);
    } else {
      document.execCommand("createLink", false, href);
    }
  };

  const share = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      notify("share", "Link to this note copied");
    } catch {
      window.prompt("Copy the link to this note", url);
    }
  };

  const run = (action: Action) => {
    if (action === "share") {
      void share();
    } else if (action === "link") {
      toggleLink();
    } else if (restoreSelection(editor(), saved.current)) {
      if (action !== "chart") {
        document.execCommand(COMMANDS[action]);
      } else if (chart) {
        document.execCommand("insertHTML", false, chartHtml(chart));
        embedIn(editor());
      } else {
        notify("chart", "No price history to embed right now");
      }
    }
  };

  // Toolbar pattern: one tab stop, arrow keys move between buttons.
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const n = BUTTONS.length;
    const next =
      e.key === "ArrowRight" ? (focusIndex + 1) % n
      : e.key === "ArrowLeft" ? (focusIndex - 1 + n) % n
      : e.key === "Home" ? 0
      : e.key === "End" ? n - 1
      : -1;
    if (next < 0) return;
    e.preventDefault();
    setFocusIndex(next);
    buttons.current[next]?.focus();
  };

  return (
    <>
      <div
        ref={toolbar}
        role="toolbar"
        aria-label="Formatting"
        onKeyDown={onKeyDown}
        className="flex shrink-0 items-center gap-1"
      >
        {BUTTONS.map((b, i) => {
          const message = flash?.action === b.action ? flash.message : null;
          return (
            <span key={b.action} className="contents">
              {/* The toggles, then the actions. */}
              {i === 3 && <span aria-hidden="true" className="mx-1 h-5 w-px bg-separator-border" />}
              <TooltipTrigger
                delay={300}
                isOpen={message != null || hovered === b.action}
                onOpenChange={(open) => setHovered((h) => (open ? b.action : h === b.action ? null : h))}
              >
                <Focusable>
                  <IconButton
                    ref={(el) => {
                      buttons.current[i] = el;
                    }}
                    size="small"
                    icon={b.icon}
                    aria-label={b.label}
                    aria-pressed={isToggle(b.action) ? pressed[b.action] : undefined}
                    tabIndex={i === focusIndex ? 0 : -1}
                    onFocus={() => setFocusIndex(i)}
                    // Keep the caret and selection in the note while clicking.
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => run(b.action)}
                    className={PRESSED}
                  />
                </Focusable>
                <Tooltip>{message ?? b.label}</Tooltip>
              </TooltipTrigger>
            </span>
          );
        })}
      </div>
      <p role="status" className="sr-only">
        {flash?.message ?? ""}
      </p>
    </>
  );
}
