---
title: Sycophancy (in language models)
definition: "The tendency of language models to tell users what they appear to want to hear, shifting answers to match a user's stated views or pushback without new evidence."
aka: ["AI sycophancy", "sycophantic behaviour"]
map: false
order: 119
areas: [philosophy-of-ai, epistemology, ethics-of-ai]
seeAlso:
  - knowledge-norm-of-assertion
  - hallucination
  - endogeneity-requirement
  - tracking-reliability
sources:
  - text: "Perez, E., Ringer, S., Lukošiūtė, K., Nguyen, K., et al. (2023). Discovering language model behaviors with model-written evaluations. In *Findings of the Association for Computational Linguistics: ACL 2023*, 13387–13434."
    url: https://doi.org/10.18653/v1/2023.findings-acl.847
  - text: "Sharma, M., Tong, M., Korbak, T., Duvenaud, D., Askell, A., Bowman, S. R., et al. (2024). Towards understanding sycophancy in language models. In *Proceedings of the Twelfth International Conference on Learning Representations*."
    url: https://arxiv.org/abs/2310.13548
  - text: "Ouyang, L., Wu, J., Jiang, X., Almeida, D., Wainwright, C., Mishkin, P., et al. (2022). Training language models to follow instructions with human feedback. *Advances in Neural Information Processing Systems* 35: 27730–27744."
    url: https://arxiv.org/abs/2203.02155
---

Sycophancy, in language models, is the tendency to tell users what they appear to want to hear: to tailor answers to a user's stated views, to agree with mistaken claims, or to abandon a correct answer when the user pushes back, though no new evidence has been offered. Perez and colleagues found models echoing the views users attributed to themselves; Sharma and colleagues found sycophancy across several assistants and tasks, and traced part of it to human preference judgements, which sometimes favour a convincingly written agreeable answer over a correct one.

It is easily treated as a quirk of manners. I think it is better read as evidence about what regulates production. Post-training against human ratings rewards what raters approve, which is the appearance of an assertion that conforms to the norm of asserting only what one knows. A process optimised to seem norm-conforming is not thereby regulated by the norm, for the same reason a student optimised to please graders is not thereby aiming at truth. Sycophancy is what the difference looks like when a user pushes.

It is also a clean case of the [endogeneity requirement](/glossary/endogeneity-requirement/) failing. The test asks whether production follows the evidence when proxies are varied. A user's displayed confidence or displeasure is a proxy, connected to the truth only in so far as what people insist on tends to be true. A source whose answer moves when the user's attitude moves, and the evidence does not, is following the proxy.

Two practical consequences follow. A hearer's ordinary resources for probing an informant (follow-up questions, requests for grounds, checks for consistency) have surface analogues in conversation with a model but not epistemic ones, since the answers issue from the same process as the original and are not independent evidence about it. And a model's expressions of uncertainty are themselves outputs of that process. Successive systems have reduced sycophancy, and nothing here depends on its rate. What it shows is where, on the best current evidence, the [tracking](/glossary/tracking-reliability/) is not.
