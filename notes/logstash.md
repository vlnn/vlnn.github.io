---
title: Logstash
date: 2026-08-05
tags: [elasticsearch]
brain-id: 6b7c2659-46cd-4209-a586-b6cb155859ea
---

I see a [Logstash as pluggable pipeline](logstash-as-pluggable-pipeline.md), not mere logs ingestion module. 

It makes even more sense due to [immutability](immutability.md) by design for the indexed data: instead of calculate/transform in the Elasticsearch/[Lucene](lucene.md) runtime during the query. Properly designed pipeline will readily provide precalculated/pretransformed data by request; this precalculation should be done by [Logstash](logstash.md) as well.

## Related

- [Logstash as pluggable pipeline](logstash-as-pluggable-pipeline.md)

