import type { Experiment } from '../registry';
import { h, slider, panel, note } from '../ui';

const N = 200;
const scenarios = [
  { id: 'gradual', title: 'Gradual replacement', text: 'Over ten years, every neuron is replaced one at a time with a silicon unit that does exactly what it did. You never lose consciousness. This is the case above.' },
  { id: 'teleport', title: 'Teleportation', text: 'Your body is scanned and destroyed; an exact copy is built on Mars from local matter. The copy wakes with your memories and walks off to breakfast.' },
  { id: 'copy', title: 'Copy, original survives', text: 'Same scan, but the original is not destroyed. Two people now wake with your memories. One is on Earth, one on Mars.' },
  { id: 'rollback', title: 'Rollback', text: 'Your mind runs on a substrate that is checkpointed nightly. After an accident, yesterday’s checkpoint is restored. You have lost a day.' },
] as const;
type SId = (typeof scenarios)[number]['id'];
const options = [
  { id: 'same', label: 'Same person' },
  { id: 'not', label: 'Not the same' },
  { id: 'matters', label: 'Question is empty (Parfit)' },
] as const;

const exp: Experiment = {
  mount(root, ctx) {
    let pct = 0;
    let mark: number | null = null;
    const answers: Partial<Record<SId, string>> = {};

    const cells = Array.from({ length: N }, (_, i) => h('span', { class: 'lab-neuron', 'aria-hidden': 'true', style: { transitionDelay: ctx.reduced ? '0ms' : `${(i % 25) * 6}ms` } }));
    const grid = h('div', { class: 'lab-neurons', role: 'img', 'aria-label': 'Two hundred neurons; replaced ones shown in accent colour' }, cells);
    const markLine = h('p', { class: 'lab-note serif', 'aria-live': 'polite' }, 'No mark yet.');
    const readingEl = h('div', { class: 'lab-reading', 'aria-live': 'polite' }, 'Drag the replacement forward. When you believe the original person is gone, press “Mark here”.');

    const s = slider({
      label: 'Neurons replaced', min: 0, max: 100, value: 0, format: (v) => `${v}%`,
      onInput: (v) => { pct = v; paint(); },
    });

    function paint() {
      const k = Math.round((pct / 100) * N);
      cells.forEach((c, i) => c.classList.toggle('is-silicon', i < k));
      if (mark != null) { const m = Math.round((mark / 100) * N); cells.forEach((c, i) => c.classList.toggle('is-mark', i === Math.min(N - 1, m))); }
    }

    function readMark() {
      if (mark == null) return;
      if (mark === 0) readingEl.innerHTML = 'You marked <strong>0%</strong>: any replacement ends the person. This is identity as <em>material composition</em>. It has a cost: you also cease to exist every few years as your atoms are replaced by metabolism. Unless carbon-for-carbon swaps are exempt — and then the question is why the material matters but the change does not.';
      else if (mark >= 100) readingEl.innerHTML = 'You never marked: the person survives total replacement. This is identity as <em>continuity</em> — psychological or functional. Hold that thought for the scenarios below: teleportation preserves exactly the same continuity, only faster.';
      else readingEl.innerHTML = `You marked <strong>${mark}%</strong>. Something happened at ${mark}% that did not happen at ${mark - 1}%. What was it? If nothing you can name, you are treating identity as a matter of degree — which means “same person” has no sharp answer, and the interesting question becomes what, in the continuity, you actually care about.`;
    }

    const markBtn = h('button', { type: 'button', class: 'btn btn--small', onclick: () => { mark = pct; markLine.textContent = `Marked at ${mark}% replacement.`; paint(); readMark(); } }, 'Mark here');
    const neverBtn = h('button', { type: 'button', class: 'btn btn--small', onclick: () => { mark = 100; s.set(100); pct = 100; markLine.textContent = 'You judged the person survives complete replacement.'; paint(); readMark(); } }, 'Never — still me at 100%');

    const summary = h('div', { class: 'lab-reading', 'aria-live': 'polite' }, 'Answer the four cases to see whether your judgements hang together.');
    function consistency() {
      const a = answers;
      if (Object.keys(a).length < 4) { summary.textContent = `${4 - Object.keys(a).length} case${Object.keys(a).length === 3 ? '' : 's'} to go.`; return; }
      const lines: string[] = [];
      if (a.gradual === 'same' && a.teleport === 'not') lines.push('You survive gradual replacement but not teleportation. Both preserve complete psychological continuity; what differs is speed and the path the matter takes. If speed matters, why? If the path matters, you are committed to something like a soul that travels with the atoms.');
      if (a.teleport === 'same' && a.copy === 'not') lines.push('Teleportation preserves you, but if the original is not destroyed, it does not. So whether the person on Mars is you depends on what happens on Earth — a fact that the person on Mars cannot detect. Parfit thought this shows identity cannot be what matters.');
      if (a.copy === 'same') lines.push('You said both copies are the same person. Identity is one–one; two people cannot both be you. Either you mean something weaker than identity, or you have accepted that “same person” is not a relation that can hold here.');
      if (a.rollback === 'same' && a.teleport === 'not') lines.push('Rollback restores yesterday’s state and discards today’s; teleportation preserves everything. You accepted the lossy case and rejected the lossless one. The difference seems to be that rollback feels like ordinary forgetting. Ask whether that feeling should carry the weight.');
      if (a.gradual === 'matters' || a.teleport === 'matters' || a.copy === 'matters' || a.rollback === 'matters') lines.push('Where you answered that the question is empty, you are with Parfit: what matters is the continuity itself — memories, intentions, character — and once we know how much of that survives, there is no further fact about whether “you” did.');
      if (!lines.length) lines.push('Your judgements are consistent: you apply the same criterion across all four cases. Now ask what that criterion is, and whether it would survive a fifth case — a system that is forked, run in parallel for a year, and merged.');
      summary.innerHTML = lines.map((l) => `<p>${l}</p>`).join('');
    }

    const cards = scenarios.map((sc) =>
      h('div', { class: 'lab-card' },
        h('h4', {}, sc.title),
        h('p', {}, sc.text),
        h('div', { class: 'lab-choice', role: 'group', 'aria-label': sc.title },
          options.map((o) => h('button', { type: 'button', class: 'chip', 'aria-pressed': 'false', onclick: (e: Event) => {
            const btn = e.currentTarget as HTMLElement;
            btn.parentElement!.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-pressed', 'false'));
            btn.setAttribute('aria-pressed', 'true');
            answers[sc.id] = o.id; consistency();
          } }, o.label)),
        ),
      ),
    );

    root.append(
      h('div', { class: 'lab-grid lab-grid--stack' },
        h('div', { class: 'lab-col' },
          panel('One mind, two hundred neurons', grid, s.el, h('div', { class: 'lab-actions' }, markBtn, neverBtn), markLine, readingEl),
        ),
        h('div', { class: 'lab-col' },
          panel('Four operations, one criterion?', note('Each of these preserves at least as much continuity as gradual replacement. Judge them, then read the comparison.'), h('div', { class: 'lab-cards' }, cards), summary),
        ),
      ),
    );
    paint();
  },
};
export default exp;
