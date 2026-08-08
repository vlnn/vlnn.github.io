---
title: The Rise of Worse is Better
date: 2026-08-08
brain-id: e06bbf64-a4ce-4a50-9a7f-96b555fbc586
---

[Richard Gabriel](richard-gabriel.md)'s 1991 essay ([part of "Lisp: Good News, Bad News, How to Win Big"](https://www.dreamsongs.com/RiseOfWorseIsBetter.html))

## First layer: 
The software designed with simplicity of implementation as the highest priority — even at the cost of correctness, consistency, and completeness — tends to spread and survive better than software designed to be "the right thing.

## Second layer:
Two design philosophies: 
1. [MIT approach aka the Right Thing](right-thing-mit-approach.md), exemplified by LISP
2. [New Jersey approach aka Worse is Better](worse-is-better-new-jersey-approach.md), exemplified by Unix and C 

Worse-is-Better systems have better survival characteristics: they're easy to port, they spread like a virus, and once ubiquitous, they improve gradually until they're "good enough.", and thus LISP loses markets where UNIX dominated.

In short, it's often better to ship something small, simple, and half-right first, let it spread, and improve it later, than to perfect the right design while the worse one conquers the world.

## Free-form layer:
The most useful way to read "[Worse is Better](https://www.dreamsongs.com/RiseOfWorseIsBetter.html)" is not as a style debate but as an argument about *[selection environments](environment-selection.md)*. Gabriel isn't claiming bad software is good; he's claiming that the traits that make software excellent in a design review (correctness, consistency, completeness) are not the traits that make it win in the wild (portability, small footprint, ease of implementation, early availability). Software competes in an ecosystem where being *present* beats being *perfect* — a program that runs on your machine today, at 50% of the right functionality, out-competes a program that will be flawless in three years. Adoption compounds: users, ports, libraries, and trained programmers accumulate around whatever shipped first and spread easiest, and that installed base then funds the slow climb toward "good enough."

The essay also carries a quieter, sadder point about the Lisp community specifically: they didn't lose because they were wrong about design, they lost because they [optimized for the wrong fitness function](optimizing-for-the-wrong-fitness-function.md). And the lasting lesson — one you can see echoed later in "release early, release often," MVPs, and worse-is-better lineages like JavaScript, PHP, HTTP, and Go's deliberate minimalism — is that implementation simplicity is not a compromise but a strategic asset: it's what lets an idea escape its authors and survive contact with the world — [Natural Selection of a sort](natural-selection.md).

## Related

- [Natural Selection](natural-selection.md)
- [Worse is Better (New Jersey approach)](worse-is-better-new-jersey-approach.md)
- [Recall vs Recognition](recall-vs-recognition.md)
- [Right Thing (MIT approach)](right-thing-mit-approach.md)
- [Richard Gabriel](richard-gabriel.md)
- [John McCarthy](john-mccarthy.md)
- [Environment Selection](environment-selection.md)
- [Optimizing for the Wrong Fitness Function](optimizing-for-the-wrong-fitness-function.md)

