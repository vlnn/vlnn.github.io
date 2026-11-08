---
title: Cohesion
date: 2026-11-08
brain-id: a767d1e1-7de5-4e04-be7a-e550f737df05
---

**Cohesion** is the degree to which the things inside one module belong together: they change for the same reasons and are used together. High cohesion means a reader who opens the module finds everything relevant there and little that isn't. It is the complement of coupling, which measures how much a module depends on things outside itself.

A language can nudge code toward cohesion through the cost structure of its module system. Clojure's namespaces are an example. Calling within a namespace is bare, while calling across namespaces needs a `require` and a qualified name. The language design thus makes local references cheap and distant ones slightly costly, nudging the programmer to keep related things together; and every cross-namespace dependency is declared in the `ns` form at the top of the file, which keeps the coupling visible.
