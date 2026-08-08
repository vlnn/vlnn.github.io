---
title: Oldschool Is Closed or Q/KDB are fun, strange and crazy
date: 2026-07-30
tags: [apl, k]
---

<https://lv1.sh/> is another layer of crazyness that seems to be normal for k/q language for decades. Also beware, this link was [removed on lobste.rs](gatekeeping-at-lobste-rs.md)

`K` is an array-based language by Arthur Whitney, who worked together with Ken Iverson and Roger Hui (thus ifluencing and being influenced by creators of `APL` and `J` languages). Imagine ASCII-based `APL` (you have `J`) and then add dictionaries and projections (realtime-updated as far as I understood) and you get `K`. It's very laconic, so they added another language on top and called it `Q`. They called runtime for `K`,=Q= and `kdb+`.

Try K yourself here: [oK](https://johnearnest.github.io/ok/index.html) or [shakti k console](https://kparc.io/kc) (with oldschool reference at [ref k](https://ref.kparc.io/#scan))

Now imagine set of incompatible `K` implementations, all of them with close-sourced and sold to fintech companies (the rumour is that AW started each version from scratch). Several attempts of making opensource implementation led to even fancier monsters, all of different functionality and level of non-support. Add some nerdiness to the cocktail and the fact that Arthur Whitney is publishing plans to create `kOS` that is operating system written in `K`. Imagine fans reading something like `"This summer, Pierre and I got kOS to boot directly into g (the graphical interface; formally called z) with ISR, keymap, modesetting, basic filesystem, etc weighing in around 100 lines of C. That was pretty exciting. Could probably be done with less with some deeper changes to Arthur's code, but it's still very useful to run k under Linux. Oleg made a silly little game in kOS."` only to find out that it was in 2014.

Don't forget about the [Incunabulum](https://www.jsoftware.com/ioj/iojATW.htm). Don't forget that <span class="spurious-link" target="jsoftware.com">*jsoftware*</span> was not that different and provided closed-sourced binaries for around 15 years before becoming relatively sane. It was pretty OK for the industry; `we are different from them now, and they are not that crazy`. Or maybe they are and we will become a bit later.

```test
Q: Is `k` having a standard?
A: God no
```
