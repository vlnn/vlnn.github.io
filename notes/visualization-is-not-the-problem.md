---
title: Visualization is not the problem
date: 2026-11-02
brain-id: 336e3c19-7c38-42f1-8158-39e2cd9e2570
---

It looks to me that “visualization” is used (again, mostly by me!) for two different things, and most confusion comes from mixing them. One is making pictures from data. The other is the whole process of making sense what pictures can mean: understand, confirm, distrust the data, understand again. The first is close to solved. The second is not even close.
Making pictures is solved because making *anything* from data is close to solved. LLMs generate transformers, filters, generators, charts on request. Cost of one more view goes to zero. So problem is not production (also *anything*  is marked for a reason).
What stays is three things, and they are not the same problem.
1. **Exploration.** You don’t know what is in the data, you look. Cheap views don’t help as much as expected: every new view I have to re-read (new axes, new colors, where to look), and then I have to choose which view to try next. That choosing is the cost. Production got cheap; navigation in the space of views did not. The “car” here would be a system that infers what question I’m asking from what I do, not from what I type. Lux, Voyager, Draco try this and nothing boomed. So: not invented yet, possibly never. My test for each new tool: is it request-driven in disguise? So far all are.
2. **Communication.** Here the problem is opposite. One picture must serve expert, rookie, and other expert with different model of the same data. Obvious fix is per-viewer rendering, but then two people can’t argue about the same chart, and shared chart is the whole point of communication. Adaptivity and shared reference are in tension; you get one. This one I think is really unsolvable, not just unsolved.
3. **Trust.** Upstream of both. Is this data what it claims to be — provenance, column meaning, did the join go right. No view answers this. And cheap generation makes it worse: more transformations between source and picture, less of them inspected by anyone. You can’t confirm what you don’t understand, and shouldn’t understand wrong data, so trust gates the whole loop.
Fixed sets of views (Tukey’s EDA, pairplot, profiling reports) look like solution for 1 but are actually tools for 3: they find defects, not questions. They rarely change what I ask next.
Text interfaces help, but in one direction only. They are good at narrowing — I have a question, I get a view. They are bad at widening — I have no question yet. Traditional overview-first visualization is the mirror image: good at widening, slow to narrow. Neither is complete, and they fail in opposite directions. Unknown unknowns live in the gap, and text-by-request is *worse* there than a dumb scatterplot matrix.
So: data problem is close to solved. Sense-making is human problem, and it’s not a problem of pictures. It’s a problem of choosing, and of trusting what you are choosing from.
