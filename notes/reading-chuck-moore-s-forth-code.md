---
title: Reading Chuck Moore's FORTH code
date: 2026-09-26
brain-id: 198182fd-c134-4086-98ab-cdaba680dceb
---

Related to the [Example of Chuck Moore's FORTH code](example-of-chuck-moore-s-forth-code.md):

This is a 1993–95 MuP21 cross-assembler plus the "OK" video/menu program, written in a 16-bit DOS Forth (F-PC) co-authored by Chuck Moore , C.H. Ting and Jeff Fox. 
### What the file actually is
Three layers live in one file, and knowing which layer a word belongs to is half the battle:

1. **Host tooling** — `ram`, `R@`/`R!` (3-byte packed 20-bit cells), `SEND`/`CHECK`/`VIEW`/`SHOW`, the debugging switches.
2. **Two assemblers** — an 8-bit one in the `8-B` vocabulary (for the byte-wide boot ROM) and a 20-bit one in `FORTH`, both defining `INST`, `p`, `#`, `,` with the same names and different meanings.
3. **The target program** — everything after `': byte`, written by *executing* host words that compile target code (`':` defines a `CONSTANT` whose `DOES>` compiles a `call`; `:KEY`compiles the address as a literal for menu tables).

### [Programming Style](programming-styles.md)
**Naming is deliberately local, not general.** 
Single-letter target words (`H`, `E`, `V`, `J`, `p`), symbolic ones (`;'`, `-;'`, `!!+`, `dup!!+`, `'OK'`), and a loose convention that lowercase is machine instruction (`dup`, `nop`, `a!`), uppercase is a composed word. Reminds me of [Arthur Whitney](arthur-whitney.md)'s [style](whitney-s-incunabulum.md).

The tick prefix means pointer  (`'menu`, `'color`, `'twos`), the tick suffix distinguishes target from host (`;'`, `word'`). The `-` prefix, though, is overloaded four ways: negation (`-#`, `-p`), inverted condition (`-if`, `-until`), tail-jump (`-;'`), and "exclusive" (`-or`).

**Aggressive name reuse.** `word` exists three times (8-B, `word'`, and the later `word`); `ROW` twice; `INST`/`p`/`#`/`,` twice; `RESET`, `READ`, `TEST` as both host and target words; `TEST`, `CLSkey`, `CLS` are three names for one entry point. Forth's last-definition-wins makes this work, but the file depends on definition order in ways a reader has to reconstruct.

**Shadowing of standard words is the sharpest edge.** `R@` is redefined as "fetch a 20-bit target cell", and `then` uses it that way alongside real `>R`/`R>`.

`CR` is redefined globally as a debug breakpoint (`.s`, wait for a key, abort on Enter), which is why bare `CR` lines are sprinkled between definitions — they're step points, not formatting. 

`VARIABLE H` (the dictionary pointer) is later shadowed by `': H` (horizontal video line); it only works because the assembler words were compiled first.

**Comments carry the version control.** The header is a changelog; dead code is kept under `\` or `COMMENT:` with initials and dates; the original `BOOT` sits commented directly above its replacement. Given 1995 and no VCS, that's defensible, but it's a large share of the file's bulk. The blank-line runs look like leftover screen/block boundaries.

**[Definitions are small](divide-your-program-into-methods-that-perform-one.md),** almost all 1–5 lines. The exceptions (tiles `ROW`, `DUMP`, the video timing block) are the hardest parts to read, which supports the rule.

## Related

- [Example of Chuck Moore's FORTH code](example-of-chuck-moore-s-forth-code.md)
- [Whitney's Incunabulum](whitney-s-incunabulum.md)
- [Arthur Whitney](arthur-whitney.md)

