---
title: Smalltalk OOP is not mainstream OOP
date: 2026-08-09
tags: [history, programming]
brain-id: 3f04624e-3d5f-4084-a0c9-37c486f7d2da
---

Smalltalk OOP model is based on messaging, not classes and inheritance

 In Smalltalk, an object is an opaque cell that receives messages and decides — at runtime, itself — how to respond. `3 + 4` isn't an operator invocation; it's the message `+ 4` sent to the object `3`, which can handle it however it likes. Even control flow works this way: `ifTrue:` is a message sent to a Boolean object with a block as an argument. There are no statements, no privileged syntax — everything is objects sending messages.
