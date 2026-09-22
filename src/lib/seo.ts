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
    jobTitle: 'Philosopher and Researcher',
    description: site.description,
    knowsAbout: [
      'Philosophy of artificial intelligence',
      'Ethics of artificial intelligence',
      'Philosophy of mind',
      'Epistemology',
      'Social epistemology',
      'Ethics and technology',
      'Indian philosophy',
      'Phenomenology',
      'Existentialism',
    ],
    ...(site.affiliation ? { affiliation: { '@type': 'Organization', name: site.affiliation } } : {}),
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
    datePublished: String(p.year),
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
