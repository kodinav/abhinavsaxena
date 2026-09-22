import type { Experiment } from '../registry';
import { h, slider, panel, note, toggle } from '../ui';

const parties = [
  { id: 'vendor', label: 'Vendor’s developers', color: 'var(--ink)', text: 'Built and trained the model; evaluated it on a population unlike the hospital’s.' },
  { id: 'hospital', label: 'Hospital (deployer)', color: 'var(--ink-2)', text: 'Reviewed and approved the system; decided where and how it would be used.' },
  { id: 'nurse', label: 'Nurse (user)', color: 'var(--ink-3)', text: 'Followed the system’s recommendation over her own hesitation.' },
  { id: 'regulator', label: 'Regulator', color: 'var(--accent-2)', text: 'Set the standard the system had to meet, and the evidence required.' },
  { id: 'system', label: 'The system itself', color: 'var(--accent)', text: 'Produced the recommendation. Learned; was not programmed to do this.' },
] as const;
type P = (typeof parties)[number]['id'];

const positions: { name: string; v: Record<P, number>; text: string }[] = [
  { name: 'Matthias (2004): a genuine gap', v: { vendor: 15, hospital: 15, nurse: 10, regulator: 10, system: 0 }, text: 'No human controlled the outcome closely enough to be blamed; the machine cannot be. Half of the responsibility finds no one.' },
  { name: 'Nissenbaum: many hands', v: { vendor: 30, hospital: 30, nurse: 15, regulator: 25, system: 0 }, text: 'Fully distributed across the humans and institutions, by role. Nothing is assigned to the machine, and nothing is left over.' },
  { name: 'Meaningful human control', v: { vendor: 20, hospital: 45, nurse: 25, regulator: 10, system: 0 }, text: 'Whoever was in a position to exercise control — the deployer above all — answers for its absence.' },
  { name: 'Machine as quasi-agent', v: { vendor: 25, hospital: 25, nurse: 10, regulator: 10, system: 30 }, text: 'The system is an agent of a kind and bears a share, which may be discharged by correction, retraining or withdrawal.' },
];

function cosine(a: number[], b: number[]) {
  const dot = a.reduce((s, x, i) => s + x * b[i], 0);
  const na = Math.hypot(...a), nb = Math.hypot(...b);
  return na && nb ? dot / (na * nb) : 0;
}

const exp: Experiment = {
  mount(root) {
    const alloc: Record<P, number> = { vendor: 0, hospital: 0, nurse: 0, regulator: 0, system: 0 };
    const details = { warning: false, documented: false };
    const scenario = h('p', { class: 'lab-note serif', 'aria-live': 'polite' });
    const segs = parties.map((p) => h('span', { class: 'lab-stack__seg', style: { background: p.color, width: '0%' }, title: p.label }));
    const gapSeg = h('span', { class: 'lab-stack__seg', style: { width: '100%', background: 'transparent' } });
    const stack = h('div', { class: 'lab-stack', role: 'img', 'aria-label': 'Responsibility allocation' }, ...segs, gapSeg);
    const gapEl = h('div', { class: 'lab-reading', 'aria-live': 'polite' });
    const nearest = h('div', { class: 'lab-verdicts' });

    function renderScenario() {
      scenario.innerHTML = `A hospital deploys a triage model. It was trained by a vendor and evaluated on data from a different population${details.documented ? ', <strong>a mismatch the vendor documented in the release notes</strong>' : ''}. The hospital reviewed and approved it. A nurse followed its recommendation over her own hesitation${details.warning ? ' — <strong>after the interface showed a low-confidence warning</strong>' : ''}. A patient was harmed. No one intended it.`;
    }

    function update() {
      const total = Object.values(alloc).reduce((a, b) => a + b, 0);
      const over = total > 100;
      parties.forEach((p, i) => { segs[i].style.width = `${over ? (alloc[p.id] / total) * 100 : alloc[p.id]}%`; });
      const gap = Math.max(0, 100 - total);
      gapSeg.style.width = `${gap}%`;
      if (over) gapEl.innerHTML = `You have assigned <strong>${total}</strong> units of a hundred. Responsibility can be shared, but it is not a quantity that grows with the number of parties; scale back until it sums to a hundred.`;
      else if (gap === 100) gapEl.innerHTML = 'Nothing assigned yet. Move the sliders. The unassigned remainder is the <em>gap</em> — responsibility you think exists but can attach to no one.';
      else if (gap > 30) gapEl.innerHTML = `<strong>${gap} units</strong> attach to no one. That is a substantial gap. Ask: is there really no party who accepted a risk of this kind of harm and benefited from accepting it? Or are you looking for a single culprit where the honest answer is a distribution?`;
      else if (gap > 0) gapEl.innerHTML = `<strong>${gap} units</strong> unassigned. A small residue. It may be tragic remainder — harm that is nobody’s fault — or it may be the part of the map you have not read yet.`;
      else gapEl.innerHTML = 'Fully assigned. On your view there is <strong>no gap</strong>: responsibility was distributed, not lost. The question that remains is whether the distribution is legible — whether anyone wrote down, in advance, who held which part.';
      const mine = parties.map((p) => alloc[p.id]);
      const ranked = positions.map((pos) => ({ pos, s: cosine(mine, parties.map((p) => pos.v[p.id])) })).sort((a, b) => b.s - a.s);
      nearest.replaceChildren(...ranked.map(({ pos, s }, i) => h('div', { class: `lab-verdict ${i === 0 && total > 0 ? 'is-yes' : 'is-open'}` },
        h('span', { class: 'lab-verdict__mark', 'aria-hidden': 'true' }, i === 0 && total > 0 ? '●' : '○'),
        h('div', {}, h('strong', { class: 'lab-verdict__name' }, `${pos.name}${total > 0 ? ` — ${Math.round(s * 100)}% match` : ''}`), h('span', { class: 'lab-verdict__why' }, pos.text)),
      )));
    }

    const sliders = parties.map((p) => slider({ label: p.label, hint: p.text, min: 0, max: 100, value: 0, onInput: (v) => { alloc[p.id] = v; update(); } }));
    const toggles = [
      toggle({ label: 'The interface showed a warning', hint: 'Low confidence was flagged before the nurse acted', onChange: (v) => { details.warning = v; renderScenario(); } }),
      toggle({ label: 'The vendor documented the mismatch', hint: 'Release notes named the population difference', onChange: (v) => { details.documented = v; renderScenario(); } }),
    ];

    root.append(
      h('div', { class: 'lab-grid' },
        h('div', { class: 'lab-col' },
          panel('The case', scenario, ...toggles.map((t) => t.el), note('Change the details and ask whether your allocation should move. If it does, you are reading the map: responsibility follows knowledge and control.')),
          panel('Allocate a hundred units', ...sliders.map((s) => s.el)),
        ),
        h('div', { class: 'lab-col' },
          panel('Where it went', stack, h('div', { class: 'lab-legend' }, parties.map((p) => h('span', { style: { '--c': p.color } as any }, p.label)), h('span', { style: { '--c': 'transparent' } as any, class: 'muted' }, 'Unassigned = gap')), gapEl),
          panel('Nearest positions in the literature', note('Your allocation compared, by direction rather than magnitude, with four positions.'), nearest),
        ),
      ),
    );
    renderScenario(); update();
  },
};
export default exp;
