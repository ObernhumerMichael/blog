<script lang="ts">
  import { onMount } from 'svelte';

  // CodeCopy.svelte — Phase 4.4, ADR-0020 (OD-12). One delegating island per
  // article page, `client:visible`, NOT one `CopyButton` instance per code
  // block. `remark-code-meta.ts` (4.3) already server-renders a real
  // `<button type="button" hidden class="code-block__copy" data-copy>copy
  // </button>` inside every non-terminal code block's chrome bar — this
  // component's only job is to un-hide those buttons on mount and own a
  // single delegated click handler, the clipboard write, and the 1.2s
  // label-swap/aria-live announcement for all of them (§13.2: "always
  // present", "politely announced").
  //
  // No `data-copy-target` id (ADR-0020's correction): any id assigned to
  // the code node before Shiki runs would land on the PRE-Shiki `<code>`
  // element and be discarded when Shiki wholesale-replaces the `<pre>`
  // (remark-code-meta.ts's own header explains why). The button's code
  // text is found at click time instead, by walking up to the nearest
  // `.code-block` and back down to its `pre code` — no id needed.
  //
  // ADR-0017 rules out scoped `<style>` blocks in `.svelte` files — every
  // visual state this button has (hover, `[data-copy-state]`, `[hidden]`)
  // is already styled in code.css (Phase 4.2/4.3). This file contributes
  // markup and behaviour only.

  // §13.2's own number, not a token: this is a one-off UI timing local to
  // this single behaviour, not a value anything else in the system shares.
  const RESET_MS = 1200;

  let announcement = '';
  let resetTimer: ReturnType<typeof setTimeout> | undefined;

  function copyTargetFor(button: HTMLElement): HTMLElement | null {
    return button.closest('.code-block')?.querySelector('pre code') ?? null;
  }

  function setState(button: HTMLButtonElement, state: 'copied' | 'failed') {
    clearTimeout(resetTimer);
    button.dataset.copyState = state;
    button.textContent = state;
    announcement = state;

    resetTimer = setTimeout(() => {
      button.removeAttribute('data-copy-state');
      button.textContent = 'copy';
      // Clearing this (not just leaving it at the last state) matters:
      // two consecutive `copied` results — two different blocks, or the
      // same block twice — would otherwise set the live region to the
      // same string twice in a row, which is not a DOM mutation and so
      // is never announced the second time.
      announcement = '';
    }, RESET_MS);
  }

  async function handleClick(event: MouseEvent) {
    const button = (event.target as HTMLElement | null)?.closest<HTMLButtonElement>(
      '[data-copy]',
    );
    if (!button) return;

    const code = copyTargetFor(button);

    try {
      await navigator.clipboard.writeText(code?.textContent ?? '');
      setState(button, 'copied');
    } catch {
      // §13.2 has no error state of its own; ADR-0020 requires a `failed`
      // label rather than letting a clipboard rejection (permissions,
      // insecure context) pass silently or throw into the console.
      setState(button, 'failed');
    }
  }

  // Un-hides every button already on the page at mount. Astro's static
  // output means the buttons this island will ever serve are all present
  // in the DOM by the time `client:visible` hydrates it — nothing is
  // inserted into the article body after the fact for a new button to
  // miss this pass.
  onMount(() => {
    document.querySelectorAll<HTMLButtonElement>('[data-copy]').forEach((button) => {
      button.hidden = false;
    });
  });
</script>

<svelte:document on:click={handleClick} />

<!-- .visually-hidden-inline, NOT .visually-hidden (base.css) — this span is
     this island's entire rendered output, so it's also the whole content
     `client:visible`'s IntersectionObserver measures. `.visually-hidden`'s
     `position: absolute` takes it out of flow and collapses the wrapper to
     0×0, which silently stops the island from ever hydrating — see
     base.css's comment on `.visually-hidden-inline` for how this was
     found. -->
<span class="visually-hidden-inline" aria-live="polite">{announcement}</span>
