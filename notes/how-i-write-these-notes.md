---
title: How I write these notes
date: 2026-08-08
brain-id: 963d09d7-ffc6-4721-9388-e432fb303b26
tags: [meta, writing]
---

*(historical: I started writing all notes in plain .org format using old trusty Emacs. This was good for 10 notes, it's awful for 100 notes)*

I'm writing this note (and most of the notes on this site) using [TheBrain](thebrain.md). This allows me to have the controlled overview of the linked notes. This also means that I have to publish it with custom exporter, which I do.

![](../static/brain/how-i-write-these-notes/963edc23-6e5d-4555-9a1d-c33928bd625c.png)

You can see that links for [brainsync](a2b_converter.md) and [TheBrain](thebrain.md) and [Evergreen notes](evergreen-notes.md) are shown (semi)automatically — for most of then I have to right click on plain text and choose "link NodeName".

Then to publish it's only a matter of `brainsync sync --notes-dir ./local-dir/notes` and `git add .`  `git commit "new entry"`  `git push`  from blog directory.

## Related

- [About these notes](about-these-notes.md)
- [TheBrain](thebrain.md)
- [brainsync](a2b_converter.md)

