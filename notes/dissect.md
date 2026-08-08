---
title: dissect
brain-id: 754df55f-4a28-41a4-9329-59f058db8034
---

`dissect` parses a line by cutting it at the exact delimiters written between fields: `%{client} - %{duration}` means "everything up to `-` is client, the rest is duration." One left-to-right pass, no regex engine, no backtracking — which is why it costs a fraction of grok on high-volume streams. The price is rigidity: each rule handles exactly one layout, so a stray extra space or a reordered field breaks the match. Use dissect when the format is fixed (your own app logs, machine-generated output) and reserve grok for lines whose shape varies.
