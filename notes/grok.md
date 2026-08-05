---
title: grok
date: 2026-08-05
brain-id: 802f442a-cea2-4269-b3ff-fc243ea317e6
---

grok is main parsing filter in Logstash. It's a  library of named regex patterns (`%{IP:client}`, `%{NUMBER:duration}`) composed into line-matchers. It makes regexes readable and reusable, but it is still regex with it's problems: unanchored or greedy patterns on high-volume streams are a classic Logstash CPU sink. 

For fixed formats, `dissect` (positional splitting) is much cheaper.
