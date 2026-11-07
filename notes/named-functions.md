---
title: Named Functions
date: 2026-11-07
brain-id: f44242b2-a508-4c6c-871c-f459b3a8d59e
---

Named functions are [anonymous functions](anonymous-functions.md) bound to a symbol used as an identifier. Clojure provides a [special form](special-forms.md) called `def` that creates a *[var](var.md)* in the current [namespace](namespace.md) and binds a value to it.

```
(def double
  (fn [x] (* 2 x)))
```

or  simply:

```
(defn square [x]
  (* x x))
```

The body of the function can consist of multiple expressions:


```
(defn bmi [height weight]
  (println "height:" height)
  (println "weight:" weight)
  (/ weight (* height height)))
```
All the expressions are evaluated from the inside out and top to bottom. Only the result from the last expression is returned from the function.

Clojure uses a single-pass compiler, so the functions should be declared before they are used either with their definition, or special macro that provides a forward declaration:

```
(declare down)

(defn up [n]
  (if (< n 10)
    (down (+ 2 n))
    n))

(defn down [n]
  (up (dec n)))
```

There is no syntactic distinction between functions and variables. You can bind a function to a label, pass it as a parameter, or return a function from another function. Functions that can be treated as data are referred to as being first-class because they don't have any additional restrictions attached to them.

## Related

- [Namespace](namespace.md)
- [Var](var.md)

