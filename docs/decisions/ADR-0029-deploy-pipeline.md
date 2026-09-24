# ADR-0029 — Deploy pipeline: rsync releases into Dockerised Caddy

**Date:** 2026-09-24
**Status:** Accepted (implements IMPLEMENTATION_PLAN.md §10 / Phase 9, with
three corrections)

## Decision

A push to `main` runs the existing `build` job unchanged. When it passes, a
`deploy` job takes the exact `dist/` it checked (as an artifact, never
rebuilt), rsyncs it to `/srv/www/blog/releases/<sha>/` as the unprivileged
`deploy` user, atomically swaps the `current` symlink, and keeps five
releases. Server state (user, key, directories, Caddy site config) lives in
the `server-conf` Ansible repo's `blog` role, as §10 intends.

## Corrections to the plan

- **Caddy runs in Docker**, not on the host (server-conf's `caddy` role).
  `/srv/www/blog` is bind-mounted read-only at the same path, so the
  relative `current` symlink resolves identically inside and outside the
  container. Caddy re-resolves it per request: the swap needs no reload
  (verified locally against a real Caddy 2.11).
- **No nightly cron.** AD-12's build-time Now-panel fetch is gone (the
  panel is static copy), so a scheduled rebuild would produce an identical
  site.
- **`/writing/<slug>` stays a meta-refresh, for now.** A real 301 needs
  Caddy to re-read a generated redirect map, i.e. a `caddy reload` after
  each deploy. That means giving `deploy` `docker exec` rights (root
  equivalent) or a sudo rule. A meta-refresh with a canonical link is not
  worth that. Revisit if the aliases start to matter for search.

## Consequences

- `dev/` never ships: the `strip-dev-pages` build hook already removes it,
  so the deploy job has no `rm -rf dist/dev` step.
- CSP is not set yet. Astro's inline island scripts need hashes or
  `'unsafe-inline'`. That is a follow-up, not part of standing up the
  pipeline.
