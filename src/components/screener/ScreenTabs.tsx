"use client";

import { Icon } from "@/components/ui/Icon";
import { Segmented } from "@/components/ui/Segmented";
import { useScreener } from "./ScreenerProvider";

/** Saved-screen tabs and "New screen", beside the page heading. */
export function ScreenTabs() {
  const { state, dispatch } = useScreener();
  return (
    <>
      <Segmented
        label="Saved screens"
        options={state.screens.map((s) => ({ value: s.id, label: s.name }))}
        value={state.activeId}
        onChange={(id) => dispatch({ type: "openScreen", id })}
        buttonClassName="h-9 px-4 text-[14px]"
      />
      <button
        type="button"
        onClick={() => dispatch({ type: "newScreen" })}
        className="glass-chip inline-flex h-11 items-center gap-[6px] rounded-full px-4 text-[14px] text-ink hover:bg-white"
      >
        <Icon name="plus" size={16} strokeWidth={1.8} />
        New screen
      </button>
    </>
  );
}
