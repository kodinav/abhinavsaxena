---
question: What is the Tracking Minimum?
answer: "The Tracking Minimum is a necessary condition on passing on knowledge by telling: a source can transmit testimonial knowledge that p only if the truth of p, or the evidence for it, figures in the explanation of why the source asserted p, and does so through the source's own operation rather than through a proxy on which that operation depends."
description: 'The Tracking Minimum: the condition every theory of testimony shares, why accuracy is not enough, and why a barometer passes where an LLM fails.'
date: 2026-10-02
order: 10
emphasis: ["Tracking Minimum"]
areas: [epistemology, social-epistemology]
publication: assertion-without-a-speaker
concepts: [tracking-minimum, endogeneity-requirement, safety-and-sensitivity, testimony]
related: [can-ai-testify, do-large-language-models-know, instrument-or-informant]
faq:
  - q: Who proposed the Tracking Minimum?
    a: "I state and defend it in \"Assertion Without a Speaker: Testimony, Tracking, and Large Language Models\", forthcoming in Episteme. The paper argues that it is entailed by the five leading accounts of testimony, those of Burge, Williamson, Goldberg, Faulkner and Lackey."
  - q: Is the Tracking Minimum the same as Nozick's tracking condition?
    a: It is in the vicinity but weaker in one respect and different in kind. It constrains the source's production rather than the hearer's belief, and it is stated in terms of explanation rather than of a particular modal profile, so it is neutral between sensitivity and safety as anti-luck conditions.
  - q: Does a source have to believe what it says to meet it?
    a: No. Lackey's selfless asserters, such as the creationist teacher who competently teaches evolution without believing it, meet it, because their production of assertions responds to the evidence as far as their competence reaches. Belief is one way of meeting the condition, not the only one.
  - q: Can a machine meet it?
    a: Yes, in principle. A working barometer does. Training with verifiers that check correctness, in domains where a verifier exists, is plausibly a way for a language model to meet it. The claim is that current models' open-domain answers do not, on the best current evidence.
sources:
  - text: "Saxena, A. (forthcoming). Assertion without a speaker: Testimony, tracking, and large language models. *Episteme*."
  - text: "Nozick, R. (1981). *Philosophical Explanations*. Cambridge, MA: Harvard University Press."
  - text: "Goldberg, S. C. (2010). *Relying on Others: An Essay in Epistemology*. Oxford: Oxford University Press."
  - text: "Faulkner, P. (2011). *Knowledge on Trust*. Oxford: Oxford University Press."
  - text: "Pritchard, D. (2005). *Epistemic Luck*. Oxford: Oxford University Press."
seoTitle: The Tracking Minimum, Explained
---

The Tracking Minimum (TM) is the name I give to the condition the leading theories of testimony share beneath their disagreements. It is a minimum: necessary for passing on knowledge by telling, not sufficient.

> **The Tracking Minimum.** A source S can transmit testimonial knowledge that *p* to a hearer only if the truth of *p*, or the evidential support for *p*, figures in the explanation of S's producing the assertion that *p*, and figures there in virtue of the operation of S's own production process rather than in virtue of a proxy on which that process depends.

## Why it has to be stated at exactly this strength

A constraint weak enough to be common ground may be too weak to exclude anything; one strong enough to exclude may be nobody's minimum. The broken thermometer fixes the target. It sits in a room held at a constant temperature by a thermostat. It would read the same whatever the temperature, so its readings are correct, and correct for a stable, explicable reason. Yet nobody thinks that posting them passes on knowledge of the temperature.

A merely statistical reading of the condition, a high rate of non-accidental accuracy, is too weak: the thermometer has it. An internalist reading, production governed by states the source itself takes to be evidence, is too strong, and not common ground: Lackey's cases show belief is not required, and externalist and function-first accounts of assertion reject a first-person grasp condition. The reading I defend is explanatory. The truth, or the evidence for it, must figure in why the assertion was made.

## The endogeneity requirement

The clause about proxies does most of the work. Without it, the statistical reading returns by the back door, because explanation is promiscuous: evidence explains what gets written down, what gets written down explains what a text-trained system produces, so evidence figures, at some remove, in the explanation of its output.

The [endogeneity requirement](/glossary/endogeneity-requirement/) asks that the connection hold through the source's own operation. Where a process is connected to the truth only because it is connected to a proxy that is so connected, the proxy screens the truth off: hold the proxy fixed and vary the truth, and the output does not move. That is the test, and it is interventionist rather than psychological. Nothing in it requires that the source have a perspective, and nothing prejudges whether a machine can pass.

## Two ways to meet it

A source meets the condition **originally** when its own production secures the connection: through belief based on adequate grounds, through production that responds to evidence, or through production regulated by norms whose function is to keep assertion to the truth. It meets it **derivatively** when it faithfully preserves a particular assertion whose source meets it originally, as a recording or a careful relay does. That is how chains of testimony work.

## A barometer passes

One consequence surprised me. A well-functioning barometer satisfies the Tracking Minimum: vary the pressure and the reading moves, in virtue of the instrument's own mechanism. So the condition is not the line between testimony and instruments, and cannot be. It marks something testimony requires and a well-made instrument happens also to meet. That large language models, on the best current evidence, meet it in neither way is therefore a result about them rather than about their category, and it is sharper than a reclassification: they fail a condition [ordinary instruments](/questions/instrument-or-informant/) meet by construction.
