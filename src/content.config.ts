import { defineCollection, reference, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * Content architecture
 * --------------------
 * Every collection is a folder of files. To add something new, add a file.
 *
 *   src/content/research/      one .md per research area   (body = deeper description)
 *   src/content/publications/  one .md per paper           (body = abstract)
 *   src/content/essays/        one .mdx per essay          (body = the essay)
 *   src/content/lab/           one .md per experiment      (body = framing / instructions)
 *   src/content/questions/     one .md per question        (body = the long answer)
 *   src/content/concepts/      one .md per glossary term   (body = the full entry)
 *   src/content/library/       one .md per open text       (body = commentary)
 *
 * Cross-references use `reference()` so a typo in an id fails the build
 * instead of silently producing a dead link.
 */

/** A question and its answer, for FAQ blocks (rendered visibly and as FAQPage data). */
const faq = z.array(z.object({ q: z.string(), a: z.string() })).default([]);
/** A source to read next: citation text and, where there is one, a link. */
const sources = z.array(z.object({ text: z.string(), url: z.string().url().optional() })).default([]);

const research = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/research' }),
  schema: z.object({
    title: z.string(),
    short: z.string().describe('One-line description shown in the constellation panel'),
    /** Meta description; falls back to `short`. */
    description: z.string().optional(),
    order: z.number().default(99),
    keyQuestions: z.array(z.string()).default([]),
    related: z.array(reference('research')).default([]),
    concepts: z.array(reference('concepts')).default([]),
    /** Optional angle (degrees) and radius (0–1) hint for the constellation layout */
    angle: z.number().optional(),
    radius: z.number().optional(),
  }),
});

const publications = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/publications' }),
  schema: z.object({
    title: z.string(),
    authors: z.array(z.string()).default(['Abhinav Saxena']),
    venue: z.string().describe('Journal, conference, book or publisher'),
    venueType: z
      .enum(['journal', 'conference', 'chapter', 'book', 'preprint', 'thesis', 'other'])
      .default('journal'),
    year: z.number().int(),
    status: z
      .enum(['published', 'forthcoming', 'under-review', 'in-progress', 'preprint'])
      .default('published'),
    doi: z.string().optional(),
    url: z.string().url().optional(),
    pdf: z.string().optional(),
    volume: z.string().optional(),
    issue: z.string().optional(),
    pages: z.string().optional(),
    areas: z.array(reference('research')).default([]),
    topics: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
    /** Short editorial status shown beside the status stamp, e.g. "Minor revisions requested". */
    note: z.string().optional(),
    /** Dates in the editorial record, where known. */
    received: z.coerce.date().optional(),
    accepted: z.coerce.date().optional(),
    published: z.coerce.date().optional(),
    /** Meta description and search-result title for the paper's own page. */
    description: z.string().optional(),
    seoTitle: z.string().optional(),
    /** The argument in plain words, a paragraph per item; papers with none get no page of their own. */
    summary: z.array(z.string()).default([]),
    /** The paper's main claims, one sentence each. */
    claims: z.array(z.string()).default([]),
    concepts: z.array(reference('concepts')).default([]),
    faq,
  }),
});

const essays = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/essays' }),
  schema: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    description: z.string(),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    areas: z.array(reference('research')).default([]),
    tags: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
    /** Explicit related essays; otherwise computed from shared tags/areas. */
    related: z.array(reference('essays')).default([]),
    /** Numbered references rendered after the essay. */
    references: z
      .array(
        z.object({
          text: z.string(),
          url: z.string().url().optional(),
        }),
      )
      .default([]),
    /** Injected by remark-reading-time; do not set by hand. */
    readingTime: z.number().optional(),
    wordCount: z.number().optional(),
  }),
});

const lab = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/lab' }),
  schema: z.object({
    title: z.string(),
    question: z.string().describe('The question the experiment stages'),
    summary: z.string(),
    order: z.number().default(99),
    /** Key of the interactive module in src/scripts/lab/registry.ts */
    module: z.string(),
    duration: z.string().default('5 min'),
    tags: z.array(z.string()).default([]),
    areas: z.array(reference('research')).default([]),
    concepts: z.array(reference('concepts')).default([]),
    draft: z.boolean().default(false),
  }),
});

const questions = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/questions' }),
  schema: z.object({
    /** The page's heading and title. The file name is its address: /questions/<file name>. */
    question: z.string(),
    /** A shorter title for search results, when the question is long. */
    seoTitle: z.string().optional(),
    /** The short answer, given first (two or three sentences). */
    answer: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    /** Listed among the open research questions on the home page. */
    onHome: z.boolean().default(false),
    order: z.number().default(99),
    /** Words in the question to emphasise on hover, e.g. ["know", "artificial system"] */
    emphasis: z.array(z.string()).default([]),
    areas: z.array(reference('research')).default([]),
    essay: reference('essays').optional(),
    /** The paper in which the question is worked out. */
    publication: reference('publications').optional(),
    experiment: reference('lab').optional(),
    concepts: z.array(reference('concepts')).default([]),
    related: z.array(reference('questions')).default([]),
    faq,
    sources,
  }),
});

const relationTypes = z.enum([
  'grounds',
  'requires',
  'constrains',
  'extends',
  'challenges',
  'mediates',
  'presupposes',
]);

const concepts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/concepts' }),
  schema: z.object({
    title: z.string(),
    definition: z.string(),
    /** Other names the term goes by. */
    aka: z.array(z.string()).default([]),
    /** Drawn as a node on the ideas map; glossary-only terms are not. */
    map: z.boolean().default(true),
    order: z.number().default(99),
    /** Part of the site's central thread AI → Mind → Agency → Knowledge → Ethics → Responsibility → Technology */
    spine: z.boolean().default(false),
    relations: z
      .array(
        z.object({
          to: reference('concepts'),
          type: relationTypes,
          note: z.string(),
        }),
      )
      .default([]),
    areas: z.array(reference('research')).default([]),
    /** Further terms in the glossary worth reading next. */
    seeAlso: z.array(reference('concepts')).default([]),
    sources,
  }),
});

const library = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/library' }),
  schema: z.object({
    /** The work's own title. */
    title: z.string(),
    /** The page's heading, e.g. "Hume on testimony: Of Miracles". */
    heading: z.string(),
    seoTitle: z.string().optional(),
    author: z.string(),
    translator: z.string().optional(),
    /** Year of first publication of the original work (negative for BCE). */
    year: z.number().int(),
    /** The edition the passages are taken from. */
    edition: z.string(),
    sourceName: z.string(),
    sourceUrl: z.string().url(),
    licence: z.string(),
    description: z.string(),
    /** Why the text is in this library, in a sentence. */
    lede: z.string(),
    order: z.number().default(99),
    passages: z.array(z.object({ locator: z.string(), label: z.string(), text: z.string() })),
    /** Editorial notes on the text as reproduced (sic readings, omissions). */
    notes: z.string().optional(),
    questions: z.array(reference('questions')).default([]),
    concepts: z.array(reference('concepts')).default([]),
  }),
});

export const collections = { research, publications, essays, lab, questions, concepts, library };
