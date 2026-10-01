import { seg, ease, easeOut, lerp, noise, hash, css, mixRGB, pop, type RGB, type Stage, type SceneFn, type StoryVisuals } from '../puppet/theatre';
import { person, walk, gesture, type Body, type Joints } from '../puppet/figure';
import { bird } from '../puppet/beasts';
import { glow, sparks, sun, water, ripple, speed, weather, twinkle, softly } from '../puppet/fx';
import { bubble, shown, Q, EQ, NEQ, type Icon } from '../puppet/bubbles';
import { hills, cloud, cypress, acropolis, town } from '../puppet/scenery';

/**
 * "The ship of Theseus" (Plutarch, Life of Theseus 23; Hobbes, De Corpore
 * II.11.7): the galley comes home and is kept; its planks are taken out as
 * they rot and new timber put in, until none of the old is left; the
 * philosophers split over whether it is still the same ship; someone builds a
 * second ship out of the old planks; and the visitor is asked where the line
 * falls.
 *
 * The ship is the star: a black-figure galley whose planks are drawn one by
 * one — weathered dark when old, pale fresh timber when new — so that its
 * renewal can be watched plank by plank, and the two ships of the end can be
 * told apart at a glance.
 */
type C = CanvasRenderingContext2D;
type P = [number, number];
type At = (lx: number, ly: number) => P;
const TAU = Math.PI * 2;
const GOLD: RGB = [240, 176, 70];
const GROUND = 0.84;

const poly = (c: C, pts: P[]) => { c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); };
const mixP = (a: P, b: P, k: number): P => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
const inkRGB = (s: Stage): RGB => (s.dark ? [14, 13, 16] : [27, 26, 31]);
/** the light that shows through a crack or a hole: the lit screen, a little brighter */
const lightRGB = (s: Stage): RGB => mixRGB(s.screen, [255, 252, 240], 0.45);
const bezier = (p0: P, p1: P, p2: P, p3: P, n = 14): P[] => Array.from({ length: n + 1 }, (_, i) => {
  const t = i / n, m = 1 - t;
  return [m * m * m * p0[0] + 3 * m * m * t * p1[0] + 3 * m * t * t * p2[0] + t * t * t * p3[0], m * m * m * p0[1] + 3 * m * m * t * p1[1] + 3 * m * t * t * p2[1] + t * t * t * p3[1]];
});

/* ================================================================ timber */
const TIMBER: RGB = [230, 172, 102];
const WEATHERED: RGB = [96, 80, 64];
const ROTTEN: RGB = [62, 60, 50];
/** a plank's colour: k 0 old … 1 new; an old plank greys and darkens as it rots */
const plankRGB = (k: number, age: number): RGB => mixRGB(mixRGB(WEATHERED, ROTTEN, age), TIMBER, k);
const SAIL_DARK: RGB = [44, 36, 34];

/* ================================================================ the galley */
/*
 * Drawn in its own units: 100 long from the stern (x = -50) to the ram
 * (x = +50), y up from the underside of the keel. The planked hull runs from
 * HX0 to HX1; u goes along it (0 at the stern), v down it (0 at the gunwale,
 * 1 at the keel).
 */
const HX0 = -38, HX1 = 35;
const sheer = (u: number) => 15.5 + 9 * (1 - u) ** 4 + 3 * u ** 5;
const keelLine = (u: number) => (u < 0.3 ? 19 * ((0.3 - u) / 0.3) ** 2 : 0) + (u > 0.9 ? (1.6 * (u - 0.9)) / 0.1 : 0);
const hull = (u: number, v: number): P => [lerp(HX0, HX1, u), lerp(sheer(u), keelLine(u), v)];

/** The planks: three strakes below the wale, their joints staggered like brickwork. */
interface Plank { id: number; r: number; u0: number; u1: number; v0: number; v1: number }
const STRAKE = [0.13, 0.42, 0.71, 1];
const JOINTS = [[0, 0.18, 0.36, 0.54, 0.72, 0.88, 1], [0, 0.09, 0.27, 0.45, 0.63, 0.8, 1], [0, 0.18, 0.36, 0.54, 0.72, 0.88, 1]];
const PLANKS: Plank[] = [];
JOINTS.forEach((js, r) => js.slice(1).forEach((u1, j) => PLANKS.push({ id: PLANKS.length, r, u0: js[j], u1, v0: STRAKE[r], v1: STRAKE[r + 1] })));
const NP = PLANKS.length;
/** the order in which the planks rot and are replaced */
const ORDER = PLANKS.map((p) => p.id).sort((a, b) => hash(a, 3) - hash(b, 3));
const RANK: number[] = [];
ORDER.forEach((id, i) => { RANK[id] = i; });

function plankLocal(p: Plank, n = 6): P[] {
  const top: P[] = [], bot: P[] = [];
  for (let i = 0; i <= n; i++) { const u = lerp(p.u0, p.u1, i / n); top.push(hull(u, p.v0)); bot.push(hull(u, p.v1)); }
  return [...top, ...bot.reverse()];
}
const HULL: P[] = (() => {
  const top: P[] = [], bot: P[] = [];
  for (let i = 0; i <= 36; i++) { const u = i / 36; top.push(hull(u, 0)); bot.push(hull(u, 1)); }
  return [...top, ...bot.reverse()];
})();
/** the bow: the stem, its scroll head, and the bronze ram at the waterline */
const BOW: P[] = [[34.6, 18.6], [37.8, 19.4], [39.8, 21.2], [40.8, 23.6], [41.8, 26], [43.8, 27.3], [45.6, 26.6], [45.8, 24.9], [44.4, 24.1], [43, 24.6], [42.4, 22.4], [42, 17], [41.8, 11], [42.6, 7.4], [46.4, 5.2], [51.4, 2.9], [46.4, 0.7], [40, -0.5], [34.6, -0.2]];
/** the stern post, sweeping up and curling over */
const STERN: P[] = bezier([-36.5, 21.5], [-47, 22], [-53, 36], [-45.5, 45.5], 16);
const PORTS = Array.from({ length: 15 }, (_, i) => 0.19 + i * 0.048);

/** Draw a list of local points as a path. */
function lpath(c: C, at: At, pts: P[], close = true) {
  c.beginPath();
  pts.forEach(([x, y], i) => { const p = at(x, y); if (i) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); });
  if (close) c.closePath();
}
/** A tapered timber along local points. */
function taper(c: C, at: At, pts: P[], w0: number, w1: number) {
  const n = pts.length, left: P[] = [], right: P[] = [];
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1;
    const w = lerp(w0, w1, i / (n - 1)) / 2;
    left.push([pts[i][0] - (dy / d) * w, pts[i][1] + (dx / d) * w]);
    right.push([pts[i][0] + (dy / d) * w, pts[i][1] - (dx / d) * w]);
  }
  lpath(c, at, [...left, ...right.reverse()]); c.fill();
}

/** Theseus' emblem: the head of the bull of Crete, face on, in a box -1..1 (y down). */
function bull(c: C, eyes?: string) {
  c.beginPath();
  for (const sg of [-1, 1]) {
    c.moveTo(sg * 0.28, -0.5);
    c.bezierCurveTo(sg * 0.78, -0.5, sg * 1.02, -0.72, sg * 0.92, -1.02);
    c.bezierCurveTo(sg * 0.8, -0.8, sg * 0.6, -0.7, sg * 0.24, -0.74);
    c.closePath();
  }
  c.fill();
  c.beginPath();
  c.moveTo(-0.44, -0.62);
  c.quadraticCurveTo(0, -0.8, 0.44, -0.62);
  c.quadraticCurveTo(0.48, -0.08, 0.3, 0.4);
  c.quadraticCurveTo(0.38, 0.82, 0, 0.84);
  c.quadraticCurveTo(-0.38, 0.82, -0.3, 0.4);
  c.quadraticCurveTo(-0.48, -0.08, -0.44, -0.62);
  c.fill();
  for (const sg of [-1, 1]) { c.beginPath(); c.ellipse(sg * 0.6, -0.36, 0.24, 0.1, sg * -0.45, 0, TAU); c.fill(); }
  if (eyes) {
    c.save(); c.fillStyle = eyes;
    for (const sg of [-1, 1]) { c.beginPath(); c.ellipse(sg * 0.2, -0.16, 0.09, 0.06, 0, 0, TAU); c.fill(); c.beginPath(); c.arc(sg * 0.12, 0.62, 0.06, 0, TAU); c.fill(); }
    c.restore();
  }
}

interface Look { k: number; age: number }
/** One plank, at its world outline: the timber, its grain, its seams, and — if it is old — its cracks and worm holes. */
function drawPlank(s: Stage, pts: P[], look: Look, id: number, u: number) {
  const c = s.c;
  const n = pts.length / 2;
  const col = plankRGB(look.k, look.age);
  const light = lightRGB(s);
  c.fillStyle = css(col);
  poly(c, pts); c.fill();
  const top = pts.slice(0, n), bot = pts.slice(n).reverse();
  const at = (a: number, b: number): P => {
    const idx = Math.max(0, Math.min(n - 1.001, a * (n - 1))), i0 = Math.floor(idx), fr = idx - i0;
    return mixP(mixP(top[i0], top[i0 + 1], fr), mixP(bot[i0], bot[i0 + 1], fr), b);
  };
  // the grain
  const fresh = look.k > 0.5;
  c.strokeStyle = css(mixRGB(col, fresh ? [150, 96, 48] : light, fresh ? 0.42 : 0.16));
  c.lineWidth = u * 0.32;
  for (const fr of [0.34, 0.68]) {
    c.beginPath();
    for (let i = 0; i <= 8; i++) { const p = at(i / 8, fr + Math.sin(i * 1.9 + id * 2.3 + fr * 7) * 0.05); if (i) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); }
    c.stroke();
  }
  // the seams: incised light in the old black timber, dark in the new
  c.strokeStyle = css(mixRGB(light, inkRGB(s), Math.min(1, look.k * 1.2) * 0.8));
  c.lineWidth = u * 0.62;
  poly(c, pts); c.stroke();
  if (!s.small) {
    // treenails at each end
    c.fillStyle = c.strokeStyle;
    for (const a of [0.04, 0.96]) for (const b of [0.3, 0.7]) { const p = at(a, b); c.beginPath(); c.arc(p[0], p[1], u * 0.36, 0, TAU); c.fill(); }
  }
  if (fresh) return;
  // rot: a split along the grain, then worm holes the light shows through
  if (look.age > 0.25) {
    c.strokeStyle = css(light); c.lineWidth = u * 0.45;
    const a0 = 0.12 + hash(id, 5) * 0.3, len = Math.min(0.72, (look.age - 0.25) * 1.2), row = 0.38 + hash(id, 6) * 0.24;
    c.beginPath();
    for (let i = 0; i <= 6; i++) { const p = at(a0 + (len * i) / 6, row + (i % 2 ? 0.14 : -0.1)); if (i) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); }
    c.stroke();
  }
  if (look.age > 0.5) {
    c.fillStyle = css(light);
    const holes = Math.min(6, Math.floor((look.age - 0.42) * 11));
    for (let i = 0; i < holes; i++) { const p = at(0.1 + hash(id * 7 + i, 8) * 0.8, 0.22 + hash(id * 5 + i, 9) * 0.56); c.beginPath(); c.arc(p[0], p[1], u * (0.5 + 0.35 * hash(i, id)), 0, TAU); c.fill(); }
  }
}

/** A plank's outline moved: turned by `rot` about its middle and carried by (dx, dy). */
function moved(pts: P[], dx: number, dy: number, rot: number): P[] {
  const cx = pts.reduce((a, p) => a + p[0], 0) / pts.length, cy = pts.reduce((a, p) => a + p[1], 0) / pts.length;
  const co = Math.cos(rot), si = Math.sin(rot);
  return pts.map(([x, y]) => [cx + dx + (x - cx) * co - (y - cy) * si, cy + dy + (x - cx) * si + (y - cy) * co]);
}
const centre = (pts: P[]): P => [pts.reduce((a, p) => a + p[0], 0) / pts.length, pts.reduce((a, p) => a + p[1], 0) / pts.length];

interface ShipO {
  x: number; y: number; L: number; face?: 1 | -1; t: number;
  /** how each plank looks; null when it is not in its place */
  plank?: (id: number) => Look | null;
  /** the oars: how far they are run out (0..1), the stroke (counted in strokes), and the water's level for the splashes */
  oars?: number; stroke?: number; sea?: number;
  /** the sail: 0 furled … 1 set; 0 black … 1 pale; the mast 0 down … 1 up */
  sail?: number; pale?: number; mast?: number;
  /** the people aboard, drawn before the hull hides their legs */
  crew?: (at: At, k: number) => void;
  garland?: number;
  /** only the frame: keel, posts and ribs, with whatever planks are in */
  bare?: boolean;
  /** the whole ship as one flat shape in this colour */
  flat?: string;
  still?: boolean;
}
interface ShipOut { at: At; k: number; plank: (id: number) => P[]; stem: P; ram: P; stern: P; head: P; sail: P }

/** The galley of Theseus: hull of planks, stem with its painted eye, bronze ram, stern post, mast, sail with the bull, and thirty oars. */
function galley(s: Stage, o: ShipO): ShipOut {
  const { c } = s;
  const f = o.face ?? 1, k = o.L / 100;
  const at: At = (lx, ly) => [o.x + f * lx * k, o.y - ly * k];
  const up = o.mast ?? 1, set = o.sail ?? 1, pale = o.pale ?? 0, t = o.t;
  const mA = (1 - up) * 1.5;
  const mat: At = (lx, ly) => { const dx = lx - 1, dy = ly - 6; return at(1 + dx * Math.cos(mA) - dy * Math.sin(mA), 6 + dx * Math.sin(mA) + dy * Math.cos(mA)); };
  const sailBottom = lerp(56, 27, set);
  const flutter = o.still ? 0 : Math.sin(t * 2.6) * 0.8 + Math.sin(t * 4.1) * 0.4;
  const sailPts = (): P[] => {
    const pts: P[] = [];
    for (let i = 0; i <= 10; i++) pts.push([lerp(-24, 28, i / 10), 58.2 + Math.sin((i / 10) * Math.PI) * 0.6]);
    for (let i = 0; i <= 10; i++) { const v = i / 10; pts.push([28 + 1.6 * set + Math.sin(v * Math.PI) * 1.4 * set, lerp(58.2, sailBottom, v)]); }
    for (let i = 10; i >= 0; i--) { const v = i / 10; pts.push([lerp(-24, 28, v) + flutter * 0.4 * Math.sin(v * Math.PI), sailBottom - Math.sin(v * Math.PI) * 2.6 * set + flutter * 0.5 * v]); }
    for (let i = 10; i >= 0; i--) { const v = i / 10; pts.push([-24 - 1.2 * set - Math.sin(v * Math.PI) * 1.2 * set, lerp(58.2, sailBottom, v)]); }
    return pts;
  };
  const out: ShipOut = {
    at, k,
    plank: (id) => plankLocal(PLANKS[id]).map(([x, y]) => at(x, y)),
    stem: at(42.6, 24.2), ram: at(51.4, 2.9), stern: at(-45.5, 45.5), head: mat(1, 64), sail: mat(2, (58 + sailBottom) / 2),
  };

  if (o.flat) {
    c.fillStyle = o.flat;
    lpath(c, at, HULL); c.fill();
    lpath(c, at, BOW); c.fill();
    taper(c, at, STERN, 6.2, 1.8);
    if (up > 0.01) {
      taper(c, mat, [[1, 6], [1, 64]], 1.8, 1.2);
      taper(c, mat, [[-25, 58], [2, 59], [29, 58]], 1.1, 1.1);
      if (set > 0.05) { lpath(c, mat, sailPts()); c.fill(); }
    }
    return out;
  }

  const ink = s.ink, light = lightRGB(s);
  c.lineCap = 'round'; c.lineJoin = 'round';
  // rigging: forestay and backstay from the masthead
  if (up > 0.6) {
    c.strokeStyle = s.tone(0.3); c.lineWidth = 0.35 * k;
    const hd = mat(1, 63), fs = at(41.5, 25), bs = at(-46, 40);
    c.beginPath(); c.moveTo(hd[0], hd[1]); c.lineTo(fs[0], fs[1]); c.moveTo(hd[0], hd[1]); c.lineTo(bs[0], bs[1]); c.stroke();
  }
  // mast and yard
  if (up > 0.01) {
    c.fillStyle = ink;
    taper(c, mat, [[1, 6], [1, 64]], 1.8, 1.2);
    taper(c, mat, [[-25, 57.6], [2, 59], [29, 57.6]], 1.2, 1.2);
    // the sail, hanging from the yard; the bull of Crete on it
    if (set > 0.03) {
      const cloth = mixRGB(SAIL_DARK, mixRGB(s.screen, [255, 252, 244], 0.6), pale);
      const mark = mixRGB(mixRGB(s.screen, [255, 250, 236], 0.4), inkRGB(s), pale);
      c.fillStyle = css(cloth); lpath(c, mat, sailPts()); c.fill();
      c.strokeStyle = ink; c.lineWidth = 0.7 * k; c.stroke();
      // brails, with their rings
      c.strokeStyle = css(mixRGB(cloth, pale > 0.5 ? inkRGB(s) : light, 0.4)); c.lineWidth = 0.32 * k;
      for (let i = 0; i < 6; i++) {
        const x = -18 + i * 8;
        lpath(c, mat, [[x, 58], [x + flutter * 0.2, lerp(58, sailBottom, 0.5)], [x + flutter * 0.3, sailBottom - 2 * set]], false); c.stroke();
      }
      // a meander along the foot
      if (set > 0.6 && !s.small) {
        c.strokeStyle = css(mark); c.lineWidth = 0.4 * k;
        const yb = sailBottom + 2.6;
        c.beginPath();
        for (let i = 0; i < 12; i++) {
          const x = -21 + i * 4.1, p = (lx: number, ly: number) => mat(x + lx, yb + ly);
          const pts = [p(0, 0), p(0, 2), p(2.6, 2), p(2.6, 0.8), p(1.2, 0.8), p(1.2, 0), p(4.1, 0)];
          pts.forEach((q, j) => (j ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])));
        }
        c.stroke();
      }
      if (set > 0.45) {
        const ctr = mat(2, (58 + sailBottom) / 2 + 1), sz = (58 - sailBottom) * 0.3 * k;
        c.save(); c.translate(ctr[0], ctr[1]); c.rotate(-f * mA); c.scale(sz * Math.min(1, (set - 0.45) * 3), sz);
        c.fillStyle = css(mark); bull(c, css(cloth));
        c.restore();
      }
    }
    // the furled sail, bundled on the yard
    if (set < 0.97) {
      const th = 2.8 * (1 - set) + 0.4;
      c.fillStyle = css(mixRGB(SAIL_DARK, mixRGB(s.screen, [255, 252, 244], 0.5), pale));
      for (let i = 0; i <= 9; i++) { const p = mat(lerp(-22, 26, i / 9), 57.4 - th * 0.4); c.beginPath(); c.ellipse(p[0], p[1], 3.2 * k, th * k, 0, 0, TAU); c.fill(); }
      c.strokeStyle = ink; c.lineWidth = 0.5 * k;
      for (let i = 0; i < 5; i++) { const x = lerp(-17, 21, i / 4); lpath(c, mat, [[x, 57.8], [x + 0.6, 57.4 - th]], false); c.stroke(); }
    }
    // a pennant at the masthead
    c.fillStyle = ink;
    const wv = (i: number) => (o.still ? 0 : Math.sin(t * 5 - i * 1.2) * (0.5 + i * 0.4));
    lpath(c, mat, [[1, 64.4], [-4, 64.8 + wv(1)], [-9, 64.4 + wv(2)], [-13, 64.2 + wv(3)], [-9, 63.2 + wv(2)], [-4, 62.9 + wv(1)], [1, 62.6]]); c.fill();
  }
  o.crew?.(at, k);

  // the hull: its dark inside and ribs (seen only through a gap), then the planks
  if (!o.bare) { c.fillStyle = s.tone(0.05); lpath(c, at, HULL); c.fill(); }
  c.strokeStyle = o.bare ? ink : s.tone(0.42); c.lineWidth = (o.bare ? 1.5 : 1.1) * k;
  for (let i = 0; i < 12; i++) {
    const u = 0.06 + i * 0.081;
    lpath(c, at, [hull(u, 0.02), hull(u + 0.006, 0.5), hull(u - 0.004, 1)], false); c.stroke();
  }
  PLANKS.forEach((p) => {
    const look = o.plank ? o.plank(p.id) : { k: 0, age: 0 };
    if (!look) return;
    drawPlank(s, out.plank(p.id), look, p.id, k);
  });
  // the wale along the top, with the oar ports; an open rail above it
  c.fillStyle = ink;
  const wale: P[] = [];
  for (let i = 0; i <= 30; i++) wale.push(hull(i / 30, -0.02));
  for (let i = 30; i >= 0; i--) wale.push(hull(i / 30, STRAKE[0]));
  lpath(c, at, wale); c.fill();
  c.fillStyle = css(light);
  if ((o.oars ?? 0) < 0.5) PORTS.forEach((u) => { const p = at(...hull(u, 0.065)); c.beginPath(); c.arc(p[0], p[1], 0.75 * k, 0, TAU); c.fill(); });
  c.strokeStyle = ink;
  c.lineWidth = 0.75 * k;
  lpath(c, at, Array.from({ length: 25 }, (_, i): P => { const u = 0.08 + i * 0.036; return [hull(u, 0)[0], sheer(u) + 3.4]; }), false); c.stroke();
  c.lineWidth = 0.5 * k;
  for (let i = 0; i < 13; i++) { const u = 0.1 + i * 0.07; lpath(c, at, [[hull(u, 0)[0], sheer(u)], [hull(u, 0)[0], sheer(u) + 3.4]], false); c.stroke(); }
  // the keel
  c.fillStyle = ink;
  const keel: P[] = [];
  for (let i = 0; i <= 20; i++) { const u = 0.2 + (i / 20) * 0.8; keel.push(hull(u, 0.94)); }
  for (let i = 20; i >= 0; i--) { const u = 0.2 + (i / 20) * 0.8; const [x, y] = hull(u, 1); keel.push([x, y - 1.3]); }
  lpath(c, at, keel); c.fill();
  // the stern post and its fan
  taper(c, at, STERN, 6.2, 1.8);
  for (let i = 0; i < 4; i++) {
    const a = 0.5 + i * 0.62;
    const end: P = [-45.5 + Math.cos(a) * 6.5 + 3, 45.5 + Math.sin(a) * 6.5 + 1.5];
    taper(c, at, bezier([-45.5, 45.5], [-45.5 + Math.cos(a) * 3, 45.5 + Math.sin(a) * 3 + 2], [end[0] - 1, end[1] + 1], end, 6), 1.5, 0.5);
  }
  // the bow: stem, scroll and ram
  lpath(c, at, BOW); c.fill();
  // the incised details: the ram's fins, the line of the stern post, and the eye that lets the ship see its way
  c.strokeStyle = css(light); c.lineWidth = 0.4 * k;
  lpath(c, at, [[43.4, 4.6], [49.6, 3.0]], false); c.stroke();
  lpath(c, at, [[42.4, 2.2], [49.4, 2.5]], false); c.stroke();
  lpath(c, at, STERN.slice(2, 14).map(([x, y]) => [x + 0.6, y - 0.4] as P), false); c.stroke();
  const eye = (lx: number, ly: number) => at(38.3 + lx, 11 + ly);
  c.fillStyle = css(mixRGB(light, [255, 255, 255], 0.3));
  c.beginPath();
  { const a = eye(-2.6, 0), b = eye(0, 2.4), d = eye(2.6, 0), e = eye(0, -2.4); c.moveTo(a[0], a[1]); c.quadraticCurveTo(b[0], b[1], d[0], d[1]); c.quadraticCurveTo(e[0], e[1], a[0], a[1]); }
  c.fill();
  c.strokeStyle = 'rgba(176,64,42,0.95)'; c.lineWidth = 0.45 * k; c.stroke();
  c.fillStyle = ink; { const p = eye(0.4, 0); c.beginPath(); c.arc(p[0], p[1], 1.05 * k, 0, TAU); c.fill(); }
  // the steering oar on the quarter
  c.fillStyle = ink;
  taper(c, at, [[-31, 22], [-38, 9], [-43, -3]], 1.5, 1.2);
  { const p = at(-43.4, -4.2); c.beginPath(); c.ellipse(p[0], p[1], 1.9 * k, 5 * k, -f * 0.45, 0, TAU); c.fill(); }
  // the oars
  const oars = o.oars ?? 0;
  if (oars > 0.01) {
    const st = o.stroke ?? 0;
    const seaL = o.sea !== undefined ? (o.y - o.sea) / k : -99;
    c.strokeStyle = ink; c.fillStyle = ink;
    PORTS.forEach((u, i) => {
      const ph = (st - i * 0.012) * TAU;
      const a = ((8 + 28 * Math.cos(ph)) * Math.PI) / 180, lift = Math.max(0, -Math.sin(ph));
      const port = hull(u, 0.065), len = 22 * oars;
      const end: P = [port[0] + Math.sin(a) * len, port[1] - Math.cos(a) * len * (1 - 0.45 * lift)];
      const p0 = at(port[0], port[1]), p1 = at(end[0], end[1]);
      c.lineWidth = 0.8 * k; c.beginPath(); c.moveTo(p0[0], p0[1]); c.lineTo(p1[0], p1[1]); c.stroke();
      const ang = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]);
      c.beginPath(); c.ellipse(p1[0] - Math.cos(ang) * 2.2 * k, p1[1] - Math.sin(ang) * 2.2 * k, 3.2 * k, 1.1 * k, ang, 0, TAU); c.fill();
      // the catch: a splash where the blade bites
      const age = ((ph % TAU) + TAU) % TAU / 1.4;
      if (!o.still && oars > 0.9 && age < 1 && seaL > -50) {
        const w = at(port[0] + Math.sin(a) * len * 0.92, seaL);
        c.save(); c.fillStyle = css(mixRGB(light, [255, 255, 255], 0.5), 0.9 * (1 - age));
        for (let j = 0; j < 3; j++) { const dx = (j - 1) * 1.6 * k, hgt = Math.sin(age * Math.PI) * (2.4 + j % 2) * k; c.beginPath(); c.arc(w[0] + dx + age * 1.5 * k, w[1] - hgt, 0.55 * k, 0, TAU); c.fill(); }
        c.restore();
        ripple(c, w[0], w[1], 4 * k, age, css(light), 0.3);
      }
    });
  }
  // a garland on the stem
  const g = o.garland ?? 0;
  if (g > 0.01) garlandAt(c, at(41.2, 21.6), 3.4 * k * pop(Math.min(1, g)), t, o.still);
  return out;
}

/** A garland of laurel with two ribbons, hung at p. */
function garlandAt(c: C, p: P, r: number, t: number, still?: boolean) {
  const sw = still ? 0 : Math.sin(t * 2.2) * 0.12;
  c.save(); c.translate(p[0], p[1]); c.rotate(sw);
  c.strokeStyle = 'rgba(176,60,44,1)'; c.lineWidth = r * 0.16;
  c.beginPath(); c.moveTo(-r * 0.2, r * 0.6); c.quadraticCurveTo(-r * 0.5, r * 1.4, -r * 0.2, r * 2.1); c.moveTo(r * 0.2, r * 0.6); c.quadraticCurveTo(r * 0.6, r * 1.3, r * 0.4, r * 2.2); c.stroke();
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * TAU;
    c.fillStyle = i % 2 ? 'rgba(206,150,40,1)' : 'rgba(122,140,52,1)';
    c.beginPath(); c.ellipse(Math.cos(a) * r, Math.sin(a) * r * 0.75, r * 0.34, r * 0.16, a + 1.2, 0, TAU); c.fill();
  }
  c.restore();
}

/* ================================================================ props and people */
/** A stepped stone base, and the timber cradle a kept ship stands on. */
function plinth(s: Stage, x0: number, x1: number, top: number, at?: At) {
  const c = s.c;
  const h = GROUND - top;
  c.fillStyle = s.tone(0.36);
  c.fillRect(x0 - 0.03, GROUND - h * 0.5, x1 - x0 + 0.06, h * 0.5 + 0.002);
  c.fillRect(x0, top, x1 - x0, h * 0.5 + 0.002);
  c.strokeStyle = s.tone(0.58); c.lineWidth = 0.0022;
  for (let r = 0; r < 2; r++) {
    const y0 = r ? GROUND - h * 0.5 : top, y1 = r ? GROUND : GROUND - h * 0.5, a = r ? x0 - 0.03 : x0, b = r ? x1 + 0.03 : x1;
    c.beginPath(); c.moveTo(a, y0); c.lineTo(b, y0); c.stroke();
    for (let x = a + 0.07 + r * 0.035; x < b - 0.01; x += 0.14) { c.beginPath(); c.moveTo(x, y0); c.lineTo(x, y1); c.stroke(); }
  }
  if (at) {
    // the cradle: three trestles under the keel
    c.fillStyle = s.ink;
    for (const u of [0.3, 0.55, 0.82]) {
      const [lx, ly] = hull(u, 1), p = at(lx, ly - 0.6);
      c.beginPath(); c.moveTo(p[0] - 0.03, top); c.lineTo(p[0] - 0.012, p[1]); c.lineTo(p[0] + 0.012, p[1]); c.lineTo(p[0] + 0.03, top); c.closePath(); c.fill();
    }
  }
}

/** A figure with a faint rim of light, so it still reads in front of the dark hull. */
function rimmed(s: Stage, b: Body, k = 1): Joints {
  const c = s.c;
  if (k > 0.01 && !s.small) softly(c, 0.006, css(lightRGB(s), 0.95 * k), () => { person(c, { ...b, cut: undefined }); });
  c.fillStyle = s.ink; c.strokeStyle = s.ink;
  return person(c, b);
}
const talk = (s: Stage, on: boolean) => (on && !s.still ? 0.4 + 0.4 * Math.sin(s.clock * 14) : 0);

/* ---------------------------------------------------------------- pictures for the bubbles */
/** A little galley, old (dark) or new (pale), for a speech bubble. */
const shipIcon = (paleK: number, timber: string, cloth: string): Icon => (c) => {
  const ink = c.fillStyle;
  c.save();
  c.beginPath();
  c.moveTo(-0.95, -0.15); c.quadraticCurveTo(-0.92, 0.18, -0.7, 0.3); c.lineTo(0.62, 0.3); c.lineTo(1.0, 0.22); c.lineTo(0.66, 0.12); c.lineTo(0.72, -0.08); c.lineTo(-0.72, 0.0); c.quadraticCurveTo(-0.85, -0.02, -0.95, -0.15);
  c.closePath();
  c.fillStyle = paleK > 0.5 ? timber : ink; c.fill();
  c.lineWidth = 0.07; c.strokeStyle = ink; c.stroke();
  if (paleK > 0.5) { c.lineWidth = 0.035; c.beginPath(); c.moveTo(-0.7, 0.15); c.lineTo(0.66, 0.15); c.moveTo(-0.2, 0.0); c.lineTo(-0.2, 0.3); c.moveTo(0.25, 0.0); c.lineTo(0.25, 0.3); c.stroke(); }
  c.fillStyle = ink; c.fillRect(-0.04, -0.95, 0.08, 0.95);
  c.fillRect(-0.62, -0.9, 1.24, 0.07);
  c.beginPath(); c.moveTo(-0.58, -0.84); c.lineTo(0.58, -0.84); c.lineTo(0.62, -0.18); c.lineTo(-0.6, -0.18); c.closePath();
  c.fillStyle = paleK > 0.5 ? cloth : ink; c.fill(); c.lineWidth = 0.05; c.stroke();
  c.save(); c.translate(0, -0.5); c.scale(0.2, 0.2); c.fillStyle = paleK > 0.5 ? (ink as string) : cloth; bull(c); c.restore();
  c.restore();
};
/** "This one is the same as that one" — or not. */
const equation = (s: Stage, same: boolean): Icon => {
  const timber = css(TIMBER), cloth = css(mixRGB(s.screen, [255, 252, 244], 0.7));
  const oldShip = shipIcon(0, timber, cloth), newShip = shipIcon(1, timber, cloth);
  return (c) => {
    c.save(); c.translate(-1.6, 0.05); c.scale(0.85, 0.85); oldShip(c); c.restore();
    c.save(); c.translate(0, 0.02); c.scale(0.9, 0.9); (same ? EQ : NEQ)(c); c.restore();
    c.save(); c.translate(1.6, 0.05); c.scale(0.85, 0.85); newShip(c); c.restore();
  };
};
/** Theseus himself: a head in a crested helmet. */
const HERO: Icon = (c) => {
  c.beginPath(); c.ellipse(0, 0.05, 0.5, 0.56, 0, 0, TAU); c.fill();
  c.beginPath(); c.moveTo(0.3, 0.0); c.lineTo(0.66, 0.2); c.lineTo(0.42, 0.34); c.lineTo(0.42, 0.62); c.lineTo(0.0, 0.7); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(-0.5, -0.25); c.quadraticCurveTo(-0.2, -1.1, 0.55, -0.62); c.quadraticCurveTo(0.1, -0.72, -0.5, -0.25); c.fill();
  c.lineWidth = 0.18; c.beginPath(); c.moveTo(-0.62, -0.05); c.quadraticCurveTo(-0.9, 0.3, -0.68, 0.62); c.stroke();
  c.save(); c.fillStyle = 'rgba(255,252,246,1)'; c.beginPath(); c.ellipse(0.24, -0.02, 0.1, 0.05, 0, 0, TAU); c.fill(); c.restore();
};

/** A big question mark of light. */
function bigQ(s: Stage, x: number, y: number, size: number, k: number, color: RGB = GOLD) {
  if (k <= 0.01) return;
  const c = s.c;
  glow(c, x, y, size * 1.8, color, 0.55 * k);
  c.save(); c.translate(x, y); c.scale(size * k, size * k);
  c.fillStyle = css(color); Q(c);
  c.restore();
}

/** Running waves in the manner of a vase border: crests that curl over, in a band. */
function crests(c: C, x0: number, x1: number, y: number, w: number, h: number, phase: number, fill: string) {
  c.fillStyle = fill;
  c.beginPath(); c.moveTo(x0 - w, y + 0.3);
  const start = x0 - w - ((phase % w) + w) % w;
  for (let x = start; x < x1 + w; x += w) {
    c.lineTo(x, y);
    c.bezierCurveTo(x + w * 0.35, y, x + w * 0.5, y - h, x + w * 0.78, y - h * 0.96);
    c.bezierCurveTo(x + w * 0.98, y - h * 0.9, x + w * 0.96, y - h * 0.42, x + w * 0.78, y - h * 0.44);
    c.bezierCurveTo(x + w * 0.66, y - h * 0.46, x + w * 0.7, y - h * 0.66, x + w * 0.8, y - h * 0.66);
    c.bezierCurveTo(x + w * 0.74, y - h * 0.3, x + w * 0.9, y, x + w, y);
  }
  c.lineTo(x1 + w, y + 0.3); c.closePath(); c.fill();
}

/* ================================================================ I. the ship */
const SEA = 0.86;
const HARBOUR = 5;
const theseusOn = (s: Stage, at: At, k: number, pointK: number) => {
  const p = at(27, 7);
  s.c.fillStyle = s.ink; s.c.strokeStyle = s.ink;
  return person(s.c, { x: p[0], y: p[1], h: 26 * k, face: 1, robe: 'short', hat: 'helmet', hold: 'sword', ...gesture('rest', 'point', pointK), tilt: -6, cut: s.tone(0.8), t: s.clock });
};
/** the youths at the oars: heads and shoulders over the gunwale, swinging with the stroke */
function rowers(s: Stage, at: At, k: number, stroke: number) {
  const c = s.c;
  c.fillStyle = s.ink; c.strokeStyle = s.ink;
  for (let i = 0; i < 7; i++) {
    const u = 0.25 + i * 0.083;
    const [lx] = hull(u, 0);
    const lean = s.still ? 0 : -Math.cos((stroke - i * 0.012) * TAU) * 0.38;
    const hip = at(lx, 13), sh = at(lx + Math.sin(lean) * 8, 13 + Math.cos(lean) * 8);
    c.lineWidth = 4.6 * k; c.beginPath(); c.moveTo(hip[0], hip[1]); c.lineTo(sh[0], sh[1]); c.stroke();
    const hd = at(lx + Math.sin(lean) * 11.6, 13 + Math.cos(lean) * 11.6);
    c.beginPath(); c.arc(hd[0], hd[1], 2.5 * k, 0, TAU); c.fill();
    if (i % 2) { c.beginPath(); c.arc(hd[0] - 1.2 * k, hd[1] - 1.4 * k, 1.5 * k, 0, TAU); c.fill(); }
  }
}

const theShip: SceneFn = (s) => {
  const { t, c, clock } = s;
  const voyage = seg(t, 0, 5.4);
  const shipX = 0.3 + 1.75 * voyage;
  // the camera runs alongside, looks up at the gulls, and comes down on the harbour where the ship is kept
  const up = ease(seg(t, 4.3, 5.6)), down = ease(seg(t, 5.9, 7.2));
  const atSea = t < 5.75;
  const camX = atSea ? shipX + 0.16 + 0.3 * up : lerp(HARBOUR + 0.62, HARBOUR + 0.12, down) + 0.04 * ease(seg(t, 8.5, 11));
  const camY = atSea ? lerp(0.6, -0.42, up) : lerp(-0.42, 0.5, down);
  const zoom = atSea ? 1.12 : lerp(1.12, 1.0, down) + 0.06 * ease(seg(t, 8.5, 11));
  s.cam(camX, camY, zoom);
  s.backdrop({ mood: 'dawn', to: 'day', k: ease(seg(t, 2, 8)), x: camX + 0.42, y: 0.12, r: 2.1 });
  // the sky: the sun, clouds and gulls, all far enough off to move with the camera
  sun(c, camX + 0.5, 0.14, 0.045, clock, 0.85, 0.5);
  c.fillStyle = s.tone(0.85);
  [[-0.5, 0.02, 0.4], [0.3, -0.28, 0.5], [-0.2, -0.62, 0.42], [0.55, -0.7, 0.36]].forEach(([dx, y, w], i) => cloud(c, camX + dx - t * 0.012, y, w, i));
  c.fillStyle = s.ink;
  for (let i = 0; i < 3; i++) {
    const gx = camX + 0.62 - ((t * (0.11 + i * 0.03) + i * 0.4) % 1.6), gy = lerp(0.22, -0.32, up) + i * 0.07 + Math.sin(clock * 0.9 + i) * 0.02;
    bird(c, gx, gy, 0.045 - i * 0.008, clock * 1.6 + i * 0.3, -1);
  }

  if (atSea) {
    // the far coast of Attica, with the Acropolis on it, coming slowly nearer
    const far = camX * 0.88;
    c.fillStyle = s.tone(0.7); hills(c, far - 1.3, far + 1.5, 0.735, 0.035, 7, 0.76, 2);
    c.fillStyle = s.tone(0.6); acropolis(c, far + 0.66, 0.738, 0.34, 0.2, s.tone(0.74));
    const seaRGB = mixRGB(s.screen, [92, 122, 136], 0.32);
    c.fillStyle = css(seaRGB); c.fillRect(camX - 1.6, 0.735, 3.2, 0.6);
    // glitter under the sun
    c.fillStyle = css(mixRGB(s.screen, [255, 252, 236], 0.6), 0.8);
    for (let i = 0; i < 14; i++) { const gx = camX + 0.5 + (hash(i, 2) - 0.5) * 0.5, gy = 0.75 + hash(i, 4) * 0.08, w = 0.02 + 0.02 * hash(i, 5); c.globalAlpha = 0.4 + 0.4 * Math.sin(clock * 3 + i * 1.7); c.fillRect(gx - w / 2, gy, w, 0.003); }
    c.globalAlpha = 1;
    // the galley, rowing home: Theseus at the bow points to the city
    const stroke = clock * 0.85;
    const bob = s.still ? 0 : Math.sin(clock * 1.7) * 0.004;
    const g = galley(s, {
      x: shipX, y: SEA + 0.03 + bob, L: 0.95, t: clock, oars: 1, stroke, sea: SEA, sail: 1, pale: 0, still: s.still,
      crew: (at, k) => { rowers(s, at, k, stroke); theseusOn(s, at, k, ease(seg(t, 1, 2))); },
    });
    // the bow wave and the wake
    c.fillStyle = css(mixRGB(s.screen, [255, 255, 255], 0.5), 0.9);
    c.beginPath(); c.moveTo(g.ram[0] - 0.01, SEA); c.quadraticCurveTo(g.ram[0] + 0.03, SEA - 0.03, g.ram[0] + 0.05, SEA - 0.004); c.quadraticCurveTo(g.ram[0] + 0.02, SEA - 0.012, g.ram[0] - 0.01, SEA + 0.004); c.fill();
    c.strokeStyle = css(mixRGB(s.screen, [255, 255, 255], 0.5), 0.6); c.lineWidth = 0.003;
    for (let i = 0; i < 4; i++) { const x = shipX - 0.5 - i * 0.12 - ((clock * 0.1) % 0.12); c.beginPath(); c.moveTo(x, SEA + 0.008 + i * 0.006); c.lineTo(x - 0.08, SEA + 0.012 + i * 0.008); c.stroke(); }
    // the water closes over the hull below the waterline; vase-painting waves run past in front
    water(c, camX - 1.6, camX + 1.6, SEA, 0.4, clock, css(mixRGB(s.screen, [70, 100, 116], 0.48)), css(mixRGB(s.screen, [255, 255, 255], 0.4)), 0.005, 3);
    crests(c, camX - 1.6, camX + 1.6, 0.985, 0.13, 0.06, clock * 0.05 + camX * 0.25, css(mixRGB(s.screen, [44, 66, 80], 0.62)));
    return;
  }

  // the harbour: the Acropolis above the city, the water with far sails, and the ship on its stone base
  const H = HARBOUR;
  c.fillStyle = s.tone(0.66); hills(c, H - 1.4, H + 1.6, 0.62, 0.05, 3, 1.2, 2);
  c.fillStyle = s.tone(0.56); acropolis(c, H - 0.1, 0.64, 0.66, 0.38, s.tone(0.72));
  c.fillStyle = s.tone(0.48); town(c, H - 1.2, H + 1.4, 0.7, 0.11, 6, 1, 0, s.tone(0.62));
  c.fillStyle = css(mixRGB(s.screen, [92, 122, 136], 0.3)); c.fillRect(H - 1.6, 0.7, 3.2, 0.2);
  for (let i = 0; i < 3; i++) {
    const x = H - 0.9 + i * 0.9 + Math.sin(clock * 0.1 + i) * 0.04, y = 0.705 + Math.sin(clock * 1.3 + i) * 0.002;
    c.fillStyle = s.tone(0.45); c.fillRect(x - 0.035, y - 0.008, 0.07, 0.008); c.fillRect(x - 0.002, y - 0.05, 0.004, 0.044);
    c.beginPath(); c.moveTo(x - 0.022, y - 0.046); c.lineTo(x + 0.022, y - 0.046); c.lineTo(x + 0.02, y - 0.02); c.lineTo(x - 0.02, y - 0.02); c.fill();
  }
  c.fillStyle = s.tone(0.1); c.fillRect(H - 1.6, GROUND, 3.2, 0.5);
  c.fillStyle = s.tone(0.3); cypress(c, H + 0.72, GROUND, 0.3, clock);
  const L = 0.86, top = 0.775, keelY = top - 0.03;
  const at0: At = (lx, ly) => [H + lx * L / 100, keelY - ly * L / 100];
  plinth(s, H - 0.36, H + 0.33, top, at0);
  // a man and a boy come to look; he tosses a garland up onto the prow
  const walkK = seg(t, 6.4, 8.3);
  const mx = lerp(H + 1.0, H + 0.5, walkK), bx = lerp(H + 1.12, H + 0.62, seg(t, 6.6, 8.6));
  const lift = ease(seg(t, 8.3, 8.8)), toss = seg(t, 8.8, 9.5);
  const ship = galley(s, { x: H, y: keelY, L, t: clock, sail: 0, oars: 0, garland: toss >= 1 ? 1 + 0 * seg(t, 9.5, 9.9) : 0, still: s.still });
  c.fillStyle = s.ink; c.strokeStyle = s.ink;
  const man = person(c, { x: mx, y: GROUND, h: 0.29, face: -1, robe: 'long', beard: true, ...(walkK < 1 ? walk(t * 0.9, 1) : toss < 1 ? { reach: [lerp(mx - 0.06, mx - 0.1, lift), lerp(GROUND - 0.18, GROUND - 0.33, lift)] as P, reach2: [lerp(mx - 0.04, mx - 0.08, lift), lerp(GROUND - 0.17, GROUND - 0.32, lift)] as P } : gesture('rest', 'point', ease(seg(t, 9.6, 10.2)))), tilt: -14 * lift, cut: s.tone(0.8), t: clock });
  const boyWalk = seg(t, 6.6, 8.6);
  const hop = s.still ? 0 : Math.max(0, Math.sin((t - 9.4) * 9)) * 0.018 * seg(t, 9.4, 9.6) * (1 - seg(t, 10.6, 10.8));
  c.fillStyle = s.ink;
  person(c, { x: bx, y: GROUND - hop, h: 0.19, face: -1, robe: 'short', hair: 'curls', build: 0.9, ...(boyWalk < 1 ? walk(t * 1.2, 1) : gesture('rest', 'pointUp', ease(seg(t, 9.2, 9.6)))), tilt: -18, cut: s.tone(0.8), t: clock + 2 });
  if (toss < 1) {
    // the garland in his hands, then flying up to the stem
    const from = man.hand, to = ship.stem;
    const k = ease(toss);
    const p: P = [lerp(from[0], to[0], k), lerp(from[1], to[1], k) - Math.sin(k * Math.PI) * 0.08];
    if (t > 7.6) garlandAt(c, p, 0.03 * 0.95, clock + 1, s.still);
  } else {
    glow(c, ship.stem[0], ship.stem[1] + 0.02, 0.08, GOLD, 0.6 * (1 - seg(t, 9.5, 10.8)) + 0.15);
    if (t < 10.2) sparks(c, ship.stem[0], ship.stem[1] + 0.02, 0.06, clock, s.still ? 0 : 8, [255, 220, 140]);
  }
  s.spill(H + 0.45, 0.12, 0.35, [255, 232, 190]);
};

/* ================================================================ II. plank by plank */
/** when each plank (by its place in ORDER) starts to be replaced, and how long it takes */
const SWAP = ORDER.map((_, n) => (n === 0 ? [1.2, 2.6] : n === 1 ? [4.0, 2.0] : n === 2 ? [6.2, 1.5] : [7.9 + (n - 3) * 0.29, 0.9]));
const SWAP_END = SWAP[NP - 1][0] + SWAP[NP - 1][1];
/** how far plank `id` has got at time t: 0 old and in place … 1 new and in place */
const swapK = (id: number, t: number) => { const [a, d] = SWAP[RANK[id]]; return seg(t, a, a + d); };
/** an old plank's decay at time t: they rot in turn, the next to go the worst */
const ageAt = (id: number, t: number) => Math.min(1, 0.25 + 0.75 * seg(t, SWAP[RANK[id]][0] - 5.5, SWAP[RANK[id]][0] - 0.2) + (RANK[id] < 3 ? 0.35 : 0));

/** Day and night racing over: the phase of the days (one per unit) for time t. */
const days = (t: number) => 0.3 + 0.16 * t + 0.035 * t * t;

const plankByPlank: SceneFn = (s) => {
  const { t, c, clock } = s;
  s.cam(0.75 + 0.02 * Math.sin(t * 0.3), 0.52, 1.12);
  const d = days(t), dayK = d % 1;
  const night = s.still ? 0 : Math.max(0, -Math.cos(dayK * TAU)) ** 0.7 * 0.85;
  s.backdrop({ mood: 'day', to: 'night', k: night, x: 0.75, y: 0.2, r: 1.7 });
  // sun by day, moon and stars by night, each crossing the sky
  const arc = (k: number): P => [lerp(-0.1, 1.6, k), 0.62 - Math.sin(k * Math.PI) * 0.5];
  if (dayK > 0.25 && dayK < 0.75) { const p = arc((dayK - 0.25) * 2); sun(c, p[0], p[1], 0.04, clock, 1 - night * 0.6, 0.3); }
  else {
    const p = arc(((dayK + 0.25) % 1) * 2);
    c.fillStyle = `rgba(250,248,236,${0.95 * night})`; c.beginPath(); c.arc(p[0], p[1], 0.03, 0, TAU); c.fill();
    c.fillStyle = css(s.screen); c.beginPath(); c.arc(p[0] + 0.012, p[1] - 0.008, 0.026, 0, TAU); c.fill();
    for (let i = 0; i < 16; i++) twinkle(c, hash(i, 1) * 1.5, 0.08 + hash(i, 2) * 0.3, 0.006 + 0.004 * Math.sin(clock * 3 + i), `rgba(255,252,236,${night * 0.9})`);
  }
  // the city behind, darkening and lightening with the days
  c.fillStyle = s.tone(0.6); acropolis(c, 1.22, 0.66, 0.5, 0.3, s.tone(0.74));
  c.fillStyle = s.tone(0.5); town(c, -0.2, 1.7, 0.72, 0.1, 9, 1, 0, s.tone(0.64));
  c.fillStyle = s.tone(0.1); c.fillRect(-0.3, GROUND, 2.1, 0.5);
  // rain and snow in their seasons: the weather that rots the wood
  weather(c, -0.2, -0.1, 1.9, 1, clock, 'rain', pulseK(t, 2.4, 4.0), 60, css(mixRGB(s.screen, [255, 255, 255], 0.5), 0.6));
  weather(c, -0.2, -0.1, 1.9, 1, clock, 'snow', pulseK(t, 8.6, 10.6), 50, 'rgba(255,255,255,0.9)');

  const L = 1.1, sx = 0.74, top = 0.775, keelY = top - 0.03;
  const at0: At = (lx, ly) => [sx + lx * L / 100, keelY - ly * L / 100];
  plinth(s, sx - 0.46, sx + 0.42, top, at0);
  // the pile of old planks (left) grows as the stack of new timber (right) shrinks
  const pileX = 0.24, stackX = 1.27;
  const landed = ORDER.filter((id) => swapK(id, t) >= 0.6).length;
  const used = ORDER.filter((id) => swapK(id, t) >= 0.5).length;
  for (let i = 0; i < NP - used; i++) {
    const y = GROUND - 0.012 - i * 0.012;
    c.fillStyle = css(TIMBER); c.fillRect(stackX - 0.08, y, 0.16, 0.011);
    c.strokeStyle = s.tone(0.2); c.lineWidth = 0.0015; c.strokeRect(stackX - 0.08, y, 0.16, 0.011);
  }
  const pileSlot = (i: number): [number, number, number] => [pileX + (hash(i, 11) - 0.5) * 0.05, GROUND - 0.008 - i * 0.0115, (hash(i, 12) - 0.5) * 0.18];

  const ship = galley(s, {
    x: sx, y: keelY, L, t: clock, sail: 0, oars: 0, still: s.still,
    plank: (id) => { const k = swapK(id, t); if (k > 0.3 && k < 0.82) return null; return k >= 0.82 ? { k: 1, age: 0 } : { k: 0, age: ageAt(id, t) }; },
  });
  for (let i = 0; i < landed; i++) {
    const [x, y, r] = pileSlot(i);
    const pts = moved(ship.plank(ORDER[i]), 0, 0, 0);
    const ctr = centre(pts);
    const len = Math.hypot(pts[0][0] - pts[6][0], pts[0][1] - pts[6][1]);
    const flat = pts.map(([px, py]) => [x + (px - ctr[0]) * (0.14 / Math.max(0.05, len)) * 0 + (px - ctr[0]), y + (py - ctr[1]) * 0.45] as P);
    drawPlank(s, moved(flat, 0, 0, r * 0.3 + Math.atan2(pts[0][1] - pts[6][1], pts[6][0] - pts[0][0])), { k: 0, age: 1 }, ORDER[i], L / 100);
  }

  // the planks in the air: an old one coming off and down to the pile, a new one tossed up from the stack and fitted
  let active = ORDER[0];
  ORDER.forEach((id, n) => {
    const k = swapK(id, t);
    if (k <= 0) return;
    if (k < 1) active = id;
    const home = ship.plank(id), hc = centre(home);
    if (k > 0.3 && k < 0.6) {
      const f = seg(k, 0.3, 0.6);
      const [px, py, pr] = pileSlot(n);
      const dx = lerp(0, px - hc[0], f), dy = lerp(0, py - hc[1], easeIn2(f)) - Math.sin(f * Math.PI) * 0.06;
      drawPlank(s, moved(home, dx, dy, f * (2.4 + pr)), { k: 0, age: ageAt(id, t) }, id, L / 100);
    }
    if (k > 0.5 && k < 0.82) {
      const f = seg(k, 0.5, 0.82);
      const sy = GROUND - 0.02 - (NP - n) * 0.012;
      const dx = lerp(stackX - hc[0], 0, easeOut(f)), dy = lerp(sy - hc[1], 0, f) - Math.sin(f * Math.PI) * 0.12;
      drawPlank(s, moved(home, dx, dy, (1 - f) * 0.5), { k: 1, age: 0 }, id, L / 100);
    }
    // a knock and a puff of sawdust when it goes home
    if (k > 0.82 && k < 1) sparks(c, hc[0], hc[1], 0.05, clock + n, s.still ? 0 : 5, [255, 226, 160]);
    if (k > 0.1 && k < 0.3 && !s.still) { const sh = Math.sin(clock * 50) * 0.003; c.save(); c.globalAlpha = 0.5; drawPlank(s, moved(home, sh, 0, 0), { k: 0, age: ageAt(id, t) }, id, L / 100); c.restore(); }
  });

  // the shipwright: cap, beard and hammer; he moves from plank to plank, faster and faster
  const ac = centre(ship.plank(active));
  const fast = seg(t, 7.6, 8.4) * (1 - seg(t, SWAP_END - 0.4, SWAP_END));
  const wx = ac[0] - 0.09 + (s.still ? 0 : fast * Math.sin(clock * 9) * 0.02);
  const ka = swapK(active, t);
  const strike = s.still ? 0.5 : (ka > 0.1 && ka < 0.32) || (ka > 0.82 && ka < 1) ? 0.5 + 0.5 * Math.sin(clock * (14 + fast * 10)) : 0;
  const done = seg(t, SWAP_END, SWAP_END + 0.6);
  const hand: P = done > 0 ? [wx + 0.06, GROUND - 0.26] : [lerp(ac[0] - 0.02, ac[0] - 0.045, strike), lerp(ac[1] + 0.005, ac[1] - 0.07, strike)];
  rimmed(s, { x: wx, y: GROUND, h: 0.3, face: 1, robe: 'short', beard: true, hat: 'cap', hold: 'hammer', reach: done > 0 ? null : hand, ...(done > 0 ? gesture('rest', 'hips', done) : { arm2: [20, 30] as [number, number] }), lean: 6 * (1 - done), cut: s.tone(0.8), t: clock });
  if (fast > 0.2 && !s.still) speed(c, wx - 0.04, GROUND - 0.15, 0.1, Math.cos(clock * 9) > 0 ? 1 : -1, fast * 0.6, s.tone(0.35));
  // the apprentice at the stack, tossing up the new timber
  const toss = ORDER.reduce((m, id) => { const k = swapK(id, t); return k > 0.45 && k < 0.6 ? 1 : m; }, 0);
  c.fillStyle = s.ink; c.strokeStyle = s.ink;
  person(c, { x: stackX - 0.12, y: GROUND, h: 0.24, face: -1, robe: 'short', hair: 'curls', build: 0.92, ...gesture('rest', 'raise', toss), cut: s.tone(0.8), t: clock + 1 });
  // all new: a gleam runs along the hull
  if (done > 0) {
    const gx = lerp(sx - 0.45, sx + 0.5, seg(t, SWAP_END, SWAP_END + 1.2));
    glow(c, gx, keelY - 0.09, 0.12, [255, 236, 190], 0.7 * (1 - seg(t, SWAP_END + 1, SWAP_END + 1.4)));
  }
};
const pulseK = (t: number, a: number, b: number) => seg(t, a, a + 0.4) * (1 - seg(t, b - 0.4, b));
const easeIn2 = (x: number) => x * x;

/* ================================================================ III. the question */
/** a philosopher of one side or the other */
const sage = (s: Stage, b: Partial<Body>): Body => ({ x: 0, y: GROUND, h: 0.31, robe: 'long', beard: true, cut: s.tone(0.8), t: s.clock, ...b });
const theQuestion: SceneFn = (s) => {
  const { t, c, clock } = s;
  const pull = ease(seg(t, 0, 2.2));
  s.cam(0.75, lerp(0.5, 0.5, pull), lerp(1.5, 1.0, pull));
  s.backdrop({ mood: 'gold', x: 0.75, y: 0.3, r: 1.5 });
  // the Stoa behind: where the philosophers walk and argue
  c.fillStyle = s.tone(0.58);
  c.fillRect(-0.3, 0.4, 2.1, 0.03);
  c.beginPath(); c.moveTo(-0.3, 0.4); c.lineTo(0.75, 0.3); c.lineTo(1.8, 0.4); c.closePath(); c.fill();
  for (let i = 0; i < 14; i++) c.fillRect(-0.2 + i * 0.14, 0.43, 0.022, 0.3);
  c.fillRect(-0.3, 0.73, 2.1, 0.02);
  c.fillStyle = s.tone(0.1); c.fillRect(-0.3, GROUND, 2.1, 0.5);
  const L = 0.74, sx = 0.75, top = 0.775, keelY = top - 0.03;
  const at0: At = (lx, ly) => [sx + lx * L / 100, keelY - ly * L / 100];
  plinth(s, sx - 0.31, sx + 0.28, top, at0);
  // the old ship, as a dark ghost over the new one: is it still there?
  const ghost = ease(seg(t, 1.6, 3.2));
  const drift = s.still ? 0.5 : 0.5 + 0.5 * Math.sin(clock * 0.9);
  galley(s, { x: sx, y: keelY, L, t: clock, sail: 1, pale: 1, still: s.still, garland: 1, plank: () => ({ k: 1, age: 0 }) });
  if (ghost > 0) {
    c.save(); c.globalAlpha = 0.42 * ghost;
    galley(s, { x: sx - 0.035 * drift * ghost, y: keelY - 0.02 * drift * ghost, L, t: clock + 0.7, sail: 1, pale: 0, still: s.still, flat: css(inkRGB(s)) });
    c.restore();
  }
  // left: "the same ship" — they point at it, nodding
  const sayL = shown(t, 3, 12.6), sayR = shown(t, 4.8, 12.6);
  const row = seg(t, 7.2, 9.6);
  const nod = s.still ? 0 : Math.sin(clock * 5) * 4 * sayL;
  const shake = s.still ? 0 : Math.sin(clock * 9) * 7 * sayR;
  const ql = ease(seg(t, 9.8, 11));
  c.fillStyle = s.ink; c.strokeStyle = s.ink;
  const l1 = person(c, sage(s, { x: 0.22, face: 1, head: 'bald', hold2: 'scroll', ...gesture('rest', 'point', ease(seg(t, 2.6, 3.2))), tilt: nod - 10 * ql, mouth: talk(s, sayL > 0.5 && t < 9.8) }));
  person(c, sage(s, { x: 0.36, h: 0.29, face: 1, hold: 'staff', ...gesture('rest', 'raise', ease(seg(t, 7.4, 8)) * (1 - ql)), tilt: nod * 0.6 - 12 * ql, hair: 'long' }));
  const r1 = person(c, sage(s, { x: 1.26, face: -1, hair: 'curls', ...gesture('hips', 'fist', ease(seg(t, 7.2, 7.8)) * (1 - ql)), tilt: shake - 10 * ql, mouth: talk(s, sayR > 0.5 && t < 9.8) }));
  person(c, sage(s, { x: 1.12, h: 0.28, face: -1, beard: false, hat: 'brim', ...gesture('rest', 'shrug', ease(seg(t, 5.2, 5.8))), tilt: shake * 0.5 - 12 * ql }));
  // the two answers, as pictures; they push towards each other over the ship and clash
  const clash = ease(seg(t, 7.2, 8.6)) * (1 - ease(seg(t, 9.6, 10.6)) * 0.6);
  const bump = s.still ? 0 : Math.max(0, Math.sin((t - 8.4) * 12)) * seg(t, 8.4, 8.6) * (1 - seg(t, 9.2, 9.6));
  const ly = lerp(l1.head[1] - 0.17, 0.22, clash), ry = lerp(r1.head[1] - 0.17, 0.22, clash);
  const lx = lerp(l1.head[0] + 0.12, 0.53, clash) - bump * 0.02, rx = lerp(r1.head[0] - 0.12, 0.97, clash) + bump * 0.02;
  bubble(c, { x: lx, y: ly, r: 0.075, wide: 2.3, to: clash < 0.5 ? l1.mouth : undefined, k: sayL, ink: s.ink, icon: equation(s, true), scale: 0.6, shake: row, time: clock });
  bubble(c, { x: rx, y: ry, r: 0.075, wide: 2.3, to: clash < 0.5 ? r1.mouth : undefined, k: sayR, ink: s.ink, icon: equation(s, false), scale: 0.6, shake: row, time: clock });
  if (row > 0.4 && row < 1 && !s.still) sparks(c, 0.75, 0.22, 0.08, clock, 12, [255, 200, 120]);
  // and over the ship, a question nobody can settle
  bigQ(s, 0.75, 0.16 + 0.01 * Math.sin(clock * 1.5), 0.1, ql);
  s.spill(0.75, 0.3, 0.4 + 0.3 * ql, [255, 214, 140]);
};

/* ================================================================ IV. a second ship */
const NEW_X = 1.05, OLD_X = 0.42, SL = 0.56;
const aSecondShip: SceneFn = (s) => {
  const { t, c, clock } = s;
  const wide = ease(seg(t, 8.6, 10.2));
  s.cam(lerp(0.52, 0.75, wide), lerp(0.56, 0.5, wide), lerp(1.45, 1.0, wide));
  const dawn = ease(seg(t, 7.6, 10.4));
  s.backdrop({ mood: 'night', to: 'dawn', k: dawn, x: lerp(0.62, 0.8, dawn), y: 0.3, r: 1.6 });
  // moon and stars, giving way to dawn
  c.fillStyle = `rgba(250,248,236,${0.9 * (1 - dawn)})`; c.beginPath(); c.arc(1.2, 0.16, 0.035, 0, TAU); c.fill();
  c.fillStyle = css(s.screen); c.beginPath(); c.arc(1.214, 0.15, 0.03, 0, TAU); c.fill();
  for (let i = 0; i < 18; i++) twinkle(c, hash(i, 3) * 1.5, 0.05 + hash(i, 4) * 0.3, 0.006 + 0.003 * Math.sin(clock * 2 + i), `rgba(255,252,236,${(1 - dawn) * 0.8})`);
  c.fillStyle = s.tone(0.55); hills(c, -0.3, 1.8, 0.66, 0.05, 12, 1.2, 2);
  c.fillStyle = s.tone(0.1); c.fillRect(-0.3, GROUND, 2.1, 0.5);
  const top = 0.775, keelY = top - 0.03;
  const atN: At = (lx, ly) => [NEW_X + lx * SL / 100, keelY - ly * SL / 100];
  const atO: At = (lx, ly) => [OLD_X + lx * SL / 100, keelY - ly * SL / 100];
  plinth(s, NEW_X - 0.24, NEW_X + 0.22, top, atN);
  plinth(s, OLD_X - 0.24, OLD_X + 0.22, top, atO);
  // the lamp on its post, lighting the work
  const lampP: P = [0.75, 0.5];
  c.fillStyle = s.ink; c.fillRect(lampP[0] - 0.004, lampP[1], 0.008, GROUND - lampP[1]);
  c.fillRect(lampP[0] - 0.004, lampP[1], 0.04, 0.006);
  c.beginPath(); c.ellipse(lampP[0] + 0.036, lampP[1] + 0.02, 0.014, 0.008, 0, 0, TAU); c.fill();
  glow(c, lampP[0] + 0.036, lampP[1] + 0.012, 0.32, [255, 196, 110], 0.55 * (1 - dawn * 0.7) * (0.9 + 0.1 * noise(clock * 4)));
  c.fillStyle = 'rgba(255,214,140,1)'; c.beginPath(); c.arc(lampP[0] + 0.036, lampP[1] + 0.012, 0.006, 0, TAU); c.fill();
  // the new ship stands, pale, where it always stood
  const sailUp = ease(seg(t, 8.0, 9.2));
  galley(s, { x: NEW_X, y: keelY, L: SL, t: clock, sail: 1, pale: 1, still: s.still, plank: () => ({ k: 1, age: 0 }) });
  // the old planks, kept in a pile, go one by one back onto a frame: a second ship
  const BUILD = ORDER.map((_, n) => (n === 0 ? 1.4 : n === 1 ? 2.8 : 3.9 + (n - 2) * 0.24));
  const placed = (n: number) => seg(t, BUILD[n] + 0.7, BUILD[n] + 0.9);
  const inPile = ORDER.filter((_, n) => t < BUILD[n]).length;
  const old = galley(s, {
    x: OLD_X, y: keelY, L: SL, t: clock + 0.4, sail: sailUp, pale: 0, mast: ease(seg(t, 7.4, 8.2)), bare: t < BUILD[NP - 1] + 0.9, still: s.still,
    plank: (id) => (placed(RANK[id]) >= 1 ? { k: 0, age: 0.9 } : null),
  });
  const pileX = 0.75;
  for (let i = 0; i < inPile; i++) {
    const y = GROUND - 0.008 - i * 0.009, x = pileX + (hash(i, 11) - 0.5) * 0.04;
    const pts: P[] = [[x - 0.07, y - 0.004], [x + 0.07, y - 0.004 + (hash(i, 13) - 0.5) * 0.01], [x + 0.07, y + 0.004], [x - 0.07, y + 0.004]];
    drawPlank(s, [...[0, 1, 2, 3, 4, 5, 6].map((j) => mixP(pts[0], pts[1], j / 6)), ...[6, 5, 4, 3, 2, 1, 0].map((j) => mixP(pts[3], pts[2], j / 6))], { k: 0, age: 0.9 }, ORDER[NP - 1 - i], SL / 100);
  }
  // the builder, hooded, carries each plank from the pile to the frame
  let carry: P | null = null, bx = pileX + 0.08, face: 1 | -1 = -1, bend = 0;
  ORDER.forEach((id, n) => {
    const a = BUILD[n], f = seg(t, a, a + 0.75);
    if (f <= 0 || placed(n) >= 1) return;
    const home = centre(old.plank(id));
    const p: P = [lerp(pileX, home[0], ease(f)), lerp(GROUND - 0.05, home[1], ease(f)) - Math.sin(f * Math.PI) * (n < 2 ? 0.05 : 0.1)];
    if (n < 2) { carry = p; bx = lerp(pileX + 0.04, home[0] + 0.07, ease(f)); bend = 1 - seg(f, 0, 0.3); }
    drawPlank(s, moved(old.plank(id), p[0] - home[0], p[1] - home[1], (1 - f) * 0.4), { k: 0, age: 0.9 }, id, SL / 100);
  });
  const fastB = seg(t, 3.8, 4.2) * (1 - seg(t, BUILD[NP - 1], BUILD[NP - 1] + 0.6));
  if (!carry && t > 3.8 && t < BUILD[NP - 1] + 0.6) { bx = lerp(0.68, 0.28, 0.5 + 0.5 * Math.sin(t * 5)); face = Math.cos(t * 5) > 0 ? -1 : 1; }
  const finished = seg(t, BUILD[NP - 1] + 0.9, BUILD[NP - 1] + 1.6);
  if (finished > 0) { bx = lerp(bx, 0.62, finished); face = -1; }
  const claim = shown(t, 9.6, 12);
  const builder = rimmed(s, { x: bx, y: GROUND, h: 0.27, face, robe: 'short', hat: 'hood', beard: true, ...(carry ? { reach: carry, reach2: [carry[0] + 0.02, carry[1] + 0.01] as P, lean: 14 * bend } : finished > 0 ? gesture('rest', 'point', claim) : walk(t * 1.3, 1)), cut: s.tone(0.8), t: clock }, 1 - dawn * 0.5);
  if (fastB > 0.2 && !s.still) speed(c, bx, GROUND - 0.14, 0.09, face, fastB * 0.6, s.tone(0.4));
  // the shipwright comes out to his own ship
  const keeperIn = seg(t, 8.8, 10);
  c.fillStyle = s.ink; c.strokeStyle = s.ink;
  const keeper = person(c, { x: lerp(1.6, 1.36, keeperIn), y: GROUND, h: 0.28, face: -1, robe: 'short', beard: true, hat: 'cap', hold: 'hammer', ...(keeperIn < 1 ? walk(t, 1) : gesture('rest', 'point', claim)), cut: s.tone(0.8), t: clock + 3 });
  // each says: this one is Theseus' ship
  bubble(c, { x: builder.head[0] + 0.02, y: builder.head[1] - 0.16, r: 0.06, to: builder.mouth, k: claim, ink: s.ink, icon: [HERO, CHECK2] });
  bubble(c, { x: keeper.head[0] - 0.04, y: keeper.head[1] - 0.16, r: 0.06, to: keeper.mouth, k: shown(t, 10, 12), ink: s.ink, icon: [HERO, CHECK2] });
  // and a question hops from one masthead to the other
  const hopT = seg(t, 9.8, 12);
  if (hopT > 0) {
    const ph = (t - 9.8) * 0.9, side = Math.floor(ph) % 2, f = ph % 1;
    const a = side ? atN(6, 70) : atO(6, 70), b = side ? atO(6, 70) : atN(6, 70);
    const p: P = [lerp(a[0], b[0], ease(f)), lerp(a[1], b[1], f) - Math.sin(f * Math.PI) * 0.14];
    bigQ(s, p[0], p[1], 0.06, ease(seg(t, 9.8, 10.3)));
  }
  s.spill(lampP[0], lampP[1], 0.5 * (1 - dawn), [255, 196, 110]);
};
const CHECK2: Icon = (c) => { c.lineWidth = 0.2; c.beginPath(); c.moveTo(-0.6, 0.05); c.lineTo(-0.15, 0.5); c.lineTo(0.65, -0.5); c.stroke(); };

/* ================================================================ V. your turn */
const ROW = 6;
const yourTurn: SceneFn = (s) => {
  const { t, c, clock } = s;
  s.cam(0.75, 0.5, 1);
  const k0 = ease(seg(t, 0, 1.8));
  s.backdrop({ mood: 'dawn', to: 'paper', k: k0, x: 0.75, y: 0.4, r: 1.5 });
  const xs = Array.from({ length: ROW }, (_, i) => 0.22 + i * 0.212);
  const rowY = 0.56;
  // the two ships draw back to the ends of a row; the steps between them fill in
  const L = lerp(0.5, 0.17, k0);
  const ends: [number, number][] = [[lerp(0.42, xs[0], k0), 0], [lerp(1.08, xs[ROW - 1], k0), 1]];
  const lineX = 0.75 + (s.still ? 0.1 : 0.32 * Math.sin((t - 2.6) * 1.1) * seg(t, 2.6, 3.4) + 0.06 * Math.sin((t - 2.6) * 2.3) * seg(t, 2.6, 3.4));
  const shipAt = (x: number, frac: number, size: number, alpha: number) => {
    if (alpha <= 0.01) return;
    c.save(); c.globalAlpha = alpha;
    const n = Math.round(frac * NP);
    galley(s, { x, y: lerp(0.8, rowY, k0), L: size, t: clock + x, sail: 1, pale: frac > 0.5 ? 1 : 0, still: s.still, plank: (id) => (RANK[id] < n ? { k: 1, age: 0 } : { k: 0, age: 0.7 }) });
    c.restore();
  };
  shipAt(ends[0][0], 0, L, 1);
  shipAt(ends[1][0], 1, L, 1);
  for (let i = 1; i < ROW - 1; i++) shipAt(xs[i], i / (ROW - 1), L, ease(seg(t, 1.2 + i * 0.25, 1.6 + i * 0.25)));
  // over each: the same as Theseus' ship, or not, depending on which side of the line it falls
  const tags = seg(t, 2.8, 3.4);
  xs.forEach((x, i) => {
    if (tags <= 0) return;
    const same = x < lineX;
    const p: P = [x, rowY - 0.24];
    c.save(); c.globalAlpha = tags;
    c.fillStyle = 'rgba(255,252,246,0.97)'; c.strokeStyle = s.ink; c.lineWidth = 0.004;
    c.beginPath(); c.arc(p[0], p[1], 0.032, 0, TAU); c.fill(); c.stroke();
    c.translate(p[0], p[1]); c.scale(0.022, 0.022); c.fillStyle = same ? css(mixRGB(GOLD, [150, 90, 20], 0.3)) : s.ink; (same ? EQ : NEQ)(c);
    c.restore();
  });
  // the line, and a hand that drags it to and fro: where would you draw it?
  const lk = ease(seg(t, 2.2, 2.8));
  if (lk > 0) {
    c.save(); c.globalAlpha = lk;
    c.strokeStyle = css(GOLD); c.lineWidth = 0.006; c.setLineDash([0.02, 0.012]);
    c.beginPath(); c.moveTo(lineX, rowY - 0.3); c.lineTo(lineX, rowY + 0.12); c.stroke(); c.setLineDash([]);
    c.strokeStyle = s.tone(0.4); c.lineWidth = 0.004; c.beginPath(); c.moveTo(xs[0] - 0.08, rowY + 0.12); c.lineTo(xs[ROW - 1] + 0.08, rowY + 0.12); c.stroke();
    glow(c, lineX, rowY + 0.12, 0.05, GOLD, 0.8);
    c.fillStyle = css(GOLD); c.beginPath(); c.arc(lineX, rowY + 0.12, 0.016, 0, TAU); c.fill();
    c.restore();
    pointingHand(s, [lineX + 0.004, rowY + 0.135], 0.11, lk);
  }
  bigQ(s, lineX, rowY - 0.36, 0.06, ease(seg(t, 5.6, 6.4)));
};

/** A pointing hand — the visitor's — reaching in from below to a fingertip at `tip`. */
function pointingHand(s: Stage, tip: P, size: number, k: number) {
  const c = s.c;
  c.save(); c.globalAlpha *= k;
  c.translate(tip[0], tip[1]); c.rotate(-Math.PI / 2 + 0.35); c.scale(size, size);
  c.fillStyle = s.ink;
  c.beginPath(); c.roundRect(-1.05, -0.1, 1.05, 0.2, 0.1); c.fill();
  c.beginPath(); c.roundRect(-1.6, -0.12, 0.72, 0.5, 0.18); c.fill();
  for (let i = 0; i < 3; i++) { c.beginPath(); c.ellipse(-1.05 - i * 0.17, 0.36, 0.1, 0.12, 0, 0, TAU); c.fill(); }
  c.beginPath(); c.ellipse(-1.05, -0.12, 0.3, 0.09, -0.2, 0, TAU); c.fill();
  c.fillRect(-3, -0.14, 1.5, 0.56);
  c.fillStyle = s.tone(0.75); c.beginPath(); c.ellipse(-0.08, -0.04, 0.06, 0.04, 0, 0, TAU); c.fill();
  c.fillRect(-1.55, -0.14, 0.05, 0.56);
  c.restore();
}

export const theseus: StoryVisuals = {
  id: 'theseus',
  aspect: 1.5,
  loop: false,
  scenes: [theShip, plankByPlank, theQuestion, aSecondShip, yourTurn],
  stills: [3, 9.4, 11.4, 11, 5],
};
