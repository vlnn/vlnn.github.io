---
title: Test-driven Development
date: 2026-09-16
brain-id: b43c4746-1e79-4972-bbd2-ca972bfbeca5
tags: [methods, programming]
---

Test-driven development is a programming paradigm popularized by [Kent Beck](kent-beck.md). The idea is to decrease [feedback time](feedback.md) of each task using formalized process of 
1. [Understanding what (small amount of) new code should do ](understanding-the-task.md)or calculate ([Speed of software development mainly depends on velocity of learning/understanding](speed-of-software-development-mainly-depends-on-velocity-of.md)). 
2. Create automated tests expecting this behavior or values (usually Unit tests as most tasks cover only small amount of units (functions or objects)). If the task is too big or too hard to be tested, go to 1.
3. Run them to see they are failing as expected showing no [False Negatives](false-negatives.md) as no task-related code has been added yet
4. Create code to make tests green with either:
	1. *fake it* (return the constant)
	2. *obvious implementation* (just write it)
	3. *triangulation* (add a second example that forces generalization).
5. Run tests and see them green (if they are red, return to 4 — or sometimes as far as to 1 if understanding was partial)
6. Refactor the code, using whole test suite as a [safety net](safe-environment.md).
7. Potentially refactor the tests (this can be a bit scary due to no tests testing the tests — usually just a generalization or parametrization is being done. You can break some code to see if tests getting red to ensure the quality of tests.) 

Structuring of usually rather chaotic [Exploratory Programming](exploratory-programming.md) as well as fixing the context of the development with unit tests in a standard flow should lead to 
1. Psychological freedom and [safety](safe-environment.md) for programmer that potentially improves both [productivity](productivity.md) and [creativity](creative-persons.md).
2. Release the code with much higher test coverage in comparison to more traditional  ests-after strategies
3. The TDD practice creates a counterweight to the usual pull of the business carelessly increasing [technical debt](technical-debt.md) due to [higher visibility of tactical wins](tactical-wins.md).
4. Natural focus on fast-running tests due to intensive testing during bottom-up development; usually most of tests written are unit tests.
5. Clean design due to writing tests that call non-existing yet code first, thus making easier to see awkward API or longish argument lists.

## Related

- [Tactical Wins](tactical-wins.md)
- [False Negatives](false-negatives.md)
- [Exploratory Programming](exploratory-programming.md)
- [Speed of software development mainly depends on velocity of…](speed-of-software-development-mainly-depends-on-velocity-of.md)
- [Productivity](productivity.md)
- [Technical Debt](technical-debt.md)
- [Safe Environment](safe-environment.md)

