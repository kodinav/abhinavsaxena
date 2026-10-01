import { place, figure, bird, horse, lion, city, type Pose } from '../shapes';
import { seg, easeInOut, easeOut, arcAt, arcPoints, figureAt, type SceneFn, type StoryVisuals } from '../kit';

/** "The gift of fire" — for the Thread: Prometheus, Epimetheus and why the arts were not enough (Protagoras). */
type C = CanvasRenderingContext2D;

const ANIMALS = [
  (c: C, W: number, H: number) => place(c, bird(0.15), W * 0.5, H * 0.36, H * 0.2),
  (c: C, W: number, H: number) => place(c, horse, W * 0.27, H * 0.86, H * 0.32),
  (c: C, W: number, H: number) => place(c, lion, W * 0.73, H * 0.88, H * 0.3),
];

const making: SceneFn = (s) => {
  const { t, look, pal } = s;
  const [x, y, w, h] = s.stage;
  look.form = seg(t, 0.4, 2); look.formTint = 0.25; look.veil = 0.3; look.stageDim = 0.35;
  s.form('animals', 0.34, ANIMALS);
  // shaped out of earth and fire: each creature rises out of the ground in turn
  [0, 1, 2].forEach((g) => {
    const r = easeOut(seg(t, 0.8 + g * 2, 4 + g * 2));
    s.groups[g * 4 + 1] = 0.5 * (1 - r);
    s.groups[g * 4 + 2] = r;
    s.groups[g * 4 + 3] = 0.6 * (1 - seg(t, 4 + g * 2, 7 + g * 2));
  });
  look.embers = 0.6 * (1 - seg(t, 8, 11));
  look.light = [x + w * 0.5, y + h * 1.05, w * 0.5, 0.6 * (1 - seg(t, 8, 11))]; look.lightColor = pal.fire;
};

const gifts: SceneFn = (s) => {
  const { t, look } = s;
  const [x, y, w, h] = s.stage;
  look.form = 1; look.formTint = 0.05; look.veil = 0.3; look.stageDim = 0.35;
  s.form('animals', 0.34, ANIMALS);
  const k = seg(t, 0.5, 1.5) * (1 - seg(t, s.d - 0.8, s.d));
  // wings for the bird, swiftness for the horse, strength for the lion
  s.groups[0 * 4 + 1] = -0.03 * Math.sin(s.clock * 2.4) * k;
  s.groups[0 * 4] = 0.05 * Math.sin(s.clock * 0.9) * k;
  s.groups[1 * 4] = (0.08 * Math.sin(s.clock * 1.6)) * k;
  s.groups[1 * 4 + 1] = -0.012 * Math.abs(Math.sin(s.clock * 6.4)) * k;
  s.groups[2 * 4 + 3] = (0.35 + 0.25 * Math.sin(s.clock * 2)) * seg(t, 5.5, 6.5);
  s.label(0, x + w * 0.5, y + h * 0.4, 'wings', k * seg(t, 1, 2));
  s.label(1, x + w * 0.27, y + h * 0.9, 'swiftness', k * seg(t, 3, 4));
  s.label(2, x + w * 0.73, y + h * 0.92, 'strength', k * seg(t, 5.5, 6.5));
};

const NAKED: Pose = { front: [14, 8], back: [10, 6] };
const forgotten: SceneFn = (s) => {
  const { t, look, pal } = s;
  const [x, y, w, h] = s.stage;
  look.form = seg(t, 0.6, 2.6); look.formTint = 0; look.veil = 0.3; look.stageDim = 0.5;
  s.form('alone', 0.16, [(c: C, W, H) => figure(c, W * 0.5, H * 0.92, H * 0.42, NAKED)]);
  const k = seg(t, 2, 3) * (1 - seg(t, s.d - 0.8, s.d));
  s.label(0, x + w * 0.5, y + h * 0.95, 'naked and shoeless', k);
  look.light = [x + w * 0.5, y + h * 0.7, w * 0.25, 0.18 * k]; look.lightColor = pal.cool;
};

const RAISED: Pose = { front: [150, 10], back: [10, 6], torch: true };
const theft: SceneFn = (s) => {
  const { t, look, pal } = s;
  const [x, y, w, h] = s.stage;
  look.form = seg(t, 0, 1.2); look.veil = 0.3; look.stageDim = 0.45;
  s.form('torch', 0.18, [(c: C, W, H) => figure(c, W * 0.5, H * 0.92, H * 0.5, RAISED)]);
  const handPt = figureAt(s, 0.5, 0.92, 0.5, RAISED).front;
  const flame = [handPt[0] + 3, handPt[1] - h * 0.07];
  // fire carried down from the workshop of the gods
  const from = [x + w * 0.06, y + h * 0.02];
  const v = easeInOut(seg(t, 1.2, 5));
  if (t < 5.4) {
    const p = arcAt(from, flame, -h * 0.1, v);
    s.glow(p[0], p[1], 26, seg(t, 1, 1.6));
    s.line(arcPoints(from, flame, -h * 0.1, v));
  }
  const lit = easeOut(seg(t, 5, 6.5));
  if (lit > 0) {
    s.glow(flame[0], flame[1], 30 + 6 * Math.sin(s.clock * 11), lit);
    look.light = [flame[0], flame[1], w * 0.32, 0.75 * lit * (0.85 + 0.15 * Math.sin(s.clock * 13))]; look.lightColor = pal.fire;
    look.embers = 0.35 * lit;
    look.formTint = 0.55 * lit;
    s.label(0, x + w * 0.5, y + h * 0.95, 'fire, and the arts', lit * (1 - seg(t, s.d - 0.8, s.d)));
  }
  if (t > 5.1) s.burst('fire', flame[0], flame[1], 0.35);
};

const PEOPLE = [0.14, 0.32, 0.5, 0.68, 0.86];
const POSES: Pose[] = [
  { front: [30, 20], back: [8, 8] }, { front: [70, 30], back: [10, 10], robe: true }, { front: [150, 10], back: [10, 6], torch: true },
  { front: [10, 40], back: [40, 10], robe: true }, { front: [25, 15], back: [12, 8] },
];
const PEOPLE_DRAWS = [
  ...PEOPLE.map((u, i) => (c: C, W: number, H: number) => figure(c, W * u, H * 0.92, H * 0.4, POSES[i])),
  (c: C, W: number, H: number) => city(c, W * 0.12, H * 0.42, W * 0.76, H * 0.3),
];

const cities: SceneFn = (s) => {
  const { t, look, pal } = s;
  const [x, y, w, h] = s.stage;
  look.form = seg(t, 0, 1.2); look.formTint = 0.06; look.veil = 0.3; look.stageDim = 0.45;
  s.form('people', 0.36, PEOPLE_DRAWS);
  // gathered into cities, then scattered again
  const gather = easeInOut(seg(t, 0.4, 3.6)), scatter = easeInOut(seg(t, 6, 10));
  PEOPLE.forEach((u, i) => {
    const out = (u - 0.5) * 0.35;
    s.groups[i * 4] = out * (1 - gather) + out * 1.4 * scatter;
    s.groups[i * 4 + 3] = 0.5 * seg(t, 6, 7) * (1 - seg(t, 9, 10)); // quarrel
  });
  s.groups[5 * 4 + 2] = seg(t, 2.6, 4.6) * (1 - 0.8 * seg(t, 6.5, 10));
  const [fx, fy] = s.px(0.5, 0.92 - 0.4 * 1.08);
  look.light = [fx, fy, w * 0.25, 0.45 * (1 - scatter)]; look.lightColor = pal.fire;
  if (t > 6.4) s.burst('scatter', x + w * 0.5, y + h * 0.75, 0.3);
};

const justice: SceneFn = (s) => {
  const { t, look, pal } = s;
  const [x, y, w, h] = s.stage;
  look.form = 1; look.formTint = 0.04; look.veil = 0.3; look.stageDim = 0.45;
  s.form('people', 0.36, PEOPLE_DRAWS);
  const back = easeInOut(seg(t, 0, 2.6));
  PEOPLE.forEach((u, i) => {
    s.groups[i * 4] = (u - 0.5) * 0.35 * 1.4 * (1 - back);
    // reverence and justice, given to every one of them
    const t0 = 2.4 + i * 0.7;
    const got = seg(t, t0 + 0.6, t0 + 1.1);
    s.groups[i * 4 + 3] = 0.55 * got;
    const head = figureAt(s, u, 0.92, 0.4, POSES[i]).head;
    const v = easeInOut(seg(t, t0, t0 + 0.8));
    if (v > 0 && v < 1) s.glow(head[0], y + (head[1] - y) * v - 10, 18, 1);
    if (got > 0) s.glow(head[0], head[1] - h * 0.07, 12, got * (1 - seg(t, s.d - 1, s.d)));
  });
  s.groups[5 * 4 + 2] = seg(t, 6.5, 8.5);
  // the bonds of friendship and conciliation
  const bond = easeInOut(seg(t, 7, 10));
  if (bond > 0) for (let i = 0; i < PEOPLE.length - 1; i++) {
    const a = figureAt(s, PEOPLE[i], 0.92, 0.4, POSES[i]).head, b = figureAt(s, PEOPLE[i + 1], 0.92, 0.4, POSES[i + 1]).head;
    s.line(arcPoints([a[0], a[1] + h * 0.12], [b[0], b[1] + h * 0.12], -h * 0.03, bond, 12));
  }
  look.light = [x + w * 0.5, y + h * 0.6, w * 0.5, 0.35 * bond]; look.lightColor = pal.fire;
  s.label(0, x + w * 0.5, y + h * 0.97, 'to all', seg(t, 8, 9) * (1 - seg(t, s.d - 0.8, s.d)));
};

export const prometheus: StoryVisuals = {
  id: 'prometheus',
  aspect: 1.25,
  loop: false,
  scenes: [making, gifts, forgotten, theft, cities, justice],
  stills: [9, 6, 5, 8, 4, 11],
  presets: [{ swirl: 0.3 }, undefined, { swirl: 0.15 }, { swirl: 0.35 }, undefined, { swirl: 0.25 }],
};
