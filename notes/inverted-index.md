---
title: Inverted Index
date: 2026-08-05
brain-id: 340366fd-64ba-423a-a3f7-225ccb0a2260
---

tokenization and rotating the index:<br><br>
```
doc1: "the quick brown fox"
doc2: "the lazy dog"
doc3: "quick dog"
```
becomes
```
brown → [1]
dog   → [2, 3]
fox   → [1]
lazy  → [2]
quick → [1, 3]
the   → [1, 2]
```
