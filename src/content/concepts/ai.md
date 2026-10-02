---
title: Artificial Intelligence
definition: "Computational systems built to perform tasks we would call intelligent if a person performed them, such as answering questions, translating, classifying and planning."
aka: ["AI", "machine intelligence"]
order: 1
spine: true
relations:
  - to: mind
    type: challenges
    note: AI is the first serious empirical pressure on our concept of mind since the discovery of the brain.
  - to: agency
    type: grounds
    note: Systems that pursue goals across changing circumstances make the question of machine agency unavoidable.
  - to: knowledge
    type: mediates
    note: More and more of what we believe now passes through models before it reaches us.
  - to: technology
    type: extends
    note: AI is technology that acts back on the categories we use to think about technology.
  - to: understanding
    type: challenges
    note: Whether fluent, accurate output brings understanding with it is an open question; my arguments about testimony neither need nor assert a negative answer.
areas: [philosophy-of-ai, ethics-of-ai, epistemology]
seeAlso:
  - ai-testimony
  - algorithmic-welfare
  - hallucination
  - epistemic-opacity
  - mind
sources:
  - text: "Turing, A. M. (1950). Computing machinery and intelligence. *Mind* 59(236): 433–460."
    url: https://doi.org/10.1093/mind/LIX.236.433
  - text: "Ouyang, L., Wu, J., Jiang, X., Almeida, D., Wainwright, C., Mishkin, P., et al. (2022). Training language models to follow instructions with human feedback. *Advances in Neural Information Processing Systems* 35: 27730–27744."
    url: https://arxiv.org/abs/2203.02155
  - text: "Shanahan, M. (2024). Talking about large language models. *Communications of the ACM* 67(2): 68–79."
    url: https://doi.org/10.1145/3624724
---

Artificial intelligence is the design of computational systems that perform tasks we would call intelligent if a person performed them: answering questions, translating, classifying, planning. I do not treat it as a settled kind of thing. It is a family of techniques, a set of institutions, and a source of pressure on concepts such as mind, knowledge and agency that were formed with only one case in view.

The systems that matter most for my epistemology are large language models. Described soberly, they are trained to predict the next token over a large corpus of human text, then adjusted against human ratings and, in some domains, against automatic verifiers such as proof checkers and unit tests. They are often highly reliable, and successive systems have become more so. The question I ask is what a user's warrant is when she believes something because a model said it, and whether it is the warrant of [testimony](/glossary/ai-testimony/). I argue that on the best current evidence it is not, and that her position is that of a competent reader of an [instrument](/glossary/instrument-reading/).

Many of the systems that govern people's lives are not language models at all. Aadhaar's authentication layer, the paradigm case in my work on [algorithmic welfare](/glossary/algorithmic-welfare/), is biometric matching and database linkage rather than learning in the contemporary sense. What matters for the ethics there is architecture rather than technique: whether a criterion executes itself, with no one present at the point of decision who can see that it is failing the case in front of them.

Two scope notes. I do not claim that no machine could know, testify or understand; my claims concern these systems as they are now built and as we now understand them. And I do not deny that language models may understand what they produce. Nothing in my arguments needs that premise, and I do not assert it.
