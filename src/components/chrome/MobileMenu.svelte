<script lang="ts">
  import { slide } from 'svelte/transition';

  export let links: {
    href: string;
    label: string;
    current: boolean;
    count: number | null;
  }[];

  let open = false;
  let triggerEl: HTMLButtonElement;

  function toggle() {
    open = !open;
  }

  // Explicit addition, not in DESIGN_SYSTEM.md: the spec calls out "no
  // close-on-outside-click" and "no focus trap" but says nothing about
  // Escape. Closing on Escape doesn't trap focus or add outside-click
  // behaviour, so it doesn't violate either stated rule — but flagging it
  // since it wasn't asked for. Delete this handler if you want strict
  // literal fidelity to what's written.
  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && open) {
      open = false;
      triggerEl?.focus();
    }
  }

  // Matches --ease: cubic-bezier(.2, 0, 0, 1) (§17.3) so the JS-driven
  // open/close animation sits on the same curve as every CSS-driven one.
  // Svelte's transition `easing` param wants a (t) => number function, not
  // a CSS string, so this is a small numeric solve, not decoration. Worth
  // moving to src/lib/easing.ts if a second Svelte component ever needs
  // it — one caller isn't reason enough for a shared file yet.
  function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
    const A = (a1: number, a2: number) => 1 - 3 * a2 + 3 * a1;
    const B = (a1: number, a2: number) => 3 * a2 - 6 * a1;
    const C = (a1: number) => 3 * a1;
    const bezX = (t: number) => ((A(x1, x2) * t + B(x1, x2)) * t + C(x1)) * t;
    const bezY = (t: number) => ((A(y1, y2) * t + B(y1, y2)) * t + C(y1)) * t;
    const derivX = (t: number) => 3 * A(x1, x2) * t * t + 2 * B(x1, x2) * t + C(x1);
    return (x: number) => {
      let t = x;
      for (let i = 0; i < 6; i++) {
        const dx = bezX(t) - x;
        if (Math.abs(dx) < 1e-4) break;
        t -= dx / (derivX(t) || 1e-6);
      }
      return bezY(t);
    };
  }
  const ease = cubicBezier(0.2, 0, 0, 1);

  // §17.5: reduced-motion collapses durations to zero globally. Svelte
  // transitions are JS-driven, so they don't inherit that from CSS —
  // this is the one place in this component that needs its own check.
  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const duration = reduced ? 0 : 160;
</script>

<svelte:window on:keydown={handleKeydown} />

<button
  bind:this={triggerEl}
  class="menu-trigger"
  aria-expanded={open}
  aria-controls="mobile-menu-panel"
  on:click={toggle}
>
  {open ? 'close' : 'menu'}
</button>

{#if open}
  <div
    id="mobile-menu-panel"
    class="menu-panel full-bleed"
    transition:slide={{ duration, easing: ease }}
  >
    <ul class="menu-list">
      {#each links as link}
        <li class="menu-row">
          <a
            href={link.href}
            class="menu-row-link"
            class:current={link.current}
            aria-current={link.current ? 'page' : undefined}
          >
            <span class="menu-row-label">{link.label}</span>
            <span class="menu-row-count">{link.count ?? '—'}</span>
          </a>
        </li>
      {/each}
    </ul>

    <div class="meta-row">
      <span class="meta-links"><slot name="meta-links" /></span>
      <slot name="theme" />
    </div>
  </div>
{/if}

<!-- Unused default slot. Without one, this component's generated type has
     `children: undefined`, so passing the two named slots above (theme,
     meta-links) as separate top-level children makes Astro's JSX checker
     fall through to a mismatched overload (astro check: TS2746/2769).
     Wrapping them in a single <Fragment> "fixes" the type error but makes
     Astro drop both slots' content at render time instead — this is the
     workaround that keeps both the type check and the actual output correct. -->
<slot />

<style>
  @layer components {
    .menu-trigger {
      padding: 7px 9px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: var(--target-min);
      min-height: var(--target-min);
      font-family: var(--font-mono);
      font-size: var(--fs-meta-xs);
      color: var(--c-text);
      background: none;
      border: var(--bw) solid var(--c-rule);
      border-radius: var(--radius);
      cursor: pointer;
      transition-property: border-color;
      transition-duration: var(--dur);
      transition-timing-function: var(--ease);
    }
    .menu-trigger[aria-expanded='true'] {
      border-color: var(--c-accent);
    }

    .menu-trigger:hover {
      border-color: var(--c-accent);
    }

    .menu-trigger:active {
      border-color: var(--c-accent-hi);
    }

    @media (min-width: 760px) {
      .menu-trigger {
        display: none;
      }
    }

    /* flex-basis: 100% is the other half of the fix — see Masthead.astro's
       .row comment. This is what forces the panel onto its own line
       instead of squeezing in next to the trigger button. */
    /* MobileMenu.svelte */
    .menu-panel {
      flex: 1 0 100%;
      margin-top: var(--sp-16);
      /* space before the rule, so the trigger
        button doesn't touch border-top below */
      border-top: var(--bw) solid var(--c-rule);
      overflow: hidden;
    }

    .menu-list {
      list-style: none;
    }
    .menu-row {
      border-bottom: var(--bw) solid var(--c-rule);
    }

    .menu-row-link {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--sp-12);
      padding-block: var(--sp-12);
      padding-inline: var(
        --page-margin
      ); /* .menu-panel is full-bleed, so
        content re-insets itself here instead */
      text-decoration: none;
      color: var(--c-text);
      transition-property: background-color;
      transition-duration: var(--dur);
      transition-timing-function: var(--ease);
    }
    .menu-row-link:hover {
      background-color: var(--c-surface);
    }

    .menu-row-label {
      font-family: var(--font-sans);
      font-size: 16px; /* §7.5 states this literally; not a --t- scale step */
      border-bottom: 1px solid transparent;
      padding-bottom: 2px;
    }
    .menu-row-link.current .menu-row-label {
      border-color: var(--c-accent);
    }
    .menu-row-link:hover .menu-row-label {
      border-color: var(--c-accent-hi);
    }
    .menu-row-link:active .menu-row-label {
      color: var(--c-accent-hi);
    }

    .menu-row-count {
      font-family: var(--font-mono);
      font-size: var(--fs-meta-xs);
      color: var(--c-muted);
      white-space: nowrap;
    }

    .meta-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: var(--sp-12);
      padding-top: var(--sp-12);
      padding-inline: var(--page-margin);
    }
    .meta-links {
      font-family: var(--font-mono);
      font-size: var(--fs-meta-xs);
      color: var(--c-muted);
    }
  }
</style>
