# ADR-0009 — No comments system

**Date:** 2026-08-25
**Status:** Accepted (corrects an earlier giscus recommendation made before
DESIGN_SYSTEM.md existed)

## Decision

No comments system of any kind (giscus, Disqus, or otherwise). The reply
path is `reply by email ↗` in the article aside, as already specified in
§10.8.

## Reasoning

§12 states plainly there is no form system, and the footer anti-patterns
(§18, and the anti-pattern table in §1.12) explicitly rule out newsletter
boxes, social icon rows, and share widgets — a comment widget is the same
category of addition. The design already has a specified, working reply
mechanism; adding a second one is redundant and inconsistent with the
system's restraint principle (§22.18).

## Rules out

- giscus, Disqus, Utterances, or any other comments integration.

## References

IMPLEMENTATION_PLAN.md AD-09.
