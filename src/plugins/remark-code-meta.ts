// remark-code-meta.ts — Phase 4.1 validated the fence language; Phase 4.3
// does the rest of this file's job: parses `title="…"` out of the fence
// meta, validates it (every non-terminal fence needs one, and a basename
// fails rather than degrades — §13.2 wants the full repo-relative path),
// counts source lines to decide whether the gutter appears (§13.2: "only
// above twelve lines"), and wraps the code node in the chrome-bar
// container code.css (Phase 4.2) already has CSS for: `.code-block` >
// `.code-block__chrome` (filename + language token + copy button) +
// `.code-block__body` (gutter, conditional, + the code node itself).
// Phase 4.5 adds the terminal fence's OWN wrapper — `.term-block` >
// `.term-block__chrome` (host label only) + `.term-block__body` (bare
// `<pre><code>`, no gutter) — in the same file rather than a second one,
// because the meta-parsing and SKIP-vs-infinite-recursion machinery below
// is identical for both; only the shape of the wrapper and which meta key
// it reads (`host=` vs `title=`) differ, per §23.4's "share nothing else"
// framing it's still a separate branch producing a separate hName tree,
// not a shared one with an if inside it.
//
// Same hName/hProperties technique as remark-directives.ts's callout
// wrapper (Phase 3.3): synthetic mdast nodes carrying `data.hName`/
// `data.hProperties` are what mdast-util-to-hast turns into real elements,
// with the ORIGINAL `code` node nested unchanged inside — mdast-to-hast's
// own `code` handler (lib/handlers/code.js) is what builds `code`'s
// `<pre><code>` shape, completely unaffected by whatever hast the plugin
// wraps it in. That nesting is why this has to be a REMARK plugin and not
// rehype: `rehypeShiki` runs BEFORE user rehype plugins and replaces the
// `<pre>` wholesale (@astrojs/markdown-remark's highlight.js:
// `grandParent.children[index] = replacement`) — a rehype plugin never
// sees the pre-Shiki `<pre>` to wrap in the first place, but a remark
// plugin wrapping the mdast `code` node puts the wrapper OUTSIDE the node
// Shiki later replaces, so the wrapper survives untouched.
//
// Terminal fences (`lang === 'terminal'`) get their own, much smaller
// wrapper — no title, no language token, no copy control, no gutter, just
// a `host="…"` meta key read into the uppercase chrome label §13.3 wants
// (`TERMINAL — PI-02`). The `code` node itself is left completely
// untouched inside `.term-block__body`: `markdown.syntaxHighlight.
// excludeLangs` (astro.config.mjs) is what keeps Shiki from touching it,
// and `rehype-terminal.ts` (Phase 4.5) is what later wraps its `$ `
// prompt and `[+]`-style success markers — both stages need the plain,
// unwrapped mdast/hast `code` text to still be there, which is exactly
// what happens when this plugin does nothing to the node besides re-
// parenting it. `plaintext` gets the FULL code-block treatment like any
// other language: it's still Shiki-rendered (just with no grammar to
// tokenize), still needs a title, same as `yaml` or `bash` — only
// `terminal` is architecturally distinct.
//
// The copy button carries `data-copy` but deliberately NOT a
// `data-copy-target` id, correcting ADR-0020's sketch of the attribute:
// any `id` assigned to the code node at this (remark) stage would land on
// the PRE-Shiki `<code>` element (mdast-util-to-hast's `code` handler
// applies `data.hProperties` to that inner element, confirmed by reading
// its source) — and Shiki's wholesale replacement discards that element
// completely, id included, before the page ever renders. Threading an id
// THROUGH Shiki would mean smuggling it inside the meta string for a
// transformer to re-attach, which is a fragile amount of indirection for
// something `button.closest('.code-block').querySelector('pre code')`
// solves directly in the Phase 4.4 island with no id at all.

import { visit, SKIP } from 'unist-util-visit';
import { CODE_LANGS } from '../consts.ts';

const VALID = new Set<string>(CODE_LANGS);

// Only `title="…"` is parsed here. The `{a-b}` highlight range is read
// straight from the raw meta string by `transformerMetaHighlight`
// (astro.config.mjs) inside Shiki itself — parsing it a second time here
// would just be a second place for the two parses to disagree.
const TITLE_RE = /\btitle="([^"]*)"/;

// §13.3's terminal chrome bar — `TERMINAL — PI-02`, sourced from the
// fence's own `host="pi-02"` meta key (Phase 4's own worked example,
// AD-06's fixture: ```terminal host="pi-04"), not a `title=`. Same
// single-capture-group shape as TITLE_RE for the same reason: one meta
// key, one required value, one place to read it from.
const HOST_RE = /\bhost="([^"]*)"/;

// §13.2: numbers appear only above twelve lines. mdast's `code.value` is
// already the fenced content with CommonMark's trailing line ending
// stripped (confirmed against mdast-util-from-markdown's own fenced-code
// tokenizer, not assumed) — splitting on `\n` gives exactly the line count
// Shiki will render, one `.line` span per element.
const GUTTER_THRESHOLD = 12;

function buildGutter(lineCount: number) {
  const numbers = Array.from({ length: lineCount }, (_, i) => ({
    type: 'codeBlockGutterLine',
    data: { hName: 'span', hProperties: {} },
    children: [{ type: 'text', value: String(i + 1) }],
  }));

  return {
    type: 'codeBlockGutter',
    data: {
      hName: 'div',
      hProperties: { className: ['code-block__gutter'], 'aria-hidden': 'true' },
    },
    children: numbers,
  };
}

export default function remarkCodeMeta() {
  return (tree: any, file: any) => {
    const path = file.path ?? 'unknown file';

    visit(tree, 'code', (node: any, index: number | undefined, parent: any) => {
      const lang = node.lang;

      if (!lang) {
        throw new Error(
          `${path}: a fenced code block has no language tag. Every fence ` +
            'must declare one explicitly (§13.2 always shows a language ' +
            'token in the chrome bar) — use ```plaintext for genuinely ' +
            `non-code verbatim text. Valid languages: ${CODE_LANGS.join(', ')}.`,
        );
      }

      if (!VALID.has(lang)) {
        throw new Error(
          `${path}: unknown fence language "${lang}". If this is meant to ` +
            "be a real language, check consts.ts's CODE_LANGS for the " +
            `canonical name (one per language, not every alias — e.g. ` +
            `"bash" not "sh"/"shell", "python" not "py", "yaml" not "yml"). ` +
            `Valid languages: ${CODE_LANGS.join(', ')}.`,
        );
      }

      // Terminal is a separate component (§23.4): its own chrome (an
      // uppercase host label, not a filename+language pair), no gutter,
      // no copy control. Branches off into its own, much smaller wrapper
      // rather than falling through the title/gutter logic below, which
      // is entirely code-block-specific.
      if (lang === 'terminal') {
        const hostMatch = typeof node.meta === 'string' ? node.meta.match(HOST_RE) : null;
        const host = hostMatch?.[1];

        if (!host) {
          throw new Error(
            `${path}: a \`\`\`terminal fence has no host="…". §13.3's ` +
              'chrome bar always shows an uppercase host label ' +
              '("TERMINAL — PI-02") — add e.g. host="pi-02" to the ' +
              "fence's meta string.",
          );
        }

        const termWrapper = {
          type: 'termBlockWrapper',
          data: { hName: 'figure', hProperties: { className: ['term-block'] } },
          children: [
            {
              type: 'termBlockChrome',
              data: {
                hName: 'div',
                hProperties: { className: ['term-block__chrome'] },
              },
              children: [
                {
                  type: 'termBlockLabel',
                  data: {
                    hName: 'span',
                    hProperties: { className: ['term-block__label'] },
                  },
                  children: [{ type: 'text', value: `TERMINAL — ${host.toUpperCase()}` }],
                },
              ],
            },
            {
              type: 'termBlockBody',
              data: { hName: 'div', hProperties: { className: ['term-block__body'] } },
              children: [node],
            },
          ],
        };

        if (index === undefined) return;
        parent.children[index] = termWrapper;
        // Bare SKIP, not `[SKIP, index]` — same infinite-recursion trap
        // the code-block wrapper below already documents: `node` (still
        // typed 'code') is nested unchanged inside this new wrapper, so
        // re-entering at `index` would visit and re-wrap it forever.
        return SKIP;
      }

      const titleMatch = typeof node.meta === 'string' ? node.meta.match(TITLE_RE) : null;
      const title = titleMatch?.[1];

      if (!title) {
        throw new Error(
          `${path}: a \`\`\`${lang} fence has no title="…". §13.2 requires ` +
            'the filename bar to show the full repo-relative path on every ' +
            'code block — add e.g. title="src/routes/index.ts" to the ' +
            "fence's meta string (right after the language).",
        );
      }

      if (!title.includes('/')) {
        throw new Error(
          `${path}: title="${title}" is a basename, not a path. §13.2 ` +
            'wants the full repo-relative path in the filename bar (e.g. ' +
            `"src/routes/index.ts", not "index.ts") — a basename should ` +
            'fail here rather than silently degrade the chrome bar.',
        );
      }

      const lineCount =
        typeof node.value === 'string' ? node.value.split('\n').length : 0;
      const needsGutter = lineCount > GUTTER_THRESHOLD;

      const wrapper = {
        type: 'codeBlockWrapper',
        data: { hName: 'figure', hProperties: { className: ['code-block'] } },
        children: [
          {
            type: 'codeBlockChrome',
            data: { hName: 'div', hProperties: { className: ['code-block__chrome'] } },
            children: [
              {
                type: 'codeBlockFilename',
                data: {
                  hName: 'span',
                  hProperties: { className: ['code-block__filename'] },
                },
                children: [{ type: 'text', value: title }],
              },
              {
                type: 'codeBlockMeta',
                data: { hName: 'div', hProperties: { className: ['code-block__meta'] } },
                children: [
                  {
                    type: 'codeBlockLang',
                    data: {
                      hName: 'span',
                      hProperties: { className: ['code-block__lang'] },
                    },
                    children: [{ type: 'text', value: lang }],
                  },
                  {
                    type: 'codeBlockCopy',
                    data: {
                      hName: 'button',
                      hProperties: {
                        type: 'button',
                        hidden: true,
                        className: ['code-block__copy'],
                        'data-copy': true,
                      },
                    },
                    children: [{ type: 'text', value: 'copy' }],
                  },
                ],
              },
            ],
          },
          {
            type: 'codeBlockBody',
            data: { hName: 'div', hProperties: { className: ['code-block__body'] } },
            children: [...(needsGutter ? [buildGutter(lineCount)] : []), node],
          },
        ],
      };

      if (index === undefined) return;
      parent.children[index] = wrapper;
      // SKIP alone, NOT `[SKIP, index]` (remark-directives.ts's own
      // pattern) — real bug, found by an infinite-recursion stack
      // overflow, not assumed safe by analogy. `[SKIP, index]` tells the
      // PARENT's walk to resume AT `index`, i.e. to re-visit the node
      // that's now sitting there — harmless for a callout wrapper (whose
      // children are ordinary prose, never re-matching "containerDirective")
      // but not here: this wrapper's own children include the ORIGINAL
      // `code` node, unchanged, still typed 'code' — re-visiting it wraps
      // it again, forever. Bare `SKIP` advances to the NEXT sibling
      // instead of re-entering this one, which is all a same-index,
      // one-for-one replacement ever needs.
      return SKIP;
    });
  };
}
