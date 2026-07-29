# vlnn.dev notes — stacked org notes

Andy-Matuschak-style stacked panes for plain org and markdown files, served as static files. The deployed site *is* the source tree: notes ship as raw `.org`/`.md`, parsed in the browser by bundled [uniorg](https://github.com/rasendubi/uniorg) and remark (GFM enabled). The only generated artifact is `index.json` (titles + link graph for backlinks and pane headers).

```
index.html            shell
app.js                pane stacking, link interception, history
notes.css             styles
vendor/org.js         uniorg bundled for the browser (prebuilt, committed)
vendor/entry.mjs      bundle source (rebuild: make bundle)
notes/*.org           the notes — this is where you write
static/               images
index.json            generated: slug → {title, date, tags, links, backlinks}
tools/build_index.py  index generator (pytest-tested)
tools/build_feed.mjs  rss generator (node-tested, reuses vendor/org.js)
rss.xml               generated: full-content RSS 2.0 feed
```

## Run locally

```sh
make serve            # builds index.json if stale, serves on :8000
```

Local development needs only Python + uv. Node is not required: the browser runs the committed `vendor/org.js` bundle, and `rss.xml` is generated in CI on deploy. If you do have node, `make rss.xml` builds the feed locally and `make test-js` runs the JS-side tests.

Open http://localhost:8000/?stackedNotes=about-these-notes

## Tests

```sh
make test             # pytest for the index builder (python only)
make test-js          # stack/url/timeline/feed logic (needs node; CI always runs it)
```

## Writing notes

Add `notes/my-note.org` (`#+title:`, optional `#+date:`, `#+filetags:`) or `notes/my-note.md` (YAML frontmatter with `title`, `date`, `tags`; falls back to the first `#` heading). One slug namespace across both formats — `foo.org` and `foo.md` together is a build error. Link between notes with bare relative filenames, formats mixing freely:

```org
See [[file:other-note.org][the other note]] and [[file:md-note.md][that one]].
```

```md
See [the other note](other-note.org) and [that one](md-note.md).
```

Links pointing at notes that don't exist are dropped from the index, so documentation examples and drafts don't pollute the graph. In rendered notes the two link kinds read differently: internal note-links are ochre with a dotted underline (a pane will slide in beside you), external links are blue with a solid underline and a small ↗ (you're leaving the site).

Clicking such a link opens the target as a new pane; the trail is encoded compactly in `?stack=slug,slug,...` so any view is shareable (the older `?stackedNotes=a&stackedNotes=b` form still parses, so old links and feed permalinks keep working).

Each pane's modeline carries a `×` that closes exactly that pane — last, middle, or first — leaving the rest of the stack intact; the control is disabled on the only remaining pane. `q` closes the last pane from the keyboard (Emacs kill-buffer vibes).

Tags are links. Clicking a tag — in a modeline, under a note title, or in the timeline pane — replaces the current stack with *all* notes carrying that tag, oldest first (undated ones last), so a tag reads left-to-right as a chronological thread. It's still an ordinary `?stack=...` URL, so tag views are shareable like any other trail.

Author shortcut: press `y` to copy the current trail to the clipboard as an org list of `[[file:...]]` links — paste it into a new note to crystallize a research trail into the garden. Deliberately keyboard-only, invisible to readers. Backlinks are computed by `build_index.py` — rerun `make index.json` (or just `make serve`) after editing.

## Timeline and RSS

On desktop a time arrow runs along the bottom: every dated note is a dot on a density-aware axis (60% linear time, 40% rank order — clusters decompress, empty years stay visibly empty, chronology stays monotone). Dot size encodes connectedness (links + backlinks, √-scaled 9–17px), dots in the current stack are highlighted blue, hover shows date and title, click opens the note as a new pane. Same-day notes stack onto up to three lanes. Above the axis, thin arcs connect linked notes (mutual links collapse into one arc); hovering a dot lights up its arcs in green and dims the rest. Hidden on mobile.

The timeline pane is a synthetic note (open `?stackedNotes=timeline` or the header link) rendered client-side from `index.json` — chronological, grouped by year, zero extra build artifacts. The RSS feed at `rss.xml` is generated in CI on every deploy (`make rss.xml` locally if you have node) and contains full note HTML rendered by the *same* bundled parser the browser uses, so feed readers see exactly what the site shows. Permalinks point into the stacked view.

## Type scale

Desktop body text is `--text: 20px` at the top of `notes.css`; headings, backlinks, and the title scale from it. Pane width is `--pane-width: clamp(520px, 33.3vw, 760px)` — roughly a third of the viewport, Matuschak-style, so ~3 panes fit side by side, clamped to keep the measure readable (~55–70 characters per line at 20px). To go bigger or smaller, change `--text` and the clamp bounds together. Mobile overrides `--text` to 16.5px in the media query.

## Mobile

Under 700px the stacked panes collapse to one note at a time with a breadcrumb trail at the top — tap a chip to jump back to that point (the URL still encodes the full stack, so permalinks work identically on both layouts). The layout switches live on resize.

## Deploy to GitHub Pages

The included workflow (`.github/workflows/pages.yml`) tests, builds `index.json` and `rss.xml`, and publishes on every push to `main`. One-time setup:

```sh
cd notes-site
git init -b main
git add -A && git commit -m "stacked notes"
git remote add origin git@github.com:vlnn/NOTES-REPO.git
git push -u origin main
```

1. On GitHub: repo **Settings → Pages → Build and deployment → Source: GitHub Actions**. This must be set before the first workflow run succeeds — until then `deploy-pages` fails with a "Pages not enabled" error; just re-run the job after flipping it.
2. Push (or re-run the failed workflow). The run does: pytest → build `index.json` → node tests → build `rss.xml` → upload the whole tree → deploy. The site lands on `https://vlnn.github.io/NOTES-REPO/`.
3. Custom domain: **Settings → Pages → Custom domain** → e.g. `notes.vlnn.dev`, plus a DNS `CNAME` record `notes → vlnn.github.io`. GitHub writes a `CNAME` file; also commit one (a file named `CNAME` containing the bare domain) so deploys don't drop the domain. Tick "Enforce HTTPS" once the cert issues.

To take over `vlnn.dev` itself, push this tree to the existing `vlnn/vlnn.github.io` repo instead (its `CNAME` already says `vlnn.dev`) and switch that repo's Pages source from "Deploy from a branch" to "GitHub Actions" — the old org-static-blog HTML files can coexist untouched during a transition, since this site only claims `index.html`, `app.js`, `notes.css`, `notes/`, `vendor/`, `index.json`, and `rss.xml` (note: `rss.xml` would shadow the old blog feed; keep the old one as `index.xml` if you still publish it).

All asset paths are relative, so the same tree works at the domain root, under `/NOTES-REPO/`, or any other prefix without configuration. Rollback is `git revert` + push — the deploy is a pure function of the tree.

## Migrated content

All ten posts from the org-static-blog era live here under readable slugs; `about-these-notes.org` is the entry point linking into everything, so backlinks have somewhere to start from.
