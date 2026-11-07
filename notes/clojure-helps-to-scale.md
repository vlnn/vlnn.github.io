---
title: Clojure helps to scale
date: 2026-11-07
brain-id: 087c092c-562b-40e6-b3d9-341b395cbe38
---

[Immutability by default](immutability.md) simplifies the parallelism and concurrency ([no silver bullet](no-silver-bullet.md) though): 
1. pure functions can be safely run in parallel.
2. immutable data structures are also an excellent tool for managing shared mutable state. 

Clojure provides a Software Transactional Memory (STM) library based on these data structures. With transactional memory we no longer have to worry about manual locking when dealing with threads. Better still, shared state backed by immutable data only needs to be locked for writing since the current revision can be safely read while the new revision is being generated.
