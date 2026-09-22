import type { Experiment } from '../registry';
import { h, slider, bar, panel, note } from '../ui';

/** Evidence dimensions and how much each candidate exhibits them (0..1). */
const dims = [
  { id: 'language', label: 'Fluent language', hint: 'Converses, argues, explains itself' },
  { id: 'behaviour', label: 'Flexible behaviour', hint: 'Adapts to novel situations, revises plans' },
  { id: 'body', label: 'A body in the world', hint: 'Acts, perceives, is located somewhere' },
  { id: 'biology', label: 'A nervous system', hint: 'Neurons, chemistry, evolutionary history' },
  { id: 'history', label: 'A life history', hint: 'Learned over time, remembers, anticipates' },
  { id: 'suffering', label: 'Can be harmed', hint: 'Things can go well or badly for it' },
  { id: 'report', label: 'Says it has a mind', hint: 'Self-report, first-person claims' },
] as const;
type Dim = (typeof dims)[number]['id'];

const candidates: { name: string; profile: Record<Dim, number>; blurb: string }[] = [
  { name: 'A human child', blurb: 'Two years old; few words; obviously a someone.', profile: { language: 0.3, behaviour: 0.8, body: 1, biology: 1, history: 0.6, suffering: 1, report: 0.2 } },
  { name: 'An octopus', blurb: 'No language; astonishing problem-solving; a nervous system unlike ours.', profile: { language: 0, behaviour: 0.9, body: 1, biology: 1, history: 0.7, suffering: 0.9, report: 0 } },
  { name: 'A language model', blurb: 'Fluent in every register; no body; will tell you whatever you ask about its inner life.', profile: { language: 1, behaviour: 0.6, body: 0, biology: 0, history: 0.2, suffering: 0, report: 0.9 } },
  { name: 'A corporation', blurb: 'Pursues goals, adapts, speaks through spokespeople, has a history and a legal personhood.', profile: { language: 0.7, behaviour: 0.7, body: 0.3, biology: 0, history: 0.9, suffering: 0.1, report: 0.5 } },
  { name: 'A thermostat', blurb: 'Senses, responds, "wants" the room at 21°.', profile: { language: 0, behaviour: 0.1, body: 0.4, biology: 0, history: 0, suffering: 0, report: 0 } },
];

const presets: { name: string; w: Record<Dim, number>; note: string }[] = [
  { name: 'Turing', w: { language: 5, behaviour: 4, body: 0, biology: 0, history: 1, suffering: 0, report: 2 }, note: 'Behaviour in conversation is all the evidence we ever have of other minds — so it is all we should ask for.' },
  { name: 'Searle', w: { language: 1, behaviour: 2, body: 3, biology: 5, history: 2, suffering: 3, report: 0 }, note: 'Syntax is not sufficient for semantics; minds are caused by the specific causal powers of brains.' },
  { name: 'Nagel', w: { language: 0, behaviour: 1, body: 2, biology: 3, history: 2, suffering: 5, report: 1 }, note: 'A mind is something it is like to be. What matters is whether there is a point of view, not what it can do.' },
  { name: 'Dennett', w: { language: 3, behaviour: 5, body: 1, biology: 0, history: 3, suffering: 1, report: 1 }, note: 'If treating it as a believer lets you predict it, it has beliefs in the only sense that matters.' },
];

function reading(w: Record<Dim, number>) {
  const total = Object.values(w).reduce((a, b) => a + b, 0) || 1;
  const p = (k: Dim) => w[k] / total;
  const beh = p('language') + p('behaviour') + p('report');
  const bio = p('body') + p('biology') + p('history');
  const phen = p('suffering');
  if (total === 0) return 'With no criteria, every candidate scores the same. That is not neutrality; it is a refusal to judge.';
  if (beh > 0.6) return 'Your criteria are <strong>behaviourist</strong>: what a thing does and says settles what it is. On this weighting the language model outranks the octopus — and the corporation is not far behind. Ask whether that is a discovery about minds or an artefact of the instrument.';
  if (bio > 0.6) return 'Your criteria are <strong>biological</strong>: minds are a kind of thing certain organisms are. The model drops out entirely, however fluent. Ask what it is about carbon that does the work — and whether you could tell a silicon octopus from a real one.';
  if (phen > 0.4) return 'Your criteria are <strong>phenomenal</strong>: a mind is something it is like to be. Notice that this is the one dimension no candidate can demonstrate from the outside; you have scored them by guessing, and your guesses track biology.';
  return 'Your criteria are <strong>pluralist</strong>: no single kind of evidence dominates. The ranking is stable but the margins are small — which suggests the candidates differ in <em>which</em> features of mind they have, not in <em>how much</em> mind.';
}

const exp: Experiment = {
  mount(root) {
    const w: Record<Dim, number> = { language: 3, behaviour: 3, body: 2, biology: 2, history: 2, suffering: 3, report: 1 };
    const bars = candidates.map((c) => bar(c.name, 0, { sub: '' }));
    const ranked = h('div', { class: 'lab-ranked' }, bars.map((b) => b.el));
    const readingEl = h('div', { class: 'lab-reading', 'aria-live': 'polite' });
    const presetNote = h('p', { class: 'lab-note serif' }, 'Set the weights yourself, or borrow a philosopher’s.');

    const sliders = dims.map((d) =>
      slider({ label: d.label, hint: d.hint, min: 0, max: 5, value: w[d.id], onInput: (v) => { w[d.id] = v; update(); } }),
    );

    function update() {
      const total = Object.values(w).reduce((a, b) => a + b, 0);
      const scores = candidates.map((c, i) => ({ i, s: total ? dims.reduce((acc, d) => acc + w[d.id] * c.profile[d.id], 0) / total : 0.5 }));
      scores.forEach(({ i, s }) => bars[i].set(s));
      // re-order by score with a transform-based move (cheap, animated)
      const order = [...scores].sort((a, b) => b.s - a.s);
      order.forEach((o, rank) => { bars[o.i].el.style.order = String(rank); bars[o.i].el.classList.toggle('is-top', rank === 0); });
      readingEl.innerHTML = reading(w);
    }

    const presetBtns = presets.map((p) =>
      h('button', { type: 'button', class: 'chip', onclick: () => { Object.assign(w, p.w); sliders.forEach((s, i) => s.set(w[dims[i].id])); presetNote.textContent = `${p.name}: ${p.note}`; update(); } }, p.name),
    );

    root.append(
      h('div', { class: 'lab-grid' },
        h('div', { class: 'lab-col' },
          panel('How much should each count?', ...sliders.map((s) => s.el)),
          panel('Borrow a weighting', h('div', { class: 'lab-presets' }, presetBtns), presetNote),
        ),
        h('div', { class: 'lab-col' },
          panel('Verdict on five candidates', h('p', { class: 'lab-note serif' }, 'Scored 0–100 by your criteria. The order updates as you move the sliders.'), ranked),
          panel('What the instrument says about you', readingEl),
          panel('The candidates', h('div', { class: 'lab-cards' }, candidates.map((c) => h('div', { class: 'lab-card' }, h('h4', {}, c.name), h('p', {}, c.blurb))))),
        ),
      ),
    );
    update();
  },
};
export default exp;
