---
title: How this site works
date: 2026-07-29
tags: meta site
---

This site is a pile of plain text files pretending to be an app. Notes live as raw `.org` **and** `.md` files; your browser fetches the file and renders it with [uniorg](https://github.com/rasendubi/uniorg) or remark. The only thing computed ahead of time is `index.json` — titles and the link graph, because backlinks are a global property no single file can know about itself.

The stacked panes copy [Andy Matuschak's notes](https://notes.andymatuschak.org/About_these_notes): each link you follow opens a pane to the right, and the whole trail is encoded in the URL, so any view is a shareable permalink.

Notes link to each other by bare relative filenames, and formats mix freely — this markdown note links back to the org-mode [entry note](about-these-notes.org), and org notes can link to `.md` the same way:

| format | metadata | link syntax |
|--------|----------|-------------|
| org | `#+title:` etc. | `[[file:slug.org][text]]` |
| md | YAML frontmatter | `[text](slug.md)` |
