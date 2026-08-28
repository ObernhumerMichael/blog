# ADR-0012 — Homepage "Now" panel: build-time fetch with a committed fallback

**Date:** 2026-08-25
**Status:** Accepted

## Decision

The homepage's live facts (`homelab uptime 214 d`, `11 services ok`,
`last deploy 2026-08-19` — §19.1) are fetched from a small JSON endpoint on
the homelab VPS **at build time only**, with a committed fallback file used
if the fetch fails or exceeds a 2-second timeout. A nightly scheduled GitHub
Actions rebuild keeps the numbers current. There is no client-side or
request-time fetch.

## Reasoning

AD-01 commits the whole site to static output with no dynamic surface; a
runtime fetch from the masthead/homepage band would be the sole exception
and would fail visibly (a blank or stuck panel) exactly where a visitor
looks first. A build-time fetch with a fallback keeps the failure mode
invisible — worst case, slightly stale numbers, never a broken page.

## Rules out

- Client-side `fetch()` of live homelab data.
- Any dynamic/SSR carve-out for just this one panel.

## Side benefit

This mechanism is itself a legitimate homelab/Ansible article (content brief
§6), which the numbers already exist to support.

## References

IMPLEMENTATION_PLAN.md AD-12; DESIGN_SYSTEM.md §19.1.
