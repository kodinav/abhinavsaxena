import { seg, ease, easeOut, lerp, noise, hash, css, mixRGB, pop, type RGB, type Mood, type Stage, type SceneFn, type StoryVisuals } from '../puppet/theatre';
import { person, walk, gesture, mixA, type Body, type Joints } from '../puppet/figure';
import { fish as swimmer, bird } from '../puppet/beasts';
import { glow, ripple, sound, twinkle } from '../puppet/fx';
import { bubble, HAPPY_FISH, NEQ, Q, FISH, CHECK, BANG, type Icon } from '../puppet/bubbles';
import { shown } from '../puppet/bubbles';
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
const LOTUS: RGB = [222, 132, 150];

/* ================================================================ the set */
const WATER = 0.75;  // the river's surface
const BANK = 0.71;   // the top of the banks
const CX = 0.7;      // the crown of the bridge
const SPAN = 0.54;   // half its length
const CROWN = 0.54;  // the deck at the crown
const ARCH = 0.16;   // the radius of the arch
const RAIL = 0.095;  // the height of the balustrade
const ZX = 0.8, HX = 0.6;        // where the two friends stand at the top
const PANE1 = 0.7, PANE2 = 0.96; // where Huizi's walls go up
const SUN_DEPTH = 0.1;            // how far off the sun hangs (parallax)

/** Where feet go at x: the banks, and the hump of the bridge between them. */
const ground = (x: number) => { const d = Math.min(1, Math.abs(x - CX) / SPAN); return CROWN + (BANK - CROWN) * d * d; };
const inkOf = (s: Stage): RGB => (s.dark ? [14, 13, 16] : [27, 26, 31]);
/** s.tone, with transparency */
const toneA = (s: Stage, k: number, a: number) => css(mixRGB(inkOf(s), s.screen, Math.max(0, Math.min(1, k))), a);
const path = (c: C, pts: P[]) => { c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); };
/** a camera move through keyframes [t, x, y, zoom], eased between each */
function track(t: number, keys: [number, number, number, number][]): Cam {
  let cam: Cam = [keys[0][1], keys[0][2], keys[0][3]];
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1], b = keys[i];
    if (t > a[0]) { const k = ease(seg(t, a[0], b[0])); cam = [lerp(a[1], b[1], k), lerp(a[2], b[2], k), lerp(a[3], b[3], k)]; }
  }
  return cam;
}

/** Where a point on a far layer shows on the stage (for light and rays drawn over it). */
function seen(s: Stage, cam: Cam, depth: number, p: P): P {
  const [x, y, z] = cam, k = (1 + (z - 1) * depth) / z;
  return [x + k * (p[0] - (s.W / 2 + (x - s.W / 2) * depth)), y + k * (p[1] - (0.5 + (y - 0.5) * depth))];
}
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

/** A fisherman far off, poling his sampan across the water. */
function boat(s: Stage, x: number, y: number) {
  const c = s.c, k = 0.05;
  c.beginPath(); c.moveTo(x - k * 0.55, y - k * 0.12); c.quadraticCurveTo(x, y + k * 0.14, x + k * 0.6, y - k * 0.16); c.lineTo(x + k * 0.45, y - k * 0.02); c.lineTo(x - k * 0.42, y - k * 0.02); c.closePath(); c.fill();
  c.beginPath(); c.ellipse(x - k * 0.05, y - k * 0.12, k * 0.18, k * 0.09, 0, Math.PI, 0); c.fill();
  c.fillRect(x + k * 0.22, y - k * 0.42, k * 0.07, k * 0.34);
  c.beginPath(); c.moveTo(x + k * 0.12, y - k * 0.42); c.lineTo(x + k * 0.39, y - k * 0.42); c.lineTo(x + k * 0.255, y - k * 0.52); c.closePath(); c.fill();
  const sw = s.still ? 0 : Math.sin(s.clock * 0.8) * k * 0.1;
  c.lineWidth = k * 0.04; c.strokeStyle = c.fillStyle; c.beginPath(); c.moveTo(x + k * 0.05 + sw, y - k * 0.75); c.lineTo(x + k * 0.5 - sw, y + k * 0.2); c.stroke();
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
function bridge(s: Stage, tone: number) {
  const c = s.c;
  // the stone catches light off the water low down
  const g = c.createLinearGradient(0, CROWN, 0, WATER);
  g.addColorStop(0, s.tone(tone)); g.addColorStop(1, s.tone(Math.min(1, tone + 0.14)));
  c.fillStyle = g;
  bridgePath(c); c.fill();
  c.save(); bridgePath(c); c.clip();
  c.strokeStyle = s.tone(Math.min(1, tone + 0.2)); c.lineWidth = 0.0022;
  for (let i = 1; i < 8; i++) { const y = CROWN + 0.02 + i * 0.026; c.beginPath(); c.moveTo(CX - SPAN, y); c.lineTo(CX + SPAN, y); c.stroke(); }
  for (let i = 0; i < 28; i++) { const x = CX - SPAN + (i + 0.5) * (2 * SPAN / 28), row = Math.floor(hash(i, 2) * 7) + 1, y = CROWN + 0.02 + row * 0.026; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + 0.026); c.stroke(); }
  c.restore();
  // the ring of voussoirs round the arch
  c.fillStyle = s.tone(Math.max(0, tone - 0.08));
  c.beginPath(); c.arc(CX, WATER, ARCH + 0.032, Math.PI, 0); c.arc(CX, WATER, ARCH, 0, Math.PI, true); c.closePath(); c.fill();
  c.strokeStyle = s.tone(Math.min(1, tone + 0.2)); c.lineWidth = 0.0025;
  for (let i = 1; i < 15; i++) { const a = Math.PI + (i / 15) * Math.PI; c.beginPath(); c.moveTo(CX + Math.cos(a) * ARCH, WATER + Math.sin(a) * ARCH); c.lineTo(CX + Math.cos(a) * (ARCH + 0.032), WATER + Math.sin(a) * (ARCH + 0.032)); c.stroke(); }
  // the balustrade: two rails on posts with lotus-bud finials
  const x0 = CX - SPAN + 0.05, x1 = CX + SPAN - 0.05, rt = Math.max(0, tone - 0.02);
  c.fillStyle = s.tone(rt); c.strokeStyle = s.tone(rt);
  for (const [hgt, w] of [[RAIL, 0.008], [RAIL * 0.45, 0.0045]] as [number, number][]) {
    c.lineWidth = w; c.beginPath();
    for (let i = 0; i <= 40; i++) { const x = lerp(x0, x1, i / 40); if (i) c.lineTo(x, ground(x) - hgt); else c.moveTo(x, ground(x) - hgt); }
    c.stroke();
  }
  const n = 12;
  for (let i = 0; i <= n; i++) {
    const x = lerp(x0, x1, i / n), y = ground(x);
    c.fillRect(x - 0.0055, y - RAIL - 0.004, 0.011, RAIL + 0.004);
    c.beginPath(); c.ellipse(x, y - RAIL - 0.012, 0.0075, 0.0105, 0, 0, TAU); c.fill();
    c.beginPath(); c.moveTo(x, y - RAIL - 0.029); c.lineTo(x + 0.005, y - RAIL - 0.016); c.lineTo(x - 0.005, y - RAIL - 0.016); c.closePath(); c.fill();
  }
}

/** The banks, dark against the water, coming towards us on either side of the river. */
function banks(s: Stage, tone: number) {
  const c = s.c;
  c.fillStyle = s.tone(tone);
  const L = CX - SPAN, Rr = CX + SPAN;
  c.beginPath(); c.moveTo(-1.2, BANK); c.lineTo(L + 0.03, BANK); c.quadraticCurveTo(L + 0.08, BANK + 0.02, L + 0.07, WATER + 0.006); c.quadraticCurveTo(L - 0.08, 0.86, L - 0.36, 1.3); c.lineTo(-1.2, 1.3); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(2.6, BANK); c.lineTo(Rr - 0.03, BANK); c.quadraticCurveTo(Rr - 0.08, BANK + 0.02, Rr - 0.07, WATER + 0.006); c.quadraticCurveTo(Rr + 0.08, 0.86, Rr + 0.36, 1.3); c.lineTo(2.6, 1.3); c.closePath(); c.fill();
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

/** Water weeds swaying up from the riverbed. */
function weeds(s: Stage, x: number, n: number, h: number, seed: number) {
  const c = s.c;
  c.lineWidth = 0.004;
  for (let i = 0; i < n; i++) {
    const bx = x + (hash(i, seed) - 0.5) * 0.12, hh = h * (0.5 + 0.5 * hash(i, seed + 1));
    const sw = s.still ? 0 : Math.sin(s.clock * 0.9 + i * 1.7) * 0.014;
    c.beginPath(); c.moveTo(bx, 1.02);
    for (let j = 1; j <= 6; j++) { const v = j / 6; c.lineTo(bx + Math.sin(v * 5 + i) * 0.006 + sw * v * v, 1.02 - hh * v); }
    c.stroke();
  }
}

/** Lotus leaves lying on the water, one flower among them. */
function lotus(s: Stage, x: number, n: number, seed: number, flower: boolean) {
  const c = s.c;
  c.fillStyle = css(mixRGB(mixRGB(inkOf(s), s.screen, 0.42), [70, 110, 80], 0.25));
  for (let i = 0; i < n; i++) {
    const px = x + (hash(i, seed) - 0.5) * 0.14, py = WATER + 0.012 + hash(i, seed + 1) * 0.06;
    const r = 0.018 + (py - WATER) * 0.35;
    const bob = s.still ? 0 : Math.sin(s.clock * 1.2 + i) * 0.0015;
    c.beginPath(); c.ellipse(px, py + bob, r, r * 0.3, 0, 0.2, TAU - 0.2); c.lineTo(px, py + bob); c.closePath(); c.fill();
  }
  if (flower) {
    const px = x + 0.01, py = WATER + 0.02;
    c.fillStyle = css(LOTUS, 0.95);
    for (let k = -2; k <= 2; k++) { c.save(); c.translate(px, py); c.rotate(k * 0.36); c.beginPath(); c.ellipse(0, -0.016, 0.006, 0.016, 0, 0, TAU); c.fill(); c.restore(); }
  }
}

interface Look {
  cam: Cam;
  mood: Mood; to?: Mood; k?: number;
  /** the sun (or where it glows behind the cloud) */
  sun: P; sunK?: number; sunR?: number; sunCol?: RGB;
  /** mist in the valley, 0..1 */
  mist?: number;
  /** gold on the water, 0..1 */
  gold?: number;
  /** anything in the sky behind the sun and the peaks (rays), drawn on the stage */
  sky?: () => void;
}

/** The whole set, back to front: sky, peaks, banks, river and bridge. The players go on top. */
function world(s: Stage, L: Look) {
  const { c, clock } = s;
  s.cam(L.cam[0], L.cam[1], L.cam[2]);
  const light = seen(s, L.cam, SUN_DEPTH, L.sun);
  s.backdrop({ mood: L.mood, to: L.to, k: L.k, x: light[0], y: light[1], r: 1.9 });
  const fog = L.mist ?? 0.6, gold = L.gold ?? 0;
  L.sky?.();
  // the sun: a vermilion disc, as in a painting
  far(s, L.cam, SUN_DEPTH, () => {
    const k = L.sunK ?? 1, col = L.sunCol ?? VERMILION, r = L.sunR ?? 0.045;
    if (k <= 0) return;
    glow(c, L.sun[0], L.sun[1], r * 6, mixRGB(col, [255, 232, 190], 0.55), 0.5 * k);
    c.fillStyle = css(col, 0.88 * k); c.beginPath(); c.arc(L.sun[0], L.sun[1], r, 0, TAU); c.fill();
  });
  // far peaks, two cranes crossing in front of them
  far(s, L.cam, 0.22, () => {
    range(s, 0.6, [[-0.3, 0.36, 0.16], [0.02, 0.44, 0.12], [0.26, 0.28, 0.12], [1.12, 0.34, 0.13], [1.36, 0.46, 0.12], [1.62, 0.32, 0.14], [1.95, 0.42, 0.14]], 0.76, 1);
    mist(s, 0.56, 0.07, 0.4 + 0.5 * fog, 1);
    c.fillStyle = s.tone(0.55);
    for (let i = 0; i < 2; i++) {
      const x = 1.45 - ((clock * 0.06 + i * 0.07) % 2.4), y = 0.17 + i * 0.03 + Math.sin(clock * 0.7 + i) * 0.01;
      bird(c, x, y, 0.035, s.still ? 0.3 : clock * 1.3 + i * 0.4, -1);
    }
  });
  // nearer peaks, a pavilion on a crag
  far(s, L.cam, 0.45, () => {
    range(s, 0.66, [[-0.42, 0.3, 0.12], [-0.12, 0.4, 0.1], [0.14, 0.28, 0.09], [1.46, 0.36, 0.1], [1.72, 0.28, 0.12]], 0.6, 2);
    c.fillStyle = s.tone(0.58); pavilion(c, -0.12, 0.27, 0.05);
    mist(s, 0.64, 0.05, 0.4 + 0.5 * fog, 2);
  });
  // low wooded hills across the river
  far(s, L.cam, 0.72, () => {
    c.fillStyle = s.tone(0.48);
    c.beginPath(); c.moveTo(-1.2, BANK);
    for (let i = 0; i <= 80; i++) { const x = -1.2 + 3.8 * i / 80; c.lineTo(x, BANK - 0.035 - 0.03 * (0.5 + 0.5 * noise(x * 4 + 3)) - 0.01 * noise(x * 19)); }
    c.lineTo(2.6, BANK); c.closePath(); c.fill();
    c.fillStyle = css(mixRGB(s.screen, [150, 172, 178], 0.18)); c.fillRect(-1.2, BANK, 3.8, 0.06);
    c.fillStyle = s.tone(0.4); boat(s, 0.5 + ((clock * 0.012) % 0.5), BANK + 0.022);
    mist(s, BANK - 0.01, 0.025, fog, 3);
  });
  // the river: a wash a little darker than the sky, deepening towards us
  const shallow = mixRGB(mixRGB(s.screen, [150, 172, 178], 0.24), GOLD, gold * 0.35);
  const deep = mixRGB(mixRGB(s.screen, [64, 86, 96], 0.42), [150, 96, 46], gold * 0.3);
  const g = c.createLinearGradient(0, WATER, 0, 1.1);
  g.addColorStop(0, css(shallow)); g.addColorStop(1, css(deep));
  c.fillStyle = g; c.fillRect(-1.2, WATER, 3.8, 0.6);
  c.strokeStyle = toneA(s, 0.42, 0.55); weeds(s, 0.36, 7, 0.16, 1); weeds(s, 1.06, 7, 0.14, 2);
  // its mirror: the arch and its image make a full moon
  c.save(); c.beginPath(); c.rect(-1.2, WATER, 3.8, 0.6); c.clip();
  c.translate(0, WATER * 2); c.scale(1, -1);
  c.fillStyle = toneA(s, 0.4, 0.42); bridgePath(c); c.fill();
  c.restore();
  // light lying on the water in broken lines
  c.strokeStyle = css(mixRGB(mixRGB(s.screen, [255, 255, 255], 0.5), GOLD, gold * 0.7), 0.75); c.lineWidth = 0.0025;
  for (let i = 0; i < 10; i++) {
    const y = WATER + 0.008 + i * i * 0.0026;
    c.beginPath();
    for (let x = -0.4; x <= 1.8; x += 0.012) {
      const v = Math.sin(x * (26 - i) + (s.still ? 0 : clock) * (1.1 + i * 0.13) + i * 1.7);
      if (v > 0.62) c.lineTo(x, y + v * 0.002); else c.moveTo(x, y);
    }
    c.stroke();
  }
  lotus(s, 0.3, 4, 1, true); lotus(s, 1.12, 3, 2, false);
  // the banks, willows and reeds
  banks(s, 0.24);
  c.fillStyle = s.tone(0.32); c.strokeStyle = s.tone(0.32);
  willow(c, -0.07, BANK + 0.005, 0.5, clock);
  willow(c, 1.46, BANK + 0.005, 0.44, clock + 2);
  c.fillStyle = s.tone(0.26); c.strokeStyle = s.tone(0.26);
  reeds(s, CX - SPAN + 0.02, WATER + 0.02, 9, 0.08, 1);
  reeds(s, CX + SPAN - 0.02, WATER + 0.02, 9, 0.08, 2);
  bridge(s, 0.42);
}

/** Reeds close to us, at the bottom corners of the picture. */
function foreground(s: Stage) {
  const c = s.c;
  c.fillStyle = s.tone(0.12); c.strokeStyle = s.tone(0.12);
  reeds(s, -0.02, 1.02, 12, 0.16, 7);
  reeds(s, 1.44, 1.02, 12, 0.15, 8);
}

/* ================================================================ water life */
/** Minnows under the water, darting: quick dashes between resting places, inside a box. */
function minnows(s: Stage, n: number, box: [number, number, number, number], o: { seed?: number; gold?: number } = {}) {
  const c = s.c, time = s.clock;
  const col = css(mixRGB(mixRGB(inkOf(s), s.screen, 0.16), [196, 128, 40], o.gold ?? 0), 0.9);
  for (let i = 0; i < n; i++) {
    const id = i + (o.seed ?? 0) * 31;
    const per = 1.1 + hash(id, 3) * 1.1;
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
    swimmer(c, 0, 0, 0.042 + hash(id, 9) * 0.016, time * (f < 0.38 ? 5 : 1.3) + id, face, col);
    c.restore();
  }
}

interface Leap { at: number; x: number; dx: number; h: number; size?: number; dur?: number }
/** Droplets thrown up where a fish breaks the surface. */
function splash(s: Stage, x: number, age: number, size: number, seed: number, y = WATER) {
  if (age <= 0 || age >= 1 || s.still) return;
  const c = s.c;
  c.fillStyle = toneA(s, 0.3, 0.85 * (1 - age));
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI / 2 + (hash(i, seed) - 0.5) * 2.2;
    const v = size * (1.3 + hash(i, seed + 1) * 1.6);
    const px = x + Math.cos(a) * v * age, py = y + Math.sin(a) * v * age + size * 3.2 * age * age;
    c.beginPath(); c.arc(px, py, size * 0.07 * (1 - age * 0.5), 0, TAU); c.fill();
  }
}
/** A fish in the air: a light behind it so it shows against stone, its body bent along its path. */
function flyingFish(s: Stage, x: number, y: number, ang: number, face: 1 | -1, size: number, gold: number) {
  const c = s.c;
  glow(c, x, y, size * 1.1, gold > 0 ? mixRGB([255, 248, 230], GOLD, gold) : [255, 248, 230], 0.75);
  c.save(); c.translate(x, y); c.rotate(ang);
  swimmer(c, 0, 0, size, s.clock * 3, face, gold > 0 ? css(mixRGB(inkOf(s), [190, 120, 30], gold)) : s.ink, s.tone(0.8));
  c.restore();
}
/** A minnow leaping out of the river and back: its arc, its splash and the rings it leaves. Returns where it is, if in the air. */
function leap(s: Stage, L: Leap, o: { gold?: number; trail?: number } = {}): P | null {
  const c = s.c;
  const dur = L.dur ?? 0.95, size = L.size ?? 0.07;
  const u = (s.t - L.at) / dur;
  const x1 = L.x + L.dx;
  ripple(c, L.x, WATER + 0.008, 0.1, u / 2.2, toneA(s, 0.25, 0.9), 0.22);
  ripple(c, x1, WATER + 0.008, 0.1, (u - 1) / 2.2, toneA(s, 0.25, 0.9), 0.22);
  splash(s, L.x, u / 0.4, size, L.at * 10);
  splash(s, x1, (u - 1) / 0.4, size, L.at * 10 + 3);
  if (u <= 0 || u >= 1) return null;
  const at = (v: number): P => [L.x + L.dx * v, WATER - L.h * 4 * v * (1 - v)];
  const [x, y] = at(u);
  const gold = o.gold ?? 0;
  if ((o.trail ?? 0) > 0) {
    const pts: P[] = [];
    const from = Math.max(0, u - 0.45);
    for (let i = 0; i <= 14; i++) pts.push(at(from + ((u - from) * i) / 14));
    thread(c, pts, 1, GOLD, 0.006, { alpha: 0.75 * (o.trail ?? 0), bead: false, curve: 0 });
  }
  const face: 1 | -1 = L.dx >= 0 ? 1 : -1;
  const vx = L.dx, vy = -L.h * 4 * (1 - 2 * u);
  flyingFish(s, x, y, face > 0 ? Math.atan2(vy, vx) : Math.atan2(-vy, -vx), face, size, gold);
  // a glint of joy at the top of the leap
  const top = 1 - Math.abs(u - 0.5) * 4;
  if (top > 0) twinkle(c, x + size * 0.2 * face, y - size * 0.55, size * 0.4 * top, gold > 0 ? css([255, 236, 170], top) : css([255, 252, 238], top));
  return [x, y];
}

/* ================================================================ the two friends */
const ZH = 0.27, HH = 0.29;
/** Zhuangzi: hair in a big topknot, a long beard, a loose robe, a fan — at his ease. */
function zhuang(s: Stage, b: Partial<Body> = {}): Joints {
  const x = b.x ?? ZX;
  const body: Body = { x, y: ground(x), h: ZH, face: 1, robe: 'long', beard: true, hold: 'fan', cut: s.tone(0.8), t: s.clock, ...b };
  s.c.fillStyle = s.ink;
  const j = person(s.c, body);
  headgear(s, j, body, 'knot');
  return j;
}
/** Huizi the logician: upright, clean-shaven, a tall pinned cap, his scroll of arguments. */
function hui(s: Stage, b: Partial<Body> = {}): Joints {
  const x = b.x ?? HX;
  const body: Body = { x, y: ground(x), h: HH, face: 1, robe: 'long', hold2: 'scroll', cut: s.tone(0.8), t: s.clock, ...b };
  s.c.fillStyle = s.ink;
  const j = person(s.c, body);
  headgear(s, j, body, 'cap');
  return j;
}
/** What each wears on his head, drawn in the head's own frame (x forwards, y up, the head about 8 across). */
function headgear(s: Stage, j: Joints, b: Body, kind: 'knot' | 'cap') {
  const c = s.c, u = b.h / 100, f = b.face ?? 1;
  c.save();
  c.translate(j.head[0], j.head[1]); c.scale(f * u, -u); c.rotate(-((b.lean ?? 0) + (b.tilt ?? 0)) * R);
  c.fillStyle = s.ink; c.strokeStyle = s.ink;
  if (kind === 'knot') {
    // Zhuangzi's topknot, a pin through it
    c.beginPath(); c.ellipse(-1.8, 10.4, 4.4, 4, 0.2, 0, TAU); c.fill();
    c.lineWidth = 1.4; c.beginPath(); c.moveTo(-9.5, 9.4); c.lineTo(6, 12.8); c.stroke();
  } else {
    // Huizi's cap: a band over the crown, a tall crest leaning back, a pin through it, a strap under the chin
    c.beginPath(); c.moveTo(-7.9, 2.6); c.lineTo(7.0, 4.8); c.lineTo(6.6, 8.8); c.quadraticCurveTo(0, 11.8, -7.6, 8.4); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(-5.6, 9); c.lineTo(-10, 22); c.lineTo(-5.6, 23.4); c.lineTo(3.4, 10.4); c.closePath(); c.fill();
    c.lineWidth = 1.4; c.beginPath(); c.moveTo(-13, 14.4); c.lineTo(3.6, 17.2); c.stroke();
    c.lineWidth = 0.8; c.beginPath(); c.moveTo(4.6, 4.2); c.quadraticCurveTo(5.6, -3.6, 2.4, -9.4); c.stroke();
    if (b.cut) { c.strokeStyle = b.cut; c.lineWidth = 0.6; c.beginPath(); c.moveTo(-7.2, 4.4); c.lineTo(6.4, 6.4); c.stroke(); }
  }
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

/** Lips moving while someone speaks (closed in a reduced-motion still). */
const talk = (s: Stage, on: boolean, rate = 13) => (on && !s.still ? 0.35 + 0.35 * Math.sin(s.clock * rate) : 0);

/** Open hands, palms up: how could you? */
const ASK = { arm: [62, 58] as [number, number], arm2: [-28, 96] as [number, number] };
/** Leaning on the rail and pointing the fan down at the water. */
const LEANING = (look: number, point: number): Partial<Body> => ({
  lean: 24 * look, tilt: 26 * look,
  arm: mixA([20, 30], [52, 0], point), arm2: mixA([-6, 10], [34, 30], look),
});

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
  c.beginPath(); c.arc(-0.12, -0.7, 0.22, 0, TAU); c.fill();
  c.lineWidth = 0.08; c.beginPath(); c.moveTo(-0.46, -0.76); c.lineTo(0.24, -0.62); c.stroke();
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
  if (k > 0.85 && k < 1) glow(c, x, yTop, 0.07, [235, 248, 255], 1 - Math.abs(k - 0.95) * 8);
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
      const len = 0.3 * k * (0.5 + hash(i, seed + 1) * 0.6);
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
  const [a, b, , d] = quad;
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
    c.strokeStyle = toneA(s, 0.25, 0.55); c.lineWidth = 0.003; c.stroke();
    c.strokeStyle = 'rgba(255,255,255,0.95)'; c.lineWidth = 0.0015; c.stroke();
    c.restore();
    if (hash(id, seed + 3) > 0.6 && !s.still) twinkle(c, cxx + drift, cyy + fall, 0.012 * (1 - k), 'rgba(255,255,255,0.95)');
  }
}

/** Huizi's "≠" flying from his hand to where a wall will stand, and stretching into it. */
function becomesWall(s: Stage, from: P, to: P, k: number, melt: number) {
  if (k <= 0 || melt >= 1) return;
  const c = s.c;
  const e = ease(Math.min(1, k));
  const x = lerp(from[0], to[0], e), y = lerp(from[1], to[1], e) - Math.sin(e * Math.PI) * 0.06;
  const size = lerp(0.02, 0.045, e);
  glow(c, x, y, size * 2.4, [236, 248, 255], 0.9 * (1 - melt));
  c.save();
  c.globalAlpha = 1 - melt;
  c.translate(x, y); c.scale(size * (1 - melt * 0.6), size * (1 + melt * 4));
  c.fillStyle = s.ink; NEQ(c);
  c.restore();
}

/* ================================================================ the scenes */

/** I. On the bridge: the friends stroll onto the bridge; minnows dart and leap; Zhuangzi leans on the rail and points — the fish are happy. */
const LEAPS1: Leap[] = [
  { at: 4.2, x: 0.6, dx: 0.15, h: 0.12 },
  { at: 6.1, x: 0.98, dx: -0.12, h: 0.15 },
  { at: 7.0, x: 0.8, dx: -0.16, h: 0.12 },
  { at: 7.9, x: 1.1, dx: -0.14, h: 0.17 },
  { at: 8.6, x: 0.58, dx: 0.17, h: 0.13 },
  { at: 9.6, x: 0.94, dx: 0.15, h: 0.18 },
  { at: 10.5, x: 0.82, dx: -0.16, h: 0.12 },
  { at: 11.2, x: 1.12, dx: -0.13, h: 0.15 },
];
const onTheBridge: SceneFn = (s) => {
  const { t, clock } = s;
  const cam = track(t, [[0, 0.62, 0.5, 1], [2.2, 0.63, 0.5, 1.02], [6.4, 0.76, 0.52, 1.2], [10.5, 0.83, 0.55, 1.36], [12, 0.84, 0.555, 1.38]]);
  world(s, { cam, mood: 'dawn', sun: [1.14, 0.22], mist: 1 - 0.6 * seg(t, 0, 9) });
  minnows(s, 10, [CX - SPAN + 0.14, WATER + 0.03, CX + SPAN - 0.1, 0.87]);
  // Zhuangzi strolls in first, fanning himself; Huizi a step behind, stiff, his scroll under his arm
  const zk = seg(t, 0, 5), zx = lerp(-0.1, ZX, zk);
  const look = ease(seg(t, 5, 5.8)), point = ease(seg(t, 5.6, 6.3));
  const z = zhuang(s, {
    x: zx,
    ...(zk < 1 ? { ...walk((zx + 0.1) / (0.82 * ZH), 0.9), arm: [128, 96 + 14 * Math.sin(clock * 7)] as [number, number], lean: 4 } : LEANING(look, point)),
    eye: t > 6.6 ? 'closed' : 'open', mouth: talk(s, t > 6.6 && t < 8.6),
  });
  const hk = seg(t, 0, 5.6), hx = lerp(-0.32, HX, hk);
  const doubt = ease(seg(t, 8.6, 9.4));
  hui(s, { x: hx, ...(hk < 1 ? walk((hx + 0.32) / (0.82 * HH), 0.65) : gesture('rest', 'chin', doubt)), arm2: hk < 1 ? [8, 70] : mixA([8, 70], [14, 76], doubt), lean: -2, tilt: hk < 1 ? 0 : 12 * look - 4 * doubt });
  LEAPS1.forEach((L) => leap(s, L));
  foreground(s);
  // what he says: see the minnows — that is the pleasure of fishes
  say(s, { x: z.head[0] + 0.15, y: z.head[1] + 0.005, r: 0.062, to: z.mouth, k: shown(t, 6.5, 12.4), items: [HAPPY_FISH] });
  s.spill(1.14, 0.22, 0.35, [250, 200, 170]);
};

/** II. Hui Tzu: he taps his friend on the shoulder — you (pointing at him) are not a fish (one leaps up as he points at the water): how can you know? */
const huiziAsks: SceneFn = (s) => {
  const { t } = s;
  const cam = track(t, [[0, 0.71, 0.35, 1.68], [9, 0.68, 0.355, 1.78]]);
  // a cloud crosses the sun: the light cools
  const shade = ease(seg(t, 0.5, 3));
  world(s, { cam, mood: 'day', to: 'sea', k: 0.25 * shade, sun: [1.2, 0.2], sunK: 1 - 0.5 * shade, mist: 0.3 });
  minnows(s, 8, [CX - SPAN + 0.14, WATER + 0.03, CX + SPAN - 0.1, 0.87]);
  const lift = ease(seg(t, 0.9, 1.5)) * (1 - ease(seg(t, 2.6, 3.4))) * 0.5 + 0.5 * ease(seg(t, 6.6, 7.4));
  zhuang(s, { ...LEANING(1, 1), eye: 'closed', lean: 24 - 12 * lift, tilt: 26 - 16 * lift });
  // Huizi: a tap on the shoulder, a finger at him, a shake of the head, a finger at the water, then empty hands
  const step = ease(seg(t, 0.2, 0.8));
  const tap = ease(seg(t, 0.3, 0.7)) * (1 - ease(seg(t, 0.9, 1.2)));
  const p1 = ease(seg(t, 1.0, 1.4)), p2 = ease(seg(t, 2.9, 3.4)), p3 = ease(seg(t, 4.7, 5.3));
  const down = gesture('point', 'pointDown', 1);
  const g = p3 > 0 ? { arm: mixA(down.arm, ASK.arm, p3), arm2: mixA(down.arm2, ASK.arm2, p3) } : p2 > 0 ? gesture('point', 'pointDown', p2) : gesture('chin', 'point', p1);
  const no = s.still ? 0 : Math.sin((t - 2.5) * 18) * 9 * (seg(t, 2.4, 2.6) - seg(t, 3.0, 3.2));
  const h = hui(s, {
    x: HX + 0.03 * step, ...(step > 0 && step < 1 ? { leg: [14, 12] as [number, number], leg2: [-10, 20] as [number, number] } : {}),
    ...g, ...(tap > 0 ? { reach: [lerp(HX + 0.1, ZX - 0.05, tap), lerp(0.42, 0.37, tap)] as P } : {}),
    arm2: p3 > 0 ? g.arm2 : [14, 76], lean: -2 + 7 * p1 - 5 * p3, tilt: 8 * p2 * (1 - p3) - 8 * p3 + no, mouth: talk(s, t > 1.1 && t < 5.8),
  });
  // as he says "fish", one jumps right up in front of them
  leap(s, { at: 3.0, x: 0.86, dx: 0.13, h: 0.25, dur: 1.2 });
  leap(s, { at: 6.4, x: 1.02, dx: -0.13, h: 0.24, dur: 1.1 });
  // you ≠ fish … ?
  say(s, { x: 0.735, y: 0.178, r: 0.056, to: h.mouth, k: shown(t, 1.1, 99), items: [ZHUANG, NEQ, FISH, Q], ks: [seg(t, 1.1, 1.5), seg(t, 2.5, 2.9), seg(t, 3.3, 3.7), seg(t, 4.8, 5.2)], shake: seg(t, 4.8, 5.2) * (1 - seg(t, 5.8, 6.6)) });
};

/** III. Chuang Tzu: face to face — he turns round smiling, flips the question over with his fan and hands it back: you are not I, so how do you know what I know? */
const zhuangziAnswers: SceneFn = (s) => {
  const { t, c, clock } = s;
  const cam = track(t, [[0, 0.705, 0.305, 2.95], [8, 0.705, 0.305, 3.15]]);
  const burst = ease(seg(t, 0.8, 2.6));
  const SUN: P = [1.07, 0.25];
  const sp = seen(s, cam, SUN_DEPTH, SUN);
  // the sun comes out from behind the cloud: rays behind his head
  const rays = () => {
    if (burst <= 0) return;
    c.save(); c.translate(sp[0], sp[1]); c.rotate((s.still ? 0 : clock) * 0.06);
    c.fillStyle = css([255, 226, 160], 0.3 * burst);
    for (let i = 0; i < 16; i++) { const a = (i / 16) * TAU; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a - 0.05) * 0.4, Math.sin(a - 0.05) * 0.4); c.lineTo(Math.cos(a + 0.05) * 0.4, Math.sin(a + 0.05) * 0.4); c.closePath(); c.fill(); }
    c.restore();
  };
  world(s, { cam, mood: 'day', to: 'gold', k: 0.5 * burst, sun: SUN, sunK: 0.75 + 0.25 * burst, sunR: 0.06, mist: 0.2, sky: rays });
  // willow leaves blowing across
  c.fillStyle = s.tone(0.25);
  for (let i = 0; i < 6; i++) {
    const v = s.still ? hash(i, 3) : (clock * 0.07 + hash(i, 3)) % 1;
    const x = lerp(1.0, 0.4, v), y = 0.14 + hash(i, 4) * 0.3 + v * 0.06 + Math.sin(clock * 2 + i) * 0.01;
    c.save(); c.translate(x, y); c.rotate(clock * 3 + i); c.beginPath(); c.ellipse(0, 0, 0.0035, 0.009, 0, 0, TAU); c.fill(); c.restore();
  }
  const turn = ease(seg(t, 0.3, 1.2));
  const tap = ease(seg(t, 1.4, 1.9)) * (1 - ease(seg(t, 2.5, 2.9)));
  const atHui = ease(seg(t, 2.9, 3.3)) * (1 - ease(seg(t, 3.8, 4.1)));
  const atSelf = ease(seg(t, 3.9, 4.3)) * (1 - ease(seg(t, 4.8, 5.1)));
  const chuckle = s.still ? 0 : Math.max(0, Math.sin(clock * 9)) * 0.8 * seg(t, 5.2, 5.6);
  const bx = 0.705, by = 0.214;
  const z = turning(c, ZX, turn, 1, (face) => zhuang(s, {
    face,
    ...(turn < 1 ? LEANING(1 - turn, 1 - turn) : {
      arm: atHui > 0 ? mixA([20, 30], [92, -4], atHui) : atSelf > 0 ? mixA([20, 30], [40, 132], atSelf) : [24, 90 + 16 * Math.sin(clock * 6)] as [number, number],
      reach: tap > 0 ? [lerp(ZX - 0.04, bx + 0.09, tap), lerp(0.36, by + 0.01, tap)] as P : null,
      arm2: [-6, 12] as [number, number],
    }),
    eye: 'closed', mouth: talk(s, t > 2.8 && t < 5.4), tilt: turn >= 1 ? -6 - chuckle * 6 + 8 * seg(t, 4.8, 5.2) * (1 - seg(t, 6, 6.6)) : 0, bob: chuckle,
  }));
  const startle = ease(seg(t, 3.5, 4.0)) * (1 - ease(seg(t, 6.2, 7.2)));
  const h = hui(s, { ...gesture('shrug', 'chin', ease(seg(t, 5.8, 6.6))), arm2: [14, 76], lean: -2 - 12 * startle, tilt: -6 * startle, eye: startle > 0.3 ? 'wide' : 'open' });
  // the question, flipped like a card: on its back — you ≠ me … ?
  const flip = seg(t, 1.9, 2.7);
  const sq = Math.max(0.04, Math.abs(Math.cos(Math.PI * flip)));
  c.save(); c.translate(bx, 0); c.scale(sq, 1); c.translate(-bx, 0);
  if (flip < 0.5) say(s, { x: bx, y: by, r: 0.036, to: [bx + (h.mouth[0] - bx) / sq, h.mouth[1]], k: 1, items: [ZHUANG, NEQ, FISH, Q] });
  else say(s, { x: bx, y: by, r: 0.036, to: [bx + (z.mouth[0] - bx) / sq, z.mouth[1]], k: 1, items: [HUI, NEQ, ZHUANG, Q], ks: [1 + atHui * 0.3, 1, 1 + atSelf * 0.3, 1 + 0.3 * seg(t, 4.8, 5.1) * (1 - seg(t, 5.6, 6))] });
  c.restore();
  if (flip > 0 && flip < 1) twinkle(c, bx + 0.1 * sq, by - 0.03, 0.018, 'rgba(255,255,255,0.95)');
  say(s, { x: h.head[0] - 0.045, y: h.head[1] - 0.07, r: 0.022, kind: 'thought', to: h.head, k: shown(t, 3.7, 6.4), items: [BANG] });
  s.spill(sp[0], sp[1], 0.45 * burst, [255, 214, 150]);
};

/** IV. Hui Tzu: he presses on — a wall of glass rises between his mind and Zhuangzi's, then another between Zhuangzi and the fish. Satisfied, he folds his arms. */
const huiziPresses: SceneFn = (s) => {
  const { t, c, clock } = s;
  const cam = track(t, [[0, 0.8, 0.44, 1.42], [10, 0.79, 0.48, 1.24]]);
  const cold = ease(seg(t, 0, 2.4));
  world(s, { cam, mood: 'day', to: 'sea', k: 0.25 + 0.7 * cold, sun: [1.2, 0.2], sunK: 0.5 - 0.4 * cold, mist: 0.5 + 0.5 * cold });
  minnows(s, 8, [PANE2 + 0.05, WATER + 0.03, CX + SPAN + 0.12, 0.87], { seed: 2 });
  mist(s, WATER - 0.03, 0.06, 0.55 * cold, 9);
  const rise1 = seg(t, 1.4, 3.0), rise2 = seg(t, 4.1, 5.7);
  // Zhuangzi faces his friend, watches the glass come up; turns to look for the fish; lays his hand on the glass
  const turnBack = ease(seg(t, 4.1, 4.8));
  const touch = ease(seg(t, 6.8, 7.6));
  turning(c, ZX, turnBack, -1, (face) => zhuang(s, { face, ...(turnBack >= 1 ? { arm: [20, 40] as [number, number], reach2: touch > 0 ? [lerp(ZX + 0.06, PANE2 - 0.05, touch), lerp(0.47, 0.42, touch)] as P : null, tilt: 18 } : { arm: [20, 40] as [number, number], arm2: [-6, 12] as [number, number], tilt: 4 }), eye: 'open' }));
  // Huizi: one finger up — the first wall; a hand towards the water — the second; then arms folded
  const one = ease(seg(t, 0.6, 1.1)), two = ease(seg(t, 3.3, 3.9)), done = ease(seg(t, 6.6, 7.3));
  const g = done > 0 ? gesture('offer', 'cross', done) : two > 0 ? gesture('pointUp', 'offer', two) : gesture('chin', 'pointUp', one);
  const h = hui(s, { ...g, arm2: done > 0 ? g.arm2 : [14, 76], lean: -2 - 4 * done, tilt: -12 * done, mouth: talk(s, t > 0.6 && t < 6.2) });
  // the fish leap, and one bumps its nose on the glass
  leap(s, { at: 1.6, x: 1.06, dx: 0.12, h: 0.16 });
  const bonk: Leap = { at: 5.9, x: 1.16, dx: -0.2, h: 0.2, dur: 1 };
  const bk = (t - bonk.at) / (bonk.dur ?? 1);
  if (bk < 0.4) leap(s, bonk);
  else {
    // it hits the glass and drops straight back
    const fallK = seg(bk, 0.4, 1.0);
    const hitX = PANE2 + 0.055, hitY = WATER - bonk.h * 4 * 0.4 * 0.6;
    if (fallK < 1) {
      flyingFish(s, hitX + 0.012 * fallK, lerp(hitY, WATER + 0.02, fallK * fallK), 0.3 + 1.2 * fallK, -1, 0.07, 0);
      const star = 1 - seg(bk, 0.4, 0.8);
      if (star > 0) twinkle(c, hitX - 0.012, hitY - 0.012, 0.035 * star, 'rgba(255,255,255,0.98)');
    }
    ripple(c, hitX + 0.012, WATER + 0.008, 0.1, (bk - 1) / 2, toneA(s, 0.25, 0.9), 0.22);
    splash(s, hitX + 0.012, (bk - 1) / 0.4, 0.07, 9);
  }
  leap(s, { at: 8.2, x: 1.06, dx: 0.13, h: 0.16 });
  // his "≠" flies out and stands up as glass: between the two men, then between the man and the fish
  becomesWall(s, h.hand, [PANE1, 0.33], seg(t, 0.9, 1.5), seg(t, 1.5, 2.1));
  becomesWall(s, h.hand, [PANE2, 0.46], seg(t, 3.6, 4.3), seg(t, 4.3, 4.9));
  pane(s, PANE1, ground(PANE1), 0.12, rise1, 0, 0, 1);
  pane(s, PANE2, 0.99, 0.2, rise2, 0, 0, 2);
  splash(s, PANE2 - 0.03, rise2 * 1.2, 0.08, 11);
  splash(s, PANE2 + 0.03, rise2 * 1.2, 0.08, 12);
  foreground(s);
  // he is pleased with himself
  say(s, { x: h.head[0] - 0.14, y: h.head[1] - 0.02, r: 0.05, to: h.mouth, k: shown(t, 7.1, 10.4), items: [CHECK] });
};

/** V. From the bridge: Zhuangzi laughs the walls down; he knew it from here, on the bridge; the bridge and its reflection glow like a moon, and the fish leap through it. */
const LEAPS5: Leap[] = [
  { at: 7.2, x: 0.6, dx: 0.2, h: 0.15 },
  { at: 8.1, x: 0.98, dx: 0.15, h: 0.19 },
  { at: 8.9, x: 0.82, dx: -0.2, h: 0.14 },
  { at: 9.7, x: 1.12, dx: -0.15, h: 0.2 },
  { at: 10.4, x: 0.58, dx: 0.22, h: 0.16 },
  { at: 11.1, x: 0.96, dx: 0.16, h: 0.18 },
];
const fromTheBridge: SceneFn = (s) => {
  const { t, c, clock } = s;
  const cam = track(t, [[0, 0.79, 0.33, 2.3], [0.4, 0.79, 0.33, 2.3], [3.6, 0.78, 0.44, 1.42], [6.2, 0.76, 0.46, 1.32], [11, 0.72, 0.5, 1.04]]);
  const warm = ease(seg(t, 2.4, 8));
  const bold = s.small ? 1.6 : 1; // thin gold would vanish on a card
  const SUN: P = [0.74, 0.36];
  world(s, { cam, mood: 'sea', to: warm < 0.5 ? 'dusk' : 'gold', k: warm, sun: SUN, sunK: warm, sunR: 0.12, sunCol: mixRGB(VERMILION, [240, 160, 64], warm), mist: 1 - warm * 0.7, gold: ease(seg(t, 6.4, 9)) });
  minnows(s, 10, [CX - SPAN + 0.14, WATER + 0.03, CX + SPAN - 0.1, 0.87], { gold: ease(seg(t, 7, 9)) * 0.6 });
  // the bridge and its reflection light up like a full moon
  const ring = ease(seg(t, 6.0, 7.4)), deep = ease(seg(t, 6.8, 8.0));
  if (ring > 0) {
    const rr = ARCH + 0.016;
    for (const [w, a] of [[0.016, 0.3], [0.005, 1]] as [number, number][]) {
      c.strokeStyle = css(GOLD, a); c.lineWidth = w * bold;
      c.beginPath(); c.arc(CX, WATER, rr, -Math.PI / 2 - (Math.PI / 2) * ring, -Math.PI / 2 + (Math.PI / 2) * ring); c.stroke();
      if (deep > 0) { c.beginPath(); c.arc(CX, WATER, rr, Math.PI - (Math.PI / 2) * deep, Math.PI); c.stroke(); c.beginPath(); c.arc(CX, WATER, rr, 0, (Math.PI / 2) * deep); c.stroke(); }
    }
    glow(c, CX, WATER, ARCH * 1.6, GOLD, 0.35 * deep);
  }
  // he laughs: head thrown back, shoulders shaking
  const laugh = 1 - ease(seg(t, 3.4, 4.2));
  const shake = s.still ? 0 : Math.sin(clock * 30) * 0.003 * laugh;
  const sweep = ease(seg(t, 4.4, 5.4)), settle = ease(seg(t, 8.6, 9.6));
  const turnK = ease(seg(t, 4.0, 4.6));
  const z = turning(c, ZX + shake, turnK, -1, (face) => zhuang(s, {
    x: ZX + shake, face,
    ...(turnK < 0.5 ? { arm: [26, 120] as [number, number], arm2: [20, 100] as [number, number], tilt: -24 * laugh, lean: -8 * laugh } : { arm: mixA(mixA([150, 10], [56, 0], sweep), [40, 30], settle), arm2: mixA([-6, 12], [34, 30], settle), lean: 10 * sweep + 12 * settle, tilt: 18 * sweep + 6 * settle }),
    eye: 'closed', mouth: laugh > 0.1 && !s.still ? 0.5 + 0.5 * Math.abs(Math.sin(clock * 9)) : talk(s, t > 4.8 && t < 6.6),
  }));
  // Huizi: arms folded … then he comes to the rail beside his friend and leans there too
  const come = seg(t, 7.0, 8.8), lean = ease(seg(t, 8.8, 9.6));
  const hx = lerp(HX, 0.675, ease(come));
  hui(s, { x: hx, ...(come > 0 && come < 1 ? walk((hx - HX) / (0.82 * HH), 0.6) : come >= 1 ? { arm: [36, 30] as [number, number], arm2: [30, 30] as [number, number] } : gesture('cross')), lean: lerp(-4, 18, lean), tilt: lerp(-6, 22, lean), eye: 'open' });
  // his laughter rolls out; the glass cracks, then bursts
  const crackK = ease(seg(t, 1.0, 3.0)), burst = seg(t, 3.3, 5.0);
  if (laugh > 0.1) {
    sound(c, z.mouth[0] - 0.01, z.mouth[1], 0.06, clock, Math.PI, laugh, toneA(s, 0.2, 0.7), 0.9);
    sound(c, z.mouth[0] + 0.01, z.mouth[1] - 0.01, 0.06, clock + 0.3, 0, laugh, toneA(s, 0.2, 0.7), 0.9);
  }
  pane(s, PANE1, ground(PANE1), 0.12, 1, crackK, burst, 1, [PANE1 + 0.012, 0.3]);
  pane(s, PANE2, 0.99, 0.2, 1, crackK, burst, 2, [PANE2 - 0.012, 0.36]);
  // a thread of gold runs from his heart down into the bridge
  const gk = ease(seg(t, 5.4, 6.4));
  if (gk > 0) {
    const pts: P[] = [[z.chest[0], z.chest[1]], [ZX + 0.004, ground(ZX) - 0.06], [ZX, ground(ZX)], [CX + 0.02, CROWN + 0.03], [CX, WATER - ARCH - 0.016]];
    thread(c, pts, gk, GOLD, 0.012 * bold, { alpha: 0.35, bead: false, curve: 0.04 });
    thread(c, pts, gk, GOLD, 0.0045 * bold, { alpha: 1, bead: true, curve: 0.04 });
    glow(c, z.chest[0], z.chest[1], 0.05, GOLD, 0.7 * gk);
  }
  LEAPS5.forEach((L) => leap(s, L, { gold: ease(seg(t, 6.8, 7.6)), trail: 1 }));
  foreground(s);
  // how did I know? from here — on the bridge
  const swap = seg(t, 5.6, 6.0);
  say(s, { x: z.head[0] + 0.14, y: z.head[1] - 0.02, r: 0.055, to: z.mouth, k: shown(t, 4.8, 8.2), items: [HAPPY_FISH, swap < 0.5 ? Q : BRIDGE], ks: [1, swap < 0.5 ? 1 : (swap - 0.5) * 2] });
  const sp = seen(s, cam, SUN_DEPTH, SUN);
  s.spill(sp[0], sp[1], 0.65 * warm, [255, 190, 110]);
};

export const fish: StoryVisuals = {
  id: 'fish',
  aspect: 1.4,
  loop: false,
  scenes: [onTheBridge, huiziAsks, zhuangziAnswers, huiziPresses, fromTheBridge],
  stills: [8.9, 6.8, 5.6, 8.6, 10.7],
};
