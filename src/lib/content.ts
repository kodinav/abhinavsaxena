import { getCollection, type CollectionEntry } from 'astro:content';

export async function getEssays() {
  const all = await getCollection('essays', ({ data }) => !data.draft || import.meta.env.DEV);
  return all.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export async function getPublications() {
  const all = await getCollection('publications');
  return all.sort((a, b) => b.data.year - a.data.year || a.data.title.localeCompare(b.data.title));
}

export async function getResearch() {
  const all = await getCollection('research');
  return all.sort((a, b) => a.data.order - b.data.order);
}

export async function getLab() {
  const all = await getCollection('lab', ({ data }) => !data.draft || import.meta.env.DEV);
  return all.sort((a, b) => a.data.order - b.data.order);
}

export async function getQuestions() {
  const all = await getCollection('questions');
  return all.sort((a, b) => a.data.order - b.data.order);
}

export async function getConcepts() {
  const all = await getCollection('concepts');
  return all.sort((a, b) => a.data.order - b.data.order);
}

/** Essays that share tags or research areas with the given one, best matches first. */
export function relatedEssays(
  essay: CollectionEntry<'essays'>,
  all: CollectionEntry<'essays'>[],
  limit = 3,
) {
  const explicit = essay.data.related.map((r) => r.id);
  const areas = new Set(essay.data.areas.map((a) => a.id));
  const tags = new Set(essay.data.tags);
  return all
    .filter((e) => e.id !== essay.id)
    .map((e) => {
      let score = explicit.includes(e.id) ? 100 : 0;
      score += e.data.areas.filter((a) => areas.has(a.id)).length * 3;
      score += e.data.tags.filter((t) => tags.has(t)).length * 2;
      return { e, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.e);
}

export function byArea<T extends { data: { areas: { id: string }[] } }>(items: T[], areaId: string) {
  return items.filter((i) => i.data.areas.some((a) => a.id === areaId));
}
