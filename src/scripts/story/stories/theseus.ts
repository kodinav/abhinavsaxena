import { galley } from '../shapes';
import { seg, easeInOut, type SceneFn, type StoryVisuals } from '../kit';

/** "The ship of Theseus" — for the Lab: Plutarch's ship, plank by plank, and Hobbes's second ship. */
type C = CanvasRenderingContext2D;
const PLANKS = 7;
const ASPECT = 1.5;

/** one ship: seven hull sections (groups 0–6) and the rig (group 7) */
const ship = (x: number, y: number, w: number, h: number) => [
  ...Array.from({ length: PLANKS }, (_, k) => (c: C, W: number, H: number) => galley(c, W * x, H * y, W * w, H * h, 'hull', k, PLANKS)),
  (c: C, W: number, H: number) => { galley(c, W * x, H * y, W * w, H * h, 'sail'); galley(c, W * x, H * y, W * w, H * h, 'oars'); },
];
const ONE = ship(0.12, 0.06, 0.76, 0.86);
const rock = (s: Parameters<SceneFn>[0], k = 1) => {
  for (let g = 0; g < 8; g++) s.groups[g * 4 + 1] = 0.008 * Math.sin(s.clock * 1.3 + g * 0.25) * k;
};

const theShip: SceneFn = (s) => {
  const { t, look, pal } = s;
  const [x, y, w, h] = s.stage;
  look.form = seg(t, 0.3, 2.2); look.formTint = 0.02; look.veil = 0.3; look.stageDim = 0.35;
  s.form('ship', 0.34, ONE);
  rock(s);
  look.light = [x + w * 0.5, y + h * 0.4, w * 0.4, 0.25 * seg(t, 1, 3)]; look.lightColor = pal.day;
  s.label(0, x + w * 0.5, y + h * 0.98, 'thirty oars', seg(t, 3, 4) * (1 - seg(t, s.d - 0.6, s.d)));
};

/** when plank k is replaced */
const swapAt = (k: number) => 1.2 + k * 1.6;

const planks: SceneFn = (s) => {
  const { t, look, pal } = s;
  const [x, y, w, h] = s.stage;
  look.form = 1; look.formTint = 0; look.veil = 0.3; look.stageDim = 0.35;
  s.form('ship', 0.34, ONE);
  rock(s);
  // the old planks come out as they decay, new timber goes in
  for (let k = 0; k < PLANKS; k++) {
    const t0 = swapAt(k);
    const out = seg(t, t0, t0 + 0.5), back = seg(t, t0 + 0.5, t0 + 1.1);
    s.groups[k * 4 + 1] += 0.08 * out * (1 - back);
    s.groups[k * 4 + 2] = 1 - 0.7 * out * (1 - back);
    s.groups[k * 4 + 3] = 0.85 * back;
    if (out > 0 && back < 1) {
      const [px, py] = s.px(0.12 + 0.76 * ((k + 0.5) / PLANKS), 0.74);
      s.glow(px, py, 20, Math.sin(Math.PI * seg(t, t0, t0 + 1.1)));
    }
  }
  look.light = [x + w * 0.5, y + h * 0.55, w * 0.45, 0.2]; look.lightColor = pal.fire;
};

const question: SceneFn = (s) => {
  const { t, look, pal } = s;
  const [x, y, w, h] = s.stage;
  look.form = 1; look.formTint = 0; look.veil = 0.3; look.stageDim = 0.35;
  s.form('ship', 0.34, ONE);
  rock(s);
  for (let k = 0; k < PLANKS; k++) s.groups[k * 4 + 3] = 0.85;
  // one side, then the other
  const a = seg(t, 2, 3) * (1 - seg(t, 6, 7)), b = seg(t, 6.5, 7.5) * (1 - seg(t, s.d - 1, s.d));
  s.label(0, x + w * 0.22, y + h * 0.16, 'the same ship', a);
  s.label(1, x + w * 0.78, y + h * 0.16, 'not the same', b);
  look.light = [x + w * 0.5, y + h * 0.5, w * 0.4, 0.2]; look.lightColor = pal.day;
};

/** two ships: the renewed one (groups 0–3) and one built from the old planks (groups 4–7) */
const half = (x: number, w: number) => [
  (c: C, W: number, H: number) => galley(c, W * x, H * 0.2, W * w, H * 0.64, 'hull', -1),
  (c: C, W: number, H: number) => { galley(c, W * x, H * 0.2, W * w, H * 0.64, 'sail'); galley(c, W * x, H * 0.2, W * w, H * 0.64, 'oars'); },
];
const TWO = [...half(0.02, 0.46), ...half(0.52, 0.46)];
const secondShip: SceneFn = (s) => {
  const { t, look, pal } = s;
  const [x, y, w, h] = s.stage;
  look.form = 1; look.formTint = 0; look.veil = 0.3; look.stageDim = 0.35;
  s.form('two', 0.34, TWO);
  const build = easeInOut(seg(t, 1, 6));
  s.groups[0 * 4 + 3] = 0.85; s.groups[1 * 4 + 3] = 0.3;
  s.groups[2 * 4 + 1] = 0.45 * (1 - build); s.groups[3 * 4 + 1] = 0.45 * (1 - build);
  s.groups[2 * 4 + 2] = build; s.groups[3 * 4 + 2] = build;
  const k = seg(t, 6, 7) * (1 - seg(t, s.d - 0.6, s.d));
  s.label(0, x + w * 0.25, y + h * 0.95, 'new timber', k);
  s.label(1, x + w * 0.75, y + h * 0.95, 'the old planks', k);
  look.light = [x + w * 0.5, y + h * 0.5, w * 0.45, 0.2]; look.lightColor = pal.day;
};

const yourTurn: SceneFn = (s) => {
  const { t, look, pal } = s;
  const [x, y, w, h] = s.stage;
  look.form = 1 - 0.4 * seg(t, 4, 8); look.formTint = 0; look.veil = 0.3; look.stageDim = 0.35;
  s.form('two', 0.34, TWO);
  s.groups[0 * 4 + 3] = 0.85; s.groups[1 * 4 + 3] = 0.3;
  const q = 0.6 + 0.4 * Math.sin(s.clock * 2.4);
  s.glow(x + w * 0.5, y + h * 0.45, 26, seg(t, 1, 2) * q);
  s.label(0, x + w * 0.5, y + h * 0.56, 'which is Theseus’s?', seg(t, 1, 2) * (1 - seg(t, s.d - 0.6, s.d)));
  look.light = [x + w * 0.5, y + h * 0.45, w * 0.25, 0.25 * q]; look.lightColor = pal.fire;
};

export const theseus: StoryVisuals = {
  id: 'theseus',
  aspect: ASPECT,
  loop: false,
  scenes: [theShip, planks, question, secondShip, yourTurn],
  stills: [7, 7.5, 8, 9, 4],
};
