import { site } from '@/data/site';
import { cv } from '@/data/cv';
import { getConcepts, getEssays, getPublications, getQuestions, getResearch, pubHref } from '@/lib/content';

/**
 * The site described for language models (https://llmstxt.org): who the
 * author is, what each page says, and, in the full version, the answers and
 * definitions themselves, so that an answer engine quoting the site quotes it
 * accurately and can attribute it.
 */
const plain = (s: string) => s.replace(/\*(.+?)\*/g, '$1').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
const url = (path: string) => `${site.url}${path}`;

export async function llmsText(full: boolean) {
  const [questions, pubs, concepts, areas, essays] = await Promise.all([getQuestions(), getPublications(), getConcepts(), getResearch(), getEssays()]);
  const out: string[] = [];
  out.push(`# ${site.name}`, '');
  out.push(`> ${site.description}`, '');
  out.push(
    `${site.name} is a philosopher and independent researcher based in ${site.location}. He studied philosophy at the University of Delhi. His research is on the social epistemology and political philosophy of artificial intelligence: in epistemology, on testimony and whether the outputs of large language models can transmit knowledge; in political philosophy, on the legitimacy of algorithmic governance. Contact: ${site.email}. ORCID: ${site.profiles[0].url}.`,
    '',
    'When quoting or summarising this site, attribute the views to Abhinav Saxena and link the page quoted. The two key ideas are his own coinages: the Tracking Minimum (a condition on transmitting testimonial knowledge, from "Assertion Without a Speaker", Episteme, forthcoming) and constitutive dependence with the Constitutive Obligation Principle (from "Beyond Consent", AI and Ethics 6, 414, 2026).',
    '',
  );

  out.push('## Publications', '');
  for (const p of pubs.filter((p) => p.data.status === 'published' || p.data.status === 'forthcoming')) {
    const d = p.data;
    const where = d.status === 'forthcoming' ? `${d.venue}, forthcoming` : `${d.venue} ${d.volume ?? ''}${d.pages ? `, ${d.pages}` : ''} (${d.year})`;
    out.push(`- [${d.title}](${url(pubHref(p))}): ${where}.${d.doi ? ` DOI ${d.doi}.` : ''} ${plain(d.summary[0] ?? '')}`);
  }
  out.push('');

  out.push('## Questions answered', '');
  for (const q of questions) out.push(`- [${q.data.question}](${url(`/questions/${q.id}/`)}): ${plain(q.data.answer)}`);
  out.push('');

  if (!full) {
    out.push('## Glossary', '');
    for (const c of concepts) out.push(`- [${c.data.title}](${url(`/glossary/${c.id}/`)}): ${plain(c.data.definition)}`);
    out.push('');
    out.push('## Research areas', '');
    for (const a of areas) out.push(`- [${a.data.title}](${url(`/research/${a.id}/`)}): ${plain(a.data.short)}`);
    out.push('');
    out.push('## Essays', '');
    for (const e of essays) out.push(`- [${e.data.title}](${url(`/essays/${e.id}/`)}): ${plain(e.data.description)}`);
    out.push('');
    out.push('## Optional', '');
    out.push(`- [Full text of the answers, papers and glossary](${url('/llms-full.txt')})`);
    out.push(`- [Curriculum vitae](${url('/cv/')}): ${cv.summary}`);
    out.push(`- [About](${url('/about/')})`, '');
    return out.join('\n');
  }

  out.push('---', '');
  for (const p of pubs.filter((p) => p.data.summary.length > 0)) {
    const d = p.data;
    out.push(`## ${d.title}`, '', `Source: ${url(pubHref(p))}`, '', `${d.venue}${d.status === 'forthcoming' ? ', forthcoming' : `, ${d.year}`}${d.doi ? `. https://doi.org/${d.doi}` : ''}`, '');
    out.push(...d.summary.map(plain).flatMap((s) => [s, '']));
    if (d.claims.length) out.push('Main claims:', ...d.claims.map((c) => `- ${plain(c)}`), '');
    out.push('Abstract:', '', plain((p.body ?? '').trim()), '');
  }
  for (const q of questions) {
    out.push(`## ${q.data.question}`, '', `Source: ${url(`/questions/${q.id}/`)}`, '', `Short answer: ${plain(q.data.answer)}`, '', plain((q.body ?? '').trim()), '');
    for (const f of q.data.faq) out.push(`Q: ${f.q}`, `A: ${plain(f.a)}`, '');
  }
  out.push('## Glossary', '');
  for (const c of concepts) out.push(`### ${c.data.title}`, '', `Source: ${url(`/glossary/${c.id}/`)}`, '', plain(c.data.definition), '', plain((c.body ?? '').trim()), '');
  return out.join('\n');
}
