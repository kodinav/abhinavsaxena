import type { Experiment } from '../registry';
import { h, panel, note, verdict, fmtPct } from '../ui';

interface Link { id: string; name: string; kind: 'instrument' | 'model' | 'person' | 'you'; rel: number; cost: number; text: string }
const links: Link[] = [
  { id: 'sensor', name: 'Sensor', kind: 'instrument', rel: 0.97, cost: 2, text: 'A field instrument records the measurement.' },
  { id: 'model', name: 'Model', kind: 'model', rel: 0.9, cost: 6, text: 'A learned model cleans, interpolates and interprets the reading.' },
  { id: 'summary', name: 'Summary', kind: 'model', rel: 0.86, cost: 4, text: 'A language model writes the report that people will read.' },
  { id: 'colleague', name: 'Colleague', kind: 'person', rel: 0.92, cost: 1, text: 'A colleague reads the report and tells you the result over coffee.' },
];
const VERIFY_REL = 0.995;

const exp: Experiment = {
  mount(root, ctx) {
    const choice: Record<string, 'trust' | 'verify'> = Object.fromEntries(links.map((l) => [l.id, 'trust']));
    let lastRun: { failedAt: string | null; truth: boolean } | null = null;

    const linkEls = new Map<string, HTMLElement>();
    const chain = h('div', { class: 'lab-chain' },
      h('div', { class: 'lab-link is-terminal' }, h('span', { class: 'lab-link__kind' }, 'source'), h('span', { class: 'lab-link__name' }, 'The world'), h('span', { class: 'lab-link__rel' }, 'A fact is the case.')),
      links.map((l) => {
        const el = h('div', { class: 'lab-link', 'data-id': l.id },
          h('span', { class: 'lab-link__kind' }, l.kind),
          h('span', { class: 'lab-link__name' }, l.name),
          h('span', { class: 'lab-link__rel' }, `${fmtPct(l.rel)} reliable`),
          h('div', { class: 'lab-choice', role: 'group', 'aria-label': `${l.name}: trust or verify` },
            (['trust', 'verify'] as const).map((c) => h('button', { type: 'button', class: 'chip', 'aria-pressed': String(choice[l.id] === c), onclick: (e: Event) => {
              choice[l.id] = c; lastRun = null;
              (e.currentTarget as HTMLElement).parentElement!.querySelectorAll('.chip').forEach((x) => x.setAttribute('aria-pressed', 'false'));
              (e.currentTarget as HTMLElement).setAttribute('aria-pressed', 'true');
              update();
            } }, c === 'trust' ? 'Trust' : `Verify (+${l.cost}h)`)),
          ),
        );
        linkEls.set(l.id, el);
        return el;
      }),
      h('div', { class: 'lab-link is-terminal' }, h('span', { class: 'lab-link__kind' }, 'you'), h('span', { class: 'lab-link__name' }, 'Your belief'), h('span', { class: 'lab-link__rel' }, 'You act on it tomorrow.')),
    );

    const probEl = h('span', { class: 'tnum' });
    const costEl = h('span', { class: 'tnum' });
    const verdicts = h('div', { class: 'lab-verdicts', 'aria-live': 'polite' });
    const runOut = h('div', { class: 'lab-reading', 'aria-live': 'polite' }, 'Run the chain to sample an outcome. Failures are random, weighted by reliability; verification is nearly, but not perfectly, reliable.');

    function effective(l: Link) { return choice[l.id] === 'verify' ? VERIFY_REL : l.rel; }

    function update() {
      const p = links.reduce((acc, l) => acc * effective(l), 1);
      const cost = links.reduce((acc, l) => acc + (choice[l.id] === 'verify' ? l.cost : 0), 0);
      probEl.textContent = fmtPct(p);
      costEl.textContent = `${cost}h`;
      links.forEach((l) => { const el = linkEls.get(l.id)!; el.classList.toggle('is-verified', choice[l.id] === 'verify'); el.classList.remove('is-failed'); });
      const verifiedAny = links.some((l) => choice[l.id] === 'verify');
      const verifiedModels = links.filter((l) => l.kind === 'model').every((l) => choice[l.id] === 'verify');
      verdicts.replaceChildren(
        verdict('Reliabilism', p >= 0.9, p >= 0.9 ? `The chain is ${fmtPct(p)} reliable. If the claim is true, you know it — whether or not you checked anything.` : `At ${fmtPct(p)} the process is not reliable enough. A true belief formed this way is not knowledge; it is a good guess.`),
        verdict('Internalism', verifiedAny, verifiedAny ? 'You verified at least one link, so you hold some reasons of your own. Whether they are enough depends on which link you checked.' : 'You have no reasons you can give — only a report you accepted. Your belief may be true and well-sourced, but it is not justified by anything you possess.'),
        verdict('Anti-reductionist testimony', verifiedModels, verifiedModels ? 'The human links transmit knowledge by default; you have checked the machine links yourself, so the chain has no gap.' : 'Testimony transmits knowledge from speaker to hearer — but the model links are not speakers. Unless you verify them, no knowledge enters the chain there to be transmitted onward.'),
        verdict('Epistemic responsibility', null, `You spent ${cost} hour${cost === 1 ? '' : 's'} checking. If the claim turns out false, you are responsible in proportion to what you could reasonably have checked and did not. Verifying everything would have cost ${links.reduce((a, l) => a + l.cost, 0)}h — and would be needed for every claim, every day.`),
      );
    }

    function run() {
      let failedAt: string | null = null;
      for (const l of links) { if (Math.random() > effective(l)) { failedAt = l.id; break; } }
      lastRun = { failedAt, truth: !failedAt };
      links.forEach((l) => linkEls.get(l.id)!.classList.toggle('is-failed', l.id === failedAt));
      if (!failedAt) { runOut.innerHTML = 'The claim reached you <strong>intact</strong>. You believe something true. Whether you <em>know</em> it depends on the theory you hold — see the verdicts. Note that you would have felt exactly the same if a link had failed.'; return; }
      const l = links.find((x) => x.id === failedAt)!;
      const who = l.kind === 'person'
        ? `The failure was your colleague’s. She owes you an account; she can be asked; the responsibility is shared between her carelessness and your trust.`
        : l.kind === 'instrument'
          ? `The instrument failed. No one at that link can answer; responsibility falls to whoever calibrated it and to whoever chose to rely on it without checking.`
          : `The <strong>${l.name.toLowerCase()}</strong> failed — a model link. It cannot be asked why, it did not intend anything, and it has no account to give. Responsibility does not vanish: it concentrates on the people who deployed it and on you, who ${choice[l.id] === 'verify' ? 'checked, and were unlucky' : 'chose to trust it'}.`;
      runOut.innerHTML = `The chain broke at <strong>${l.name}</strong>. You now believe something false, with the same confidence you would have had if it were true. ${who}`;
    }

    root.append(
      h('div', { class: 'lab-grid lab-grid--stack' },
        panel('The chain', note('A fact passes through four links before it reaches you. For each, decide whether to trust the link or verify it yourself. Verification costs time.'), chain,
          h('div', { class: 'lab-actions', style: { alignItems: 'center', gap: '1.5rem' } },
            h('span', { class: 'lab-note serif' }, 'Chance the claim arrives true: ', probEl),
            h('span', { class: 'lab-note serif' }, 'Time spent: ', costEl),
            h('button', { type: 'button', class: 'btn btn--small btn--solid', onclick: run }, 'Run the chain'),
          ),
          runOut,
        ),
        panel('Do you know?', note('Four accounts, four answers. They disagree because they disagree about what knowledge was for.'), verdicts),
      ),
    );
    update();
  },
};
export default exp;
