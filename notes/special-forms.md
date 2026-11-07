---
title: Special Forms
date: 2026-11-07
brain-id: 0497aeeb-e674-47d0-9279-26372b20c77e
---

Clojure’s core syntax is defined by a small set of *special forms* — the handful of constructs the compiler understands directly, rather than as functions or macros. They *look* like function calls, but they are not: the compiler handles their arguments specially instead of evaluating them all first. You can't `(source a-special-form)`  but you can source any function or macro.

The main ones are `def`  (but not `defn`!), `if`, `do`, `let`, `quote`, `var`, `fn*`, `loop`/`recur`, `throw`/`try`, and the Java interop forms (`.` and `new`).
