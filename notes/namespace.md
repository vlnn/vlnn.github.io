---
title: Namespace
date: 2026-11-07
brain-id: 3a3ecae7-7097-41f6-8207-1233a90731e0
---

Example: namespace called `colors`  with three functions in it.

```
(ns colors)

(defn hex->rgb [[_ & rgb]]
    (map #(->> % (apply str "0x") (Long/decode))
         (partition 2 rgb)))

(defn hex-str [n]
  (-> (format "%2s" (Integer/toString n 16))
      (clojure.string/replace " " "0")))

(defn rgb->hex [color]
  (apply str "#" (map hex-str color)))
```
