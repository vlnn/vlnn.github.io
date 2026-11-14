---
title: Destructuring
date: 2026-11-08
brain-id: 0382c94a-2889-4b84-9444-403e4aa000d8
---

Destructuring is the binding of multiple values in a data structure to multiple names, using a binding form that mirrors the structure’s shape. Here `split-with` returns the pair `[(0 1 2 3 4) (5 6 7 8 9)]`, which is destructured into `smaller` and `bigger`:

```
(let [[smaller bigger] (split-with #(< % 5) (range 10))]
    (println smaller bigger))

=>(0 1 2 3 4) (5 6 7 8 9)
```

Destructuring is lenient about missing data: if a name has no corresponding position or key in the value, it is bound to `nil` rather than causing an error — `(let [[a b c] [1 2]] c)` yields `nil`.

But positional destructuring requires a sequential value; on anything else it throws:

```
(let [[a b] {:a 1 :b 2}]
 #_=>   a)
Execution error (UnsupportedOperationException) at user/eval7009 (REPL:1).
nth not supported on this type: PersistentArrayMap
```
