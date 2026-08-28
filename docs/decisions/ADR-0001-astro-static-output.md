# ADR-0001 — Astro, static output, no adapter

**Date:** 2026-08-25
**Status:** Accepted

## Decision

Build with Astro, `output: 'static'`, no SSR adapter.

## Reasoning

Nothing in DESIGN_SYSTEM.md has a dynamic surface: no forms (§12), no
comments, no auth, no search backend (§25.5). §16.1 states loading "does not
exist" and §17.4 states navigation is a full document load with no page
transitions. A server runtime would be capability never exercised but still
requiring patching, monitoring and a bigger attack surface — a cost paid for
nothing.

## Rules out

- Any Node/Deno adapter (`@astrojs/node`, etc.)
- Astro's `ViewTransitions` / `ClientRouter` — enabling either directly
  violates §17.4 and is the default reflex on a modern Astro project. Do not
  turn it on.
- SSR-dependent features (cookies, request-time personalization) — none are
  needed and adding one later should trigger revisiting this ADR, not a quiet
  workaround.

## References

IMPLEMENTATION_PLAN.md AD-01.
