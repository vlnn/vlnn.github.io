---
title: K-d Tree
date: 2026-08-05
tags: [data-structure, programming]
brain-id: c6004cf4-18cd-4af5-8e5e-b6759090e115
---

A k-d tree (k-dimensional tree) is a [binary search tree](binary-search-tree.md) for points in k-dimensional space. It generalizes the BST idea: instead of comparing whole keys, each level of the tree compares points along **one axis**, cycling through axes as you descend.
![](../static/brain/k-d-tree/be4796db-4a91-4afa-9300-4961d762bb9d.png)

```test
Q: How does a k-d tree generalize the BST comparison?
A: Instead of comparing whole keys, each level compares points along one axis, cycling through axes as you descend.
```
