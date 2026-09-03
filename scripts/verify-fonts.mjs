// scripts/verify-fonts.mjs
//
// Guards a specific silent-failure class: font paths are duplicated between
// BaseLayout.astro's preload hints and styles/fonts.css's @font-face src
// URLs. If either drifts from the actual files in public/fonts, nothing
// errors — the browser just quietly fetches nothing (preload) or falls back
// to the metric-matched fallback face forever (@font-face). The page still
// renders, so it can ship unnoticed.
//
// Run as part of `pnpm verify`.

import { readFileSync, readdirSync, existsSync } from 'node:fs';

const FONT_DIR = 'public/fonts';
const FONTS_CSS = 'src/styles/fonts.css';
const BASE_LAYOUT = 'src/layouts/BaseLayout.astro';

let failed = false;
const fail = (msg) => {
  console.error(`  FAIL  ${msg}`);
  failed = true;
};
const ok = (msg) => console.log(`  ok    ${msg}`);

// --- gather ---------------------------------------------------------------

if (!existsSync(FONT_DIR)) {
  console.error(`FAIL  ${FONT_DIR} does not exist.`);
  process.exit(1);
}

const onDisk = new Set(readdirSync(FONT_DIR).filter((f) => f.endsWith('.woff2')));

const cssSrc = readFileSync(FONTS_CSS, 'utf8');
const cssRefs = [...cssSrc.matchAll(/url\(\s*['"]?(\/fonts\/[^'")]+)['"]?\s*\)/g)].map(
  (m) => m[1],
);

const layoutSrc = readFileSync(BASE_LAYOUT, 'utf8');
const preloads = [...layoutSrc.matchAll(/'(\/fonts\/[^']+)'/g)].map((m) => m[1]);

const basename = (p) => p.split('/').pop();

// --- checks ---------------------------------------------------------------

console.log(`\nfonts on disk (${onDisk.size}):`);
[...onDisk].sort().forEach((f) => console.log(`  ${f}`));

console.log(`\n@font-face references in ${FONTS_CSS} (${cssRefs.length}):`);
if (cssRefs.length === 0)
  fail('no @font-face url() references found — did the file move?');
for (const ref of cssRefs) {
  if (onDisk.has(basename(ref))) ok(`${ref} exists`);
  else fail(`${ref} referenced by fonts.css but NOT in ${FONT_DIR}`);
}

console.log(`\npreload hints in ${BASE_LAYOUT} (${preloads.length}):`);
if (preloads.length === 0)
  fail('no preload hints found — did PRELOAD_FONTS move or rename?');
for (const p of preloads) {
  if (!onDisk.has(basename(p))) {
    fail(`${p} preloaded but NOT in ${FONT_DIR}`);
  } else if (!cssRefs.includes(p)) {
    fail(`${p} preloaded but never referenced by fonts.css — preloading an unused file`);
  } else {
    ok(`${p} exists and is used by fonts.css`);
  }
}

// Unreferenced files are a warning, not a failure: an italic face that is
// declared but not yet used by any component is legitimate mid-build.
const referenced = new Set(cssRefs.map(basename));
const orphans = [...onDisk].filter((f) => !referenced.has(f));
if (orphans.length) {
  console.log(`\nnote: ${orphans.length} file(s) on disk not referenced by fonts.css:`);
  orphans.forEach((f) => console.log(`  ${f}`));
}

console.log('');
if (failed) {
  console.error('verify-fonts: FAILED\n');
  process.exit(1);
}
console.log('verify-fonts: all font paths consistent\n');
