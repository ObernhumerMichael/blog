/// <reference types="astro/client" />

// theme-init.js attaches this to `window` at runtime (see src/lib/theme-init.js).
// TypeScript has no way to know that from a plain .js file loaded via a raw
// string injection (`?raw` + set:html) — it's invisible to the type checker
// by construction, since it never goes through an import. This augmentation
// is what makes `window.__themeInit` type-check correctly anywhere it's used,
// without giving up the js-file-as-single-source-of-truth approach from 1.5.
declare global {
  interface Window {
    __themeInit: {
      setTheme: (theme: 'light' | 'dark') => void;
      toggleTheme: () => void;
      currentEffectiveTheme: () => 'light' | 'dark';
    };
  }
}

export {};
