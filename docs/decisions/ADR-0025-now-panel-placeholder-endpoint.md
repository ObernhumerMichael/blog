# ADR-0025 — Now-panel placeholder endpoint and fallback wiring

**Date:** 2026-09-17
**Status:** Superseded — Now-panel fetch removed in `37725fb`; the panel is static text (`COPY.home.nowSentence`)

## Decision

Add `NOW_PANEL_URL` to `consts.ts`: `https://now.internal.invalid/status.json`
— a placeholder on the RFC 2606 reserved `.invalid` TLD, guaranteed to
never resolve, rather than a guessed-real host. `src/lib/now.ts` exports
`getNowPanelData()`: fetch `NOW_PANEL_URL` with `AbortSignal.timeout(2000)`,
validate the response against `nowFallbackSchema`, and on any failure
(network error, timeout, non-2xx, or a body that doesn't validate) fall
back to the committed `src/content/site/now-fallback.json`, itself
validated against the same schema. One `try`/`catch` around the whole
fetch-and-validate sequence, not a branch per failure mode — every failure
mode has the identical outcome.

## Reasoning

ADR-0012 already settled the mechanism's shape (build-time fetch, 2s
timeout, committed fallback, no runtime fetch). What it left open is what
`now.ts` actually fetches from: the real homelab VPS endpoint doesn't exist
yet, and standing up that infrastructure is Phase 9's job, not Phase 7's —
the same shape of problem Phase 5 solved by shipping the meta-refresh
redirect now and carrying the real Caddy 301 forward to Phase 9. Building
the Now panel against a hard-fails-without-a-real-endpoint assumption would
block this phase on infrastructure with no reason to exist yet.

The `.invalid` TLD (not a made-up domain that might collide with a real
registration, and not a guessed real-looking path) fails DNS resolution in
well under 100ms in practice, so a placeholder build reaches the fallback
almost immediately rather than waiting out the full 2-second timeout on
every build.

Validating the fallback file against the same `nowFallbackSchema` the live
endpoint's response is checked against — rather than trusting the committed
JSON blindly — means a typo in `now-fallback.json` fails loudly (a thrown
error, same fail-closed posture `load-content.ts`'s `loadCollection` already
takes for `writing`/`projects`) instead of silently reaching the homepage
as `undefined`.

## Consequences

- The homepage (7.4) calls `getNowPanelData()` from `index.astro`'s
  frontmatter — a plain async function, not a fourth island; ADR-0011's
  three-islands budget is untouched.
- Every build until Phase 9 exercises the fallback path, not the live
  fetch — the committed `now-fallback.json` values (`uptimeDays: 214`,
  `servicesOk: 11`, `lastDeploy: 2026-08-19`) are what the homepage always
  shows today.
- `tests/invariants/now.test.ts` stubs `globalThis.fetch` per test (reject,
  non-2xx, schema-invalid body, valid body) so the fallback behaviour is
  proven without any real network call in CI, and without depending on how
  fast a given CI runner's DNS resolver rejects `.invalid`.
- Phase 9 swaps `NOW_PANEL_URL` for the real homelab endpoint — a
  one-constant change, the same shape OD-07/AD-12 already established for
  `SITE_URL`.

## Rules out

- A per-failure-mode branch (timeout vs. network error vs. bad JSON vs.
  schema mismatch) with different fallback behaviour per branch.
- Trusting `now-fallback.json`'s shape without runtime validation.
- Any client-side or request-time fetch for this panel (already ruled out
  by ADR-0012; restated here because it's the thing a "just fetch client
  side until the endpoint exists" shortcut would have reached for).

## References

DESIGN_SYSTEM.md §19.1.
IMPLEMENTATION_PLAN.md AD-12, Phase 5 Finding B (the meta-refresh
precedent), Phase 7.0 (Finding D, OD-17), 7.2.
ADR-0012 (the mechanism this ADR wires a concrete endpoint into).
