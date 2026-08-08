---
title: Do What I Mean
tags: [design, programming, psy]
brain-id: 6997157d-5c39-41e3-9216-93c1ee6931e3
---

DWIM (Do What I Mean) is a design philosophy where software resolves ambiguous or imperfect input by inferring the user's intent from context, rather than demanding a fully explicit, literal specification. 

It originated in the late 1960s with Warren Teitelman's work on BBN-LISP (later Interlisp), where the system would automatically correct typos and misspelled identifiers in code instead of failing with an error. 

The core trade-off is cognitive load versus predictability: DWIM saves the user from tedious explicitness, but a wrong guess can be worse than no guess, since the system silently does something unintended — famously satirized in Xerox PARC jokes about DWIM deleting the wrong files.
