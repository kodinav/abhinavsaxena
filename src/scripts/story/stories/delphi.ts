import { figure, temple, tripod } from '../shapes';
import { seg, easeInOut, pulse, type SceneFn, type StoryVisuals } from '../kit';

/** "The oracle at Delphi" — for the Introduction: Socrates learns what his wisdom is (Apology). */
type C = CanvasRenderingContext2D;

const oracle: SceneFn = (s) => {
  const { t, look, pal } = s;
  const [x, y, w, h] = s.stage;
  look.form = seg(t, 0.3, 2.2); look.formTint = 0.08; look.veil = 0.35; look.stageDim = 0.35;
  s.form('temple', 0.34, [
    (c: C, W, H) => temple(c, W * 0.14, H * 0.12, W * 0.72, H * 0.62),
    (c: C, W, H) => tripod(c, W * 0.5, H * 0.92, H * 0.2),
  ]);
  // vapour rising from the tripod, lit from within the temple
  look.embers = 0.55 * seg(t, 1.5, 3) * (1 - seg(t, s.d - 1.5, s.d));
  const breathe = 0.75 + 0.25 * Math.sin(s.clock * 1.7);
  look.light = [x + w * 0.5, y + h * 0.66, w * 0.32, 0.6 * seg(t, 1, 3) * breathe]; look.lightColor = pal.fire;
  s.groups[1 * 4 + 3] = 0.6 * seg(t, 2, 4);
  // the answer: no man wiser
  const answer = pulse(t, 5.5, s.d, 0.8);
  if (answer > 0) s.label(0, x + w * 0.5, y + h * 0.95, 'no man wiser', answer);
};

const riddle: SceneFn = (s) => {
  const { t, look, pal } = s;
  const [x, y, w, h] = s.stage;
  look.form = seg(t, 0, 1.6); look.formTint = 0.06; look.veil = 0.3; look.stageDim = 0.4;
  s.form('socrates', 0.26, [(c: C, W, H) => figure(c, W * 0.5, H * 0.94, H * 0.62, { robe: true, head: 'beard', front: [120, -95], back: [10, 15], bend: 6 })]);
  // a puzzled thought, flickering at his brow
  const [hx, hy] = s.px(0.5, 0.94 - 0.62 * 0.92);
  const k = seg(t, 1.5, 2.5) * (1 - seg(t, s.d - 1, s.d));
  s.glow(hx + 14, hy - 22, 16 + 6 * Math.sin(s.clock * 3), k * (0.6 + 0.4 * Math.sin(s.clock * 2.3)));
  for (let i = 0; i < 3; i++) {
    const ph = (s.clock * 0.35 + i / 3) % 1;
    s.glow(hx + 20 + ph * w * 0.12, hy - 30 - ph * h * 0.2, 9 * (1 - ph), k * (1 - ph) * 0.7);
  }
  look.light = [x + w * 0.5, y + h * 0.45, w * 0.3, 0.25 * k]; look.lightColor = pal.cool;
};

const OTHERS = [0.6, 0.75, 0.9];
const NAMES = ['politician', 'poet', 'craftsman'];
const examination: SceneFn = (s) => {
  const { t, look } = s;
  const [x, y, w, h] = s.stage;
  look.form = seg(t, 0, 1.4); look.formTint = 0.04; look.veil = 0.3; look.stageDim = 0.4;
  s.form('examination', 0.32, [
    (c: C, W, H) => figure(c, W * 0.2, H * 0.92, H * 0.5, { robe: true, head: 'beard', front: [60, 20] }),
    (c: C, W, H) => figure(c, W * OTHERS[0], H * 0.92, H * 0.52, { robe: true, facing: -1, front: [40, 30], back: [20, 40] }),
    (c: C, W, H) => figure(c, W * OTHERS[1], H * 0.92, H * 0.5, { robe: true, facing: -1, front: [150, -40], back: [15, 10] }),
    (c: C, W, H) => figure(c, W * OTHERS[2], H * 0.92, H * 0.5, { facing: -1, front: [70, 50], back: [10, 20], stride: 0.3 }),
  ]);
  // each in turn is questioned: proud at first, then found out
  const start = 1.6, each = 3.6;
  OTHERS.forEach((u, i) => {
    const t0 = start + i * each;
    const asked = seg(t, t0, t0 + 0.8), found = seg(t, t0 + 2.2, t0 + 3.2);
    s.groups[(i + 1) * 4 + 3] = 0.85 * asked * (1 - found);
    s.groups[(i + 1) * 4 + 2] = 1 - 0.55 * found;
    if (asked > 0 && found < 1) {
      const a = s.px(0.27, 0.6), b = s.px(u - 0.05, 0.6);
      const v = easeInOut(seg(t, t0, t0 + 1));
      s.line([a[0], a[1], a[0] + (b[0] - a[0]) * v, a[1] + (b[1] - a[1]) * v]);
    }
    s.label(i, x + w * u, y + h * 0.95, NAMES[i], seg(t, t0 - 0.4, t0 + 0.4) * (1 - seg(t, t0 + 3.2, t0 + 3.8)));
  });
};

const wisest: SceneFn = (s) => {
  const { t, look, pal } = s;
  const [x, y, w, h] = s.stage;
  look.form = seg(t, 0, 1.2); look.formTint = 0.05; look.veil = 0.3; look.stageDim = 0.45;
  s.form('wisest', 0.26, [(c: C, W, H) => figure(c, W * 0.5, H * 0.94, H * 0.62, { robe: true, head: 'beard', front: [60, 60], back: [10, 10] })]);
  // a small, steady light: knowing what he does not know
  const [lx, ly] = s.px(0.565, 0.94 - 0.62 * 0.55);
  const k = seg(t, 1.5, 3) * (1 - seg(t, s.d - 0.6, s.d));
  s.glow(lx, ly, 22, k);
  look.light = [lx, ly, w * 0.14, 0.45 * k]; look.lightColor = pal.fire;
};

const examinedLife: SceneFn = (s) => {
  const { t, look, pal } = s;
  const [x, y, w, h] = s.stage;
  // he dissolves into the field; the light he carried stays
  look.form = 1 - seg(t, 2, 7); look.formTint = 0.05; look.veil = 0.3 * (1 - seg(t, 6, 10)); look.stageDim = 0.45 * (1 - seg(t, 6, 10));
  s.form('wisest', 0.26, [(c: C, W, H) => figure(c, W * 0.5, H * 0.94, H * 0.62, { robe: true, head: 'beard', front: [60, 60], back: [10, 10] })]);
  const [lx, ly] = s.px(0.565, 0.94 - 0.62 * 0.55);
  const rise = easeInOut(seg(t, 3, 9));
  const gx = lx, gy = ly - rise * h * 0.3;
  const k = 1 - seg(t, 8.5, 10);
  s.glow(gx, gy, 22 + 10 * rise, k);
  look.light = [gx, gy, w * (0.14 + 0.2 * rise), 0.45 * k]; look.lightColor = pal.fire;
  if (t > 2.2) s.burst('release', x + w * 0.5, y + h * 0.6, 0.35);
};

export const delphi: StoryVisuals = {
  id: 'delphi',
  aspect: 1.25,
  loop: false,
  scenes: [oracle, riddle, examination, wisest, examinedLife],
  stills: [7, 6, 9, 6, 4],
  presets: [{ swirl: 0.25 }, { swirl: 0.45 }, undefined, undefined, { swirl: 0.3 }],
};
