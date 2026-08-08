---
title: grok
brain-id: 802f442a-cea2-4269-b3ff-fc243ea317e6
---

grok is main parsing filter in Logstash. It's a  library of named regex patterns (`%{IP:client}`, `%{NUMBER:duration}`) composed into line-matchers. It makes regexes readable and reusable, but it is still regex with it's problems: unanchored or greedy patterns on high-volume streams are a classic Logstash CPU sink. 

For fixed formats, `dissect` (positional splitting) is much cheaper.

```test
Q: What is grok?
A: The main parsing filter in Logstash — a library of named regex patterns (`%{IP:client}`) composed into line-matchers.
Q: What is the classic grok CPU sink?
A: Unanchored or greedy patterns on high-volume streams.
Q: What is much cheaper for fixed formats?
A: dissect — positional splitting.
```
