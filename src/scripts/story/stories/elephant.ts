import { elephantParts as E } from '../shapes';
import { seg, easeInOut, type Scene, type SceneFn, type StoryVisuals } from '../kit';

/**
 * "The blind men and the elephant" — for Research, drawn behind the
 * constellation so the eleven areas sit on one animal. Each part lights up
 * as Saxe's men take hold of it.
 */
type C = CanvasRenderingContext2D;
type Part = 'side' | 'head' | 'ear' | 'trunk' | 'tusk' | 'legs' | 'tail';
const PARTS: Part[] = ['side', 'head', 'ear', 'trunk', 'tusk', 'legs', 'tail'];
const ASPECT = 1.3;

/** where the 150 × 100 drawing sits in a W × H box */
const fit = (W: number, H: number) => {
  const s = Math.min((0.9 * W) / 150, (0.84 * H) / 100);
  return { s, ox: (W - 150 * s) / 2, oy: (H - 100 * s) / 2 };
};
const drawPart = (p: Part) => (c: C, W: number, H: number) => {
  const { s, ox, oy } = fit(W, H);
  c.save(); c.translate(ox, oy); c.scale(s, s); E[p](c); c.restore();
};
/** a point of the drawing (shape units) in css px */
const at = (sc: Scene, ux: number, uy: number): [number, number] => {
  const [x, y, w, h] = sc.stage;
  const { s, ox, oy } = fit(w, h);
  return [x + ox + ux * s, y + oy + uy * s];
};
const DRAWS = PARTS.map(drawPart);

const whole: SceneFn = (s) => {
  const { t, look, pal } = s;
  const [x, y, w, h] = s.stage;
  look.form = 0.75 * seg(t, 0.5, 3); look.formTint = 0.04; look.veil = 0.2; look.stageDim = 0.2;
  s.form('elephant', 0.36, DRAWS);
  // six men approach, each a small light, none of them seeing the whole
  for (let i = 0; i < 6; i++) {
    const v = easeInOut(seg(t, 2 + i * 0.5, 6 + i * 0.5));
    const fx = x + w * (0.08 + i * 0.17), fy = y + h * 1.0;
    s.glow(fx, fy - v * h * 0.08, 12, 0.7 * seg(t, 2 + i * 0.5, 3 + i * 0.5) * (1 - seg(t, s.d - 1, s.d)));
  }
  look.light = [x + w * 0.5, y + h * 0.5, w * 0.45, 0.2 * seg(t, 1, 3)]; look.lightColor = pal.day;
};

/** one man, one part, one comparison */
const touch = (part: Part, ux: number, uy: number, like: string, index: number): SceneFn => (s) => {
  const { t, look, pal } = s;
  look.form = 0.9; look.formTint = 0.03; look.veil = 0.2; look.stageDim = 0.25;
  s.form('elephant', 0.36, DRAWS);
  const lit = seg(t, 0.4, 1.4) * (1 - seg(t, s.d - 0.6, s.d));
  PARTS.forEach((p, g) => {
    s.groups[g * 4 + 2] = p === part ? 1 : 1 - 0.55 * lit;
    s.groups[g * 4 + 3] = p === part ? 0.85 * lit : 0;
  });
  const [px, py] = at(s, ux, uy);
  s.glow(px, py, 26 + 4 * Math.sin(s.clock * 5), lit);
  look.light = [px, py, s.stage[2] * 0.18, 0.4 * lit]; look.lightColor = pal.fire;
  s.label(index, px, py + 22, like, lit);
};

const dispute: SceneFn = (s) => {
  const { t, look, pal } = s;
  const [x, y, w, h] = s.stage;
  look.form = 0.95; look.formTint = 0.04; look.veil = 0.2; look.stageDim = 0.25;
  s.form('elephant', 0.36, DRAWS);
  // each holds to his own part: the animal comes apart, then is whole again
  const apart = easeInOut(seg(t, 0.4, 3.4)) * (1 - easeInOut(seg(t, 6.5, 10)));
  const centre: [number, number] = [86, 50];
  const anchor: Record<Part, [number, number]> = { side: [86, 48], head: [40, 36], ear: [62, 38], trunk: [16, 80], tusk: [18, 66], legs: [96, 82], tail: [148, 60] };
  PARTS.forEach((p, g) => {
    const [ax, ay] = anchor[p];
    s.groups[g * 4] = ((ax - centre[0]) / 150) * 0.5 * apart;
    s.groups[g * 4 + 1] = ((ay - centre[1]) / 100) * 0.5 * apart;
    s.groups[g * 4 + 3] = 0.35 * apart + 0.3 * seg(t, 8, 10);
  });
  if (t > 0.5) s.burst('apart', x + w * 0.5, y + h * 0.5, 0.25);
  look.light = [x + w * 0.5, y + h * 0.5, w * 0.5, 0.35 * seg(t, 8, 10)]; look.lightColor = pal.day;
};

export const elephant: StoryVisuals = {
  id: 'elephant',
  aspect: ASPECT,
  loop: false,
  scenes: [
    whole,
    touch('side', 92, 46, 'a wall', 0),
    touch('tusk', 16, 69, 'a spear', 1),
    touch('trunk', 13, 90, 'a snake', 2),
    touch('legs', 62, 80, 'a tree', 3),
    touch('ear', 64, 38, 'a fan', 4),
    touch('tail', 148, 70, 'a rope', 5),
    dispute,
  ],
  stills: [8, 4, 4, 4, 4, 4, 4, 10],
};
