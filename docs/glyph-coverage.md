# Font glyph coverage — Phase 0.4

Checked against the actual font files, not assumed. Source: real cmap
tables read via fontTools, pulled from the upstream GitHub repos
(adobe-fonts/source-serif, IBM/plex) on 2026-08-25.

## Variable axes (confirms AD-07's opsz/wght assumptions)

| Family | Axes |
|---|---|
| Source Serif 4 — Roman (Var) | wght 200-900 (default 400), opsz 8-60 (default 20) |
| Source Serif 4 — Italic (Var) | wght 200-900 (default 400), opsz 8-60 (default 20) |
| IBM Plex Sans — Roman (Var) | wght 100-700 (default 400), wdth 85-100 (default 100) |
| IBM Plex Sans — Italic (Var) | wght 100-700 (default 400), wdth 85-100 (default 100) |
| IBM Plex Mono — Roman (Var) | wght 100-700 (default 400) |
| IBM Plex Mono — Italic (Var) | wght 100-700 (default 400) |

## Closed glyph set (§2.11)

| Glyph | Codepoint | Source Serif 4 — Roman (Var) | Source Serif 4 — Italic (Var) | IBM Plex Sans — Roman (Var) | IBM Plex Sans — Italic (Var) | IBM Plex Mono — Roman (Var) | IBM Plex Mono — Italic (Var) |
|---|---|---|---|---|---|---|---|
| `→` | U+2192  internal forward navigation | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `↗` | U+2197  external link | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `←` | U+2190  previous in sequence | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `·` | U+00B7  datum separator | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/` | U+002F  breadcrumb separator | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `#` | U+0023  tag prefix | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `●` | U+25CF  status: live (filled) | ❌ MISSING | ❌ MISSING | ❌ MISSING | ❌ MISSING | ❌ MISSING | ❌ MISSING |
| `○` | U+25CB  status: archived (hollow) | ❌ MISSING | ❌ MISSING | ❌ MISSING | ❌ MISSING | ❌ MISSING | ❌ MISSING |
| `◐` | U+25D0  theme control  <-- SUSPECT, verify explicitly | ❌ MISSING | ❌ MISSING | ❌ MISSING | ❌ MISSING | ❌ MISSING | ❌ MISSING |
| `+` | U+002B  disclosure closed / diff added | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `−` | U+2212  disclosure open / diff removed (MINUS SIGN, not hyphen) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `-` | U+002D  hyphen-minus (used in dates, code, etc.) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

## German extras (OD-05)

| Glyph | Codepoint | Source Serif 4 — Roman (Var) | Source Serif 4 — Italic (Var) | IBM Plex Sans — Roman (Var) | IBM Plex Sans — Italic (Var) | IBM Plex Mono — Roman (Var) | IBM Plex Mono — Italic (Var) |
|---|---|---|---|---|---|---|---|
| `Ä` | U+00C4 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `Ö` | U+00D6 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `Ü` | U+00DC | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `ä` | U+00E4 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `ö` | U+00F6 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `ü` | U+00FC | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `ß` | U+00DF | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

## Baseline Latin sanity check

| Glyph | Codepoint | Source Serif 4 — Roman (Var) | Source Serif 4 — Italic (Var) | IBM Plex Sans — Roman (Var) | IBM Plex Sans — Italic (Var) | IBM Plex Mono — Roman (Var) | IBM Plex Mono — Italic (Var) |
|---|---|---|---|---|---|---|---|
| `A` | U+0041 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `Z` | U+005A | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `a` | U+0061 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `z` | U+007A | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `0` | U+0030 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `9` | U+0039 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `.` | U+002E | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `,` | U+002C | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `:` | U+003A | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `;` | U+003B | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `!` | U+0021 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `?` | U+003F | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `(` | U+0028 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `)` | U+0029 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `[` | U+005B | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `]` | U+005D | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `{` | U+007B | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `}` | U+007D | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `"` | U+0022 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `'` | U+0027 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `@` | U+0040 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

## Verdict

**Gaps found — see ❌ rows above.** For each gap, Phase 1's fix is a
narrow `@font-face` with `unicode-range` scoped to just that code
point, pointing at a fallback family that does have it — not an SVG
icon substitute (§1.12 forbids icon fonts/libraries, and a
missing-glyph icon replacement would be exactly that in disguise).
