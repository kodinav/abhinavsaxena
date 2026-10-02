import { site } from '@/data/site';

export function personJsonLd(extra: Record<string, unknown> = {}) {
  const sameAs = site.profiles.filter((p) => p.url).map((p) => p.url);
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': `${site.url}/#person`,
    name: site.name,
    givenName: 'Abhinav',
    familyName: 'Saxena',
    url: site.url,
    jobTitle: 'Philosopher, Independent Researcher',
    description: site.description,
    email: `mailto:${site.email}`,
    homeLocation: { '@type': 'Place', name: site.location },
    alumniOf: [
      { '@type': 'CollegeOrUniversity', name: 'University of Delhi' },
      { '@type': 'CollegeOrUniversity', name: 'Mahatma Jyotiba Phule Rohilkhand University' },
    ],
    knowsAbout: [
      'Epistemology',
      'Epistemology of testimony',
      'Social epistemology of artificial intelligence',
      'Ethics of artificial intelligence',
      'Philosophy of technology',
      'Political philosophy',
      'Ethics',
      'Environmental ethics',
    ],
    ...(sameAs.length ? { sameAs } : {}),
    ...extra,
  };
}

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${site.url}/#website`,
    url: site.url,
    name: site.name,
    description: site.description,
    inLanguage: 'en',
    author: { '@id': `${site.url}/#person` },
    publisher: { '@id': `${site.url}/#person` },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: `${site.url}${it.path}`,
    })),
  };
}

export function articleJsonLd(opts: {
  path: string;
  title: string;
  description: string;
  published: Date;
  updated?: Date;
  tags?: string[];
  wordCount?: number;
  image?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${site.url}${opts.path}#article`,
    mainEntityOfPage: `${site.url}${opts.path}`,
    headline: opts.title,
    description: opts.description,
    datePublished: opts.published.toISOString(),
    dateModified: (opts.updated ?? opts.published).toISOString(),
    author: { '@id': `${site.url}/#person` },
    publisher: { '@id': `${site.url}/#person` },
    inLanguage: 'en',
    isAccessibleForFree: true,
    ...(opts.tags?.length ? { keywords: opts.tags.join(', ') } : {}),
    ...(opts.wordCount ? { wordCount: opts.wordCount } : {}),
    ...(opts.image ? { image: opts.image } : {}),
  };
}

export function scholarlyArticleJsonLd(p: {
  id: string;
  title: string;
  authors: string[];
  year: number;
  /** False for forthcoming work: no publication date is claimed. */
  published?: boolean;
  venue: string;
  venueType: string;
  doi?: string;
  url?: string;
  abstract?: string;
  topics?: string[];
}) {
  const doi = p.doi ? (p.doi.startsWith('http') ? p.doi : `https://doi.org/${p.doi}`) : undefined;
  return {
    '@context': 'https://schema.org',
    '@type': p.venueType === 'chapter' ? 'Chapter' : p.venueType === 'book' ? 'Book' : 'ScholarlyArticle',
    '@id': `${site.url}/publications#${p.id}`,
    headline: p.title,
    name: p.title,
    author: p.authors.map((name) =>
      name === site.name ? { '@id': `${site.url}/#person` } : { '@type': 'Person', name },
    ),
    ...(p.published === false ? { creativeWorkStatus: 'Forthcoming' } : { datePublished: String(p.year) }),
    ...(p.venueType === 'journal' || p.venueType === 'conference'
      ? { isPartOf: { '@type': 'Periodical', name: p.venue } }
      : p.venueType === 'chapter'
        ? { isPartOf: { '@type': 'Book', name: p.venue } }
        : { publisher: { '@type': 'Organization', name: p.venue } }),
    ...(doi ? { sameAs: doi, identifier: doi } : {}),
    ...(p.url ? { url: p.url } : {}),
    ...(p.abstract ? { abstract: p.abstract } : {}),
    ...(p.topics?.length ? { keywords: p.topics.join(', ') } : {}),
  };
}

/** A page of questions and answers. Every pair must also be visible on the page. */
export function faqJsonLd(items: { q: string; a: string }[], path: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${site.url}${path}#faq`,
    mainEntity: items.map((it) => ({
      '@type': 'Question',
      name: it.q,
      acceptedAnswer: { '@type': 'Answer', text: it.a, author: { '@id': `${site.url}/#person` } },
    })),
  };
}

/** A glossary entry, as a term in the site's set of terms. */
export function definedTermJsonLd(t: { id: string; name: string; description: string; aka?: string[] }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'DefinedTerm',
    '@id': `${site.url}/glossary/${t.id}#term`,
    name: t.name,
    description: t.description,
    url: `${site.url}/glossary/${t.id}`,
    ...(t.aka?.length ? { alternateName: t.aka } : {}),
    inDefinedTermSet: { '@id': `${site.url}/glossary#set` },
  };
}

export function definedTermSetJsonLd(terms: { id: string; name: string; description: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'DefinedTermSet',
    '@id': `${site.url}/glossary#set`,
    name: 'Glossary of the epistemology and ethics of AI',
    url: `${site.url}/glossary`,
    author: { '@id': `${site.url}/#person` },
    hasDefinedTerm: terms.map((t) => ({ '@type': 'DefinedTerm', '@id': `${site.url}/glossary/${t.id}#term`, name: t.name, description: t.description })),
  };
}

/** An index page listing items, each with its own address. */
export function itemListJsonLd(path: string, name: string, items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${site.url}${path}`,
    url: `${site.url}${path}`,
    name,
    author: { '@id': `${site.url}/#person` },
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, url: `${site.url}${it.path}` })),
    },
  };
}

/**
 * Google Scholar's citation_* tags, which is how Scholar indexes an
 * article's page. Forthcoming work gives only its year.
 */
export function scholarMeta(p: {
  title: string;
  authors: string[];
  venue: string;
  year: number;
  published?: Date;
  doi?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  pdf?: string;
  path: string;
  keywords?: string[];
}) {
  const date = p.published ? p.published.toISOString().slice(0, 10).replace(/-/g, '/') : String(p.year);
  const meta: { name: string; content: string }[] = [
    { name: 'citation_title', content: p.title },
    ...p.authors.map((a) => ({ name: 'citation_author', content: a })),
    { name: 'citation_publication_date', content: date },
    { name: 'citation_journal_title', content: p.venue },
    { name: 'citation_abstract_html_url', content: `${site.url}${p.path}` },
    { name: 'citation_language', content: 'en' },
  ];
  if (p.volume) meta.push({ name: 'citation_volume', content: p.volume });
  if (p.issue) meta.push({ name: 'citation_issue', content: p.issue });
  if (p.pages) meta.push({ name: 'citation_firstpage', content: p.pages });
  if (p.doi) meta.push({ name: 'citation_doi', content: p.doi });
  if (p.pdf) meta.push({ name: 'citation_pdf_url', content: new URL(p.pdf, site.url).toString() });
  if (p.keywords?.length) meta.push({ name: 'citation_keywords', content: p.keywords.join('; ') });
  return meta;
}
