---
title: Tracking reliability
definition: "Reliability as counterfactual sensitivity: a source is tracking-reliable when its outputs would follow the truth, or the evidence, were these to vary within the reach of its competence."
aka: ["truth-tracking", "counterfactual reliability"]
map: false
order: 102
areas: [epistemology, philosophy-of-ai]
seeAlso:
  - frequency-reliability
  - tracking-minimum
  - safety-and-sensitivity
  - endogeneity-requirement
sources:
  - text: "Nozick, R. (1981). *Philosophical Explanations*. Cambridge, MA: Harvard University Press."
  - text: "Dretske, F. (1971). Conclusive reasons. *Australasian Journal of Philosophy* 49(1): 1–22."
    url: https://doi.org/10.1080/00048407112341001
  - text: "Saxena, A. (forthcoming). Assertion without a speaker: Testimony, tracking, and large language models. *Episteme*."
---

Tracking reliability is reliability understood as counterfactual sensitivity: a source is tracking-reliable when its outputs would follow the truth, or the evidence, were these to vary within the reach of its competence. It is one of two species of reliability I distinguish, the other being [frequency reliability](/glossary/frequency-reliability/), a high rate of accuracy over a fixed distribution of cases.

The idea descends from Dretske's conclusive reasons and Nozick's tracking theory, on which a belief tracks the truth when one would not believe p if p were false and would believe it if p were true. My use differs in two respects. It is a condition on a source's production of assertions rather than on a hearer's belief. And it carries no commitment to sensitivity as the right anti-luck condition on knowledge, a question I leave open (see [safety and sensitivity](/glossary/safety-and-sensitivity/)). What matters is that the truth, or the evidence, figures in the explanation of what the source produces, which an intervention checks: vary the evidence and see whether the output moves; vary a proxy and see whether it does not.

Ordinary cases show the contrast. A working barometer is tracking-reliable: vary the pressure and the reading moves, in virtue of the aneroid cell. A competent teacher is tracking-reliable about her subject: plant a detectable error in her textbook and she catches it. A broken thermometer in a thermostatted room is perfectly accurate and tracks nothing.

Tracking does not require infallibility. It is restricted to relevant nearby alternatives and to the reach of the source's competence, and a source can track the evidence and still be wrong when the evidence misleads.

The distinction matters because language models show the second species of reliability, often to a high degree, and testimony needs the first. Improvement in a system's rate of accuracy does not change what the rate is a rate of. Whether open-domain production in current systems is tracking-reliable is an empirical question; on the best current evidence the answer is no.
