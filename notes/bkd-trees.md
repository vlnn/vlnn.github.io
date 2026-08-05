---
title: BKD trees
date: 2026-08-05
tags: [data-structure]
brain-id: baba30fe-c16e-479c-adaa-88d7719a69ea
---

**B**lock **k**-**d** tree — a disk-friendly variant of the k-d tree: classic k-d tree has one point per leaf — terrible for disk, \~100 bytes are stored in \~4KB disk block. The BKD variant packs points into large leaf *blocks*(512–1024 points in Lucene)

## Related

- [K-d Tree](k-d-tree.md)

