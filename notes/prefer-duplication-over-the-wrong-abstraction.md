---
title: Prefer Duplication over the Wrong Abstraction
date: 2026-09-14
tags: [quote]
brain-id: 2729a899-1ad3-4ff9-b0cd-6860eeba90db
---

from [The Wrong Abstraction — Sandi Metz](https://sandimetz.com/blog/2016/1/20/the-wrong-abstraction):

General pattern:
1. **Programmer A** sees duplication.
2. **Programmer A** extracts duplication and gives it a name. 
> *This creates a new abstraction. It could be a new method, or perhaps even a new class.*
3. **Programmer A** replaces the duplication with the new abstraction. 
> *Ah, the code is perfect.* **Programmer A** *trots happily away.*
4. Time passes.
5. A new requirement appears for which the current abstraction is *almost* perfect.
6. **Programmer B** gets tasked to implement this requirement. 
> **Programmer B** *feels honor-bound to retain the existing abstraction, but since isn't exactly the same for every case, they alter the code to take a parameter, and then add logic to conditionally do the right thing based on the value of that parameter.*
> *What was once a universal abstraction now behaves differently for different cases.*
7. Another new requirement arrives.
> ***Programmer X**.*
> *Another additional parameter.*
> *Another new conditional.*
> *Loop until code becomes incomprehensible.*
8. You appear in the story about here, and your life takes a dramatic turn for the worse.
