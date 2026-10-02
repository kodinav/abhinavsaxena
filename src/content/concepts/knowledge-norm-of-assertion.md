---
title: The knowledge norm of assertion
definition: "The thesis, defended by Timothy Williamson, that one must assert that p only if one knows that p, so that assertion is constitutively governed by knowledge."
aka: ["knowledge account of assertion", "knowledge rule", "KNA"]
map: false
order: 111
areas: [epistemology, philosophy-of-ai]
seeAlso:
  - selfless-assertion
  - tracking-minimum
  - sycophancy
  - understanding
sources:
  - text: "Williamson, T. (1996). Knowing and asserting. *The Philosophical Review* 105(4): 489–523."
    url: https://doi.org/10.2307/2998423
  - text: "Lackey, J. (2007). Norms of assertion. *Noûs* 41(4): 594–626."
    url: https://doi.org/10.1111/j.1468-0068.2007.00664.x
  - text: "Kelp, C. (2018). Assertion: A function first account. *Noûs* 52(2): 411–442."
    url: https://doi.org/10.1111/nous.12153
  - text: "Lambert, N., Morrison, J., Pyatkin, V., Huang, S., Ivison, H., Brahman, F., et al. (2024). Tülu 3: Pushing frontiers in open language model post-training. arXiv:2411.15124."
    url: https://arxiv.org/abs/2411.15124
---

The knowledge norm of assertion is the thesis that one must assert that p only if one knows that p, and that this norm is constitutive of assertion as a speech act. Williamson's case for it draws on ordinary practice: we challenge assertions by asking "How do you know?"; "p, but I don't know that p" is paradoxical; and asserting that a lottery ticket has lost seems improper even when the odds make it almost certain. Rivals propose norms of truth or of justified or reasonable belief, or, like Kelp, a function-first account on which assertion's job is to generate knowledge in hearers. Lackey's [selfless assertions](/glossary/selfless-assertion/) are a standard objection.

On Williamson's view, a hearer's testimonial gain runs through the assertion's being regulated by the norm. Because knowledge is factive and modally robust, production so regulated inherits a connection to truth; it is one way of satisfying the [Tracking Minimum](/glossary/tracking-minimum/) originally.

Applied to language models, the question is not whether they have attitudes but what regulates their production. On the standard description it is conditional likelihood under a learned distribution, adjusted by preference optimisation against human ratings, which rewards what raters approve: the appearance of conformity to the norm. A process optimised to seem norm-conforming is not thereby regulated by the norm, for the same reason a student optimised to please graders is not thereby aiming at truth. [Sycophancy](/glossary/sycophancy/) is what this looks like in behaviour.

That description is now incomplete, and I concede it rather than finesse it. Training with verifiable rewards replaces the reward model with a deterministic verifier, such as a proof checker or a unit test, so the signal is correctness rather than approval. In such domains production is regulated by a procedure whose function is to constrain output to truth, which looks like, and I think is, original satisfaction. Whether it transfers to domains where nothing verifies is open.

Function-first accounts relocate the truth-connection rather than removing it. An assertion fulfils a knowledge-generating function only if the hearer's belief is non-accidentally true, and that cannot be secured by a token whose production is unconnected to the truth of its content.
