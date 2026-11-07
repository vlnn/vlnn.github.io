---
title: Clojure distilled
date: 2026-11-07
tags: [clojure]
brain-id: 555c8330-3806-4824-810d-2ef284722507
---

> [!warning]
> This is rewrite of[ Clojure Distilled](https://yogthos.net/ClojureDistilled.html) , and all errors in it should be treated as mine.

Clojure has extremely simple syntax, but is hard to learn.  The reason is conceptual differences from other, more popular languages, which forms the baseline of most professional programmers.

Clojure program is:

* Practically [Immutable](immutability.md)
* [Reusable](reusable-programs.md)
* [Easily made scalable](clojure-helps-to-scale.md)


Clojure provides a number of [standard data types](literal-data-types.md) that can be used as elements of [common collection types](collection.md). They all are being used to implement Clojure logic itself, that with metaprogramming in principle gives programmer the possibility to really reuse existing code in very different domains.

Clojure provides a small set of [literal data types](literal-data-types.md) — numbers, strings, keywords, symbols, nil, booleans — and a few [collection types](collection.md): lists, vectors, maps and sets. Clojure code is itself written in these data structures, so the same functions you use to process data can process code. This is what makes [metaprogramming](metaprogramming.md) much easier than in other languages.

Clojure's core [semantics](semantics.md) are built upon [special forms](special-forms.md).

Functions can be [named](named-functions.md) or [anonymous](anonymous-functions.md). Functions that take other functions as parameters or/and return them as results are called [Higher-order functions](higher-order-functions.md). A function returned by other functions is called [closure](closures.md) when it uses bindings from the function that created it.

Code written as a tree can be hard to read when the nested calls are deeply nested. To visually flatten the composition [threading macros](threading-macros.md) can be used.

Clojure’s [sequence functions](sequence-functions.md) (`map`, `filter`, `range`) return [lazy sequences](lazy-sequences.md), whose elements are computed only when consumed. 

Clojure encourages composing pure functions that transform [immutable data ](immutability.md)(see also [Reusable programs](reusable-programs.md)).

### Destructuring
### Namespaces
### Dynamic Variables
## Polymorphism
### Multimethods
### Protocols
## Dealing With Global State
## Writing Code That Writes Code
## The Read-Evaluate-Print Loop
## Calling Out to Java
### Importing Classes
### Instantiating Classes
### Calling Methods

## Related

- [Special Forms](special-forms.md)
- [Clojure helps to scale](clojure-helps-to-scale.md)
- [Higher-order functions](higher-order-functions.md)
- [Closures](closures.md)
- [Reusable programs](reusable-programs.md)
- [literal data types](literal-data-types.md)
- [Immutability by default](immutability.md)
- [collection](collection.md)
- [Metaprogramming](metaprogramming.md)
- [Semantics](semantics.md)
- [Anonymous Functions](anonymous-functions.md)
- [Named Functions](named-functions.md)
- [Threading Macros](threading-macros.md)
- [Lazy Sequences](lazy-sequences.md)
- [Sequence Functions](sequence-functions.md)

