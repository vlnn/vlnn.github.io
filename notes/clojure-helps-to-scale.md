---
title: Scalability by default
date: 2026-11-07
brain-id: 087c092c-562b-40e6-b3d9-341b395cbe38
---

Clojure has its specific way to make programs scalable via safe concurrency/parallelism, I will call it *Scalability by default:*

It starts with [immutability by default](immutability.md) which simplifies the parallelism and concurrency ([no silver bullet](no-silver-bullet.md) though): 
1. Pure functions, which immutability makes the natural default, can be run in parallel without coordination.
2. Immutable values are also the solid foundation for shared state: immutable values are separated from mutable identities (atoms, refs, agents) that point at a current value.

On top of this, Clojure’s core includes Software Transactional Memory (STM) built on `ref` and `dosync` . Within a transaction, coordinated changes to several refs — the case a single `atom` can’t cover — are atomic and consistent without manual locking. Because every revision is an immutable value, readers never block and never see a half-finished state; only writers coordinate with each other, and a new revision can be built while the current one is being read. 

Transactions still have their own rules — no side effects inside `dosync`, and contention costs retries — so this is not a universal replacement for locking, but it removes locking as the default tool.
