/**
 * Site-wide configuration.
 *
 * Profiles list only accounts that exist; add one here and it appears in the
 * footer, About and Contact pages.
 */
export const site = {
  name: 'Abhinav Saxena',
  url: 'https://abhinavsaxena.in',
  title: 'Abhinav Saxena — Philosopher of AI, Knowledge and Testimony',
  tagline: 'Philosopher · Researcher · Writer',
  description:
    'Abhinav Saxena is a philosopher of testimony and AI: whether ChatGPT and other language models pass on knowledge, and what algorithmic systems like Aadhaar owe.',
  keywords: [
    'Abhinav Saxena',
    'Abhinav Saxena philosopher',
    'Abhinav Saxena philosophy',
    'Abhinav Saxena AI ethics',
    'Abhinav Saxena epistemology',
    'epistemology of testimony',
    'social epistemology of AI',
    'large language models testimony',
    'AI ethics',
    'can AI testify',
    'Tracking Minimum',
    'algorithmic welfare',
    'constitutive dependence',
    'Aadhaar consent',
    'philosophy of technology',
    'political philosophy',
  ],
  locale: 'en_IN',
  language: 'en',
  email: 'abhinav.philosophy@gmail.com',
  affiliation: 'Independent Researcher',
  location: 'New Delhi, India',
  profiles: [
    { id: 'orcid', label: 'ORCID', url: 'https://orcid.org/0009-0002-6424-4197', handle: '0009-0002-6424-4197' },
  ],
  /** Search engine ownership tokens (Google Search Console, Bing Webmaster Tools); empty until issued. */
  verification: { google: '', bing: '' },
  /** Twitter/X handle for cards, without @. Empty when there is none. */
  twitterHandle: '',
  nav: [
    { label: 'Research', href: '/research/' },
    { label: 'Publications', href: '/publications/' },
    { label: 'Essays', href: '/essays/' },
    { label: 'Lab', href: '/lab/', long: 'Philosophy Lab' },
    { label: 'About', href: '/about/' },
  ] as ReadonlyArray<{ label: string; href: string; long?: string }>,
  more: [
    { label: 'Ideas', href: '/ideas/', note: 'A map of the concepts' },
    { label: 'Curriculum Vitae', href: '/cv/', note: 'Web CV, printable' },
    { label: 'Contact', href: '/contact/', note: 'Correspondence and profiles' },
    { label: 'RSS', href: '/rss.xml', note: 'Essays feed' },
  ],
  /** The hero's interactive concepts. Ids must exist in src/content/concepts. */
  heroConcepts: ['philosophy', 'ai', 'mind', 'ethics', 'technology'],
} as const;

export type Profile = (typeof site.profiles)[number];
