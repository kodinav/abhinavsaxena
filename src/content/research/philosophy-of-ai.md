---
title: Philosophy of AI
short: What current AI systems are, described without inflation or dismissal.
description: "Philosophy of AI by Abhinav Saxena: what governs a language model's outputs, what interpretability does and does not show, and when machines could testify."
order: 3
angle: 0
radius: 0.55
keyQuestions:
  - Do large language models know anything?
  - Is a language model's answer governed by likelihood, by human approval, or by something that tracks the truth?
  - What would interpretability research have to show for a model to count as a source of knowledge?
  - Does an argument about what AI can know need a premise about whether AI has a mind?
related: [epistemology, philosophy-of-mind, ethics-of-ai, political-philosophy]
concepts: [ai, ai-testimony, hallucination, tracking-minimum, epistemic-opacity, understanding, intentionality]
---

Philosophy of AI asks what artificial intelligence systems are and what they do: whether they think, understand, know or act, and what we are entitled to make of their outputs. I practise it as conceptual work on the systems we already have. The question is not whether a machine could one day be a knower, but what the language models now deployed are doing when they produce sentences that look like assertions.

That needs a description without inflation or dismissal. These systems are trained to predict text over a large human corpus, then adjusted by preference optimisation against human ratings and, in some domains, against deterministic verifiers. They can retrieve documents and call tools. In many domains they are highly reliable, and successive systems have become more so. My argument does not need the description of them as mere mimics, and I do not assert it.

## Causally usable is not the same as governing

The question I press is empirical: what governs the production of a model's assertion-shaped outputs? Probing studies find internal structure that correlates with the truth of represented sentences, in some settings linear and decodable (Burns et al. 2023; Marks and Tegmark 2024), and interventions along such directions at inference time can make outputs more truthful (Li et al. 2023). That is genuine evidence that something relevant exists.

It is not yet evidence that the structure governs production. A car's heading can be changed by seizing the wheel, and that establishes nothing about what determines the route when the wheel is left alone. Herrmann and Levinstein propose standards an internal representation must meet to count as belief-like; the one that matters here, use, requires that the representation govern what the model outputs, and by its proponents' own standards it is the least established. Behaviour points the same way: models reproduce common misconceptions (Lin et al. 2022) and change their answers under user pressure without new evidence (Sharma et al. 2024).

A true answer and a false one come from the same process with the same fluency. On the current evidence, what gets called [hallucination](/glossary/hallucination/) is the point at which frequency and truth come apart, not a lapse in a process that otherwise tracks the truth. Two concessions belong in the same picture. Where post-training replaces human approval with a verifier, such as a proof checker or a unit test, production in that domain is regulated by something whose function is to constrain output to truth, and I think that is a case of the condition being met. And where a model writes out a reasoning trace before answering, the trace is causally upstream of the answer (Lanham et al. 2023), though its measured faithfulness is partial and varies with model and task.

## Why the argument does not turn on minds

Freiman and Faria charge the received view of machine testimony with unargued anthropocentrism, and they are often right. The [Tracking Minimum](/glossary/tracking-minimum/) asks nothing about intentions, belief, consciousness or being human. It is third-personal, testable by intervention, and framed so that a machine could satisfy it. I do not deny that language models may understand their words in Williamson's externalist sense. The verdict that current systems do not transmit testimonial knowledge rests only on the empirical question about governance, which is where a disagreement of this kind belongs. The short answers are at [can AI testify?](/questions/can-ai-testify/) and [do large language models know?](/questions/do-large-language-models-know/)

## What would change the verdict

The verdict is conditional on present architectures and present evidence. If interpretability shows, for particular systems, that truth-tracking structure governs production when no one is intervening, those systems meet the condition and the verdict changes for them. That is not a concession extracted under pressure; it is what a structural constraint is for.

The decisive experiment can be specified. Give a model conflicting passages matched for coherence, specificity and surface authority but differing in evidential quality, and see whether its arbitration follows the evidence or the presentation. Two other questions remain open: whether reward schemes that extend something like verification to history, medicine and law reward evidential bearing or only its appearance, and whether competence learned under verification transfers to domains where nothing verifies.

The argument is set out in full in ["Assertion Without a Speaker"](/publications/assertion-without-a-speaker/). A further paper, "The Legitimacy of Foundation Models", is under review.
