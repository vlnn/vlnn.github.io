---
title: HNSW graphs
tags: [data-structure]
brain-id: fc1c2cc5-716c-4953-a788-8bf936fbc97f
---

Hierarchical Navigable Small World graph is a data structure for nearest-neighbor search: 

* **in**: query vector, 
* **out**: `k` closest vectors out of millions (without comparing against all of them)

Resolved with hierarchy: several linked layers with increasing density.

```test
Q: What goes in and what comes out of an HNSW search?
A: In: a query vector. Out: the `k` closest vectors out of millions, without comparing against all of them.
Q: How does HNSW avoid comparing the query against every vector?
A: Hierarchy — several linked layers with increasing density.
```
