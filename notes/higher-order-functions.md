---
title: Higher-order functions
date: 2026-11-07
brain-id: 14c35a96-d5ff-4a24-8bf3-245732dc6664
---

Functions that take other functions as parameters are called higher-order functions (or simply hof). 

```
(map #(* % %) [1 2 3 4 5]) 
=> (1 4 9 16 25)
```
This function accepts two parameters where the first is an [anonymous function](anonymous-functions.md) that squares its argument and the second is a [collection](collection.md) of numbers. The map function will visit each item in the collection and square it. Using HOF here makes intent clear, opposed to the usage of the "usual" iteration mechanisms with `loop` .

```
(loop [[n & numbers] [1 2 3 4 5]
       result []]
  (let [result (conj result (* n n))]
    (if numbers
      (recur numbers result)
      result)))
```

Another example of a higher-order function:
```
(filter even? [1 2 3 4 5]) => (2 4)
```

Higher-order functions can be easily composed (chained) together to create complex transformations:
```
(filter even?
  (map #(* 3 %) [1 2 3 4 5]))

=>(6 12)
```
