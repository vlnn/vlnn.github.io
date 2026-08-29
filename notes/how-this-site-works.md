---
title: How this site works
date: 2026-07-29
tags: [meta, site]
---

This site is a pile of plain text files pretending to be an app. Notes live as raw `.org` **and** `.md` files; your browser fetches the file and renders it with [uniorg](https://github.com/rasendubi/uniorg) or remark. The only thing computed ahead of time is `index.json` — titles and the link graph, because backlinks are a global property no single file can know about itself.

It's nice to have all the textual stuff as files -- until you want to interconnect it. For that reason I wrote a [TheBrain](https://thebrain.com) `brz` files into `md` [converter](a2b_converter.md). 

The stacked panes view copy [Andy Matuschak's notes](https://notes.andymatuschak.org/About_these_notes): each link you follow opens a pane to the right, and the whole trail is encoded in the URL, so any view is a shareable permalink.
