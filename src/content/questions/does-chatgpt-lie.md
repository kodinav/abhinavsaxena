---
question: Does ChatGPT lie, or is a 'hallucination' something else?
answer: "It does not lie, because lying is asserting what you believe to be false, and nothing in how a language model produces an answer is a belief that the answer contradicts. But 'hallucination' is misleading too: a false answer is produced by the same process as a true one. The truth of a particular answer plays no part in why it was given, which is why errors arrive with the same fluency as facts."
description: 'Does ChatGPT lie? Why AI hallucinations are neither lies nor misfires: false answers come from the same process as true ones. By Abhinav Saxena.'
date: 2026-10-02
order: 13
emphasis: ["lie", "hallucination"]
areas: [epistemology, philosophy-of-ai, ethics-of-ai]
publication: assertion-without-a-speaker
concepts: [hallucination, sycophancy, chain-of-thought-faithfulness, knowledge-norm-of-assertion]
related: [should-you-trust-chatgpt, do-large-language-models-know, can-ai-testify]
faq:
  - q: Why do AI chatbots make things up?
    a: Because their open-domain answers are produced by selecting continuations that are likely given the text they were trained on and the training that shaped them, not by checking the answer against the facts it is about. Where likely text and true text coincide, the answer is right; where they come apart, it is wrong, and the process looks the same from the inside in both cases.
  - q: Will hallucinations disappear as models improve?
    a: They become rarer, and that matters practically. Whether they disappear depends on whether production comes to be governed by the truth rather than by a proxy for it. In domains where training checks answers with a verifier, such as proofs and running code, something like that already happens; elsewhere it has not been shown.
  - q: Can an AI be held responsible for a false answer?
    a: Its makers and deployers can be, and a system can be criticised for failing at the function it was built for. But the deployer has not seen the answer, does not believe it and would disclaim it. Responsibility for putting a system into the world is not authorship of its sentences.
sources:
  - text: "Saxena, A. (forthcoming). Assertion without a speaker: Testimony, tracking, and large language models. *Episteme*."
  - text: "Lin, S., Hilton, J. and Evans, O. (2022). TruthfulQA: Measuring how models mimic human falsehoods. In *Proceedings of the 60th Annual Meeting of the Association for Computational Linguistics*, 3214–3252."
  - text: "Turpin, M., Michael, J., Perez, E. and Bowman, S. R. (2023). Language models don't always say what they think: Unfaithful explanations in chain-of-thought prompting. *Advances in Neural Information Processing Systems* 36."
  - text: "Butlin, P. and Viebahn, E. (2025). AI assertion. *Ergo: An Open Access Journal of Philosophy* 12."
seoTitle: Does ChatGPT Lie? What AI Hallucination Really Is
---

When a chatbot invents a court case or a citation, it is tempting to say that it lied. It is equally tempting, and more common in the industry, to call the error a hallucination, as if the system ordinarily perceived the facts and occasionally saw things that were not there. Both descriptions get the structure wrong, in opposite directions.

## Why it is not lying

To lie is to assert what you believe to be false, usually in order to be believed. On the best current evidence, the production of a language model's open-domain answer is not governed by anything that plays the role of a belief which the answer could contradict. Researchers have found internal structure that correlates with truth, and it can be used to steer outputs; whether it governs what the model says when nobody steers is not established. Without that, there is nothing for a false answer to be insincere *about*.

## Why 'hallucination' misleads

The word implies that true answers come from a faculty working properly and false ones from a faculty misfiring. That is not the picture. On the standard description, true and false answers come out of the same process: the selection of continuations that are likely given what the model learned, adjusted by training against human approval. Where likely text and true text coincide, which in well-covered domains is very often, the answer is right. Where they come apart, it is wrong. Nothing in the production of the particular answer distinguishes the two cases.

So a 'hallucination' is not a malfunction of a truth-tracking process. It is what an accuracy-without-tracking process does when its proxy for truth, the regularities of the text it learned from, fails to fit the case. That is why models reproduce common misconceptions that are widely written down, and why a request to explain an answer produces a fluent rationale that can be disconnected from what actually drove the answer.

## What follows

The practical lesson is the one I draw in [Should you trust what ChatGPT tells you?](/questions/should-you-trust-chatgpt/): fluency and confidence are not evidence, because they are outputs of the same process as the answer. The theoretical lesson is that the line that matters is not between honest and dishonest outputs, or between seeing and hallucinating, but between production that is governed by the truth of what is said and production that is not. That line is the [Tracking Minimum](/questions/tracking-minimum/), and current systems' open-domain answers fall on the wrong side of it.
