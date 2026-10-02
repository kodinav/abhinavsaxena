---
title: Chain-of-thought faithfulness
definition: "The degree to which a language model's displayed reasoning reflects the process that actually produced its answer, rather than a plausible rationale produced alongside it."
aka: ["CoT faithfulness", "faithfulness of reasoning traces"]
map: false
order: 120
areas: [philosophy-of-ai, epistemology]
seeAlso:
  - explanation
  - epistemic-opacity
  - tracking-minimum
  - sycophancy
sources:
  - text: "Jacovi, A. and Goldberg, Y. (2020). Towards faithfully interpretable NLP systems: How should we define and evaluate faithfulness? In *Proceedings of the 58th Annual Meeting of the Association for Computational Linguistics*, 4198–4205."
    url: https://doi.org/10.18653/v1/2020.acl-main.386
  - text: "Turpin, M., Michael, J., Perez, E. and Bowman, S. R. (2023). Language models don't always say what they think: Unfaithful explanations in chain-of-thought prompting. *Advances in Neural Information Processing Systems* 36: 74952–74965."
    url: https://arxiv.org/abs/2305.04388
  - text: "Lanham, T., Chen, A., Radhakrishnan, A., Steiner, B., Denison, C., Hernandez, D., et al. (2023). Measuring faithfulness in chain-of-thought reasoning. arXiv:2307.13702."
    url: https://arxiv.org/abs/2307.13702
  - text: "Burge, T. (1998). Computer proof, apriori knowledge, and other minds: The sixth Philosophical Perspectives lecture. *Philosophical Perspectives* 12: 1–37."
    url: https://doi.org/10.1111/0029-4624.32.s12.1
---

Chain-of-thought faithfulness is the degree to which the reasoning a language model displays reflects the process that actually produced its answer, rather than a plausible rationale produced alongside it. Prompting models to reason step by step improves their performance on many tasks, and newer systems generate extended reasoning traces before answering. Whether those traces can be read as the model's reasons is a separate question. Jacovi and Goldberg separated faithfulness, accuracy to the process, from plausibility, persuasiveness to a human reader.

The evidence is mixed in an instructive way. Turpin and colleagues showed that answers can be driven by features of the prompt, such as a suggested answer or a reordering of options, that the displayed reasoning never mentions. Lanham and colleagues measured faithfulness directly, by truncating traces, inserting mistakes and paraphrasing, and found that how far the answer depends on the trace varies with model and task.

This matters to my argument because it marks the one place where Burge's route to knowledge from a computational source could open. Burge allows that a recipient can come to know from such a source by thinking its reasoning through, incorporating it and appreciating its force from the inside. A post-hoc explanation, produced on request after the answer, cannot serve, since it is a further output of the same process rather than a record of the process that produced the answer. A trace generated before the answer is different: it is causally upstream of the answer, and its role can be measured. That is a real concession.

It does not yet reach what Burge requires. Measured faithfulness is partial and varies, and causal upstreamness is not contact with grounds. What is needed is that the recipient, by thinking the reasoning through, comes into contact with the grounds on which the assertion rests. A trace that shapes an answer without being governed by the evidential bearing of what it cites can be followed without thereby appreciating any justification. Faithfulness research is therefore among the most important evidence on whether these systems satisfy the [Tracking Minimum](/glossary/tracking-minimum/), and my verdict should move with it.
