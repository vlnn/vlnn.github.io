---
title: Prefer Tables to Logic
date: 2026-08-15
brain-id: f00789ba-4f77-4439-9e51-b9b51f87edac
---

Replace branching, arithmetic, or repeated computation with a [precomputed](precompute.md) data structure that you simply index into. Instead of a function that derives an answer step by step at runtime, you enumerate all (or the most common) inputs ahead of time and store the corresponding outputs, turning computation into a memory read.

There's also a correctness benefit that's easy to underestimate: a table is data, so it can be generated, exhaustively verified, and diffed, whereas equivalent branching logic hides its behavior inside control flow and invites edge-case bugs. 

Tables make behavior inspectable — you can print one, review it, or hand it to a domain expert who couldn't read the code. The approach shades naturally into table-driven design more broadly: state machines defined as transition tables, parsers driven by grammar tables, and dispatch tables replacing switch statements all follow the same instinct.

## Related

- [Behavior](behavior.md)

