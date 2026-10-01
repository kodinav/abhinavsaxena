import { figure, throne, waxBlock, puddle, type Pose } from '../shapes';
import { seg, easeInOut, figureAt, type SceneFn, type StoryVisuals } from '../kit';

/** "The piece of wax" — for Essays: Descartes thinking a thing through (Discourse II, Meditations II). */
type C = CanvasRenderingContext2D;

const THINKER: Pose = { seated: true, robe: true, head: 'plain', front: [70, 40], back: [20, 60], bend: 8 };
const BLOCK = (c: C, W: number, H: number) => waxBlock(c, W * 0.32, H * 0.36, W * 0.36, H * 0.3);
const POOL = (c: C, W: number, H: number) => puddle(c, W * 0.2, H * 0.5, W * 0.6, H * 0.26);

const seclusion: SceneFn = (s) => {
  const { t, look, pal } = s;
  const [x, y, w, h] = s.stage;
  look.form = seg(t, 0.3, 2); look.formTint = 0.05; look.veil = 0.35; look.stageDim = 0.35;
  s.form('room', 0.3, [
    (c: C, W, H) => { throne(c, W * 0.58, H * 0.92, H * 0.55, 1); figure(c, W * 0.58, H * 0.92, H * 0.55, THINKER); },
    (c: C, W, H) => { c.fillRect(W * 0.66, H * 0.6, W * 0.24, H * 0.035); c.fillRect(W * 0.68, H * 0.6, W * 0.015, H * 0.32); c.fillRect(W * 0.87, H * 0.6, W * 0.015, H * 0.32); },
    (c: C, W, H) => { c.beginPath(); c.roundRect(W * 0.08, H * 0.4, W * 0.18, H * 0.52, W * 0.02); c.fill(); c.fillRect(W * 0.15, H * 0.12, W * 0.04, H * 0.3); },
  ]);
  // the stove glows; winter outside
  const glow = 0.75 + 0.25 * Math.sin(s.clock * 2.3) * Math.sin(s.clock * 3.7);
  look.light = [x + w * 0.17, y + h * 0.66, w * 0.3, 0.7 * seg(t, 0.5, 2.5) * glow]; look.lightColor = pal.fire;
  s.groups[2 * 4 + 3] = 0.7;
  const head = figureAt(s, 0.58, 0.92, 0.55, THINKER).head;
  s.glow(head[0] + 6, head[1] - 18, 12 + 4 * Math.sin(s.clock * 1.8), seg(t, 3, 4) * (1 - seg(t, s.d - 0.6, s.d)));
};

const theWax: SceneFn = (s) => {
  const { t, look, pal } = s;
  const [x, y, w, h] = s.stage;
  look.form = seg(t, 0.2, 1.8); look.formTint = pal.dark ? 0.35 : 0.6; look.veil = 0.35; look.stageDim = 0.35;
  s.form('block', 0.3, [BLOCK]);
  look.light = [x + w * 0.5, y + h * 0.5, w * 0.3, 0.35 * seg(t, 1, 3)]; look.lightColor = pal.fire;
  const k = seg(t, 2, 3) * (1 - seg(t, s.d - 0.6, s.d));
  s.label(0, x + w * 0.5, y + h * 0.74, 'sweet · fragrant · hard · cold', k);
};

const nearFire: SceneFn = (s) => {
  const { t, look, pal } = s;
  const [x, y, w, h] = s.stage;
  const melt = seg(t, 2.5, 4);
  look.form = 1; look.formTint = (pal.dark ? 0.35 : 0.6) + 0.25 * melt; look.veil = 0.35; look.stageDim = 0.35;
  // the same particles flow from the block into a pool
  if (t < 3.2) s.form('block', 0.3, [BLOCK]); else s.form('pool', 0.3, [POOL]);
  const flame = 0.8 + 0.2 * Math.sin(s.clock * 9) * Math.sin(s.clock * 4.1);
  look.light = [x + w * 0.5, y + h * 1.0, w * 0.4, 0.75 * seg(t, 0.3, 2) * flame]; look.lightColor = pal.fire;
  look.embers = 0.55 * seg(t, 1, 2.5);
  const k = seg(t, 5, 6) * (1 - seg(t, s.d - 0.6, s.d));
  s.label(0, x + w * 0.5, y + h * 0.3, 'liquid · hot · silent', k);
};

const sameWax: SceneFn = (s) => {
  const { t, look, pal } = s;
  const [x, y, w, h] = s.stage;
  look.form = 1; look.formTint = pal.dark ? 0.45 : 0.7; look.veil = 0.35; look.stageDim = 0.35;
  s.form('pool', 0.3, [POOL]);
  // the outline of the block it was: what the mind still holds
  const draw = easeInOut(seg(t, 1.5, 4));
  if (draw > 0) {
    const [ax, ay] = s.px(0.32, 0.36), [bx, by] = s.px(0.68, 0.66);
    const pts = [ax, ay, bx, ay, bx, by, ax, by, ax, ay];
    const n = Math.max(2, Math.ceil(draw * 5));
    s.line(pts.slice(0, n * 2));
  }
  look.light = [x + w * 0.5, y + h * 0.5, w * 0.3, 0.3 * draw]; look.lightColor = pal.day;
  s.label(0, x + w * 0.5, y + h * 0.3, 'the same wax', seg(t, 4, 5) * (1 - seg(t, s.d - 0.6, s.d)));
};

const mindAlone: SceneFn = (s) => {
  const { t, look, pal } = s;
  const [x, y, w, h] = s.stage;
  look.form = 1; look.formTint = 0.2; look.veil = 0.35; look.stageDim = 0.4;
  if (t < 0.6) s.form('pool', 0.3, [POOL]);
  else s.form('core', 0.3, [(c: C, W, H) => { c.beginPath(); c.arc(W * 0.5, H * 0.48, H * 0.12, 0, Math.PI * 2); c.fill(); }]);
  const k = seg(t, 2.5, 4.5);
  s.glow(x + w * 0.5, y + h * 0.48, 40 + 10 * Math.sin(s.clock * 2), k * (1 - seg(t, s.d - 0.6, s.d)));
  look.light = [x + w * 0.5, y + h * 0.48, w * 0.3, 0.5 * k]; look.lightColor = pal.day;
};

const WALKERS = [0, 1, 2];
const windowScene: SceneFn = (s) => {
  const { t, look, pal } = s;
  const [x, y, w, h] = s.stage;
  look.form = seg(t, 0, 1.4); look.formTint = 0.04; look.veil = 0.35; look.stageDim = 0.4;
  s.form('window', 0.32, [
    (c: C, W, H) => { const lw = H * 0.03; c.lineWidth = lw; c.strokeRect(W * 0.08, H * 0.06, W * 0.84, H * 0.86); c.fillRect(W * 0.5 - lw / 2, H * 0.06, lw, H * 0.86); c.fillRect(W * 0.08, H * 0.45, W * 0.84, lw); },
    ...WALKERS.map((i) => (c: C, W: number, H: number) => figure(c, W * 0.28, H * 0.9, H * 0.42, { cloak: true, head: 'hat', stride: 0.55 + (i % 2) * 0.2, front: [-15, 10], back: [20, 10] })),
  ]);
  // passers-by in the street: men, or machines moved by springs?
  WALKERS.forEach((i) => {
    const ph = ((((t - 0.5 + i * 4.2) / 12.5) % 1) + 1) % 1;
    s.groups[(i + 1) * 4] = -0.32 + ph * 0.82;
    s.groups[(i + 1) * 4 + 1] = -0.008 * Math.abs(Math.sin(s.clock * 5 + i));
    s.groups[(i + 1) * 4 + 2] = Math.sin(Math.PI * ph);
    s.groups[(i + 1) * 4 + 3] = i === 2 ? 0.5 * seg(t, 7, 9) : 0;
  });
  s.label(0, x + w * 0.5, y + h * 0.97, 'hats and cloaks', seg(t, 2, 3) * (1 - seg(t, s.d - 0.8, s.d)));
  look.light = [x + w * 0.5, y + h * 0.4, w * 0.4, 0.2]; look.lightColor = pal.cool;
};

export const wax: StoryVisuals = {
  id: 'wax',
  aspect: 1.25,
  loop: false,
  scenes: [seclusion, theWax, nearFire, sameWax, mindAlone, windowScene],
  stills: [6, 6, 8, 6, 6, 8],
};
