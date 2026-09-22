import type { Experiment } from '../registry';
import { h, toggle, panel, note, verdict } from '../ui';
import { readThemeColors, rgba } from '@/lib/theme-colors';

interface Agent { x: number; y: number; vx: number; vy: number; energy: number; resting: number; target: number }
interface Item { x: number; y: number; kind: 'resource' | 'hazard'; ttl: number }

const exp: Experiment = {
  mount(root, ctx) {
    const caps = { goal: true, reasons: false, self: false, experience: false };
    const canvas = h('canvas', { class: 'lab-canvas', 'aria-label': 'Simulation of small agents seeking resources and avoiding hazards', role: 'img' });
    const c = canvas.getContext('2d')!;
    let W = 600, H = 360, dpr = 1;
    let colors = readThemeColors();
    const agents: Agent[] = [];
    let items: Item[] = [];
    let raf = 0, running = false, last = 0, eaten = 0, hurt = 0;
    const statsEl = h('p', { class: 'lab-note serif', 'aria-live': 'polite' });
    const verdicts = h('div', { class: 'lab-verdicts', 'aria-live': 'polite' });
    const experienceNote = h('p', { class: 'lab-note serif', hidden: true }, 'Nothing on screen changed. That is the point: whatever experience adds, it is not something you can see from here — and everything you can see was already there.');

    function resize() {
      const r = canvas.getBoundingClientRect();
      W = Math.max(320, Math.round(r.width)); H = Math.round(W * 0.6);
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = W * dpr; canvas.height = H * dpr; canvas.style.height = H + 'px';
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function reset() {
      agents.length = 0;
      for (let i = 0; i < 14; i++) agents.push({ x: Math.random() * W, y: Math.random() * H, vx: 0, vy: 0, energy: 0.6 + Math.random() * 0.4, resting: 0, target: -1 });
      items = [];
      for (let i = 0; i < 10; i++) items.push(spawn('resource'));
      for (let i = 0; i < 4; i++) items.push(spawn('hazard'));
      eaten = 0; hurt = 0;
    }
    function spawn(kind: Item['kind']): Item { return { x: 20 + Math.random() * (W - 40), y: 20 + Math.random() * (H - 40), kind, ttl: 8 + Math.random() * 10 }; }

    function step(dt: number) {
      for (const it of items) it.ttl -= dt;
      items = items.filter((it) => it.ttl > 0);
      while (items.filter((i) => i.kind === 'resource').length < 8) items.push(spawn('resource'));
      while (items.filter((i) => i.kind === 'hazard').length < 4) items.push(spawn('hazard'));
      for (const a of agents) {
        a.energy = Math.max(0, a.energy - dt * 0.03);
        if (caps.self && a.energy < 0.25 && a.resting <= 0) a.resting = 2.5;
        if (a.resting > 0) { a.resting -= dt; a.energy = Math.min(1, a.energy + dt * 0.12); a.vx *= 0.9; a.vy *= 0.9; }
        else {
          let ax = 0, ay = 0;
          if (caps.goal) {
            let best = -1, bd = 1e9;
            items.forEach((it, i) => { if (it.kind !== 'resource') return; const d = (it.x - a.x) ** 2 + (it.y - a.y) ** 2; if (d < bd) { bd = d; best = i; } });
            if (best >= 0) { const it = items[best]; const d = Math.sqrt(bd) || 1; ax += ((it.x - a.x) / d) * 60; ay += ((it.y - a.y) / d) * 60; }
          } else { ax += (Math.random() - 0.5) * 120; ay += (Math.random() - 0.5) * 120; }
          if (caps.reasons) {
            for (const it of items) { if (it.kind !== 'hazard') continue; const dx = a.x - it.x, dy = a.y - it.y; const d = Math.hypot(dx, dy) || 1; if (d < 70) { const f = (1 - d / 70) * 220; ax += (dx / d) * f; ay += (dy / d) * f; } }
          }
          a.vx = (a.vx + ax * dt) * 0.92; a.vy = (a.vy + ay * dt) * 0.92;
        }
        a.x += a.vx * dt; a.y += a.vy * dt;
        if (a.x < 6) { a.x = 6; a.vx *= -0.5; } if (a.x > W - 6) { a.x = W - 6; a.vx *= -0.5; }
        if (a.y < 6) { a.y = 6; a.vy *= -0.5; } if (a.y > H - 6) { a.y = H - 6; a.vy *= -0.5; }
        for (const it of items) {
          const d = Math.hypot(it.x - a.x, it.y - a.y);
          if (it.kind === 'resource' && d < 8) { it.ttl = 0; a.energy = Math.min(1, a.energy + 0.3); eaten++; }
          if (it.kind === 'hazard' && d < 12) { a.energy = Math.max(0, a.energy - dt * 0.6); hurt += dt; }
        }
      }
    }
    function draw() {
      c.clearRect(0, 0, W, H);
      for (const it of items) {
        c.beginPath();
        if (it.kind === 'resource') { c.arc(it.x, it.y, 3, 0, Math.PI * 2); c.fillStyle = rgba(colors.ink, 0.7); c.fill(); }
        else { c.arc(it.x, it.y, 12, 0, Math.PI * 2); c.strokeStyle = rgba(colors.accent, 0.8); c.lineWidth = 1; c.stroke(); c.beginPath(); c.arc(it.x, it.y, 2, 0, Math.PI * 2); c.fillStyle = rgba(colors.accent, 1); c.fill(); }
      }
      for (const a of agents) {
        c.beginPath(); c.arc(a.x, a.y, 5, 0, Math.PI * 2);
        c.fillStyle = a.resting > 0 ? rgba(colors.ink, 0.25) : rgba(colors.ink, 0.35 + a.energy * 0.65); c.fill();
        if (caps.self) { c.beginPath(); c.arc(a.x, a.y, 8, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * a.energy); c.strokeStyle = rgba(colors.ink, 0.5); c.lineWidth = 1; c.stroke(); }
      }
    }
    function loop(now: number) {
      if (!running) return;
      const dt = Math.min(0.05, (now - (last || now)) / 1000); last = now;
      step(dt); draw();
      if ((now | 0) % 10 === 0) statsEl.textContent = `${eaten} resources gathered · ${hurt.toFixed(0)}s spent in hazards`;
      raf = requestAnimationFrame(loop);
    }
    const start = () => { if (running) return; running = true; last = 0; raf = requestAnimationFrame(loop); };
    const stop = () => { running = false; cancelAnimationFrame(raf); };

    function updateVerdicts() {
      verdicts.replaceChildren(
        verdict('Behavioural', caps.goal, caps.goal ? 'Behaviour is directed at ends and varies with circumstances. On a behavioural criterion, that is action.' : 'Random walk. Nothing here is directed at anything; there is behaviour but no action.'),
        verdict('Intentional stance (Dennett)', caps.goal && caps.reasons, caps.goal && caps.reasons ? 'Attributing goals and beliefs (“it wants food, it thinks the hazard is there”) predicts these agents better than physics does. They have beliefs in the only sense that matters.' : caps.goal ? 'Goals predict it, but so would a simpler description: “it moves toward the nearest dot”. The intentional stance is not yet indispensable.' : 'No stance predicts a random walk better than any other. Nothing to attribute.'),
        verdict('Reasons-responsive (Fischer & Ravizza)', caps.goal && caps.reasons && caps.self, caps.goal && caps.reasons && caps.self ? 'The agents act on reasons, would act differently if reasons differed, and take their own state into account when deciding. That is ownership of a mechanism, in a thin sense.' : caps.goal && caps.reasons ? 'Responsive to reasons, but with no representation of their own condition: Frankfurt’s wantons. Agents, not persons.' : 'Not responsive to reasons in the relevant counterfactual sense.'),
        verdict('Phenomenal', null, caps.experience ? 'You switched experience on. Nothing visible changed — and nothing could. Whether there is someone home is not a fact this simulation can display, and it may not be one any observation can settle.' : 'Requires that there be something it is like to be the agent. Nothing you can switch on here is that. Whether this is a limit of the simulation or of the criterion is the question.'),
      );
      experienceNote.hidden = !caps.experience;
    }

    const toggles = [
      toggle({ label: 'Goal-directedness', hint: 'Seek resources rather than wander', checked: true, onChange: (v) => { caps.goal = v; updateVerdicts(); } }),
      toggle({ label: 'Sensitivity to reasons', hint: 'Avoid hazards; re-plan when the world changes', onChange: (v) => { caps.reasons = v; updateVerdicts(); } }),
      toggle({ label: 'A self-model', hint: 'Track own energy; rest when low', onChange: (v) => { caps.self = v; updateVerdicts(); } }),
      toggle({ label: 'Experience', hint: 'Something it is like to be the agent', onChange: (v) => { caps.experience = v; updateVerdicts(); } }),
    ];

    root.append(
      h('div', { class: 'lab-grid' },
        h('div', { class: 'lab-col' },
          panel('Capacities', ...toggles.map((t) => t.el), h('div', { class: 'lab-actions' }, h('button', { type: 'button', class: 'btn btn--small', onclick: () => reset() }, 'Reset world'))),
          panel('Do they act?', verdicts, experienceNote),
        ),
        h('div', { class: 'lab-col' },
          panel('The world', note('Dots are resources; rings are hazards. Each agent’s darkness is its energy.'), canvas, statsEl),
        ),
      ),
    );
    resize(); reset(); updateVerdicts();
    if (ctx.reduced) { step(0.016); draw(); statsEl.textContent = 'Reduced motion is on: showing a single frame.'; }
    else {
      const io = new IntersectionObserver((en) => (en[0].isIntersecting ? start() : stop()), { threshold: 0.1 });
      io.observe(canvas);
      const ro = new ResizeObserver(() => { resize(); draw(); });
      ro.observe(canvas);
      const onTheme = () => { colors = readThemeColors(); };
      document.addEventListener('themechange', onTheme);
      return () => { stop(); io.disconnect(); ro.disconnect(); document.removeEventListener('themechange', onTheme); };
    }
  },
};
export default exp;
