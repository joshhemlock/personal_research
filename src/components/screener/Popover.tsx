"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";

type PopoverProps = {
  /** Visible content of the trigger button. */
  button: ReactNode;
  buttonClassName: string;
  /** Accessible name of an icon-only trigger. */
  buttonLabel?: string;
  /** Accessible name of the panel. */
  panelLabel: string;
  disabled?: boolean;
  /** Wrapper classes (layout of the trigger in its row). */
  className?: string;
  /** Position and size of the panel, e.g. "top-full right-0 mt-2 w-56". */
  panelClassName: string;
  children: (close: () => void) => ReactNode;
};

/**
 * A button that toggles a small floating panel (disclosure pattern). Closes on
 * Escape, on a click outside and when the page is hidden by a navigation.
 */
export function Popover({
  button,
  buttonClassName,
  buttonLabel,
  panelLabel,
  disabled,
  className = "",
  panelClassName,
  children,
}: PopoverProps) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Next keeps visited pages alive (hidden) — don't come back to an open panel.
  useLayoutEffect(() => () => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        aria-label={buttonLabel}
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={buttonClassName}
      >
        {button}
      </button>
      {open && (
        <div
          id={id}
          role="group"
          aria-label={panelLabel}
          className={`absolute z-20 rounded-[16px] border border-[rgba(17,17,19,0.08)] bg-white p-[6px] text-[14px] text-ink shadow-[0_1px_2px_rgba(17,17,19,0.04),0_18px_40px_-16px_rgba(17,17,19,0.28)] ${panelClassName}`}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}
