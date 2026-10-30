# Compound — build brief

A personal stock research web app, for one user, reachable online. Five screens were designed at **1512 × 982** (the default viewport of a 14-inch MacBook Pro). Match them closely.

"Compound" is a placeholder product name. Keep it in one constant so it's easy to rename.

## What's in this folder

| Folder | What it is | How to use it |
|---|---|---|
| `screens/*.png` | Each screen rendered at 1512 × 982 | The visual target. Compare your build against these at the same viewport. |
| `static/*.html` | Static HTML/CSS snapshot of each screen (default state, sample data, no interactivity) | The exact markup, spacing, colors and type. Open in a browser. Links between screens work. |
| `source/*.dc.html` | The original design files | Read the `<script>` block for the sample data, how charts are generated and which controls are interactive. Ignore design-tool syntax: `support.js`, `<x-dc>`, `<helmet>`, `<sc-for>`, `<sc-if>`, `{{…}}`. |

**All numbers in the designs are made-up sample data.** Never ship them as real figures.

## Screens and routes

1. **Overview** `/` — greeting line, five market index tiles with sparklines, watchlist table (filter tabs All/Tech/Semis/Consumer; columns: symbol, last, today %, 1-month sparkline, 52-week range bar, market cap, forward P/E, next earnings), sector performance heat tiles (1D/1W/1M toggle), watchlist movers (diverging bars), upcoming earnings, research queue (checkable tasks).
2. **Stock chart** `/stock/[symbol]` — the hero screen.
   - Ticker chip, "Add note" and "Watching" buttons, OHLC readout.
   - Time range (1M 3M 6M YTD 1Y 2Y), candle/line toggle, Compare, Indicators.
   - Large candlestick chart drawn directly on the background (no card) with:
     - a dotted SMA 50 and two rebased comparison lines (sector index in gray, S&P 500 in purple), with an inline legend and per-series hide buttons;
     - black price tags on the right axis, plus a red alert line and tag;
     - a crosshair with a value pill;
     - a floating frosted-glass drawing toolbar (pointer, crosshair, trend line, text, measure, target).
   - Below the chart: series chips, volume bars, a timeline with month labels, earnings/dividend/alert markers and a date pill, then browser-style tabs for open tickers.
   - Right column: watchlist (pinned rows plus collapsible groups), alerts (Alerts / History / System tabs), and a ticker card with price and the user's fair value.
3. **Financials** `/stock/[symbol]/financials` — KPI tiles with mini bar charts, revenue and net income grouped bars, margins chart, a statements table (income statement / balance sheet / cash flow; quarterly / annual; TTM and YoY), valuation vs peers (Fwd P/E / EV/Sales / P/FCF with a peer-median line), EPS vs estimate dot chart, revenue mix, and a next-report card.
4. **Screener** `/screener` — filters panel (universe, market-cap and sector chips, numeric thresholds, add filter, save screen), saved-screen tabs, median summary tiles, a sortable results table with watchlist stars, and pagination.
5. **Research notes** `/notes`, `/notes/[id]` — notes list (search, type filter, conviction dot), a rich-text note editor (title, ticker/tag chips, Low/Medium/High conviction, bear/base/bull fair-value scenarios with probabilities and a weighted value, thesis, key drivers, risks, "what would change my mind", catalysts), and a context column (price since the note was written, then-vs-now metrics, checklist, linked items).

**Shared shell, on every screen:**
- Top bar: logo and name, market status, a center search pill that opens a ⌘K command palette, two index readouts, and a dark account pill.
- Icon rail on the far right: notifications, the five screens, then settings, ask, library, formulas and favorites.

## Visual system

- **Font:** Outfit (Google Fonts), weights 300/400/500/600, tabular numerals. Headings are 400 weight at 19–30px. Body text is 14–15px.
- **Page:** background `#E7E7EA`, 14px outer padding. The app shell is `#F7F7F8`, with a 1px white border, a 32px radius and a soft drop shadow (`0 40px 80px -40px rgba(17,17,19,.28)`).
- **Glass panel recipe:**
  - `background: rgba(255,255,255,0.72)`
  - `backdrop-filter: blur(24px) saturate(1.4)`
  - `border: 1px solid rgba(255,255,255,.95)`
  - radius 24px
  - `box-shadow: 0 1px 2px rgba(17,17,19,.04), 0 14px 34px -18px rgba(17,17,19,.16)`
  - Make the 0.72 opacity a single CSS variable.
- **Segmented controls:** track `rgba(17,17,19,.05)`; the active segment is white with `0 1px 3px rgba(17,17,19,.1)`. Primary actions are solid `#111113` pills.

**Colors**

| Use | Value |
|---|---|
| Ink (main text) | `#111113` |
| Secondary text | `#3F3F46`, `#55555C` |
| Muted text | `#6E6E76` (keep ≥ 4.5:1 contrast) |
| Up — candles and bars | `#4DB07F` |
| Up — text | `#1A7F4E` |
| Up — pill | background `#DDF3E6`, text `#1A6B45` |
| Down — candles and bars | `#EA5B52` |
| Down — text | `#C2362D` |
| Down — pill | background `#FCE4E2`, text `#A82C24` |
| Solid green button | `#2A855A` |
| Comparison line | purple `#A033E8` |
| Second accent | blue `#3B6FE0` |
| Earnings marker | amber `#F5A524` |
| Alert | red `#D93C42` |

- **Chart chrome:**
  - gridlines `rgba(17,17,19,.05)`;
  - dashed `#111113` crosshair;
  - two-part black axis tags (symbol on `#3A3A40`, value on `#111113`).
- **Accessibility:** use real buttons, links and inputs. Icon-only controls need `aria-label`. Toggles use `aria-pressed`. Keep visible focus rings.
- **Responsive:** optimise for 1512 × 982. It should still look right from 1280 to 1920 wide (let the chart grow). On narrow screens, columns stack and the rail becomes a row.

## Data

Build the UI first against typed mock data shaped like the sample data in `source/` files. Then swap in live data behind a provider-agnostic data layer, e.g. `getQuote`, `getDailyBars`, `getOverview`, `getStatements`, `getEarnings`, `getNews`, `screen(filters)`.

- Call providers **server-side only**. Keep API keys in environment variables and cache responses: quotes ~1 minute, daily bars and fundamentals ~24 hours.
- The owner has an **Alpha Vantage** key on the free tier, which allows **25 requests per day at 1 request per second**. The company-overview endpoint returned "premium only". Design the cache so normal daily use stays inside those limits, or make it easy to plug in a different or paid provider later.
- A screener needs a fundamentals dataset across many tickers. Plan for a scheduled job (e.g. nightly) that snapshots the needed metrics into the database rather than querying live.

## User data to persist (single user)

- **Watchlists:** groups and pinned symbols.
- **Open ticker tabs.**
- **Alerts:** type, symbol, condition, status and history.
- **Saved screens:** filters and sort.
- **Research queue tasks.**
- **Notes:** ticker, type, title, rich-text body sections, conviction, scenarios (value and probability), catalysts (date and title), checklist items, links to other notes, screens or filings, and created/updated timestamps with the price when the note was started.

## Suggested stack

Use something else if you have a good reason.

- **App:** Next.js (App Router) with TypeScript and Tailwind CSS. Put the colors and glass recipe above into theme tokens.
- **Charts:** TradingView Lightweight Charts (open source) for the candlestick, line and volume series, styled to match. Render the axis tags, crosshair pill, legend, drawing toolbar and timeline markers as HTML overlays where the library can't match the design. Small charts (sparklines, bars, margins) can be plain SVG.
- **Storage and auth:** Postgres (Supabase or Neon) or SQLite with Drizzle/Prisma. Protect the whole app with a simple single-user login, since it will be online.
- **Hosting:** deploy on Vercel, with environment variables for API keys and the database URL.

## Build order

1. Scaffold, theme tokens, app shell (top bar, right rail), routes.
2. All five screens with mock data, matched to `screens/*.png` at 1512 × 982. Include the interactions the designs show: tabs, toggles, sort, stars, checkboxes and conviction.
3. Check every screen against its PNG at 1512 × 982 and fix the differences.
4. Data layer with live quotes, history and fundamentals, plus caching.
5. Persistence for watchlists, notes, alerts, screens and the queue.
6. Login, then deploy.
