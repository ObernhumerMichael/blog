// theme-init.js — pure theme logic, no framework.
//
// DESIGN_SYSTEM.md §2.2: "Follows the operating system by default, with a
// manual override persisted locally and applied before first paint so there
// is no flash."
//
// Because tokens.css already drives every colour through light-dark() under
// `color-scheme: light dark`, following the OS preference needs ZERO
// JavaScript — it's already live, native CSS behaviour. This file's only
// job is the other half: apply an EXPLICIT override, if one is stored,
// before the browser paints anything.
//
// This file is injected into the page as a literal, unprocessed inline
// <script> (see IMPLEMENTATION_PLAN.md 1.5 for why that specifically matters
// in Astro) — so it deliberately has no imports, no exports, no build step.

(function () {
  var STORAGE_KEY = 'ledger-theme';

  function applyStoredTheme() {
    try {
      var stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') {
        document.documentElement.setAttribute('data-theme', stored);
      }
      // No stored value -> no attribute set -> tokens.css's
      // `:root { color-scheme: light dark }` + light-dark() follow the OS
      // preference automatically. Nothing else to do here.
    } catch (e) {
      // Some privacy modes throw on localStorage access (e.g. certain
      // locked-down browser configurations). The OS-preference fallback via
      // CSS still works correctly either way — this is a soft failure.
    }
  }

  function currentEffectiveTheme() {
    var explicit = document.documentElement.getAttribute('data-theme');
    if (explicit === 'light' || explicit === 'dark') return explicit;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (e) {
      // Won't persist across reloads in this session, but still applies now.
    }
  }

  function toggleTheme() {
    setTheme(currentEffectiveTheme() === 'dark' ? 'light' : 'dark');
  }

  // Run immediately. This call, executing synchronously before first paint,
  // IS the no-flash guarantee — contingent entirely on this whole file
  // running as an unprocessed, non-deferred inline script. See 1.5's Astro-
  // specific gotcha if that guarantee ever seems to be failing.
  applyStoredTheme();

  // Exposed for later use: Phase 2's real ThemeControl button, and this
  // phase's own throwaway test toggle. Not a module export on purpose —
  // this file has to work with zero build step.
  window.__themeInit = {
    setTheme: setTheme,
    toggleTheme: toggleTheme,
    currentEffectiveTheme: currentEffectiveTheme,
  };
})();
