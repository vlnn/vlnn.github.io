---
title: Sequence Functions
date: 2026-11-07
brain-id: e65f7d2b-3eae-49df-9fc0-db085ef64bc4
---

**Sequence functions** are the part of `clojure.core` that works on anything *[seqable](seqable.md)* — lists, vectors, maps, sets, strings, Java collections, and [lazy sequences](lazy-sequences.md) themselves. They are built on one abstraction, the [seq](seq.md): `(seq coll)` gives a logical list with `first` and `rest`, and every sequence function accepts anything `seq` can turn into one. Because of this, the same `map`, `filter` or `reduce` works regardless of the underlying collection type.

They fall into a few groups:
* **Producers**: `range`, `repeat`, `iterate`, `cycle`, `repeatedly`
* **Transformers**: `map`, `filter`, `remove`, `mapcat`, `keep`, `partition`, `interpose`
* **Selectors**: `take`, `drop`, `take-while`, `drop-while`, `nth`, `some`, `first`, `rest`
* **Consuming**: `reduce`, `into`, `count`, `apply`, `doseq`, `run!`

Producers, transformers and selectors return [lazy sequences](lazy-sequences.md), whose elements are computed only when consumed; consumers are eager and realize whatever they are given. 

Sequence functions never modify their argument — they return a new sequence — and most take the collection as the **last** argument, which is why they compose naturally with `->>`.

## Related

- [Seq](seq.md)
- [Seqable](seqable.md)

