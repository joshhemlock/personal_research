# Compound

A personal stock-research web app for one user. "Compound" is a placeholder name — rename it in `src/lib/brand.ts`.

The design handoff lives in [`design/`](design/): the brief ([`design/DESIGN_BRIEF.md`](design/DESIGN_BRIEF.md)), target screenshots at 1512 × 982, static HTML snapshots and the original design files.

**Status:** build steps 1–3 of the brief (scaffold, theme and shell; the five screens with their interactions; visual comparison against the targets) are in progress. Every screen runs on typed **sample data**. All numbers are made up; none of them are real market figures. Steps 4–6 (live data, persistence, login and deploy) are not started.

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
npm run lint
npx tsc --noEmit
```

Requires Node 20+.

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
    mock/                 typed sample data, one module per screen
      gen.ts              seeded RNG / random walk / path helpers ported from the design files
      market.ts           sample securities, index readouts, "as of" time
```

## Theme

Colors from the brief are Tailwind tokens: `text-ink`, `text-ink-2`, `text-ink-3`, `text-muted`, `bg-up-pill`, `text-down-text`, `bg-purple`, `bg-amber`, `bg-alert` and so on.

The frosted-glass recipe is three utilities — `glass` (panels), `glass-tile` (small tiles) and `glass-chip` (buttons and rail icons). They all read one variable, `--glass-alpha` (0.72), in `globals.css`.

## Checking screens against the design

With the dev server running:

```bash
node scripts/visual-check.mjs overview          # or chart | financials | screener | notes | all
node scripts/visual-check.mjs chart --clip 30,200,960,520 --zoom 2
```

This writes to `.visual/` (git-ignored): `<screen>.app.png` (the build at 1512 × 982), `<screen>.diff.png` (pixel diff) and, with `--clip`, `<screen>.clip.png` (target crop above, build crop below). It uses the Playwright installed on the machine (`npm i -g playwright` if it's missing).

## Next steps (from the brief)

4. **Live data.** Put a provider-agnostic layer in front of the mock modules (`getQuote`, `getDailyBars`, `getOverview`, `getStatements`, `getEarnings`, `getNews`, `screen(filters)`). Call providers server-side only, keep keys in environment variables and cache with `"use cache"` + `cacheLife` (quotes ~1 minute, bars and fundamentals ~24 hours). The free Alpha Vantage tier allows 25 requests a day at 1 per second and the company-overview endpoint is premium-only, so batch and cache aggressively or plug in another provider. Snapshot screener fundamentals with a nightly job rather than querying live.
5. **Persistence** for watchlists, open ticker tabs, alerts, saved screens, research-queue tasks and notes.
6. **Single-user login**, then deploy (e.g. Vercel with env vars for API keys and the database URL).
