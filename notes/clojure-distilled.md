---
title: Clojure distilled
date: 2026-11-07
tags: [clojure, tbd]
brain-id: 555c8330-3806-4824-810d-2ef284722507
---

> [!warning]
> This is a rewrite of[ Clojure Distilled](https://yogthos.net/ClojureDistilled.html) , and all errors in it should be treated as mine.

Clojure has an extremely simple syntax, but is hard to learn. The reason is conceptual differences from other, more popular languages, which forms the baseline of most professional programmers. There are only two design decisions that explain most of those differences:
1. [Clojure is a Lisp](clojure-is-a-lisp.md)
2. Clojure is [immutable by default](immutability.md)
## Because [Clojure is a Lisp](clojure-is-a-lisp.md) 

1. Syntax is very simple and the core [semantics](semantics.md) are built upon a small amount of [special forms](special-forms.md).
2. Clojure provides a small set of [standard data types](literal-data-types.md) — numbers, strings, keywords, symbols, booleans, `nil` — and four [common collection types](collection.md): lists, vectors, maps and sets. Clojure code is itself written in these data structures, so the same functions you use to process data can process code (upping [Reusability](reusable-programs.md)). This is what makes [metaprogramming](metaprogramming.md) much easier than in other languages.
3. [Writing code](writing-code.md) at the REPL (Read-Eval-Print Loop) is standard in every Lisp. Instead of changing and rerunning the whole program, you make small changes and test them immediately in the running process, which makes development both faster and more enjoyable. The code still lives in files, though, so editors like Emacs (with plugin CIDER), Neovim (with Conjure) or VS Code (with Calva) connect to the running REPL: you evaluate forms straight from the buffer you’re editing and see the result in place, without ever leaving your editor. Visual debugging is also possible.
4. Functions can be [named](named-functions.md) or [anonymous](anonymous-functions.md). Functions that take other functions as parameters or/and return them as results are called [Higher-order functions](higher-order-functions.md). A function returned by other functions is called [closure](closures.md) when it uses bindings from the function that created it.
5. Code written as a tree can be hard to read when the nested calls are deeply nested. To visually flatten the composition [threading macros](threading-macros.md) can be used.
6. At a larger scale, Clojure organizes code into [namespaces](namespace.md): each [var](var.md) lives in a [namespace](namespace.md) and has a qualified name, so names in different [namespaces](namespace.md) never collide, and a [namespace](namespace.md) uses `require` to make others’ names available to it. This small asymmetry between local and cross-namespace calls nudges code toward high [cohesion](cohesion.md).
7. Polymorphism is provided either through [multimethod](multimethods.md)s or [protocols](protocol.md). Usually you want [multimethods](multimethods.md) until you need type-based [dispatch](dispatch.md) ([records](records.md), Java types) or raw speed.

## Because it is [immutable by default](immutability.md)

1. Clojure encourages composing pure functions that transform [immutable data](immutability.md): "changing" a map returns a new map and leaves the old one intact, so a function can be understood from its arguments alone (see also [Reusability](reusable-programs.md)).
2. Top-level "variables" are actually constants: a `def` names a value and the program never writes to it again.
3. Loops are unusual, because [immutable](immutability.md) [collections](collection.md) leave nothing to mutate inside the loop body; `loop` and `for`  exist, they aren't that ubiquitous -- instead you pass the per-element logic to [sequence functions](sequence-functions.md). 
4. The [sequence functions](sequence-functions.md) (`map`, `filter`, `range`) return [lazy sequences](lazy-sequences.md), whose elements are computed only when consumed. Laziness is safe only because the source data cannot change between the moment the sequence is created and the moment it is consumed.
5. Shared mutable state has to be asked for by name. It is supported through [atoms](atoms.md) for independent updates to a single identity or STM-backed [refs](refs.md) for coordinated updates across several identities within one transaction. Either way the value inside stays immutable; only the reference moves from one value to the next.
6. Because data is plain maps and vectors rather than objects with accessors, [destructuring](destructuring.md) is used to declaratively access values in data structures, both in `let` bindings and in function parameters.

## Related

- [Destructuring](destructuring.md)
- [Special Forms](special-forms.md)
- [Scalability by default](clojure-helps-to-scale.md)
- [Higher-order functions](higher-order-functions.md)
- [Refs](refs.md)
- [Closures](closures.md)
- [Reusability](reusable-programs.md)
- [Atoms](atoms.md)
- [literal data types](literal-data-types.md)
- [Immutability by default](immutability.md)
- [Records](records.md)
- [collection](collection.md)
- [Metaprogramming](metaprogramming.md)
- [Semantics](semantics.md)
- [Anonymous Functions](anonymous-functions.md)
- [Named Functions](named-functions.md)
- [Threading Macros](threading-macros.md)
- [Lazy Sequences](lazy-sequences.md)
- [Sequence Functions](sequence-functions.md)
- [Cohesion](cohesion.md)
- [Multimethods](multimethods.md)
- [Protocol](protocol.md)
- [Dispatch](dispatch.md)
- [Clojure is a Lisp](clojure-is-a-lisp.md)

