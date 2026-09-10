# ADR-0020 — One delegating `CodeCopy` island, not one instance per block (OD-12)

**Date:** 2026-09-10
**Status:** Accepted (OD-12)

## Decision

Copy controls (§13.2) are **not** individual `CopyButton.svelte` instances
mounted per code block. Instead: `src/plugins/rehype-code-chrome.ts`
(Phase 4.2/4.3) server-renders a real `<button hidden data-copy
data-copy-target="…">copy</button>` inside every code block's chrome bar,
and one `CodeCopy.svelte` island per page — `client:visible` — un-hides
every such button on mount and owns a single delegated click handler,
the clipboard write, and the 1.2s label-swap/`aria-live` announcement for
all of them.

## Reasoning

ADR-0017 assigns the copy control to a Svelte component
(`CopyButton.svelte`) hydrated per behaviour. That collides with a fact
ADR-0017 didn't have in view: the chrome bar containing the control is
generated **inside the Markdown pipeline** (a rehype plugin building hast
nodes), not inside an `.astro` template — and Astro's `client:*` directives
only exist in `.astro`/`.mdx` templates. A hast tree cannot instantiate an
island. MDX is ruled out by AD-04 for the same reason it was ruled out
everywhere else: enabling it to solve one component's hydration problem is
exactly the "arbitrary component injection into prose" pressure the
directive system exists to resist.

Three options considered:

| Option                                                                   | Cost                                                                                                                                                                                                                                    |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mount one `CopyButton` instance per block via Svelte 5's `mount()`       | N component instances per page; hand-rolled hydration wiring that re-implements what `client:*` already does; ADR-0017's "narrowest directive per behaviour" stops meaning anything once every instance needs its own manual mount call |
| **One `CodeCopy.svelte` per page, `client:visible`, delegated clicks**   | One island regardless of block count; the button markup is server-rendered and real (works, inert, with JS disabled); satisfies both AD-11's budget and ADR-0017's "Svelte owns interaction" split                                      |
| Drop back to a vanilla inline script, as the pre-paint theme resolver is | Simplest, but reopens ADR-0017 for the one behaviour it explicitly kept in scope, two weeks after it was accepted, for a reason that isn't really about Svelte's suitability                                                            |

**Chosen: the delegating island.** It keeps the copy control inside
ADR-0017's model (Svelte owns the interaction, the button is real markup)
without inventing a mount-per-block mechanism, and it costs nothing extra
against AD-11's bundle budget — one island is one island, however many
buttons it serves.

## Consequences

- `CodeCopy.svelte` (Phase 4.4) reads every `[data-copy]` button on the
  page at mount, un-hides it, and attaches one delegated `click` listener
  on a shared ancestor rather than one listener per button.
- The chrome-bar plugin (4.2/4.3) is responsible for the button's static
  markup, its `data-copy-target` pointing at the block's code text, and its
  `hidden` attribute — the island's only job is to reveal and wire it.
- No-JS behaviour: the button stays hidden, matching "always present" in
  spirit only when JS can act on it — §13.2 does not describe a no-JS
  fallback, so a hidden-until-hydrated control is the correct degradation,
  not a design gap.
- Failure path: a clipboard-write rejection (permissions, insecure context)
  swaps the label to `failed` instead of `copied`, restores after the same
  1.2s, and does not throw.

## Rules out

- A `CopyButton.svelte` instance per code block.
- MDX as a mechanism for reaching a Svelte island from Markdown-generated
  content.
- A vanilla-script fallback for this one behaviour while every other
  interactive behaviour stays on Svelte.

## References

DESIGN_SYSTEM.md §13.2. ADR-0004 (MDX by exception), ADR-0017 (Svelte
islands). IMPLEMENTATION_PLAN.md Phase 4.0 (OD-12), Phase 4.4.
