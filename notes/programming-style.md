---
title: Elements/Parts of the Programming Style in K
date: 2026-07-30
tags: [programming, k]
---

Reading ["K: Remarks on Style"](https://nsl.com/papers/style.pdf) I've found great quote on great book I've never liked:

""" Kernighan and Plauger, in their classic work on the elements of programming style, organize issues of style under seven headings:

- expression,
- control structure,
- program structure,
- input/ output,
- common blunders,
- efficiency,
- documentation.

"""

This is 7 parts to which it's hard to add something. `K` did some changes though:

# K maxims

## Style improves with knowledge of the language.

## Program with, and not against, the grain of the language.

(granted the language is sane and enforces proper things)

## Seek opportunities to throw away code.

less code =\> less bugs

# Names

## Names should be easy to type

(I can see it's 1995 with typing being a problem)

## Conventions

# Physical line of code contains exactly one K statement/encodes one thought.

(We still have problem with it in 2026)

# Modularity

- Use subfunctions.
- Making the coupling between modules visible.
- Each module should do one thing well.
- Make sure every module hides something.
- Hide shared subfunctions in subdirectories.
- Localize unshared subfunctions.
