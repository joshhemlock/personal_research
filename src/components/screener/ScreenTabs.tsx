"use client";

import { RiAddLine } from "@remixicon/react";
import { Button } from "@/components/base/buttons/button";
import { SegmentedControl, SegmentedControlItem } from "@/components/base/segmented-control/segmented-control";
import { useScreener } from "./ScreenerProvider";

/** Saved-screen switcher and "New screen", beside the page heading. */
export function ScreenTabs() {
  const { state, dispatch } = useScreener();
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2.5">
      {/* Scrolls sideways rather than wrapping when screens pile up on a phone. */}
      <div className="max-w-full overflow-x-auto">
        <SegmentedControl
          aria-label="Saved screens"
          selectedKeys={[state.activeId]}
          onSelectionChange={(keys) => {
            const id = [...keys][0];
            if (id !== undefined) dispatch({ type: "openScreen", id: String(id) });
          }}
        >
          {state.screens.map((s) => (
            <SegmentedControlItem key={s.id} id={s.id}>
              {s.name}
            </SegmentedControlItem>
          ))}
        </SegmentedControl>
      </div>
      <Button variant="secondary" size="small" leadingIcon={RiAddLine} onClick={() => dispatch({ type: "newScreen" })}>
        New screen
      </Button>
    </div>
  );
}
