/**
 * Re-captures the three pages the Portfolio island's display shows (public/world/portfolio/), so its screen
 * never drifts from the site. Run it after a visual change, with the dev server up:
 *
 *   npm run dev
 *   node scripts/capture-portfolio-screens.mjs [http://localhost:5173/]
 *
 * Needs `puppeteer-core` (not a dependency of the site: install it anywhere on your machine's module path)
 * and Chrome; CHROME_PATH overrides where Chrome is looked for. Writes 1440 x 900 WebP when `cwebp` is on
 * the PATH, PNG otherwise (convert those by hand before committing).
 */
import { execFileSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const url = process.argv[2] ?? 'http://localhost:5173/';
const out = join(process.cwd(), 'public/world/portfolio');
const chrome = process.env.CHROME_PATH ?? ['C:/Program Files/Google/Chrome/Application/chrome.exe', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome'].find(existsSync);

let puppeteer;
try {
  puppeteer = (await import('puppeteer-core')).default;
} catch {
  console.error('puppeteer-core is not installed: npm i -g puppeteer-core (or install it next to this script)');
  process.exit(1);
}
if (!chrome) {
  console.error('Chrome not found: set CHROME_PATH');
  process.exit(1);
}

const hasCwebp = (() => {
  try {
    execFileSync('cwebp', ['-version'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
})();

const browser = await puppeteer.launch({ executablePath: chrome, args: ['--enable-webgl', '--ignore-gpu-blocklist'], defaultViewport: { width: 1440, height: 900 } });
const page = await browser.newPage();
await page.goto(url, { waitUntil: 'load', timeout: 120000 });
await page.waitForFunction(() => document.querySelector('.world')?.dataset.ready === 'true', { timeout: 180000 });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
await wait(4000);

// arrival: the top of the page; island: the first project, presented; about: the about section
const shots = [
  ['arrival', () => window.scrollTo(0, 0)],
  ['island', () => {
    const el = document.querySelector('[id^="p-"]');
    const next = el.nextElementSibling;
    const top = el.getBoundingClientRect().top + scrollY, nt = next.getBoundingClientRect().top + scrollY;
    window.scrollTo(0, top + (nt - top) * 0.58 - innerHeight * 0.33);
  }],
  ['about', () => document.getElementById('about')?.scrollIntoView()],
];
for (const [name, go] of shots) {
  await page.evaluate(go);
  await wait(5000);
  const png = join(out, `${name}.png`);
  await page.screenshot({ path: png });
  if (hasCwebp) {
    execFileSync('cwebp', ['-quiet', '-q', '88', png, '-o', join(out, `${name}.webp`)]);
    rmSync(png);
  }
  console.log('captured', name);
}
await browser.close();
