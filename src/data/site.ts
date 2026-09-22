/**
 * Site-wide configuration.
 *
 * Fields marked PLACEHOLDER are safe to leave as-is until you have the real
 * value. Empty profile URLs are rendered as "pending" rather than invented.
 */
export const site = {
  name: 'Abhinav Saxena',
  url: 'https://abhinavsaxena.in',
  title: 'Abhinav Saxena — Philosopher & Researcher',
  tagline: 'Philosopher · Researcher · Writer',
  description:
    'Abhinav Saxena is a philosopher and researcher working at the intersection of philosophy of AI, philosophy of mind, ethics, and epistemology — on what knowledge, agency and responsibility become when they are mediated by machines.',
  keywords: [
    'Abhinav Saxena',
    'Abhinav Saxena philosopher',
    'Abhinav Saxena philosophy',
    'Abhinav Saxena AI ethics',
    'Abhinav Saxena philosophy of AI',
    'Abhinav Saxena researcher',
    'philosophy of artificial intelligence',
    'ethics of AI',
    'philosophy of mind',
    'epistemology',
    'social epistemology',
    'Indian philosophy',
    'phenomenology',
  ],
  locale: 'en_IN',
  language: 'en',
  /** PLACEHOLDER — replace with your preferred academic contact address. */
  email: 'contact@abhinavsaxena.in',
  /** PLACEHOLDER — institution / affiliation. Leave empty to hide. */
  affiliation: '',
  /** PLACEHOLDER — city, country. Leave empty to hide. */
  location: '',
  /**
   * Academic and social profiles. Leave `url` empty until you have one:
   * the UI shows the profile as pending instead of linking to nothing.
   */
  profiles: [
    { id: 'orcid', label: 'ORCID', url: '', handle: '' },
    { id: 'scholar', label: 'Google Scholar', url: '', handle: '' },
    { id: 'philpapers', label: 'PhilPapers', url: '', handle: '' },
    { id: 'philpeople', label: 'PhilPeople', url: '', handle: '' },
    { id: 'academia', label: 'Academia.edu', url: '', handle: '' },
    { id: 'linkedin', label: 'LinkedIn', url: '', handle: '' },
    { id: 'x', label: 'X (Twitter)', url: '', handle: '' },
    { id: 'bluesky', label: 'Bluesky', url: '', handle: '' },
    { id: 'github', label: 'GitHub', url: '', handle: '' },
  ],
  /** Twitter/X handle for cards, without @. Leave empty if none. PLACEHOLDER */
  twitterHandle: '',
  nav: [
    { label: 'Research', href: '/research' },
    { label: 'Publications', href: '/publications' },
    { label: 'Essays', href: '/essays' },
    { label: 'Lab', href: '/lab', long: 'Philosophy Lab' },
    { label: 'About', href: '/about' },
  ] as ReadonlyArray<{ label: string; href: string; long?: string }>,
  more: [
    { label: 'Ideas', href: '/ideas', note: 'A map of the concepts' },
    { label: 'Curriculum Vitae', href: '/cv', note: 'Web CV, printable' },
    { label: 'Contact', href: '/contact', note: 'Correspondence and profiles' },
    { label: 'RSS', href: '/rss.xml', note: 'Essays feed' },
  ],
  /** The hero's interactive concepts. Ids must exist in src/content/concepts. */
  heroConcepts: ['philosophy', 'ai', 'mind', 'ethics', 'technology'],
} as const;

export type Profile = (typeof site.profiles)[number];
