---
title: Immutability by default
date: 2026-11-07
brain-id: 4902c707-e0fd-4588-b158-1a2f9d1febb1
tags: [clojure, data-structure, design, tbd]
---

In most programming languages data is mutable by default, and constructions like  `const`  are used for explicitly stating its immutablity. Clojure is different, though:

**Immutability by default** means mutating state only when there’s a good reason to, and focusing instead on creating and transforming immutable data structures. It’s enforced by both the language and the practice. You can add an entry to a map, but what you get back is a new map; the old one is untouched. You can mutate a Java array in place, but you’d need a good reason to do it.

Mutable data can either be passed around by value or by reference. Passing by value is safe but slow. Passing by reference is fast but not safe: anyone holding the reference can change the data under you, so you have to know every place it’s referenced to reason about it.

Immutable data structures dissolve the dilemma. Every change produces a new revision that shares its unchanged parts with the old one, so you get the safety of copying while paying only for the size of the change.

Having immutable data structures encouraging writing pure functions. Given the same parameters, the function will always produce the same result, regardless of the global state of the application. It makes them easier to understand and test.
