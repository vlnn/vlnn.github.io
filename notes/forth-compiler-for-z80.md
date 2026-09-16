---
title: Forth compiler for Z80
date: 2026-09-16
tags: [forth]
brain-id: feed10c5-487c-414a-a40a-c4cf043abbfa
---

Cross compilation is generally done from more powerful environment to less powerful one: this enables the programmer to do less and rely on automatic improvements more. This is what I wanted to do with this project: use optimized cross compiler from Forth to pure Z80 binary (so it's not Forth for ZX Spectrum, but Forth to write for ZX Spectrum).

It is one of my first projects designed with LLM, which is perhaps also cross compilation of a different kind: using powerful environment of LLM to create a local developer pipeline.

I even ported [2-bit language model by HarryR](https://github.com/HarryR/z80ai)  that emits1 byte per 2-3 seconds, see more at [vlnn/zt: Z80 Forth Cross-Compiler](https://github.com/vlnn/zt)
