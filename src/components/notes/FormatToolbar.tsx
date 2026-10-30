"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Icon } from "@/components/ui/Icon";
import { NOTE_ICONS, RICH_TEXT_SELECTOR } from "./constants";

type Toggle = "bold" | "italic" | "list";
type Action = Toggle | "link" | "chart" | "share";

const BUTTONS: { action: Action; label: string; d: string }[] = [
  { action: "bold", label: "Bold", d: NOTE_ICONS.bold },
  { action: "italic", label: "Italic", d: NOTE_ICONS.italic },
  { action: "list", label: "Bulleted list", d: NOTE_ICONS.list },
  { action: "link", label: "Link", d: NOTE_ICONS.link },
  { action: "chart", label: "Embed chart", d: NOTE_ICONS.chart },
  { action: "share", label: "Share", d: NOTE_ICONS.share },
];

const COMMANDS: Record<Toggle, string> = { bold: "bold", italic: "italic", list: "insertUnorderedList" };
const NONE: Record<Toggle, boolean> = { bold: false, italic: false, list: false };

/** What "Embed chart" inserts: the price since the note as a small figure. */
export type ChartEmbed = {
  /** e.g. "NVDA since Aug 12 · +15.0%" */
  caption: string;
  href: string;
  line: string;
  area: string;
  stroke: string;
  fill: string;
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

function chartHtml(c: ChartEmbed): string {
  return (
    `<figure contenteditable="false" data-embed="chart" class="my-2 flex flex-col gap-1 rounded-[14px] bg-[rgba(17,17,19,0.04)] px-3 py-[10px]">` +
    `<svg viewBox="0 0 300 70" preserveAspectRatio="none" role="img" aria-label="${esc(c.caption)}" class="h-[56px] w-full">` +
    `<path d="${esc(c.area)}" fill="${esc(c.fill)}"></path>` +
    `<path d="${esc(c.line)}" fill="none" stroke="${esc(c.stroke)}" stroke-width="1.8" stroke-linejoin="round" vector-effect="non-scaling-stroke"></path>` +
    `</svg>` +
    `<figcaption class="text-[12px] leading-[1.4] text-muted">${esc(c.caption)} · <a href="${esc(c.href)}">Open chart</a></figcaption>` +
    `</figure><p><br></p>`
  );
}

/**
 * Formatting toolbar of the note editor. Acts on the selection inside the
 * contentEditable body regions (marked with data-rich-text) through
 * document.execCommand, so edits stay on the browser's undo stack.
 */
export function FormatToolbar({ chart }: { chart: ChartEmbed }) {
  const saved = useRef<Range | null>(null);
  const toolbar = useRef<HTMLDivElement>(null);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const timer = useRef<number | undefined>(undefined);
  const [pressed, setPressed] = useState(NONE);
  const [focusIndex, setFocusIndex] = useState(0);
  const [status, setStatus] = useState("");
  /** The editor this toolbar belongs to. */
  const editor = (): Element => toolbar.current?.closest("main") ?? document.body;

  useEffect(() => {
    document.execCommand("defaultParagraphSeparator", false, "p");
    const onSelection = () => {
      const range = bodyRange(toolbar.current?.closest("main") ?? document.body);
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
      setStatus("");
    };
  }, []);

  const flash = (message: string) => {
    setStatus(message);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setStatus(""), 2400);
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
      flash("Link to this note copied");
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
      if (action === "chart") document.execCommand("insertHTML", false, chartHtml(chart));
      else document.execCommand(COMMANDS[action]);
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
    <div className="relative">
      <div
        ref={toolbar}
        role="toolbar"
        aria-label="Formatting"
        onKeyDown={onKeyDown}
        className="flex gap-[2px] rounded-full bg-track p-[3px]"
      >
        {BUTTONS.map((b, i) => {
          const toggle = b.action === "bold" || b.action === "italic" || b.action === "list";
          return (
            <button
              key={b.action}
              ref={(el) => {
                buttons.current[i] = el;
              }}
              type="button"
              aria-label={b.label}
              title={b.label}
              aria-pressed={toggle ? pressed[b.action as Toggle] : undefined}
              tabIndex={i === focusIndex ? 0 : -1}
              onFocus={() => setFocusIndex(i)}
              // Keep the caret and selection in the note while clicking.
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => run(b.action)}
              className="inline-flex h-[34px] w-9 items-center justify-center rounded-full text-ink-2 transition-[background-color,color,box-shadow] duration-150 hover:bg-white/70 hover:text-ink aria-pressed:bg-white aria-pressed:text-ink aria-pressed:shadow-seg"
            >
              <Icon d={b.d} size={17} strokeWidth={1.8} linejoin="round" />
            </button>
          );
        })}
      </div>
      <p
        role="status"
        className={
          status
            ? "absolute top-[calc(100%+6px)] right-0 z-10 rounded-full bg-ink px-3 py-[5px] text-[12px] whitespace-nowrap text-white shadow-[0_8px_20px_-8px_rgba(17,17,19,0.4)]"
            : "sr-only"
        }
      >
        {status}
      </p>
    </div>
  );
}
