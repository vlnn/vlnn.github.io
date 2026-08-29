---
title: Basis of Vector Space
date: 2026-08-16
tags: [math]
brain-id: 1222914b-e155-4724-922c-66844b0ada72
---

A basis is a minimal set of "building blocks" for the space. A set of vectors {v₁, ..., vₙ} is a basis if it satisfies two conditions:
1. **Spanning**: every vector in the space can be written as a linear combination c₁v₁ + c₂v₂ + ... + cₙvₙ. The blocks reach everything.
2. **Linear independence**: no vector in the set can be written as a combination of the others (equivalently, the only combination giving the zero vector is the trivial one, all cᵢ = 0). There's no redundancy.

A useful way to think of it: a basis is a [coordinate system](coordinate-system.md) you install on the space. The space exists without it, but the basis is what lets you turn geometric objects into lists of numbers you can compute with.

## Related

- [Coordinate System](coordinate-system.md)

