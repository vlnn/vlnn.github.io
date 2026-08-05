---
title: Logstash as pluggable pipeline
date: 2026-08-05
brain-id: 40446b16-d885-4374-aeb1-36c8007f0291
---

Every Logstash pipeline has three stages, and each stage is a slot filled by plugins: the stage contract is fixed, the implementations are swappable. Inputs receive events (a `file` plugin, a `beats` plugin, `kafka`, `http`). Filters transform them — `grok` to parse, `mutate` to rename, `date`, `drop`. Outputs ship them onward, usually via the `elasticsearch` plugin. 

So swapping files for Kafka, or Elasticsearch for S3, becomes a config change, not a rewrite. The value concentrates in the separate filter stage: turning unstructured lines into structured, queryable fields before they hit the index.

## Related

- [grok](grok.md)
- [dissect](dissect.md)

