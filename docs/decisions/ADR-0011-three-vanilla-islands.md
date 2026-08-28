# ADR-0011 — Three vanilla-JS islands, no UI framework, <4KB total

**Date:** 2026-08-25
**Status:** Accepted

## Decision

No React/Vue/Svelte/Solid integration. All client-side interactivity is
three small vanilla-JS islands: theme (inline, blocking, in `<head>`),
TOC + reading-progress (IntersectionObserver), and the code-copy control
(Clipboard API + a text-only state change). Combined JS budget: under 4 KB.

## Reasoning

§16.1 states interaction feedback is deliberately narrow — colour and ground
change, nothing moves — and §17 lists an exhaustive set of things that
animate, none of which need component-state management. The mobile menu and
TOC disclosure are native `<details>` elements (§7.5, §12.1), needing no JS
at all, which is also why §7.5 can correctly claim "no focus trap to get
wrong." A UI framework would add a runtime cost with nothing in the design
that needs client-side state, conditional rendering, or componentized
interactivity beyond these three small, independent behaviours.

## Rules out

- `@astrojs/react`, `@astrojs/vue`, `@astrojs/svelte`, or any framework
  integration.
- Client-side routing or state management of any kind.

## Enforcement

Lighthouse CI's JS budget (IMPLEMENTATION_PLAN.md §8, T5) keeps this honest
over time — a budget violation should be treated as a design question
("does this really need to be interactive?"), not raised as a matter of
course.

## References

IMPLEMENTATION_PLAN.md AD-11.
