"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";

type PopoverProps = {
  /** Button text, also its accessible name. */
  label: string;
  icon: string;
  /** Show only the icon (the label stays as the accessible name). */
  iconOnly?: boolean;
  /** Hide the label below this container width (the toolbar's container query). */
  labelClassName?: string;
  buttonClassName: string;
  iconSize?: number;
  /** Which edge of the button the panel lines up with. */
  align?: "left" | "right";
  children: ReactNode;
};

/**
 * A toolbar button that opens a small frosted panel of options. Closes on
 * Escape (focus returns to the button), outside clicks and when focus leaves.
 */
export function Popover({
  label,
  icon,
  iconOnly = false,
  labelClassName = "",
  buttonClassName,
  iconSize = 18,
  align = "left",
  children,
}: PopoverProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  // Next keeps visited pages alive (hidden); don't come back to an open menu.
  useLayoutEffect(() => () => setOpen(false), []);

  return (
    <div
      ref={rootRef}
      className="relative"
      onBlur={(e) => {
        if (!rootRef.current?.contains(e.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={iconOnly ? label : undefined}
        onClick={() => setOpen((o) => !o)}
        className={buttonClassName}
      >
        <Icon d={icon} size={iconSize} />
        {iconOnly ? null : <span className={labelClassName}>{label}</span>}
      </button>
      {open ? (
        <div
          id={panelId}
          role="group"
          aria-label={label}
          className={`glass absolute top-full z-40 mt-2 flex min-w-[232px] flex-col rounded-[18px] p-1.5 text-[14px] text-ink ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

type CheckRowProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Colored dot before the label. */
  dot?: string;
  children: ReactNode;
};

/** A checkbox row inside a popover panel. */
export function CheckRow({ checked, onChange, dot, children }: CheckRowProps) {
  return (
    <label className="flex min-h-10 cursor-pointer items-center gap-3 rounded-[12px] px-3 hover:bg-[rgba(17,17,19,0.04)]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4 flex-none cursor-pointer accent-ink"
      />
      {dot ? <span aria-hidden="true" className="size-[7px] flex-none rounded-full" style={{ background: dot }} /> : null}
      <span className="flex min-w-0 flex-1 items-baseline gap-1.5">{children}</span>
    </label>
  );
}
