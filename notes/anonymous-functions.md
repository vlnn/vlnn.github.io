---
title: Anonymous Functions
date: 2026-11-07
brain-id: 9676d026-c5c0-443d-b06f-b21fdbdefe88
---

Anonymous functions are  functions that aren't bound to a name (usually a one-off computations that you don't care to reference anywhere else):

`(fn [arg] (println arg))` 

The function is defined by using the `fn` form followed by the vector containing its arguments and the body. We could call the above function by setting it as a first item in a list and its argument as the second:

`((fn [arg] (println arg)) "hello")`
prints "hello"

Clojure provides [syntactic sugar](which-key-forth-and-embark-any-syntactically-sugared-lang.md) as follows:

`#(println %)`

Here, the % symbol indicates a single unnamed argument (multiple arguments possible but should be numbered as follows):

`#(println %1 %2 %3)`

> [!note]
> Interestingly enough, but you can provide a name to an anonymous function!
> 
> `(fn square [x] (* x x))`<br><br>It is still anonymous as does not provide global binding, just the local one (e.g. for recursion or making stack trace readable)
