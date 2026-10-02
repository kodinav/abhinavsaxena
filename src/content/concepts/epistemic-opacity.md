---
title: Epistemic opacity
definition: "The condition of a process whose epistemically relevant elements an agent cannot all know, as with a complex simulation or a trained neural network."
aka: ["opacity", "the black-box problem", "essential epistemic opacity"]
map: false
order: 105
areas: [epistemology, philosophy-of-ai, ethics-of-ai]
seeAlso:
  - computational-reliabilism
  - instrument-reading
  - explanation
  - chain-of-thought-faithfulness
sources:
  - text: "Humphreys, P. (2009). The philosophical novelty of computer simulation methods. *Synthese* 169(3): 615–626."
    url: https://doi.org/10.1007/s11229-008-9435-2
  - text: "Creel, K. A. (2020). Transparency in complex computational systems. *Philosophy of Science* 87(4): 568–589."
    url: https://doi.org/10.1086/709729
  - text: "Sullivan, E. (2022). Understanding from machine learning models. *The British Journal for the Philosophy of Science* 73(1): 109–133."
    url: https://doi.org/10.1093/bjps/axz035
---

A process is epistemically opaque to an agent when the agent cannot know all of its epistemically relevant elements. Humphreys introduced the notion for computer simulation, where no human can survey every step of a computation that nonetheless delivers scientific results, and distinguished essential opacity, which follows from the nature of the agent and the process, from opacity that is merely a practical limit. Trained neural networks are now the standard example.

The literature that followed has largely concluded that opacity is compatible with warranted reliance under conditions. Durán and Formanek's [computational reliabilism](/glossary/computational-reliabilism/) grounds warrant in verification and validation, robustness analysis and a history of successful use rather than insight into the process. Creel distinguished the several things transparency might mean: of the algorithm, of its implementation in code, of the particular run that produced an output. Sullivan argued that opacity obstructs understanding less than uncertainty about the link between a model and its target.

I accept all of this, and argue that the predicament of language models is an acute instance of it, with a difference. Opacity, so described, is a limit on what a user can know about a connection that obtains. A barometer is opaque to someone who does not understand aneroid cells, and the remedy is that she learn, or consult someone who has. With current language models the deeper trouble is not the user's access to the calibration but the calibration: nothing in the production of an open-domain assertion is keyed to the truth of the particular content emitted. They are opaque instruments in the ordinary sense, and degenerate ones as well.

This is why the demand for validation is not a formality. When an instrument is opaque but sound, validation confirms a connection one could in principle inspect. When it is opaque and the connection runs through proxies, the record a user projects is all the connection there is. Interpretability research could change this verdict for particular systems, and the [Tracking Minimum](/glossary/tracking-minimum/) specifies what it would have to show.
