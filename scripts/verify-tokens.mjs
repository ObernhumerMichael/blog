// scripts/verify-tokens.mjs
//
// Guards two cross-file failure classes stylelint cannot see on its own
// (see .stylelintrc's "WHAT THIS FILE DOES NOT CATCH" note, which names
// this script and — until now — pointed at one that didn't exist yet):
//
//   1. A component references var(--something) that tokens.css never
//      declares, in any of its media blocks. Nothing errors — the browser
//      just resolves to the property's inherited/initial value and the
//      element silently loses whatever that token was supposed to set.
//   2. A stylesheet opens an @layer that isn't one of the six declared in
//      IMPLEMENTATION_PLAN.md §5 (tokens, reset, base, layout, components,
//      exceptions). A typo'd or extra layer name doesn't error either — it
//      just registers a new layer in cascade order, silently changing
//      priority for everything already using the name it was meant to be.
//
// Run as part of `pnpm verify` (wired in as `check:tokens`).

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const TOKENS_CSS = 'src/styles/tokens.css';
const SCAN_ROOT = 'src';
const SCAN_EXT = new Set(['.css', '.astro', '.svelte']);
const ALLOWED_LAYERS = new Set([
  'tokens',
  'reset',
  'base',
  'layout',
  'components',
  'exceptions',
]);

let failed = false;
const fail = (msg) => {
  console.error(`  FAIL  ${msg}`);
  failed = true;
};
const ok = (msg) => console.log(`  ok    ${msg}`);

// --- gather ---------------------------------------------------------------

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) out.push(...walk(full));
    else if (SCAN_EXT.has(extname(full))) out.push(full);
  }
  return out;
}

// Strips /* ... */ comments so prose like "var(--c-*)" or a stray "@layer"
// mentioned in a doc comment doesn't get parsed as real usage. Astro/Svelte
// frontmatter and markup aren't otherwise touched — a false NEGATIVE there
// (missing a real var() inside a <script> string, say) is out of scope for
// what this script guards; a false POSITIVE from a comment is not.
const stripComments = (src) => src.replace(/\/\*[\s\S]*?\*\//g, '');

const files = walk(SCAN_ROOT);
const tokensSrc = readFileSync(TOKENS_CSS, 'utf8');

// Custom-property DECLARATIONS: `--name:` at the start of a declaration,
// anywhere in tokens.css (root block or either breakpoint's override block —
// a token only declared inside a media block, like --fs-callout's >=760
// override, is still a real declaration of that name).
const declared = new Set(
  [...stripComments(tokensSrc).matchAll(/(^|[\s{;])(--[a-zA-Z0-9-]+)\s*:/g)].map(
    (m) => m[2],
  ),
);

// --- check 1: every var(--x) resolves to a real declaration ---------------

console.log(`\nscanning ${files.length} file(s) under ${SCAN_ROOT}/ for var(--…) usage…`);

const usedAt = new Map(); // token name -> Set of files that reference it
for (const file of files) {
  const src = stripComments(readFileSync(file, 'utf8'));
  for (const m of src.matchAll(/var\(\s*(--[a-zA-Z0-9-]+)/g)) {
    const name = m[1];
    if (!usedAt.has(name)) usedAt.set(name, new Set());
    usedAt.get(name).add(file);
  }
}

const undeclared = [...usedAt.keys()].filter((name) => !declared.has(name));
if (undeclared.length === 0) {
  ok(`all ${usedAt.size} referenced custom properties are declared in ${TOKENS_CSS}`);
} else {
  for (const name of undeclared.sort()) {
    const where = [...usedAt.get(name)].join(', ');
    fail(`${name} is used but never declared in ${TOKENS_CSS} — referenced in: ${where}`);
  }
}

// --- check 2: only the six declared @layer names appear anywhere ----------

console.log('\nchecking @layer names…');

const layerNames = new Set();
for (const file of files) {
  const src = stripComments(readFileSync(file, 'utf8'));
  // Both forms: the canonical order statement (`@layer a, b, c;`) and a
  // block opener (`@layer components {`).
  for (const m of src.matchAll(/@layer\s+([a-zA-Z0-9,\s-]+?)\s*[{;]/g)) {
    for (const name of m[1].split(',').map((s) => s.trim())) {
      if (name) layerNames.add(name);
    }
  }
}

const strayLayers = [...layerNames].filter((name) => !ALLOWED_LAYERS.has(name));
if (strayLayers.length === 0) {
  ok(`only declared layer names in use: ${[...layerNames].sort().join(', ')}`);
} else {
  for (const name of strayLayers.sort()) {
    fail(`@layer "${name}" is not one of the six declared in IMPLEMENTATION_PLAN.md §5`);
  }
}

console.log('');
if (failed) {
  console.error('verify-tokens: FAILED\n');
  process.exit(1);
}
console.log('verify-tokens: all custom properties declared, all layer names in bounds\n');
