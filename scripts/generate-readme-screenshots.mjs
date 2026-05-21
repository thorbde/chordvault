import { chromium } from 'playwright';
import { existsSync, mkdirSync } from 'fs';

const BASE = 'http://localhost:5173';
const OUTPUT_DIR = 'docs/screenshots';

if (!existsSync(OUTPUT_DIR)) {
  mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log('Launching browser...');
const browser = await chromium.launch();

try {
  console.log('Capturing desktop screenshots...');
  const dCtx = await browser.newContext({
    viewport: { width: 1280, height: 900 }
  });
  const d = await dCtx.newPage();

  // Log console and errors
  d.on('console', msg => console.log('  [Browser Log]:', msg.text()));
  d.on('pageerror', err => console.error('  [Browser Error]:', err));

  // 1. Browse view
  console.log('  Navigating to browse page...');
  await d.goto(BASE);
  await d.waitForSelector('.song-card', { timeout: 5000 });
  await d.waitForTimeout(1500);
  console.log('  Capturing browse.png...');
  await d.screenshot({ path: `${OUTPUT_DIR}/browse.png` });

  // 2. Song view (dark mode)
  console.log('  Navigating directly to first song page (ID 1)...');
  await d.goto(`${BASE}/#song/1`);
  await d.waitForSelector('.chord-sheet', { timeout: 5000 });
  await d.waitForTimeout(1500);
  console.log('  Capturing song-view.png...');
  await d.screenshot({ path: `${OUTPUT_DIR}/song-view.png`, fullPage: true });

  // 3. Song view (light mode)
  console.log('  Switching to light theme...');
  const themeBtn = d.locator('button[title="Toggle theme"]').first();
  await themeBtn.click();
  await d.waitForSelector('html[data-theme="light"]', { timeout: 2000 });
  await d.waitForTimeout(1500);
  console.log('  Capturing song-view-light.png...');
  await d.screenshot({ path: `${OUTPUT_DIR}/song-view-light.png`, fullPage: true });

  // ── MOBILE CONTEXT ──────────────────────────────────────────────────
  console.log('Capturing mobile screenshots...');
  const mCtx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1'
  });
  const m = await mCtx.newPage();
  m.on('console', msg => console.log('  [Mobile Browser Log]:', msg.text()));
  m.on('pageerror', err => console.error('  [Mobile Browser Error]:', err));

  // 4. Mobile song view
  console.log('  Navigating directly to song page on mobile...');
  await m.goto(`${BASE}/#song/1`);
  await m.waitForSelector('.chord-sheet', { timeout: 5000 });
  await m.waitForTimeout(1500);
  console.log('  Capturing mobile-song-view.png...');
  await m.screenshot({ path: `${OUTPUT_DIR}/mobile-song-view.png`, fullPage: true });

  console.log('All screenshots captured successfully!');
} catch (err) {
  console.error('Error capturing screenshots:', err);
  process.exit(1);
} finally {
  await browser.close();
}
