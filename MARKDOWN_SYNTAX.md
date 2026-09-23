# Markdown syntax reference

Every piece of markup this site accepts beyond plain CommonMark/GFM, with
the exact string each remark/rehype plugin looks for. Read this while
drafting an article body — [ARTICLE_GUIDE.md](ARTICLE_GUIDE.md) covers
voice and frontmatter; this covers what the parser actually understands.
Every rule here is enforced by a plugin in
[astro.config.mjs](astro.config.mjs) / [src/plugins/](src/plugins/) — get
the exact string wrong and the build fails with a specific error, not a
silent fallback. Source of truth if this drifts: the plugin file named in
each section.

## What's already CommonMark/GFM — no special syntax needed

Standard: `**bold**`, `*italic*`, lists, inline `` `code` ``, links,
images, tables, `~~strikethrough~~`, autolinks. `smartypants` is on, so
straight quotes and `--`/`---` become curly quotes and en/em dashes
automatically — type them plain, don't hand-enter `—`/`–`/curly quotes
except where a rule below requires a literal `—`.

## Headings — numbered sections are authored, not generated

- `## 01 · Title` — h2 only, zero-padded two-digit number, a middle dot
  (`·`, U+00B7, not a hyphen or bullet), contiguous from `01` with no gaps.
  Skipping a number fails the build.
- `### 1.1 · Title` — h3 subsection. The number before the dot must match
  its parent h2's number (`5.1` under `## 05 · …`, not zero-padded).
- **No `h4`, anywhere.** Fails the build immediately, before any other
  check runs. Split into more `##` sections instead.
- An unnumbered heading (no `NN ·` / `n.m ·` prefix) is left alone, not
  rejected — this is how the auto-generated `REFERENCES` footnotes heading
  coexists with a fully-numbered article.
- Fewer than three numbered h2 sections → no table of contents is rendered.
  This is automatic; nothing to author.

Plugins: `remark-heading-depth.ts` (h4 ban), `remark-section-numbers.ts`
(numbering).

## Callouts — `:::note` / `:::warning` / `:::correction`

```text
:::note
Prose only. No nested directive, no code block inside.
:::
```

Three kinds only — anything else fails the build with "not implemented":

| Kind         | Use it for                                                       |
| ------------ | ---------------------------------------------------------------- |
| `note`       | A skippable aside.                                               |
| `warning`    | Something the reader must not skip.                              |
| `correction` | Flagging that something stated earlier in the article was wrong. |

Rules: never nested, never contains a code block, closing `:::` required.

Plugin: `remark-directives.ts`.

## Figures — `:::figure{kind="…"}`

```text
:::figure{kind="diagram"}
![Alt text describing the diagram](./architecture.svg)

Fig. 1 — Caption text.
:::
```

- `kind` is required and must be `diagram`, `screenshot`, or `photo` — no
  default, nothing inferred.
- Must wrap exactly one `![alt](src)` image with **non-empty alt text** —
  an empty alt fails the build (decorative images don't exist in this
  design).
- The caption (`Fig. n — …`) goes **inside** the directive, after the
  image — the one block kind where the caption isn't a following sibling.
- `diagram` and `photo` get dimmed ~92% in dark mode; `screenshot` doesn't
  (dimming a UI capture would misrepresent it) and sits on a sunken ground
  instead.
- Tap-to-full-size only applies to `kind="diagram"` with an **absolute**
  path (`/foo.svg`, served untouched from `public/`). A relative path
  (`./foo.svg`) goes through Astro's image pipeline instead and is never
  wrapped for full-size.

Plugin: `remark-directives.ts` (same file as callouts).

## Code fences

Every fence needs an explicit language — no lang, or an unknown one, fails
the build. Use `plaintext` for verbatim non-code text. Full closed list:

```text
yaml, toml, ini, json, jsonc, dotenv, diff, dockerfile, nginx, systemd,
hcl, sql, jinja, bash, python, html, css, markdown, http, c, cpp, rust,
go, typescript, javascript, asm, terminal, plaintext
```

**Every fence except `terminal` needs `title="…"`** — the full
repo-relative path, not a basename (`title="src/routes/index.ts"`, not
`title="index.ts"` — a bare filename fails the build):

````text
```yaml title="ansible/roles/monitoring/tasks/main.yml"
````

- **Highlight lines**: append `{14-16}` after the title
  (` ```yaml title="a.yml" {14-16} `) — a Shiki transformer reads it
  straight from the fence meta, tints those lines.
- **Line-number gutter** appears automatically above 12 lines. Don't
  author numbers yourself.
- **`diff` fences**: use the real, literal convention — a leading `+`, `-`,
  or space in column 0 of each line, exactly like a real diff. Not the
  `[!code ++]`/`[!code --]` comment notation some tools use; that's not
  supported here.

### Terminal blocks — a distinct pseudo-language

````text
```terminal host="pi-04"
$ ansible-playbook site.yml --limit pi-04
[+] converged, 14 changed
```
````

- `host="…"` is required (no `title=`) — renders as `TERMINAL — PI-04` in
  the chrome bar.
- No syntax highlighting, no gutter, no copy button.
- Exactly two lines get hand-coloured, only when the marker is at column 0
  of the line: `$` (prompt) and `[+]` (success marker). Nothing else is
  colored — don't expect other ad-hoc markers to render specially.

Plugin: `remark-code-meta.ts`.

## Captions — required after every code, terminal, figure, and table block

```text
Listing 1 — What to notice about this code.
Table 1 — What this table omits.
Fig. 1 — What to notice in the figure.
```

- Exact label per kind: **code and terminal blocks share one `Listing`
  counter**; figures use `Fig.`; tables use `Table`. Using the wrong label
  for the block kind fails the build.
- Must use a real em dash (`—`), and the number must be contiguous from 1
  _within that kind_, across the whole article — skipping or reusing a
  number fails the build.
- For code/terminal/table: the caption is the next paragraph immediately
  after the block. For figures: it's the caption paragraph inside the
  directive (see above).
- A caption-shaped paragraph found anywhere else (not immediately after a
  captionable block) fails the build as orphaned.
- Don't wrap it in `_italics_` — emphasis is stripped programmatically, so
  it renders identically whether you italicize it or not. Just write it
  plain.

Plugin: `remark-captions.ts`.

## Tables (GFM, with two extra conventions)

Standard GFM pipe tables. Two things layered on top:

- An explicit **left-align** marker (`:---`) on a non-first column marks
  it as a "prose" cell (explanatory text, not data) and gets different
  typography. An unmarked column (no colon) is an ordinary left-aligned
  data column — visually similar, semantically different. Use `:---`
  deliberately when a column is explanatory text.
- `---:` right-aligns a column — use for numeric/date columns.
- An inline `` `code` `` span **inside a table cell** that's 20+ characters
  (e.g. a `sha256:…` digest) is automatically middle-truncated with the
  full value on hover and in the selectable text — don't manually shorten
  a long identifier in a table, just write it in full and let the table
  handle it.
- Needs a `Table n — …` caption immediately after it, same rule as above.

Plugin: `rehype-table-region.ts` (truncation/alignment), `remark-captions.ts`
(caption).

## Footnotes — standard GFM

```text
Reference in prose.[^1]

[^1]: The definition, can be multiple paragraphs if indented.
```

Standard GFM footnote syntax, nothing non-standard in how you author it.
Two rendering differences from GFM's default, both automatic:

- The generated section heading reads `REFERENCES`, not "Footnotes".
- The back-reference glyph is `←`, not the default `↩`.

Nothing to change in how you write `[^1]` / `[^1]: …` — just know the
output looks different from GFM's defaults elsewhere.

## Blockquotes — plain CommonMark, one styling convention

```text
> Quoted text.
>
> — Attribution, if any
```

Plain `>` blockquote, no directive. **Convention** (not build-enforced):
if the quote has an attribution, put it as the quote's _last_ paragraph,
starting with an em dash (`—`). A single-paragraph quote gets no
attribution styling; a multi-paragraph quote's last paragraph is styled as
a small attribution line automatically.

## Links

- Any `http(s)://` link whose origin differs from the site's own gets a
  trailing hair-space + `↗` appended automatically as real text — **don't
  type `↗` yourself**, it'll double up.
- Internal links (`[text](/w/001)`) aren't validated by the content build
  — a dead one is only caught by `pnpm check:links` (lychee) against the
  built site. Write real, resolvable paths.

## Things with no markdown syntax at all

- Word count / reading time — computed automatically from the full text
  (200 wpm). Nothing to author. Over 8,000 words logs a build warning
  (not a failure) suggesting a `series` split.
- Any directive name other than `note`, `warning`, `correction`, `figure`
  — fails the build immediately as "not implemented." There is no way to
  add a new one from within an article.
