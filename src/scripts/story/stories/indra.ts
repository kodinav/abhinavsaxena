import { seg, easeInOut, type Scene, type SceneFn, type StoryVisuals } from '../kit';

/** "Indra's net" — for Ideas: a net in which every jewel reflects every other (after the Avataṃsaka Sūtra). */
type C = CanvasRenderingContext2D;
const COLS = 7, ROWS = 5;
const ASPECT = 1.4;
/** the knots of the net, in stage units: a diamond lattice */
const KNOTS: [number, number][] = [];
for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) KNOTS.push([0.1 + (c + (r % 2) * 0.5) * (0.8 / COLS), 0.14 + r * (0.72 / (ROWS - 1))]);
const CENTRE = KNOTS.reduce((best, k, i) => (Math.hypot(k[0] - 0.5, k[1] - 0.5) < Math.hypot(KNOTS[best][0] - 0.5, KNOTS[best][1] - 0.5) ? i : best), 0);

const JEWELS = (c: C, W: number, H: number) => { for (const [u, v] of KNOTS) { c.beginPath(); c.arc(u * W, v * H, H * 0.024, 0, Math.PI * 2); c.fill(); } };
/** one jewel, large, holding a small copy of the whole net */
const BIG = (c: C, W: number, H: number) => {
  const cx = W * 0.5, cy = H * 0.5, r = H * 0.3;
  c.lineWidth = H * 0.018; c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.stroke();
  for (const [u, v] of KNOTS) { const dx = (u - 0.5) * 1.15, dy = (v - 0.5) * 1.15; if (dx * dx + dy * dy > 0.22) continue; c.beginPath(); c.arc(cx + dx * r * 1.6, cy + dy * r * 1.6, H * 0.01, 0, Math.PI * 2); c.fill(); }
};

/** the threads between neighbouring knots */
function net(s: Scene, k: number) {
  if (k <= 0) return;
  for (let r = 0; r < ROWS - 1; r++) for (let c = 0; c < COLS; c++) {
    const i = r * COLS + c;
    const a = s.px(...KNOTS[i]);
    const down = r % 2 === 0 ? [i + COLS - 1, i + COLS] : [i + COLS, i + COLS + 1];
    for (const j of down) {
      if (j < 0 || j >= KNOTS.length || Math.abs((j % COLS) - c) > 1) continue;
      const b = s.px(...KNOTS[j]);
      s.line([a[0], a[1], a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]);
    }
  }
}

const theNet: SceneFn = (s) => {
  const { t, look, pal } = s;
  const [x, y, w, h] = s.stage;
  look.form = seg(t, 0.3, 2.2); look.formTint = 0.2; look.veil = 0.3; look.stageDim = 0.35;
  s.form('jewels', 0.26, [JEWELS]);
  net(s, easeInOut(seg(t, 1.5, 6)));
  KNOTS.forEach(([u, v], i) => s.glow(...s.px(u, v), 14, 0.35 * seg(t, 2 + (i % 7) * 0.3, 3 + (i % 7) * 0.3) * (0.7 + 0.3 * Math.sin(s.clock * 2 + i))));
  look.light = [x + w * 0.5, y + h * 0.5, w * 0.45, 0.2 * seg(t, 2, 5)]; look.lightColor = pal.day;
};

const theJewel: SceneFn = (s) => {
  const { t, look, pal } = s;
  const [x, y, w, h] = s.stage;
  // one jewel comes forward and holds the rest
  look.form = 1; look.formTint = 0.25; look.veil = 0.3; look.stageDim = 0.35;
  if (t < 1.2) s.form('jewels', 0.26, [JEWELS]); else s.form('big', 0.26, [BIG]);
  look.light = [x + w * 0.5, y + h * 0.5, w * 0.3, 0.45 * seg(t, 1.5, 3.5)]; look.lightColor = pal.day;
  s.label(0, x + w * 0.5, y + h * 0.88, 'every jewel in one', seg(t, 4, 5) * (1 - seg(t, s.d - 0.8, s.d)));
};

const oneTouch: SceneFn = (s) => {
  const { t, look, pal } = s;
  const [x, y, w, h] = s.stage;
  look.form = 1; look.formTint = 0.2; look.veil = 0.3; look.stageDim = 0.35;
  s.form('jewels', 0.26, [JEWELS]);
  net(s, 1);
  // a touch at one knot travels through the whole net, and again
  const [cu, cv] = KNOTS[CENTRE];
  for (const wave of [1.2, 5.2]) {
    const front = (t - wave) * 0.45;
    KNOTS.forEach(([u, v]) => {
      const d = Math.hypot((u - cu) * ASPECT, v - cv);
      const k = Math.max(0, 1 - Math.abs(front - d) * 7);
      if (k > 0) s.glow(...s.px(u, v), 16 + 16 * k, k);
    });
  }
  const [tx, ty] = s.px(cu, cv);
  s.glow(tx, ty, 30, pulseAt(t, 1.2) + pulseAt(t, 5.2));
  look.light = [tx, ty, w * 0.3, 0.3]; look.lightColor = pal.day;
};
const pulseAt = (t: number, at: number) => Math.max(0, 1 - Math.abs(t - at) * 1.5);

const theMap: SceneFn = (s) => {
  const { t, look, pal } = s;
  const [x, y, w, h] = s.stage;
  look.form = 1 - 0.5 * seg(t, 6, 10); look.formTint = 0.2; look.veil = 0.3 * (1 - seg(t, 7, 10)); look.stageDim = 0.35;
  s.form('jewels', 0.26, [JEWELS]);
  net(s, 1 - seg(t, 7, 10));
  KNOTS.forEach(([u, v], i) => s.glow(...s.px(u, v), 16, 0.5 * (0.6 + 0.4 * Math.sin(s.clock * 1.6 + i * 0.7)) * (1 - seg(t, 8, 10))));
  look.light = [x + w * 0.5, y + h * 0.5, w * 0.5, 0.25 * (1 - seg(t, 7, 10))]; look.lightColor = pal.day;
};

export const indra: StoryVisuals = {
  id: 'indra',
  aspect: ASPECT,
  loop: false,
  scenes: [theNet, theJewel, oneTouch, theMap],
  stills: [8, 6, 2.6, 4],
};
