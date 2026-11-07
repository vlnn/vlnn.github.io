---
title: Closures
date: 2026-11-07
brain-id: 2b9ab1dd-ae0c-4359-98c6-89dea29f3b8a
---

A function that closes over bindings from its enclosing scope — keeping them available after that scope is gone — is called a **closure**. Most often you meet closures as functions returned by other functions. This is useful, for example, to construct custom objects: the outer function’s arguments become the inner function’s private state, much like constructor arguments stored in an object’s fields.
