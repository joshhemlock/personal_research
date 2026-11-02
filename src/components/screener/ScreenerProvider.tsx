"use client";

import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type RefObject,
} from "react";
import {
  CAP_BUCKETS,
  DEFAULT_WATCHED,
  EMPTY_FILTERS,
  SAVED_SCREENS,
  type CapBucket,
  type LiveScreener,
  type MetricKey,
  SECTORS,
  type SavedScreen,
  type ScreenFilters,
  type ScreenPage,
  type ScreenQuery,
  type ScreenRow,
  type ScreenSort,
  type ScreenSummary,
  type Sector,
  type SortKey,
  type UniverseId,
} from "@/lib/mock/screener";
import { transitionRows } from "@/components/motion/row-transition";
import { PAGE_SIZE, defaultDir, filtersKey, median, queryKey, runScreen, toQuery, type ColumnKey } from "./screen";

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
  /** Threshold row just added with "Add filter"; its input takes focus. */
  lastAdded: MetricKey | null;
  /**
   * Bumped whenever the filters are replaced wholesale (another screen, a new
   * one, Reset): the threshold fields keep their own text while typing and
   * start over from the new values.
   */
  formVersion: number;
};

export type ScreenerAction =
  | { type: "openScreen"; id: string }
  | { type: "newScreen" }
  | { type: "saveScreen" }
  | { type: "universe"; value: UniverseId }
  | { type: "caps"; value: CapBucket[] }
  | { type: "sectors"; value: Sector[] }
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
  lastAdded: null,
  formVersion: 0,
};

function toggle<T>(list: readonly T[], item: T): T[] {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
}

function withFilters(state: ScreenerState, filters: ScreenFilters): ScreenerState {
  return { ...state, filters, page: 0 };
}

function reducer(state: ScreenerState, action: ScreenerAction): ScreenerState {
  const next = reduce(state, action);
  // Focus only follows the action that added the row.
  return action.type === "addThreshold" || next.lastAdded === null ? next : { ...next, lastAdded: null };
}

function reduce(state: ScreenerState, action: ScreenerAction): ScreenerState {
  const f = state.filters;
  switch (action.type) {
    case "openScreen": {
      const s = state.screens.find((x) => x.id === action.id);
      return s
        ? { ...state, activeId: s.id, filters: s.filters, sort: s.sort, page: 0, formVersion: state.formVersion + 1 }
        : state;
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
        formVersion: state.formVersion + 1,
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
    case "caps":
      return withFilters(state, { ...f, caps: CAP_BUCKETS.filter((c) => action.value.includes(c)) });
    case "sectors":
      return withFilters(state, { ...f, sectors: SECTORS.filter((s) => action.value.includes(s)) });
    case "threshold":
      return withFilters(state, {
        ...f,
        thresholds: f.thresholds.map((t) => (t.key === action.key ? { ...t, value: action.value } : t)),
      });
    case "addThreshold":
      if (f.thresholds.some((t) => t.key === action.key)) return state;
      return {
        ...withFilters(state, { ...f, thresholds: [...f.thresholds, { key: action.key, value: "" }] }),
        lastAdded: action.key,
      };
    case "removeThreshold":
      return withFilters(state, { ...f, thresholds: f.thresholds.filter((t) => t.key !== action.key) });
    case "reset":
      return { ...withFilters(state, EMPTY_FILTERS), formVersion: state.formVersion + 1 };
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

/** Sample data: whether an action changes the rows on screen (and so runs as a view transition). */
function changesRows(action: ScreenerAction, watchlistUniverse: boolean): boolean {
  switch (action.type) {
    case "saveScreen":
    case "addThreshold":
    case "toggleColumn":
      return false;
    case "toggleWatch":
      // Starring only changes the rows when the universe is the watchlist.
      return watchlistUniverse;
    default:
      return true;
  }
}

export type ScreenerResult = {
  /** Number of matches. */
  total: number;
  /** Rows of the current page. */
  rows: ScreenRow[];
  page: number;
  pageCount: number;
  /** 0-based index of the first row on the page. */
  offset: number;
  summary: ScreenSummary;
  /** Live: the medians cover only this many of the largest matches; null when they cover all. */
  medianBase: number | null;
  /** Live: results for the current filters are on their way (the rows shown are older). */
  loading: boolean;
  /** Live: the last request for the current filters failed. */
  failed: boolean;
};

type ScreenerContextValue = {
  state: ScreenerState;
  /**
   * Applies an edit. With sample data the rows follow at once, so edits that
   * change them run inside a view transition (transitionRows) and the rows
   * glide into place. With live data the rows change when the server answers,
   * and that update is the transition.
   */
  dispatch: Dispatch<ScreenerAction>;
  /** The results <table>, whose rows the view transitions animate. */
  tableRef: RefObject<HTMLTableElement | null>;
  result: ScreenerResult;
  /** Live-data setup; null with sample data. */
  live: LiveScreener | null;
  /** Every match (live: up to live.exportCap), for "Export results". */
  exportMatches: () => Promise<ScreenRow[]>;
  /** Live: ask again after a failed request. */
  retry: () => void;
};

const ScreenerContext = createContext<ScreenerContextValue | null>(null);

type WatchContextValue = { watched: readonly string[]; toggle: (symbol: string) => void };

/**
 * The starred symbols on their own, for the table's star buttons: a star
 * toggle then re-renders the stars, not the table around them.
 */
const WatchContext = createContext<WatchContextValue | null>(null);

export function useWatch(): WatchContextValue {
  const ctx = use(WatchContext);
  if (!ctx) throw new Error("useWatch must be used inside <ScreenerProvider>");
  return ctx;
}

const NO_WATCHED: string[] = [];

export function useScreener(): ScreenerContextValue {
  const ctx = use(ScreenerContext);
  if (!ctx) throw new Error("useScreener must be used inside <ScreenerProvider>");
  return ctx;
}

const NO_SUMMARY: ScreenSummary = { count: 0, fwdPe: null, revGrowth: null, grossMargin: null, roic: null };

const NO_RESULT: ScreenerResult = {
  total: 0,
  rows: [],
  page: 0,
  pageCount: 1,
  offset: 0,
  summary: NO_SUMMARY,
  medianBase: null,
  loading: false,
  failed: false,
};

/** Debounce for filter edits (chips, thresholds); paging and sorting ask at once. */
const EDIT_DELAY_MS = 250;

function resultsUrl(key: string, exporting = false): string {
  return `/screener/results?q=${encodeURIComponent(key)}${exporting ? "&export=1" : ""}`;
}

/** Sample data: filter, sort and page the sample universe here. */
function useSampleResult(state: ScreenerState, enabled: boolean): { result: ScreenerResult; matches: ScreenRow[] } | null {
  const { filters, sort } = state;
  // Stars only change the matches when the universe is the watchlist; elsewhere
  // a star toggle leaves the rows (and the table) as they are.
  const watched = filters.universe === "watchlist" ? state.watched : NO_WATCHED;
  const matches = useMemo(
    () => (enabled ? runScreen(filters, sort, watched) : null),
    [enabled, filters, sort, watched],
  );
  return useMemo(() => {
    if (!matches) return null;
    const pageCount = Math.max(1, Math.ceil(matches.length / PAGE_SIZE));
    // Unstarring a row while the universe is "My watchlist" can empty the last page.
    const page = Math.min(state.page, pageCount - 1);
    const offset = page * PAGE_SIZE;
    return {
      matches,
      result: {
        total: matches.length,
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
        medianBase: null,
        loading: false,
        failed: false,
      },
    };
  }, [matches, state.page]);
}

/** Live data: the server runs the screen on TradingView; ask it whenever the screen changes. */
function useLiveResult(
  state: ScreenerState,
  dispatch: Dispatch<ScreenerAction>,
  live: LiveScreener | null,
  tableRef: RefObject<HTMLTableElement | null>,
) {
  const { filters, sort, page, watched } = state;
  const key = useMemo(() => queryKey(toQuery(filters, sort, page, watched)), [filters, sort, page, watched]);
  const [data, setData] = useState<ScreenPage | null>(live?.initial ?? null);
  const [failedKey, setFailedKey] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  // Filters of the last request, to tell an edit (debounced) from paging or sorting.
  const askedFilters = useRef<string | null>(null);
  const shownKey = data?.key ?? null;

  useEffect(() => {
    if (!live || shownKey === key) return;
    const query = JSON.parse(key) as ScreenQuery;
    const controller = new AbortController();
    const asked = askedFilters.current ?? (shownKey ? filtersKey(JSON.parse(shownKey)) : null);
    const timer = setTimeout(
      async () => {
        askedFilters.current = filtersKey(query);
        setFailedKey(null);
        try {
          const res = await fetch(resultsUrl(key), { signal: controller.signal });
          if (!res.ok) throw new Error(`Screener results: ${res.status}`);
          const next = (await res.json()) as ScreenPage;
          // The rows glide from the previous answer to this one.
          transitionRows(tableRef.current, () => {
            setData(next);
            // Unstarring rows of "My watchlist" (or a smaller result) can leave the page empty.
            if (next.total > 0 && next.rows.length === 0 && query.page > 0) {
              dispatch({ type: "page", page: Math.ceil(next.total / PAGE_SIZE) - 1 });
            }
          });
        } catch {
          if (!controller.signal.aborted) setFailedKey(key);
        }
      },
      asked === filtersKey(query) ? 0 : EDIT_DELAY_MS,
    );
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
    // `attempt` re-runs a failed request.
  }, [live, key, shownKey, attempt, dispatch, tableRef]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  const result = useMemo<ScreenerResult | null>(() => {
    if (!live) return null;
    const total = data?.total ?? 0;
    const offset = data?.offset ?? 0;
    return {
      total,
      rows: data?.rows ?? [],
      page: Math.floor(offset / PAGE_SIZE),
      pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
      offset,
      summary: data?.summary ?? NO_SUMMARY,
      medianBase: data?.medianBase ?? null,
      loading: shownKey !== key && failedKey !== key,
      failed: failedKey === key,
    };
  }, [live, data, shownKey, key, failedKey]);

  return { result, key, retry };
}

/** Holds the screen being edited and its results for every Screener widget. */
export function ScreenerProvider({ children, live = null }: { children: ReactNode; live?: LiveScreener | null }) {
  const [state, rawDispatch] = useReducer(reducer, initialState);
  const tableRef = useRef<HTMLTableElement>(null);
  const sample = useSampleResult(state, live === null);
  const fromServer = useLiveResult(state, rawDispatch, live, tableRef);
  const watchlistUniverse = state.filters.universe === "watchlist";

  const dispatch = useCallback(
    (action: ScreenerAction) => {
      if (live === null && changesRows(action, watchlistUniverse)) {
        transitionRows(tableRef.current, () => rawDispatch(action));
      } else rawDispatch(action);
    },
    [live, watchlistUniverse],
  );
  const result = sample?.result ?? fromServer.result ?? NO_RESULT;
  const sampleMatches = sample?.matches;
  const liveKey = fromServer.key;

  const exportMatches = useCallback(async (): Promise<ScreenRow[]> => {
    if (sampleMatches) return sampleMatches;
    const res = await fetch(resultsUrl(liveKey, true));
    if (!res.ok) throw new Error(`Screener export: ${res.status}`);
    return ((await res.json()) as { rows: ScreenRow[] }).rows;
  }, [sampleMatches, liveKey]);

  const value = useMemo(
    () => ({ state, dispatch, tableRef, result, live, exportMatches, retry: fromServer.retry }),
    [state, dispatch, result, live, exportMatches, fromServer.retry],
  );
  const watch = useMemo(
    () => ({ watched: state.watched, toggle: (symbol: string) => dispatch({ type: "toggleWatch", symbol }) }),
    [state.watched, dispatch],
  );
  return (
    <ScreenerContext value={value}>
      <WatchContext value={watch}>{children}</WatchContext>
    </ScreenerContext>
  );
}
