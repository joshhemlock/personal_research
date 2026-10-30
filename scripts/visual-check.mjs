#!/usr/bin/env node
// Screenshot a screen at the design viewport (1512×982) and compare it with
// its target PNG in design/screens.
//
//   node scripts/visual-check.mjs <screen> [--clip x,y,w,h] [--zoom n] [--base url]
//   node scripts/visual-check.mjs <screen> --width 1400 [--height 900] [--full]
//
// screen: overview | chart | financials | screener | notes | all
// Writes to .visual/: <screen>.app.png (the build), <screen>.diff.png
// (pixelmatch diff, red = different) and, with --clip, <screen>.clip.png
// (target crop on top, build crop below, optionally zoomed).
// With --width other than 1512 it only screenshots (no target to diff
// against): .visual/<screen>.<width>.png, the whole page with --full.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";

// Playwright is not a project dependency: use the copy installed on the
// machine (resolved through NODE_PATH / global modules).
const { chromium } = createRequire(import.meta.url)("playwright");

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, ".visual");
const VIEWPORT = { width: 1512, height: 982 };

const SCREENS = {
  overview: { path: "/", target: "01-overview.png" },
  chart: { path: "/stock/NVDA", target: "02-stock-chart.png" },
  financials: { path: "/stock/NVDA/financials", target: "03-stock-financials.png" },
  screener: { path: "/screener", target: "04-screener.png" },
  notes: { path: "/notes/nvda-core-thesis", target: "05-research-notes.png" },
};

function arg(name, fallback) {
  const i = process.argv.indexOf(name);
  return i > -1 ? process.argv[i + 1] : fallback;
}

function crop(png, x, y, w, h, zoom) {
  const out = new PNG({ width: w * zoom, height: h * zoom });
  for (let yy = 0; yy < h * zoom; yy++) {
    for (let xx = 0; xx < w * zoom; xx++) {
      const sx = Math.min(png.width - 1, x + Math.floor(xx / zoom));
      const sy = Math.min(png.height - 1, y + Math.floor(yy / zoom));
      const si = (sy * png.width + sx) * 4;
      const di = (yy * out.width + xx) * 4;
      out.data[di] = png.data[si];
      out.data[di + 1] = png.data[si + 1];
      out.data[di + 2] = png.data[si + 2];
      out.data[di + 3] = 255;
    }
  }
  return out;
}

function stack(a, b, gap = 8) {
  const out = new PNG({ width: Math.max(a.width, b.width), height: a.height + gap + b.height });
  out.data.fill(255);
  for (let i = 0; i < out.width * gap; i++) {
    const di = (a.height * out.width + i) * 4;
    out.data[di] = 255;
    out.data[di + 1] = 0;
    out.data[di + 2] = 200;
  }
  PNG.bitblt(a, out, 0, 0, a.width, a.height, 0, 0);
  PNG.bitblt(b, out, 0, 0, b.width, b.height, 0, a.height + gap);
  return out;
}

async function snapshot(browser, name, base, width) {
  const height = Number(arg("--height", String(VIEWPORT.height)));
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  await page.goto(base + SCREENS[name].path, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
  const file = join(OUT, `${name}.${width}.png`);
  await page.screenshot({ path: file, fullPage: process.argv.includes("--full") });
  // Anything wider than the viewport means content is clipped or scrolls.
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  await page.close();
  console.log(`${name} @${width}px → .visual/${name}.${width}.png${overflow > 0 ? `  (page overflows by ${overflow}px)` : ""}`);
}

async function check(browser, name, base) {
  const s = SCREENS[name];
  const page = await browser.newPage({ viewport: VIEWPORT, deviceScaleFactor: 1 });
  await page.goto(base + s.path, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
  const appFile = join(OUT, `${name}.app.png`);
  await page.screenshot({ path: appFile });
  await page.close();

  const app = PNG.sync.read(readFileSync(appFile));
  const target = PNG.sync.read(readFileSync(join(ROOT, "design/screens", s.target)));
  const diff = new PNG({ width: VIEWPORT.width, height: VIEWPORT.height });
  const bad = pixelmatch(target.data, app.data, diff.data, VIEWPORT.width, VIEWPORT.height, {
    threshold: 0.1,
    alpha: 0.35,
  });
  writeFileSync(join(OUT, `${name}.diff.png`), PNG.sync.write(diff));
  const share = ((bad / (VIEWPORT.width * VIEWPORT.height)) * 100).toFixed(2);
  console.log(`${name}: ${share}% of pixels differ → .visual/${name}.app.png, .visual/${name}.diff.png`);

  const clip = arg("--clip");
  if (clip) {
    const [x, y, w, h] = clip.split(",").map(Number);
    const zoom = Number(arg("--zoom", "1"));
    const pair = stack(crop(target, x, y, w, h, zoom), crop(app, x, y, w, h, zoom));
    writeFileSync(join(OUT, `${name}.clip.png`), PNG.sync.write(pair));
    console.log(`  clip ${clip} ×${zoom} → .visual/${name}.clip.png (target above, build below)`);
  }
}

const which = process.argv[2];
if (!which || !(which in SCREENS || which === "all")) {
  console.error(`usage: visual-check.mjs <${Object.keys(SCREENS).join("|")}|all> [--clip x,y,w,h] [--zoom n] [--base url]`);
  process.exit(1);
}
mkdirSync(OUT, { recursive: true });
const base = arg("--base", "http://localhost:3000");
const browser = await chromium.launch();
try {
  const width = Number(arg("--width", String(VIEWPORT.width)));
  for (const name of which === "all" ? Object.keys(SCREENS) : [which]) {
    if (width === VIEWPORT.width) await check(browser, name, base);
    else await snapshot(browser, name, base, width);
  }
} finally {
  await browser.close();
}
