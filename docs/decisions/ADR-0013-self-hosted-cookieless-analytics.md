# ADR-0013 — Self-hosted, cookieless analytics (or none)

**Date:** 2026-08-25
**Status:** Accepted

## Decision

Self-hosted Umami on the VPS, cookieless, no consent banner. Acceptable
fallback: no analytics at all, using Caddy access logs + GoAccess.

## Reasoning

Google Analytics or any third-party analytics script is a runtime
third-party request, which conflicts with the font-loading principle
already established elsewhere in the system (§2.4: "no third-party font
requests at runtime") and with the site's broader self-hosting positioning
(content brief §6, homelab focus). Cookieless first-party analytics needs no
consent banner — which matters concretely here, since the design has no
slot for one (no modal/banner component exists in the twenty-component
inventory, §6).

## Rules out

- Google Analytics, or any analytics vendor requiring a consent banner.
- Any client-side tracking script loaded from a third-party domain.

## References

IMPLEMENTATION_PLAN.md AD-13.
