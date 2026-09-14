<script lang="ts">
  import { onMount } from 'svelte';

  // TocProgress.svelte — Phase 5.6, AD-11's third and last island. Per
  // AD-11's own table this is ONE island doing two jobs, not two: the TOC's
  // active-item scroll-spy (ArticleToc.astro, Phase 3.7, left `.is-active`
  // for this phase to wire) and the reading-progress bar (ReadingProgress.
  // astro, this phase — mounted twice, aside + under-masthead, both updated
  // by the same code here). `client:visible`, same delegation shape as
  // CodeCopy.svelte (Phase 4.4): the markup already exists server-rendered;
  // this component only ever toggles a class or writes a width/number onto
  // it, never creates any of it.
  //
  // ADR-0017 rules out scoped `<style>` blocks in `.svelte` files — nothing
  // here needs one, this file contributes behaviour only.

  function setActiveToc(id: string | null) {
    document.querySelectorAll('.toc-item.is-active').forEach((li) => {
      li.classList.remove('is-active');
    });
    if (!id) return;
    // Two `<li>`s per heading — ArticleToc.astro renders both the wide and
    // narrow disclosures unconditionally and lets CSS pick which is
    // visible (its own header comment explains why). Both get the class;
    // only one is ever shown.
    document.querySelectorAll(`.toc-item a[href="#${CSS.escape(id)}"]`).forEach((a) => {
      a.parentElement?.classList.add('is-active');
    });
  }

  function updateProgress() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const pct = max > 0 ? Math.min(100, Math.max(0, Math.round((window.scrollY / max) * 100))) : 0;

    document.querySelectorAll<HTMLElement>('[data-progress-fill]').forEach((fill) => {
      fill.style.width = `${pct}%`;
    });
    document.querySelectorAll('[data-progress-text]').forEach((text) => {
      text.textContent = String(pct);
    });
  }

  // The active section is whichever numbered heading's top has most
  // recently crossed a line 25% down the viewport — and it STAYS active
  // for the whole section body, until the next heading crosses that same
  // line. `headings` is in document order, so the last one still above the
  // line is the answer; walking forward and stopping at the first one that
  // isn't relies on that same ordering.
  //
  // A first version of this used an IntersectionObserver on a thin band
  // instead: correct only while a heading itself was in that band, so the
  // highlight went dark for the entire body of a section between two
  // headings — the observer reports transient crossings, not "which
  // section is the reader in", which is a position query, not an
  // intersection one.
  function updateActiveHeading(headings: HTMLElement[]) {
    const line = window.innerHeight * 0.25;
    // +1px tolerance: `window.scrollTo` rounds to a whole pixel, so a
    // heading nudged exactly onto the line can land a fraction of a pixel
    // ABOVE it post-round — confirmed directly (a scrolled position of
    // 200.03px against a 200px line), which without slack reads as "not
    // yet reached" and leaves the PREVIOUS heading active instead.
    let current: HTMLElement | null = null;
    for (const heading of headings) {
      if (heading.getBoundingClientRect().top > line + 1) break;
      current = heading;
    }
    setActiveToc(current?.id ?? null);
  }

  // rAF-throttled, not a bare scroll listener — §15's own "invisible until
  // a real Lighthouse run counts main-thread time" warning, given here for
  // the exact same behaviour there.
  let ticking = false;

  onMount(() => {
    // rehype-toc.ts: `data-section-num` is present on exactly the numbered
    // h2/h3s ArticleToc.astro lists — the same set, found the same way,
    // with no second slug/text-matching implementation.
    const headings = Array.from(
      document.querySelectorAll<HTMLElement>('.prose [data-section-num]'),
    );

    function update() {
      updateProgress();
      updateActiveHeading(headings);
    }

    update();

    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        update();
        ticking = false;
      });
    }

    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
    };
  });
</script>

<!-- .visually-hidden-inline, NOT .visually-hidden — same CodeCopy.svelte
     pitfall (see that file's comment): this is the island's only rendered
     output, and an out-of-flow, 0×0 node here would stop `client:visible`
     from ever hydrating. -->
<span class="visually-hidden-inline"></span>
