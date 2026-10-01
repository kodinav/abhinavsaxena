import { wallText } from '@/data/stories';
import { place, amphora, horse, statue, owl, kylix, prisoner, standing, teller, sun, type Shape } from '../shapes';
import { seg, easeOut, easeInOut, wobble, mix3, arcAt, arcPoints, type Scene, type SceneFn, type StoryVisuals } from '../kit';

/** "The voice from the wall": Plato's cave, then the testimony chain and the wall that speaks. Plays in the hero. */
type Ctx2D = CanvasRenderingContext2D;

const PARAPET = 0.665;
const PROCESSION: { shape: Shape; h: number }[] = [
  { shape: amphora, h: 0.2 }, { shape: horse, h: 0.2 }, { shape: statue, h: 0.3 }, { shape: owl, h: 0.17 },
  { shape: kylix, h: 0.1 }, { shape: amphora, h: 0.18 }, { shape: horse, h: 0.19 },
];
const START = 1.2, SPACING = 0.42, SPEED = 0.1;
const SEATS = [0.1, 0.3, 0.5, 0.7, 0.9];
const SEAT_BASE = 1.03, SEAT_H = 0.24;
const TELLERS = [0.16, 0.39, 0.62, 0.85];
const TELLER_BASE = 0.93, TELLER_H = 0.5;
const ASPECT = 1.25;

const hand = (k: number, which: 'back' | 'front'): [number, number] => {
  const [ux, uy] = teller[which];
  const s = TELLER_H / 100;
  return [TELLERS[k] + ((ux - teller.w / 2) * s) / ASPECT, TELLER_BASE - (100 - uy) * s];
};

/** How far the carried objects have travelled, given the scene and the time within it. */
function procession(scene: 'shadows' | 'echo' | 'turning', t: number) {
  if (scene === 'shadows') return SPEED * t;
  const atEcho = SPEED * 16;
  if (scene === 'echo') {
    const slow = Math.min(t, 1.4);
    const resume = t <= 8 ? 0 : t <= 9.5 ? ((t - 8) * (t - 8)) / 3 : 0.75 + (t - 9.5);
    return atEcho + SPEED * (slow - (slow * slow) / 2.8) + SPEED * resume;
  }
  return atEcho + 0.295 + SPEED * t;
}

/* ---------------------------------------------------------------- drawing the shadows */
function drawSeated(c: Ctx2D, w: number, h: number, alpha: number, skip = -1) {
  if (alpha <= 0.01) return;
  c.save(); c.globalAlpha = alpha;
  SEATS.forEach((x, i) => { if (i !== skip) place(c, prisoner, x * w, SEAT_BASE * h, SEAT_H * h); });
  c.lineWidth = Math.max(1, h * 0.006); c.lineCap = 'round';
  const neck = (SEAT_BASE - SEAT_H * 0.43) * h;
  for (let i = 0; i < SEATS.length - 1; i++) {
    if (i === skip || i + 1 === skip) continue;
    const x0 = SEATS[i] * w + h * 0.03, x1 = SEATS[i + 1] * w - h * 0.03;
    c.beginPath(); c.moveTo(x0, neck); c.quadraticCurveTo((x0 + x1) / 2, neck + h * 0.035, x1, neck); c.stroke();
  }
  c.restore();
}
function drawParapet(c: Ctx2D, w: number, h: number) {
  const g = c.createLinearGradient(0, (PARAPET - 0.01) * h, 0, (PARAPET + 0.058) * h);
  g.addColorStop(0, 'rgba(255,255,255,0)');
  g.addColorStop(0.2, 'rgba(255,255,255,0.62)');
  g.addColorStop(0.75, 'rgba(255,255,255,0.62)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  c.save(); c.fillStyle = g; c.fillRect(0, (PARAPET - 0.01) * h, w, 0.068 * h); c.restore();
}
function drawProcession(c: Ctx2D, w: number, h: number, u: number, shake: number, clock: number) {
  c.save();
  c.globalAlpha = 0.9;
  c.shadowColor = 'rgba(255,255,255,0.9)'; c.shadowBlur = Math.max(2, h * 0.012);
  PROCESSION.forEach((o, i) => {
    const x = START + i * SPACING - u;
    if (x < -0.35 || x > 1.35) return;
    const bob = 0.007 * Math.sin(clock * 5.2 + i * 1.7);
    place(c, o.shape, x * w, (PARAPET + 0.006 + bob) * h, o.h * h * shake);
  });
  c.restore();
}
function drawEcho(c: Ctx2D, w: number, h: number, u: number, t: number, k: number) {
  const x = (START + 2 * SPACING - u) * w - h * 0.04;
  const y = (PARAPET - 0.3 * 0.9) * h;
  c.save(); c.lineCap = 'round'; c.lineWidth = Math.max(1.5, h * 0.008);
  for (let i = 0; i < 3; i++) {
    const ph = ((t - 1.3) / 1.7 + i / 3) % 1;
    if (ph < 0) continue;
    c.globalAlpha = k * (1 - ph) * 0.95;
    c.beginPath(); c.arc(x, y, (0.03 + 0.17 * ph) * h, Math.PI - 0.6, Math.PI + 0.6); c.stroke();
  }
  c.restore();
}
/** The wall's sentences, typed up to `chars` characters; a negative clock draws no cursor. */
function drawText(c: Ctx2D, w: number, h: number, chars: number, alpha: number, clock: number) {
  if (alpha <= 0.01) return;
  const size = h * 0.052, lead = size * 1.55, x0 = w * 0.1, y0 = h * 0.12;
  c.save();
  c.globalAlpha = alpha;
  c.font = `500 ${size}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
  c.textBaseline = 'top';
  let left = chars, cx = x0, cy = y0;
  wallText.forEach((s, line) => {
    if (left <= 0) return;
    const shown = s.slice(0, Math.min(s.length, left));
    c.fillText(shown, x0, y0 + line * lead);
    cx = x0 + c.measureText(shown).width; cy = y0 + line * lead;
    left -= s.length;
  });
  const finished = left >= 0 && chars >= wallText.join('').length;
  if (clock >= 0 && (!finished || Math.floor(clock * 2.2) % 2 === 0)) c.fillRect(cx + size * 0.15, cy, size * 0.58, size * 1.05);
  c.restore();
}

const firelight = (s: Scene, pos: number, k: number, fl: number) => {
  const [sx, sy, sw, sh] = s.stage;
  s.look.light = [sx + sw * 0.5, sy + sh * pos, sw * 0.38, k * (0.82 + 0.18 * fl)];
  s.look.lightColor = s.pal.fire;
};

/* ---------------------------------------------------------------- the scenes */
const fire: SceneFn = (s) => {
  const { t, look, pal } = s;
  const fl = wobble((s.clock + t) * 0.9);
  const kindle = easeInOut(seg(t, 0.8, 6.5));
  look.wallLight = 0.95 * kindle; look.wallColor = pal.fire; look.flick = 0.74 + 0.26 * fl;
  look.wall = [0.5, 0.56, 0.62, 0.66];
  look.embers = seg(t, 0, 1.8) * (1 - 0.6 * seg(t, 7.5, 10));
  look.maskOn = 1; look.stageDim = 0.35 * kindle; look.veil = 0.6 * kindle;
  firelight(s, 1.08, 0.55 * seg(t, 0, 2.5), fl);
  s.mask((c, w, h) => drawSeated(c, w, h, kindle));
};

const wallScene = (which: 'shadows' | 'echo'): SceneFn => (s) => {
  const { t, look, pal } = s;
  const fl = wobble((s.clock + t) * 0.9), shake = 1 + 0.012 * fl;
  look.wallLight = 0.95; look.wallColor = pal.fire; look.flick = 0.86 + 0.14 * fl;
  look.wall = [0.5, 0.52, 0.62, 0.64];
  look.embers = 0.22; look.maskOn = 1; look.stageDim = 0.45; look.veil = 0.6;
  firelight(s, 1.08, 0.5, fl);
  const u = procession(which, t);
  const speak = which === 'echo' ? seg(t, 1.3, 2.0) * (1 - seg(t, 7.4, 8.4)) : 0;
  const clock = s.clock;
  s.mask((c, w, h) => {
    drawSeated(c, w, h, 1);
    drawParapet(c, w, h);
    drawProcession(c, w, h, u, shake, clock);
    if (speak > 0) drawEcho(c, w, h, u, t, speak);
  });
};

const turning: SceneFn = (s) => {
  const { t, look, pal } = s;
  const [sx, sy, sw, sh] = s.stage;
  const fl = wobble((s.clock + t) * 0.9), shake = 1 + 0.012 * fl;
  const rise = easeOut(seg(t, 0.2, 1.7));
  const glare = easeInOut(seg(t, 1.4, 3.0));
  const after = seg(t, 3.4, 7.6);
  look.wallLight = (0.95 + 0.6 * glare) * (1 - 0.88 * after);
  look.wallColor = mix3(pal.fire, pal.day, glare);
  look.flick = 0.86 + 0.14 * fl + (1 - (0.86 + 0.14 * fl)) * glare;
  look.maskOn = 1 - seg(t, 1.6, 3.2); look.stageDim = 0.45 * (1 - glare); look.veil = 0.6 * (1 - after * 0.6);
  look.light = [sx + sw * 0.5, sy + sh * 0.5, sw * 0.5, 1.0 * glare * (1 - 0.75 * after)]; look.lightColor = pal.day;
  const u = procession('turning', t);
  const clock = s.clock;
  s.mask((c, w, h) => {
    drawParapet(c, w, h);
    drawProcession(c, w, h, u, shake, clock);
    drawSeated(c, w, h, 1, 2);
    place(c, standing, 0.5 * w, (SEAT_BASE + 0.32 * (1 - rise)) * h, 0.44 * h);
  });
  if (t > 2.0) s.burst('turn', sx + sw * 0.5, sy + sh * 0.62, 1);
};

const sunScene: SceneFn = (s) => {
  const { t, look, pal } = s;
  const [sx, sy, sw, sh] = s.stage;
  const climb = easeInOut(seg(t, 0, 4.2));
  look.form = seg(t, 0, 1.4) * (1 - 0.45 * seg(t, 10.4, 12));
  look.formTint = pal.dark ? 0.22 : 0.7; // an ink sun reads as an eclipse; the light theme gets an ochre one
  s.groups[1] = 0.8 * (1 - climb);
  const cy = sy + sh * (0.4 + 0.8 * (1 - climb));
  look.light = [sx + sw * 0.5, cy, sw * 0.44, 0.9 * seg(t, 1.6, 5.0) * (1 - 0.4 * seg(t, 10.4, 12))]; look.lightColor = pal.day;
  look.veil = 0.3; look.stageDim = 0.2;
  s.form('sun', 0.3, [(c, w, h) => sun(c, w * 0.5, h * 0.4, h * 0.115)]);
};

let trail: number[][] = [];
const telling: SceneFn = (s) => {
  const { t, look } = s;
  const [sx, sy, sw, sh] = s.stage;
  look.form = seg(t, 0.2, 1.8) * (1 - seg(t, 13.6, 15)); look.formTint = 0.04;
  look.veil = 0.25; look.stageDim = 0.3;
  s.form('tellers', 0.36, TELLERS.map((x) => (c: Ctx2D, w: number, h: number) => place(c, teller, x * w, TELLER_BASE * h, TELLER_H * h)));
  // the spark: from A's offered hand to B's open one, through B, and on down the chain
  const px = (p: [number, number]) => s.px(p[0], p[1]);
  let at = 2.4, pos = px(hand(0, 'front')) as number[], holder = 0;
  for (let k = 0; k < TELLERS.length - 1; k++) {
    const a = px(hand(k, 'front')), b = px(hand(k + 1, 'back')), c = px(hand(k + 1, 'front'));
    if (t >= at) {
      const v = easeInOut(seg(t, at, at + 1.15));
      pos = arcAt(a, b, sh * 0.13, v);
      s.line(arcPoints(a, b, sh * 0.13, v));
      if (v > 0.5) holder = k + 1;
    }
    at += 1.15;
    if (t >= at) { const v = easeInOut(seg(t, at, at + 0.75)); pos = [b[0] + (c[0] - b[0]) * v, b[1] + (c[1] - b[1]) * v]; }
    at += 0.75;
  }
  const appear = seg(t, 1.6, 2.4) * (1 - seg(t, 13.4, 14.6));
  for (let k = 0; k < TELLERS.length; k++) s.groups[k * 4 + 3] = k === holder ? 0.85 * appear : k < holder ? 0.3 * appear : 0;
  if (t < 0.1) trail = [];
  trail.unshift([pos[0], pos[1]]);
  trail.length = Math.min(trail.length, 9);
  const pulse = 1 + 0.12 * Math.sin(s.clock * 6);
  s.glow(pos[0], pos[1], 34 * pulse, appear);
  trail.forEach((p, i) => { if (i) s.glow(p[0], p[1], 22 - i * 1.8, appear * (0.5 - i * 0.05)); });
  const lk = seg(t, 1.4, 2.6) * (1 - seg(t, 12.8, 14.2));
  TELLERS.forEach((x, i) => s.label(i, sx + x * sw, sy + (TELLER_BASE + 0.045) * sh, 'ABCD'[i], lk));
};

const newWall: SceneFn = (s) => {
  const { t, look, pal } = s;
  const on = easeInOut(seg(t, 0.6, 2.6));
  look.wallLight = 0.92 * on; look.wallColor = pal.cool; look.flick = 0.95 + 0.05 * wobble((s.clock + t) * 2.8);
  look.wall = [0.5, 0.42, 0.64, 0.56];
  look.maskOn = 1; look.stageDim = 0.6 * on; look.veil = 0.7 * on;
  const typed = Math.max(0, Math.floor((t - 2.2) * 24));
  const clock = s.clock;
  s.mask((c, w, h) => { drawSeated(c, w, h, on); drawText(c, w, h, typed, 1, clock); });
};

const coda: SceneFn = (s) => {
  const { t, look, pal } = s;
  const [sx, sy, sw, sh] = s.stage;
  const fade = 1 - seg(t, 0.4, 2.6);
  const release = seg(t, 6.4, 8.6);
  look.form = seg(t, 0, 2.2) * (1 - release); look.formTint = 0.12;
  look.wallLight = 0.92 * (1 - seg(t, 1.5, 9)); look.wallColor = pal.cool; look.flick = 1;
  look.wall = [0.5, 0.42, 0.64, 0.56];
  look.maskOn = 1 - seg(t, 6.5, 9); look.stageDim = 0.6 * (1 - seg(t, 6, 9)); look.veil = 0.7 * (1 - seg(t, 6, 10));
  s.form('coda', 0.42, [(c, w, h) => drawText(c, w, h, Infinity, 1, -1)]);
  s.mask((c, w, h) => { drawSeated(c, w, h, 1 - seg(t, 4, 6.5)); drawText(c, w, h, Infinity, fade, -1); });
  if (t > 6.6) s.burst('coda', sx + sw * 0.5, sy + sh * 0.4, 0.45);
};

export const cave: StoryVisuals = {
  id: 'cave',
  aspect: ASPECT,
  loop: true,
  scenes: [fire, wallScene('shadows'), wallScene('echo'), turning, sunScene, telling, newWall, coda],
  stills: [8, 9, 4, 2.4, 8, 9, 12, 4],
  presets: [
    { speed: 0.8, swirl: 0.25 }, { speed: 0.7, swirl: 0.2 }, { speed: 0.7, swirl: 0.2 }, { speed: 1.25, swirl: 0.4 },
    { speed: 0.9, swirl: 0.35 }, { speed: 0.9 }, { speed: 0.8, structure: 0.65 }, { speed: 1.0 },
  ],
};
