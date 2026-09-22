import type { Experiment } from '../registry';
import { h, toggle, panel, note, verdict, bar } from '../ui';

const conds = [
  { id: 'true', label: 'The output is true', hint: 'The claim matches the world' },
  { id: 'belief', label: 'There is a belief-like state', hint: 'Stable, action-guiding, revisable — not a one-off token' },
  { id: 'reliable', label: 'The process is reliable', hint: 'On this kind of question it is right far more often than not' },
  { id: 'reasons', label: 'Someone can give the reasons', hint: 'The user, the developer, or the system can say why' },
  { id: 'safe', label: 'It is not luck', hint: 'In nearby cases the output would still be true' },
  { id: 'competence', label: 'It is an achievement', hint: 'True because of a competence exercised in answering' },
] as const;
type C = (typeof conds)[number]['id'];

const presets: { name: string; v: Record<C, boolean>; text: string }[] = [
  { name: 'Encyclopaedic query', v: { true: true, belief: true, reliable: true, reasons: false, safe: true, competence: false }, text: 'A model answers a well-attested factual question. Right, reliably, non-luckily — and no one can say why this answer.' },
  { name: 'Lucky hallucination', v: { true: true, belief: false, reliable: false, reasons: false, safe: false, competence: false }, text: 'The model confabulates a citation that happens to exist. True by accident.' },
  { name: 'Stopped clock (Gettier)', v: { true: true, belief: true, reliable: false, reasons: true, safe: false, competence: false }, text: 'A person reads a stopped clock at the one moment it is right. Justified, true, not knowledge.' },
  { name: 'Human expert', v: { true: true, belief: true, reliable: true, reasons: true, safe: true, competence: true }, text: 'A historian states the date. Every condition met.' },
  { name: 'Expert, wrong', v: { true: false, belief: true, reliable: true, reasons: true, safe: false, competence: true }, text: 'The same historian, mistaken this once. Everything but truth.' },
];

const exp: Experiment = {
  mount(root) {
    const v: Record<C, boolean> = { true: true, belief: true, reliable: true, reasons: false, safe: true, competence: false };
    const verdicts = h('div', { class: 'lab-verdicts', 'aria-live': 'polite' });
    const presetText = h('p', { class: 'lab-note serif' }, 'Build a case with the switches, or load one.');
    const tracking = bar('Tracking', 0, { sub: '— is it safe to act on?' });
    const answer = bar('Answerability', 0, { sub: '— can anyone be held to it?', accent: true });
    const jobs = h('div', { class: 'lab-reading' });

    function update() {
      const missing = (ids: C[]) => ids.filter((i) => !v[i]).map((i) => conds.find((c) => c.id === i)!.label.toLowerCase());
      const jtb = ['true', 'belief', 'reasons'] as C[];
      const rel = ['true', 'belief', 'reliable'] as C[];
      const safe = ['true', 'belief', 'reliable', 'safe'] as C[];
      const virt = ['true', 'belief', 'competence'] as C[];
      const row = (name: string, req: C[], yes: string, no: (m: string[]) => string) => { const m = missing(req); return verdict(name, m.length === 0, m.length === 0 ? yes : no(m)); };
      verdicts.replaceChildren(
        row('Justified true belief', jtb, 'True, believed, and someone can give the reasons. On the classical analysis, knowledge — unless Gettier is lurking.', (m) => `Fails: ${m.join('; ')}. ${!v.reasons ? 'Internalism needs reasons the believer can access. Here nobody has them.' : ''}`),
        row('Reliabilism (Goldman)', rel, 'Produced by a reliable process. Reliabilism does not care whether anyone can say why. Knowledge.', (m) => `Fails: ${m.join('; ')}. Reliability is doing the work here; without it, a true output is a good guess.`),
        row('Safety / anti-luck', safe, 'Reliable and safe: would still be true in nearby cases. The Gettier-proof version of reliabilism says yes.', (m) => `Fails: ${m.join('; ')}. ${v.reliable && !v.safe ? 'Reliable in general but lucky in this instance — the stopped-clock structure.' : ''}`),
        row('Virtue epistemology (Sosa)', virt, 'True because of a competence exercised in the answering. An achievement, creditable to the agent. Knowledge.', (m) => `Fails: ${m.join('; ')}. ${v.reliable && !v.competence ? 'The process is reliable, but the truth is not an achievement of anyone — the competence was trained in, not exercised. This is the account that says what the machine is missing.' : ''}`),
      );
      const t = (v.true ? 0.4 : 0) + (v.reliable ? 0.35 : 0) + (v.safe ? 0.25 : 0);
      const a = (v.reasons ? 0.4 : 0) + (v.competence ? 0.4 : 0) + (v.belief ? 0.2 : 0);
      tracking.set(t); answer.set(a);
      jobs.innerHTML = t >= 0.75 && a < 0.4
        ? 'High tracking, low answerability: the signature of a machine output. Safe to use for a footnote; useless for a court. Reliabilism says <em>knows</em>, virtue epistemology says <em>does not</em> — and both are right about the job they were built to describe.'
        : t >= 0.75 && a >= 0.6 ? 'High on both: the human expert. Every theory agrees, because in this case tracking and answerability have not come apart.'
        : t < 0.5 && a >= 0.6 ? 'Answerable but not tracking: someone who can be asked, has reasons, and is wrong. The theories agree this is not knowledge — but it is the case in which responsibility is clearest.'
        : 'Low on both. Neither safe to act on nor anyone to hold to it. The theories agree, and so should you.';
    }

    const toggles = conds.map((c) => toggle({ label: c.label, hint: c.hint, checked: v[c.id], onChange: (x) => { v[c.id] = x; update(); } }));
    const presetBtns = presets.map((p) => h('button', { type: 'button', class: 'chip', onclick: () => { Object.assign(v, p.v); toggles.forEach((t, i) => t.set(v[conds[i].id])); presetText.textContent = `${p.name}: ${p.text}`; update(); } }, p.name));

    root.append(
      h('div', { class: 'lab-grid' },
        h('div', { class: 'lab-col' },
          panel('The case', ...toggles.map((t) => t.el)),
          panel('Load a case', h('div', { class: 'lab-presets' }, presetBtns), presetText),
        ),
        h('div', { class: 'lab-col' },
          panel('Does it know?', verdicts),
          panel('Two jobs the concept does', note('Knowledge marks beliefs that are safe to act on (tracking) and beliefs someone can be held to (answerability). Humans do both at once; machines pull them apart.'), tracking.el, answer.el, jobs),
        ),
      ),
    );
    update();
  },
};
export default exp;
