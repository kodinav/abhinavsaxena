import { figure, city, clock, ring } from '../shapes';
import { seg, easeInOut, pulse, type SceneFn, type StoryVisuals } from '../kit';

/** "What is knowledge?" — for the Questions section: Theaetetus, the road to Larisa, Daedalus' statues, a stopped clock. */
const serif = () => getComputedStyle(document.documentElement).getPropertyValue('--font-serif').trim() || 'Georgia, serif';

/* the road to Larisa, as a cubic curve in stage units */
const R = [[0.05, 0.93], [0.52, 1.0], [0.14, 0.52], [0.64, 0.47]];
const road = (p: number): [number, number] => {
  const q = 1 - p;
  return [
    q * q * q * R[0][0] + 3 * q * q * p * R[1][0] + 3 * q * p * p * R[2][0] + p * p * p * R[3][0],
    q * q * q * R[0][1] + 3 * q * q * p * R[1][1] + 3 * q * p * p * R[2][1] + p * p * p * R[3][1],
  ];
};
const drawRoad = (c: CanvasRenderingContext2D, w: number, h: number) => {
  c.lineWidth = h * 0.024; c.lineCap = 'round'; c.setLineDash([h * 0.028, h * 0.024]);
  c.beginPath(); c.moveTo(R[0][0] * w, R[0][1] * h); c.bezierCurveTo(R[1][0] * w, R[1][1] * h, R[2][0] * w, R[2][1] * h, R[3][0] * w, R[3][1] * h); c.stroke();
  c.setLineDash([]);
};
const drawCity = (c: CanvasRenderingContext2D, w: number, h: number) => city(c, w * 0.6, h * 0.5, w * 0.36, h * 0.3);

const question: SceneFn = (s) => {
  const { t, look, pal } = s;
  const [x, y, w, h] = s.stage;
  look.form = seg(t, 0.2, 1.8) * (1 - 0.5 * seg(t, 7.6, 9)); look.formTint = 0.1;
  look.veil = 0.35; look.stageDim = 0.35;
  look.light = [x + w * 0.5, y + h * 0.5, w * 0.4, 0.35 * seg(t, 0.5, 2.5)]; look.lightColor = pal.day;
  s.form('question', 0.34, [(c, W, H) => {
    c.font = `italic 400 ${H * 0.19}px ${serif()}`; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('What is', W / 2, H * 0.36); c.fillText('knowledge?', W / 2, H * 0.6);
  }]);
};

const larisa = (rightOpinion: boolean): SceneFn => (s) => {
  const { t, look } = s;
  look.form = seg(t, 0, 1.4); look.formTint = 0.05; look.veil = 0.3; look.stageDim = 0.35;
  s.form('road', 0.3, [drawRoad, drawCity]);
  s.groups[1 * 4 + 3] = 0.25 * seg(t, 6, 9); // the city warms as they arrive
  const p = easeInOut(seg(t, 1.2, rightOpinion ? 8.4 : 9.6));
  const show = seg(t, 0.8, 1.6) * (1 - seg(t, s.d - 0.8, s.d));
  const [kx, ky] = s.px(...road(p));
  s.glow(kx, ky, 26, show);
  if (!rightOpinion) {
    // he leads others thither
    for (let i = 1; i <= 2; i++) { const [fx, fy] = s.px(...road(Math.max(0, p - 0.07 * i))); s.glow(fx, fy, 16, show * 0.55); }
    s.label(0, kx, ky + 16, 'one who knows the way', show * (1 - seg(t, 8.6, 9.6)));
  } else {
    const q = easeInOut(seg(t, 1.8, 9.2));
    const [ox, oy] = s.px(...road(q));
    s.glow(ox, oy, 20, show * (0.55 + 0.25 * Math.sin(s.clock * 9)));
    s.label(0, kx, ky - 30, 'knowledge', show * 0.9);
    s.label(1, ox, oy + 16, 'right opinion', show * 0.9);
  }
};

const daedalus: SceneFn = (s) => {
  const { t, look } = s;
  const [x, y, w, h] = s.stage;
  look.form = seg(t, 0, 1.4); look.formTint = 0.04; look.veil = 0.3; look.stageDim = 0.35;
  s.form('statues', 0.32, [
    (c, W, H) => figure(c, W * 0.34, H * 0.82, H * 0.44, { robe: true, front: [12, 10], back: [8, 8] }),
    (c, W, H) => c.fillRect(W * 0.25, H * 0.82, W * 0.18, H * 0.1),
    (c, W, H) => figure(c, W * 0.7, H * 0.82, H * 0.44, { robe: true, stride: 0.7, front: [-25, 10], back: [30, 10] }),
    (c, W, H) => c.fillRect(W * 0.61, H * 0.82, W * 0.18, H * 0.1),
    (c, W, H) => { c.fillRect(W * 0.1, H * 0.55, W * 0.03, H * 0.37); c.beginPath(); c.arc(W * 0.115, H * 0.55, W * 0.022, 0, Math.PI * 2); c.fill(); },
  ]);
  // the unfastened statue walks off and is gone
  const off = easeInOut(seg(t, 2.6, 10));
  s.groups[2 * 4] = 0.42 * off;
  s.groups[2 * 4 + 1] = -0.012 * Math.abs(Math.sin(s.clock * 6)) * seg(t, 2.6, 3.2);
  s.groups[2 * 4 + 2] = 1 - seg(t, 7.5, 10.5);
  // the other is fastened by the tie of the cause
  const tie = easeInOut(seg(t, 5.5, 8));
  if (tie > 0) {
    const a = [x + w * 0.115, y + h * 0.56], b = [x + w * 0.31, y + h * 0.56];
    s.line([a[0], a[1], a[0] + (b[0] - a[0]) * tie, a[1] + (b[1] - a[1]) * tie + Math.sin(tie * Math.PI) * h * 0.03]);
    s.glow(a[0] + (b[0] - a[0]) * tie, a[1] + (b[1] - a[1]) * tie, 14, 0.8 * (1 - seg(t, 8, 9)));
  }
  s.groups[0 * 4 + 3] = 0.55 * seg(t, 7.6, 9);
  const lk = seg(t, 1.2, 2.2) * (1 - seg(t, s.d - 1, s.d));
  s.label(0, x + w * 0.34, y + h * 0.94, 'fastened', lk * seg(t, 7.6, 8.6));
  s.label(1, x + w * (0.7 + 0.42 * off), y + h * 0.94, 'running away', lk * (1 - seg(t, 8, 10)));
};

const stoppedClock: SceneFn = (s) => {
  const { t, look, pal } = s;
  const [x, y, w, h] = s.stage;
  look.form = seg(t, 0, 1.4); look.formTint = 0.06; look.veil = 0.3; look.stageDim = 0.4;
  s.form('clock', 0.3, [(c, W, H) => clock(c, W * 0.5, H * 0.48, H * 0.34, 8, 15)]);
  // the time that is really passing sweeps round; the stopped hands are right only when it meets them
  const cx = x + w * 0.5, cy = y + h * 0.48, r = h * 0.34 * 0.72;
  const deg = 90 + (t - 7.4) * 45;
  const a = (deg * Math.PI) / 180;
  const show = seg(t, 1.2, 2) * (1 - seg(t, s.d - 1, s.d));
  for (let i = 0; i < 6; i++) {
    const ai = a - i * 0.07;
    s.glow(cx + Math.sin(ai) * r, cy - Math.cos(ai) * r, 22 - i * 2.6, show * (i ? 0.45 - i * 0.06 : 1));
  }
  const meet = pulse(t, 7.0, 8.4, 0.35);
  if (meet > 0) {
    s.glow(cx + r, cy, 60, meet);
    look.light = [cx + r, cy, w * 0.2, 0.5 * meet]; look.lightColor = pal.day;
    s.label(0, cx + r, cy + 34, 'right, by luck', meet);
  }
};

const stillOpen: SceneFn = (s) => {
  const { t, look, pal } = s;
  const [x, y, w, h] = s.stage;
  look.form = seg(t, 0, 1.4) * (1 - 0.5 * seg(t, 7.5, 10)); look.formTint = 0.05; look.veil = 0.3; look.stageDim = 0.35;
  const C = [[0.42, 0.42], [0.58, 0.42], [0.5, 0.62]];
  s.form('venn', 0.3, C.map(([u, v]) => (c: CanvasRenderingContext2D, W: number, H: number) => ring(c, W * u, H * v, H * 0.2, H * 0.03)));
  // the three conditions loosen, and the question stays open
  const loose = easeInOut(seg(t, 6, 10));
  C.forEach(([u, v], i) => { s.groups[i * 4] = (u - 0.5) * 0.5 * loose; s.groups[i * 4 + 1] = (v - 0.48) * 0.5 * loose; });
  const lk = seg(t, 1, 2) * (1 - seg(t, 7.5, 9));
  s.label(0, x + w * 0.3, y + h * 0.18, 'true', lk);
  s.label(1, x + w * 0.7, y + h * 0.18, 'believed', lk);
  s.label(2, x + w * 0.5, y + h * 0.9, 'justified', lk);
  const cx = x + w * 0.5, cy = y + h * 0.49;
  const flick = 0.6 + 0.4 * Math.sin(s.clock * 5.3) * Math.sin(s.clock * 2.1);
  s.glow(cx, cy, 34, seg(t, 1.5, 2.5) * flick * (1 - seg(t, 9, 10)));
  look.light = [cx, cy, w * 0.16, 0.3 * seg(t, 1.5, 2.5) * flick]; look.lightColor = pal.day;
};

export const knowledge: StoryVisuals = {
  id: 'knowledge',
  aspect: 1.25,
  loop: false,
  scenes: [question, larisa(false), larisa(true), daedalus, stoppedClock, stillOpen],
  stills: [5, 7, 7, 9, 7.4, 4],
  presets: [{ swirl: 0.3 }, undefined, undefined, undefined, { swirl: 0.5 }, { swirl: 0.2 }],
};
