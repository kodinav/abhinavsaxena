import type { CollectionEntry } from 'astro:content';

export function formatDate(d: Date, opts: Intl.DateTimeFormatOptions = {}) {
  return new Intl.DateTimeFormat('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
    ...opts,
  }).format(d);
}

export function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export const statusLabel: Record<CollectionEntry<'publications'>['data']['status'], string> = {
  published: 'Published',
  forthcoming: 'Forthcoming',
  'under-review': 'Under review',
  'in-progress': 'In progress',
  preprint: 'Preprint',
};

export const venueTypeLabel: Record<CollectionEntry<'publications'>['data']['venueType'], string> = {
  journal: 'Journal article',
  conference: 'Conference paper',
  chapter: 'Book chapter',
  book: 'Book',
  preprint: 'Preprint',
  thesis: 'Thesis',
  other: 'Other',
};

/** Join authors in an academic style: "A, B & C" */
export function formatAuthors(authors: string[]) {
  if (authors.length <= 1) return authors.join('');
  if (authors.length === 2) return `${authors[0]} & ${authors[1]}`;
  return `${authors.slice(0, -1).join(', ')} & ${authors[authors.length - 1]}`;
}

/** The date slot of a citation: the year once published, the status before that. */
export function citationDate(p: CollectionEntry<'publications'>['data']) {
  if (p.status === 'forthcoming') return 'forthcoming';
  if (p.status === 'under-review') return 'under review';
  if (p.status === 'in-progress') return 'in progress';
  return String(p.year);
}

/** Plain-text citation for copy-to-clipboard and meta tags */
export function formatCitation(p: CollectionEntry<'publications'>['data']) {
  const bits: string[] = [];
  bits.push(`${formatAuthors(p.authors)} (${citationDate(p)}).`);
  bits.push(`${p.title}.`);
  if (p.venueType === 'chapter') bits.push(`In ${p.venue}.`);
  else bits.push(`${p.venue}${p.volume ? ` ${p.volume}` : ''}${p.issue ? `(${p.issue})` : ''}${p.pages ? `, ${p.pages}` : ''}.`);
  if (p.doi) bits.push(`https://doi.org/${p.doi.replace(/^https?:\/\/doi\.org\//, '')}`);
  else if (p.url) bits.push(p.url);
  return bits.join(' ');
}

export function doiUrl(doi?: string) {
  if (!doi) return undefined;
  return doi.startsWith('http') ? doi : `https://doi.org/${doi}`;
}

const numberWords = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen', 'Twenty'];

/** "Eleven" for 11, so headings that state a count stay true as content changes. */
export function countWord(n: number) {
  return numberWords[n] ?? String(n);
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function readingLabel(min?: number) {
  if (!min) return '';
  return `${min} min read`;
}

/** Reading time in minutes computed from an entry body (matches the remark plugin's rate). */
export function readingTimeOf(body: string | undefined) {
  if (!body) return undefined;
  const words = body.replace(/^---[\s\S]*?---/, '').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 230));
}
