---
title: Clay style
date: 2026-09-20
brain-id: 5537e859-e058-4194-a634-2343c7501353
---

This is [programming style](programming-styles.md) I'm working on right now. It is independent from the programming language with which it is being practices, even though it is easier to use it with some than with others. Main idea is to arrange the code in such way that it is 1) easy to [read](reading-code.md) and [understand](speed-of-software-development-mainly-depends-on-velocity-of.md), 2) easy to [write](writing-code.md) and [maintain](maintaining-legacy.md). This should be done via adhering to several laws of Clay:

### Laws of Clay
1. Program in Clay is written strictly top to down in both abstraction and physical way. E.g. in Python Clay style structure looks like this:

```
answer() ; The most abstracted call (call 1)

def answer():  ; its implementation
    ...
    prepare_1(); abstraction call 2
    ...
    finish()   ; abstraction call 3

def prepare_1():
    ...

def finish():
    ...
```

2. Every term should belong to either:
	1. nouns — entity that holds data and named either CapitalizedWay or CONSTSTYLE. Nouns always return values
	2. verbs — syntactically actions over data. Always written as lowercased. Always return values.
	3. active-verbs! — actions over state: instead of returning values it either changes some data or executes some IO. Lowercased but marked with exclamation mark.
```
Answer: double-example Example-noun

Example-noun: 42

double-example: [[x] [x * 2]
    docs: ["Double the x value."]
    examples: [double-example 4 \== 8]
              [double-example 0 \== 0]]

save-example!: [x] [ save-to-txt "example.txt" x ]
```

3. Every term should be possible to mark with additional meta fields (depending on implementation language): `examples` and `docs`.  So in Rebol it would be verb/docs or
