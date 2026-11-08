---
title: Dispatch
date: 2026-11-08
brain-id: 6f099fc2-a853-4fb1-9b7d-30b6f001ab6c
---

Dispatch is the step where a call to a single name gets routed to one of several concrete implementations at runtime. Three parts are always present:
1. **The dispatch key** — what you look at to decide. Could be the type of an argument, a field in a map, the types of several arguments together, any value computed from the arguments.
2. **The dispatch table** — the mapping from keys to implementations.
3. **The resolution rule** — how a key is matched against the table, including fallbacks when there’s no exact hit.
