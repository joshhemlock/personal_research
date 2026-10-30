"use client";

import { Segmented, type SegmentOption } from "@/components/ui/Segmented";
import type { Conviction } from "@/lib/mock/notes";
import { CONVICTION, CONVICTIONS } from "./constants";
import { useNoteDraft } from "./NoteDraft";

const OPTIONS: SegmentOption<Conviction>[] = CONVICTIONS.map((c) => ({
  value: c,
  label: (
    <>
      <span aria-hidden="true" className="size-[7px] rounded-full" style={{ background: CONVICTION[c].dot }} />
      {c}
    </>
  ),
}));

/** Low / Medium / High conviction and the position size it implies. */
export function ConvictionPicker() {
  const { conviction, setConviction } = useNoteDraft();
  return (
    <div className="flex flex-wrap items-center gap-x-[14px] gap-y-[10px]">
      <span className="text-[14px] text-ink-3">Conviction</span>
      <Segmented
        label="Conviction"
        options={OPTIONS}
        value={conviction}
        onChange={setConviction}
        buttonClassName="inline-flex h-[34px] items-center gap-[6px] px-4 text-[14px]"
      />
      <span className="text-[14px] text-ink-3" aria-live="polite">
        Position size · <span className="text-ink">{CONVICTION[conviction].size}</span>
      </span>
    </div>
  );
}
