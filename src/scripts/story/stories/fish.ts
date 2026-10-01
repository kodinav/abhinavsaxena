import { seg, ease, easeOut, lerp, noise, hash, css, mixRGB, pop, type RGB, type Mood, type Stage, type SceneFn, type StoryVisuals } from '../puppet/theatre';
import { person, walk, gesture, mixA, type Body, type Joints } from '../puppet/figure';
import { fish as swimmer, bird } from '../puppet/beasts';
import { glow, ripple, sound, twinkle } from '../puppet/fx';
import { bubble, shown, HAPPY_FISH, NEQ, Q, FISH, CHECK, BANG, type Icon } from '../puppet/bubbles';
import { willow } from '../puppet/scenery';
import { thread } from '../puppet/marks';

/**
 * "The happy fish" (Zhuangzi 17, tr. Giles): two friends stroll onto the
 * bridge over the Hao. Zhuangzi watches the minnows and says they are happy;
 * Huizi the logician objects that he is not a fish; Zhuangzi turns the
 * question round on him; Huizi walls each mind off from the next; Zhuangzi
 * laughs the walls down — he knew it here, on the bridge.
 *
 * One set, seen from many places: a stone arch over the river whose
 * reflection completes the circle, misty peaks behind, willows on the banks,
 * minnows in the water. Zhuangzi always has his topknot, beard and fan;
 * Huizi his tall pinned cap and his scroll.
 */
type C = CanvasRenderingContext2D;
type P = [number, number];
type Cam = [number, number, number];
const TAU = Math.PI * 2;
const R = Math.PI / 180;
const GOLD: RGB = [240, 176, 70];
const VERMILION: RGB = [206, 80, 50];

/* ================================================================ the set */
const WATER = 0.8;   // the river's surface
const BANK = 0.76;   // the top of the banks
const CX = 0.7;      // the crown of the bridge
const SPAN = 0.56;   // half its length
const CROWN = 0.58;  // the deck at the crown
const ARCH = 0.17;   // the radius of the arch
const RAIL = 0.1;    // the height of the balustrade
const ZX = 0.8, HX = 0.6;        // where the two friends stand at the top
const PANE1 = 0.7, PANE2 = 0.95; // where Huizi's walls go up

/** Where feet go at x: the banks, and the hump of the bridge between them. */
const ground = (x: number) => { const d = Math.min(1, Math.abs(x - CX) / SPAN); return CROWN + (BANK - CROWN) * d * d; };
const inkOf = (s: Stage): RGB => (s.dark ? [14, 13, 16] : [27, 26, 31]);
/** s.tone, with transparency */
const toneA = (s: Stage, k: number, a: number) => css(mixRGB(inkOf(s), s.screen, Math.max(0, Math.min(1, k))), a);
const path = (c: C, pts: P[]) => { c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); };

/** Draw a far layer with parallax: depth 0 hangs on the sky, 1 moves with the stage. */
function far(s: Stage, cam: Cam, depth: number, draw: () => void) {
  const c = s.c;
  const [x, y, z] = cam;
  const zz = 1 + (z - 1) * depth;
  c.save();
  c.translate(x, y); c.scale(zz / z, zz / z); c.translate(-(s.W / 2 + (x - s.W / 2) * depth), -(0.5 + (y - 0.5) * depth));
  draw();
  c.restore();
}

/** A range of tall, round-shouldered peaks in ink wash: dark at the summits, melting into mist at their feet. */
function range(s: Stage, foot: number, list: [number, number, number][], tone: number, seed: number) {
  const c = s.c;
  const top = foot - Math.max(...list.map((p) => p[1]));
  const g = c.createLinearGradient(0, top, 0, foot);
  g.addColorStop(0, toneA(s, tone, 1));
  g.addColorStop(0.55, toneA(s, tone + (1 - tone) * 0.25, 0.9));
  g.addColorStop(1, toneA(s, tone + (1 - tone) * 0.6, 0));
  c.fillStyle = g;
  c.beginPath(); c.moveTo(-1.2, foot + 0.01);
  for (let i = 0; i <= 220; i++) {
    const x = -1.2 + (3.8 * i) / 220;
    let y = 0;
    for (const [px, h, w] of list) { const u = Math.abs(x - px) / w; if (u < 1) y = Math.max(y, h * Math.pow(1 - Math.pow(u, 2.4), 0.85)); }
    if (y > 0) y += 0.004 * noise(x * 37 + seed * 5);
    c.lineTo(x, foot - y);
  }
  c.lineTo(2.6, foot + 0.01); c.closePath(); c.fill();
  // a few dry strokes down the flanks, as the brush leaves them
  c.strokeStyle = toneA(s, tone - 0.1, 0.35); c.lineWidth = 0.003;
  for (const [px, h, w] of list) for (let j = 0; j < 3; j++) {
    const sx = px + (j - 1) * w * 0.32, len = h * (0.35 + 0.2 * hash(j, seed + px * 10));
    c.beginPath(); c.moveTo(sx, foot - h * (0.92 - Math.abs(j - 1) * 0.12)); c.quadraticCurveTo(sx + (j - 1) * w * 0.12, foot - h * 0.7, sx + (j - 1) * w * 0.2, foot - h * 0.85 + len); c.stroke();
  }
}

/** A drift of mist across the valley at height y. */
function mist(s: Stage, y: number, h: number, k: number, seed: number) {
  if (k <= 0) return;
  const c = s.c;
  const col = mixRGB(s.screen, [255, 255, 255], s.dark ? 0.12 : 0.45);
  const g = c.createLinearGradient(0, y - h, 0, y + h);
  g.addColorStop(0, css(col, 0)); g.addColorStop(0.5, css(col, 0.7 * k)); g.addColorStop(1, css(col, 0));
  c.fillStyle = g; c.fillRect(-1.2, y - h, 3.8, h * 2);
  const drift = s.still ? 0 : s.clock * 0.014;
  for (let i = 0; i < 5; i++) {
    const x = ((hash(i, seed) * 3.4 + drift * (0.6 + hash(i, seed + 1))) % 3.4) - 1;
    const r = h * (1.4 + hash(i, seed + 2) * 1.4);
    c.save(); c.translate(x, y + (hash(i, seed + 3) - 0.5) * h); c.scale(3.2, 1);
    const gg = c.createRadialGradient(0, 0, 0, 0, 0, r);
    gg.addColorStop(0, css(col, 0.5 * k)); gg.addColorStop(1, css(col, 0));
    c.fillStyle = gg; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill();
    c.restore();
  }
}

/** A little pavilion with upswept eaves, high on a crag. */
function pavilion(c: C, x: number, y: number, s: number) {
  c.fillRect(x - s * 0.32, y - s * 0.5, s * 0.06, s * 0.5);
  c.fillRect(x + s * 0.26, y - s * 0.5, s * 0.06, s * 0.5);
  c.fillRect(x - s * 0.42, y - s * 0.07, s * 0.84, s * 0.07);
  c.beginPath();
  c.moveTo(x - s * 0.66, y - s * 0.66);
  c.quadraticCurveTo(x - s * 0.42, y - s * 0.5, x - s * 0.3, y - s * 0.62);
  c.lineTo(x, y - s * 0.96);
  c.lineTo(x + s * 0.3, y - s * 0.62);
  c.quadraticCurveTo(x + s * 0.42, y - s * 0.5, x + s * 0.66, y - s * 0.66);
  c.lineTo(x + s * 0.5, y - s * 0.5); c.lineTo(x - s * 0.5, y - s * 0.5);
  c.closePath(); c.fill();
  c.beginPath(); c.arc(x, y - s * 1.0, s * 0.05, 0, TAU); c.fill();
}

/** The bridge's outline: the hump of the deck, the abutments and one round arch. */
function bridgePath(c: C) {
  c.beginPath();
  c.moveTo(CX - SPAN - 0.05, BANK + 0.03);
  for (let i = 0; i <= 48; i++) { const x = CX - SPAN + (2 * SPAN * i) / 48; c.lineTo(x, ground(x)); }
  c.lineTo(CX + SPAN + 0.05, BANK + 0.03);
  c.lineTo(CX + SPAN + 0.02, WATER + 0.05);
  c.lineTo(CX + ARCH, WATER + 0.05);
  c.arc(CX, WATER, ARCH, 0, Math.PI, true);
  c.lineTo(CX - ARCH, WATER + 0.05);
  c.lineTo(CX - SPAN - 0.02, WATER + 0.05);
  c.closePath();
}

/** The stone arch: courses of stone, the ring of voussoirs, and the balustrade along the deck. */
function bridge(s: Stage, tone: number, gold = 0) {
  const c = s.c;
  c.fillStyle = s.tone(tone);
  bridgePath(c); c.fill();
  c.save(); bridgePath(c); c.clip();
  // the courses, incised
  c.strokeStyle = s.tone(Math.min(1, tone + 0.18)); c.lineWidth = 0.0022;
  for (let i = 1; i < 7; i++) { const y = CROWN + 0.03 + i * 0.03; c.beginPath(); c.moveTo(CX - SPAN, y); c.lineTo(CX + SPAN, y); c.stroke(); }
  for (let i = 0; i < 26; i++) { const x = CX - SPAN + (i + 0.5) * (2 * SPAN / 26), row = Math.floor(hash(i, 2) * 6) + 1, y = CROWN + 0.03 + row * 0.03; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + 0.03); c.stroke(); }
  c.restore();
  // the ring of voussoirs round the arch, and its keystone
  c.fillStyle = s.tone(Math.max(0, tone - 0.08));
  c.beginPath(); c.arc(CX, WATER, ARCH + 0.034, Math.PI, 0); c.arc(CX, WATER, ARCH, 0, Math.PI, true); c.closePath(); c.fill();
  c.strokeStyle = s.tone(Math.min(1, tone + 0.2)); c.lineWidth = 0.0025;
  for (let i = 1; i < 15; i++) { const a = Math.PI + (i / 15) * Math.PI; c.beginPath(); c.moveTo(CX + Math.cos(a) * ARCH, WATER + Math.sin(a) * ARCH); c.lineTo(CX + Math.cos(a) * (ARCH + 0.034), WATER + Math.sin(a) * (ARCH + 0.034)); c.stroke(); }
  if (gold > 0) {
    c.strokeStyle = css(GOLD, 0.8 * gold); c.lineWidth = 0.004;
    c.beginPath(); c.arc(CX, WATER, ARCH + 0.034, Math.PI, 0); c.stroke();
  }
  // the balustrade: two rails on posts with lotus-bud finials
  const x0 = CX - SPAN + 0.05, x1 = CX + SPAN - 0.05;
  c.fillStyle = s.tone(Math.max(0, tone - 0.06)); c.strokeStyle = s.tone(Math.max(0, tone - 0.06));
  for (const [hgt, w] of [[RAIL, 0.009], [RAIL * 0.45, 0.005]] as [number, number][]) {
    c.lineWidth = w; c.beginPath();
    for (let i = 0; i <= 40; i++) { const x = lerp(x0, x1, i / 40); if (i) c.lineTo(x, ground(x) - hgt); else c.moveTo(x, ground(x) - hgt); }
    c.stroke();
  }
  const n = 12;
  for (let i = 0; i <= n; i++) {
    const x = lerp(x0, x1, i / n), y = ground(x);
    c.fillRect(x - 0.006, y - RAIL - 0.004, 0.012, RAIL + 0.004);
    c.beginPath(); c.ellipse(x, y - RAIL - 0.012, 0.008, 0.011, 0, 0, TAU); c.fill();
    c.beginPath(); c.moveTo(x, y - RAIL - 0.03); c.lineTo(x + 0.005, y - RAIL - 0.016); c.lineTo(x - 0.005, y - RAIL - 0.016); c.closePath(); c.fill();
  }
}

/** The banks, dark against the water, coming towards us on either side of the river. */
function banks(s: Stage, tone: number) {
  const c = s.c;
  c.fillStyle = s.tone(tone);
  const L = CX - SPAN, Rr = CX + SPAN;
  c.beginPath(); c.moveTo(-1.2, BANK); c.lineTo(L + 0.03, BANK); c.quadraticCurveTo(L + 0.08, BANK + 0.02, L + 0.07, WATER + 0.006); c.quadraticCurveTo(L - 0.06, 0.9, L - 0.32, 1.3); c.lineTo(-1.2, 1.3); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(2.6, BANK); c.lineTo(Rr - 0.03, BANK); c.quadraticCurveTo(Rr - 0.08, BANK + 0.02, Rr - 0.07, WATER + 0.006); c.quadraticCurveTo(Rr + 0.06, 0.9, Rr + 0.32, 1.3); c.lineTo(2.6, 1.3); c.closePath(); c.fill();
}

/** Reeds at the water's edge, nodding. */
function reeds(s: Stage, x: number, y: number, n: number, h: number, seed: number) {
  const c = s.c;
  c.lineWidth = 0.003;
  for (let i = 0; i < n; i++) {
    const bx = x + (hash(i, seed) - 0.5) * 0.09, hh = h * (0.55 + 0.45 * hash(i, seed + 1));
    const sw = s.still ? 0 : Math.sin(s.clock * 1.4 + i * 1.3) * 0.012;
    const tx = bx + sw + (hash(i, seed + 2) - 0.5) * 0.03, ty = y - hh;
    c.beginPath(); c.moveTo(bx, y); c.quadraticCurveTo(bx + sw * 0.4, y - hh * 0.6, tx, ty); c.stroke();
    if (i % 3 === 0) { c.beginPath(); c.ellipse(tx, ty + 0.012, 0.004, 0.014, sw * 3, 0, TAU); c.fill(); }
  }
}

interface Look {
  cam: Cam;
  mood: Mood; to?: Mood; k?: number;
  /** the sun (or where it is behind the cloud) */
  sun: P; sunK?: number; sunR?: number; sunCol?: RGB;
  /** mist in the valley, 0..1 */
  mist?: number;
  /** gold on the water and the stone, 0..1 */
  gold?: number;
  /** the reflection, drawn upside down in the river (the bridge is always there) */
  mirror?: () => void;
}

/** The whole set, back to front: sky, peaks, banks, river and bridge. The players go on top. */
function world(s: Stage, L: Look) {
  const { c, clock } = s;
  s.cam(L.cam[0], L.cam[1], L.cam[2]);
  s.backdrop({ mood: L.mood, to: L.to, k: L.k, x: L.sun[0], y: L.sun[1], r: 1.9 });
  const fog = L.mist ?? 0.6, gold = L.gold ?? 0;
  // the sun: a vermilion disc, as in a painting
  far(s, L.cam, 0.1, () => {
    const k = L.sunK ?? 1, col = L.sunCol ?? VERMILION, r = L.sunR ?? 0.045;
    if (k <= 0) return;
    glow(c, L.sun[0], L.sun[1], r * 6, mixRGB(col, [255, 232, 190], 0.55), 0.5 * k);
    c.fillStyle = css(col, 0.88 * k); c.beginPath(); c.arc(L.sun[0], L.sun[1], r, 0, TAU); c.fill();
  });
  // far peaks
  far(s, L.cam, 0.22, () => {
    range(s, 0.64, [[-0.3, 0.36, 0.16], [0.02, 0.46, 0.12], [0.26, 0.3, 0.12], [1.04, 0.36, 0.13], [1.3, 0.5, 0.12], [1.56, 0.34, 0.14], [1.9, 0.44, 0.14]], 0.76, 1);
    mist(s, 0.6, 0.07, 0.4 + 0.5 * fog, 1);
    // two cranes crossing far off
    c.fillStyle = s.tone(0.55);
    for (let i = 0; i < 2; i++) {
      const x = 1.9 - ((clock * 0.035 + i * 0.07) % 2.6), y = 0.2 + i * 0.03 + Math.sin(clock * 0.7 + i) * 0.01;
      bird(c, x, y, 0.035, s.still ? 0.3 : clock * 1.3 + i * 0.4, -1);
    }
  });
  // nearer peaks, a pavilion on a crag
  far(s, L.cam, 0.45, () => {
    range(s, 0.71, [[-0.42, 0.3, 0.12], [-0.12, 0.4, 0.1], [0.12, 0.3, 0.09], [1.42, 0.38, 0.1], [1.68, 0.28, 0.12]], 0.6, 2);
    c.fillStyle = s.tone(0.58); pavilion(c, -0.12, 0.315, 0.05);
    mist(s, 0.69, 0.05, 0.4 + 0.5 * fog, 2);
  });
  // low wooded hills across the river
  far(s, L.cam, 0.72, () => {
    c.fillStyle = s.tone(0.48);
    c.beginPath(); c.moveTo(-1.2, BANK);
    for (let i = 0; i <= 80; i++) { const x = -1.2 + 3.8 * i / 80; c.lineTo(x, BANK - 0.035 - 0.03 * (0.5 + 0.5 * noise(x * 4 + 3)) - 0.01 * noise(x * 19)); }
    c.lineTo(2.6, BANK); c.closePath(); c.fill();
    mist(s, BANK - 0.01, 0.025, fog, 3);
  });
  // the river: a wash a little darker than the sky, deepening towards us
  const shallow = mixRGB(mixRGB(s.screen, [150, 172, 178], 0.24), GOLD, gold * 0.3);
  const deep = mixRGB(mixRGB(s.screen, [64, 86, 96], 0.42), [160, 104, 52], gold * 0.25);
  const g = c.createLinearGradient(0, WATER, 0, 1.15);
  g.addColorStop(0, css(shallow)); g.addColorStop(1, css(deep));
  c.fillStyle = g; c.fillRect(-1.2, WATER, 3.8, 0.6);
  // its mirror: the arch and its image make a full moon
  c.save(); c.beginPath(); c.rect(-1.2, WATER, 3.8, 0.6); c.clip();
  c.translate(0, WATER * 2); c.scale(1, -1);
  c.fillStyle = toneA(s, 0.45, 0.32); bridgePath(c); c.fill();
  L.mirror?.();
  c.restore();
  // light lying on the water in broken lines
  c.strokeStyle = css(mixRGB(mixRGB(s.screen, [255, 255, 255], 0.5), GOLD, gold * 0.6), 0.7); c.lineWidth = 0.0025;
  for (let i = 0; i < 9; i++) {
    const y = WATER + 0.008 + i * i * 0.0028;
    c.beginPath();
    for (let x = -0.4; x <= 1.8; x += 0.012) {
      const v = Math.sin(x * (26 - i) + (s.still ? 0 : clock) * (1.1 + i * 0.13) + i * 1.7);
      if (v > 0.62) c.lineTo(x, y + v * 0.002); else c.moveTo(x, y);
    }
    c.stroke();
  }
  // the banks, willows and reeds
  banks(s, 0.24);
  c.fillStyle = s.tone(0.2); c.strokeStyle = s.tone(0.2);
  willow(c, 0.02, BANK + 0.005, 0.5, clock);
  willow(c, 1.4, BANK + 0.005, 0.44, clock + 2);
  c.fillStyle = s.tone(0.26); c.strokeStyle = s.tone(0.26);
  reeds(s, CX - SPAN + 0.02, WATER + 0.02, 9, 0.08, 1);
  reeds(s, CX + SPAN - 0.02, WATER + 0.02, 9, 0.08, 2);
  // the bridge
  bridge(s, 0.42, gold);
}

/** Reeds and grass close to us, at the bottom corners of the picture. */
function foreground(s: Stage) {
  const c = s.c;
  c.fillStyle = s.tone(0.12); c.strokeStyle = s.tone(0.12);
  reeds(s, -0.02, 1.02, 12, 0.16, 7);
  reeds(s, 1.44, 1.02, 12, 0.15, 8);
}

/* ================================================================ water life */
/** Minnows under the water, darting: quick dashes between resting places, inside a box. */
function minnows(s: Stage, n: number, box: [number, number, number, number], o: { alpha?: number; seed?: number; gold?: number } = {}) {
  const c = s.c, time = s.clock;
  const col = css(mixRGB(mixRGB(inkOf(s), s.screen, 0.3), GOLD, o.gold ?? 0), o.alpha ?? 0.75);
  for (let i = 0; i < n; i++) {
    const id = i + (o.seed ?? 0) * 31;
    const per = 1.2 + hash(id, 3) * 1.2;
    const ph = time / per + hash(id, 5);
    const m = Math.floor(ph), f = ph - m;
    const spot = (q: number): P => [lerp(box[0], box[2], hash(id * 13 + q, 1)), lerp(box[1], box[3], hash(id * 7 + q, 2))];
    const a = spot(m), b = spot(m + 1);
    const k = s.still ? 0.5 : easeOut(Math.min(1, f * 2.6));
    const x = lerp(a[0], b[0], k), y = lerp(a[1], b[1], k);
    const face: 1 | -1 = b[0] >= a[0] ? 1 : -1;
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const ang = Math.max(-0.5, Math.min(0.5, face > 0 ? Math.atan2(dy, dx) : Math.atan2(-dy, -dx))) * (1 - k * 0.6);
    c.save(); c.translate(x, y); c.rotate(ang);
    swimmer(c, 0, 0, 0.03 + hash(id, 9) * 0.014, time * (f < 0.38 ? 5 : 1.3) + id, face, col);
    c.restore();
  }
}

interface Leap { at: number; x: number; dx: number; h: number; size?: number; dur?: number }
/** Droplets thrown up where a fish breaks the surface. */
function splash(s: Stage, x: number, age: number, size: number, seed: number) {
  if (age <= 0 || age >= 1 || s.still) return;
  const c = s.c;
  c.fillStyle = toneA(s, 0.3, 0.85 * (1 - age));
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI / 2 + (hash(i, seed) - 0.5) * 2.2;
    const v = size * (1.3 + hash(i, seed + 1) * 1.6);
    const px = x + Math.cos(a) * v * age, py = WATER + Math.sin(a) * v * age + size * 3.2 * age * age;
    c.beginPath(); c.arc(px, py, size * 0.07 * (1 - age * 0.5), 0, TAU); c.fill();
  }
}
/** A minnow leaping out of the river and back: its arc, its splash and the rings it leaves. Returns where it is, if in the air. */
function leap(s: Stage, L: Leap, o: { gold?: number; trail?: number } = {}): P | null {
  const c = s.c;
  const dur = L.dur ?? 0.95, size = L.size ?? 0.055;
  const u = (s.t - L.at) / dur;
  const x1 = L.x + L.dx;
  ripple(c, L.x, WATER + 0.008, 0.09, u / 2.2, toneA(s, 0.25, 0.9), 0.22);
  ripple(c, x1, WATER + 0.008, 0.09, (u - 1) / 2.2, toneA(s, 0.25, 0.9), 0.22);
  splash(s, L.x, u / 0.4, size, L.at * 10);
  splash(s, x1, (u - 1) / 0.4, size, L.at * 10 + 3);
  if (u <= 0 || u >= 1) return null;
  const at = (v: number): P => [L.x + L.dx * v, WATER - L.h * 4 * v * (1 - v)];
  const [x, y] = at(u);
  const gold = o.gold ?? 0;
  if ((o.trail ?? 0) > 0) {
    const pts: P[] = [];
    for (let i = 0; i <= 16; i++) pts.push(at(Math.max(0, u - 0.5) + (Math.min(u, 0.5) * i) / 16));
    thread(c, pts, 1, GOLD, 0.006, { alpha: 0.7 * (o.trail ?? 0), bead: false, curve: 0 });
  }
  const face: 1 | -1 = L.dx >= 0 ? 1 : -1;
  const vx = L.dx, vy = -L.h * 4 * (1 - 2 * u);
  c.save(); c.translate(x, y); c.rotate(face > 0 ? Math.atan2(vy, vx) : Math.atan2(-vy, -vx));
  swimmer(c, 0, 0, size, s.clock * 3, face, gold > 0 ? css(mixRGB(inkOf(s), [214, 140, 40], gold)) : s.ink, s.tone(0.8));
  c.restore();
  if (gold > 0) glow(c, x, y, size * 1.6, GOLD, 0.6 * gold);
  // a glint of joy at the top of the leap
  const top = 1 - Math.abs(u - 0.5) * 4;
  if (top > 0) twinkle(c, x + size * 0.3, y - size * 0.5, size * 0.35 * top, css([255, 250, 230], top));
  return [x, y];
}

/* ================================================================ the two friends */
const ZH = 0.27, HH = 0.29;
/** Zhuangzi: hair in a topknot, a long beard, a loose robe, a fan — at his ease. */
function zhuang(s: Stage, b: Partial<Body> = {}): Joints {
  const x = b.x ?? ZX;
  s.c.fillStyle = s.ink;
  return person(s.c, { x, y: ground(x), h: ZH, face: 1, robe: 'long', beard: true, hat: 'topknot', hold: 'fan', cut: s.tone(0.8), t: s.clock, ...b });
}
/** Huizi the logician: upright, clean-shaven, a tall pinned cap, his scroll of arguments. */
function hui(s: Stage, b: Partial<Body> = {}): Joints {
  const x = b.x ?? HX;
  const body: Body = { x, y: ground(x), h: HH, face: 1, robe: 'long', hold2: 'scroll', cut: s.tone(0.8), t: s.clock, ...b };
  s.c.fillStyle = s.ink;
  const j = person(s.c, body);
  cap(s, j, body);
  return j;
}
/** Huizi's cap: a band over the crown, a tall crest leaning back, a pin through it and a strap under the chin. */
function cap(s: Stage, j: Joints, b: Body) {
  const c = s.c, u = b.h / 100, f = b.face ?? 1;
  c.save();
  c.translate(j.head[0], j.head[1]); c.scale(f * u, -u); c.rotate(-((b.lean ?? 0) + (b.tilt ?? 0)) * R);
  c.fillStyle = s.ink; c.strokeStyle = s.ink;
  c.beginPath(); c.moveTo(-7.9, 2.6); c.lineTo(7.0, 4.8); c.lineTo(6.6, 8.8); c.quadraticCurveTo(0, 11.8, -7.6, 8.4); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(-5.6, 9); c.lineTo(-10, 22); c.lineTo(-5.6, 23.4); c.lineTo(3.4, 10.4); c.closePath(); c.fill();
  c.lineWidth = 1.4; c.beginPath(); c.moveTo(-13, 14.4); c.lineTo(3.6, 17.2); c.stroke();
  c.lineWidth = 0.8; c.beginPath(); c.moveTo(4.6, 4.2); c.quadraticCurveTo(5.6, -3.6, 2.4, -9.4); c.stroke();
  if (b.cut) { c.strokeStyle = b.cut; c.lineWidth = 0.6; c.beginPath(); c.moveTo(-7.2, 4.4); c.lineTo(6.4, 6.4); c.stroke(); }
  c.restore();
}

/** A puppet turning round: squashed through its edge, its face swapping halfway. Its joints come back in world units. */
function turning(c: C, x: number, k: number, from: 1 | -1, draw: (face: 1 | -1) => Joints): Joints {
  const sq = Math.max(0.05, Math.abs(Math.cos(Math.PI * k)));
  const face: 1 | -1 = k < 0.5 ? from : (from > 0 ? -1 : 1);
  c.save(); c.translate(x, 0); c.scale(sq, 1); c.translate(-x, 0);
  const j = draw(face);
  c.restore();
  const m = (p: P): P => [x + (p[0] - x) * sq, p[1]];
  return { ...j, head: m(j.head), neck: m(j.neck), mouth: m(j.mouth), eye: m(j.eye), hand: m(j.hand), hand2: m(j.hand2), foot: m(j.foot), foot2: m(j.foot2), hip: m(j.hip), chest: m(j.chest), flames: j.flames.map(m), tip: j.tip ? m(j.tip) : null };
}

/** Lips moving while someone speaks (still in a reduced-motion still). */
const talk = (s: Stage, on: boolean, rate = 13) => (on && !s.still ? 0.35 + 0.35 * Math.sin(s.clock * rate) : 0);

/* ================================================================ pictures for the bubbles */
function headShape(c: C) {
  c.beginPath(); c.ellipse(-0.08, -0.06, 0.48, 0.54, 0, 0, TAU); c.fill();
  c.beginPath(); c.moveTo(0.34, -0.1); c.lineTo(0.64, 0.14); c.lineTo(0.36, 0.22); c.fill();
  c.beginPath(); c.moveTo(-0.3, 0.38); c.lineTo(0.12, 0.38); c.lineTo(0.1, 0.9); c.lineTo(-0.34, 0.9); c.fill();
  c.save(); c.fillStyle = 'rgba(255,252,246,1)'; c.beginPath(); c.ellipse(0.17, -0.1, 0.08, 0.05, 0, 0, TAU); c.fill(); c.restore();
}
/** Zhuangzi in a picture: the topknot and its pin, the long beard. */
const ZHUANG: Icon = (c) => {
  headShape(c);
  c.beginPath(); c.arc(-0.12, -0.7, 0.2, 0, TAU); c.fill();
  c.lineWidth = 0.08; c.beginPath(); c.moveTo(-0.44, -0.76); c.lineTo(0.22, -0.64); c.stroke();
  c.beginPath(); c.moveTo(0.06, 0.2); c.quadraticCurveTo(0.5, 0.28, 0.4, 0.62); c.lineTo(0.18, 1.0); c.quadraticCurveTo(0.0, 0.68, -0.2, 0.42); c.closePath(); c.fill();
};
/** Huizi in a picture: the tall cap leaning back, its pin, no beard. */
const HUI: Icon = (c) => {
  headShape(c);
  c.beginPath(); c.moveTo(-0.58, -0.26); c.lineTo(0.44, -0.36); c.lineTo(0.34, -0.56); c.lineTo(-0.26, -1.0); c.lineTo(-0.56, -0.96); c.lineTo(-0.6, -0.5); c.closePath(); c.fill();
  c.lineWidth = 0.07; c.beginPath(); c.moveTo(-0.85, -0.66); c.lineTo(0.2, -0.78); c.stroke();
};
/** The bridge: a hump over one round arch, and water under it. */
const BRIDGE: Icon = (c) => {
  c.beginPath(); c.moveTo(-0.95, 0.36); c.quadraticCurveTo(0, -0.8, 0.95, 0.36); c.lineTo(0.95, 0.52); c.lineTo(0.4, 0.52); c.arc(0, 0.52, 0.4, 0, Math.PI, true); c.lineTo(-0.95, 0.52); c.closePath(); c.fill();
  c.lineWidth = 0.08; c.beginPath(); c.moveTo(-0.9, 0.74); c.quadraticCurveTo(-0.6, 0.64, -0.3, 0.74); c.quadraticCurveTo(0, 0.84, 0.3, 0.74); c.quadraticCurveTo(0.6, 0.64, 0.9, 0.74); c.stroke();
};
/** Pictures in a row, each popping in as its moment comes. */
const row = (items: Icon[], ks: number[], gap: number): Icon => (c) => {
  items.forEach((ic, i) => {
    const k = ks[i] ?? 1;
    if (k <= 0) return;
    const p = pop(Math.min(1, k));
    c.save(); c.translate((i - (items.length - 1) / 2) * gap, 0); c.scale(p, p); ic(c); c.restore();
  });
};
interface Say { x: number; y: number; r: number; to?: P; k: number; items: Icon[]; ks?: number[]; kind?: 'speech' | 'thought'; shake?: number }
/** A bubble holding a little sentence of pictures. */
function say(s: Stage, o: Say) {
  const n = o.items.length, gap = 1.95, scale = 0.5;
  const wide = n > 1 ? ((n - 1) * gap / 2 + 1.55) * scale : 1.25;
  bubble(s.c, { x: o.x, y: o.y, r: o.r, wide, to: o.to, kind: o.kind, k: o.k, ink: s.ink, icon: row(o.items, o.ks ?? o.items.map(() => 1), gap), scale: n > 1 ? scale : 0.72, shake: s.still ? 0 : o.shake, time: s.clock });
}

/* ================================================================ glass between minds */
/** A pane of glass standing between minds: it rises (k), cracks (crack 0..1) and bursts into falling shards (burst 0..1). */
function pane(s: Stage, x: number, base: number, top: number, k: number, crack = 0, burst = 0, seed = 0, hit: P | null = null) {
  if (k <= 0 || burst >= 1) return;
  const c = s.c;
  const yTop = lerp(base, top, easeOut(Math.min(1, k)));
  const hw = 0.045, sk = 0.022; // half its width, and the slant that shows it stands at an angle to us
  const quad: P[] = [[x - hw, base + sk], [x + hw, base - sk], [x + hw, yTop - sk], [x - hw, yTop + sk]];
  if (burst > 0) { shards(s, quad, burst, seed); return; }
  c.save();
  path(c, quad);
  const g = c.createLinearGradient(x - hw, 0, x + hw, 0);
  g.addColorStop(0, 'rgba(236,246,252,0.62)'); g.addColorStop(0.45, 'rgba(196,224,240,0.32)'); g.addColorStop(1, 'rgba(160,198,222,0.5)');
  c.fillStyle = g; c.fill();
  c.clip();
  // glints sliding up the glass
  const sh = s.still ? 0.35 : (s.clock * 0.22 + seed * 0.37) % 1;
  c.strokeStyle = 'rgba(255,255,255,0.8)';
  for (const [off, w] of [[0, 0.008], [0.028, 0.004]] as [number, number][]) {
    const yy = lerp(base + 0.1, yTop - 0.1, sh) + off;
    c.lineWidth = w; c.beginPath(); c.moveTo(x - hw, yy + 0.05); c.lineTo(x + hw, yy - 0.04); c.stroke();
  }
  c.restore();
  // the edges: bright where the light catches them, dark where the glass is thick
  c.lineWidth = 0.003;
  c.strokeStyle = 'rgba(255,255,255,0.95)';
  c.beginPath(); c.moveTo(quad[0][0], quad[0][1]); c.lineTo(quad[3][0], quad[3][1]); c.lineTo(quad[2][0], quad[2][1]); c.stroke();
  c.strokeStyle = toneA(s, 0.15, 0.6);
  c.beginPath(); c.moveTo(quad[2][0], quad[2][1]); c.lineTo(quad[1][0], quad[1][1]); c.stroke();
  c.beginPath(); c.moveTo(quad[2][0] + 0.004, quad[2][1] + 0.002); c.lineTo(quad[1][0] + 0.004, quad[1][1]); c.stroke();
  // as it arrives, a flash along the top
  const flash = k < 1 ? 0 : 1 - Math.min(1, (k - 1) * 3);
  if (flash > 0) glow(c, x, yTop, 0.06, [235, 248, 255], flash);
  if (crack > 0) cracks(s, quad, hit ?? [x, lerp(base, yTop, 0.6)], crack, seed);
}
/** Cracks running out from where the glass was struck. */
function cracks(s: Stage, quad: P[], at: P, k: number, seed: number) {
  const c = s.c;
  c.save(); path(c, quad); c.clip();
  for (const [col, w] of [[toneA(s, 0.1, 0.7), 0.004], ['rgba(255,255,255,0.95)', 0.002]] as [string, number][]) {
    c.strokeStyle = col; c.lineWidth = w;
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * TAU + hash(i, seed) * 0.6;
      const len = 0.28 * k * (0.5 + hash(i, seed + 1) * 0.6);
      c.beginPath(); c.moveTo(at[0], at[1]);
      let px = at[0], py = at[1];
      for (let j = 1; j <= 4; j++) { const aa = a + (hash(i * 5 + j, seed + 2) - 0.5) * 0.7; px += Math.cos(aa) * len / 4; py += Math.sin(aa) * len / 4; c.lineTo(px, py); }
      c.stroke();
    }
  }
  c.restore();
}
/** The pane in pieces, tumbling down and catching the light. */
function shards(s: Stage, quad: P[], k: number, seed: number) {
  const c = s.c;
  const [a, b, , d] = quad; // bottom-left, bottom-right, top-left
  const at = (u: number, v: number): P => [a[0] + (b[0] - a[0]) * u + (d[0] - a[0]) * v, a[1] + (b[1] - a[1]) * u + (d[1] - a[1]) * v];
  const rows = 6;
  for (let r = 0; r < rows; r++) for (let q = 0; q < 2; q++) for (let tri = 0; tri < 2; tri++) {
    const id = r * 4 + q * 2 + tri;
    const u0 = q / 2, u1 = (q + 1) / 2, v0 = r / rows, v1 = (r + 1) / rows;
    const pts = tri ? [at(u0, v0), at(u1, v0), at(u1, v1)] : [at(u0, v0), at(u0, v1), at(u1, v1)];
    const cxx = (pts[0][0] + pts[1][0] + pts[2][0]) / 3, cyy = (pts[0][1] + pts[1][1] + pts[2][1]) / 3;
    const fall = k * k * (0.5 + hash(id, seed) * 0.5) * 0.7, drift = (hash(id, seed + 1) - 0.5) * 0.2 * k, spin = (hash(id, seed + 2) - 0.5) * 6 * k;
    c.save(); c.globalAlpha = 1 - k;
    c.translate(cxx + drift, cyy + fall); c.rotate(spin);
    path(c, pts.map((p) => [p[0] - cxx, p[1] - cyy] as P));
    c.fillStyle = 'rgba(220,238,250,0.6)'; c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.95)'; c.lineWidth = 0.002; c.stroke();
    c.restore();
    if (hash(id, seed + 3) > 0.6 && !s.still) twinkle(c, cxx + drift, cyy + fall, 0.012 * (1 - k), 'rgba(255,255,255,0.95)');
  }
}

/* ================================================================ poses */
/** Leaning on the rail and pointing the fan down at the water. */
const LEANING = (look: number, point: number): Partial<Body> => ({
  lean: 24 * look, tilt: 26 * look,
  arm: mixA([20, 30], [52, 0], point), arm2: mixA([-6, 10], [34, 30], look),
});

/* ================================================================ the scenes */

/** I. On the bridge: the friends stroll onto the bridge; minnows dart and leap; Zhuangzi leans on the rail and points — the fish are happy. */
const LEAPS1: Leap[] = [
  { at: 4.1, x: 0.98, dx: -0.12, h: 0.13 },
  { at: 6.0, x: 0.62, dx: 0.14, h: 0.12 },
  { at: 7.2, x: 1.1, dx: -0.13, h: 0.15 },
  { at: 8.4, x: 0.9, dx: 0.15, h: 0.19 },
  { at: 9.7, x: 1.14, dx: -0.12, h: 0.13 },
  { at: 10.8, x: 0.64, dx: 0.13, h: 0.12 },
];
const onTheBridge: SceneFn = (s) => {
  const { t, c, clock } = s;
  const k1 = ease(seg(t, 2, 6.4)), k2 = ease(seg(t, 6.4, 11.6));
  const cam: Cam = [lerp(lerp(0.62, 0.76, k1), 0.85, k2), lerp(lerp(0.5, 0.52, k1), 0.54, k2), lerp(lerp(1, 1.22, k1), 1.4, k2)];
  world(s, { cam, mood: 'dawn', sun: [1.14, 0.24], mist: 1 - 0.6 * seg(t, 0, 9) });
  minnows(s, 9, [CX - SPAN + 0.12, WATER + 0.03, CX + SPAN - 0.08, 0.97]);
  // Zhuangzi strolls in first, fanning himself; Huizi a step behind, stiff, his scroll under his arm
  const zk = seg(t, 0, 5), zx = lerp(-0.1, ZX, zk);
  const look = ease(seg(t, 5, 5.8)), point = ease(seg(t, 5.6, 6.3));
  const zWalk = zk < 1 ? walk((zx + 0.1) / (0.82 * ZH), 0.9) : {};
  const z = zhuang(s, {
    x: zx, ...zWalk,
    ...(zk < 1 ? { arm: [lerp(10, 128, 1), 96 + 14 * Math.sin(clock * 7)] as [number, number], lean: 4 } : LEANING(look, point)),
    eye: t > 6.6 ? 'closed' : 'open', mouth: talk(s, t > 6.6 && t < 8.6),
  });
  const hk = seg(t, 0, 5.6), hx = lerp(-0.32, HX, hk);
  const doubt = ease(seg(t, 8.6, 9.4));
  hui(s, { x: hx, ...(hk < 1 ? walk((hx + 0.32) / (0.82 * HH), 0.65) : gesture('rest', 'chin', doubt)), arm2: hk < 1 ? [8, 70] : mixA([8, 70], [14, 76], doubt), lean: -2, tilt: hk < 1 ? 0 : 12 * look - 4 * doubt });
  LEAPS1.forEach((L) => leap(s, L));
  foreground(s);
  // what he says: see the minnows — that is the pleasure of fishes
  say(s, { x: z.head[0] + 0.14, y: z.head[1] - 0.1, r: 0.065, to: z.mouth, k: shown(t, 6.5, 11.8), items: [HAPPY_FISH] });
  s.spill(1.14, 0.24, 0.35, [250, 200, 170]);
};

/** II. Hui Tzu: he turns on his friend — you (pointing at him) are not a fish (pointing at the water): how can you know? */
const huiziAsks: SceneFn = (s) => {
  const { t, c, clock } = s;
  const drift = ease(seg(t, 0, 9));
  const cam: Cam = [lerp(0.72, 0.67, drift), 0.41, lerp(1.7, 1.86, drift)];
  world(s, { cam, mood: 'day', sun: [1.18, 0.2], sunK: 0.7, mist: 0.3 });
  minnows(s, 7, [CX - SPAN + 0.12, WATER + 0.03, CX + SPAN - 0.08, 0.97]);
  const z = zhuang(s, { ...LEANING(1, 1), eye: 'closed', tilt: 26 - 14 * ease(seg(t, 6.4, 7.2)) });
  void z;
  const p1 = ease(seg(t, 0.8, 1.4)), p2 = ease(seg(t, 3.0, 3.6)), p3 = ease(seg(t, 4.7, 5.3));
  const g = p3 > 0 ? gesture('pointDown', 'shrug', p3) : p2 > 0 ? gesture('point', 'pointDown', p2) : gesture('chin', 'point', p1);
  const h = hui(s, { x: HX + 0.02 * p1, ...g, arm2: p3 > 0 ? g.arm2 : [14, 76], lean: -2 + 6 * p1 - 4 * p3, tilt: 6 * p2 * (1 - p3) - 6 * p3, mouth: talk(s, t > 1.1 && t < 5.8) });
  leap(s, { at: 3.5, x: 0.9, dx: 0.12, h: 0.22 });
  leap(s, { at: 6.6, x: 1.02, dx: -0.12, h: 0.2 });
  // you ≠ fish … ?
  const k = shown(t, 1.1, 99);
  say(s, { x: 0.63, y: 0.215, r: 0.052, to: h.mouth, k, items: [ZHUANG, NEQ, FISH, Q], ks: [seg(t, 1.1, 1.5), seg(t, 2.6, 3.0), seg(t, 3.3, 3.7), seg(t, 4.8, 5.2)], shake: seg(t, 4.8, 5.2) * (1 - seg(t, 5.6, 6.4)) });
  void c; void clock;
};

/** III. Chuang Tzu: he turns round smiling, flips the question over with his fan and hands it back — you are not I. */
const zhuangziAnswers: SceneFn = (s) => {
  const { t, c, clock } = s;
  const drift = ease(seg(t, 0, 8));
  const cam: Cam = [lerp(0.72, 0.74, drift), 0.335, lerp(2.3, 2.45, drift)];
  const burst = ease(seg(t, 0.8, 2.6));
  world(s, { cam, mood: 'day', to: 'gold', k: 0.45 * burst, sun: [0.98, 0.2], sunK: 0.7 + 0.3 * burst, sunR: 0.04, mist: 0.2 });
  // the sun comes out behind him: rays
  if (burst > 0) {
    c.save(); c.translate(0.98, 0.2); c.rotate((s.still ? 0 : clock) * 0.05);
    c.fillStyle = css([255, 226, 160], 0.2 * burst);
    for (let i = 0; i < 14; i++) { const a = (i / 14) * TAU, len = 0.5; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a - 0.05) * len, Math.sin(a - 0.05) * len); c.lineTo(Math.cos(a + 0.05) * len, Math.sin(a + 0.05) * len); c.closePath(); c.fill(); }
    c.restore();
  }
  const turn = ease(seg(t, 0.3, 1.2));
  const tap = ease(seg(t, 1.5, 2.0)) * (1 - ease(seg(t, 2.6, 3.0)));
  const atHui = ease(seg(t, 3.0, 3.4)) * (1 - ease(seg(t, 3.9, 4.2)));
  const atSelf = ease(seg(t, 4.0, 4.4)) * (1 - ease(seg(t, 4.9, 5.2)));
  const z = turning(c, ZX, turn, 1, (face) => zhuang(s, {
    face,
    ...(turn < 1 ? LEANING(1 - turn, 1 - turn) : {}),
    ...(turn >= 1 ? { arm: tap > 0 ? mixA([20, 30], [150, 10], tap) : atHui > 0 ? mixA([20, 30], [92, -4], atHui) : atSelf > 0 ? mixA([20, 30], [40, 130], atSelf) : [24, 90 + 16 * Math.sin(clock * 6)] as [number, number], arm2: [-6, 12] as [number, number] } : {}),
    eye: 'closed', mouth: talk(s, t > 2.8 && t < 5.4), tilt: turn >= 1 ? -6 : 0,
  }));
  const startle = ease(seg(t, 3.6, 4.2)) * (1 - ease(seg(t, 6.2, 7.2)));
  const h = hui(s, { ...gesture('shrug', 'chin', ease(seg(t, 5.8, 6.6))), arm2: [14, 76], lean: -2 - 10 * startle, eye: startle > 0.3 ? 'wide' : 'open' });
  // the question, flipped like a card: on its back, you ≠ me … ?
  const flip = seg(t, 2.0, 2.8);
  const sq = Math.max(0.04, Math.abs(Math.cos(Math.PI * flip)));
  const bx = 0.66, by = 0.205;
  c.save(); c.translate(bx, 0); c.scale(sq, 1); c.translate(-bx, 0);
  if (flip < 0.5) say(s, { x: bx, y: by, r: 0.05, to: [bx + (h.mouth[0] - bx) / sq, h.mouth[1]], k: 1, items: [ZHUANG, NEQ, FISH, Q] });
  else say(s, { x: bx, y: by, r: 0.05, to: [bx + (z.mouth[0] - bx) / sq, z.mouth[1]], k: 1, items: [HUI, NEQ, ZHUANG, Q], ks: [1 + atHui * 0.3, 1, 1 + atSelf * 0.3, seg(t, 5.0, 5.4) > 0 ? 1 : 0.999] });
  c.restore();
  if (startle > 0.2) say(s, { x: h.head[0] - 0.06, y: h.head[1] - 0.08, r: 0.026, kind: 'thought', to: h.head, k: shown(t, 3.8, 6.4), items: [BANG] });
  s.spill(0.98, 0.2, 0.4 * burst, [255, 214, 150]);
};

/** IV. Hui Tzu: he presses on — a wall of glass rises between his mind and Zhuangzi's, then another between Zhuangzi and the fish. Satisfied, he folds his arms. */
const huiziPresses: SceneFn = (s) => {
  const { t, c, clock } = s;
  const back = ease(seg(t, 0.5, 9));
  const cam: Cam = [lerp(0.78, 0.76, back), lerp(0.48, 0.52, back), lerp(1.34, 1.12, back)];
  const cold = ease(seg(t, 0.4, 4.5));
  world(s, { cam, mood: 'day', to: 'sea', k: 0.9 * cold, sun: [1.18, 0.22], sunK: 1 - 0.75 * cold, mist: 0.4 + 0.6 * cold });
  minnows(s, 8, [PANE2 + 0.04, WATER + 0.03, CX + SPAN + 0.1, 0.97], { seed: 2 });
  const rise1 = seg(t, 1.3, 3.0), rise2 = seg(t, 4.0, 5.8);
  // Zhuangzi: faces his friend, watches the glass come up; then turns to look for the fish
  const turnBack = ease(seg(t, 4.0, 4.8));
  const z = turning(c, ZX, turnBack, -1, (face) => zhuang(s, { face, arm: [20, 40], arm2: [-6, 12], tilt: turnBack < 0.5 ? 4 : 16, eye: 'open' }));
  void z;
  // Huizi: one finger up — the first wall; a hand towards the water — the second; then arms folded
  const one = ease(seg(t, 0.8, 1.3)), two = ease(seg(t, 3.4, 4.0)), done = ease(seg(t, 6.6, 7.3));
  const g = done > 0 ? gesture('offer', 'cross', done) : two > 0 ? gesture('pointUp', 'offer', two) : gesture('chin', 'pointUp', one);
  const h = hui(s, { ...g, arm2: done > 0 ? g.arm2 : [14, 76], lean: -2 - 4 * done, tilt: -10 * done, mouth: talk(s, t > 0.8 && t < 6.2) });
  // the fish leap, and one bumps its nose on the glass
  leap(s, { at: 1.4, x: 1.08, dx: 0.12, h: 0.16 });
  const bonk = { at: 5.9, x: 1.12, dx: -0.16, h: 0.2, dur: 0.95 };
  const bk = (t - bonk.at) / bonk.dur;
  if (bk < 0.42) leap(s, bonk);
  else {
    // it hits the glass and drops straight back
    const fallK = seg(bk, 0.42, 1.0);
    const hitX = PANE2 + 0.05, hitY = WATER - bonk.h * 4 * 0.42 * 0.58;
    if (fallK < 1) {
      c.save(); c.translate(hitX + 0.01 * fallK, lerp(hitY, WATER + 0.02, fallK * fallK)); c.rotate(-1.2 * fallK);
      c.fillStyle = s.ink; swimmer(c, 0, 0, 0.055, clock * 6, -1, s.ink, s.tone(0.8)); c.restore();
      const star = 1 - seg(bk, 0.42, 0.75);
      if (star > 0) { c.save(); c.translate(hitX - 0.01, hitY - 0.01); c.scale(0.03 * star, 0.03 * star); c.fillStyle = 'rgba(255,255,255,0.95)'; twinkle(c, 0, 0, 1, 'rgba(255,255,255,0.95)'); c.restore(); }
    }
    ripple(c, hitX + 0.01, WATER + 0.008, 0.09, (bk - 1) / 2, toneA(s, 0.25, 0.9), 0.22);
  }
  leap(s, { at: 8.2, x: 1.06, dx: 0.12, h: 0.15 });
  // the walls: between the two men, and between the man and the fish
  pane(s, PANE1, ground(PANE1), 0.17, rise1, 0, 0, 1);
  pane(s, PANE2, 1.0, 0.25, rise2, 0, 0, 2);
  if (rise2 > 0 && rise2 < 1 && !s.still) { emit(s, PANE2, rise2); }
  foreground(s);
  // he is pleased with himself
  say(s, { x: h.head[0] - 0.12, y: h.head[1] - 0.1, r: 0.05, to: h.mouth, k: shown(t, 7.1, 9.9), items: [CHECK] });
};
/** Water thrown up where the second wall comes out of the river. */
function emit(s: Stage, x: number, k: number) {
  splash(s, x - 0.03, k, 0.07, 11);
  splash(s, x + 0.03, k, 0.07, 12);
}

/** V. From the bridge: Zhuangzi laughs the walls down; he knew it here, on the bridge; a thread of gold runs from him through the bridge to the leaping fish. */
const LEAPS5: Leap[] = [
  { at: 6.4, x: 0.96, dx: 0.14, h: 0.2 },
  { at: 7.6, x: 1.12, dx: -0.13, h: 0.17 },
  { at: 8.6, x: 0.62, dx: 0.15, h: 0.15 },
  { at: 9.5, x: 0.94, dx: 0.16, h: 0.22 },
  { at: 10.6, x: 1.14, dx: -0.14, h: 0.18 },
  { at: 11.2, x: 0.66, dx: 0.12, h: 0.13 },
];
const fromTheBridge: SceneFn = (s) => {
  const { t, c, clock } = s;
  const out = ease(seg(t, 0.2, 3.6)), wide = ease(seg(t, 6.4, 11));
  const cam: Cam = [lerp(lerp(0.79, 0.77, out), 0.7, wide), lerp(lerp(0.36, 0.48, out), 0.5, wide), lerp(lerp(2.4, 1.34, out), 1.0, wide)];
  const warm = ease(seg(t, 2.5, 8));
  world(s, { cam, mood: 'sea', to: warm < 0.5 ? 'dusk' : 'gold', k: warm, sun: [1.08, lerp(0.3, 0.4, warm)], sunK: warm, sunR: 0.06, sunCol: mixRGB(VERMILION, [236, 150, 60], warm), mist: 1 - warm * 0.7, gold: ease(seg(t, 6, 9)) });
  minnows(s, 9, [CX - SPAN + 0.12, WATER + 0.03, CX + SPAN - 0.08, 0.97], { gold: ease(seg(t, 7, 9)) * 0.6 });
  // he laughs: head back, shoulders shaking
  const laugh = 1 - ease(seg(t, 3.4, 4.2));
  const shake = s.still ? 0 : Math.sin(clock * 30) * 0.004 * laugh;
  const sweep = ease(seg(t, 4.4, 5.4));
  const turnK = ease(seg(t, 4.0, 4.6));
  const z = turning(c, ZX + shake, turnK, -1, (face) => zhuang(s, {
    x: ZX + shake, face,
    ...(turnK < 0.5 ? { arm: [26, 120] as [number, number], arm2: [20, 100] as [number, number], tilt: -24 * laugh, lean: -8 * laugh } : { arm: mixA([150, 10], [56, 0], sweep), arm2: [-6, 12] as [number, number], lean: 10 * sweep, tilt: 18 * sweep }),
    eye: 'closed', mouth: laugh > 0.1 && !s.still ? 0.5 + 0.5 * Math.abs(Math.sin(clock * 9)) : talk(s, t > 4.8 && t < 6.6),
  }));
  // Huizi: arms folded … and then he comes to the rail beside his friend
  const come = seg(t, 7.2, 9.0), lean = ease(seg(t, 9.0, 9.8));
  const hx = lerp(HX, 0.67, ease(come));
  const h = hui(s, { x: hx, ...(come > 0 && come < 1 ? walk((hx - HX) / (0.82 * HH), 0.6) : come >= 1 ? { arm: [36, 30] as [number, number], arm2: [30, 30] as [number, number] } : gesture('cross')), lean: lerp(-4, 18, lean), tilt: lerp(-6, 20, lean) });
  void h;
  // his laughter rolls out and the glass cracks, then bursts
  const crackK = ease(seg(t, 1.2, 3.2)), burst = seg(t, 3.4, 5.0);
  if (laugh > 0.1) { sound(c, z.mouth[0] - 0.01, z.mouth[1], 0.05, clock, Math.PI, laugh, toneA(s, 0.2, 0.6), 0.9); sound(c, z.mouth[0] + 0.01, z.mouth[1] - 0.01, 0.05, clock + 0.3, 0, laugh, toneA(s, 0.2, 0.6), 0.9); }
  pane(s, PANE1, ground(PANE1), 0.17, 1, crackK, burst, 1, [PANE1 + 0.01, 0.34]);
  pane(s, PANE2, 1.0, 0.25, 1, crackK, burst, 2, [PANE2 - 0.01, 0.42]);
  // the golden thread: from his heart, down through his feet into the bridge, down to the water, to a leaping fish
  const gk = ease(seg(t, 5.6, 7.6));
  let fishAt: P | null = null;
  LEAPS5.forEach((L, i) => { const p = leap(s, L, { gold: ease(seg(t, 6.4, 7.4)), trail: 1 }); if (i === 0 && p) fishAt = p; });
  if (gk > 0) {
    const end: P = fishAt ?? [LEAPS5[0].x + LEAPS5[0].dx * 0.5, WATER - 0.05];
    const pts: P[] = [[z.chest[0], z.chest[1]], [ZX, ground(ZX) - 0.01], [ZX + 0.12, ground(ZX + 0.12)], [0.96, WATER - 0.02], end];
    thread(c, pts, gk, GOLD, 0.012, { alpha: 0.35, bead: false, curve: 0.05 });
    thread(c, pts, gk, GOLD, 0.005, { alpha: 1, bead: true, curve: 0.05 });
    glow(c, z.chest[0], z.chest[1], 0.05, GOLD, 0.7 * gk);
  }
  foreground(s);
  // how did I know? from here — on the bridge
  const swap = seg(t, 5.6, 6.0);
  say(s, { x: z.head[0] + 0.13, y: z.head[1] - 0.08, r: 0.05, to: z.mouth, k: shown(t, 4.8, 7.6), items: [HAPPY_FISH, swap < 0.5 ? Q : BRIDGE], ks: [1, swap < 0.5 ? 1 - swap * 2 + 0.001 : (swap - 0.5) * 2] });
  s.spill(1.08, 0.4, 0.6 * warm, [255, 190, 110]);
};

export const fish: StoryVisuals = {
  id: 'fish',
  aspect: 1.4,
  loop: false,
  scenes: [onTheBridge, huiziAsks, zhuangziAnswers, huiziPresses, fromTheBridge],
  stills: [8.8, 6.8, 5.6, 8.6, 10.6],
};
