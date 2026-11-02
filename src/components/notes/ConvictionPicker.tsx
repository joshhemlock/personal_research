"use client";

import { SegmentedControl, SegmentedControlItem } from "@/components/base/segmented-control/segmented-control";
import { AnimatedValue } from "@/components/motion/AnimatedValue";
import type { Conviction } from "@/lib/mock/notes";
import { CONVICTION, CONVICTIONS } from "./constants";
import { ConvictionDot } from "./ConvictionDot";
import { useNoteDraft } from "./NoteDraft";

/** Low / Medium / High conviction and the position size it implies. */
export function ConvictionPicker({ labelId }: { labelId: string }) {
  const { conviction, setConviction } = useNoteDraft();
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <span id={labelId} className="text-body-regular text-text-secondary">
        Conviction
      </span>
      <SegmentedControl
        aria-labelledby={labelId}
        selectedKeys={[conviction]}
        onSelectionChange={(keys) => {
          const next = [...keys][0] as Conviction | undefined;
          if (next) setConviction(next);
        }}
      >
        {CONVICTIONS.map((c) => (
          <SegmentedControlItem key={c} id={c} className="gap-1.5 px-3">
            <ConvictionDot conviction={c} />
            {c}
          </SegmentedControlItem>
        ))}
      </SegmentedControl>
      <span className="text-body-regular text-text-secondary" aria-live="polite">
        Position size ·{" "}
        <AnimatedValue value={CONVICTION[conviction].size} className="text-text-primary" />
      </span>
    </div>
  );
}
