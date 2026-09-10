// remark-code-meta.ts — Phase 4.1's minimal slice; Phase 4.3 extends this
// file with the rest of its eventual job (title=/{a-b} meta parsing, the
// chrome-bar wrapper node). Same shape as remark-directives.ts in Phase 3.3,
// which shipped scoped to callouts only and threw loudly on ":::figure"
// (Phase 4's) rather than silently doing nothing for a phase and a half —
// this plugin ships scoped to ONE check (the fence language exists in the
// closed vocabulary, consts.ts's CODE_LANGS) because that's the one part of
// 4.3's eventual job that Phase 4.1's own exit criterion depends on: Shiki
// never throws on an unknown grammar (@astrojs/internal-helpers' highlighter
// wrapper try/catches loadLanguage and falls back to "plaintext" with only a
// console.warn — confirmed by reading its source, not assumed), which is how
// `jinja2` sat silently unhighlighted in the Phase 3 fixture. A warning in a
// build log is not enforcement; this plugin is.
//
// Runs in the remark chain BEFORE remark-rehype/rehypeShiki (all remark
// plugins do, by construction of @astrojs/markdown-remark's pipeline — see
// ADR-0019 through 0021's Phase 4.0 research), so an invalid language fails
// the build before Shiki ever gets a chance to swallow it.

import { visit } from 'unist-util-visit';
import { CODE_LANGS } from '../consts.ts';

const VALID = new Set<string>(CODE_LANGS);

export default function remarkCodeMeta() {
  return (tree: any, file: any) => {
    const path = file.path ?? 'unknown file';

    visit(tree, 'code', (node: any) => {
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
    });
  };
}
