import { seg, ease, easeOut, easeIn, pop, lerp, hash, noise, css, mixRGB, type RGB, type Stage, type SceneFn, type StoryVisuals } from '../puppet/theatre';
import { person, walk, gesture, CHAIR, type Body, type Joints } from '../puppet/figure';
import { bee } from '../puppet/beasts';
import { glow, emit, fire, sparks, smoke, sound, twinkle, weather, ripple, heat } from '../puppet/fx';
import { bubble, shown, Q, EQ, CHECK, EAR, NOSE, HAND, DROP, FLAME, HEART, GEAR, CITY, type Icon } from '../puppet/bubbles';
import { windowFrame } from '../puppet/scenery';
import { thread } from '../puppet/marks';

/**
 * "The piece of wax" (Discourse II; Meditations II): Descartes shut away for a
 * winter's day in a stove-heated room; a fresh piece of honeycomb and all it
 * tells the senses; the same piece by the fire, losing every one of those
 * qualities; and yet the same wax, which the mind alone perceives. Last, from
 * the window, hats and cloaks that might hide machines, judged to be people.
 *
 * Five sets: the room with its great tiled stove; the table, close; the
 * stove's open door; his head, opened to show what the mind holds; the snowy
 * street below his window. Six medallions of the senses carry the argument
 * from set to set: lit one by one, struck out one by one, let fall.
 */
type C = CanvasRenderingContext2D;
type P = [number, number];
const TAU = Math.PI * 2;
const FLOOR = 0.86;
const GOLD: RGB = [240, 176, 70];
const HONEY: RGB = [218, 150, 40];
const PALE: RGB = [240, 224, 184];
const RED: RGB = [206, 66, 44];
const EMBER: RGB = [255, 150, 60];
const ICE: RGB = [70, 130, 196];
const LINEN = 'rgba(247,242,231,1)';
const PAPER = 'rgba(255,252,246,0.97)';

const poly = (c: C, pts: P[]) => { c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); };
/** a stroke with round ends: a finger, a leg of a chair, a quill */
function rod(c: C, a: P, b: P, w: number) { c.lineWidth = w; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); }
/** Keyframes [time, values]: the values eased from one key to the next. */
function keys(t: number, ks: [number, number[]][]): number[] {
  if (t <= ks[0][0]) return ks[0][1];
  for (let i = 1; i < ks.length; i++) {
    const [t0, v0] = ks[i - 1], [t1, v1] = ks[i];
    if (t <= t1) { const k = ease((t - t0) / (t1 - t0)); return v0.map((v, j) => lerp(v, v1[j], k)); }
  }
  return ks[ks.length - 1][1];
}
/** Where the elbow goes when an arm of l1 + l2 reaches from a towards b, and where the wrist ends up. */
function reachArm(a: P, b: P, l1: number, l2: number, side: 1 | -1): [P, P] {
  let dx = b[0] - a[0], dy = b[1] - a[1];
  let d = Math.hypot(dx, dy) || 1e-6;
  const max = (l1 + l2) * 0.999, min = Math.abs(l1 - l2) + 1e-4;
  if (d > max) { dx *= max / d; dy *= max / d; d = max; }
  if (d < min) { dx *= min / d; dy *= min / d; d = min; }
  const cosA = Math.max(-1, Math.min(1, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d)));
  const ang = Math.atan2(dy, dx) + Math.acos(cosA) * side;
  return [[a[0] + Math.cos(ang) * l1, a[1] + Math.sin(ang) * l1], [a[0] + dx, a[1] + dy]];
}

/* ================================================================ Descartes */

/** The outlines of his head in profile (made on first use: Path2D belongs to the browser). */
let PATHS: Record<string, Path2D> | null = null;
const paths = () => (PATHS ??= {
  head: new Path2D('M0,-54 C22,-54 34,-42 37,-24 C38,-18 39,-14 41,-11 C42,-9 40,-6 39,-4 L53,15 C54,17 52,19 48,19 C46,19 45,20 45,22 C46,24 45,26 43,26.5 L40,27.5 C43,29 43,32 41,33.5 C39,35 39,36 40,38 C41,44 39,49 33,50 C25,51 16,50 12,48 C10,54 12,62 15,68 L-20,68 C-24,40 -38,30 -44,10 C-50,-16 -34,-54 0,-54 Z'),
  hair: new Path2D('M24,-44 C12,-62 -34,-66 -50,-38 C-62,-16 -54,4 -60,22 C-66,40 -54,52 -60,68 C-66,84 -56,96 -60,106 C-52,114 -42,104 -36,112 C-28,118 -22,106 -12,110 C-8,96 -4,80 0,64 C4,40 2,10 8,-16 C12,-30 18,-40 24,-44 Z'),
  moustache: new Path2D('M38,21 C42,18.5 47,19.5 49.5,23 C51.5,26 53.5,28 56,31 C51,29.5 47,27 43,26 C41,25.5 39,24 38,21 Z'),
  tuft: new Path2D('M35,34 C39,36 42,40 41,47 C40,53 38.5,59 36.5,65 C34.5,58 32,52 30.5,47 C30,41 32,36 35,34 Z'),
  cloak: new Path2D('M-18,60 C-56,66 -88,88 -98,132 L-106,320 L96,320 L86,140 C80,100 52,76 16,62 Z'),
  collar: new Path2D('M8,60 L40,62 C48,74 52,84 50,96 L-4,100 C-4,86 0,72 8,60 Z'),
  locks: new Path2D('M20,-46 C10,-36 4,-24 2,-12 C0,4 2,24 -2,44 C-4,56 -6,66 -8,76 M-4,-56 C-30,-52 -44,-30 -48,-2 C-52,24 -44,50 -50,84 M12,-52 C-12,-46 -28,-26 -32,2 C-36,30 -28,62 -32,98 M-22,-26 C-30,0 -24,36 -26,70'),
  brow: new Path2D('M18,-14 Q27,-19 36,-14'),
});

interface BustLook { eye?: number; wide?: number; tilt?: number; inner?: (c: C) => void }
/**
 * Descartes close: head and shoulders in profile, long hair to the collar, a
 * thin moustache and a tuft under the lip, a white falling band on black.
 * The head is 100 units tall around (0, 0), y down, facing +x; `size` is its
 * height in world units.
 */
function bust(s: Stage, x: number, y: number, size: number, face: 1 | -1, o: BustLook = {}) {
  const c = s.c, cut = s.tone(0.8), u = size / 100, P2 = paths();
  c.save(); c.translate(x, y); c.scale(face * u, u);
  c.fillStyle = s.ink; c.strokeStyle = s.ink; c.lineCap = 'round'; c.lineJoin = 'round';
  c.fill(P2.cloak);
  c.strokeStyle = cut; c.lineWidth = 1.2;
  c.beginPath(); c.moveTo(-44, 96); c.quadraticCurveTo(-58, 150, -54, 230); c.moveTo(44, 104); c.quadraticCurveTo(60, 160, 56, 240); c.stroke();
  c.fillStyle = LINEN; c.fill(P2.collar);
  c.strokeStyle = s.tone(0.62); c.lineWidth = 1; c.beginPath(); c.moveTo(22, 62); c.lineTo(22, 98); c.stroke();
  // the head turns on the neck
  c.translate(0, 58); c.rotate(o.tilt ?? 0); c.translate(0, -58);
  c.fillStyle = s.ink;
  c.fill(P2.hair); c.fill(P2.head); c.fill(P2.moustache); c.fill(P2.tuft);
  c.strokeStyle = cut; c.lineWidth = 1.1; c.stroke(P2.locks);
  if (o.inner) { c.save(); o.inner(c); c.restore(); }
  c.strokeStyle = cut; c.lineWidth = 1.6; c.stroke(P2.brow);
  // the eye: open, wide, or shut
  const e = o.eye ?? 1;
  if (e > 0.2) {
    c.save(); c.translate(27, -5); c.scale(1, Math.min(1.4, e * (1 + 0.4 * (o.wide ?? 0))));
    c.fillStyle = cut; c.beginPath(); c.moveTo(-6, 0); c.quadraticCurveTo(0, -4.8, 6.6, -0.6); c.quadraticCurveTo(0, 3.2, -6, 0); c.fill();
    c.fillStyle = s.ink; c.beginPath(); c.arc(2.4, -0.7, 1.9, 0, TAU); c.fill();
    c.restore();
  } else {
    c.lineWidth = 1.5; c.beginPath(); c.moveTo(21, -4.6); c.quadraticCurveTo(27, -0.8, 33.6, -4.6); c.stroke();
    c.lineWidth = 1; for (let i = 0; i < 3; i++) { const lx = 23.5 + i * 3.4; c.beginPath(); c.moveTo(lx, -2.8 + Math.abs(i - 1) * 0.4); c.lineTo(lx - 0.6, 0.2); c.stroke(); }
  }
  c.lineWidth = 1.1; c.beginPath(); c.moveTo(45, 13); c.quadraticCurveTo(47.5, 15, 46, 17.5); c.moveTo(40, 27.6); c.lineTo(35, 28.2); c.stroke();
  c.restore();
}

/** Descartes as a puppet: the long hair and the cloak, then a white collar, the moustache and the tuft added to the figure. */
function descartes(s: Stage, b: Partial<Body>): Joints {
  const c = s.c;
  const body: Body = { x: 0, y: FLOOR, h: 0.38, robe: 'cloak', hair: 'long', cut: s.tone(0.8), t: s.clock, ...b };
  c.fillStyle = s.ink; c.strokeStyle = s.ink;
  const j = person(c, body);
  const u = body.h / 100, f = body.face ?? 1, R = Math.PI / 180;
  const toL = (w: P): P => [((w[0] - body.x) / u) * f, (body.y - w[1]) / u];
  c.save(); c.translate(body.x, body.y); c.scale(f * u, -u);
  const nk = toL(j.neck);
  c.save(); c.translate(nk[0], nk[1]); c.rotate(-(body.lean ?? 0) * R);
  c.fillStyle = LINEN; c.beginPath(); c.moveTo(-1, 1.6); c.lineTo(7.4, 0.8); c.lineTo(10.2, -6); c.lineTo(2.6, -7); c.closePath(); c.fill();
  c.restore();
  const hd = toL(j.head);
  c.translate(hd[0], hd[1]); c.rotate(-((body.lean ?? 0) + (body.tilt ?? 0)) * R);
  c.fillStyle = s.ink;
  c.beginPath(); c.moveTo(6.4, -2.4); c.quadraticCurveTo(9.6, -2.6, 10.8, -5); c.quadraticCurveTo(8.6, -3.8, 6.6, -3.6); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(5, -6); c.quadraticCurveTo(7.8, -6.6, 6.8, -9.6); c.lineTo(5.8, -12.4); c.quadraticCurveTo(4.6, -9.4, 4, -7.2); c.closePath(); c.fill();
  c.restore();
  return j;
}

/** A sleeved arm from `sh` (often outside the picture) with a lace cuff, and a hand pointing along `ang` whose index fingertip lands on `tip`. */
function armTo(s: Stage, sh: P, tip: P, ang: number, l1: number, l2: number, hs: number, o: { point?: number; curl?: number; side?: 1 | -1 } = {}): P {
  const c = s.c;
  const flip = Math.cos(ang) < 0 ? -1 : 1;
  const lx = 1.66 * hs, ly = -0.2 * hs * flip;
  const want: P = [tip[0] - (lx * Math.cos(ang) - ly * Math.sin(ang)), tip[1] - (lx * Math.sin(ang) + ly * Math.cos(ang))];
  const [el, wr] = reachArm(sh, want, l1, l2, o.side ?? 1);
  c.fillStyle = s.ink; c.strokeStyle = s.ink; c.lineCap = 'round';
  const taper = (a: P, b: P, w1: number, w2: number) => {
    const d = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1e-6, nx = -(b[1] - a[1]) / d, ny = (b[0] - a[0]) / d;
    c.beginPath(); c.moveTo(a[0] + nx * w1 / 2, a[1] + ny * w1 / 2); c.lineTo(b[0] + nx * w2 / 2, b[1] + ny * w2 / 2); c.lineTo(b[0] - nx * w2 / 2, b[1] - ny * w2 / 2); c.lineTo(a[0] - nx * w1 / 2, a[1] - ny * w1 / 2); c.closePath(); c.fill();
    c.beginPath(); c.arc(b[0], b[1], w2 / 2, 0, TAU); c.fill();
  };
  taper(sh, el, hs * 2.1, hs * 1.45); taper(el, wr, hs * 1.45, hs * 1.15);
  // the lace cuff, a ruffle turned back over the wrist
  const fa = Math.atan2(wr[1] - el[1], wr[0] - el[0]);
  c.save(); c.translate(wr[0], wr[1]); c.rotate(fa);
  c.fillStyle = LINEN;
  c.beginPath(); c.moveTo(-hs * 0.7, -hs * 0.66);
  for (let i = 0; i <= 8; i++) { const v = i / 8; c.lineTo(-hs * 0.06 + (i % 2) * hs * 0.16, -hs * 0.86 + v * hs * 1.72); }
  c.lineTo(-hs * 0.7, hs * 0.66); c.closePath(); c.fill();
  c.strokeStyle = s.tone(0.6); c.lineWidth = hs * 0.04; c.beginPath(); c.moveTo(-hs * 0.4, -hs * 0.6); c.lineTo(-hs * 0.4, hs * 0.6); c.stroke();
  c.restore();
  c.fillStyle = s.ink; c.strokeStyle = s.ink;
  return handAt(c, wr, ang, hs, o.point ?? 1, o.curl ?? 0.9);
}
/** A hand in profile from the wrist, along `ang`: palm, the thumb along the top, the index finger pointing as `point` → 1, the rest curled by `curl`. Returns the index fingertip. */
function handAt(c: C, w: P, ang: number, hs: number, point: number, curl: number): P {
  const flip = Math.cos(ang) < 0 ? -1 : 1;
  c.save(); c.translate(w[0], w[1]); c.rotate(ang); c.scale(hs, hs * flip);
  c.beginPath(); c.ellipse(0.46, 0.04, 0.54, 0.38, 0, 0, TAU); c.fill();
  let tip: P = [0, 0];
  const roots: P[] = [[0.9, -0.18], [0.94, -0.02], [0.9, 0.12], [0.82, 0.24]];
  const lens = [0.76, 0.6, 0.56, 0.46];
  roots.forEach((r, i) => {
    const bend = i === 0 ? curl * (1 - point) : curl;
    const a1 = bend * 1.25, a2 = a1 + bend * 1.35;
    const m: P = [r[0] + Math.cos(a1) * lens[i] * 0.52, r[1] + Math.sin(a1) * lens[i] * 0.52];
    const e: P = [m[0] + Math.cos(a2) * lens[i] * 0.48, m[1] + Math.sin(a2) * lens[i] * 0.48];
    rod(c, r, m, 0.21); rod(c, m, e, 0.18);
    if (i === 0) tip = e;
  });
  rod(c, [0.3, -0.24], [0.66, -0.36], 0.22); rod(c, [0.66, -0.36], [0.98, -0.34 + curl * 0.06], 0.19);
  c.restore();
  const tx = tip[0] * hs, ty = tip[1] * hs * flip;
  return [w[0] + tx * Math.cos(ang) - ty * Math.sin(ang), w[1] + tx * Math.sin(ang) + ty * Math.cos(ang)];
}

/* ================================================================ the wax */

/** The outline of the piece at melt m: a block (0) whose corners round (0.3), that slumps (0.5) and runs out into a puddle (1). */
function waxOutline(x: number, base: number, w: number, h: number, m: number, time: number, spread = 0.9, flat = 0.74): P[] {
  const a = ease(seg(m, 0, 0.45)), b = ease(seg(m, 0.28, 1));
  const half = (w / 2) * (1 + 0.14 * a + spread * b);
  const H = h * (1 - 0.3 * a) * (1 - flat * b);
  const p = lerp(lerp(9, 2.3, a), 3.6, b);
  const pts: P[] = [];
  const N = 40;
  for (let i = 0; i <= N; i++) {
    const u = -Math.cos((Math.PI * i) / N);
    const prof = Math.pow(Math.max(0, 1 - Math.pow(Math.abs(u), p)), 1 / p);
    const lap = b * 0.12 * Math.sin(u * 6 + time * 2.4) * (1 - u * u);
    pts.push([x + u * half, base - H * prof * (1 + lap)]);
  }
  return pts;
}
/** Six-sided cells over a box: their dark cups, the pale walls between. */
function comb(c: C, x0: number, y0: number, x1: number, y1: number, r: number, cup: string) {
  const dx = r * Math.sqrt(3), dy = r * 1.5;
  c.fillStyle = cup;
  c.beginPath();
  for (let row = 0, y = y0; y <= y1 + r; row++, y += dy) {
    for (let x = x0 + (row % 2 ? dx / 2 : 0); x <= x1 + dx; x += dx) {
      for (let k = 0; k < 6; k++) { const a = Math.PI / 6 + (k * Math.PI) / 3, px = x + Math.cos(a) * r * 0.76, py = y + Math.sin(a) * r * 0.76; if (k) c.lineTo(px, py); else c.moveTo(px, py); }
      c.closePath();
    }
  }
  c.fill();
}
interface WaxLook { melt?: number; pale?: number; shine?: number; comb?: number; alpha?: number; spread?: number; flat?: number }
/** The piece of wax standing on (x, base): honey-gold comb at first; it pales, slumps and spreads. */
function drawWax(s: Stage, x: number, base: number, w: number, h: number, o: WaxLook = {}) {
  const c = s.c, m = o.melt ?? 0, pale = o.pale ?? 0;
  const pts = waxOutline(x, base, w, h, m, s.still ? 0 : s.clock, o.spread, o.flat);
  let top = base; for (const p of pts) top = Math.min(top, p[1]);
  const half = (pts[pts.length - 1][0] - pts[0][0]) / 2;
  const col = mixRGB(HONEY, PALE, pale);
  c.save();
  c.globalAlpha *= o.alpha ?? 1;
  const g = c.createLinearGradient(0, top, 0, base);
  g.addColorStop(0, css(mixRGB(col, [255, 244, 214], 0.42)));
  g.addColorStop(0.5, css(col));
  g.addColorStop(1, css(mixRGB(col, [110, 64, 16], 0.32 * (1 - pale * 0.7))));
  c.fillStyle = g; poly(c, pts); c.fill();
  const cells = (o.comb ?? 1) * (1 - seg(m, 0.08, 0.5));
  if (cells > 0.02) {
    c.save(); poly(c, pts); c.clip();
    const sq = Math.max(0.2, (base - top) / h);
    c.translate(x, base); c.scale(1 + m * 0.5, sq); c.translate(-x, -base);
    comb(c, x - w * 0.62, base - h * 1.04, x + w * 0.62, base + 0.01, h * 0.12, css(mixRGB(col, [150, 82, 12], 0.42), cells));
    c.restore();
  }
  c.strokeStyle = css(mixRGB(col, [96, 54, 12], 0.5)); c.lineWidth = Math.max(0.003, h * 0.022); poly(c, pts); c.stroke();
  // a gleam along the top
  const sh = o.shine ?? 0.6;
  if (sh > 0.01) {
    c.strokeStyle = `rgba(255,252,238,${0.8 * sh})`; c.lineWidth = Math.max(0.003, h * 0.04);
    c.beginPath(); c.moveTo(x - half * 0.7, top + (base - top) * 0.2); c.quadraticCurveTo(x - half * 0.5, top + (base - top) * 0.06, x - half * 0.15, top + (base - top) * 0.07); c.stroke();
  }
  // a liquid's flat, shining top
  if (m > 0.55) {
    const k = seg(m, 0.55, 0.9);
    c.fillStyle = css(mixRGB(col, [255, 252, 240], 0.6), 0.9 * k);
    c.beginPath(); c.ellipse(x, top + (base - top) * 0.36, half * 0.86, Math.max(0.005, (base - top) * 0.34), 0, 0, TAU); c.fill();
    c.strokeStyle = `rgba(255,255,250,${0.9 * k})`; c.lineWidth = Math.max(0.002, (base - top) * 0.12);
    c.beginPath(); c.ellipse(x - half * 0.2, top + (base - top) * 0.3, half * 0.4, Math.max(0.003, (base - top) * 0.14), 0, Math.PI * 1.1, Math.PI * 1.7); c.stroke();
  }
  c.restore();
  return { top, half };
}

/** A pewter dish in profile, standing on y. Returns the level the wax stands on. */
function dish(s: Stage, x: number, y: number, w: number) {
  const c = s.c;
  c.fillStyle = s.tone(0.3);
  c.beginPath();
  c.moveTo(x - w / 2, y - w * 0.07); c.lineTo(x + w / 2, y - w * 0.07);
  c.quadraticCurveTo(x + w * 0.42, y - w * 0.005, x + w * 0.24, y);
  c.lineTo(x - w * 0.24, y);
  c.quadraticCurveTo(x - w * 0.42, y - w * 0.005, x - w / 2, y - w * 0.07);
  c.fill();
  c.strokeStyle = s.tone(0.62); c.lineWidth = w * 0.014;
  c.beginPath(); c.moveTo(x - w * 0.48, y - w * 0.07); c.lineTo(x + w * 0.48, y - w * 0.07); c.stroke();
  return y - w * 0.055;
}

/* ================================================================ the senses */

const FLAKE: Icon = (c) => {
  c.lineWidth = 0.2;
  for (let i = 0; i < 3; i++) {
    c.save(); c.rotate((i * Math.PI) / 3);
    c.beginPath(); c.moveTo(0, -0.9); c.lineTo(0, 0.9);
    c.moveTo(-0.3, -0.64); c.lineTo(0, -0.4); c.lineTo(0.3, -0.64); c.moveTo(-0.3, 0.64); c.lineTo(0, 0.4); c.lineTo(0.3, 0.64);
    c.stroke(); c.restore();
  }
};
/** Taste: a drop of honey. */
const TASTE: Icon = (c) => {
  c.save(); c.fillStyle = css(HONEY); c.translate(0, 0.04); DROP(c); c.lineWidth = 0.1; c.stroke(); c.restore();
  c.save(); c.fillStyle = 'rgba(255,248,226,0.9)'; c.beginPath(); c.ellipse(-0.2, 0.28, 0.1, 0.2, 0.4, 0, TAU); c.fill(); c.restore();
};
/** Smell: a face in profile, breathing in three wisps. */
const SMELL: Icon = (c) => {
  c.beginPath(); c.moveTo(-0.9, -0.92); c.lineTo(-0.34, -0.92); c.quadraticCurveTo(-0.16, -0.62, -0.24, -0.4);
  c.lineTo(0.12, 0.04); c.quadraticCurveTo(0.12, 0.16, -0.08, 0.16); c.lineTo(-0.1, 0.3); c.quadraticCurveTo(-0.02, 0.4, -0.12, 0.48);
  c.quadraticCurveTo(-0.04, 0.6, -0.18, 0.7); c.lineTo(-0.28, 0.92); c.lineTo(-0.9, 0.92); c.closePath(); c.fill();
  c.lineWidth = 0.1;
  for (let i = 0; i < 3; i++) { c.beginPath(); for (let k = 0; k <= 10; k++) { const v = k / 10; c.lineTo(0.95 - v * 0.62, -0.42 + i * 0.27 + Math.sin(v * 9 + i * 1.3) * 0.06 + v * (0.1 - i * 0.07)); } c.stroke(); }
};
/** Colour: an eye whose iris is the colour of the wax (k: 0 honey … 1 pale). */
const colourIcon = (k: number): Icon => (c) => {
  c.lineWidth = 0.12;
  c.beginPath(); c.moveTo(-0.95, 0); c.quadraticCurveTo(0, -0.9, 0.95, 0); c.quadraticCurveTo(0, 0.9, -0.95, 0); c.stroke();
  c.save(); c.fillStyle = css(mixRGB(HONEY, PALE, k)); c.beginPath(); c.arc(0, 0, 0.4, 0, TAU); c.fill(); c.restore();
  c.lineWidth = 0.08; c.beginPath(); c.arc(0, 0, 0.4, 0, TAU); c.stroke();
  c.beginPath(); c.arc(0, 0, 0.14, 0, TAU); c.fill();
};
/** An arrow with heads at both ends. */
function measure(c: C, x0: number, y0: number, x1: number, y1: number, head: number) {
  const a = Math.atan2(y1 - y0, x1 - x0);
  c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1);
  for (const [px, py, d] of [[x0, y0, 1], [x1, y1, -1]] as const) {
    c.moveTo(px + Math.cos(a + 0.5 * d) * head * d, py + Math.sin(a + 0.5 * d) * head * d); c.lineTo(px, py);
    c.lineTo(px + Math.cos(a - 0.5 * d) * head * d, py + Math.sin(a - 0.5 * d) * head * d);
  }
  c.stroke();
}
/** Shape and size: the block with its measures; as m → 1, a puddle spreading outwards. */
const shapeIcon = (m: number): Icon => (c) => {
  if (m < 0.5) {
    const w = 0.95, h = 0.8, y0 = 0.3;
    c.save(); c.fillStyle = css(HONEY); c.beginPath(); c.roundRect(-w / 2, y0 - h, w, h, 0.12); c.fill(); c.restore();
    c.lineWidth = 0.09; c.beginPath(); c.roundRect(-w / 2, y0 - h, w, h, 0.12); c.stroke();
    measure(c, -w / 2, 0.62, w / 2, 0.62, 0.2);
    measure(c, -w / 2 - 0.2, y0, -w / 2 - 0.2, y0 - h, 0.2);
  } else {
    c.save(); c.fillStyle = css(PALE);
    c.beginPath(); c.moveTo(-0.62, 0.32); c.quadraticCurveTo(-0.6, 0.02, -0.3, 0.04); c.quadraticCurveTo(0, -0.04, 0.3, 0.04); c.quadraticCurveTo(0.6, 0.02, 0.62, 0.32); c.closePath(); c.fill(); c.restore();
    c.lineWidth = 0.09; c.stroke();
    c.lineWidth = 0.11;
    for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(sd * 0.68, -0.3); c.lineTo(sd * 0.96, -0.3); c.moveTo(sd * 0.84, -0.46); c.lineTo(sd * 0.98, -0.3); c.lineTo(sd * 0.84, -0.14); c.stroke(); }
    c.beginPath(); c.moveTo(-0.5, 0.32); c.lineTo(-0.52, 0.6); c.moveTo(0.42, 0.32); c.lineTo(0.44, 0.52); c.stroke();
  }
};
/** Touch: a hand, and the cold (or, later, the heat) it feels. */
const touchIcon = (hot: number): Icon => (c) => {
  c.save(); c.translate(-0.2, 0.12); c.scale(0.82, 0.82); HAND(c); c.restore();
  c.save(); c.translate(0.55, -0.5); c.scale(0.5, 0.5);
  if (hot < 0.5) { c.strokeStyle = css(ICE); FLAKE(c); } else { c.fillStyle = css(EMBER); FLAME(c); }
  c.restore();
};
/** Sound: an ear, and the ring of a struck thing. */
const SOUND: Icon = (c) => {
  c.save(); c.translate(-0.3, 0); c.scale(0.9, 0.9); EAR(c); c.restore();
  c.lineWidth = 0.1; for (let i = 0; i < 2; i++) { c.beginPath(); c.arc(0.18, 0, 0.42 + i * 0.26, -0.55, 0.55); c.stroke(); }
};
/** The six, in the order the Meditation gives them: taste, smell, colour, shape and size, hard and cold, sound. */
const sense = (i: number, change = 0): Icon => [TASTE, SMELL, colourIcon(change), shapeIcon(change), touchIcon(change), SOUND][i];

interface Medal { k: number; lit?: number; cross?: number; dim?: number; rot?: number }
/** A sense, as a medallion: it pops in, glows gold while it holds, and may be struck through in red. */
function medal(s: Stage, x: number, y: number, r: number, icon: Icon, o: Medal) {
  const c = s.c;
  if (o.k <= 0.01) return;
  const lit = o.lit ?? 0, dim = o.dim ?? 0;
  if (lit > 0.01) glow(c, x, y, r * 2.4, GOLD, 0.5 * lit * Math.min(1, o.k));
  c.save();
  c.translate(x, y); c.rotate(o.rot ?? 0);
  const sc = pop(Math.min(1, o.k)); c.scale(sc, sc);
  c.globalAlpha *= Math.min(1, o.k * 1.6) * (1 - 0.55 * dim);
  c.fillStyle = PAPER; c.strokeStyle = s.ink; c.lineWidth = r * 0.11;
  c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill(); c.stroke();
  if (lit > 0.01) { c.strokeStyle = css(GOLD, lit); c.lineWidth = r * 0.13; c.beginPath(); c.arc(0, 0, r * 1.17, 0, TAU); c.stroke(); }
  c.save(); c.scale(r * 0.62, r * 0.62);
  c.fillStyle = s.ink; c.strokeStyle = s.ink; c.lineWidth = 0.14; c.lineCap = 'round'; c.lineJoin = 'round';
  icon(c); c.restore();
  const x2 = o.cross ?? 0;
  if (x2 > 0) {
    const a = r * 0.8, k = easeOut(Math.min(1, x2));
    c.strokeStyle = css(RED); c.lineWidth = r * 0.2; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-a, -a); c.lineTo(lerp(-a, a, k), lerp(-a, a, k)); c.stroke();
  }
  c.restore();
}
/** Six places on an arch over the wax. */
const arch = (i: number, cx: number, cy: number, rx: number, ry: number): P => {
  const a = (Math.PI * (196 + i * 29.6)) / 180;
  return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry];
};

/** A honeycomb block, as a picture. */
const COMB: Icon = (c) => {
  c.save();
  c.fillStyle = css(HONEY); c.beginPath(); c.roundRect(-0.85, -0.62, 1.7, 1.24, 0.16); c.fill();
  c.clip();
  comb(c, -1, -0.9, 1, 0.9, 0.26, css([150, 86, 16]));
  c.restore();
  c.lineWidth = 0.1; c.beginPath(); c.roundRect(-0.85, -0.62, 1.7, 1.24, 0.16); c.stroke();
};
/** His own thoughts: a curve on its axes. */
const AXES: Icon = (c) => {
  c.lineWidth = 0.1; c.beginPath(); c.moveTo(-0.72, -0.82); c.lineTo(-0.72, 0.66); c.lineTo(0.86, 0.66); c.stroke();
  c.lineWidth = 0.14; c.beginPath();
  for (let i = 0; i <= 14; i++) { const v = i / 14; c.lineTo(-0.56 + v * 1.32, 0.46 - 1.18 * v * v); }
  c.stroke();
};

/* ================================================================ I. seclusion */
const STOVE_X = 0.2;
const WIN = { x: 0.9, y: 0.15, w: 0.2, h: 0.42 };
const SKY: RGB[] = [[224, 233, 242], [240, 172, 128], [38, 48, 82]];
const skyAt = (k: number): RGB => (k < 0.5 ? mixRGB(SKY[0], SKY[1], k * 2) : mixRGB(SKY[1], SKY[2], k * 2 - 1));

/** A leaded window onto a snowy town; `dusk` runs the day down from noon (0) to night (1). */
function winterWindow(s: Stage, x: number, y: number, w: number, h: number, dusk: number) {
  const { c, clock } = s;
  const sky = skyAt(dusk);
  c.save();
  c.beginPath(); c.rect(x, y, w, h); c.clip();
  const g = c.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, css(mixRGB(sky, [24, 30, 56], 0.3)));
  g.addColorStop(1, css(mixRGB(sky, [255, 238, 214], 0.35 * (1 - dusk))));
  c.fillStyle = g; c.fillRect(x, y, w, h);
  // a pale winter sun going down, then a moon and the first stars
  const sunK = 1 - seg(dusk, 0.5, 0.78);
  if (sunK > 0) {
    const sy = lerp(y + h * 0.24, y + h * 0.86, seg(dusk, 0, 0.75));
    glow(c, x + w * 0.6, sy, w * 0.8, [255, 216, 160], 0.55 * sunK);
    c.fillStyle = css(mixRGB([255, 250, 232], [255, 168, 96], dusk * 1.4), sunK); c.beginPath(); c.arc(x + w * 0.6, sy, w * 0.075, 0, TAU); c.fill();
  }
  const nightK = seg(dusk, 0.62, 0.95);
  if (nightK > 0) {
    for (let i = 0; i < 6; i++) twinkle(c, x + (0.1 + hash(i, 3) * 0.8) * w, y + (0.06 + hash(i, 5) * 0.4) * h, 0.004 + hash(i, 7) * 0.003, `rgba(255,250,230,${nightK * (s.still ? 0.9 : 0.6 + 0.4 * Math.sin(clock * 2 + i))})`);
    c.fillStyle = `rgba(250,246,222,${nightK})`; c.beginPath(); c.arc(x + w * 0.3, y + h * 0.2, w * 0.08, 0, TAU); c.fill();
    c.fillStyle = g; c.beginPath(); c.arc(x + w * 0.34, y + h * 0.185, w * 0.072, 0, TAU); c.fill();
  }
  // across the way: gables under snow, and a spire
  const base = y + h + 0.004;
  c.fillStyle = css(mixRGB(sky, [34, 32, 44], 0.48));
  const houses: [number, number, number][] = [[0, 0.34, 0.17], [0.3, 0.3, 0.22], [0.56, 0.48, 0.14]];
  c.beginPath(); c.moveTo(x, base);
  for (const [hx, hw, hh] of houses) { c.lineTo(x + hx * w, base - hh * h * 0.55); c.lineTo(x + (hx + hw / 2) * w, base - hh * h * 0.55 - hw * w * 0.42); c.lineTo(x + (hx + hw) * w, base - hh * h * 0.55); }
  c.lineTo(x + w, base); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(x + w * 0.76, base - h * 0.2); c.lineTo(x + w * 0.8, base - h * 0.46); c.lineTo(x + w * 0.84, base - h * 0.2); c.fill();
  c.strokeStyle = 'rgba(252,252,250,0.95)'; c.lineWidth = w * 0.035; c.lineCap = 'round';
  for (const [hx, hw, hh] of houses) { c.beginPath(); c.moveTo(x + hx * w, base - hh * h * 0.55); c.lineTo(x + (hx + hw / 2) * w, base - hh * h * 0.55 - hw * w * 0.42); c.lineTo(x + (hx + hw) * w, base - hh * h * 0.55); c.stroke(); }
  const lit = seg(dusk, 0.45, 0.75);
  if (lit > 0) { c.fillStyle = `rgba(255,200,110,${lit})`; for (const [hx, hw] of houses) c.fillRect(x + (hx + hw * 0.4) * w, base - h * 0.06, w * 0.05, h * 0.035); }
  weather(c, x, y - 0.03, w, h + 0.06, s.still ? 2.5 : clock, 'snow', 1, 20, 'rgba(255,255,255,0.95)');
  c.restore();
  // frost creeping in from the corners
  for (const [fx, fy] of [[x, y], [x + w, y], [x, y + h], [x + w, y + h]]) glow(c, fx, fy, w * 0.32, [255, 255, 255], 0.5);
  // the leading of the little panes
  if (!s.small) {
    c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
    c.strokeStyle = s.tone(0.35); c.globalAlpha = 0.35; c.lineWidth = 0.0016;
    for (let i = -6; i <= 6; i++) { const d = i * w * 0.2; c.beginPath(); c.moveTo(x + d, y); c.lineTo(x + d + h * 0.5, y + h); c.moveTo(x + w - d, y); c.lineTo(x + w - d - h * 0.5, y + h); c.stroke(); }
    c.restore();
  }
  c.fillStyle = s.tone(0.12); windowFrame(c, x, y, w, h, 0.009);
  c.fillRect(x - 0.025, y + h + 0.006, w + 0.05, 0.016);
}

/** Glazed tiles: a raised border, and a round boss in each. */
function tiles(c: C, x: number, y: number, w: number, h: number, cols: number, rows: number, line: string, boss: string, lw: number) {
  const tw = w / cols, th = h / rows;
  c.strokeStyle = line; c.lineWidth = lw;
  c.beginPath();
  for (let i = 1; i < cols; i++) { c.moveTo(x + i * tw, y); c.lineTo(x + i * tw, y + h); }
  for (let j = 1; j < rows; j++) { c.moveTo(x, y + j * th); c.lineTo(x + w, y + j * th); }
  c.stroke();
  c.fillStyle = boss;
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
    const tx = x + i * tw, ty = y + j * th;
    c.strokeRect(tx + tw * 0.16, ty + th * 0.16, tw * 0.68, th * 0.68);
    c.beginPath(); c.arc(tx + tw / 2, ty + th / 2, Math.min(tw, th) * 0.15, 0, TAU); c.fill();
  }
}
/** The great tiled stove: feet and plinth, a firebox with its glowing door, a cornice, the tower, a crown, the flue. */
function stove(s: Stage, x: number, base: number, w: number, h: number, flick: number) {
  const { c } = s;
  const body = s.tone(0.17), dark = s.tone(0.07), line = s.tone(0.42), boss = s.tone(0.3);
  const plH = h * 0.05, fbH = h * 0.4, coH = h * 0.035, twH = h * 0.34, tcH = h * 0.03;
  const fbTop = base - plH - fbH, twTop = fbTop - coH - twH;
  c.fillStyle = s.tone(0.13); c.fillRect(x + w * 0.1, -0.3, w * 0.13, twTop + 0.32);
  c.fillStyle = dark;
  c.fillRect(x - w * 0.56, base - plH, w * 1.12, plH * 0.72);
  c.fillRect(x - w * 0.5, base - plH * 0.3, w * 0.12, plH * 0.3); c.fillRect(x + w * 0.38, base - plH * 0.3, w * 0.12, plH * 0.3);
  c.fillStyle = body; c.fillRect(x - w / 2, fbTop, w, fbH);
  tiles(c, x - w / 2, fbTop, w, fbH, 3, 3, line, boss, h * 0.004);
  c.fillStyle = dark; c.fillRect(x - w * 0.56, fbTop - coH, w * 1.12, coH);
  const tw = w * 0.76;
  c.fillStyle = body; c.fillRect(x - tw / 2, twTop, tw, twH);
  tiles(c, x - tw / 2, twTop, tw, twH, 2, 3, line, boss, h * 0.004);
  c.fillStyle = dark; c.fillRect(x - tw * 0.58, twTop - tcH, tw * 1.16, tcH);
  c.beginPath(); c.ellipse(x, twTop - tcH, tw * 0.4, h * 0.05, 0, Math.PI, 0); c.fill();
  c.beginPath(); c.arc(x, twTop - tcH - h * 0.066, h * 0.017, 0, TAU); c.fill();
  // the fire door: an arch of embers behind an iron grille
  const dw = w * 0.38, dh = fbH * 0.42, dx = x, db = base - plH - fbH * 0.08;
  glow(c, dx, db - dh * 0.5, w * 0.95, EMBER, 0.55 * flick);
  const g = c.createRadialGradient(dx, db, 0, dx, db, dh * 1.1);
  g.addColorStop(0, css([255, 236, 170], flick)); g.addColorStop(0.5, css([255, 150, 60], flick)); g.addColorStop(1, css([170, 60, 24], 1));
  c.fillStyle = g;
  c.beginPath(); c.moveTo(dx - dw / 2, db); c.lineTo(dx - dw / 2, db - dh + dw / 2); c.arc(dx, db - dh + dw / 2, dw / 2, Math.PI, 0); c.lineTo(dx + dw / 2, db); c.closePath(); c.fill();
  c.strokeStyle = dark; c.lineWidth = dw * 0.07;
  for (let i = 1; i < 4; i++) { const gx = dx - dw / 2 + (dw * i) / 4; c.beginPath(); c.moveTo(gx, db); c.lineTo(gx, db - dh + dw * 0.18); c.stroke(); }
  c.beginPath(); c.moveTo(dx - dw / 2, db); c.lineTo(dx - dw / 2, db - dh + dw / 2); c.arc(dx, db - dh + dw / 2, dw / 2, Math.PI, 0); c.lineTo(dx + dw / 2, db); c.stroke();
  return { door: [dx, db - dh * 0.5] as P, top: twTop - tcH - h * 0.08 };
}
/** A high-backed chair seen from the side; the sitter faces `face`. */
function chair(c: C, x: number, y: number, seat: number, face: 1 | -1) {
  c.save(); c.translate(x, y); c.scale(-face, 1);
  const d = seat * 0.95;
  c.fillRect(d * 0.42, -seat * 3.3, seat * 0.1, seat * 3.3);
  c.beginPath(); c.arc(d * 0.42 + seat * 0.05, -seat * 3.38, seat * 0.08, 0, TAU); c.fill();
  c.fillRect(d * 0.36, -seat * 2.9, seat * 0.12, seat * 1.6);
  c.fillRect(-d * 0.55, -seat * 1.02, d * 1.07, seat * 0.13);
  c.fillRect(-d * 0.55, -seat * 1.0, seat * 0.1, seat);
  c.fillRect(-d * 0.5, -seat * 0.32, d, seat * 0.06);
  c.restore();
}
/** A candle whose body burns down while its flame stays the same size. */
function taper(s: Stage, x: number, y: number, h: number, flame: number) {
  const { c, clock } = s;
  c.fillStyle = s.tone(0.12);
  c.beginPath(); c.ellipse(x, y - 0.004, flame * 1.2, flame * 0.3, 0, 0, TAU); c.fill();
  c.fillRect(x - flame * 0.18, y - flame * 0.5, flame * 0.36, flame * 0.5);
  c.fillStyle = css(mixRGB(s.screen, [252, 244, 226], 0.6));
  c.fillRect(x - flame * 0.32, y - flame * 0.5 - h, flame * 0.64, h);
  const fl = s.still ? 1 : 1 + 0.12 * Math.sin(clock * 13) + 0.08 * Math.sin(clock * 7.3);
  const fy = y - flame * 0.5 - h;
  glow(c, x, fy - flame * 0.8, flame * 6, [255, 206, 130], 0.55);
  c.fillStyle = 'rgba(255,190,96,1)';
  c.beginPath(); c.moveTo(x, fy - flame * 1.6 * fl); c.quadraticCurveTo(x + flame * 0.5, fy - flame * 0.5, x, fy - flame * 0.1); c.quadraticCurveTo(x - flame * 0.5, fy - flame * 0.5, x, fy - flame * 1.6 * fl); c.fill();
  c.fillStyle = 'rgba(255,248,220,1)'; c.beginPath(); c.ellipse(x, fy - flame * 0.55, flame * 0.14, flame * 0.32, 0, 0, TAU); c.fill();
}
/** His writing table: turned legs, an open book, ink and a quill, and the candle. */
function desk(s: Stage, x: number, base: number, w: number, h: number, candleH: number) {
  const c = s.c;
  const top = base - h;
  c.fillStyle = s.tone(0.14); c.strokeStyle = s.tone(0.14);
  c.fillRect(x - w / 2, top, w, h * 0.07);
  c.fillRect(x - w * 0.46, top + h * 0.06, w * 0.92, h * 0.1);
  for (const lx of [x - w * 0.4, x + w * 0.4]) {
    rod(c, [lx, top + h * 0.1], [lx, base], w * 0.045);
    for (const v of [0.3, 0.62]) { c.beginPath(); c.ellipse(lx, top + h * v, w * 0.04, h * 0.05, 0, 0, TAU); c.fill(); }
  }
  c.fillRect(x - w * 0.4, base - h * 0.2, w * 0.8, h * 0.035);
  // the book, open
  c.fillStyle = s.tone(0.2);
  c.beginPath(); c.moveTo(x - w * 0.38, top); c.lineTo(x - w * 0.36, top - h * 0.08); c.quadraticCurveTo(x - w * 0.22, top - h * 0.12, x - w * 0.08, top - h * 0.08); c.quadraticCurveTo(x + w * 0.06, top - h * 0.12, x + w * 0.2, top - h * 0.08); c.lineTo(x + w * 0.22, top); c.closePath(); c.fill();
  c.strokeStyle = s.tone(0.55); c.lineWidth = 0.0018;
  for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(x - w * 0.33, top - h * (0.03 + i * 0.016)); c.lineTo(x - w * 0.12, top - h * (0.03 + i * 0.016)); c.moveTo(x - w * 0.04, top - h * (0.03 + i * 0.016)); c.lineTo(x + w * 0.16, top - h * (0.03 + i * 0.016)); c.stroke(); }
  // ink and a quill
  c.fillStyle = s.ink; c.strokeStyle = s.ink;
  c.beginPath(); c.roundRect(x - w * 0.49, top - h * 0.1, w * 0.1, h * 0.1, w * 0.02); c.fill();
  c.beginPath(); c.moveTo(x - w * 0.44, top - h * 0.08); c.quadraticCurveTo(x - w * 0.5, top - h * 0.3, x - w * 0.62, top - h * 0.46); c.quadraticCurveTo(x - w * 0.5, top - h * 0.26, x - w * 0.43, top - h * 0.1); c.fill();
  taper(s, x + w * 0.34, top, candleH, 0.016);
}
/** The room: a beamed ceiling, panelling, floorboards. */
function room(s: Stage) {
  const c = s.c;
  c.fillStyle = s.tone(0.1); c.fillRect(-0.4, -0.4, s.W + 0.8, 0.45);
  for (let i = 0; i < 7; i++) c.fillRect(-0.3 + i * 0.27, 0.05, 0.06, 0.03);
  c.fillStyle = s.tone(0.46); c.fillRect(-0.4, 0.62, s.W + 0.8, FLOOR - 0.62);
  c.strokeStyle = s.tone(0.58); c.lineWidth = 0.003;
  for (let i = 0; i < 10; i++) c.strokeRect(-0.27 + i * 0.18, 0.65, 0.14, FLOOR - 0.68);
  c.fillStyle = s.tone(0.3); c.fillRect(-0.4, 0.612, s.W + 0.8, 0.012);
  c.fillStyle = s.tone(0.1); c.fillRect(-0.4, FLOOR, s.W + 0.8, 0.6);
  c.strokeStyle = s.tone(0.2); c.lineWidth = 0.002;
  for (let i = 1; i < 4; i++) { c.beginPath(); c.moveTo(-0.4, FLOOR + i * 0.035); c.lineTo(s.W + 0.4, FLOOR + i * 0.035); c.stroke(); }
}
/** The low sun through the window: a bright pane-shaped patch on the wall that slides away from it, reddens, and goes. */
function sunPatch(s: Stage, dusk: number) {
  const c = s.c;
  const k = 1 - seg(dusk, 0.5, 0.78);
  if (k <= 0) return;
  const m = seg(dusk, 0, 0.75);
  const cx = lerp(0.7, 0.3, m), cy = lerp(0.34, 0.5, m), w = lerp(0.13, 0.17, m), h = lerp(0.3, 0.2, m), sk = lerp(0.05, 0.12, m);
  const col = mixRGB([255, 250, 228], [255, 150, 84], seg(dusk, 0.1, 0.6));
  c.save();
  c.fillStyle = css(col, 0.32 * k);
  const quad = (x0: number, y0: number, x1: number, y1: number) => { c.beginPath(); c.moveTo(x0 + sk * (y0 - cy) / h, y0); c.lineTo(x1 + sk * (y0 - cy) / h, y0); c.lineTo(x1 + sk * (y1 - cy) / h, y1); c.lineTo(x0 + sk * (y1 - cy) / h, y1); c.closePath(); c.fill(); };
  // four panes, with the shadow of the mullion and the transom between them
  const g = 0.012;
  quad(cx - w / 2, cy - h / 2, cx - g / 2, cy - g / 2); quad(cx + g / 2, cy - h / 2, cx + w / 2, cy - g / 2);
  quad(cx - w / 2, cy + g / 2, cx - g / 2, cy + h / 2); quad(cx + g / 2, cy + g / 2, cx + w / 2, cy + h / 2);
  c.restore();
}

const THOUGHTS: { icon: Icon; at: number }[] = [{ icon: Q, at: 1.3 }, { icon: CITY, at: 3.0 }, { icon: AXES, at: 4.8 }, { icon: COMB, at: 6.9 }];

/** I. Seclusion: snow at the window; inside, by the great stove, he sits the whole day thinking, until the light goes. */
const seclusion: SceneFn = (s) => {
  const { t, c, clock } = s;
  const out = ease(seg(t, 0.2, 3.2)), push = ease(seg(t, 3.2, 10));
  s.cam(lerp(1.0, 0.62, out) - 0.08 * push, lerp(0.37, 0.52, out) + 0.03 * push, lerp(2.2, 1.04, out) * (1 + 0.16 * push));
  const dusk = ease(seg(t, 0.6, 9.4));
  const flick = s.still ? 1 : 0.84 + 0.16 * noise(clock * 3.1);
  s.backdrop({ mood: 'dawn', to: 'cave', k: dusk * 0.9, x: STOVE_X + 0.08, y: 0.72, r: lerp(1.8, 1.1, dusk), bright: lerp(1, 0.8 + 0.2 * flick, dusk) });
  room(s);
  sunPatch(s, dusk);
  winterWindow(s, WIN.x, WIN.y, WIN.w, WIN.h, dusk);
  const st = stove(s, STOVE_X, FLOOR, 0.28, 0.74, flick);
  heat(c, STOVE_X, st.top, 0.1, clock, 0.35, s.tone(0.5));
  s.spill(st.door[0], st.door[1], 0.55 * flick, [255, 160, 80]);
  desk(s, 0.82, FLOOR, 0.2, 0.2, lerp(0.085, 0.022, seg(t, 0, 10)));
  c.fillStyle = s.ink; chair(c, 0.54, FLOOR, 0.108, -1);
  // he sits facing the stove: chin on hand, a finger raised at a thought, hands held out to the warmth
  const idea = ease(seg(t, 4.3, 4.8)) * (1 - ease(seg(t, 5.8, 6.3)));
  const warm = ease(seg(t, 6.5, 7.1)) * (1 - ease(seg(t, 8.5, 9.1)));
  const breathe = s.still ? 0 : Math.sin(clock * 1.6);
  const arms = warm > 0 ? gesture('chin', 'receive', warm) : gesture('chin', 'pointUp', idea);
  const j = descartes(s, { x: 0.51, h: 0.42, face: -1, ...CHAIR, ...arms, lean: 6 + breathe + 14 * warm, tilt: 8 - 16 * idea + 2 * warm });
  if (warm > 0.3) glow(c, j.hand[0], j.hand[1], 0.07, EMBER, 0.45 * warm * flick);
  // thoughts rise from him and drift up into the dark; the last one stays
  THOUGHTS.forEach((th, i) => {
    const last = i === THOUGHTS.length - 1;
    const k = shown(t, th.at, last ? 99 : th.at + 4.2);
    if (k <= 0) return;
    const rise = easeOut(seg(t, th.at + 0.3, th.at + (last ? 2.6 : 4.2)));
    const x = j.head[0] + 0.07 + Math.sin((t - th.at) * 1.3 + i * 2) * 0.035 * rise;
    const y = lerp(j.head[1] - 0.15, last ? 0.32 : 0.2, rise);
    if (last) glow(c, x, y, 0.14, GOLD, 0.7 * seg(t, 7.6, 8.8));
    bubble(c, { x, y, r: 0.06, kind: 'thought', to: last || rise < 0.3 ? j.head : undefined, k, ink: s.ink, icon: th.icon });
  });
};

/* ================================================================ II. the wax */
const TABLE = 0.78;
const BLK = { x: 0.55, w: 0.24, h: 0.17 };
const MR = 0.058;
const ring2 = (i: number) => arch(i, 0.55, 0.73, 0.38, 0.37);
const LIT_AT = [1.9, 3.4, 4.9, 6.3, 7.8, 9.0];

/** A flower cut and laid on the table: stem, two leaves, five petals and a gold heart. */
function flower(s: Stage, x: number, y: number, size: number) {
  const c = s.c;
  c.fillStyle = s.tone(0.12); c.strokeStyle = s.tone(0.12); c.lineCap = 'round';
  c.lineWidth = size * 0.05;
  c.beginPath(); c.moveTo(x - size, y - size * 0.03); c.quadraticCurveTo(x - size * 0.4, y - size * 0.06, x, y - size * 0.3); c.stroke();
  for (const [lx, a] of [[-0.6, -0.5], [-0.32, 0.5]] as const) { c.beginPath(); c.ellipse(x + lx * size, y - size * 0.12, size * 0.16, size * 0.06, a, 0, TAU); c.fill(); }
  const hx = x + size * 0.04, hy = y - size * 0.42;
  for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU - Math.PI / 2; c.beginPath(); c.ellipse(hx + Math.cos(a) * size * 0.15, hy + Math.sin(a) * size * 0.15, size * 0.15, size * 0.085, a, 0, TAU); c.fill(); }
  c.fillStyle = css(GOLD); c.beginPath(); c.arc(hx, hy, size * 0.07, 0, TAU); c.fill();
}
/** A honeybee with gold bands, facing `face`. */
function honeybee(s: Stage, x: number, y: number, size: number, face: 1 | -1) {
  const c = s.c;
  c.save(); c.translate(x, y); c.scale(face, 1);
  c.fillStyle = s.ink;
  bee(c, 0, 0, size, s.still ? 0.3 : s.clock, 'rgba(255,255,255,0.92)');
  c.scale(size / 100, size / 100);
  c.beginPath(); c.ellipse(0, 0, 34, 22, 0, 0, TAU); c.clip();
  c.fillStyle = css(GOLD); c.fillRect(-22, -8, 9, 32); c.fillRect(-6, -8, 9, 32);
  c.restore();
}

/** II. The wax: fresh from the hive — and each sense, in turn, tells him something about it. */
const theWax: SceneFn = (s) => {
  const { t, c, clock } = s;
  const settle = ease(seg(t, 0, 2.4));
  s.cam(lerp(0.52, 0.62, settle), lerp(0.66, 0.52, settle), lerp(1.5, 1.03, settle) + 0.03 * ease(seg(t, 2.4, 11)));
  s.backdrop({ mood: 'gold', x: 0.32, y: 0.2, r: 1.5 });
  // the wall behind, panelled, and the table's edge
  c.fillStyle = s.tone(0.62); c.fillRect(-0.3, 0.46, s.W + 0.6, 0.012);
  c.strokeStyle = s.tone(0.66); c.lineWidth = 0.003;
  for (let i = 0; i < 6; i++) c.strokeRect(-0.2 + i * 0.3, 0.5, 0.24, 0.24);
  c.fillStyle = s.tone(0.24); c.fillRect(-0.3, TABLE, s.W + 0.6, 0.05);
  c.fillStyle = s.tone(0.1); c.fillRect(-0.3, TABLE + 0.05, s.W + 0.6, 0.5);
  c.strokeStyle = s.tone(0.34); c.lineWidth = 0.002;
  for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(-0.3, TABLE + 0.012 + i * 0.013); c.bezierCurveTo(0.3, TABLE + 0.006 + i * 0.016, 0.8, TABLE + 0.02 + i * 0.01, s.W + 0.3, TABLE + 0.01 + i * 0.013); c.stroke(); }

  // he leans in: to smell it, and to look
  const sniff = ease(seg(t, 2.9, 3.4)) * (1 - ease(seg(t, 4.2, 4.7)));
  const look = ease(seg(t, 4.4, 4.9)) * (1 - ease(seg(t, 5.8, 6.3)));
  bust(s, 1.1 - 0.03 * sniff, 0.33 + 0.04 * sniff, 0.27, -1, { tilt: 0.1 + 0.16 * sniff + 0.06 * look, wide: look });

  flower(s, 0.31, TABLE, 0.12);
  // the drop of honey: it gathers on the comb's side, runs down, and pools on the table
  const dropX = BLK.x - BLK.w / 2 - 0.004;
  const grow = seg(t, 0.7, 1.3), slide = ease(seg(t, 1.3, 1.85)), pool = seg(t, 1.85, 2.4);
  if (grow > 0) {
    c.fillStyle = css(HONEY);
    if (pool > 0) { c.beginPath(); c.ellipse(dropX - 0.02, TABLE - 0.003, 0.012 + 0.016 * pool, 0.006, 0, 0, TAU); c.fill(); }
    if (pool < 1) {
      const r = 0.006 + 0.008 * grow, dy = lerp(TABLE - BLK.h * 0.55, TABLE - r, slide) + easeIn(pool) * r;
      c.save(); c.globalAlpha = 1 - pool;
      c.beginPath(); c.moveTo(dropX + 0.002, dy - r * 2.4); c.quadraticCurveTo(dropX - r * 1.2, dy - r * 0.6, dropX - r * 0.9, dy); c.arc(dropX, dy, r, Math.PI, 0, true); c.closePath(); c.fill();
      c.fillStyle = 'rgba(255,250,232,0.9)'; c.beginPath(); c.ellipse(dropX - r * 0.35, dy - r * 0.2, r * 0.22, r * 0.38, 0.3, 0, TAU); c.fill();
      c.restore();
    }
  }
  // the colour: a sheen of gold runs over it
  const sheen = seg(t, 4.2, 5.4);
  const w = drawWax(s, BLK.x, TABLE, BLK.w, BLK.h, { shine: 0.6 + 0.4 * Math.sin(sheen * Math.PI) });
  if (sheen > 0 && sheen < 1) {
    c.save(); poly(c, waxOutline(BLK.x, TABLE, BLK.w, BLK.h, 0, 0)); c.clip();
    const sx = lerp(BLK.x - BLK.w, BLK.x + BLK.w, sheen);
    const g = c.createLinearGradient(sx - 0.06, 0, sx + 0.06, 0);
    g.addColorStop(0, 'rgba(255,240,190,0)'); g.addColorStop(0.5, 'rgba(255,248,214,0.85)'); g.addColorStop(1, 'rgba(255,240,190,0)');
    c.fillStyle = g; c.fillRect(BLK.x - BLK.w, w.top - 0.02, BLK.w * 2, BLK.h + 0.04);
    c.restore();
  }
  glow(c, BLK.x, TABLE - BLK.h / 2, 0.22, GOLD, 0.25 + 0.35 * Math.sin(sheen * Math.PI));
  // the smell: wisps from the comb and the flower
  const scent = seg(t, 2.6, 4.4);
  if (scent > 0 && scent < 1) {
    c.save(); c.strokeStyle = s.tone(0.35); c.lineWidth = 0.004; c.lineCap = 'round';
    for (let i = 0; i < 4; i++) {
      const x0 = i < 3 ? BLK.x - 0.06 + i * 0.06 : 0.31, y0 = i < 3 ? w.top - 0.01 : TABLE - 0.05;
      const a = Math.sin(scent * Math.PI) * (0.8 - (i === 3 ? 0.3 : 0));
      c.globalAlpha = a;
      c.beginPath();
      for (let k = 0; k <= 12; k++) { const v = k / 12; c.lineTo(x0 + Math.sin(v * 7 + clock * 3 + i) * 0.012 + v * 0.03 * (i - 1), y0 - v * (0.1 + scent * 0.06)); }
      c.stroke();
    }
    c.restore();
  }
  // shape and size: a dotted outline goes round it, then its measure
  const meas = seg(t, 5.6, 6.6), measOut = 1 - seg(t, 9.6, 10.4);
  if (meas > 0 && measOut > 0) {
    const x0 = BLK.x - BLK.w / 2 - 0.012, x1 = BLK.x + BLK.w / 2 + 0.012, y0 = TABLE - BLK.h - 0.012;
    c.save(); c.globalAlpha = measOut;
    thread(c, [[x0, TABLE], [x0, y0], [x1, y0], [x1, TABLE]], seg(meas, 0, 0.6), [40, 34, 30], 0.003, { dash: [0.01, 0.008], curve: 0, bead: false });
    const ar = seg(meas, 0.55, 1);
    if (ar > 0) {
      c.strokeStyle = s.ink; c.lineWidth = 0.004; c.lineCap = 'round';
      c.globalAlpha = measOut * ar;
      measure(c, x0, y0 - 0.03, x1, y0 - 0.03, 0.014);
      measure(c, x0 - 0.03, TABLE, x0 - 0.03, y0, 0.014);
    }
    c.restore();
  }
  // the bee: in from the garden, round the flower, down to the honey, then about the comb
  const bp: P = t < 1.3 ? [lerp(0.0, 0.3, seg(t, 0, 1.3)) + Math.sin(t * 5) * 0.02, 0.58 + Math.sin(t * 6) * 0.03 + 0.08 * seg(t, 0, 1.3)]
    : t < 2.4 ? [lerp(0.3, dropX - 0.06, ease(seg(t, 1.3, 2.2))), lerp(0.66, TABLE - 0.024, ease(seg(t, 1.3, 2.2))) - (s.still ? 0 : Math.abs(Math.sin(clock * 9)) * 0.004)]
    : t < 9.8 ? [0.36 + Math.sin((t - 2.4) * 1.1) * 0.1, 0.56 + Math.sin((t - 2.4) * 2.2) * 0.05]
    : [0.26 - (t - 9.8) * 0.35, 0.56 - (t - 9.8) * 0.2];
  const bv = t < 2.4 ? 1 : t < 9.8 ? Math.cos((t - 2.4) * 1.1) : -1;
  honeybee(s, bp[0], bp[1], 0.066, bv >= 0 ? 1 : -1);

  // his hand: resting; pressing the comb (hard and cold); tapping it (it rings)
  const tap = (at: number) => Math.max(0, 1 - Math.abs(t - at) / 0.13);
  const lift = 0.035 * (1 - Math.max(tap(8.75), tap(9.15)));
  const [hx, hy, ha, hp] = keys(t, [
    [6.5, [0.98, 1.16, Math.PI * 1.2, 0.2]],
    [6.95, [0.86, TABLE - 0.02, Math.PI - 0.05, 0.6]],
    [7.3, [BLK.x + BLK.w / 2 + 0.003, TABLE - BLK.h * 0.52, Math.PI - 0.12, 1]],
    [8.3, [BLK.x + BLK.w / 2 + 0.003, TABLE - BLK.h * 0.52, Math.PI - 0.12, 1]],
    [8.6, [BLK.x + 0.04, TABLE - BLK.h - 0.003 - 0.035, Math.PI * 0.62, 1]],
    [9.7, [BLK.x + 0.04, TABLE - BLK.h - 0.003 - 0.035, Math.PI * 0.62, 1]],
    [10.4, [0.98, 1.16, Math.PI * 1.2, 0.2]],
  ]);
  const tapping = t > 8.6 && t < 9.7;
  const tip: P = t > 6.5 && t < 10.4 ? armTo(s, [1.07, 1.02], [hx, hy + (tapping ? 0.035 - lift : 0)], ha, 0.33, 0.33, 0.05, { point: hp, curl: 0.95 }) : [hx, hy];
  // the cold: frost where the finger presses
  const cold = seg(t, 7.3, 7.6) * (1 - seg(t, 8.3, 8.6));
  if (cold > 0) {
    glow(c, tip[0], tip[1], 0.06, [210, 236, 255], 0.8 * cold);
    for (let i = 0; i < 4; i++) { const a = i * 1.7 + clock * 0.6; twinkle(c, tip[0] + Math.cos(a) * 0.03, tip[1] + Math.sin(a) * 0.03, 0.008 * cold, 'rgba(236,248,255,0.95)'); }
  }
  // the sound: each tap rings out
  for (const at of [8.75, 9.15]) { const k = seg(t, at, at + 0.7); if (k > 0 && k < 1) sound(c, tip[0], tip[1] - 0.01, 0.05, clock, -Math.PI / 2, 1 - k, s.tone(0.25), 1.1); }

  // the medallions: each lights when its sense speaks, tied by a thread of gold to what it told
  const from: P[] = [[dropX - 0.02, TABLE - 0.006], [BLK.x - 0.06, w.top - 0.05], [BLK.x - 0.05, TABLE - BLK.h * 0.62], [BLK.x + BLK.w / 2 + 0.012, TABLE - BLK.h - 0.012], [BLK.x + BLK.w / 2, TABLE - BLK.h * 0.52], [BLK.x + 0.04, TABLE - BLK.h]];
  const all = ease(seg(t, 9.9, 10.6));
  for (let i = 0; i < 6; i++) {
    const at = LIT_AT[i], k = shown(t, at, 99);
    if (k <= 0) continue;
    const p = ring2(i);
    thread(c, [from[i], p], ease(seg(t, at - 0.3, at + 0.2)), GOLD, 0.0035, { alpha: lerp(0.85, 0.25, seg(t, at + 0.6, at + 1.2)) + 0.6 * all, curve: 0.08 });
    medal(s, p[0], p[1], MR, sense(i), { k, lit: Math.max(1 - seg(t, at + 0.9, at + 1.6), all) });
  }
  s.spill(BLK.x, TABLE - 0.1, 0.4, [255, 200, 110]);
};

/* ================================================================ III. near the fire */
const LEDGE = 0.8;
const ARCH = { x: 0.3, w: 0.3, top: 0.42 };
const DISH = 0.78;
const ring3 = (i: number) => arch(i, 0.8, 0.76, 0.3, 0.37);
const CROSS_AT = [2.9, 4.1, 5.3, 7.2, 8.4, 10.0];

/** The stove close: its tiles, the open door with the fire roaring inside, the stone ledge before it. */
function hearth(s: Stage, flick: number) {
  const { c, clock } = s;
  const x0 = ARCH.x - ARCH.w / 2, x1 = ARCH.x + ARCH.w / 2;
  c.fillStyle = s.tone(0.17); c.fillRect(-0.4, -0.4, 0.98, LEDGE + 0.4);
  tiles(c, -0.4 + 0.02, -0.4, 0.96, LEDGE + 0.4, 7, 9, s.tone(0.42), s.tone(0.3), 0.003);
  c.fillStyle = s.tone(0.08); c.fillRect(0.56, -0.4, 0.035, LEDGE + 0.4);
  // the opening: dark inside, an arch of brick, the fire
  const arch2 = () => { c.beginPath(); c.moveTo(x0, LEDGE); c.lineTo(x0, ARCH.top + ARCH.w / 2); c.arc(ARCH.x, ARCH.top + ARCH.w / 2, ARCH.w / 2, Math.PI, 0); c.lineTo(x1, LEDGE); c.closePath(); };
  c.fillStyle = s.tone(0.06); c.lineWidth = 0.03; c.strokeStyle = s.tone(0.08);
  arch2(); c.stroke();
  c.save(); arch2(); c.clip();
  const g = c.createRadialGradient(ARCH.x, LEDGE, 0, ARCH.x, LEDGE, ARCH.w * 1.2);
  g.addColorStop(0, css([140, 54, 22])); g.addColorStop(1, css([40, 14, 8]));
  c.fillStyle = g; c.fillRect(x0, ARCH.top, ARCH.w, LEDGE - ARCH.top);
  fire(c, ARCH.x, LEDGE - 0.01, 0.26, clock, { logs: s.tone(0.04), sparks: 0, glowK: 0 });
  c.restore();
  glow(c, ARCH.x, LEDGE - 0.14, 0.75, EMBER, 0.5 * flick);
  if (!s.still) sparks(c, ARCH.x, LEDGE - 0.16, 0.24, clock, 12);
  // the iron door, swung open on its hinges
  c.fillStyle = s.tone(0.05);
  c.beginPath(); c.moveTo(x0 - 0.008, ARCH.top + 0.03); c.lineTo(x0 - 0.1, ARCH.top + 0.07); c.lineTo(x0 - 0.1, LEDGE - 0.04); c.lineTo(x0 - 0.008, LEDGE - 0.005); c.closePath(); c.fill();
  c.fillStyle = s.tone(0.3); for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(x0 - 0.055, ARCH.top + 0.12 + i * 0.1, 0.005, 0, TAU); c.fill(); }
  // the ledge
  c.fillStyle = s.tone(0.2); c.fillRect(-0.4, LEDGE, s.W + 0.8, 0.045);
  c.fillStyle = s.tone(0.1); c.fillRect(-0.4, LEDGE + 0.045, s.W + 0.8, 0.5);
  c.strokeStyle = s.tone(0.45); c.lineWidth = 0.003; c.beginPath(); c.moveTo(-0.4, LEDGE + 0.002); c.lineTo(s.W + 0.4, LEDGE + 0.002); c.stroke();
}

/** III. Near the fire: put by the stove, the wax gives up every quality the senses found in it. */
const nearFire: SceneFn = (s) => {
  const { t, c, clock } = s;
  const pan = ease(seg(t, 0.4, 2.4)), push = ease(seg(t, 2.4, 12));
  s.cam(lerp(0.5, 0.68, pan) + 0.02 * push, lerp(0.6, 0.55, pan), lerp(1.3, 1.0, pan) + 0.08 * push);
  const flick = s.still ? 1 : 0.84 + 0.16 * noise(clock * 3.3);
  s.backdrop({ mood: 'fire', x: ARCH.x, y: 0.62, r: 1.3, bright: 0.8 + 0.2 * flick });
  hearth(s, flick);
  // the dish slides in along the ledge
  const dx = lerp(1.42, DISH, ease(seg(t, 0.1, 1.4)));
  const melt = ease(seg(t, 5.3, 7.4)), pale = ease(seg(t, 4.1, 5.5));
  const base = dish(s, dx, LEDGE, 0.3);
  // heat on it: a shimmer, the taste going off as a golden vapour, then plain steam
  const hot = seg(t, 1.6, 3);
  heat(c, dx, base - 0.13, 0.16, clock, 0.45 * hot, 'rgba(255,236,206,0.7)');
  smoke(c, dx, base - 0.07 + 0.05 * melt, 0.09, clock, [255, 214, 130], seg(t, 1.8, 2.4) * (1 - seg(t, 3.2, 3.8)), s.still ? 0 : 7, 0.1);
  smoke(c, dx, base - 0.02, 0.1, clock, [252, 246, 236], seg(t, 6.5, 8) * 0.8, s.still ? 0 : 6, -0.2);
  const w = drawWax(s, dx, base, 0.2, 0.15, { melt, pale, shine: 0.6 + 0.3 * melt });
  // the smell: its wisps rise, thin, and are gone
  const sm = seg(t, 2.8, 4.1);
  if (sm > 0 && sm < 1) {
    c.save(); c.strokeStyle = s.tone(0.32); c.lineWidth = 0.004; c.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      c.globalAlpha = (1 - sm) * 0.9;
      c.beginPath();
      for (let k = 0; k <= 10; k++) { const v = k / 10; if (v > 1 - sm * 0.9) break; c.lineTo(dx - 0.05 + i * 0.05 + Math.sin(v * 7 + clock * 3 + i) * 0.012, w.top - 0.01 - v * (0.08 + sm * 0.14)); }
      c.stroke();
    }
    c.restore();
  }
  // it runs over the rim in drops, and pools on the stone
  const run = seg(t, 6.6, 9);
  if (run > 0) {
    c.fillStyle = css(mixRGB(HONEY, PALE, pale));
    [[-0.15, 1, 0.3], [-0.12, 0.6, 0.5], [0.13, 0.8, 0.1], [0.155, 1.1, 0.6]].forEach(([ox, len, lag]) => {
      const k = seg(run, lag * 0.5, lag * 0.5 + 0.5);
      if (k <= 0) return;
      const rx = dx + ox, y0 = LEDGE - 0.021, y1 = y0 + 0.02 * len * k;
      c.beginPath(); c.moveTo(rx - 0.005, y0); c.quadraticCurveTo(rx - 0.002, (y0 + y1) / 2, rx - 0.0035, y1); c.arc(rx, y1, 0.0035, Math.PI, 0, true); c.quadraticCurveTo(rx + 0.002, (y0 + y1) / 2, rx + 0.005, y0); c.closePath(); c.fill();
    });
    c.beginPath(); c.ellipse(dx - 0.14, LEDGE + 0.002, 0.03 * run, 0.004, 0, 0, TAU); c.fill();
  }

  // his hand, from above: brings the dish; later reaches to it and snatches back, burnt; then taps the pool, and it makes no sound
  const SH: P = [1.5, 0.18];
  if (t < 2.4) {
    const away = ease(seg(t, 1.5, 2.3));
    armTo(s, SH, [dx + 0.16 + away * 0.4, LEDGE - 0.035 - away * 0.25], Math.PI * 0.72, 0.5, 0.5, 0.062, { point: 0, curl: 1.15, side: 1 });
  } else if (t > 6.9 && t < 10.9) {
    const burnt = t > 7.65 && t < 8.7;
    const shake = burnt && !s.still ? Math.sin(clock * 50) * 0.006 : 0;
    const tap = (at: number) => Math.max(0, 1 - Math.abs(t - at) / 0.12);
    const [hx, hy] = keys(t, [
      [6.9, [1.75, 0.2]], [7.55, [dx + w.half * 0.5, w.top - 0.002]], [7.65, [dx + w.half * 0.5, w.top + 0.004]],
      [7.9, [1.06, 0.42]], [8.7, [1.08, 0.44]], [9.1, [dx + 0.04, w.top - 0.035]], [9.9, [dx + 0.04, w.top - 0.035]], [10.9, [1.75, 0.2]],
    ]);
    const dip = t > 9.1 && t < 9.9 ? 0.035 * Math.max(tap(9.35), tap(9.7)) : 0;
    const tip = armTo(s, SH, [hx + shake, hy + dip], Math.PI * 0.66, 0.5, 0.5, 0.062, { point: 1, curl: 0.95, side: 1 });
    if (burnt) {
      const k = 1 - seg(t, 8.0, 8.7);
      glow(c, tip[0], tip[1], 0.06, [255, 90, 40], 0.9 * k);
      heat(c, tip[0], tip[1] - 0.01, 0.07, clock, k, 'rgba(210,70,40,0.85)');
    }
    for (const at of [9.35, 9.7]) { const k = seg(t, at, at + 0.6); if (k > 0) ripple(c, dx + 0.04, w.top + 0.004, 0.09, k, s.tone(0.35), 0.25); }
  }

  // the medallions: all six again, then struck out one by one as each quality goes
  for (let i = 0; i < 6; i++) {
    const p = ring3(i);
    const k = shown(t, 1.5 + i * 0.12, 99);
    const change = i === 2 ? pale : i === 3 ? melt : i === 4 ? seg(t, 7.65, 7.7) : 0;
    const x2 = seg(t, CROSS_AT[i], CROSS_AT[i] + 0.4);
    medal(s, p[0], p[1], MR, sense(i, change), { k, lit: 1 - seg(t, CROSS_AT[i] - 0.4, CROSS_AT[i]), cross: x2, dim: x2 * 0.5 });
  }
  s.spill(ARCH.x, LEDGE - 0.15, 0.7 * flick, [255, 150, 70]);
};

/* ================================================================ IV. the same wax */
const STUDY = { x: 0.84, top: 0.62 };
const PUD = { w: 0.19, h: 0.14, spread: 0.55, flat: 0.6 };

/** IV. The same wax: what he remembers, what lies in the dish. The same? He follows the one into the other, and nods. */
const sameWax: SceneFn = (s) => {
  const { t, c, clock } = s;
  const push = ease(seg(t, 0, 10));
  s.cam(lerp(0.58, 0.6, push), lerp(0.5, 0.48, push), lerp(1.14, 1.22, push));
  s.backdrop({ mood: 'day', x: 1.02, y: 0.22, r: 1.7 });
  // the study by morning: panelling, the window, its light falling across the table
  c.fillStyle = s.tone(0.1); c.fillRect(-0.4, -0.4, s.W + 0.8, 0.44);
  c.fillStyle = s.tone(0.48); c.fillRect(-0.4, 0.62, s.W + 0.8, FLOOR - 0.62);
  c.strokeStyle = s.tone(0.6); c.lineWidth = 0.003;
  for (let i = 0; i < 10; i++) c.strokeRect(-0.27 + i * 0.18, 0.65, 0.14, FLOOR - 0.68);
  winterWindow(s, 0.98, 0.12, 0.16, 0.34, 0.02);
  c.fillStyle = 'rgba(255,250,232,0.18)';
  c.beginPath(); c.moveTo(0.98, 0.12); c.lineTo(0.98, 0.46); c.lineTo(0.66, FLOOR); c.lineTo(0.36, FLOOR); c.closePath(); c.fill();
  // dust turning slowly in the light
  for (let i = 0; i < 12; i++) {
    const v = hash(i, 21), u = (hash(i, 23) + (s.still ? 0 : clock * 0.012 * (0.5 + hash(i, 29)))) % 1;
    const y = lerp(0.2, FLOOR - 0.04, u), x0 = lerp(0.98, 0.66, (y - 0.12) / (FLOOR - 0.12)), x1 = lerp(0.98, 0.36, (y - 0.46) / (FLOOR - 0.46));
    const x = lerp(x1 > 0.98 ? 0.96 : Math.min(0.96, x1), x0, v) + (s.still ? 0 : Math.sin(clock * 0.7 + i) * 0.01);
    c.fillStyle = `rgba(255,252,236,${0.7 * Math.sin(u * Math.PI)})`; c.beginPath(); c.arc(x, y, 0.0022 + hash(i, 31) * 0.0018, 0, TAU); c.fill();
  }
  c.fillStyle = s.tone(0.1); c.fillRect(-0.4, FLOOR, s.W + 0.8, 0.6);
  // the table and, in the dish, what is left
  const T = STUDY;
  c.fillStyle = s.tone(0.14); c.strokeStyle = s.tone(0.14);
  c.fillRect(T.x - 0.21, T.top, 0.42, 0.018);
  c.fillRect(T.x - 0.19, T.top + 0.018, 0.38, 0.032);
  for (const lx of [T.x - 0.17, T.x + 0.17]) { rod(c, [lx, T.top + 0.03], [lx, FLOOR], 0.013); c.beginPath(); c.ellipse(lx, T.top + 0.1, 0.011, 0.017, 0, 0, TAU); c.fill(); c.beginPath(); c.ellipse(lx, T.top + 0.17, 0.011, 0.017, 0, 0, TAU); c.fill(); }
  const base = dish(s, T.x, T.top, 0.36);
  const pud = drawWax(s, T.x, base, PUD.w, PUD.h, { melt: 1, pale: 0.9, shine: 0.5, spread: PUD.spread, flat: PUD.flat });
  // what he remembers, in a cloud above him: the comb as it was
  const think = shown(t, 1.0, 99);
  const cloud: P = [0.32, 0.23];
  // Descartes, standing: looks at the dish, points up to the memory, then to the dish; then nods, open-handed
  const up = ease(seg(t, 2.1, 2.7)) * (1 - ease(seg(t, 3.5, 4.0)));
  const down = ease(seg(t, 3.7, 4.3)) * (1 - ease(seg(t, 6.6, 7.2)));
  const nod = t > 7.4 && t < 8.8 && !s.still ? Math.sin(((t - 7.4) * TAU) / 0.7) * 9 : 0;
  const open = ease(seg(t, 7.2, 7.8));
  const reach: P | null = up > 0.05 ? [lerp(0.42, cloud[0] + 0.05, up), lerp(0.56, cloud[1] + 0.1, up)] : down > 0.05 ? [lerp(0.46, T.x - 0.1, down), lerp(0.6, T.top - 0.05, down)] : null;
  const j = descartes(s, { x: 0.34, face: 1, h: 0.47, ...(open > 0 ? gesture('rest', 'offer', open) : gesture('rest')), reach, tilt: 12 + nod - 16 * up });
  glow(c, cloud[0], cloud[1], 0.17, GOLD, 0.5 * think);
  bubble(c, { x: cloud[0], y: cloud[1], r: 0.1, wide: 1.4, kind: 'thought', to: j.head, k: think, ink: s.ink, icon: COMB, scale: 0.72 });
  // between them: a question … then, once the remembered block has been followed down into the dish, an equals sign
  const link = ease(seg(t, 3.8, 5.0));
  const mid: P = [0.6, 0.27];
  thread(c, [[cloud[0] + 0.15, cloud[1] + 0.02], mid, [T.x, pud.top - 0.03]], link, GOLD, 0.0045, { dash: [0.014, 0.01], curve: 0.06, alpha: 0.9 });
  const qk = seg(t, 4.4, 4.9) * (1 - seg(t, 6.9, 7.1)), ek = seg(t, 7.0, 7.3);
  if (qk > 0 || ek > 0) {
    glow(c, mid[0], mid[1], 0.12, GOLD, 0.65 * Math.max(qk, ek));
    c.save(); c.translate(mid[0], mid[1]);
    c.fillStyle = PAPER; c.strokeStyle = s.ink; c.lineWidth = 0.005;
    const r = 0.062 * (ek > 0 ? pop(ek) : pop(qk));
    c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill(); c.stroke();
    c.scale(r * 0.9, r * 0.9); c.fillStyle = ek > 0 ? css([176, 112, 20]) : s.ink; (ek > 0 ? EQ : Q)(c);
    c.restore();
  }
  // the remembered block, followed: it travels the thread, slumps, and lies exactly where the puddle lies
  const go = seg(t, 5.0, 7.0);
  if (go > 0 && go < 1) {
    const e = ease(go);
    const px = e < 0.5 ? lerp(cloud[0] + 0.1, mid[0], e * 2) : lerp(mid[0], T.x, e * 2 - 1);
    const py = e < 0.5 ? lerp(cloud[1] + 0.08, mid[1] + 0.08, e * 2) : lerp(mid[1] + 0.08, base, e * 2 - 1);
    const sc = lerp(0.55, 1, e);
    const pts = waxOutline(px, py, PUD.w * sc, PUD.h * sc, ease(seg(go, 0.55, 1)), clock, PUD.spread, PUD.flat);
    c.save(); c.setLineDash([0.011, 0.007]); c.strokeStyle = css([196, 128, 30]); c.lineWidth = 0.0045; poly(c, pts); c.stroke();
    c.fillStyle = css(GOLD, 0.22); c.fill(); c.restore();
  }
  const flash = seg(t, 6.9, 7.8);
  if (flash > 0 && flash < 1) glow(c, T.x, base - 0.01, 0.16, GOLD, Math.sin(flash * Math.PI));
  // and he agrees
  bubble(c, { x: j.head[0] + 0.11, y: j.head[1] - 0.07, r: 0.058, to: j.mouth, k: shown(t, 7.8, 99), ink: s.ink, icon: CHECK });
};

/* ================================================================ V. the mind alone */
/** Shapes the wax can take, each as points round a centre: block, puddle, ball, star, rod, cross, blob. */
function shapeAt(kind: number, th: number): P {
  const sup = (a: number, b: number, n: number): P => { const cs = Math.cos(th), sn = Math.sin(th); return [a * Math.sign(cs) * Math.pow(Math.abs(cs), 2 / n), b * Math.sign(sn) * Math.pow(Math.abs(sn), 2 / n)]; };
  const rad = (r: number): P => [Math.cos(th) * r, Math.sin(th) * r];
  switch (kind % 7) {
    case 0: return sup(1.05, 0.75, 8);
    case 1: { const p = sup(1.6, 0.26, 3); return [p[0], p[1] + 0.5]; }
    case 2: return rad(0.85);
    case 3: return rad(0.92 + 0.36 * Math.cos(5 * th + Math.PI / 2));
    case 4: return sup(0.34, 1.15, 6);
    case 5: return rad(0.7 + 0.38 * Math.pow(Math.abs(Math.cos(2 * th)), 3));
    default: return rad(0.86 + 0.16 * Math.sin(3 * th) + 0.1 * Math.cos(5 * th + 1));
  }
}
/** The wax as the mind holds it: one honey-gold stuff, whatever outline it takes (`f` counts through the shapes). */
function mindWax(c: C, x: number, y: number, size: number, f: number, ghosts: number, ink: string) {
  const outline = (ff: number) => {
    const i = Math.floor(ff), k = ease(ff - i);
    c.beginPath();
    for (let n = 0; n <= 48; n++) {
      const th = (n / 48) * TAU;
      const a = shapeAt(i, th), b = shapeAt(i + 1, th);
      const px = x + lerp(a[0], b[0], k) * size, py = y + lerp(a[1], b[1], k) * size;
      if (n) c.lineTo(px, py); else c.moveTo(px, py);
    }
    c.closePath();
  };
  // the shapes it has just been, still flickering in the imagination
  for (let g = ghosts; g >= 1; g--) { outline(f - g * 0.4); c.strokeStyle = css([176, 110, 26], 0.55 * (1 - g / (ghosts + 1))); c.lineWidth = size * 0.07; c.setLineDash([size * 0.18, size * 0.12]); c.stroke(); c.setLineDash([]); }
  outline(f);
  const g = c.createRadialGradient(x - size * 0.3, y - size * 0.3, 0, x, y, size * 1.5);
  g.addColorStop(0, css([255, 236, 170])); g.addColorStop(0.45, css(GOLD)); g.addColorStop(1, css(HONEY));
  c.fillStyle = g; c.fill();
  c.save(); c.clip(); comb(c, x - size * 2, y - size * 1.6, x + size * 2, y + size * 1.6, size * 0.26, css([170, 96, 16], 0.5)); c.restore();
  outline(f); c.strokeStyle = ink; c.lineWidth = size * 0.08; c.stroke();
}

/** V. The mind alone: he shuts his eyes; the senses fall away; inside, the wax takes shape after shape, and the mind sees it. */
const mindAlone: SceneFn = (s) => {
  const { t, c, clock } = s;
  const push = ease(seg(t, 1.6, 10));
  s.cam(lerp(s.W / 2, 0.56, push), lerp(0.5, 0.44, push), lerp(1, 1.18, push));
  s.backdrop({ mood: 'night', x: 0.56, y: 0.42, r: 1.25 });
  for (let i = 0; i < 14; i++) twinkle(c, hash(i, 11) * s.W, hash(i, 13) * 0.9, 0.004 + hash(i, 17) * 0.004, `rgba(255,250,232,${0.35 + 0.25 * (s.still ? 1 : Math.sin(clock * 1.7 + i))})`);
  const HX = 0.58, HY = 0.47, HS = 0.5;
  const shut = ease(seg(t, 0.9, 1.6));
  const open = ease(seg(t, 1.8, 3.0));
  const steady = ease(seg(t, 7.4, 8.4));
  // the shapes come faster and faster, then settle under the mind's eye
  const f = t < 2.6 ? 0 : t < 7.6 ? Math.pow((t - 2.6) / 5, 1.6) * 7.5 : 7.5 + (t - 7.6) * 0.35;
  const inner = (cc: C) => {
    if (open <= 0) return;
    const R = 31 * open, cx = -6, cy = -16;
    cc.save();
    cc.beginPath(); cc.arc(cx, cy, R, 0, TAU); cc.clip();
    const g = cc.createRadialGradient(cx, cy + 4, 0, cx, cy, R);
    g.addColorStop(0, 'rgba(255,252,240,1)'); g.addColorStop(0.7, 'rgba(255,236,196,1)'); g.addColorStop(1, 'rgba(232,180,104,1)');
    cc.fillStyle = g; cc.fillRect(cx - R, cy - R, R * 2, R * 2);
    // the mind's own eye, opening above it, and its light on the wax
    if (steady > 0) {
      cc.fillStyle = `rgba(255,214,120,${0.55 * steady})`;
      cc.beginPath(); cc.moveTo(cx - 3, cy - 13); cc.lineTo(cx + 3, cy - 13); cc.lineTo(cx + 13, cy + 12); cc.lineTo(cx - 13, cy + 12); cc.closePath(); cc.fill();
    }
    mindWax(cc, cx, cy + 8, 13, f, t > 5.2 && t < 8 ? 3 : 0, s.ink);
    if (steady > 0) {
      cc.save(); cc.translate(cx, cy - 17); cc.scale(8.5 * steady, 8.5 * steady);
      cc.fillStyle = 'rgba(255,255,255,1)'; cc.strokeStyle = s.ink; cc.lineWidth = 0.14;
      cc.beginPath(); cc.moveTo(-0.95, 0); cc.quadraticCurveTo(0, -0.9, 0.95, 0); cc.quadraticCurveTo(0, 0.9, -0.95, 0); cc.fill(); cc.stroke();
      cc.fillStyle = css(HONEY); cc.beginPath(); cc.arc(0, 0, 0.4, 0, TAU); cc.fill();
      cc.fillStyle = s.ink; cc.beginPath(); cc.arc(0, 0, 0.17, 0, TAU); cc.fill();
      cc.restore();
    }
    cc.restore();
    cc.strokeStyle = 'rgba(255,226,160,1)'; cc.lineWidth = 2.2; cc.beginPath(); cc.arc(cx, cy, R, 0, TAU); cc.stroke();
  };
  glow(c, HX - 0.02, HY - 0.08, 0.3, GOLD, 0.6 * open * (0.8 + 0.2 * steady));
  // the six senses, round the head; they dim and fall away
  const spots: P[] = [[1.0, 0.62], [1.04, 0.46], [0.98, 0.3], [0.24, 0.2], [0.21, 0.64], [0.2, 0.42]];
  for (let i = 0; i < 6; i++) {
    const at = 2.2 + i * 0.5;
    const fall = easeIn(seg(t, at, at + 1.6));
    const [px, py] = spots[i];
    medal(s, px + fall * 0.04 * (i < 3 ? 1 : -1), py + fall * 0.7, MR, sense(i), { k: shown(t, 0.1 + i * 0.08, at + 1.6), lit: 1 - seg(t, at - 0.6, at), dim: seg(t, at - 0.6, at), rot: fall * (i % 2 ? 1.2 : -1.2) });
  }
  bust(s, HX, HY, HS, 1, { eye: 1 - shut, tilt: 0.04 * steady, inner });
  s.spill(HX, HY - 0.08, 0.5 * open, [255, 210, 130]);
};

/* ================================================================ VI. from the window */
const CORNER = 0.42;
const WIN6 = { x: 0.1, y: 0.13, w: 0.25, h: 0.31 };

/** A Dutch house front with a stepped gable, snow on every step; its windows warm when `lit`. */
function gabled(c: C, x: number, base: number, w: number, h: number, steps: number, fill: string, cut: string, lit: number) {
  c.fillStyle = fill;
  c.fillRect(x - w / 2, base - h, w, h);
  const sh = (w * 0.55) / steps;
  for (let i = 0; i < steps; i++) { const sw = w * (1 - (i + 1) / (steps + 1.4)); c.fillRect(x - sw / 2, base - h - (i + 1) * sh, sw, sh + 0.001); }
  c.fillStyle = 'rgba(252,252,250,0.95)';
  for (let i = 0; i < steps; i++) {
    const sw = w * (1 - (i + 1) / (steps + 1.4)), sw0 = i ? w * (1 - i / (steps + 1.4)) : w;
    for (const sd of [-1, 1]) c.fillRect(x + sd * sw / 2 - (sd > 0 ? (sw0 - sw) / 2 : 0) - (sd < 0 ? 0 : 0), base - h - i * sh - 0.004, (sw0 - sw) / 2, 0.006);
  }
  c.fillRect(x - w * 0.1, base - h - steps * sh - 0.004, w * 0.2, 0.006);
  const win = lit > 0.01 ? css(mixRGB([200, 200, 200], [255, 204, 120], lit)) : cut;
  c.fillStyle = win;
  for (let r = 0; r < 3; r++) for (let k = 0; k < 2; k++) c.fillRect(x - w * 0.3 + k * w * 0.42, base - h + 0.03 + r * h * 0.3, w * 0.18, h * 0.16);
}
/** A bare winter tree. */
function bareTree(c: C, x: number, y: number, h: number, seed: number, time: number) {
  const branch = (x0: number, y0: number, ang: number, len: number, w: number, depth: number) => {
    const sway = Math.sin(time * 0.8 + depth + seed) * 0.02 * depth;
    const x1 = x0 + Math.cos(ang + sway) * len, y1 = y0 + Math.sin(ang + sway) * len;
    c.lineWidth = w; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
    if (depth >= 4) return;
    for (let i = 0; i < 2; i++) branch(x1, y1, ang + (i ? 0.46 : -0.42) + (hash(depth * 7 + i, seed) - 0.5) * 0.5, len * 0.7, w * 0.64, depth + 1);
  };
  c.lineCap = 'round';
  branch(x, y, -Math.PI / 2, h * 0.38, h * 0.05, 0);
}
/** Inside the cloak: two wheels and a coiled spring, as if seen through it. */
function works(c: C, x: number, y: number, size: number, time: number, k: number) {
  if (k <= 0.01) return;
  c.save();
  c.globalAlpha = k;
  c.fillStyle = 'rgba(214,232,244,1)'; c.strokeStyle = 'rgba(40,66,96,1)'; c.lineWidth = size * 0.05;
  c.beginPath(); c.ellipse(x, y, size * 0.62, size, 0, 0, TAU); c.fill(); c.stroke();
  c.save(); c.beginPath(); c.ellipse(x, y, size * 0.62, size, 0, 0, TAU); c.clip();
  c.fillStyle = 'rgba(40,66,96,1)';
  const gear = (gx: number, gy: number, r: number, n: number, a: number) => {
    c.beginPath();
    for (let i = 0; i < n * 2; i++) { const ang = a + (i / (n * 2)) * TAU, rr = i % 2 ? r * 0.76 : r; c.lineTo(gx + Math.cos(ang - 0.1) * rr, gy + Math.sin(ang - 0.1) * rr); c.lineTo(gx + Math.cos(ang + 0.1) * rr, gy + Math.sin(ang + 0.1) * rr); }
    c.closePath(); c.fill();
    c.save(); c.fillStyle = 'rgba(214,232,244,1)'; c.beginPath(); c.arc(gx, gy, r * 0.3, 0, TAU); c.fill(); c.restore();
  };
  gear(x - size * 0.12, y - size * 0.42, size * 0.38, 9, time * 1.6);
  gear(x + size * 0.22, y - size * 0.02, size * 0.27, 7, -time * 1.6 * 9 / 7 + 0.2);
  c.beginPath();
  for (let i = 0; i <= 24; i++) { const v = i / 24; c.lineTo(x - size * 0.1 + Math.sin(v * Math.PI * 10) * size * 0.24, y + size * 0.3 + v * size * 0.55 + Math.sin(time * 6) * size * 0.04 * v); }
  c.stroke();
  c.restore();
  c.restore();
}
/** The wind-up key of a clockwork toy, turning in a back. */
function key(c: C, x: number, y: number, size: number, face: 1 | -1, time: number, k: number) {
  if (k <= 0.01) return;
  c.save(); c.globalAlpha = k; c.translate(x, y); c.scale(-face, 1);
  c.fillStyle = 'rgba(40,66,96,1)';
  c.fillRect(0, -size * 0.08, size * 0.5, size * 0.16);
  const turn = Math.cos(time * 5);
  c.save(); c.translate(size * 0.62, 0); c.scale(1, Math.max(0.18, Math.abs(turn)));
  c.beginPath(); c.ellipse(size * 0.12, -size * 0.32, size * 0.18, size * 0.3, 0, 0, TAU); c.ellipse(size * 0.12, size * 0.32, size * 0.18, size * 0.3, 0, 0, TAU); c.fill();
  c.restore();
  c.restore();
}
/** A brimmed hat as the puppets wear it, drawn in the head's own units at (x, y). */
function hatAt(c: C, x: number, y: number, u: number, face: 1 | -1, rot: number) {
  c.save(); c.translate(x, y); c.scale(face * u, -u); c.rotate(rot);
  c.beginPath(); c.ellipse(0.5, 0, 12.5, 2.2, 0, 0, TAU); c.fill();
  c.beginPath(); c.roundRect(-5.8, -0.2, 11.8, 8.6, 2.5); c.fill();
  c.restore();
}
/** Snow over a box, in flakes of about radius r (the toolkit's flakes grow with the box). */
function snow(c: C, x0: number, y0: number, w: number, h: number, time: number, n: number, r: number, color: string, life = 7) {
  c.save(); c.fillStyle = color;
  emit(time, n, life, (a, r1, r2) => {
    const px = x0 + r1 * w + noise(time * 0.7 + r2 * 30) * 0.03;
    c.beginPath(); c.arc(px, y0 + a * h, r * (0.55 + r2 * 0.9), 0, TAU); c.fill();
  }, 3);
  c.restore();
}
/** Clockwork walking: moves in little jerks; the same distance overall. */
const tick = (x: number, n = 2.2) => { const k = x * n, i = Math.floor(k), f = k - i; return (i + ease(Math.min(1, f * 1.8))) / n; };

/** VI. From the window: hats and cloaks below — machines, for all he can see? He judges they are people. */
const fromWindow: SceneFn = (s) => {
  const { t, c, clock } = s;
  // close on him at his window; back to the whole street; in on the two below while he wonders; back out
  const back = ease(seg(t, 1.6, 4.4)), near = ease(seg(t, 4.8, 6.0)) * (1 - ease(seg(t, 10.4, 12.4)));
  s.cam(lerp(0.3, s.W / 2 + 0.03, back) + 0.1 * near, lerp(0.3, 0.5, back) + 0.04 * near, lerp(2.0, 1, back) * (1 + 0.16 * near));
  const xr = ease(seg(t, 5.2, 5.8)) * (1 - ease(seg(t, 8.5, 9.1)));
  const warm = ease(seg(t, 8.6, 10));
  if (warm > 0) s.backdrop({ mood: 'machine', to: 'gold', k: warm * 0.7, x: 0.8, y: 0.3, r: 1.7 });
  else s.backdrop({ mood: 'day', to: 'machine', k: xr, x: 0.8, y: 0.3, r: 1.7 });
  // the town across the street: a far tower, gabled fronts, bare trees, all under snow
  c.fillStyle = s.tone(0.66);
  c.fillRect(1.0, 0.16, 0.06, 0.4); c.beginPath(); c.moveTo(0.99, 0.16); c.lineTo(1.03, 0.04); c.lineTo(1.07, 0.16); c.fill();
  const fronts: [number, number, number, number][] = [[0.5, 0.16, 0.36, 3], [0.68, 0.17, 0.42, 4], [0.86, 0.15, 0.34, 3], [1.02, 0.15, 0.3, 3], [1.18, 0.16, 0.38, 4], [1.36, 0.16, 0.34, 3]];
  for (const [fx, fw, fh, n] of fronts) gabled(c, fx, 0.74, fw, fh, n, s.tone(0.5), s.tone(0.64), warm);
  c.strokeStyle = s.tone(0.4); bareTree(c, 0.6, 0.76, 0.32, 3, clock); bareTree(c, 1.1, 0.76, 0.28, 5, clock);
  // the street, deep in snow
  c.fillStyle = css(mixRGB(s.screen, [255, 255, 255], 0.55)); c.fillRect(-0.4, 0.74, s.W + 0.8, FLOOR - 0.74);
  c.fillStyle = s.tone(0.3); c.fillRect(-0.4, FLOOR, s.W + 0.8, 0.6);
  c.fillStyle = css(mixRGB(s.screen, [255, 255, 255], 0.7)); c.fillRect(-0.4, FLOOR - 0.006, s.W + 0.8, 0.01);

  // two passers-by in hats and cloaks, coming towards each other
  const prog = lerp(t, tick(t), xr > 0.2 ? 1 : 0);
  const walkK = Math.min(1, prog / 7.2);
  const ax = lerp(1.36, 0.9, walkK), bx = lerp(0.3, 0.64, walkK);
  const walking = walkK < 1;
  const bow = ease(seg(t, 7.3, 7.9)) * (1 - ease(seg(t, 8.1, 8.6)));
  const bowJ = xr > 0.2 ? tick(bow, 3) : bow;
  const tipHat = ease(seg(t, 9.2, 9.8)) * (1 - ease(seg(t, 11.2, 11.8)));
  const turnUp = t > 10.2;
  const waveB = ease(seg(t, 10.3, 10.8)) * (1 - ease(seg(t, 12.2, 12.7)));
  c.fillStyle = s.ink;
  const Ab: Body = { x: ax, y: FLOOR, h: 0.34, face: -1, robe: 'cloak', beard: true, hold: tipHat > 0.02 ? null : 'cane', cut: s.tone(0.8), t: clock, ...(walking ? walk(prog * 0.8, 0.9) : tipHat > 0 ? gesture('rest', 'raise', tipHat) : gesture('rest')), lean: 26 * bowJ };
  const A = person(c, Ab);
  // his hat: on his head, or lifted in greeting
  const uA = Ab.h / 100;
  if (tipHat > 0.02) hatAt(c, A.hand[0] + 0.004, A.hand[1] - 0.004, uA, -1, -0.5);
  else { const hd = A.head; hatAt(c, hd[0] + 0.0, hd[1] - 6.4 * uA, uA, -1, -(26 * bowJ) * Math.PI / 180); }
  const Bb: Body = { x: bx, y: FLOOR, h: 0.33, face: turnUp ? -1 : 1, robe: 'cloak', hat: 'brim', cut: s.tone(0.8), t: clock + 2, ...(walking ? walk(prog * 0.85 + 0.4, 0.9) : waveB > 0 ? gesture('rest', 'wave', waveB) : gesture('rest')), lean: 26 * bowJ * (turnUp ? 0 : 1), tilt: turnUp ? -22 * waveB : 0 };
  const B = person(c, Bb);
  // a far figure crossing at the back
  const fx = lerp(1.45, 0.3, seg(t, 0, 5.4));
  if (fx > 0.36) { c.fillStyle = s.tone(0.42); person(c, { x: fx, y: 0.75, h: 0.15, face: -1, robe: 'cloak', hat: 'brim', ...walk(t * 0.9, 0.9), t: clock }); }
  // what might be under the cloaks: wheels and a spring, and a key in the back
  const flickX = s.still ? 1 : 0.8 + 0.2 * Math.sign(Math.sin(clock * 23)) * (noise(clock * 7) > 0.6 ? 1 : 0.4);
  for (const [J, b, i] of [[A, Ab, 0], [B, Bb, 1]] as const) {
    const ch = J.chest, hp = J.hip;
    const mx = lerp(ch[0], hp[0], 0.42), my = lerp(ch[1], hp[1], 0.42);
    works(c, mx, my, b.h * 0.19, clock + i, xr * flickX);
    key(c, mx - (b.face ?? 1) * b.h * 0.14, my - b.h * 0.06, b.h * 0.2, b.face ?? 1, clock * (i ? 1.1 : 1), xr);
    if (warm > 0) {
      const beat = s.still ? 1 : 1 + 0.12 * Math.max(0, Math.sin(clock * 6 + i));
      glow(c, ch[0], ch[1] + b.h * 0.02, b.h * 0.3, [255, 120, 80], 0.8 * warm);
      c.save(); c.translate(ch[0], ch[1] + b.h * 0.03); c.scale(b.h * 0.075 * warm * beat, b.h * 0.075 * warm * beat);
      c.fillStyle = css([226, 70, 56]); HEART(c); c.restore();
    }
  }

  // his house: the facade, and him at the upstairs window, looking down
  c.fillStyle = css(mixRGB(s.screen, [255, 206, 140], 0.45));
  c.fillRect(WIN6.x, WIN6.y, WIN6.w, WIN6.h);
  glow(c, WIN6.x + 0.05, WIN6.y + WIN6.h, 0.2, [255, 170, 90], 0.6);
  const reply = ease(seg(t, 11.0, 11.6)) * (1 - ease(seg(t, 12.4, 12.9)));
  const nodD = t > 9.6 && t < 10.8 && !s.still ? Math.sin((t - 9.6) * TAU / 0.6) * 6 : 0;
  const D = descartes(s, { x: 0.2, y: WIN6.y + WIN6.h + 0.2, h: 0.36, face: 1, lean: 10, tilt: 16 + nodD, ...(reply > 0 ? gesture('rest', 'wave', reply) : { reach: [0.33, WIN6.y + WIN6.h + 0.005] as P, reach2: [0.3, WIN6.y + WIN6.h + 0.01] as P }) });
  c.fillStyle = s.tone(0.34);
  c.beginPath(); c.rect(-0.5, -0.5, CORNER + 0.5, FLOOR + 0.5); c.rect(WIN6.x + WIN6.w, WIN6.y, -WIN6.w, WIN6.h); c.fill('evenodd');
  c.strokeStyle = s.tone(0.46); c.lineWidth = 0.002;
  for (let r = 0; r < 26; r++) { const y = 0.02 + r * 0.032; if (y > WIN6.y - 0.01 && y < WIN6.y + WIN6.h + 0.01) continue; c.beginPath(); c.moveTo(-0.4, y); c.lineTo(CORNER, y); c.stroke(); }
  c.fillStyle = s.tone(0.12); windowFrame(c, WIN6.x, WIN6.y, WIN6.w, WIN6.h, 0.008);
  c.fillRect(WIN6.x - 0.03, WIN6.y + WIN6.h, WIN6.w + 0.06, 0.02);
  c.fillStyle = 'rgba(252,252,250,0.95)'; c.fillRect(WIN6.x - 0.03, WIN6.y + WIN6.h - 0.006, WIN6.w + 0.06, 0.008);
  c.fillStyle = s.tone(0.12); c.beginPath(); c.moveTo(0.14, FLOOR); c.lineTo(0.14, 0.66); c.arc(0.21, 0.66, 0.07, Math.PI, 0); c.lineTo(0.28, FLOOR); c.closePath(); c.fill();
  c.fillRect(CORNER - 0.012, -0.4, 0.012, FLOOR + 0.4);

  // his thought: wheels? … then hearts
  const q1 = shown(t, 5.3, 8.8), q2 = shown(t, 9.1, 99);
  const bx2 = 0.52, by2 = 0.2;
  const spin: Icon = (cc) => { cc.save(); cc.rotate(s.still ? 0 : clock * 1.5); GEAR(cc); cc.restore(); };
  bubble(c, { x: bx2, y: by2, r: 0.07, wide: 1.5, kind: 'thought', to: D.head, k: q1, ink: s.ink, icon: [spin, Q] });
  bubble(c, { x: bx2, y: by2, r: 0.07, wide: 1.5, kind: 'thought', to: D.head, k: q2, ink: s.ink, icon: [(cc) => { cc.save(); cc.fillStyle = css([226, 70, 56]); HEART(cc); cc.restore(); }, CHECK] });
  void B;
  const sn = s.still ? 3 : clock;
  snow(c, -0.3, -0.1, s.W + 0.6, 1.1, sn * 0.8, 50, 0.0024, 'rgba(255,255,255,0.7)', 9);
  snow(c, -0.3, -0.1, s.W + 0.6, 1.1, sn, 34, 0.0042, 'rgba(255,255,255,0.92)');
  s.spill(0.8, 0.5, 0.3 * warm, [255, 200, 130]);
};

export const wax: StoryVisuals = {
  id: 'wax',
  aspect: 1.25,
  loop: false,
  scenes: [seclusion, theWax, nearFire, sameWax, mindAlone, fromWindow],
  stills: [8.4, 10.4, 10.8, 8.6, 8.6, 12.3],
};
