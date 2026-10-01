import { figure, throne, painting, type Pose } from '../shapes';
import { seg, easeInOut, arcAt, arcPoints, figureAt, type SceneFn, type StoryVisuals } from '../kit';

/** "The invention of writing" — for Publications: Theuth, Thamus, and the silence of written words (Phaedrus). */
type C = CanvasRenderingContext2D;
const serif = () => getComputedStyle(document.documentElement).getPropertyValue('--font-serif').trim() || 'Georgia, serif';

const THEUTH: Pose = { robe: true, head: 'ibis', front: [80, -10], back: [10, 10] };
const THAMUS: Pose = { seated: true, robe: true, head: 'crown', facing: -1, front: [40, 40], back: [20, 30] };
const drawTheuth = (c: C, W: number, H: number) => figure(c, W * 0.2, H * 0.92, H * 0.6, THEUTH);
const drawThamus = (c: C, W: number, H: number) => { throne(c, W * 0.82, H * 0.92, H * 0.6, -1); figure(c, W * 0.82, H * 0.92, H * 0.6, THAMUS); };

/* the arts he invented, as small signs */
const sign = (k: number) => (c: C, W: number, H: number) => {
  const cx = W * (0.42 + (k % 3) * 0.18), cy = H * (k < 3 ? 0.28 : 0.6), r = H * 0.09;
  c.lineWidth = H * 0.016; c.lineCap = 'round'; c.lineJoin = 'round';
  if (k === 0) { c.font = `400 ${H * 0.13}px ${serif()}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('1 2 3', cx, cy); }
  if (k === 1) { c.beginPath(); c.moveTo(cx - r, cy + r * 0.8); c.lineTo(cx + r, cy + r * 0.8); c.lineTo(cx - r * 0.2, cy - r); c.closePath(); c.stroke(); }
  if (k === 2) { c.beginPath(); for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 - Math.PI / 2, rr = i % 2 ? r * 0.42 : r; c.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } c.closePath(); c.fill(); }
  if (k === 3) { c.strokeRect(cx - r * 0.8, cy - r * 0.8, r * 1.6, r * 1.6); for (const [dx, dy] of [[-0.4, -0.4], [0, 0], [0.4, 0.4]]) { c.beginPath(); c.arc(cx + dx * r, cy + dy * r, r * 0.13, 0, Math.PI * 2); c.fill(); } }
  if (k === 4) { for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) if ((i + j) % 2 === 0) c.fillRect(cx - r + i * (r * 0.67), cy - r + j * (r * 0.67), r * 0.67, r * 0.67); c.strokeRect(cx - r, cy - r, r * 2, r * 2); }
  if (k === 5) { c.font = `italic 400 ${H * 0.14}px ${serif()}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('Α Β Γ', cx, cy); }
};
const SIGNS = [0, 1, 2, 3, 4, 5].map(sign);
const NAMES = ['arithmetic', 'geometry', 'astronomy', 'dice', 'draughts', 'letters'];

const theuth: SceneFn = (s) => {
  const { t, look, pal } = s;
  const [x, y, w, h] = s.stage;
  look.form = seg(t, 0.2, 1.6); look.formTint = 0.04; look.veil = 0.3; look.stageDim = 0.35;
  s.form('arts', 0.32, [drawTheuth, ...SIGNS]);
  SIGNS.forEach((_, k) => {
    const on = seg(t, 1.6 + k * 1.3, 2.4 + k * 1.3);
    s.groups[(k + 1) * 4 + 2] = on;
    s.groups[(k + 1) * 4 + 3] = k === 5 ? 0.7 * on : 0.15 * on;
    // each name shows while its sign appears; only letters, his great discovery, stays
    const until = k === 5 ? s.d - 0.8 : 1.6 + k * 1.3 + 2.2;
    s.label(k, x + w * (0.42 + (k % 3) * 0.18), y + h * (k < 3 ? 0.4 : 0.72), NAMES[k], on * (1 - seg(t, until, until + 0.6)));
  });
  look.light = [x + w * 0.6, y + h * 0.45, w * 0.35, 0.3 * seg(t, 8, 10)]; look.lightColor = pal.day;
};

/** the letters, which travel from the god to the king */
const LETTERS = (c: C, W: number, H: number) => { c.font = `italic 400 ${H * 0.15}px ${serif()}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('Α Β Γ Δ', W * 0.36, H * 0.3); };
const gift: SceneFn = (s) => {
  const { t, look, pal } = s;
  const [x, y, w, h] = s.stage;
  look.form = seg(t, 0, 1.2); look.formTint = 0.05; look.veil = 0.3; look.stageDim = 0.35;
  s.form('court', 0.34, [drawTheuth, drawThamus, LETTERS]);
  const carry = easeInOut(seg(t, 2, 8));
  s.groups[2 * 4] = 0.3 * carry;
  s.groups[2 * 4 + 1] = -0.06 * Math.sin(carry * Math.PI);
  s.groups[2 * 4 + 3] = 0.7;
  s.label(0, x + w * 0.2, y + h * 0.96, 'Theuth', seg(t, 0.6, 1.4) * (1 - seg(t, s.d - 0.6, s.d)));
  s.label(1, x + w * 0.82, y + h * 0.96, 'Thamus', seg(t, 1, 1.8) * (1 - seg(t, s.d - 0.6, s.d)));
  look.light = [x + w * (0.36 + 0.3 * carry), y + h * 0.3, w * 0.22, 0.3]; look.lightColor = pal.day;
};

/** a written page: lines of text */
const PAGE = (c: C, W: number, H: number) => {
  c.font = `400 ${H * 0.05}px ${serif()}`; c.textAlign = 'left'; c.textBaseline = 'middle';
  const lines = ['ΜΝΗΜΗ · memory', 'ΛΗΘΗ · forgetting', 'ΓΡΑΜΜΑΤΑ · letters', 'ΣΟΦΙΑ · wisdom'];
  lines.forEach((l, i) => c.fillText(l, W * 0.32, H * (0.2 + i * 0.085)));
};
const reply: SceneFn = (s) => {
  const { t, look, pal } = s;
  const [x, y, w, h] = s.stage;
  look.form = seg(t, 0, 1.2); look.formTint = 0.04; look.veil = 0.3; look.stageDim = 0.35;
  s.form('reply', 0.32, [drawThamus, PAGE]);
  s.groups[1 * 4 + 3] = 0.45;
  // memory, the light in the king's people, fades as the page fills
  const fade = seg(t, 3, 11);
  const head = figureAt(s, 0.82, 0.92, 0.6, THAMUS).head;
  s.glow(head[0], head[1], 26, 1 - fade);
  look.light = [head[0], head[1], w * 0.16, 0.4 * (1 - fade)]; look.lightColor = pal.fire;
  s.label(0, x + w * 0.45, y + h * 0.6, 'forgetfulness', seg(t, 6, 7) * (1 - seg(t, s.d - 0.6, s.d)));
};

const HEARERS = [0.12, 0.28, 0.44, 0.6, 0.76, 0.92];
const semblance: SceneFn = (s) => {
  const { t, look, pal } = s;
  const [x, y, w, h] = s.stage;
  look.form = seg(t, 0, 1.2); look.formTint = 0.05; look.veil = 0.3; look.stageDim = 0.35;
  s.form('hearers', 0.32, HEARERS.map((u, i) => (c: C, W: number, H: number) => figure(c, W * u, H * 0.92, H * 0.38, { robe: i % 2 === 0, front: [20 + i * 8, 20], facing: i % 2 ? -1 : 1 })));
  // each seems to shine with learning; the light is borrowed and does not stay
  HEARERS.forEach((u, i) => {
    const on = seg(t, 1 + i * 0.6, 2 + i * 0.6), off = seg(t, 6 + i * 0.4, 8 + i * 0.4);
    s.groups[i * 4 + 3] = 0.75 * on * (1 - off);
    const head = figureAt(s, u, 0.92, 0.38, {}).head;
    s.glow(head[0], head[1] - h * 0.08, 14, on * (1 - off) * 0.8);
  });
  s.label(0, x + w * 0.5, y + h * 0.4, 'the show of wisdom', seg(t, 3, 4) * (1 - seg(t, 8, 9)));
  look.light = [x + w * 0.5, y + h * 0.55, w * 0.45, 0.25 * seg(t, 2, 4) * (1 - seg(t, 7, 9))]; look.lightColor = pal.day;
};

const PAINT = (c: C, W: number, H: number) => painting(c, W * 0.6, H * 0.14, W * 0.26, H * 0.74);
const silence = (unvarying: boolean): SceneFn => (s) => {
  const { t, look, pal } = s;
  const [x, y, w, h] = s.stage;
  look.form = seg(t, 0, 1.2); look.formTint = 0.04; look.veil = 0.3; look.stageDim = 0.35;
  s.form('painting', 0.3, [PAINT, (c: C, W: number, H: number) => figure(c, W * 0.18, H * 0.92, H * 0.56, { robe: true, head: 'beard', front: [75, 15] })]);
  const from = [x + w * 0.3, y + h * 0.45], to = [x + w * 0.66, y + h * 0.45];
  // a question goes to the picture; the picture keeps its silence, or gives the same answer every time
  const rounds = unvarying ? 3 : 1;
  for (let r = 0; r < rounds; r++) {
    const t0 = unvarying ? 1 + r * 3.1 : 1.5;
    const go = easeInOut(seg(t, t0, t0 + 1.4));
    if (go > 0 && go < 1) { const p = arcAt(from, to, h * 0.12, go); s.glow(p[0], p[1], 18, 1); s.line(arcPoints(from, to, h * 0.12, go, 16)); }
    if (unvarying) {
      const back = easeInOut(seg(t, t0 + 1.5, t0 + 2.6));
      if (back > 0 && back < 1) { const p = arcAt(to, from, -h * 0.12, back); s.glow(p[0], p[1], 12, 0.9); }
      if (back > 0) s.label(1 + r, from[0], from[1] - 36 - r * 18, '“the same”', seg(t, t0 + 2.4, t0 + 2.8) * (1 - seg(t, s.d - 0.8, s.d)));
    } else {
      const hush = seg(t, 3, 4) * (1 - seg(t, s.d - 0.8, s.d));
      s.label(0, to[0], y + h * 0.95, 'a solemn silence', hush);
    }
  }
  look.light = [to[0], to[1], w * 0.2, 0.25 * seg(t, 1, 3)]; look.lightColor = pal.day;
};

export const writing: StoryVisuals = {
  id: 'writing',
  aspect: 1.25,
  loop: false,
  scenes: [theuth, gift, reply, semblance, silence(false), silence(true)],
  stills: [11, 6, 9, 5, 5, 9],
};
