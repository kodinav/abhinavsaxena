/**
 * Curriculum vitae data. The web CV, the About page timeline and the PDF all
 * rebuild from this file and from the publications collection.
 */
export interface CvEntry {
  title: string;
  org?: string;
  place?: string;
  period?: string;
  detail?: string;
  /** Optional link for the entry (e.g. a referee's email as mailto:). */
  href?: string;
}
export interface CvSection {
  id: string;
  title: string;
  entries: CvEntry[];
  /** Pull entries from the publications collection instead of `entries`. */
  fromPublications?: 'published' | 'under-review';
}

export const cv: { summary: string; sections: CvSection[] } = {
  summary:
    'Philosopher working in epistemology, with a focus on testimony and the social epistemology of artificial intelligence. Areas of competence: philosophy of technology, political philosophy, ethics and environmental ethics.',
  sections: [
    {
      id: 'aos',
      title: 'Areas of specialisation',
      entries: [{ title: 'Epistemology, with a focus on testimony and the social epistemology of artificial intelligence' }],
    },
    {
      id: 'aoc',
      title: 'Areas of competence',
      entries: [{ title: 'Philosophy of technology · Political philosophy · Ethics · Environmental ethics' }],
    },
    {
      id: 'education',
      title: 'Education',
      entries: [
        {
          title: 'M.A. Philosophy',
          org: 'University of Delhi',
          period: '2023–2025',
          detail:
            'Degree to be conferred December 2026. Dissertation: Psychocentrism: A Cognitive Reorientation of Environmental Ethics. Supervised by Dr Narmada Pujari.',
        },
        { title: 'B.A. Philosophy', org: 'Mahatma Jyotiba Phule Rohilkhand University', period: '2023' },
      ],
    },
    { id: 'publications', title: 'Publications', entries: [], fromPublications: 'published' },
    { id: 'under-review', title: 'Under review', entries: [], fromPublications: 'under-review' },
    {
      id: 'talks',
      title: 'Conference presentations',
      entries: [
        {
          title: 'Beyond Consent: Algorithmic Welfare, Constitutive Dependence, and the Limits of Liberal AI Ethics',
          org: 'Interdisciplinary Speaker Series on the Ethics of AI, Indian Institute of Technology Delhi',
          period: 'April 2026',
        },
        {
          title: 'Assertion Without a Speaker: Testimony, Tracking, and Large Language Models',
          org: 'AI and Knowledge, University of Delhi',
          period: 'February 2026',
        },
      ],
    },
    {
      id: 'referees',
      title: 'Referees',
      entries: [
        {
          title: 'Dr R. M. Singh',
          org: 'Professor and Head, Department of Philosophy, University of Delhi',
          detail: 'rmsingh@philosophy.du.ac.in',
          href: 'mailto:rmsingh@philosophy.du.ac.in',
        },
        {
          title: 'Dr Narmada Pujari',
          org: 'Assistant Professor, Department of Philosophy, University of Delhi',
          detail: 'npoojari@philosophy.du.ac.in',
          href: 'mailto:npoojari@philosophy.du.ac.in',
        },
      ],
    },
  ],
};
