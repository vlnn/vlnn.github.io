---
title: Lucene
date: 2026-08-05
tags: [elasticsearch]
brain-id: 9dba4c08-5eac-4c9f-a4f6-223062554c52
---

Lucene is a Java library for full-text search, which is used by Elasticsearch, Apache Solr, Opensearch.

The main staple is the immutability: A Lucene index is a collection of *segments*, and a segment, once written, is never modified. No insert means better compression and no cache invalidation.
