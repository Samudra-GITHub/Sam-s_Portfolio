// Copies the authored Kage assets shipped inside @designcodeio/threeui into public/
// (the <KageLandingPage/> iframe loads /landing-pages/kage.html from the site root)
// and verifies every byte against the sha256 manifest in kage-landing-page.json.
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'node_modules/@designcodeio/threeui/lib-dist/assets/landing-pages');
const dest = join(root, 'public/landing-pages');
const manifest = JSON.parse(readFileSync(join(root, 'kage-landing-page.json'), 'utf8'));

if (!existsSync(src)) {
  console.error('[kage] package assets not found. Run npm install first.');
  process.exit(1);
}

const wanted = [...manifest.files, ...manifest.assets].filter((f) => f.path.startsWith('public/landing-pages/'));
const sha = (buf) => createHash('sha256').update(buf).digest('hex');
let failed = 0;

// only the files Kage needs (kage.html + its secret-pathways-assets), not the other threeui pages
mkdirSync(dest, { recursive: true });
for (const entry of wanted) {
  const rel = entry.path.replace('public/landing-pages/', '');
  const from = join(src, rel);
  const to = join(dest, rel);
  if (!existsSync(from)) { console.error(`[kage] MISSING  ${rel}`); failed++; continue; }
  const buf = readFileSync(from);
  if (sha(buf) !== entry.sha256) { console.error(`[kage] MISMATCH ${rel}`); failed++; continue; }
  mkdirSync(dirname(to), { recursive: true });
  cpSync(from, to);
}

if (failed) { console.error(`[kage] ${failed} file(s) failed verification.`); process.exit(1); }
console.log(`[kage] ${wanted.length} files copied to public/landing-pages and verified against kage-landing-page.json`);
