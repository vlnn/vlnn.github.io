---
title: Switching from Batch to Streaming
date: 2026-08-16
tags: [programming]
brain-id: ab75c950-dcb5-4b48-afd5-2e3860777056
---

Streaming wins when the bottleneck is:
* peak memory, 
* end-to-end latency, 
* staleness, 
* recomputation of unchanged history.

 If your bottleneck is raw per-record throughput on data you were going to process anyway, batch often still wins.
