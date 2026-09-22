/**
 * Curriculum vitae data.
 *
 * Every entry marked `placeholder: true` is sample structure, rendered with a
 * visible "replace" marker. Delete or overwrite entries as you fill in the
 * real CV; the page and PDF rebuild from this file.
 */
export interface CvEntry {
  title: string;
  org?: string;
  place?: string;
  period?: string;
  detail?: string;
  placeholder?: boolean;
}
export interface CvSection {
  id: string;
  title: string;
  entries: CvEntry[];
  /** When true, publications are pulled from the content collection instead. */
  fromPublications?: boolean;
}

export const cv: { summary: string; sections: CvSection[] } = {
  summary:
    'Philosopher and researcher working at the intersection of philosophy of AI, philosophy of mind, ethics and epistemology, with further interests in social epistemology, Indian philosophy, phenomenology and existentialism.',
  sections: [
    {
      id: 'education',
      title: 'Education',
      entries: [
        { title: 'Doctoral degree in Philosophy', org: 'Institution — replace', place: 'City, Country', period: 'Years — replace', detail: 'Dissertation title and supervisors — replace.', placeholder: true },
        { title: "Master's degree in Philosophy", org: 'Institution — replace', place: 'City, Country', period: 'Years — replace', placeholder: true },
        { title: "Bachelor's degree", org: 'Institution — replace', place: 'City, Country', period: 'Years — replace', placeholder: true },
      ],
    },
    {
      id: 'positions',
      title: 'Academic positions',
      entries: [
        { title: 'Position title — replace', org: 'Institution — replace', period: 'Years — replace', detail: 'One line on responsibilities — replace.', placeholder: true },
      ],
    },
    {
      id: 'research',
      title: 'Research areas',
      entries: [
        { title: 'Philosophy of AI · Ethics of AI · Philosophy of Mind' },
        { title: 'Epistemology · Social Epistemology · Ethics & Technology' },
        { title: 'Indian Philosophy · Phenomenology · Existentialism' },
      ],
    },
    { id: 'publications', title: 'Publications', entries: [], fromPublications: true },
    {
      id: 'talks',
      title: 'Presentations',
      entries: [
        { title: 'Talk title — replace', org: 'Conference or seminar — replace', place: 'City', period: 'Year', placeholder: true },
      ],
    },
    {
      id: 'teaching',
      title: 'Teaching',
      entries: [
        { title: 'Course title — replace', org: 'Institution — replace', period: 'Term, year', placeholder: true },
      ],
    },
    {
      id: 'service',
      title: 'Service & reviewing',
      entries: [
        { title: 'Reviewer / committee / editorial role — replace', org: 'Journal or organisation — replace', period: 'Years', placeholder: true },
      ],
    },
    {
      id: 'languages',
      title: 'Languages',
      entries: [
        { title: 'Language — proficiency — replace', placeholder: true },
      ],
    },
  ],
};
