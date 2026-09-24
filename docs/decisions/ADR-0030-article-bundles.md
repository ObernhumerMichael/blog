# ADR-0030 — Each article is a folder bundling its own images

**Date:** 2026-09-24
**Status:** Accepted (corrects ADR-0028's `/figures/…` lead-figure path)

## Decision

A `writing` entry is `src/content/writing/<nnn>-<slug>/index.md`, with its
images next to it and referenced relatively (`./backup-chain.svg`) from
both the body and `leadFigure.src`. `leadFigure.src` is Astro's `image()`
helper, not a string, so `FeaturedEntry.astro` renders it with `<Image>`.
`public/figures/` is gone. `projects` entries use the same layout
(`src/content/projects/<nn>-<slug>/index.md`). None has an image yet, so
the projects schema has no image field.

## Reasoning

A `public/` image is served untouched, and the article that uses it lives
elsewhere. A co-located image goes through `astro:assets` (hashed URL,
resized and re-encoded if raster, a build error if missing), and an
article moves or is deleted as one unit. The glob loader drops the
trailing `/index`, so entry ids are unchanged. `image()` only exists inside
Astro's content layer, so `content.schemas.ts` exports `makeWritingSchema`,
and the plain-node invariant tests use `writingSchema` built with a string
stand-in.

## Consequences

- MARKDOWN_SYNTAX.md's tap-to-full-size link only wraps absolute-path
  diagrams: a relative image's final `/_astro/…` URL is only set at render
  time, after the remark plugin runs. Article 001's diagram is 360px wide,
  so it isn't a "wide diagram" (§14.4) and loses nothing. The first real
  wide diagram needs that link solved for bundled images, not a return to
  `public/`.

## Rules out

- Article images in `public/`.
- A string-typed `leadFigure.src`.

## References

ADR-0028. DESIGN_SYSTEM.md §14.4. MARKDOWN_SYNTAX.md "Figures".
