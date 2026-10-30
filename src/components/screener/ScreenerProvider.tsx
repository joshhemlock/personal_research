"use client";

import { createContext, use, useMemo, useReducer, type Dispatch, type ReactNode } from "react";
import {
  DEFAULT_WATCHED,
  EMPTY_FILTERS,
  SAVED_SCREENS,
  type CapBucket,
  type MetricKey,
  type SavedScreen,
  type ScreenFilters,
  type ScreenSort,
  type ScreenStock,
  type Sector,
  type SortKey,
  type UniverseId,
} from "@/lib/mock/screener";
import { defaultDir, median, runScreen, type ColumnKey } from "./screen";

export const PAGE_SIZE = 12;

export type ScreenerState = {
  screens: SavedScreen[];
  activeId: string;
  /** Working copy of the open screen's filters (unsaved edits live here). */
  filters: ScreenFilters;
  sort: ScreenSort;
  page: number;
  watched: string[];
  hiddenColumns: ColumnKey[];
  /** How many "Untitled screen"s were created, for naming the next one. */
  created: number;
};

export type ScreenerAction =
  | { type: "openScreen"; id: string }
  | { type: "newScreen" }
  | { type: "saveScreen" }
  | { type: "universe"; value: UniverseId }
  | { type: "toggleCap"; value: CapBucket }
  | { type: "toggleSector"; value: Sector }
  | { type: "threshold"; key: MetricKey; value: string }
  | { type: "addThreshold"; key: MetricKey }
  | { type: "removeThreshold"; key: MetricKey }
  | { type: "reset" }
  /** From the "Sort by" select: the column's natural direction. */
  | { type: "sortBy"; key: SortKey }
  /** From a column header: same column flips the direction. */
  | { type: "sortColumn"; key: SortKey }
  | { type: "page"; page: number }
  | { type: "toggleWatch"; symbol: string }
  | { type: "toggleColumn"; key: ColumnKey };

const initialState: ScreenerState = {
  screens: SAVED_SCREENS,
  activeId: SAVED_SCREENS[0].id,
  filters: SAVED_SCREENS[0].filters,
  sort: SAVED_SCREENS[0].sort,
  page: 0,
  watched: DEFAULT_WATCHED,
  hiddenColumns: [],
  created: 0,
};

function toggle<T>(list: readonly T[], item: T): T[] {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
}

function withFilters(state: ScreenerState, filters: ScreenFilters): ScreenerState {
  return { ...state, filters, page: 0 };
}

function reducer(state: ScreenerState, action: ScreenerAction): ScreenerState {
  const f = state.filters;
  switch (action.type) {
    case "openScreen": {
      const s = state.screens.find((x) => x.id === action.id);
      return s ? { ...state, activeId: s.id, filters: s.filters, sort: s.sort, page: 0 } : state;
    }
    case "newScreen": {
      const n = state.created + 1;
      const screen: SavedScreen = {
        id: `untitled-${n}`,
        name: n === 1 ? "Untitled screen" : `Untitled screen ${n}`,
        filters: EMPTY_FILTERS,
        sort: { key: "roic", dir: "desc" },
      };
      return {
        ...state,
        screens: [...state.screens, screen],
        activeId: screen.id,
        filters: screen.filters,
        sort: screen.sort,
        page: 0,
        created: n,
      };
    }
    case "saveScreen":
      return {
        ...state,
        screens: state.screens.map((s) =>
          s.id === state.activeId ? { ...s, filters: state.filters, sort: state.sort } : s,
        ),
      };
    case "universe":
      return withFilters(state, { ...f, universe: action.value });
    case "toggleCap":
      return withFilters(state, { ...f, caps: toggle(f.caps, action.value) });
    case "toggleSector":
      return withFilters(state, { ...f, sectors: toggle(f.sectors, action.value) });
    case "threshold":
      return withFilters(state, {
        ...f,
        thresholds: f.thresholds.map((t) => (t.key === action.key ? { ...t, value: action.value } : t)),
      });
    case "addThreshold":
      if (f.thresholds.some((t) => t.key === action.key)) return state;
      return withFilters(state, { ...f, thresholds: [...f.thresholds, { key: action.key, value: "" }] });
    case "removeThreshold":
      return withFilters(state, { ...f, thresholds: f.thresholds.filter((t) => t.key !== action.key) });
    case "reset":
      return withFilters(state, EMPTY_FILTERS);
    case "sortBy":
      return { ...state, sort: { key: action.key, dir: defaultDir(action.key) }, page: 0 };
    case "sortColumn": {
      const same = state.sort.key === action.key;
      const dir = same ? (state.sort.dir === "asc" ? "desc" : "asc") : defaultDir(action.key);
      return { ...state, sort: { key: action.key, dir }, page: 0 };
    }
    case "page":
      return { ...state, page: action.page };
    case "toggleWatch":
      return { ...state, watched: toggle(state.watched, action.symbol) };
    case "toggleColumn":
      return { ...state, hiddenColumns: toggle(state.hiddenColumns, action.key) };
  }
}

export type ScreenerSummary = {
  count: number;
  fwdPe: number | null;
  revGrowth: number | null;
  grossMargin: number | null;
  roic: number | null;
};

export type ScreenerResult = {
  matches: ScreenStock[];
  /** Rows of the current page. */
  rows: ScreenStock[];
  page: number;
  pageCount: number;
  /** 0-based index of the first row on the page. */
  offset: number;
  summary: ScreenerSummary;
};

type ScreenerContextValue = { state: ScreenerState; dispatch: Dispatch<ScreenerAction>; result: ScreenerResult };

const ScreenerContext = createContext<ScreenerContextValue | null>(null);

export function useScreener(): ScreenerContextValue {
  const ctx = use(ScreenerContext);
  if (!ctx) throw new Error("useScreener must be used inside <ScreenerProvider>");
  return ctx;
}

/** Holds the screen being edited and its results for every Screener widget. */
export function ScreenerProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { filters, sort, watched } = state;

  const matches = useMemo(() => runScreen(filters, sort, watched), [filters, sort, watched]);

  const result = useMemo<ScreenerResult>(() => {
    const pageCount = Math.max(1, Math.ceil(matches.length / PAGE_SIZE));
    // Unstarring a row while the universe is "My watchlist" can empty the last page.
    const page = Math.min(state.page, pageCount - 1);
    const offset = page * PAGE_SIZE;
    return {
      matches,
      rows: matches.slice(offset, offset + PAGE_SIZE),
      page,
      pageCount,
      offset,
      summary: {
        count: matches.length,
        fwdPe: median(matches.map((s) => s.fwdPe)),
        revGrowth: median(matches.map((s) => s.revGrowth)),
        grossMargin: median(matches.map((s) => s.grossMargin)),
        roic: median(matches.map((s) => s.roic)),
      },
    };
  }, [matches, state.page]);

  const value = useMemo(() => ({ state, dispatch, result }), [state, result]);
  return <ScreenerContext value={value}>{children}</ScreenerContext>;
}
