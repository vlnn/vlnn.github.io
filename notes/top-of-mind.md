---
title: grok
date: 2026-08-04
brain-id: 802f442a-cea2-4269-b3ff-fc243ea317e6
tags: [elasticsearch, service]
---

grok is main parsing filter in [Logstash](logstash.md). It's a  library of named regex patterns (`%{IP:client}`, `%{NUMBER:duration}`) composed into line-matchers. It makes regexes readable and reusable, but it is still regex with it's problems: unanchored or greedy patterns on high-volume streams are a classic Logstash CPU sink. 

For fixed formats, `dissect` (positional splitting) is much cheaper: [grok vs dissect](grok-vs-dissect.md)

Q: What is grok?
A: The main parsing filter in Logstash — a library of named regex patterns (`%{IP:client}`) composed into line-matchers.
Q: What is the classic grok CPU sink?
A: Unanchored or greedy patterns on high-volume streams.
Q: What is much cheaper for fixed formats?
A: dissect — positional splitting.

## Related

- [grok vs dissect](grok-vs-dissect.md)

