# vlnn.dev notes

Andy-Matuschak-style stacked panes blog engine based on plain org and markdown files, served as static files. The deployed site *is* the source tree: notes ship as raw `.org`/`.md`, parsed in the browser by bundled [uniorg](https://github.com/rasendubi/uniorg) and remark (GFM enabled). The only generated artifact is `index.json` (titles + link graph for backlinks and pane headers).

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

Clicking such a link opens the target as a new pane; the trail is encoded compactly in `?stack=slug,slug,...` so any view is shareable (the older `?stackedNotes=a&stackedNotes=b` form still parses, so old links and feed permalinks keep working).

Each pane's modeline carries a `×` that closes exactly that pane — last, middle, or first — leaving the rest of the stack intact; the control is disabled on the only remaining pane. `q` closes the last pane from the keyboard (Emacs kill-buffer vibes).

## Timeline and RSS

On desktop a time arrow runs along the bottom: every dated note is a dot on a density-aware axis (60% linear time, 40% rank order — clusters decompress, empty years stay visibly empty, chronology stays monotone). Dots in the current stack are highlighted blue, hover shows date and title, click opens the note as a new pane. Same-day notes stack onto up to three lanes. Hidden on mobile.

The timeline pane is a synthetic note (open `?stackedNotes=timeline` or the header link) rendered client-side from `index.json` — chronological, grouped by year, zero extra build artifacts. The RSS feed at `rss.xml` is generated in CI on every deploy.

## Type scale

Body text is the system sans stack (`--sans`, Matuschak-style — SF on Mac, Segoe on Windows, zero webfont bytes) at `--text: 18px`; headings, backlinks, and the title scale from it. All mono surfaces — spines, modelines, tags, timeline dates, tooltips, code — use [Departure Mono](https://departuremono.com) (Helena Zhang, OFL), self-hosted at `static/fonts/` with its license, ~22KB woff2, no third-party requests. Mono sizes are whole pixels on purpose: it's a pixel-grid font and fractional sizes blur it. Pane width is `--pane-width: clamp(520px, 33.3vw, 760px)` — roughly a third of the viewport so ~3 panes fit side by side, clamped to keep the measure readable. To go bigger or smaller, change `--text` and the clamp bounds together. Mobile overrides `--text` to 16.5px in the media query.

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
2. Push (or re-run the failed workflow). The run does: pytest → build `index.json` → node tests → build `rss.xml` → upload the whole tree → deploy. 

All asset paths are relative, so the same tree works at the domain root, under `/NOTES-REPO/`, or any other prefix without configuration. Rollback is `git revert` + push — the deploy is a pure function of the tree.
