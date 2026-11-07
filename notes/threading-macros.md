---
title: Threading Macros
date: 2026-11-07
brain-id: e685f4a9-34a8-46cd-b7d4-3701820a6087
---

`->`, `->>`, `some->`, `cond->`, `as->`  are being used to flatten deeply nested calls and make code more readable:


```
(reduce + (interpose 5 (map inc (range 10))))
```
becomes
```
(->> (range 10) (map inc) (interpose 5) (reduce +))
```
or, formatted
```
(->> (range 10) 
     (map inc)
     (interpose 5) 
     (reduce +))

```
