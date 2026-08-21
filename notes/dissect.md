---
title: dissect
date: 2026-08-05
brain-id: 754df55f-4a28-41a4-9329-59f058db8034
tags: [elasticsearch, service]
---

In [Logstash](logstash.md) `dissect`  is a filter plugin that parses a line by cutting it at the exact delimiters written between fields: `%{client} - %{duration}` means "everything up to `-` is client, the rest is duration." One left-to-right pass, no regex engine, no backtracking — which is why it costs a fraction of [grok](grok.md) on high-volume streams. The price is rigidity: each rule handles exactly one layout, so a stray extra space or a reordered field breaks the match. 

Use dissect when the format is fixed (your own app logs, machine-generated output) and reserve [grok](grok.md) for lines whose shape varies: [grok vs dissect](grok-vs-dissect.md)

## Related

- [grok vs dissect](grok-vs-dissect.md)

