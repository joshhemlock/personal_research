# Compound

A personal stock-research web app for one user. "Compound" is a placeholder name — rename it in `src/lib/brand.ts`.

The design handoff lives in [`design/`](design/): the brief ([`design/DESIGN_BRIEF.md`](design/DESIGN_BRIEF.md)), target screenshots at 1512 × 982, static HTML snapshots and the original design files.

**Status:** all five screens are built, matched to the design at 1512 × 982 (sample mode, within 0.2% of pixels) and reflow below that width. Every screen runs on live market data from TradingView (see [Data](#data)), and ⌘K finds any US ticker. Persistence, login and deploy (steps 5–6) are not started, so your own data (watchlists, alerts, notes, saved screens, tasks) is still sample data.

## Getting started

```bash
npm install
npm run dev
npm run lint
npx tsc --noEmit
```

Then open http://localhost:3000. Requires Node 22+.

## Data

Market data comes from TradingView by default, fetched on the server only (`src/lib/data`):

- `market.ts`: the API the screens use: `resolveSymbols`, `getQuotes`, `getDailyBars`, `getFundamentals`, `searchListings`. It's provider-agnostic, so another provider only has to implement these.
- `tradingview/`: TradingView's screener endpoint (quotes, fundamentals, screens), its chart WebSocket (daily candles) and its symbol search.
- Caching uses `"use cache"` + `cacheLife`: quotes refresh about every minute, price history and fundamentals daily.

TradingView has no public API: these are the endpoints its own site uses. They are undocumented and can change or be blocked at any time, and automated use is against TradingView's terms. Some things the designs show aren't available there (e.g. revenue by segment, past EPS estimates, the implied earnings move); those parts of the UI say so instead of showing made-up numbers.

**Sample mode.** `DATA_SOURCE=sample npm run dev` uses the design's made-up data instead, so screens can be compared pixel-for-pixel with `design/screens` (see below). All sample numbers are fictional.

**Behind an HTTPS proxy** (e.g. a locked-down dev container), start Node with `NODE_USE_ENV_PROXY=1` so server-side requests use `HTTPS_PROXY`.

Your own data (watchlists and groups, alerts, open ticker tabs, saved screens, research tasks, notes) still comes from the sample modules until persistence is added.

## Screens

| Screen | Route | Target |
|---|---|---|
| Overview | `/` | `design/screens/01-overview.png` |
| Stock chart | `/stock/[symbol]` (e.g. `/stock/NVDA`) | `design/screens/02-stock-chart.png` |
| Financials | `/stock/[symbol]/financials` | `design/screens/03-stock-financials.png` |
| Screener | `/screener` | `design/screens/04-screener.png` |
| Research notes | `/notes`, `/notes/[id]` | `design/screens/05-research-notes.png` |

Every screen shares the shell: top bar (market status, search pill that opens the ⌘K / Ctrl+K command palette, index readouts, account pill) and the icon rail on the right.

## Stack

- Next.js 16 (App Router, Cache Components) with TypeScript
- Tailwind CSS 4 — theme tokens in `src/app/globals.css`
- TradingView Lightweight Charts for the main price chart; small charts are plain SVG
- Outfit via `next/font`

## Layout of the code

```
src/
  app/                    routes (one folder per screen)
  components/
    shell/                AppShell, TopBar, Rail, SearchTrigger, CommandPalette
    ui/                   Icon, Segmented, ChangePill, TickerDot
    overview/ chart/ financials/ screener/ notes/   one folder per screen
  lib/
    brand.ts              product name and tagline
    format.ts             number formatting (true minus sign), up/down tones
    data/                 market data layer (TradingView, caching, per-screen builders)
    mock/                 typed sample data, one module per screen
      gen.ts              seeded RNG / random walk / path helpers ported from the design files
      market.ts           sample securities, index readouts, "as of" time
```

## Theme

Colors from the brief are Tailwind tokens: `text-ink`, `text-ink-2`, `text-ink-3`, `text-muted`, `bg-up-pill`, `text-down-text`, `bg-purple`, `bg-amber`, `bg-alert` and so on.

The frosted-glass recipe is three utilities — `glass` (panels), `glass-tile` (small tiles) and `glass-chip` (buttons and rail icons). They all read one variable, `--glass-alpha` (0.72), in `globals.css`.

## Checking screens against the design

With a dev server running in sample mode (`DATA_SOURCE=sample npm run dev`):

```bash
node scripts/visual-check.mjs overview          # or chart | financials | screener | notes | all
node scripts/visual-check.mjs chart --clip 30,200,960,520 --zoom 2
```

This writes to `.visual/` (git-ignored): `<screen>.app.png` (the build at 1512 × 982), `<screen>.diff.png` (pixel diff) and, with `--clip`, `<screen>.clip.png` (target crop above, build crop below). `--width 1400 --full` screenshots another width without diffing; `--base http://localhost:3001` points it at another server. It uses the Playwright installed on the machine (`npm i -g playwright` if it's missing).

To run a live server next to a sample one, give the second its own build folder: `NEXT_DIST_DIR=.next-live npx next dev -p 3001`.

## Next steps (from the brief)

4. **Live data:** done, via TradingView. If it becomes unreliable or blocks requests, implement the functions in `src/lib/data/market.ts` (and the per-screen builders) against a paid provider.
5. **Persistence** for watchlists, open ticker tabs, alerts, saved screens, research-queue tasks and notes.
6. **Single-user login**, then deploy (e.g. Vercel with env vars for API keys and the database URL).
