---
title: Threading Macros
date: 2026-11-07
brain-id: e685f4a9-34a8-46cd-b7d4-3701820a6087
---

Threading macros flatten deeply nested calls into a top-to-bottom pipeline making code more readable:

```
(reduce + (interpose 5 (map inc (range 10))))
```
becomes
```
(->> (range 10) (map inc) (interpose 5) (reduce +))
```
or, formatted
```
(->> (range 10) 
     (map inc)
     (interpose 5) 
     (reduce +))
```

The two basic macros differ only in *where* the value is inserted into each step:
* `->>` (thread-last) puts it as the **last** argument — fits [sequence functions](sequence-functions.md), which take the collection last.
* `->` (thread-first) puts it as the **first** argument — fits collection functions like `assoc`, `update`, `conj` and Java interop, which take the object first.

```
(-> {} 
    (assoc :a 1) 
    (update :a inc))
=> {:a 2}
```

The rest add semantics on top of the rewrite, so they are not just about readability:
* `some->` / `some->>` stop and return `nil` as soon as any step yields `nil`, instead of passing `nil` further down.
* `cond->` / `cond->>` run each step only if its paired condition holds; the value flows through the skipped steps unchanged.
* `as->` names the value, for pipelines where it lands in a different position at each step.

```
(cond-> {}
  true     (assoc :a 1)
  false    (assoc :b 2))
=> {:a 1}
```
