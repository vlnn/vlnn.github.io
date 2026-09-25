---
title: Dyalog APL support in Emacs
date: 2026-09-16
tags: [emacs, todo]
brain-id: 5a94c054-29b3-43db-97fd-b337035ada64
---

## Why
Starting programming in Dyalog APL pretty much everyone see two technical problems: 
1. APL glyph input and storage (problematic to the point of moving to bare ASCII in J and K);
2. Sub-optimal Dyalog APL IDE with its quirks.

Historically those two created a barrier you should jump over or break through depending on your skills and abilities. Things were even messier due to WS binary storage format \`dws\`, making it impossible to "just store and run" APL as script in plain text files. You also couldn't use `diff`  or `git`  or `grep`  over a codebase, which led to the custom implementations (e.g. SimCorp created internal Oracle-based VCS to manage the APL developers' workflows) of different level of completeness and quality.

[ride-apl](dyalog-apl-support-in-emacs.md) is my approach to resolve both these problems.

## How
Similar to [Cider](https://cider.mx), `ride-apl` is layer that connects the plain text source files like `.apl` or `.dyalog` from Emacs to the running interpreter. Any line of code or region or whole buffer can be evaluated without leaving the Emacs; moreover, evaluation results are being shown back in the buffer, so your programming gets pretty tight loop of [TDD](test-driven-development.md) or [exploratory programming](exploratory-programming.md), which adds to the APL's clarity and laconic might.

## High level usage flow
1. You have your Emacs and Dyalog APL running
2. You connect them with `ride-apl-connect`  by `host` (usually `localhost)` and `port` (default is `4502` )
3. In your APL buffer you now can call `ride-apl-eval-line-or-region` or `ride-apl-eval-buffer`  which forwards source code to the interpreter and gets results back
> 3.1 Results appear as  `⇒` value overlays right on the evaluated lines (errors in red); they clear on your next edit. The full untruncated output always lands in the *ride-apl:HOST:PORT* session buffer
4. In the session buffer you have a regular REPL
5. Once a scratch file grows into definitions,  `C-c C-l` fixes the whole file via `2⎕FIX'file://...'` , from then on `M-.` on a name lands in your file at the definition, `M-,` returns, and eldoc shows live workspace values at point

## Related

- [Test-driven Development](test-driven-development.md)
- [Exploratory Programming](exploratory-programming.md)

