---
question: Do large language models know what they say?
answer: "Probably not, on the best current evidence, though the question is open in a precise and testable way. Their internal states carry structure that correlates with truth, and that structure can be used to make outputs more truthful; what has not been shown is that it governs what they assert when nobody intervenes. Knowing requires the second."
description: Do LLMs know things? What research on 'truth' inside language models shows and does not show, and why knowing needs more. By Abhinav Saxena.
date: 2026-10-02
onHome: true
order: 3
emphasis: ["know", "what they say"]
areas: [epistemology, philosophy-of-ai]
essay: an-experiment-that-would-settle-it
publication: assertion-without-a-speaker
experiment: machine-knowledge
concepts: [knowledge, tracking-reliability, frequency-reliability, hallucination]
related: [can-ai-testify, does-chatgpt-lie, tracking-minimum, should-you-trust-chatgpt]
faq:
  - q: Don't researchers say language models have an internal sense of truth?
    a: Probing studies find internal directions that correlate with whether a sentence is true, sometimes linearly decodable, and intervening along them at inference time can make outputs more truthful. That is genuine evidence of truth-relevant structure. It shows the structure is causally usable, a lever that moves production when pulled. It does not yet show that production is regulated by it when no one is pulling, and the researchers who propose standards for belief-like representations count that 'use' condition as the least established.
  - q: Isn't 'knowing' just a matter of being reliably right?
    a: Not on any account that excludes lucky accuracy. A process can be right at a very high rate for systematic, explicable reasons and still be accidentally right about each particular thing, as a broken thermometer in a thermostatted room is. Knowledge needs the truth of the particular claim to figure in why it was produced.
  - q: Do models at least understand language?
    a: "On an externalist account of understanding, on which to understand is to take part fluently in a community's practice with words, that is a serious question, and nothing I argue answers it in the negative. Understanding is in any case compatible with every epistemic failing that matters here: a human bluffer understands his sentences perfectly."
sources:
  - text: "Saxena, A. (forthcoming). Assertion without a speaker: Testimony, tracking, and large language models. *Episteme*."
  - text: "Herrmann, D. A. and Levinstein, B. A. (2025). Standards for belief representations in LLMs. *Minds and Machines* 35(1): 1–25."
  - text: "Levinstein, B. A. and Herrmann, D. A. (2025). Still no lie detector for language models: Probing empirical and conceptual roadblocks. *Philosophical Studies* 182(7): 1539–1565."
  - text: "Li, K., Patel, O., Viégas, F., Pfister, H. and Wattenberg, M. (2023). Inference-time intervention: Eliciting truthful answers from a language model. *Advances in Neural Information Processing Systems* 36."
  - text: "Williamson, T. (2000). *Knowledge and Its Limits*. Oxford: Oxford University Press."
seoTitle: Do Large Language Models Know What They Say?
---

The question is often asked as if it were about inner life: is anyone there, does the system *believe* anything? I think it is better asked about production. What, in a model's working, explains why it says what it says? If the truth of a claim figures in that explanation, through the model's own operation, then there is something knowledge-like at work. If what explains the output is only its likelihood given the text the model was trained on, then the output may be true without being known.

## What the evidence shows

There is real evidence on the friendly side, and it should be stated plainly. Researchers have found structure inside these networks that correlates with the truth of represented sentences. In some settings the structure is linear and can be read off directly. And intervening along such directions while a model is generating can causally increase how truthful its outputs are.

That is not nothing. It is evidence that something in the vicinity of what knowledge requires exists inside these systems.

## What it does not show

A truth-direction that can be intervened upon is a lever: pull it, and production moves. It does not follow that production is regulated by it when no one is pulling. A car's heading can be changed by seizing the wheel, and that establishes nothing about what determines the route when the wheel is left alone. What would establish knowledge-relevant governance is evidence that, in ordinary operation, variation in what the model represents as true yields corresponding variation in what it asserts. Intervention studies are not designed to show this, and their authors do not claim that they do.

Behaviour points the same way. Models reproduce common misconceptions because they are widely written down. Their answers shift under a user's pressure without any new evidence. Their expressions of confidence are outputs of the same process as the answers they qualify. Successive systems do better on all of these measures, and an argument resting on a particular error rate would be out of date before it was published. Mine does not. The question is not how often production goes wrong but what governs it, and improvement in the rate is consistent with the ground of the reliability being unchanged.

## Why I say 'probably not', and not 'no'

The constitutive claim, that current systems do not track the truth in the way knowledge requires, is empirical. I hold it with the confidence the evidence supports and no more. It concerns systems as they are now built and as we now understand them, not what a machine could in principle do.

It is also checkable. Give a model conflicting passages that are matched for coherence, specificity and apparent authority but differ in the quality of their evidence, and see whether its verdict moves with the evidence or with the presentation. To my knowledge the experiment has not yet been run in that form. If it is, and the answer is the evidence, the verdict changes, and the [Tracking Minimum](/questions/tracking-minimum/) says exactly why.
