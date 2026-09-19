---
title: my APL coding style
date: 2026-09-19
tags: [apl, programming]
brain-id: 94a3f8ce-4243-429d-a6cb-4780ee637f48
---

[Coding style depends on task](coding-style-depends-on-task.md), but usually I prefer heavily annotated APL code to the code without annotations, even though I usually tend to forget about annotations under time pressure or due to the flow.

```
⍝ AoC 2018 day 24 ("Immune System Simulator 20XX") — array style, 0-origin
⍝ Works in ngn/apl and Dyalog.
⍝
⍝ The puzzle:
⍝   Two armies (immune system vs infection) consist of "groups". A group has
⍝   a number of identical units; each unit has hit points, an attack damage,
⍝   an attack type, and an initiative. A group may be WEAK to some attack
⍝   types (takes double damage) or IMMUNE to some (takes none). Each fight
⍝   round has two phases: every group picks one enemy group as its target
⍝   (in decreasing order of "effective power" = units × damage, ties broken
⍝   by higher initiative; it picks the enemy it would damage most, ties by
⍝   the enemy's effective power, then initiative; a group can be targeted by
⍝   at most one attacker), then all groups attack their chosen target in
⍝   decreasing initiative order, killing whole units only. The battle ends
⍝   when one army is wiped out — or when nobody can kill anybody (stalemate).
⍝   Part 1: total surviving units. Part 2: same, at the smallest "boost"
⍝   added to every immune-system group's damage that lets the immune side win.
⍝
⍝ APL is define-before-use, so the file necessarily builds bottom-up; this
⍝ header is the top-down map:
⍝   Part2     ← survivors of the battle at the smallest winning boost
⍝   Part1     ← survivors of the unboosted battle
⍝   Battle    ← Round⍣≡   i.e. repeat Round until the state stops changing
⍝               (both "one army dead" and "stalemate" are fixpoints)
⍝   Round     ← target selection, then attacks in initiative order
⍝   M[a;d]    ← damage multiplier attacker a → defender d:
⍝               0 if d is immune to a's type, 2 if weak, 1 otherwise

⎕IO←0            ⍝ everything below indexes from 0

⍝ ----------------------------------------------------- battlefield (example)
⍝ One entry per group. Vectors below are "columns" of a table with n rows:
⍝ group i is described by u0[i], hp[i], dmg0[i], ...
⍝ Attack types are numbered: 0 fire · 1 cold · 2 slashing · 3 bludgeoning
⍝ · 4 radiation.
u0   ← 17 989 801 4485          ⍝ starting unit counts
hp   ← 5390 1274 4706 2961      ⍝ hit points per unit
dmg0 ← 4507 25 116 12           ⍝ attack damage per unit (before any boost)
tp   ← 0 2 3 2                  ⍝ attack type of each group
ini  ← 2 3 1 4                  ⍝ initiative (all distinct)
side ← 0 0 1 1                  ⍝ 0 = immune system, 1 = infection
n    ← ≢u0                      ⍝ number of groups

⍝ Weakness/immunity tables, n×5 (group × attack type), 1 = yes:
⍝ W[g;t]=1   ⇔ group g is weak to attack type t
⍝ Imm[g;t]=1 ⇔ group g is immune to attack type t
W    ← 4 5 ⍴ 0 0 0 1 1  0 0 1 1 0  0 0 0 0 1  1 1 0 0 0
Imm  ← 4 5 ⍴ 0 0 0 0 0  1 0 0 0 0  0 0 0 0 0  0 0 0 0 1

⍝ --------------------------------------------------------------- the rules

⍝ Fold weakness/immunity into one n×n multiplier matrix, indexed [attacker;
⍝ defender]. tp[a] is attacker a's type, so W[;tp] is an n×n matrix whose
⍝ [d;a] entry says "defender d is weak to attacker a's type"; 1+that gives
⍝ the ×2/×1 factor, ~Imm[;tp] zeroes it where the defender is immune, and
⍝ the final ⍉ flips [d;a] into [a;d].
M    ← ⍉(~Imm[;tp]) × 1 + W[;tp]

⍝ Foes[a;d]=1 ⇔ a and d are on different sides (only foes may be targeted).
Foes ← side ∘.≠ side

⍝ The mutable battle state is a 2×n matrix s:
⍝   s[0;] — current unit count of each group (0 = group destroyed)
⍝   s[1;] — attack damage of each group (constant during a battle, but part
⍝           of the state because part 2 varies it via the boost)
⍝ Everything else (hp, tp, ini, side, M, Foes) never changes and is read
⍝ from the globals above.

Ep      ← {(⍵[0;])×⍵[1;]}       ⍝ effective power of each group: units×damage
Alive   ← {0<⍵[0;]}             ⍝ boolean per group: still has units?

⍝ DamageM s — n×n matrix of hypothetical damage: entry [a;d] is how much
⍝ total damage group a would deal to group d if it attacked it right now.
⍝ Built as (a's effective power, spread across each row) × type multiplier,
⍝ masked to 0 unless a and d are living enemies.
DamageM ← {a←Alive ⍵ ⋄ ((Ep ⍵)∘.×n⍴1) × M × Foes × a∘.×a}

⍝ SelectTargets s — the target-selection phase.
⍝ Returns an n-vector: for each group, the index of the group it will
⍝ attack, or ¯1 if it attacks nobody.
⍝ Internally the accumulator tk is a 2×n matrix:
⍝   tk[0;g] — target chosen by group g so far (¯1 = none yet)
⍝   tk[1;t] — 1 if group t has already been claimed as somebody's target
⍝ and only row 0 is returned at the end.
⍝ Groups choose one at a time. Choosing order: decreasing effective power,
⍝ ties broken by higher initiative. ⍒ gives indices that sort descending,
⍝ so ⍒ini+1000000×e sorts by e first and, because the 1000000×e term
⍝ dwarfs the small ini values, by ini within equal e.
SelectTargets ← {s←⍵
d←DamageM s ⋄ e←Ep s
ord←⍒ini+1000000×e
⍝ step: recursive loop over choosers. ⍺ is the tk accumulator, ⍵=k is
⍝ how many groups have chosen so far. A dead group's damage row is all
⍝ zero, so it naturally falls into the "no target" branch.
step←{k←⍵ ⋄ k=n: ⍺[0;]                     ⍝ all chose → targets vector
g←ord[k]                               ⍝ next group to choose
row←(⍺[1;]=0)×d[g;]                    ⍝ its damage, unclaimed foes only
0=⌈/row: ⍺ ∇ k+1                       ⍝ can hurt nobody → no target
c←row=⌈/row                            ⍝ candidates: max damage
c←c×e=⌈/c×e                            ⍝ …of those, max effective power
t←0⌷⍒c×1+ini                           ⍝ …of those, max initiative
⍝ (c×1+ini: +1 keeps a candidate with ini=0 above non-candidates;
⍝  ⍒ sorts descending, 0⌷ takes the winner's index — an "argmax".)
tk←⍺ ⋄ tk[0;g]←t ⋄ tk[1;t]←1           ⍝ record choice, claim target
tk ∇ k+1}
⍝ start: no targets chosen (all ¯1), no group claimed (all 0)
((2,n)⍴(n⍴¯1),n⍴0) step 0}

⍝ Round s — one full round: pick targets, then everyone attacks in
⍝ decreasing initiative order. Damage kills whole units only:
⍝   kills = ⌊ total damage ÷ hp per unit ⌋, capped at the defender's units.
⍝ Note dg (damage values) is fixed at the start of the round; only unit
⍝ counts change during the strikes.
Round ← {s←⍵ ⋄ dg←s[1;]
tgt←SelectTargets s
aord←⍒ini                                  ⍝ attack order: high ini first
⍝ strike: recursive loop over attackers. ⍺ is the vector of unit
⍝ counts, updated as groups die mid-round; ⍵=k counts attacks done.
strike←{k←⍵ ⋄ k=n: ⍺
g←aord[k] ⋄ t←tgt[g]
(t<0)∨0=⍺[g]: ⍺ ∇ k+1                  ⍝ no target, or attacker died
kills←⍺[t] ⌊ ⌊(⍺[g]×dg[g]×M[g;t])÷hp[t]
nu←⍺ ⋄ nu[t]←⍺[t]-kills
nu ∇ k+1}
(2,n)⍴(s[0;] strike 0),dg}                 ⍝ new counts, same damages

⍝ Round⍣≡ — apply Round repeatedly until the result equals its input.
⍝ When one army is dead nothing can change; in a stalemate (all remaining
⍝ attacks kill 0 units) nothing changes either — both stop the iteration.
Battle ← Round⍣≡

⍝ ---------------------------------------------------------------- outcome
Survivors ← {+/⍵[0;]}                          ⍝ total units left on the field

⍝ ImmuneWon s — 1 iff side 0 has units and side 1 has none.
⍝ (A stalemate therefore counts as "not won", which part 2 relies on.)
ImmuneWon ← {(0<+/(side=0)×⍵[0;]) × 0=+/(side=1)×⍵[0;]}

⍝ State0 boost — the initial state with boost added to every immune-side
⍝ group's damage.
State0    ← {(2,n)⍴u0,dmg0+⍵×side=0}

Part1       ← Survivors Battle State0 0

⍝ Smallest boost that makes the immune system win: try 0, 1, 2, … until
⍝ ImmuneWon says yes. (∇ is self-reference: a tail-recursive linear search.)
BoostNeeded ← {w←ImmuneWon Battle State0 ⍵ ⋄ w=1: ⍵ ⋄ ∇ ⍵+1} 0
Part2       ← Survivors Battle State0 BoostNeeded

⍝ ------------------------------------------------------------------ checks
⍝ Expected for the puzzle's worked example:
⍝   part1 = 5216, a boost of 1570 makes the immune system win (so
⍝   won1570 = 1 and boost = 1570), part2 = 51.
r1 ← Round State0 0
⎕ ← 'round1'    ⋄ ⎕ ← r1[0;]
⎕ ← 'part1'     ⋄ ⎕ ← Part1
⎕ ← 'won1570'   ⋄ ⎕ ← ImmuneWon Battle State0 1570
⎕ ← 'boost'     ⋄ ⎕ ← BoostNeeded
⎕ ← 'part2'     ⋄ ⎕ ← Part2

```

## Related

- [Coding style depends on task](coding-style-depends-on-task.md)

