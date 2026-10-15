---
title: Programming styles
date: 2026-09-12
tags: [programming, writing]
brain-id: 209f3ecf-7e9a-4918-9f9c-d44c9a682c61
---

[Writing code](writing-code.md) and [reading code](reading-code.md) are both depend on notation — [notation becoming a tool of thought](notation-as-a-tool-of-thought.md). E.g. it's so much easier to solve system of differential equations using APL than assembler, that assembler programmer will perhaps either solve them once and hardcode the answer, or will look for other way to solve the problem. Thus number of stylistic approaches exist in programming, shaped by the technical restrictions and problem space as well as on the personal preferences.

For example, ease of [factoring](factoring-technique.md) influences the median size of function and depends on the cost of introducing a definition  (both  [syntactic ceremony](syntactic-ceremony.md) and [cognitive load](cognitive-load.md))

The cost of introducing abstractions varies by language. In Clojure, transducers make factoring cheap; in Rebol, the same pattern requires significant ceremony.

What is clean LINQ-like composition in Clojure:
```
(transduce (comp (filter odd?) (map #(* % %)) (take 5)) + (range))   ; => 165
```

In Rebol either requires quite some effort to re-implement all the transducers library:<br>
```
square: func [x][x * x]

range: func [start stop][
    collect [
        while [start < stop][
            keep start
            start: start + 1
        ]
    ]
]

make-filter: closure [pred rf][
    func [acc x][either pred x [rf acc x][acc]]
]

make-map: closure [f rf][
    func [acc x][rf acc f x]
]

make-take: closure [n rf /local taken][
    taken: 0
    func [acc x][
        either taken < n [
            taken: taken + 1
            rf acc x
        ][acc]
    ]
]

filter-op: closure [pred][func [rf][make-filter :pred :rf]]
map-op:    closure [f]   [func [rf][make-map :f :rf]]
take-op:   closure [n]   [func [rf][make-take n :rf]]

compose-ops: closure [ops][
    func [rf][
        foreach op reverse copy ops [rf: op :rf]
        :rf
    ]
]

transduce: func [xform reducer init collection /local rf acc][
    rf: xform :reducer
    acc: init
    foreach x collection [acc: rf acc x]
    acc
]

pipeline: compose-ops reduce [
    filter-op :odd?
    map-op :square
    take-op 5
]

result: transduce :pipeline :add 0 range 1 20
print result  ; => 165
```

or should be rewritten in more idiomatic Rebol style with some Forth-like structure:
```
sum copy/part collect [ repeat n 20 [if odd? n [keep n * n ] ] ] 5
\\\\== 165
```

which is not that different from pythonic

```
sum([n * n for n in range(1, 21) if n % 2][:5])
\\\\== 165
```

Compare with same approach in APL:

```
{+/5↑×⍨⍵/⍨2|⍵}⍳20
```

or, tacitly

```
(+/∘(5∘↑)∘(×⍨)∘(⊢⌷⍨∘⊂∘⍸2|⊢))⍳20
```

Reading right to left:
* `⍳20` — *count to twenty*: the numbers 1 through 20.
* `2|⊢` — *remainder mod two*: a yes/no mask marking the odd ones.
* `⊢⌷⍨∘⊂∘⍸` — *keep only the marked odds*
* `×⍨` — *times itself*: square each.
* `5∘↑` — *take five*: the first five, drop the rest.
* `+/` — *sum it all*: fold plus across the list.


I would prefer blasphemous for APL'ers 
```
first5←5∘↑
remove_non_odd←⊢⌷⍨∘⊂∘⍸2|⊢
(+/∘first5∘×⍨∘remove_non_odd)⍳20
```
 For `first5` it is a bit too obvious, but for anything longer than 3-4 APL glyphs I would prefer to set up a factored-out word, so composition is read easily. Also those words can be a) partially reused and b) partially tested, thus easier understood: 4 is known low boundary of [Working Memory](working-memory.md) size, and I think that [understanding is the main bottleneck of modern programming](speed-of-software-development-mainly-depends-on-velocity-of.md). Here more on [my APL coding style](my-apl-coding-style.md)

So this is how composition and naming may add some style to the code even when abstraction is not available in the language (similar approach is in creating whole words-based language layer as Q does relatively to K). This is [Factoring](factoring-technique.md) taken to the max. (I also may want to factor out this article later as well!)

## Related

- [Cognitive Load](cognitive-load.md)
- [Writing code](writing-code.md)
- [Reading code](reading-code.md)
- [Syntactic Ceremony](syntactic-ceremony.md)
- [Working Memory](working-memory.md)
- [Factoring technique](factoring-technique.md)
- [my APL coding style](my-apl-coding-style.md)
- [Clay style](clay-style.md)

