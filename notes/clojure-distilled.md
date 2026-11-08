---
title: Clojure distilled
date: 2026-11-07
tags: [clojure, tbd]
brain-id: 555c8330-3806-4824-810d-2ef284722507
---

> [!warning]
> This is rewrite of[ Clojure Distilled](https://yogthos.net/ClojureDistilled.html) , and all errors in it should be treated as mine.

Clojure has extremely simple syntax, but is hard to learn.  The reason is conceptual differences from other, more popular languages, which forms the baseline of most professional programmers.

Clojure program uses:

* [Immutability by default](immutability.md)
* [Reusability](reusable-programs.md)
* [Scalability by default](clojure-helps-to-scale.md)


Clojure provides a number of [standard data types](literal-data-types.md) that can be used as elements of [common collection types](collection.md). They all are being used to implement Clojure logic itself, that with metaprogramming in principle gives programmer the possibility to really reuse existing code in very different domains.

Clojure provides a small set of [literal data types](literal-data-types.md) — numbers, strings, keywords, symbols, nil, booleans — and a few [collection types](collection.md): lists, vectors, maps and sets. Clojure code is itself written in these data structures, so the same functions you use to process data can process code. This is what makes [metaprogramming](metaprogramming.md) much easier than in other languages.

Clojure's core [semantics](semantics.md) are built upon [special forms](special-forms.md).

Functions can be [named](named-functions.md) or [anonymous](anonymous-functions.md). Functions that take other functions as parameters or/and return them as results are called [Higher-order functions](higher-order-functions.md). A function returned by other functions is called [closure](closures.md) when it uses bindings from the function that created it.

Code written as a tree can be hard to read when the nested calls are deeply nested. To visually flatten the composition [threading macros](threading-macros.md) can be used.

Clojure’s [sequence functions](sequence-functions.md) (`map`, `filter`, `range`) return [lazy sequences](lazy-sequences.md), whose elements are computed only when consumed. 

Clojure encourages composing pure functions that transform [immutable data ](immutability.md)(see also [Reusability](reusable-programs.md)).

[Destructuring](destructuring.md) is used to declaratively access values in data structures, both in `let` bindings and in function parameters.

At a larger scale, Clojure organizes code into [namespaces](namespace.md): each [var](var.md) lives in a [namespace](namespace.md) and has a qualified name, so names in different [namespaces](namespace.md) never collide, and a [namespace](namespace.md) uses `require` to make others’ names available to it. 

Calling within a [namespace](namespace.md) is bare, while calling across [namespaces](namespace.md) needs a `require` and a qualified name. The language design thus makes local references cheap and distant ones slightly costly, nudging the programmer to keep related things together (high [cohesion](cohesion.md)); and every cross-[namespace](namespace.md) dependency is declared in the `ns` form at the top of the file, which keeps the coupling visible.

### Dynamic Variables #TBD

Polymorphism is provided either through [multimethod](multimethods.md)s or [protocols](protocol.md). Usually you want [multimethods](multimethods.md) until you need type-based [dispatch](dispatch.md) ([records](records.md), Java types) or raw speed.
## 
While [immutable by default](immutability.md), Clojure supports shared mutable state through [atoms](atoms.md) for independent updates to a single identity or STM-backed [refs](refs.md) for coordinated updates across several identities within one transaction.


[Writing code](writing-code.md) at the REPL (Read-Eval-Print Loop) is standard in every Lisp. Instead of changing and rerunning the whole program, you make small changes and test them immediately in the running process, which makes development both faster and more enjoyable. The code still lives in files, though, so editors like Emacs (with plugin CIDER), Neovim (with Conjure) or VS Code (with Calva) connect to the running REPL: you evaluate forms straight from the buffer you’re editing and see the result in place, without ever leaving your editor. Visual debugging is also possible.

Clojure is hosted language, and its host is Java. This means it's possible to reuse lots of Java libraries and approaches from inside of Clojure program (see [Reusability](reusable-programs.md)).

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

