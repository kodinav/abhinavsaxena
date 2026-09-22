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
 *   src/content/questions/     one .md per open question   (body = why it matters)
 *   src/content/concepts/      one .md per concept node    (body = longer note)
 *
 * Cross-references use `reference()` so a typo in an id fails the build
 * instead of silently producing a dead link.
 */

const research = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/research' }),
  schema: z.object({
    title: z.string(),
    short: z.string().describe('One-line description shown in the constellation panel'),
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
    /** Marked placeholder entries render a visible "sample entry" label. */
    placeholder: z.boolean().default(false),
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
    question: z.string(),
    order: z.number().default(99),
    /** Words in the question to emphasise on hover, e.g. ["know", "artificial system"] */
    emphasis: z.array(z.string()).default([]),
    areas: z.array(reference('research')).default([]),
    essay: reference('essays').optional(),
    experiment: reference('lab').optional(),
    concepts: z.array(reference('concepts')).default([]),
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
  }),
});

export const collections = { research, publications, essays, lab, questions, concepts };
