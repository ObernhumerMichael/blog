# Pre-merge checklist

Three judgment calls that stay manual — IMPLEMENTATION_PLAN.md §8's own
"What stays manual" list. Everything else in §8's enforcement system (T1–T5)
is automated and gates CI; these three are not, because they're judgment,
not assertion. Run through them on any PR that touches layout, a new page,
or a new bounded container, before merging.

## 1. Accent budget

**At most three accented elements visible in one viewport** (DESIGN_SYSTEM.md
§1.6, §22.21). The accent (terracotta in light, clay in dark) is the one
colour the system spends — link underlines, numbering, active state, tags,
the highlight marker in code. Scroll through the page at each of the three
widths and count what's accented on screen at once. If a viewport has more
than three, something needs to lose its colour, not gain a fourth carve-out.

## 2. The box-or-rule test

Apply before adding any bounded container (DESIGN_SYSTEM.md §9.2).

- A **box** is justified when the content has a different reading mode from
  the prose around it (code, terminal output, a callout you may skip), or
  it's interactive as a whole unit (a button).
- A **rule** is correct when items are peers in a sequence — index rows,
  project entries, table rows, footnotes, experience entries, references,
  section bands. Peers get a shared rule and shared alignment, never
  individual containers.

If what you're adding doesn't clearly fit one of these, it's not ready to
ship yet.

## 3. Does the band do work?

A page is finished when every band is doing work (DESIGN_SYSTEM.md §5.6).
There is no filler band, no "features" band, no call-to-action band. If you
can delete a band and nothing on the page is worse for it, delete it.

---

For the automated side (schema/content invariants, CSS lint, DOM assertions,
edge-case fixtures, visual regression, link checking, Lighthouse budgets),
see IMPLEMENTATION_PLAN.md §8.
