---
title: Explanation
definition: "An account of why something is the case or why something was done; in AI, an account of why a system produced a given output."
aka: ["explainability", "explainable AI", "XAI"]
order: 14
relations:
  - to: responsibility
    type: grounds
    note: To be answerable is to be able to give an account. Explanation is what answering consists of.
  - to: understanding
    type: extends
    note: Explanations are understanding made public.
  - to: ai
    type: challenges
    note: '"Explainable AI" promises accounts of decisions; the philosophical question is what kind of account would actually discharge the demand.'
areas: [epistemology, ethics-of-ai, philosophy-of-ai]
seeAlso:
  - chain-of-thought-faithfulness
  - tracking-minimum
  - epistemic-opacity
  - understanding
sources:
  - text: "Woodward, J. (2003). *Making Things Happen: A Theory of Causal Explanation*. Oxford: Oxford University Press."
    url: https://doi.org/10.1093/0195155270.001.0001
  - text: "Miller, T. (2019). Explanation in artificial intelligence: Insights from the social sciences. *Artificial Intelligence* 267: 1–38."
    url: https://doi.org/10.1016/j.artint.2018.07.007
  - text: "Turpin, M., Michael, J., Perez, E. and Bowman, S. R. (2023). Language models don't always say what they think: Unfaithful explanations in chain-of-thought prompting. *Advances in Neural Information Processing Systems* 36: 74952–74965."
    url: https://arxiv.org/abs/2305.04388
---

An explanation is an account of why something is the case or why something was done. In the philosophy of science the leading accounts have been covering-law, unificationist and causal; on Woodward's interventionist version, to explain an outcome is to show how it would have changed had its causes been different.

Explanation does two jobs in my work. The first is the familiar one in the ethics of AI. Explainable AI promises accounts of automated decisions, and much of the debate runs together an explanation that is causally accurate and one that would satisfy the person affected. Miller argued, from the social sciences, that people want explanations that are contrastive, selective and social; a causally complete account may be none of these.

Language models add a further gap. When a model is asked to explain an answer it has already given, what it produces is a further output of the same generative process, not a record of the process that produced the answer, and the displayed rationale can be disconnected from what actually drove the output (Turpin et al. 2023). Reasoning traces generated before the answer are better placed, since they are causally upstream of it, but how faithfully they reflect it is partial and varies (see [chain-of-thought faithfulness](/glossary/chain-of-thought-faithfulness/)).

The second job is structural. The [Tracking Minimum](/glossary/tracking-minimum/) is an explanatory condition: a source transmits testimonial knowledge only if the truth of what it asserts, or the evidence for it, figures in the explanation of its asserting it. The test is interventionist rather than psychological. Hold the evidence fixed and vary the proxies the process consults; then hold the proxies fixed and vary the evidence. A process that tracks follows the evidence; one that exploits a proxy follows the proxy. To ask for an explanation of a model's output in this sense is not to ask the model. It is to ask what its outputs would do under intervention.
