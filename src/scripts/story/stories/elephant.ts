import { seg, ease, easeOut, lerp, noise, hash, css, mixRGB, type RGB, type Stage, type SceneFn, type StoryVisuals } from '../puppet/theatre';
import { person, walk, type Body, type Joints } from '../puppet/figure';
import { elephant as drawElephant, bird, type ElephantParts } from '../puppet/beasts';
import { glow, emit, sparks, sun, sound } from '../puppet/fx';
import { bubble, shown, Q, type Icon } from '../puppet/bubbles';
import { hills, palm, cloud } from '../puppet/scenery';

/**
 * "The blind men and the elephant" (John Godfrey Saxe, after the Indian
 * parable): six blind men come to an elephant; each takes hold of one part
 * and is sure the whole beast is like it — a wall, a spear, a snake, a tree,
 * a fan, a rope — and they quarrel, each partly in the right.
 *
 * One set: a morning in Indostan (a domed temple far off, palms, a village,
 * a banyan) with the elephant standing in it, facing left, towards where the
 * men come from. The first and last scenes see all of it; the six between go
 * close to the part each man touches, and show what he makes of it twice:
 * as a picture in his thought bubble, and drawn in gold over the part itself.
 */
type C = CanvasRenderingContext2D;
type P = [number, number];
const TAU = Math.PI * 2;
const GOLD: RGB = [240, 176, 70];
const RED: RGB = [206, 62, 40];
const GROUND = 0.84;
const PAPER = 'rgba(255,252,246,1)';

/* ---------------------------------------------------------------- small helpers */
const ell = (c: C, x: number, y: number, rx: number, ry: number, rot = 0) => { c.beginPath(); c.ellipse(x, y, Math.max(0, rx), Math.max(0, ry), rot, 0, TAU); c.fill(); };
const line = (c: C, a: P, b: P) => { c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); };
const paint = (c: C, col: string) => { c.fillStyle = col; c.strokeStyle = col; };
const mid = (a: P, b: P, k = 0.5): P => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
/** A closed smooth outline through points, the way the toolkit draws bodies. */
function outline(c: C, pts: P[]) {
  const n = pts.length;
  const m0 = mid(pts[n - 1], pts[0]);
  c.moveTo(m0[0], m0[1]);
  for (let i = 0; i < n; i++) { const p = pts[i], m = mid(p, pts[(i + 1) % n]); c.quadraticCurveTo(p[0], p[1], m[0], m[1]); }
  c.closePath();
}
/** A smooth open path through points. */
function smooth(c: C, pts: P[]) {
  c.beginPath(); c.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length - 1; i++) { const m = mid(pts[i], pts[i + 1]); c.quadraticCurveTo(pts[i][0], pts[i][1], m[0], m[1]); }
  const l = pts[pts.length - 1]; c.lineTo(l[0], l[1]);
}
/** A tapered limb with rounded ends. */
function bone(c: C, a: P, b: P, w1: number, w2: number) {
  const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1e-6;
  const nx = -dy / len, ny = dx / len;
  c.beginPath();
  c.moveTo(a[0] + nx * w1 / 2, a[1] + ny * w1 / 2); c.lineTo(b[0] + nx * w2 / 2, b[1] + ny * w2 / 2);
  c.lineTo(b[0] - nx * w2 / 2, b[1] - ny * w2 / 2); c.lineTo(a[0] - nx * w1 / 2, a[1] - ny * w1 / 2);
  c.closePath(); c.fill();
  ell(c, a[0], a[1], w1 / 2, w1 / 2); ell(c, b[0], b[1], w2 / 2, w2 / 2);
}
/** A point along a polyline, a fraction k of its length. */
function along(pts: P[], k: number): P {
  let total = 0;
  for (let i = 1; i < pts.length; i++) total += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  let left = Math.max(0, Math.min(1, k)) * total;
  for (let i = 1; i < pts.length; i++) {
    const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    if (left <= d || i === pts.length - 1) return mid(pts[i - 1], pts[i], d ? Math.min(1, left / d) : 0);
    left -= d;
  }
  return pts[pts.length - 1];
}
const quad = (a: P, b: P, c2: P, k: number): P => [(1 - k) * (1 - k) * a[0] + 2 * k * (1 - k) * b[0] + k * k * c2[0], (1 - k) * (1 - k) * a[1] + 2 * k * (1 - k) * b[1] + k * k * c2[1]];

/* ---------------------------------------------------------------- the camera, and layers that lag behind it */
interface Cam { x: number; y: number; z: number }
function aim(s: Stage, x: number, y: number, z: number): Cam { s.cam(x, y, z); return { x, y, z }; }
/** A camera eased between keyframes [t, x, y, zoom]. */
function shoot(s: Stage, keys: [number, number, number, number][]): Cam {
  let x = keys[0][1], y = keys[0][2], z = keys[0][3];
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1], b = keys[i];
    if (s.t > a[0]) { const k = ease(seg(s.t, a[0], b[0])); x = lerp(a[1], b[1], k); y = lerp(a[2], b[2], k); z = lerp(a[3], b[3], k); }
  }
  return aim(s, x, y, z);
}
/** Draw far things on a layer that keeps `p` of its place on the screen when the camera moves (0 = with the stage, 1 = fixed). */
function layer(s: Stage, cam: Cam, p: number, draw: () => void) {
  const c = s.c, zl = lerp(cam.z, 1, p), lx = lerp(cam.x, s.W / 2, p), ly = lerp(cam.y, 0.5, p);
  c.save(); c.translate(cam.x, cam.y); c.scale(zl / cam.z, zl / cam.z); c.translate(-lx, -ly);
  draw();
  c.restore();
}
/** A length that looks the same on the screen whatever the zoom. */
const px = (cam: Cam, k: number) => k / cam.z;
/** The thin line of light cut round a figure that stands in front of the elephant (world units). */
const keyOf = (s: Stage, cam: Cam) => Math.min(3, Math.max(1.4, s.unit * 0.0066)) / (s.unit * cam.z);

/* ---------------------------------------------------------------- scenery */
/** A domed temple far off: a plinth, an arcaded hall, a swelling dome with its finial and pennant, kiosks at the corners. */
function domedTemple(c: C, x: number, y: number, w: number, t: number, cut: string) {
  c.fillRect(x - w * 0.62, y - w * 0.05, w * 1.24, w * 0.05);
  c.fillRect(x - w * 0.46, y - w * 0.34, w * 0.92, w * 0.3);
  for (const sx of [-1, 1]) {
    const kx = x + sx * w * 0.38;
    c.fillRect(kx - w * 0.07, y - w * 0.42, w * 0.14, w * 0.09);
    c.beginPath(); c.ellipse(kx, y - w * 0.42, w * 0.075, w * 0.08, 0, Math.PI, 0); c.fill();
    c.fillRect(kx - w * 0.006, y - w * 0.54, w * 0.012, w * 0.06);
  }
  c.fillRect(x - w * 0.24, y - w * 0.43, w * 0.48, w * 0.1);
  c.beginPath();
  c.moveTo(x - w * 0.25, y - w * 0.43);
  c.bezierCurveTo(x - w * 0.36, y - w * 0.62, x - w * 0.15, y - w * 0.76, x, y - w * 0.84);
  c.bezierCurveTo(x + w * 0.15, y - w * 0.76, x + w * 0.36, y - w * 0.62, x + w * 0.25, y - w * 0.43);
  c.closePath(); c.fill();
  c.fillRect(x - w * 0.009, y - w * 1.0, w * 0.018, w * 0.18);
  ell(c, x, y - w * 0.9, w * 0.024, w * 0.024);
  const fl = Math.sin(t * 3) * w * 0.02;
  c.beginPath(); c.moveTo(x, y - w * 1.0); c.quadraticCurveTo(x + w * 0.07, y - w * 0.985 + fl, x + w * 0.13, y - w * 0.975 - fl); c.lineTo(x, y - w * 0.95); c.fill();
  c.save(); c.fillStyle = cut;
  for (let i = -2; i <= 2; i++) {
    const ax = x + i * w * 0.165, aw = w * 0.045;
    c.beginPath(); c.moveTo(ax - aw, y - w * 0.05); c.lineTo(ax - aw, y - w * 0.2); c.arc(ax, y - w * 0.2, aw, Math.PI, 0); c.lineTo(ax + aw, y - w * 0.05); c.fill();
  }
  c.restore();
}
/** A banyan: a crown as wide as a house, a gnarled trunk, and roots hanging down from the branches to the ground. */
function banyan(c: C, x: number, y: number, h: number, t: number) {
  for (let i = 0; i < 15; i++) {
    const v = i / 14;
    const cx = x + (v - 0.5) * h * 1.55 + (hash(i, 3) - 0.5) * h * 0.1;
    const cy = y - h * (0.74 + 0.2 * Math.sin(v * Math.PI)) + hash(i, 5) * h * 0.06 + Math.sin(t * 0.8 + i) * h * 0.004;
    ell(c, cx, cy, h * (0.15 + 0.07 * hash(i, 7)), h * (0.1 + 0.05 * hash(i, 9)));
  }
  ell(c, x, y - h * 0.84, h * 0.62, h * 0.13);
  c.beginPath(); c.moveTo(x - h * 0.12, y); c.bezierCurveTo(x - h * 0.05, y - h * 0.25, x - h * 0.09, y - h * 0.5, x - h * 0.05, y - h * 0.74);
  c.lineTo(x + h * 0.06, y - h * 0.74); c.bezierCurveTo(x + h * 0.07, y - h * 0.5, x + h * 0.04, y - h * 0.25, x + h * 0.13, y); c.closePath(); c.fill();
  for (let i = 0; i < 18; i++) {
    const rx = x + (hash(i, 11) - 0.5) * h * 1.35;
    if (Math.abs(rx - x) < h * 0.1) continue;
    const top = y - h * (0.7 + 0.06 * hash(i, 13));
    const reaches = hash(i, 17) > 0.62;
    const bot = reaches ? y : top + h * (0.14 + 0.32 * hash(i, 19));
    const sw = Math.sin(t * 1.1 + i * 1.7) * h * 0.012 * (reaches ? 0.15 : 1);
    c.lineWidth = h * (reaches ? 0.02 : 0.007);
    c.beginPath(); c.moveTo(rx, top); c.quadraticCurveTo(rx + sw * 0.4, (top + bot) / 2, rx + sw, bot); c.stroke();
  }
}
/** A village hut with a thatched roof. */
function hut(c: C, x: number, y: number, w: number) {
  c.fillRect(x - w / 2, y - w * 0.45, w, w * 0.45);
  c.beginPath(); c.moveTo(x - w * 0.64, y - w * 0.4); c.quadraticCurveTo(x - w * 0.1, y - w * 1.1, x, y - w * 1.08); c.quadraticCurveTo(x + w * 0.1, y - w * 1.1, x + w * 0.64, y - w * 0.4); c.closePath(); c.fill();
}
/** Clumps of grass. */
function tufts(c: C, x0: number, x1: number, y: number, h: number, seed: number, t: number, n: number) {
  for (let i = 0; i < n; i++) {
    const x = x0 + (x1 - x0) * (i + hash(i, seed)) / n;
    const hh = h * (0.5 + hash(i, seed + 1));
    for (let j = -2; j <= 2; j++) {
      const sw = Math.sin(t * 1.4 + i + j) * hh * 0.1;
      c.beginPath(); c.moveTo(x + j * hh * 0.08 - hh * 0.035, y);
      c.quadraticCurveTo(x + j * hh * 0.14, y - hh * 0.55, x + j * hh * 0.3 + sw, y - hh * (1 - Math.abs(j) * 0.18));
      c.lineTo(x + j * hh * 0.08 + hh * 0.035, y); c.fill();
    }
  }
}

/** Morning in Indostan: a domed temple on a far rise, palms and a village, a banyan, the dusty ground. */
function morning(s: Stage, cam: Cam, o: { light: P; warm?: number; sun?: P; r?: number }) {
  const { c, clock } = s;
  s.backdrop({ mood: 'dawn', to: 'gold', k: o.warm ?? 0.35, x: o.light[0], y: o.light[1], r: o.r ?? 1.5 });
  const sp = o.sun;
  if (sp) layer(s, cam, 0.9, () => sun(c, sp[0], sp[1], 0.042, clock, 0.9, 0.8));
  layer(s, cam, 0.62, () => {
    paint(c, css(mixRGB(s.screen, [255, 255, 255], 0.55), 0.5));
    cloud(c, 1.1, 0.15, 0.34, 2); cloud(c, -0.32, 0.12, 0.26, 5); cloud(c, 0.58, 0.05, 0.22, 7); cloud(c, 1.75, 0.09, 0.3, 4);
  });
  layer(s, cam, 0.72, () => {
    paint(c, s.tone(0.72)); hills(c, -1.6, 3, 0.63, 0.07, 3, 2, 2.2);
    paint(c, s.tone(0.64)); ell(c, 0.52, 0.68, 0.3, 0.035);
    domedTemple(c, 0.52, 0.652, 0.2, clock, s.tone(0.74));
    paint(c, s.tone(0.62));
    for (const [x, h] of [[-0.32, 0.16], [-0.2, 0.2], [0.04, 0.15], [1.0, 0.18], [1.12, 0.14], [1.55, 0.19]]) palm(c, x, 0.675, h, clock, 0.1);
  });
  layer(s, cam, 0.45, () => {
    paint(c, s.tone(0.52)); hills(c, -1.6, 3, 0.735, 0.04, 6, 2, 3);
    paint(c, s.tone(0.46)); for (const [x, w] of [[0.96, 0.06], [1.05, 0.05], [1.14, 0.07], [1.25, 0.05]]) hut(c, x, 0.745, w);
    for (const [x, h, l] of [[-0.44, 0.3, 0.14], [0.22, 0.27, -0.1], [0.33, 0.31, 0.12], [1.44, 0.3, -0.12], [1.62, 0.26, 0.1]]) palm(c, x, 0.755, h, clock, l);
  });
  layer(s, cam, 0.2, () => {
    paint(c, s.tone(0.32)); banyan(c, 1.4, 0.83, 0.52, clock);
    paint(c, s.tone(0.34)); palm(c, -0.56, 0.83, 0.44, clock, 0.16); palm(c, -0.38, 0.83, 0.36, clock, -0.08);
  });
  // the ground, with a dusty track along it
  paint(c, s.tone(0.16)); c.fillRect(-3, GROUND, s.W + 6, 2);
  paint(c, s.tone(0.26)); c.fillRect(-3, GROUND, s.W + 6, 0.005);
  paint(c, s.tone(0.1)); tufts(c, -1.2, 2.6, GROUND + 0.006, 0.026, 4, clock, 46);
}

/** Motes of dust turning in the sunlight. */
function motes(s: Stage, x0: number, y0: number, w: number, h: number, n: number, size: number) {
  if (s.still) return;
  const c = s.c;
  c.save();
  emit(s.clock, n, 7, (a, r1, r2) => {
    const x = x0 + r1 * w + noise(s.clock * 0.3 + r2 * 40) * w * 0.05;
    const y = y0 + h - a * h * (0.4 + r2 * 0.4);
    c.fillStyle = css([255, 240, 200], 0.7 * Math.sin(Math.PI * a));
    c.beginPath(); c.arc(x, y, size * (0.6 + r2), 0, TAU); c.fill();
  }, 3);
  c.restore();
}

/* ---------------------------------------------------------------- the elephant */
/** The toolkit's elephant, in its own units (100 = its height, x towards its face, y up). */
const BODY: P[] = [[-62, 56], [-60, 78], [-40, 92], [-10, 96], [22, 98], [42, 96], [58, 104], [74, 98], [80, 84], [78, 70], [66, 58], [50, 40], [20, 36], [-20, 36], [-50, 40]];
const EAR: P[] = [[0, 4], [-14, 6], [-26, -2], [-28, -22], [-20, -40], [-8, -42], [0, -30], [4, -10]];
/** the tusk, as the toolkit draws it */
const tuskPath = (c: C) => { c.beginPath(); c.moveTo(72, 64); c.quadraticCurveTo(86, 56, 98, 64); c.quadraticCurveTo(86, 52, 70, 59); c.closePath(); };
/** a point along the tusk, 0 at its root, 1 at its point */
const tuskAt = (k: number): P => quad([71, 61.5], [85, 55.5], [98, 64], k);
/** the near front leg and the near hind leg of a standing elephant: x, width */
const LEGS: [number, number][] = [[28, 16], [-36, 16]];
/** the height of the back at x */
const BACK: P[] = [[-56, 80], [-40, 89], [-25, 93.5], [-10, 95.4], [6, 96.8], [22, 97.4], [34, 97]];
const backAt = (x: number) => { for (let i = 1; i < BACK.length; i++) if (x <= BACK[i][0]) { const k = (x - BACK[i - 1][0]) / (BACK[i][0] - BACK[i - 1][0]); return lerp(BACK[i - 1][1], BACK[i][1], k); } return 97; };

interface Jumbo {
  x: number; h: number; t: number; face?: 1 | -1;
  curl?: number; wiggle?: number; lift?: number;
  /** the ear: 0 lying flat … 1 swung out, edge on (left out: an idle flap) */
  ear?: number;
  /** the tail's swing in radians (left out: an idle swish), or where (world) a hand holds it */
  tail?: number; pull?: P | null;
  /** a rim of gold light round the whole animal */
  rim?: number;
}
interface Frame { u: number; f: 1 | -1; W: (p: P) => P; L: (w: P) => P }
function frameOf(o: Jumbo): Frame {
  const u = o.h / 100, f = o.face ?? -1;
  return { u, f, W: (p) => [o.x + f * p[0] * u, GROUND - p[1] * u], L: (w) => [(w[0] - o.x) / (u * f), (GROUND - w[1]) / u] };
}
/** Draw in the elephant's own units. */
function local(c: C, o: Jumbo, fn: () => void) {
  const u = o.h / 100;
  c.save(); c.translate(o.x, GROUND); c.scale((o.face ?? -1) * u, -u); fn(); c.restore();
}
const earOf = (o: Jumbo) => o.ear ?? 0.14 + 0.12 * Math.sin(o.t * 2.6);
/** the ear's outline: swung about its root at the back of the head */
const earPts = (e: number): P[] => EAR.map(([x, y]) => [52 + x * (1 - 0.6 * e) - 2 * e, 88 + y * (1 + 0.05 * e)] as P);
/** The tail, as a line of points from its root: hanging and swinging, or held taut by a hand with the rest hanging below. */
function tailPts(o: Jumbo, F: Frame): P[] {
  const R: P = [-60, 70];
  const pts: P[] = [];
  if (o.pull) {
    const H = F.L(o.pull);
    const d = Math.hypot(H[0] - R[0], H[1] - R[1]);
    for (let i = 0; i <= 8; i++) { const v = i / 8, sag = Math.sin(v * Math.PI) * Math.max(0, 40 - d) * 0.25; pts.push([lerp(R[0], H[0], v), lerp(R[1], H[1], v) - sag]); }
    const rest = Math.max(5, 40 - d);
    pts.push([H[0] - 1, H[1] - rest * 0.5], [H[0] - 2, H[1] - rest]);
    return pts;
  }
  const a = o.tail ?? 0.22 * Math.sin(o.t * 2.2);
  const tip: P = [R[0] - 40 * Math.sin(a + 0.14), R[1] - 40 * Math.cos(a + 0.14)];
  const ctl: P = [R[0] - 9 - 14 * Math.sin(a * 0.5), R[1] - 16];
  for (let i = 0; i <= 10; i++) pts.push(quad(R, ctl, tip, i / 10));
  return pts;
}
/** A tapering tail with a tuft of hair at its end. */
function drawTail(c: C, pts: P[]) {
  const n = pts.length - 1;
  for (let i = 0; i < n; i++) bone(c, pts[i], pts[i + 1], lerp(3.6, 1.6, i / n), lerp(3.6, 1.6, (i + 1) / n));
  const e = pts[n], p = pts[n - 1], a = Math.atan2(e[1] - p[1], e[0] - p[0]);
  c.beginPath(); c.moveTo(e[0] + Math.cos(a + 1.6) * 1.2, e[1] + Math.sin(a + 1.6) * 1.2);
  c.quadraticCurveTo(e[0] + Math.cos(a + 0.5) * 5, e[1] + Math.sin(a + 0.5) * 5, e[0] + Math.cos(a) * 9, e[1] + Math.sin(a) * 9);
  c.quadraticCurveTo(e[0] + Math.cos(a - 0.5) * 5, e[1] + Math.sin(a - 0.5) * 5, e[0] + Math.cos(a - 1.6) * 1.2, e[1] + Math.sin(a - 1.6) * 1.2);
  c.closePath(); c.fill();
}
/** The silhouette: the toolkit's elephant with its own ear and tail. */
function shape(c: C, o: Jumbo, F: Frame, fill: string, ivory: string): ElephantParts {
  paint(c, fill);
  c.save();
  // the toolkit's tail is cut away; this one can be caught and pulled
  local(c, o, () => { c.beginPath(); c.rect(-63, -40, 280, 260); });
  c.clip();
  const parts = drawElephant(c, { x: o.x, y: GROUND, h: o.h, face: F.f, curl: o.curl, wiggle: o.wiggle, lift: o.lift, flap: 0, swing: 0, t: o.t, ivory });
  c.restore();
  paint(c, fill);
  local(c, o, () => { c.beginPath(); outline(c, earPts(earOf(o))); c.fill(); drawTail(c, tailPts(o, F)); });
  return parts;
}
/** Incised detail, black-figure fashion: eye and lid, mouth, the ear's edge and veins, trunk rings, knees, toenails, folds. */
function incise(c: C, o: Jumbo, E: ElephantParts, F: Frame, cut: string, small: boolean) {
  local(c, o, () => {
    paint(c, cut); c.lineCap = 'round'; c.lineJoin = 'round';
    const lw = small ? 1.3 : 0.95;
    c.lineWidth = lw;
    ell(c, 66, 82, 2.2, 1.6);
    c.beginPath(); c.arc(65.5, 81.4, 4.4, 0.45, Math.PI - 0.35); c.stroke();
    c.beginPath(); c.moveTo(71, 66.5); c.quadraticCurveTo(65, 62, 59, 65.5); c.stroke();
    // the ear: its rim, and the veins that fan out from its root
    const ep = earPts(earOf(o));
    c.lineWidth = lw * 1.25; c.beginPath(); outline(c, ep); c.stroke();
    c.lineWidth = lw * 0.8;
    for (const k of [2, 3, 4]) { const a = mid(ep[0], ep[7], 0.4), b = mid(a, ep[k], 0.75); c.beginPath(); c.moveTo(a[0], a[1]); c.quadraticCurveTo(lerp(a[0], b[0], 0.5) + 2, lerp(a[1], b[1], 0.5), b[0], b[1]); c.stroke(); }
    // rings down the trunk
    const tr = E.trunk.map(F.L);
    c.lineWidth = lw * 0.85;
    for (let i = 2; i < tr.length - 1; i++) {
      const p = tr[i], q = tr[i + 1], d = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1;
      const nx = -(q[1] - p[1]) / d, ny = (q[0] - p[0]) / d, w = (13 - i * 0.75) * 0.36;
      c.beginPath(); c.moveTo(p[0] + nx * w, p[1] + ny * w); c.quadraticCurveTo(p[0] + (q[0] - p[0]) * 0.25, p[1] + (q[1] - p[1]) * 0.25, p[0] - nx * w, p[1] - ny * w); c.stroke();
    }
    // knees and toenails of the near legs
    for (const [lx, w] of LEGS) {
      c.lineWidth = lw * 0.85;
      for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(lx - w * 0.34, 19 + k * 3.2); c.quadraticCurveTo(lx, 17.4 + k * 3.2, lx + w * 0.34, 19 + k * 3.2); c.stroke(); }
      for (let k = -1; k <= 1; k++) { c.beginPath(); c.arc(lx + 2.5 + k * 4.2, 0.4, 1.5, 0.15, Math.PI - 0.15); c.stroke(); }
    }
    // where the shoulder and the haunch meet the body
    c.lineWidth = lw;
    c.beginPath(); c.moveTo(40, 40); c.quadraticCurveTo(45, 56, 37, 72); c.stroke();
    c.beginPath(); c.moveTo(-24, 37); c.quadraticCurveTo(-28, 58, -46, 72); c.stroke();
    c.beginPath(); c.moveTo(-6, 42); c.quadraticCurveTo(4, 46, 14, 43); c.stroke();
  });
}
interface Beast extends ElephantParts { F: Frame; tailW: P[]; earW: P[]; trunkL: P[] }
/** The elephant, with an optional rim of gold round it; returns where its parts are. */
function jumbo(s: Stage, o: Jumbo, key: number): Beast {
  const c = s.c, F = frameOf(o);
  const rim = o.rim ?? 0;
  if (rim > 0.01) {
    const m = F.W([6, 64]);
    glow(c, m[0], m[1], o.h * 1.35, GOLD, 0.65 * rim);
    const gold = css(mixRGB(GOLD, [255, 232, 176], 0.35), Math.min(1, rim));
    for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; c.save(); c.translate(Math.cos(a) * key * 2, Math.sin(a) * key * 2); shape(c, o, F, gold, gold); c.restore(); }
  }
  const E = shape(c, o, F, s.ink, css(mixRGB(s.screen, [255, 249, 232], 0.5)));
  incise(c, o, E, F, s.tone(0.8), s.small);
  return { ...E, F, tailW: tailPts(o, F).map(F.W), earW: earPts(earOf(o)).map(F.W), trunkL: E.trunk.map(F.L) };
}

/* ---------------------------------------------------------------- what each man makes of his part, drawn in gold over it */
/** Courses of bricks spreading over the flank from where the hands are. */
function bricksOn(c: C, o: Jumbo, at: P, R: number, a: number) {
  if (R <= 0.5 || a <= 0.01) return;
  c.save();
  c.beginPath(); outline(c, BODY); outline(c, earPts(earOf(o))); c.clip('evenodd');
  const g = c.createRadialGradient(at[0], at[1], 0, at[0], at[1], R);
  g.addColorStop(0, css(GOLD, a)); g.addColorStop(0.7, css(GOLD, a * 0.75)); g.addColorStop(1, css(GOLD, 0));
  c.strokeStyle = g; c.lineWidth = 1.2; c.lineCap = 'butt';
  const bh = 7.6, bw = 15;
  for (let r = 0; r < 10; r++) {
    const y = 35 + r * bh;
    line(c, [-72, y], [92, y]);
    for (let x = -72 + (r % 2) * bw * 0.5; x < 92; x += bw) line(c, [x, y], [x, y + bh]);
  }
  c.restore();
}
/** The tusk turns to bright metal, a blade round its point. */
function spearOn(c: C, a: number) {
  if (a <= 0.01) return;
  c.save();
  tuskPath(c);
  const g = c.createLinearGradient(70, 60, 99, 64);
  g.addColorStop(0, css(GOLD, 0)); g.addColorStop(0.5, css(GOLD, 0.6 * a)); g.addColorStop(1, css([255, 244, 214], a));
  c.fillStyle = g; c.fill();
  c.strokeStyle = css(GOLD, a); c.lineWidth = 1; c.lineJoin = 'round';
  c.beginPath(); c.moveTo(82, 59.4); c.quadraticCurveTo(90, 66.5, 102, 65.4); c.quadraticCurveTo(92, 53.5, 82, 59.4); c.stroke();
  for (let i = 0; i < 3; i++) line(c, [77.5 + i * 1.7, 56.6], [78 + i * 1.7, 62.4]);
  c.restore();
}
/** Scales down the trunk, an eye and a flickering tongue at its tip: a snake. */
function scalesOn(c: C, tr: P[], a: number, t: number, still: boolean) {
  if (a <= 0.01) return;
  c.save(); c.strokeStyle = css(GOLD, a); c.fillStyle = css(GOLD, a); c.lineWidth = 0.9; c.lineCap = 'round'; c.lineJoin = 'round';
  for (let i = 1; i < tr.length - 1; i++) {
    const p = tr[i], q = tr[i + 1], d = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1;
    const ux = (q[0] - p[0]) / d, uy = (q[1] - p[1]) / d, nx = -uy, ny = ux, w = (13 - i * 0.75) * 0.34;
    const m = mid(p, q);
    c.beginPath(); c.moveTo(m[0] + nx * w - ux * 1.8, m[1] + ny * w - uy * 1.8); c.lineTo(m[0] + ux * 1.2, m[1] + uy * 1.2); c.lineTo(m[0] - nx * w - ux * 1.8, m[1] - ny * w - uy * 1.8); c.stroke();
  }
  const e = tr[tr.length - 1], p = tr[tr.length - 2], d = Math.hypot(e[0] - p[0], e[1] - p[1]) || 1;
  const ux = (e[0] - p[0]) / d, uy = (e[1] - p[1]) / d;
  ell(c, e[0] - ux * 3 - uy * 1.6, e[1] - uy * 3 + ux * 1.6, 1.3, 1.3);
  const fl = still ? 0.8 : Math.max(0, Math.sin(t * 9));
  if (fl > 0.1) {
    c.strokeStyle = css(RED, a); c.lineWidth = 0.8;
    const b: P = [e[0] + ux * (3 + 5 * fl), e[1] + uy * (3 + 5 * fl)];
    line(c, [e[0] + ux * 2.5, e[1] + uy * 2.5], b);
    line(c, b, [b[0] + ux * 2.4 - uy * 1.6, b[1] + uy * 2.4 + ux * 1.6]);
    line(c, b, [b[0] + ux * 2.4 + uy * 1.6, b[1] + uy * 2.4 - ux * 1.6]);
  }
  c.restore();
}
/** Bark up the leg, roots creeping over the ground, leaves budding on the belly above: a tree. */
function barkOn(c: C, a: number, roots: number, leaves: number) {
  if (a <= 0.01) return;
  c.save(); c.strokeStyle = css(GOLD, a); c.fillStyle = css(GOLD, a); c.lineWidth = 0.9; c.lineCap = 'round';
  for (const bx of [22.5, 27, 31.5]) {
    c.beginPath();
    for (let y = 3; y <= 44; y += 1.5) c.lineTo(bx + Math.sin(y * 0.42 + bx) * 0.9, y);
    c.stroke();
  }
  for (let i = 0; i < 6; i++) {
    const side = i % 2 ? 1 : -1, len = (10 + 9 * hash(i, 3)) * roots;
    if (len < 0.5) continue;
    const x0 = 28 + side * 6, pts: P[] = [[x0, 1]];
    for (let k = 1; k <= 5; k++) pts.push([x0 + side * len * (k / 5), 1 - k * (0.5 + hash(i, 5) * 0.9) + Math.sin(k * 1.7 + i) * 0.6]);
    smooth(c, pts); c.stroke();
  }
  for (let i = 0; i < 11; i++) {
    const lk = seg(leaves, i / 14, i / 14 + 0.3);
    if (lk <= 0) continue;
    ell(c, 2 + i * 5.4 + Math.sin(i * 2.3) * 1.6, 40.5 + Math.sin(i * 1.7) * 2.2, 2.4 * lk, 1.2 * lk, 0.6 + i * 0.7);
  }
  c.restore();
}
/** Ribs fanning out across the ear from its root: a fan. */
function ribsOn(c: C, e: number, a: number) {
  if (a <= 0.01) return;
  const ep = earPts(e);
  c.save(); c.beginPath(); outline(c, ep); c.clip();
  c.strokeStyle = css(GOLD, a); c.lineWidth = 1.1; c.lineCap = 'round';
  const root: P = [ep[0][0] + 1, ep[0][1] - 1];
  for (let i = 1; i <= 6; i++) { const q = along([ep[1], ep[2], ep[3], ep[4], ep[5]], (i - 0.5) / 6); line(c, root, mid(root, q, 1.1)); }
  c.lineWidth = 1.4; c.beginPath(); outline(c, ep); c.stroke();
  c.restore();
}
/** Strands twisted round the tail, and a frayed end: a rope. */
function twistOn(c: C, pts: P[], a: number) {
  if (a <= 0.01) return;
  c.save(); c.strokeStyle = css(GOLD, a); c.lineWidth = 0.8; c.lineCap = 'round';
  for (let i = 0; i < pts.length - 1; i++) {
    const p = pts[i], q = pts[i + 1], d = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1;
    const ux = (q[0] - p[0]) / d, uy = (q[1] - p[1]) / d, nx = -uy, ny = ux;
    for (let v = 0; v < d; v += 2.6) {
      const m: P = [p[0] + ux * v, p[1] + uy * v], w = lerp(1.9, 1.0, i / pts.length);
      line(c, [m[0] + nx * w - ux * 0.9, m[1] + ny * w - uy * 0.9], [m[0] - nx * w + ux * 0.9, m[1] - ny * w + uy * 0.9]);
    }
  }
  const e = pts[pts.length - 1], p = pts[pts.length - 2], an = Math.atan2(e[1] - p[1], e[0] - p[0]);
  for (let k = -2; k <= 2; k++) line(c, e, [e[0] + Math.cos(an + k * 0.28) * 9, e[1] + Math.sin(an + k * 0.28) * 9]);
  c.restore();
}

/* ---------------------------------------------------------------- the pictures in their bubbles */
const BRICKS: Icon = (c) => {
  for (let r = 0; r < 4; r++) {
    const y = -0.76 + r * 0.38, off = r % 2 ? -0.3 : 0;
    for (let i = 0; i < 5; i++) {
      const x0 = Math.max(-0.9, -0.9 + off + i * 0.6 + 0.035), x1 = Math.min(0.9, -0.9 + off + (i + 1) * 0.6 - 0.035);
      if (x1 - x0 > 0.1) { c.beginPath(); c.roundRect(x0, y + 0.04, x1 - x0, 0.3, 0.05); c.fill(); }
    }
  }
};
const SPEAR: Icon = (c) => {
  c.save(); c.rotate(0.72);
  c.beginPath(); c.roundRect(-0.055, -0.42, 0.11, 1.38, 0.05); c.fill();
  c.beginPath(); c.moveTo(0, -1.04); c.bezierCurveTo(0.24, -0.78, 0.2, -0.52, 0, -0.4); c.bezierCurveTo(-0.2, -0.52, -0.24, -0.78, 0, -1.04); c.fill();
  c.fillRect(-0.12, -0.44, 0.24, 0.08);
  c.restore();
};
/** A cobra, hood spread, its tongue flickering. */
const COBRA = (t: number): Icon => (c) => {
  c.beginPath(); c.ellipse(-0.05, 0.68, 0.74, 0.2, 0, 0, TAU); c.fill();
  c.lineWidth = 0.24; c.beginPath(); c.moveTo(0.45, 0.62); c.bezierCurveTo(0.8, 0.25, -0.18, 0.28, 0.02, -0.2); c.stroke();
  c.beginPath(); c.moveTo(0.03, 0.05); c.bezierCurveTo(-0.42, -0.1, -0.36, -0.66, 0.05, -0.74); c.bezierCurveTo(0.44, -0.66, 0.46, -0.1, 0.03, 0.05); c.fill();
  c.beginPath(); c.ellipse(0.14, -0.8, 0.19, 0.13, 0.25, 0, TAU); c.fill();
  c.save(); c.fillStyle = PAPER; c.beginPath(); c.arc(0.17, -0.84, 0.035, 0, TAU); c.fill();
  c.strokeStyle = PAPER; c.lineWidth = 0.04; c.beginPath(); c.arc(0.04, -0.38, 0.12, 0, TAU); c.stroke(); c.restore();
  const fl = Math.max(0, Math.sin(t * 9));
  if (fl > 0.15) { c.save(); c.strokeStyle = css(RED); c.lineWidth = 0.06; const bx = 0.32 + 0.18 * fl; c.beginPath(); c.moveTo(0.3, -0.76); c.lineTo(bx, -0.74); c.lineTo(bx + 0.1, -0.82); c.moveTo(bx, -0.74); c.lineTo(bx + 0.1, -0.66); c.stroke(); c.restore(); }
};
const TREE: Icon = (c) => {
  c.beginPath(); c.moveTo(-0.34, 0.92); c.quadraticCurveTo(-0.1, 0.78, -0.11, 0.12); c.lineTo(0.11, 0.12); c.quadraticCurveTo(0.1, 0.78, 0.34, 0.92); c.closePath(); c.fill();
  for (const [x, y, r] of [[0, -0.46, 0.4], [-0.44, -0.16, 0.32], [0.44, -0.16, 0.32], [-0.22, 0.08, 0.3], [0.22, 0.08, 0.3], [0, -0.1, 0.36]] as [number, number, number][]) { c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); }
};
/** A palm-leaf hand fan, waving. */
const FAN = (t: number): Icon => (c) => {
  c.save(); c.translate(0, 0.5); c.rotate(Math.sin(t * 7) * 0.22);
  c.beginPath(); c.roundRect(-0.07, 0, 0.14, 0.46, 0.05); c.fill();
  c.beginPath(); c.moveTo(0, 0.04); c.arc(0, 0.04, 1.0, Math.PI * 1.17, Math.PI * 1.83); c.closePath(); c.fill();
  c.strokeStyle = PAPER; c.lineWidth = 0.05;
  for (let i = 1; i < 6; i++) { const a = Math.PI * (1.17 + (i / 6) * 0.66); c.beginPath(); c.moveTo(Math.cos(a) * 0.2, 0.04 + Math.sin(a) * 0.2); c.lineTo(Math.cos(a) * 0.9, 0.04 + Math.sin(a) * 0.9); c.stroke(); }
  c.restore();
};
/** A coil of rope, its end hanging free and frayed. */
const ROPE: Icon = (c) => {
  c.lineWidth = 0.15;
  for (let i = 0; i < 4; i++) { c.beginPath(); c.ellipse(-0.14, -0.36 + i * 0.13, 0.62 - i * 0.03, 0.24, 0, 0, TAU); c.stroke(); }
  c.beginPath(); c.moveTo(0.42, -0.02); c.bezierCurveTo(0.72, 0.24, 0.42, 0.5, 0.56, 0.76); c.stroke();
  c.lineWidth = 0.05; for (let i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(0.56, 0.74); c.lineTo(0.56 + i * 0.12, 0.98); c.stroke(); }
};

/* ---------------------------------------------------------------- the six */
interface Look { h: number; hat?: Body['hat']; head?: Body['head']; beard?: boolean; robe: Body['robe']; stoop?: number }
/** Told apart by their shapes: I a big bearded man in a turban; II a lean youth with a topknot; III a bearded man in a cap; IV an old bald sage; V a young man in a turban and cloak; VI a short man in a shawl. */
const MEN: Look[] = [
  { h: 0.32, hat: 'turban', beard: true, robe: 'long' },
  { h: 0.3, hat: 'topknot', robe: 'short' },
  { h: 0.28, hat: 'cap', beard: true, robe: 'short' },
  { h: 0.27, head: 'bald', beard: true, robe: 'long', stoop: 8 },
  { h: 0.29, hat: 'turban', robe: 'cloak' },
  { h: 0.26, hat: 'hood', beard: true, robe: 'short' },
];
function man(s: Stage, i: number, b: Partial<Body>): Body {
  const m = MEN[i];
  return { x: 0, y: GROUND, h: m.h, face: 1, robe: m.robe, hat: m.hat ?? null, head: m.head ?? 'human', beard: !!m.beard, eye: 'blind', cut: s.tone(0.8), t: s.clock + i * 1.3, ...b, lean: (m.stoop ?? 0) + (b.lean ?? 0) };
}
/** Draw a man (and whatever he holds); `key` cuts a thin line of light round him so he reads in front of the dark elephant. */
function puppet(s: Stage, b: Body, key = 0, held?: (j: Joints) => void): Joints {
  const c = s.c;
  if (key > 0) {
    const col = s.tone(0.92), plain: Body = { ...b, cut: undefined };
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU;
      c.save(); c.translate(Math.cos(a) * key, Math.sin(a) * key); paint(c, col);
      const j = person(c, plain); held?.(j);
      c.restore();
    }
  }
  paint(c, s.ink);
  const j = person(c, b);
  paint(c, s.ink);
  held?.(j);
  return j;
}
/** A cane from the hand to its tip. */
function caneTo(c: C, hand: P, tip: P, w: number) {
  const dx = tip[0] - hand[0], dy = tip[1] - hand[1], d = Math.hypot(dx, dy) || 1;
  c.lineWidth = w; c.lineCap = 'round';
  line(c, [hand[0] - (dx / d) * w * 2.5, hand[1] - (dy / d) * w * 2.5], tip);
}
/** A cane lying or falling: centred at p, at angle a. */
function caneAt(c: C, p: P, a: number, len: number, w: number) {
  c.lineWidth = w; c.lineCap = 'round';
  line(c, [p[0] - Math.cos(a) * len / 2, p[1] - Math.sin(a) * len / 2], [p[0] + Math.cos(a) * len / 2, p[1] + Math.sin(a) * len / 2]);
}
/** A tapping cane: where its tip is (swept ahead, lifted and tapped down) and how long since it last touched the ground. */
function tapping(x: number, face: 1 | -1, reach: number, time: number, rate = 1.1): { tip: P; age: number } {
  const ph = (time * rate) % 1;
  const lift = Math.max(0, Math.sin(ph * TAU)) * 0.014;
  return { tip: [x + face * (reach + 0.018 * Math.sin(time * rate * Math.PI)), GROUND - lift], age: ph > 0.5 ? (ph - 0.5) * 2 : 1 };
}
/** The little click of a cane on the ground. */
function tick(c: C, p: P, age: number, size: number, color: string) {
  if (age >= 1) return;
  c.save(); c.strokeStyle = color; c.lineWidth = size * 0.12; c.globalAlpha = 1 - age; c.lineCap = 'round';
  for (const sgn of [-1, 1]) { c.beginPath(); c.arc(p[0], p[1], size * (0.4 + age * 0.8), -Math.PI / 2 + sgn * 0.35 - 0.3, -Math.PI / 2 + sgn * 0.35 + 0.3); c.stroke(); }
  c.restore();
}
/** A thought, above and to one side of a head, sized for the camera. */
function thought(s: Stage, cam: Cam, head: P, icon: Icon | Icon[], k: number, side = -1, up = 0.15, r = 0.068) {
  bubble(s.c, { x: head[0] + side * px(cam, 0.075), y: head[1] - px(cam, up), r: px(cam, r), kind: 'thought', to: [head[0], head[1] - px(cam, 0.03)], k, ink: s.ink, icon, scale: 0.74 });
}
/** Lines of a shout, from a mouth. */
function shout(c: C, mouth: P, face: 1 | -1, size: number, k: number, color: string) {
  if (k <= 0.01) return;
  c.save(); c.strokeStyle = color; c.lineWidth = size * 0.1; c.lineCap = 'round'; c.globalAlpha = k;
  for (let i = -1; i <= 1; i++) { const a = (face > 0 ? 0 : Math.PI) + i * 0.45 * face - 0.25 * face; line(c, [mouth[0] + Math.cos(a) * size * 0.5, mouth[1] + Math.sin(a) * size * 0.5], [mouth[0] + Math.cos(a) * size * 1.1, mouth[1] + Math.sin(a) * size * 1.1]); }
  c.restore();
}
const talk = (s: Stage, on: boolean, rate = 14) => (on && !s.still ? 0.45 + 0.4 * Math.sin(s.clock * rate) : 0);
/** A small bird on the elephant's back, which flies off when `fly` goes from 0 to 1. */
function perch(s: Stage, el: Beast, at: number, fly: number, hop = 0) {
  const c = s.c, p = el.F.W([at, backAt(at) - 0.6]), f = el.F.f;
  paint(c, s.ink);
  if (fly <= 0) { bird(c, p[0], p[1] - hop * el.F.u * 6, el.F.u * 11, null, f); return; }
  const q: P = [p[0] - f * fly * 0.6, p[1] - fly * 0.45 - Math.sin(fly * 6) * 0.02];
  bird(c, q[0], q[1], el.F.u * 13, s.clock * 2.8, f === -1 ? 1 : -1);
}
/** A puff of dust. */
function dust(s: Stage, x: number, y: number, size: number, age: number) {
  if (age <= 0 || age >= 1) return;
  const c = s.c;
  c.save();
  for (let i = 0; i < 5; i++) {
    const a = Math.PI + (i / 4) * Math.PI, r = size * (0.3 + age) * (0.7 + 0.3 * hash(i, 2));
    c.fillStyle = css(mixRGB(s.screen, [150, 120, 90], 0.35), 0.5 * (1 - age));
    c.beginPath(); c.arc(x + Math.cos(a) * r, y + Math.sin(a) * r * 0.5, size * (0.25 + age * 0.4), 0, TAU); c.fill();
  }
  c.restore();
}

/* ================================================================ the scenes */
const EX = 0.74, EH = 0.46;

/** I. Six men of Indostan: blind, in single file, a hand on the shoulder ahead; a rumble stops them; the camera shows what they cannot see; they go to it, hands out. */
const FILE = [5, 0, 3, 4, 1, 2];
const FAN_AT = [0.71, 0.57, 0.44, 0.32, 0.21, 0.1];
const theSix: SceneFn = (s) => {
  const { t, c, clock } = s;
  const walked = Math.min(t, 3.7) + Math.max(0, Math.min(t, 8.3) - 5.4);
  const lead = -0.12 + 0.086 * walked;
  const pull = ease(seg(t, 3.9, 7.4));
  const cam = aim(s, lerp(-0.32 + 0.086 * Math.min(t, 3.9), 0.57, pull), lerp(0.6, 0.5, pull), lerp(1.6, 0.97, pull) + 0.03 * seg(t, 7.4, 11));
  morning(s, cam, { light: [0.2, 0.3], warm: 0.15, sun: [0.17, 0.27], r: 1.7 });
  const key = keyOf(s, cam);
  // the elephant: it sways and swishes; as they come, it lifts its trunk to smell them
  const sniff = ease(seg(t, 6.4, 8.8));
  const E: Jumbo = { x: 0.9, h: 0.4, t: clock, lift: lerp(0.04 + 0.1 * Math.sin(clock * 0.9), 1.0 + 0.1 * Math.sin(clock * 1.3), sniff), curl: lerp(0.07, 0.13, sniff), wiggle: lerp(0.25, 0.14, sniff) };
  const el = jumbo(s, E, key);
  perch(s, el, -14, 0, Math.max(0, Math.sin(clock * 5)) * (Math.sin(clock * 0.7) > 0.6 ? 1 : 0));
  // its low rumble, rolling across to the men
  const mouth = el.F.W([70, 66]);
  if (t > 2.6 && t < 4.8) sound(c, mouth[0] - 0.01, mouth[1], 0.06, clock, Math.PI, seg(t, 2.6, 2.9) * (1 - seg(t, 4.3, 4.8)), s.tone(0.35));
  const go = seg(t, 2.8, 4.0);
  if (go > 0 && go < 1) sound(c, lerp(mouth[0] - 0.08, lead + 0.05, go), lerp(mouth[1], GROUND - 0.25, go), 0.05, clock, Math.PI, 1 - go * 0.4, s.tone(0.3), 0.6);
  // the six
  const heads: P[] = [], mouths: P[] = [];
  let ahead: Joints | null = null;
  FILE.forEach((i, k) => {
    const m = MEN[i];
    const fan = ease(seg(t, 8.0 + k * 0.12, 10.3 + k * 0.1));
    const x = lerp(lead - 0.1 * k, FAN_AT[k], fan);
    const stepping = t < 3.7 + k * 0.05 || (t > 5.4 && t < 8.3) || (fan > 0.02 && fan < 0.98);
    const hear = ease(seg(t, 3.75 + k * 0.05, 4.2 + k * 0.05)) * (1 - ease(seg(t, 5.1, 5.5)));
    const out = ease(seg(t, 7.9 + k * 0.12, 8.8 + k * 0.12));
    const grope = s.still ? 0 : Math.sin(clock * 2.6 + k * 1.3) * 0.012;
    const b: Partial<Body> = { x, face: 1, ...(stepping ? walk(clock * 0.9 + k * 0.37, 0.7) : {}), tilt: -16 * hear - 8 * out, mouth: out > 0.5 ? 0.25 : 0 };
    if (out > 0.01) {
      b.reach = mid([x + 0.03, GROUND - m.h * 0.3], [x + 0.09, GROUND - m.h * 0.68 + grope], out);
      b.reach2 = mid([x - 0.01, GROUND - m.h * 0.3], [x + 0.08, GROUND - m.h * 0.8 - grope], out);
    } else if (k > 0 && ahead) b.reach = [ahead.neck[0] - 0.012, ahead.neck[1] + 0.014];
    let tap: { tip: P; age: number } | null = null;
    if (k === 0 && out <= 0.01) {
      tap = tapping(x, 1, 0.15, clock, stepping ? 1.1 : 0);
      b.reach = [x + 0.06, GROUND - m.h * 0.45];
      if (hear > 0) b.arm2 = [lerp(-6, 118, hear), lerp(8, 24, hear)];
    }
    const front = x > 0.5;
    const tp = tap;
    const j = puppet(s, man(s, i, b), front ? key : 0, tp ? (jj) => caneTo(c, jj.hand, tp.tip, 0.005) : undefined);
    if (tp && stepping) tick(c, tp.tip, tp.age, 0.03, s.tone(0.3));
    heads.push(j.head); mouths.push(j.mouth);
    ahead = j;
  });
  // "What was that?"
  [0, 2, 4].forEach((k, n) => thought(s, cam, heads[k], Q, shown(t, 4.0 + n * 0.2, 6.2), 1, 0.14, 0.06));
  motes(s, -0.3, 0.2, 1.8, 0.6, s.small ? 10 : 22, 0.0022);
  s.spill(0.17, 0.27, 0.45, [255, 214, 150]);
};

/** II. The side: the first trips, falls against the great flank, pushes, knocks — and spreads his palms on a wall. */
const theSide: SceneFn = (s) => {
  const { t, c, clock } = s;
  const cam = shoot(s, [[0, 0.64, 0.6, 1.8], [2.6, 0.72, 0.6, 2.0], [7, 0.76, 0.59, 2.12]]);
  morning(s, cam, { light: [0.7, 0.34], warm: 0.42, r: 1.2 });
  const key = keyOf(s, cam);
  const HIT = 2.62;
  const jolt = seg(t, HIT, HIT + 0.12) * (1 - seg(t, HIT + 0.3, HIT + 1.3));
  const E: Jumbo = { x: EX, h: EH, t: clock, lift: -0.12, curl: 0.06, wiggle: 0.2, ear: 0.14 + 0.12 * Math.sin(clock * 2.6) + 0.55 * jolt, tail: 0.22 * Math.sin(clock * 2.2) + 0.7 * jolt };
  const el = jumbo(s, E, key);
  const startle = seg(t, HIT, HIT + 1.4);
  perch(s, el, -18, 0, startle > 0 && startle < 1 ? Math.sin(startle * Math.PI) * 2.2 : 0);
  // the stone he trips on
  paint(c, s.tone(0.1)); c.beginPath(); c.ellipse(0.733, GROUND + 0.004, 0.017, 0.012, 0, Math.PI, 0); c.fill();
  // where his palms land, and how they wander after
  const P1: P = [0.802, 0.565], P2: P = [0.786, 0.614];
  const slide = ease(seg(t, 5.0, 6.4));
  const knock = t > 3.9 && t < 5.0 ? Math.max(0, Math.sin((t - 3.9) * TAU * 1.5)) : 0;
  const p1: P = [P1[0] - 0.02 * knock + 0.03 * slide, P1[1] - 0.045 * slide];
  const p2: P = [P2[0] + 0.035 * slide, P2[1] + 0.008 * slide];
  // the overlay: courses of bricks spread from his hands
  const spread = easeOut(seg(t, 3.9, 6.6));
  local(c, E, () => bricksOn(c, E, el.F.L(P1), 8 + spread * 64, Math.min(1, spread * 3)));
  // the man
  const walkK = Math.min(t, 2.3);
  const fall = ease(seg(t, 2.3, HIT));
  const x = 0.46 + 0.1 * walkK + 0.038 * fall;
  const push = Math.sin(Math.PI * seg(t, 3.0, 3.8));
  const up = ease(seg(t, 5.2, 6.0));
  const b: Partial<Body> = t < 2.3
    ? { x, ...walk(clock * 0.95, 0.75), reach: [x + 0.07, GROUND - 0.15], arm2: [70, 20] }
    : { x, lean: lerp(0, 32, fall) - 6 * up + 6 * push, leg2: [lerp(-10, -34, fall), 30], leg: [lerp(10, 18, fall), 8], reach: mid([x + 0.12, 0.6], p1, fall), reach2: mid([x + 0.1, 0.64], p2, fall), tilt: -14 * up, mouth: talk(s, t > 5.6 && t < 6.9, 12) };
  const tip = tapping(x, 1, 0.14, clock).tip;
  const j = puppet(s, man(s, 0, b), key, t < 2.3 ? (jj) => caneTo(c, jj.hand, tip, 0.0045) : undefined);
  if (t < 2.3) tick(c, tip, tapping(x, 1, 0.14, clock).age, 0.025, s.tone(0.3));
  // the cane flies out of his hand and clatters down
  if (t >= 2.3) {
    const k = easeOut(seg(t, 2.3, 2.85));
    const from: P = [0.69 + 0.07 + 0.03, 0.75], to: P = [0.83, GROUND - 0.004];
    paint(c, s.tone(0.92)); caneAt(c, mid(from, to, k), lerp(-1.1, -0.05, k), 0.13, 0.0045 + key * 2);
    paint(c, s.ink); caneAt(c, mid(from, to, k), lerp(-1.1, -0.05, k), 0.13, 0.0045);
    if (t > 2.85) tick(c, to, seg(t, 2.85, 3.3), 0.03, s.tone(0.3));
  }
  // the thud: rings where his palms strike
  const hit = seg(t, HIT, HIT + 0.7);
  if (hit > 0 && hit < 1) {
    c.save(); c.strokeStyle = s.tone(0.9); c.lineWidth = px(cam, 0.005);
    for (const p of [P1, P2]) for (let r = 0; r < 2; r++) { const a = hit - r * 0.2; if (a > 0) { c.globalAlpha = 1 - a; c.beginPath(); c.arc(p[0], p[1], px(cam, 0.02 + a * 0.06), 0, TAU); c.stroke(); } }
    c.restore();
    dust(s, x, GROUND, px(cam, 0.05), hit);
  }
  // knock, knock
  if (knock > 0.0 || (t > 3.9 && t < 5.1)) {
    for (let n = 0; n < 3; n++) { const at = 3.9 + (n + 0.5) / 1.5; const a = seg(t, at, at + 0.45); if (a > 0 && a < 1) sound(c, P1[0] + 0.012, P1[1] - 0.01, px(cam, 0.035), a * 0.7, -0.6, 1 - a, s.tone(0.9), 0.8); }
  }
  thought(s, cam, j.head, BRICKS, shown(t, 4.3, 7.2), -1, 0.16);
  shout(c, j.mouth, 1, px(cam, 0.03), seg(t, 5.6, 5.9) * (1 - seg(t, 6.8, 7)), s.tone(0.9));
  motes(s, 0.4, 0.3, 0.8, 0.5, s.small ? 8 : 16, 0.0016);
};

/** III. The tusk: the second runs his hand along something smooth and round … to a point that pricks: a spear. */
const theTusk: SceneFn = (s) => {
  const { t, c, clock } = s;
  const cam = shoot(s, [[0, 0.3, 0.62, 2.0], [2.2, 0.32, 0.6, 2.3], [7, 0.33, 0.585, 2.45]]);
  morning(s, cam, { light: [0.3, 0.42], warm: 0.3, r: 1.1 });
  const key = keyOf(s, cam);
  const PRICK = 3.4;
  const ow = seg(t, PRICK, PRICK + 0.12) * (1 - seg(t, PRICK + 0.4, PRICK + 1.4));
  const E: Jumbo = { x: EX, h: EH, t: clock, lift: -0.32 + 0.04 * Math.sin(clock * 0.8), curl: 0.035, wiggle: 0.12, ear: 0.14 + 0.1 * Math.sin(clock * 2.6) + 0.3 * ow };
  const el = jumbo(s, E, key);
  const F = el.F;
  const spear = ease(seg(t, 4.0, 5.2));
  local(c, E, () => spearOn(c, spear));
  // the man: in, groping; finds the tusk; slides along it; pricks his finger on the point
  const x = lerp(0.12, 0.255, ease(seg(t, 0, 1.5))) - 0.012 * ease(seg(t, PRICK, PRICK + 0.3)) * (1 - seg(t, 5, 6));
  const tk = t < 2.0 ? 0.42 : lerp(0.42, 0.985, ease(seg(t, 2.0, PRICK)));
  const onTusk = F.W(tuskAt(tk));
  const tip = F.W([98, 64]);
  const groping: P = [x + 0.06 + 0.012 * Math.sin(clock * 2.4), 0.6 - 0.02 * Math.sin(clock * 1.7)];
  let reach: P;
  if (t < 1.4) reach = groping;
  else if (t < PRICK) reach = mid(groping, onTusk, ease(seg(t, 1.4, 2.0)));
  else if (t < 4.6) { const sh = s.still ? 0 : Math.sin(clock * 30) * 0.008 * (1 - seg(t, 3.8, 4.6)); reach = [tip[0] - 0.03 + sh, tip[1] + 0.05 + sh * 0.5]; }
  else if (t < 5.4) reach = mid([tip[0] - 0.03, tip[1] + 0.05], [x + 0.03, GROUND - 0.29], ease(seg(t, 4.6, 5.0)));
  else reach = mid([x + 0.03, GROUND - 0.29], [x + 0.09, tip[1] + 0.012], ease(seg(t, 5.4, 6.0)));
  const flinch = ease(seg(t, PRICK, PRICK + 0.15)) * (1 - ease(seg(t, PRICK + 0.6, PRICK + 1.4)));
  const walking = t < 1.5;
  const caneTip: P = [x + 0.1, GROUND];
  const j = puppet(s, man(s, 1, { x, ...(walking ? walk(clock * 0.9, 0.7) : {}), reach, reach2: [x + 0.04, GROUND - 0.13], lean: 4 - 14 * flinch, tilt: -10 + 8 * flinch, mouth: flinch > 0.3 ? 0.8 : talk(s, t > 5.6 && t < 6.9, 12) }), 0, (jj) => caneTo(c, jj.hand2, caneTip, 0.0042));
  // smooth: a gleam travels with his fingers along the ivory
  if (t > 2.0 && t < PRICK) {
    const g = Math.sin(Math.PI * seg(t, 2.0, PRICK));
    glow(c, onTusk[0], onTusk[1], px(cam, 0.04), [255, 248, 225], 0.8 * g);
    if (!s.still) for (let i = 0; i < 2; i++) { const a = ((clock * 1.6 + i * 0.5) % 1); paint(c, css([255, 250, 235], 1 - a)); ell(c, onTusk[0] - a * 0.02, onTusk[1] - 0.006 - a * 0.012, px(cam, 0.004), px(cam, 0.004)); }
  }
  // prick! a spark and a bright point of pain
  const pk = seg(t, PRICK, PRICK + 0.6);
  if (pk > 0 && pk < 1) {
    glow(c, tip[0], tip[1], px(cam, 0.07), [255, 210, 160], 1 - pk);
    sparks(c, tip[0], tip[1] + 0.005, px(cam, 0.06), clock, s.still ? 0 : 10, [255, 170, 120]);
    c.save(); c.strokeStyle = css(RED, 1 - pk); c.lineWidth = px(cam, 0.004);
    for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU + 0.3; line(c, [tip[0] + Math.cos(a) * px(cam, 0.012), tip[1] + Math.sin(a) * px(cam, 0.012)], [tip[0] + Math.cos(a) * px(cam, 0.012 + 0.02 * pk + 0.01), tip[1] + Math.sin(a) * px(cam, 0.012 + 0.02 * pk + 0.01)]); }
    c.restore();
  }
  if (spear > 0) {
    const tw = 0.6 + 0.4 * (s.still ? 1 : Math.sin(clock * 5));
    glow(c, tip[0], tip[1], px(cam, 0.05), [255, 244, 214], spear * 0.6 * tw);
    c.save(); c.translate(tip[0], tip[1]); c.rotate(clock * 0.6); c.fillStyle = css([255, 252, 240], spear);
    c.beginPath(); const r = px(cam, 0.02) * tw; c.moveTo(0, -r); c.quadraticCurveTo(0, 0, r, 0); c.quadraticCurveTo(0, 0, 0, r); c.quadraticCurveTo(0, 0, -r, 0); c.quadraticCurveTo(0, 0, 0, -r); c.fill(); c.restore();
  }
  thought(s, cam, j.head, SPEAR, shown(t, 4.1, 7.2), -1, 0.15);
  shout(c, j.mouth, 1, px(cam, 0.03), flinch, s.tone(0.3));
  motes(s, 0.0, 0.3, 0.7, 0.5, s.small ? 8 : 14, 0.0014);
};

/** IV. The trunk: it noses at the third, who grabs it — and it squirms, coils round his arm, hauls him about: a snake. */
const theTrunk: SceneFn = (s) => {
  const { t, c, clock } = s;
  const cam = shoot(s, [[0, 0.28, 0.66, 1.75], [3, 0.27, 0.67, 1.85], [7, 0.26, 0.66, 1.95]]);
  morning(s, cam, { light: [0.2, 0.45], warm: 0.5, r: 1.2 });
  const key = keyOf(s, cam);
  const nose = ease(seg(t, 1.3, 2.0)), grab = ease(seg(t, 2.0, 2.5)), writhe = seg(t, 2.4, 3.0) * (1 - 0.45 * seg(t, 5.8, 6.6));
  const E: Jumbo = {
    x: EX, h: EH, t: clock,
    lift: lerp(0.05 + 0.12 * Math.sin(clock * 1.1), 0.5, nose) - 0.15 * writhe + 0.12 * writhe * Math.sin(clock * 1.7),
    curl: lerp(0.07, 0.12, nose) + 0.04 * writhe,
    wiggle: lerp(0.3, 0.15, nose) + 0.75 * writhe,
  };
  const el = jumbo(s, E, key);
  const tr = el.trunk;
  const snake = ease(seg(t, 3.4, 4.6));
  local(c, E, () => scalesOn(c, el.trunkL, snake, clock, s.still));
  // the man: walks up tapping, is nosed in the face, drops his cane and seizes the trunk; it drags him about
  const walkK = ease(seg(t, 0, 1.4));
  const held = mid(tr[7], tr[9]);
  const x = t < 2.0 ? lerp(-0.02, 0.15, walkK) - 0.02 * nose : lerp(0.13, held[0] - 0.075, grab);
  const dragged = grab > 0.5 && !s.still && Math.abs(tr[8][0] - 0.075 - x) > 0.001;
  const startle = ease(seg(t, 1.8, 2.0));
  const b: Partial<Body> = t < 2.0
    ? { x, ...(walkK < 1 ? walk(clock * 0.9, 0.7) : {}), reach: [x + 0.06, GROUND - 0.13], arm2: [lerp(20, 60, startle), 30], lean: -10 * startle, mouth: startle * 0.8 }
    : { x, ...(dragged ? walk(clock * 1.6, 0.35) : {}), reach: mid([x + 0.06, 0.66], tr[9], grab), reach2: mid([x + 0.05, 0.7], tr[7], grab), lean: -12 * grab, tilt: -6, mouth: talk(s, t > 2.6, 10) };
  const tapNow = tapping(x, 1, 0.13, clock, walkK < 1 ? 1.1 : 0);
  const j = puppet(s, man(s, 2, b), 0, t < 1.9 ? (jj) => caneTo(c, jj.hand, tapNow.tip, 0.0042) : undefined);
  // the trunk's tip coils over his wrist
  if (grab > 0.6) {
    const w = (i: number) => (13 - i * 0.75) * el.F.u;
    for (const [col, extra] of [[s.tone(0.92), key * 2], [s.ink, 0]] as [string, number][]) { paint(c, col); for (let i = 9; i < 12; i++) bone(c, tr[i], tr[i + 1], w(i) + extra, w(i + 1) + extra); }
    local(c, E, () => scalesOn(c, el.trunkL.slice(8), snake, clock, s.still));
  }
  // the dropped cane
  if (t >= 1.9) {
    const k = easeOut(seg(t, 1.9, 2.4));
    const from: P = [x + 0.08, GROUND - 0.08], to: P = [0.02, GROUND - 0.004];
    paint(c, s.ink); caneAt(c, mid(from, to, k), lerp(-1.2, 0.04, k), 0.12, 0.0042);
    if (t > 2.4) tick(c, to, seg(t, 2.4, 2.9), 0.03, s.tone(0.3));
  }
  // a sniff: puffs of breath on his face
  const sn = seg(t, 1.4, 2.1);
  if (sn > 0 && sn < 1) { c.save(); c.strokeStyle = s.tone(0.35); c.lineWidth = px(cam, 0.004); for (let i = 0; i < 3; i++) { const a = (sn * 2 + i / 3) % 1; c.globalAlpha = 1 - a; c.beginPath(); c.arc(tr[12][0], tr[12][1], px(cam, 0.015 + a * 0.04), Math.PI * 0.7, Math.PI * 1.3); c.stroke(); } c.restore(); }
  if (dragged) dust(s, x, GROUND, px(cam, 0.04), (clock * 1.3) % 1);
  thought(s, cam, j.head, COBRA(clock), shown(t, 3.6, 7.2), -1, 0.16);
  shout(c, j.mouth, 1, px(cam, 0.03), startle * (1 - seg(t, 2.3, 2.6)), s.tone(0.3));
};

/** V. The knee: the fourth feels about the leg, round and rough and rooted, hugs it: a tree. */
const theKnee: SceneFn = (s) => {
  const { t, c, clock } = s;
  const cam = shoot(s, [[0, 0.6, 0.66, 2.1], [3, 0.6, 0.67, 2.3], [7, 0.61, 0.66, 2.42]]);
  morning(s, cam, { light: [0.62, 0.5], warm: 0.55, r: 1.1 });
  const key = keyOf(s, cam);
  const E: Jumbo = { x: EX, h: EH, t: clock, lift: 0.85 + 0.08 * Math.sin(clock * 0.9), curl: 0.2, wiggle: 0.1 };
  const el = jumbo(s, E, key);
  const F = el.F;
  const tree = ease(seg(t, 3.0, 4.2));
  local(c, E, () => barkOn(c, tree, ease(seg(t, 3.4, 5.4)), seg(t, 3.6, 6.2)));
  // the leg: its near edge and far edge
  const legL = F.W([36, 0])[0], legR = F.W([20, 0])[0];
  const x = lerp(0.42, 0.535, ease(seg(t, 0, 1.5))) + 0.022 * ease(seg(t, 2.5, 3.2));
  const feel = t > 1.5 && t < 2.6;
  const yy = 0.72 + 0.05 * Math.sin((t - 1.5) * 3.2);
  const hug = ease(seg(t, 2.5, 3.2));
  const pat = t > 4.6 && !s.still ? Math.max(0, Math.sin((t - 4.6) * TAU * 1.6)) * 0.014 : 0;
  const m = MEN[3];
  const grope: P = [x + 0.07, GROUND - m.h * 0.62 + 0.01 * Math.sin(clock * 2.3)];
  const reach: P = t < 1.5 ? grope : feel ? [legL + 0.004, yy] : mid([legL + 0.004, 0.72], [legR - 0.004, 0.705 - pat], hug);
  const reach2: P = t < 1.5 ? [grope[0] - 0.01, grope[1] - 0.03] : feel ? [legL + 0.003, yy - 0.04] : mid([legL + 0.003, 0.68], [legL + 0.008, 0.665], hug);
  const j = puppet(s, man(s, 3, { x, ...(t < 1.5 ? walk(clock * 0.85, 0.6) : {}), reach, reach2, lean: 8 * hug, tilt: 12 * hug, mouth: talk(s, t > 5.4 && t < 6.9, 11) }), key);
  // pats on the knee
  for (const at of [1.9, 2.25, 4.7, 5.32, 5.94]) { const a = seg(t, at, at + 0.4); if (a > 0 && a < 1) sound(c, legL - 0.004, at < 3 ? yy : 0.7, px(cam, 0.03), a * 0.7, Math.PI, 1 - a, s.tone(0.9), 0.7); }
  thought(s, cam, j.head, TREE, shown(t, 3.3, 7.2), -1, 0.17);
  motes(s, 0.3, 0.45, 0.6, 0.4, s.small ? 8 : 14, 0.0013);
};

/** VI. The ear: the fifth touches it — it flaps, and the wind of it nearly blows him over: a fan. */
const theEar: SceneFn = (s) => {
  const { t, c, clock } = s;
  const cam = shoot(s, [[0, 0.5, 0.53, 1.9], [2.4, 0.51, 0.52, 2.0], [7, 0.52, 0.5, 2.15]]);
  morning(s, cam, { light: [0.45, 0.3], warm: 0.3, r: 1.2 });
  const key = keyOf(s, cam);
  const gust = seg(t, 2.4, 2.6) * (1 - seg(t, 4.4, 4.9));
  const e = lerp(0.14 + 0.1 * Math.sin(clock * 2.6), 0.5 + 0.5 * Math.sin((t - 2.4) * 10), gust);
  const E: Jumbo = { x: EX, h: EH, t: clock, lift: -0.15 + 0.05 * Math.sin(clock), curl: 0.05, wiggle: 0.2, ear: s.still ? 0.5 * gust + 0.14 : e };
  const el = jumbo(s, E, key);
  const fan = ease(seg(t, 3.1, 4.2));
  local(c, E, () => ribsOn(c, E.ear!, fan));
  // the edge of the ear, which his hand finds and follows
  const edge = [el.earW[3], el.earW[4], el.earW[5]];
  const x = 0.47 - 0.025 * ease(gust);
  let reach: P;
  if (t < 1.2) reach = [x + 0.05 + 0.015 * Math.sin(clock * 2.2), 0.56 + 0.02 * Math.sin(clock * 1.5)];
  else if (t < 2.4) reach = along(edge, 0.2 + 0.6 * ease(seg(t, 1.3, 2.3)));
  else if (t < 4.6) reach = [x + 0.06, 0.53];
  else { const w = s.still ? 0 : Math.sin(clock * 12) * 0.018; reach = [x + 0.055 + w, 0.55 + Math.abs(w) * 0.3]; }
  const robeT = clock * (1 + 5 * gust);
  const j = puppet(s, man(s, 4, { x, reach, reach2: gust > 0.05 ? [x + 0.008, GROUND - 0.29] : [x + 0.03, GROUND - 0.12], lean: -16 * gust, tilt: -10 + 6 * gust, mouth: gust > 0.3 ? 0.7 : talk(s, t > 5.0 && t < 6.9, 11), t: robeT }), key, (jj) => caneTo(c, jj.hand2, [x + 0.07, GROUND], 0.0042));
  // the wind off the ear
  if (gust > 0.02) {
    c.save(); c.strokeStyle = s.tone(0.55); c.lineCap = 'round'; c.lineWidth = px(cam, 0.004);
    for (let i = 0; i < 7; i++) {
      const a = s.still ? (i / 7) : ((clock * 1.8 + i / 7) % 1);
      const y = 0.46 + i * 0.03 + 0.01 * Math.sin(i * 2.1);
      const x0 = lerp(0.55, 0.2, a);
      c.globalAlpha = gust * Math.sin(Math.PI * a) * 0.9;
      c.beginPath(); c.moveTo(x0, y); c.quadraticCurveTo(x0 - 0.04, y - 0.012, x0 - 0.09, y + 0.004); c.stroke();
    }
    c.restore();
    // leaves and dust blown off
    if (!s.still) emit(clock, 6, 1.4, (a, r1, r2) => { paint(c, css(mixRGB(s.screen, [90, 70, 40], 0.5), gust * (1 - a))); ell(c, lerp(0.5, 0.15, a) + r1 * 0.04, 0.5 + r2 * 0.3 + Math.sin(a * 9 + r1 * 6) * 0.02, px(cam, 0.006), px(cam, 0.003), a * 9); }, 5);
  }
  thought(s, cam, j.head, FAN(clock), shown(t, 3.2, 7.2), -1, 0.16);
  shout(c, j.mouth, 1, px(cam, 0.03), gust > 0.3 ? 1 : 0, s.tone(0.3));
};

/** VII. The tail: it swings past the sixth, who snatches at it, catches it, and hauls: a rope. */
const theTail: SceneFn = (s) => {
  const { t, c, clock } = s;
  const cam = shoot(s, [[0, 1.06, 0.62, 2.0], [2.2, 1.07, 0.63, 2.15], [7, 1.08, 0.64, 2.3]]);
  morning(s, cam, { light: [1.1, 0.4], warm: 0.45, r: 1.2 });
  const key = keyOf(s, cam);
  const CATCH = 2.0;
  const x = 1.14 + 0.012 * ease(seg(t, CATCH, CATCH + 0.6));
  const tug = t > CATCH ? (s.still ? 0.5 : 0.5 + 0.5 * Math.sin((t - CATCH) * 5.5)) : 0;
  const G: P = [1.072 + 0.018 * tug, 0.62 + 0.008 * tug];
  const free = 0.6 * Math.sin(t * 3.3 + 0.4);
  const E: Jumbo = { x: EX + 0.004 * tug, h: EH, t: clock, lift: -0.1, curl: 0.06, wiggle: 0.2, tail: free, pull: t > CATCH ? G : null };
  const el = jumbo(s, E, key);
  const rope = ease(seg(t, 2.8, 4.0));
  local(c, E, () => twistOn(c, tailPts(E, el.F), rope));
  // his hands: snatching at the swinging tail (and missing), then holding it
  const tipNow = el.tailW[el.tailW.length - 3];
  const lag = 0.35;
  const was = tailPts({ ...E, pull: null, tail: 0.6 * Math.sin((t - lag) * 3.3 + 0.4) }, el.F).map(el.F.W)[8];
  const reach: P = t < CATCH ? mid([x - 0.06, 0.66], was, ease(seg(t, 0.3, 0.9))) : G;
  const reach2: P = t < CATCH ? [x - 0.05, 0.7] : [G[0] + 0.012, G[1] + 0.035];
  const j = puppet(s, man(s, 5, { x, face: -1, reach, reach2, lean: -18 * tug - 4, tilt: -8, mouth: talk(s, t > 4.4 && t < 6.9, 11) }), 0);
  void tipNow;
  // each tug thumps the elephant's hind foot: a little dust
  if (t > CATCH) dust(s, el.F.W([-36, 0])[0], GROUND, px(cam, 0.04), ((t - CATCH) * 5.5 / TAU) % 1);
  // the cane, dropped in the grass
  paint(c, s.ink); caneAt(c, [x + 0.07, GROUND - 0.003], 0.04, 0.12, 0.0042);
  thought(s, cam, j.head, ROPE, shown(t, 3.0, 7.2), 1, 0.16);
  // misses: little swishes where the tail was
  for (const at of [0.95, 1.5]) { const a = seg(t, at, at + 0.4); if (a > 0 && a < 1) sound(c, reach[0], reach[1], px(cam, 0.025), a * 0.7, Math.PI, 1 - a, s.tone(0.35), 0.9); }
};

/** VIII. Partly in the right: all six shout their part; each picture flies to the part it came from, and the elephant stands whole and shining; they fall silent, and it trumpets. */
const AT = [0.84, 0.27, 0.12, 0.6, 0.46, 1.17];
const FACE: (1 | -1)[] = [1, -1, 1, -1, 1, -1];
const BUB: P[] = [[0.88, 0.22], [0.3, 0.2], [0.11, 0.3], [0.66, 0.24], [0.48, 0.18], [1.15, 0.3]];
const theDispute: SceneFn = (s) => {
  const { t, c, clock } = s;
  const cam = shoot(s, [[0, 0.66, 0.5, 1.0], [4.4, 0.66, 0.5, 1.04], [8.2, 0.66, 0.48, 0.99], [12, 0.66, 0.46, 0.96]]);
  morning(s, cam, { light: [0.66, 0.4], warm: 0.4 + 0.5 * ease(seg(t, 7.6, 9.4)), r: 1.6 });
  const key = keyOf(s, cam);
  // the pictures fly in this order: wall, spear, snake, tree, fan, rope
  const fly = (i: number) => seg(t, 4.4 + i * 0.5, 5.2 + i * 0.5);
  const whole = ease(seg(t, 7.6, 8.6));
  const trumpet = ease(seg(t, 9.0, 9.9));
  const E8: Jumbo = { x: 0.78, h: 0.44, t: clock, lift: lerp(-0.25 + 0.05 * Math.sin(clock), 2.3, trumpet), curl: lerp(0.05, 0.11, trumpet), wiggle: lerp(0.25, 0.06, trumpet), rim: whole, ear: trumpet > 0 ? 0.5 + 0.4 * Math.sin(clock * 6) * trumpet : undefined };
  const el = jumbo(s, E8, key);
  const F = el.F;
  perch(s, el, -14, seg(t, 9.3, 11.4));
  // where each picture lands
  const parts: P[] = [F.W([-10, 68]), F.W([94, 62]), el.trunk[7], F.W([28, 24]), F.W([38, 70]), el.tailW[6]];
  // each part lights as its picture arrives, and the light stays
  const lit = (i: number) => seg(t, 5.2 + i * 0.5, 5.6 + i * 0.5);
  const fade = 1 - ease(seg(t, 8.2, 9.4));
  local(c, E8, () => {
    bricksOn(c, E8, [-10, 68], 70, lit(0) * fade);
    spearOn(c, lit(1) * fade);
    scalesOn(c, el.trunkL, lit(2) * fade, clock, s.still);
    barkOn(c, lit(3) * fade, lit(3), lit(3));
    ribsOn(c, earOf(E8), lit(4) * fade);
    twistOn(c, tailPts(E8, F), lit(5) * fade);
  });
  parts.forEach((p, i) => { const a = seg(t, 5.2 + i * 0.5, 6.2 + i * 0.5); if (a > 0 && a < 1) glow(c, p[0], p[1], 0.08 + a * 0.06, GOLD, (1 - a) * 0.9); });
  // the six, quarrelling in pairs; silent once their picture has gone
  const ICONS: Icon[] = [BRICKS, SPEAR, COBRA(clock), TREE, FAN(clock), ROPE];
  const heads: P[] = [], mouths: P[] = [];
  for (let i = 0; i < 6; i++) {
    const quiet = seg(t, 5.0 + i * 0.5, 5.4 + i * 0.5);
    const row = ease(seg(t, 0.6 + i * 0.15, 1.2 + i * 0.15)) * (1 - quiet);
    const startle = ease(seg(t, 9.4, 9.8)) * (1 - ease(seg(t, 11, 12)));
    const face = startle > 0.5 ? (AT[i] < 0.78 ? 1 : -1) as 1 | -1 : FACE[i];
    const fist = Math.max(0, Math.sin(clock * 3.2 + i * 1.7));
    const b: Partial<Body> = {
      x: AT[i], face,
      arm: [lerp(10, 130 + 20 * fist, row), lerp(10, 60, row)], arm2: [lerp(-6, 40, row), lerp(8, 70, row)],
      lean: 8 * row - 10 * startle, tilt: -6 * row - 14 * startle, mouth: row > 0.3 ? talk(s, true, 13 + i) : startle * 0.5,
    };
    if (startle > 0) { b.arm = [lerp(b.arm![0], 150, startle), lerp(b.arm![1], 30, startle)]; b.arm2 = [lerp(b.arm2![0], 120, startle), lerp(b.arm2![1], 40, startle)]; }
    const over = AT[i] > 0.4 && AT[i] < 1.06;
    const j = puppet(s, man(s, i, b), over ? key : 0);
    heads.push(j.head); mouths.push(j.mouth);
  }
  // anger between the pairs
  const anger = ease(seg(t, 1.0, 1.6)) * (1 - ease(seg(t, 5.0, 6.0)));
  if (anger > 0) {
    c.save(); c.strokeStyle = css(RED, anger); c.lineWidth = 0.004; c.lineCap = 'round'; c.lineJoin = 'round';
    for (const [a, b] of [[2, 1], [4, 3], [0, 5]]) {
      const m2 = mid(heads[a], heads[b]);
      for (let k = 0; k < 2; k++) {
        const x = m2[0] - 0.012 + k * 0.026, y = m2[1] - 0.05 - k * 0.02 + (s.still ? 0 : Math.sin(clock * 9 + k + a) * 0.005);
        c.beginPath(); c.moveTo(x - 0.012, y); c.lineTo(x, y - 0.016); c.lineTo(x + 0.003, y + 0.003); c.lineTo(x + 0.015, y - 0.013); c.stroke();
      }
    }
    c.restore();
  }
  // the bubbles: each shouts his picture; then it leaves him and flies to its part
  for (let i = 0; i < 6; i++) {
    const f = fly(i);
    const k = shown(t, 0.8 + i * 0.25, 5.0 + i * 0.5);
    bubble(c, { x: BUB[i][0], y: BUB[i][1], r: 0.058, to: mouths[i], k, ink: s.ink, icon: f > 0 ? undefined : ICONS[i], shake: s.still ? 0 : 1 - seg(t, 4.0, 4.6), time: clock + i, scale: 0.7 });
    if (f > 0 && f < 1) {
      const e = ease(f), p: P = [lerp(BUB[i][0], parts[i][0], e), lerp(BUB[i][1], parts[i][1], e) - Math.sin(e * Math.PI) * 0.08];
      glow(c, p[0], p[1], 0.07, GOLD, 0.9);
      c.save(); c.translate(p[0], p[1]); const sc = 0.04 * (1 - 0.4 * e); c.scale(sc, sc); paint(c, css([255, 246, 220])); c.lineWidth = 0.14; c.lineCap = 'round'; ICONS[i](c); c.restore();
      sparks(c, p[0], p[1], 0.05, clock, s.still ? 0 : 5, [255, 220, 140]);
    }
  }
  // the trumpet
  if (trumpet > 0.3) {
    const tip = el.trunk[12];
    sound(c, tip[0], tip[1] - 0.01, 0.07, clock, -Math.PI / 2 - 0.5, (trumpet - 0.3) / 0.7 * (1 - seg(t, 11.2, 12)), css(GOLD, 0.9), 0.9);
    sound(c, tip[0], tip[1] - 0.01, 0.11, clock * 0.8 + 0.3, -Math.PI / 2 - 0.5, (trumpet - 0.3) / 0.7 * 0.6 * (1 - seg(t, 11.2, 12)), s.tone(0.35), 0.8);
  }
  s.spill(0.72, 0.6, 0.35 + 0.45 * whole, [255, 206, 120]);
};

export const elephant: StoryVisuals = {
  id: 'elephant',
  aspect: 1.35,
  loop: false,
  scenes: [theSix, theSide, theTusk, theTrunk, theKnee, theEar, theTail, theDispute],
  stills: [9.8, 5.2, 4.8, 4.6, 4.6, 3.6, 4.4, 8.6],
};
