---
title: Reusability
date: 2026-11-07
brain-id: 3a436f1a-8bf5-4b5f-854a-0ce7a7ac3050
---

### Reusability in programming
Composition in OOP is based on objects. Each object stores a fixed data shape, mutable state and a set of operations over them. Thus object are domain bound by definition, so it needs adapters or wrappers to even partially reuse object in different domain. 
Clojure separates this machinery into three: 
* Data is maps (or records),
* Functions accept any map with the right keys, 
* State lives outside of data, in few explicit references (atoms, refs).
Thus composing is just calling functions on data, with nothing to adapt.

Clojure encourages to represent problem solution in terms of data transformations.  There is a powerful set of common data structures (lists, vectors, maps, sets) and cleverly designed set of compatible operations. With this approach the function becomes the core reusable component.

So programmer writes down the problem solution as a sequence of transformations (which is the composition), and then writes a function (or re-uses existing one) for each step of the sequence.

> [!example]
> Instead of writing a loop with the logic inside it, a Clojure programmer uses a higher-order function that takes the logic as a function parameter. Such a function is written once and, being general and domain-independent, handles its own concerns — edge cases, boundary checks, laziness — without being intertwined with the application’s business logic.
