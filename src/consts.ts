// Single source of truth for the site's canonical URL.
//
// OD-07: the real domain isn't finalized yet. This constant — and
// astro.config.mjs's `site` field — are the ONLY two places a bare URL
// literal is allowed. Every RSS feed, sitemap entry, canonical <link>,
// og:url, and the AD-12 Now-panel fetch target must import SITE_URL from
// here, so resolving OD-07 later is a one-line change in two files, not a
// grep across the codebase.
export const SITE_URL = 'https://obernhumer.com';

export const SITE_NAME = 'Michael Obernhumer';

// §7.1 — role text under the wordmark in the masthead.
export const SITE_ROLE = 'backend · infrastructure';

// 5.10 — the RSS feed's <description>. Reuses the masthead role line rather
// than inventing separate site-summary copy nothing else in the design
// calls for.
export const SITE_DESCRIPTION =
  'Writing on backend development and infrastructure automation.';

// §7.1 — exactly three destinations. Do not add a fourth without revisiting
// OD-02 (CTF-as-tag) and IMPLEMENTATION_PLAN.md AD-03 first.
//
// `collection` names which real Astro content collection backs this
// destination's count in the mobile menu panel (§7.5: "Writing 38",
// "Projects 6", "About —"). `null` is explicit, not an omission — About has
// no collection behind it, and the panel renders the literal em dash for
// that case rather than a fabricated number (content brief: no invented
// metrics). Until Phase 5 populates real content, Writing/Projects will
// honestly show 0 — correct, not a bug.
export const NAV_LINKS = [
  { label: 'Writing', href: '/writing', collection: 'writing' },
  { label: 'Projects', href: '/projects', collection: 'projects' },
  { label: 'About', href: '/about', collection: null },
] as const;

// §7.5's mobile menu final row: `rss ↗ · github ↗ · pgp ↗`.
//
// PLACEHOLDERS — same pattern as OD-07's SITE_URL: real values needed before
// launch, but a build must not block on them. RSS_PATH is the one exception
// that isn't a placeholder — it's a stable route this site will always use,
// even though Phase 5 hasn't built the feed generator yet.
export const RSS_PATH = '/rss.xml';
export const GITHUB_URL = 'https://github.com/ObernhumerMichael';
export const PGP_URL = '/TODO-set-real-pgp-key.asc';

// §10.8's aside `reply by email ↗` line and the site's `mailto:` share
// fallback (5.7). Same placeholder treatment as GITHUB_URL/PGP_URL above.
export const CONTACT_EMAIL = 'mail@obernhumer.com';
export const SITE_LINKS = {
  rss: RSS_PATH,
  github: GITHUB_URL,
  pgp: PGP_URL,
};

// §10.6's author block — sourced from here rather than the `site` data
// collection (AD-03 assigns that collection to experience rows, Elsewhere
// links and the Now-panel fallback; a single-author blog's own author block
// is closer to SITE_NAME/SITE_ROLE's existing home). AUTHOR_NAME reuses
// SITE_NAME rather than repeating the string. AUTHOR_BIO is real prose, not
// a structural placeholder like GITHUB_URL/PGP_URL — but it's still a first
// draft, worth a real pass before launch.
export const AUTHOR_NAME = SITE_NAME;
export const AUTHOR_BIO =
  'Backend developer working on distributed systems and infrastructure automation. Writes about homelab engineering, security research and the tooling that holds both together. Corrections and disagreements are welcome by email.';

// Phase 4.1 (§13.2) — the closed vocabulary of fence languages a code block
// may declare, validated by remark-code-meta.ts and failing the build on
// anything outside it. Same shape and same reason as the tag registry
// IMPLEMENTATION_PLAN.md §6 describes for content tags ("prevents #linux /
// #Linux drift"): Shiki itself only warns-and-falls-back-to-plaintext on an
// unknown or misspelled grammar name (confirmed by reading
// @astrojs/internal-helpers' highlighter wrapper — it try/catches
// loadLanguage and swallows the error), which is how `jinja2` sat silently
// unhighlighted in the Phase 3 fixture since it was written (the real
// grammar is named `jinja`; `jinja2` isn't a registered alias). A warning
// in a build log is not enforcement.
//
// One canonical name per language, not every Shiki alias — `bash` not
// `sh`/`shell`/`shellscript`, `python` not `py`, `yaml` not `yml`,
// `typescript` not `ts` — for the same drift-prevention reason the tag
// registry forces one lowercase form per tag rather than accepting
// synonyms. Each id below is verified present in the installed
// @shikijs/langs@4.4.3 (`ls .../@shikijs/langs/dist/*.mjs`), except the two
// that aren't real grammars:
//   - `terminal` — not a Shiki language at all. §13.3's terminal block is a
//     distinct component with no syntax highlighting; it's excluded from
//     the highlighter entirely (markdown.syntaxHighlight.excludeLangs in
//     astro.config.mjs) and reaches rehype as plain text. Listed here so
//     the validator recognises it as a deliberate, not a missing, tag.
//   - `plaintext` — Shiki's own always-loaded fallback grammar. Listed so
//     genuinely non-code verbatim text (a raw error dump, not shell
//     output) can be tagged honestly instead of borrowing an unrelated
//     language for its highlighting.
//
// Extend this list — don't reach for an unregistered alias — when a real
// article needs a language that isn't here yet.
export const CODE_LANGS = [
  // Infra / config — the homelab and Ansible content this site's launch
  // set (IMPLEMENTATION_PLAN.md Phase 10) is written around.
  'yaml',
  'toml',
  'ini',
  'json',
  'jsonc',
  'dotenv',
  'diff',
  'dockerfile',
  'nginx',
  'systemd',
  'hcl',
  'sql',
  'jinja',
  // Shell and general-purpose scripting.
  'bash',
  'python',
  // Web / markup.
  'html',
  'css',
  'markdown',
  'http',
  // Compiled / typed languages, for CTF writeups and general programming
  // posts.
  'c',
  'cpp',
  'rust',
  'go',
  'typescript',
  'javascript',
  'asm',
  // The two non-Shiki-grammar pseudo-languages, see above.
  'terminal',
  'plaintext',
] as const;

export type CodeLang = (typeof CODE_LANGS)[number];

// Phase 4.6 (§7.3 of IMPLEMENTATION_PLAN.md, §2.2 deviation 6 / E15) — the
// closed vocabulary of `:::figure{kind="…"}` values. Required on every
// figure directive because nothing in the markup can infer it: dark mode
// dims `diagram`/`photo` to ~92% brightness and leaves `screenshot`
// untouched (dimming a UI capture would misrepresent the software), and
// `screenshot` additionally sits on `--c-sunken` with a `--c-rule` border
// so a light UI capture doesn't bleed into the page (§14.1).
export const FIGURE_KINDS = ['diagram', 'screenshot', 'photo'] as const;

export type FigureKind = (typeof FIGURE_KINDS)[number];

// Phase 5.2 (IMPLEMENTATION_PLAN.md §6) — the closed vocabulary of content
// tags a `writing`/`projects` entry may declare, checked by 5.3's cross-entry
// invariant 4. Same shape and reason as CODE_LANGS: one canonical lowercase
// form per tag, no `#`, so `#linux`/`#Linux` can't drift into two tags.
//
// Seeded from the Phase 3.6 fixture's own tags, plus OD-02's `ctf`/`security`
// (CTF writeups are `writing` entries tagged `#ctf`, not a separate
// collection — AD-03). Extend this list the first time a real article needs
// a tag that isn't here yet.
//
// `notes` added in 5.9 for the 90-word T4 fixture: every other registry tag
// is already used by a published article, so any of them would give that
// fixture a real related-articles match — the one thing its exit criterion
// says it must not have. A short one-off note is also a real, reusable
// category going forward, not a tag invented only to dodge the check.
export const TAGS = [
  'ansible',
  'infrastructure',
  'homelab',
  'ctf',
  'security',
  'notes',
] as const;

export type Tag = (typeof TAGS)[number];
