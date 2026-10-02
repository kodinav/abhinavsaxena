---
title: Hallucination (in language models)
definition: "A language model's production of fluent, confident output that is false or unsupported by its sources, such as an invented citation, case or statistic."
aka: ["AI hallucination", "confabulation", "fabrication"]
map: false
order: 118
areas: [philosophy-of-ai, epistemology, ethics-of-ai]
seeAlso:
  - frequency-reliability
  - sycophancy
  - ai-testimony
  - epistemic-luck
sources:
  - text: "Ji, Z., Lee, N., Frieske, R., Yu, T., et al. (2023). Survey of hallucination in natural language generation. *ACM Computing Surveys* 55(12): 1–38."
    url: https://doi.org/10.1145/3571730
  - text: "Huang, L., Yu, W., Ma, W., Zhong, W., et al. (2025). A survey on hallucination in large language models: Principles, taxonomy, challenges, and open questions. *ACM Transactions on Information Systems* 43(2): 1–55."
    url: https://doi.org/10.1145/3703155
  - text: "Kalai, A. T. and Vempala, S. S. (2024). Calibrated language models must hallucinate. In *Proceedings of the 56th Annual ACM Symposium on Theory of Computing*, 160–171."
    url: https://doi.org/10.1145/3618260.3649777
  - text: "Hicks, M. T., Humphries, J. and Slater, J. (2024). ChatGPT is bullshit. *Ethics and Information Technology* 26(2)."
    url: https://doi.org/10.1007/s10676-024-09775-5
---

In language models, hallucination is the production of fluent, confident output that is false or unsupported by the sources the model was given, such as an invented citation, legal case or statistic. Surveys distinguish output that contradicts the source material from output that cannot be verified against it, and failures of factuality from failures of faithfulness to a supplied context. Kalai and Vempala have shown that, for arbitrary facts of a kind that appear only rarely in training data, a model meeting a natural calibration condition must hallucinate at some rate, which suggests the phenomenon is not simply a defect awaiting a patch.

The word carries a picture: a faculty that normally perceives the world and occasionally misfires. On my view that picture has things the wrong way round. A model's false outputs and its true ones issue from the same process, selected by likelihood under a learned distribution and shaped by preference training. A frequency-reliable practice generates true belief, and false belief with the same fluency. A hallucination is not a departure from how the system normally relates to the truth but a case in which frequency and truth diverge. That is also why I rest no argument on error rates: they improve with each generation, and the improvement is consistent with the ground of the reliability being unchanged.

Hicks, Humphries and Slater argue that such output is better described as bullshit, in Frankfurt's sense of speech produced without concern for truth. Their diagnosis and mine overlap, since neither treats false outputs as lies. But my argument needs no claim about what a system is or is not concerned with. The question is third-personal: whether the truth of what is asserted figures, through the system's own operation, in why it is asserted. A correct answer from such a process raises the same question as an incorrect one.

The practical consequence falls on users. Hallucinations are not signalled, and answers to follow-up questions issue from the same process as the original answer, so a user cannot probe a model as she would an informant. Her appropriate stance is that of a reader of an [instrument](/glossary/instrument-reading/) without transparent calibration: reliance calibrated to a record validated in the conditions of use (see also [AI testimony](/glossary/ai-testimony/)).
