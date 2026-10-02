import { seg, ease, easeOut, pop, lerp, hash, css, mixRGB, type RGB, type Stage, type SceneFn, type StoryVisuals } from '../puppet/theatre';
import { person, mixA, SIT, type Body } from '../puppet/figure';
import { elephant, bird, type Elephant } from '../puppet/beasts';
import { glow, sparks, sound, twinkle, ripple } from '../puppet/fx';
import { cloud, mountains, hills, palm } from '../puppet/scenery';
import { thread } from '../puppet/marks';

/**
 * "Indra's net" (told after the Avataṃsaka Sūtra): over the god's palace
 * hangs a net with no edge and a jewel at every knot; each jewel holds all
 * the others; touch one and the whole net answers; and ideas may be knotted
 * the same way.
 *
 * Four sets. Indra's palace on the clouds at dawn, where he casts the net
 * across the sky; a close look into one jewel, and down through its
 * reflections; a lotus pool at night, where a monk touches a jewel; and a
 * page, where a corner of the net becomes the concept map.
 */
type C = CanvasRenderingContext2D;
type P = [number, number];
const TAU = Math.PI * 2;
const GOLD: RGB = [240, 176, 70];
const WHITE: RGB = [255, 255, 255];
const GROUND = 0.84;
const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
/** screen px per world unit, as the camera stands now */
const pxOf = (s: Stage) => { const v = s.view(); return s.unit / (v[3] - v[1]); };

/* ================================================================ jewels */
/** the jewels' colours: mostly clear crystal and pale gold, with a few sapphires, rubies and emeralds */
const CRYSTAL: RGB = [196, 222, 255];
const TINTS: RGB[] = [CRYSTAL, CRYSTAL, CRYSTAL, [250, 212, 136], [250, 212, 136], [104, 150, 240], [238, 112, 146], [80, 192, 148]];
const tintAt = (i: number, j: number) => TINTS[Math.floor(hash(i * 7.31 + j * 3.17, 5.3) * TINTS.length)];

/**
 * One jewel: a dark setting, a body of coloured light and a glint. `lit` 0 is
 * a dull bead, 1 a burning one; `flash` is a burst on top of that.
 */
function gem(c: C, x: number, y: number, r: number, tint: RGB, lit: number, ink: string, px: number, flash = 0) {
  const rs = r * px;
  if (rs < 0.35) return;
  const L = clamp01(lit + flash);
  if ((lit > 0.3 && rs > 2) || flash > 0.02) {
    c.fillStyle = css(mixRGB(tint, WHITE, 0.3), 0.12 * lit + 0.4 * flash);
    c.beginPath(); c.arc(x, y, r * (1.9 + 2.6 * flash), 0, TAU); c.fill();
  }
  c.fillStyle = ink;
  c.beginPath(); c.arc(x, y, r * 1.22, 0, TAU); c.fill();
  const body = mixRGB(mixRGB(tint, [24, 22, 34], 0.84), tint, L);
  if (rs > 3.5) {
    const g = c.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.05, x, y, r);
    g.addColorStop(0, css(mixRGB(body, WHITE, 0.15 + 0.65 * L)));
    g.addColorStop(0.65, css(body));
    g.addColorStop(1, css(mixRGB(body, [16, 14, 30], 0.4)));
    c.fillStyle = g;
  } else c.fillStyle = css(mixRGB(body, WHITE, 0.3 * L));
  c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
  if (rs > 2.2) {
    c.fillStyle = `rgba(255,255,255,${0.2 + 0.8 * L})`;
    c.beginPath(); c.ellipse(x - r * 0.36, y - r * 0.38, r * 0.3, r * 0.17, -0.75, 0, TAU); c.fill();
  }
}

/* ================================================================ the net seen from below */
/**
 * The net as a ceiling over the world, in perspective. Knot (n, m) is
 * X = m·a/2 across and Z = z0 + n·a/2 away, h above the eye (h < 0 is its
 * reflection in water), and lands on the screen at vx + f·X/Z, hy − f·h/Z.
 * The rows crowd towards the horizon and never end; threads run along both
 * diagonals.
 */
interface Canopy { vx: number; hy: number; f: number; h: number; a: number; z0: number; z1: number }
interface Knot { n: number; m: number; X: number; Z: number; s: number }
interface Look { size: number; lit: number; flash: number }
interface NetPaint {
  /** how the net lifts at a point (net units): waves */
  lift?: (X: number, Z: number) => number;
  /** how much of the thread from (X1, Z1) to (X2, Z2) is drawn; negative draws it from the second end */
  grow?: (X1: number, Z1: number, X2: number, Z2: number) => number;
  jewel: (k: Knot) => Look | null;
  /** light running along the threads at a point (0..1) */
  shine?: (X: number, Z: number) => number;
  alpha?: number;
  /** a ripple on the water, for reflections */
  wobble?: number;
}
const onSky = (cn: Canopy, X: number, Z: number, lift = 0): P => [cn.vx + (cn.f * X) / Z, cn.hy - (cn.f * (cn.h + lift)) / Z];

function knotsIn(cn: Canopy, view: number[]): Knot[] {
  const half = cn.a / 2, out: Knot[] = [];
  const rows = Math.ceil((cn.z1 - cn.z0) / half);
  for (let n = 0; n <= rows; n++) {
    const Z = cn.z0 + n * half, y = cn.hy - (cn.f * cn.h) / Z;
    if (y < view[1] - 0.5 || y > view[3] + 0.5) continue;
    let m0 = Math.floor(((view[0] - 0.25 - cn.vx) * Z) / cn.f / half);
    const m1 = Math.ceil(((view[2] + 0.25 - cn.vx) * Z) / cn.f / half);
    if (Math.abs(m0 - n) % 2) m0--;
    for (let m = m0; m <= m1; m += 2) out.push({ n, m, X: m * half, Z, s: cn.f / Z });
  }
  return out;
}

function drawCanopy(s: Stage, cn: Canopy, o: NetPaint) {
  const c = s.c, view = s.view(), px = pxOf(s), half = cn.a / 2;
  const sg = cn.h < 0 ? -1 : 1, wob = o.wobble ?? 0;
  const at = (X: number, Z: number): P => {
    const y = cn.hy - (cn.f * (cn.h + sg * (o.lift ? o.lift(X, Z) : 0))) / Z;
    return [cn.vx + (cn.f * X) / Z + (wob ? wob * Math.sin(y * 70 + s.clock * 1.7) : 0), y];
  };
  const ks = knotsIn(cn, view);
  // threads, in four bands of depth: near ones darker and thicker
  const bands = [new Path2D(), new Path2D(), new Path2D(), new Path2D()];
  const shone = [new Path2D(), new Path2D()];
  for (const k of ks) {
    const p = at(k.X, k.Z);
    const band = k.s > 1.3 ? 0 : k.s > 0.75 ? 1 : k.s > 0.45 ? 2 : 3;
    for (const dm of [-1, 1]) {
      const X2 = k.X + dm * half, Z2 = k.Z + half;
      let g = o.grow ? o.grow(k.X, k.Z, X2, Z2) : 1;
      if (g === 0) continue;
      const q = at(X2, Z2);
      let a = p, b = q;
      if (g < 0) { a = q; b = p; g = -g; }
      const e: P = [a[0] + (b[0] - a[0]) * g, a[1] + (b[1] - a[1]) * g];
      bands[band].moveTo(a[0], a[1]); bands[band].lineTo(e[0], e[1]);
      if (o.shine) {
        const sh = o.shine(k.X + dm * half * 0.5, k.Z + half * 0.5);
        if (sh > 0.15) { const path = shone[sh > 0.55 ? 0 : 1]; path.moveTo(a[0], a[1]); path.lineTo(e[0], e[1]); }
      }
    }
  }
  const thick = s.small ? 1.4 : 1;
  const tones = [0.14, 0.26, 0.42, 0.6], widths = [0.005, 0.0032, 0.002, 0.0012];
  const base = o.alpha ?? 1;
  c.save();
  c.globalAlpha = base;
  c.lineCap = 'round';
  bands.forEach((path, i) => { c.strokeStyle = s.tone(tones[i]); c.lineWidth = Math.max(widths[i] * thick, 0.6 / px); c.stroke(path); });
  if (o.shine) {
    c.strokeStyle = css(mixRGB(GOLD, WHITE, 0.35), 0.95); c.lineWidth = 0.0045 * thick; c.stroke(shone[0]);
    c.strokeStyle = css(GOLD, 0.6); c.lineWidth = 0.003 * thick; c.stroke(shone[1]);
  }
  // jewels, far ones first, fading into the distance
  for (let i = ks.length - 1; i >= 0; i--) {
    const k = ks[i];
    const depth = clamp01((k.s - 0.24) / 0.42);
    if (depth <= 0.02) continue;
    const look = o.jewel(k);
    if (!look || look.size <= 0.01) continue;
    const p = at(k.X, k.Z);
    c.globalAlpha = base * depth;
    gem(c, p[0], p[1], cn.a * 0.062 * k.s * look.size, tintAt(k.n, k.m), look.lit, s.tone(Math.min(0.5, 0.1 + 0.2 / k.s)), px, look.flash);
  }
  c.restore();
}

/** The glitter where the net runs on past seeing: a bright haze along the horizon. */
function haze(s: Stage, hy: number, k: number, color: RGB) {
  if (k <= 0.01) return;
  const c = s.c, [x0, , x1] = s.view();
  const g = c.createLinearGradient(0, hy - 0.08, 0, hy + 0.005);
  g.addColorStop(0, css(color, 0)); g.addColorStop(1, css(color, 0.6 * k));
  c.fillStyle = g; c.fillRect(x0 - 0.1, hy - 0.08, x1 - x0 + 0.2, 0.085);
  for (let i = 0; i < 46; i++) {
    const x = x0 + hash(i, 1.7) * (x1 - x0), y = hy - 0.003 - hash(i, 2.9) ** 2 * 0.05;
    const tw = 0.5 + 0.5 * Math.sin(s.clock * (2 + hash(i, 4.4) * 3) + i);
    c.fillStyle = css(mixRGB(color, WHITE, 0.6), k * tw * 0.9);
    c.beginPath(); c.arc(x, y, 0.0015 + 0.0015 * tw, 0, TAU); c.fill();
  }
}

/* ================================================================ I. the net */
/** A temple spire's half-width at height v, from its shoulder (0) to its neck (1). */
const spireW = (v: number, w: number) => w * 0.1 + (w * 0.5 - w * 0.1) * Math.pow(Math.cos((v * Math.PI) / 2), 0.7);

/** A spire in the north Indian manner: walls, a curved tower of stacked courses, a ribbed cap, a finial and a pennant. */
function spire(s: Stage, x: number, base: number, w: number, h: number, cut: string, flag: string) {
  const c = s.c;
  const fill = c.fillStyle;
  const y0 = base - h * 0.17, body = h * 0.7, y1 = y0 - body;
  c.beginPath(); c.moveTo(x - w / 2, base);
  for (let i = 0; i <= 18; i++) { const v = i / 18; c.lineTo(x - spireW(v, w), y0 - v * body); }
  for (let i = 18; i >= 0; i--) { const v = i / 18; c.lineTo(x + spireW(v, w), y0 - v * body); }
  c.lineTo(x + w / 2, base); c.closePath(); c.fill();
  // the amalaka, a ribbed disc, then the pot finial
  const nw = spireW(1, w);
  c.beginPath(); c.ellipse(x, y1 - h * 0.025, nw * 1.7, h * 0.034, 0, 0, TAU); c.fill();
  c.beginPath(); c.ellipse(x, y1 - h * 0.075, nw * 0.62, h * 0.03, 0, 0, TAU); c.fill();
  c.beginPath(); c.moveTo(x - nw * 0.28, y1 - h * 0.095); c.lineTo(x, y1 - h * 0.15); c.lineTo(x + nw * 0.28, y1 - h * 0.095); c.closePath(); c.fill();
  // incised courses, the central band and the ribs of the cap
  c.save();
  c.strokeStyle = cut; c.lineWidth = Math.max(0.0012, w * 0.012);
  for (let i = 1; i < 9; i++) { const v = i / 9, hw = spireW(v, w) * 0.94; c.beginPath(); c.moveTo(x - hw, y0 - v * body); c.lineTo(x + hw, y0 - v * body); c.stroke(); }
  for (const sd of [-1, 1]) { c.beginPath(); for (let i = 0; i <= 10; i++) { const v = i / 10; c.lineTo(x + sd * spireW(v, w) * 0.32, y0 - v * body); } c.stroke(); }
  for (let i = -3; i <= 3; i++) { c.beginPath(); c.moveTo(x + i * nw * 0.45, y1 - h * 0.05); c.lineTo(x + i * nw * 0.5, y1 - h * 0.002); c.stroke(); }
  // the door of the shrine, lamp-lit
  c.fillStyle = css(mixRGB(s.screen, [255, 206, 120], 0.6));
  c.beginPath(); c.moveTo(x - w * 0.12, base); c.lineTo(x - w * 0.12, base - h * 0.09); c.arc(x, base - h * 0.09, w * 0.12, Math.PI, 0); c.lineTo(x + w * 0.12, base); c.closePath(); c.fill();
  c.restore();
  pennant(c, x, y1 - h * 0.15, h * 0.2, s.clock + x * 3, flag, fill);
}

/** A long pennant on a pole, streaming in the wind. */
function pennant(c: C, x: number, y: number, len: number, time: number, color: string, pole: string | CanvasGradient | CanvasPattern) {
  c.save();
  c.strokeStyle = pole; c.lineWidth = len * 0.05;
  c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - len * 0.75); c.stroke();
  const top = y - len * 0.75, wave = (v: number) => Math.sin(time * 4.2 - v * 5) * len * 0.07 * v;
  c.fillStyle = color;
  c.beginPath(); c.moveTo(x, top);
  for (let i = 1; i <= 10; i++) { const v = i / 10; c.lineTo(x + v * len, top + v * len * 0.12 + wave(v)); }
  for (let i = 10; i >= 0; i--) { const v = i / 10; c.lineTo(x + v * len, top + len * 0.24 * (1 - v) + v * len * 0.12 + wave(v) + len * 0.02); }
  c.closePath(); c.fill();
  c.restore();
}

/** A domed kiosk (chhatri): slim pillars under an onion dome. */
function kiosk(c: C, x: number, base: number, w: number, h: number) {
  const top = base - h * 0.42;
  for (const k of [-0.42, 0, 0.42]) c.fillRect(x + k * w - w * 0.05, top, w * 0.1, h * 0.42);
  c.fillRect(x - w * 0.62, top - h * 0.07, w * 1.24, h * 0.07);
  c.beginPath(); c.moveTo(x - w * 0.5, top - h * 0.07);
  c.bezierCurveTo(x - w * 0.68, top - h * 0.34, x - w * 0.14, top - h * 0.46, x, top - h * 0.64);
  c.bezierCurveTo(x + w * 0.14, top - h * 0.46, x + w * 0.68, top - h * 0.34, x + w * 0.5, top - h * 0.07);
  c.closePath(); c.fill();
  c.fillRect(x - w * 0.025, top - h * 0.78, w * 0.05, h * 0.16);
  c.beginPath(); c.arc(x, top - h * 0.7, w * 0.07, 0, TAU); c.fill();
}

/** Indra's palace on the clouds: a terrace, a lamp-lit arcade, three spires with pennants, two domed kiosks. */
function palace(s: Stage, x: number, base: number) {
  const c = s.c;
  const cut = s.tone(0.58), flag = css([214, 92, 40]);
  const roof = base - 0.12;
  c.fillStyle = s.tone(0.34);
  spire(s, x - 0.23, roof, 0.13, 0.3, cut, flag);
  spire(s, x + 0.24, roof, 0.13, 0.3, cut, flag);
  c.fillStyle = s.tone(0.26);
  spire(s, x, roof, 0.22, 0.48, cut, flag);
  kiosk(c, x - 0.35, roof, 0.07, 0.15);
  kiosk(c, x + 0.37, roof, 0.07, 0.15);
  // the arcade, its arches glowing
  c.fillStyle = s.tone(0.22);
  c.fillRect(x - 0.42, roof, 0.86, 0.12);
  c.fillRect(x - 0.44, roof - 0.012, 0.9, 0.014);
  c.fillStyle = css(mixRGB(s.screen, [255, 204, 120], 0.55));
  for (let i = 0; i < 9; i++) {
    const ax = x - 0.37 + i * 0.093;
    c.beginPath(); c.moveTo(ax - 0.022, base - 0.012); c.lineTo(ax - 0.022, base - 0.06); c.arc(ax, base - 0.06, 0.022, Math.PI, 0); c.lineTo(ax + 0.022, base - 0.012); c.closePath(); c.fill();
  }
  // the plinth and its steps
  c.fillStyle = s.tone(0.16);
  for (let i = 0; i < 3; i++) c.fillRect(x - 0.46 - i * 0.02, base - 0.012 + i * 0.016, 0.94 + i * 0.04, 0.018);
}

const IVORY: RGB = [250, 246, 236];
/** A point in an elephant's own units (100 = its height, x forwards, y up), in the world. */
const elAt = (o: Elephant, x: number, y: number): P => [o.x + (o.face ?? 1) * x * (o.h / 100), o.y - y * (o.h / 100)];

/** Airavata, Indra's white elephant: ivory, outlined in ink, under a red saddle-cloth and a gold headpiece. */
function airavata(s: Stage, o: Elephant) {
  const c = s.c, d = o.h * 0.014;
  c.fillStyle = s.ink; c.strokeStyle = s.ink;
  for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; elephant(c, { ...o, x: o.x + Math.cos(a) * d, y: o.y + Math.sin(a) * d, cut: undefined, ivory: s.ink }); }
  const ivory = css(mixRGB(IVORY, s.screen, 0.1));
  c.fillStyle = ivory; c.strokeStyle = ivory;
  const parts = elephant(c, { ...o, cut: s.tone(0.3), ivory });
  // the saddle-cloth, its hem scalloped and edged in gold
  const u = o.h / 100;
  c.save(); c.translate(o.x, o.y); c.scale((o.face ?? 1) * u, -u);
  c.fillStyle = css([164, 34, 46]);
  c.beginPath(); c.moveTo(-30, 97); c.quadraticCurveTo(6, 106, 42, 99); c.lineTo(43, 66);
  for (let i = 0; i < 7; i++) { const x0 = 43 - i * 10.5; c.quadraticCurveTo(x0 - 5.25, 57, x0 - 10.5, 66); }
  c.closePath(); c.fill();
  c.strokeStyle = css(GOLD); c.lineWidth = 2;
  c.beginPath(); c.moveTo(-29, 72); for (let i = 0; i <= 12; i++) c.lineTo(-29 + i * 6, 70 + Math.sin(i * 1.4) * 0.6); c.stroke();
  c.fillStyle = css(GOLD);
  for (let i = 0; i < 6; i++) { c.beginPath(); c.arc(-22 + i * 12, 84 + (i % 2) * 2, 2.6, 0, TAU); c.fill(); }
  // the headpiece: a gold plate on the brow, with a tassel
  c.beginPath(); c.moveTo(64, 101); c.lineTo(76, 96); c.lineTo(80, 84); c.lineTo(70, 88); c.closePath(); c.fill();
  c.beginPath(); c.arc(76, 82, 2.4, 0, TAU); c.fill();
  c.restore();
  return parts;
}

const NET1: Canopy = { vx: 0.62, hy: 0.6, f: 1, h: 0.3, a: 0.2, z0: 0.42, z1: 2.8 };
/** the knot the net is cast from (row 2, straight ahead) */
const HUB1 = { X: 0, Z: 0.62 };
const EL1: Elephant = { x: 0.33, y: GROUND, h: 0.3, face: 1 };

/** I. The net: Indra raises his thunderbolt; from one point in the sky a net of jewels races out to every edge. */
const theNet: SceneFn = (s) => {
  const { t, c, clock } = s;
  const back = ease(seg(t, 3, 7.6));
  s.cam(lerp(0.47, s.W / 2, back), lerp(0.47, 0.5, back), lerp(1.22, 1, back));
  const gold = ease(seg(t, 3.6, 9));
  s.backdrop({ mood: 'dawn', to: 'gold', k: gold, x: 0.66, y: 0.2, r: 1.7 });
  // the net: threads race out along the two lines through the hub, the mesh follows, and a jewel lights at every knot it reaches
  const x = Math.max(0, t - 3.1), T = 0.42 * x + 0.04 * x * x;
  const far = (X: number, Z: number) => Math.hypot(X - HUB1.X, Z - HUB1.Z);
  drawCanopy(s, NET1, {
    grow: (X1, Z1, X2, Z2) => {
      const dm = Math.sign(X2 - X1);
      const lead = Math.abs(X1 - HUB1.X - dm * (Z1 - HUB1.Z)) < 1e-6;
      const F = lead ? T * 3.2 : T;
      const d1 = far(X1, Z1), d2 = far(X2, Z2);
      return d1 <= d2 ? clamp01((F - d1) / Math.max(0.02, d2 - d1)) : -clamp01((F - d2) / Math.max(0.02, d1 - d2));
    },
    jewel: (k) => {
      const g = T - far(k.X, k.Z);
      if (g <= 0) return null;
      const tw = hash(k.n * 31 + k.m, 2);
      return { size: pop(clamp01(g / 0.1)), lit: clamp01(g / 0.4) * (0.75 + 0.25 * Math.sin(clock * (1.5 + tw * 2) + tw * 9)), flash: Math.exp(-(((g - 0.05) / 0.1) ** 2)) };
    },
  });
  haze(s, NET1.hy, seg(T, 1.2, 2.6), [255, 236, 200]);
  // far peaks above a sea of cloud
  c.fillStyle = s.tone(0.62); mountains(c, -0.4, s.W + 0.4, NET1.hy + 0.02, 0.13, 4, 1.4, 7);
  c.fillStyle = css(mixRGB(s.screen, WHITE, 0.3), 0.92);
  for (let i = 0; i < 8; i++) cloud(c, -0.25 + i * 0.26 + Math.sin(clock * 0.15 + i) * 0.015, NET1.hy + 0.06 + (i % 2) * 0.025, 0.34, i);
  palace(s, 1.03, 0.8);
  // the terrace, and clouds drifting along its edge
  c.fillStyle = s.tone(0.12); c.fillRect(-0.4, GROUND, s.W + 0.8, 0.6);
  c.fillStyle = s.tone(0.2);
  for (let i = 0; i < 16; i++) c.fillRect(-0.1 + i * 0.1, GROUND - 0.035, 0.012, 0.035);
  c.fillRect(-0.4, GROUND - 0.04, s.W + 0.8, 0.01);
  c.fillStyle = css(mixRGB(s.screen, WHITE, 0.45), 0.9);
  for (let i = 0; i < 6; i++) cloud(c, -0.1 + i * 0.32 + Math.sin(clock * 0.2 + i * 2) * 0.02, 0.97 + (i % 2) * 0.02, 0.42, i + 3);
  // Airavata, trumpeting when the net catches the light
  const trumpet = ease(seg(t, 5.4, 6.2)) * (1 - ease(seg(t, 7.8, 8.8)));
  const el: Elephant = { ...EL1, curl: lerp(0.07 + 0.03 * Math.sin(clock * 0.9), 0.12, trumpet), wiggle: 0.35 * (1 - trumpet), lift: 1.7 * trumpet, flap: 0.5 + 0.5 * trumpet, swing: 0.6, t: clock };
  const parts = airavata(s, el);
  if (trumpet > 0.3) { const tip = parts.trunk[parts.trunk.length - 1]; sound(c, tip[0], tip[1] - 0.01, 0.05, clock, -Math.PI / 2 + 0.4, trumpet, s.tone(0.35), 0.7); }
  // Indra astride, crowned, the thunderbolt in his hand
  const rise = ease(seg(t, 0.8, 2.0)), calm = ease(seg(t, 8.4, 9.4));
  const seat = elAt(el, 4, 100);
  c.fillStyle = s.ink; c.strokeStyle = s.ink;
  const ind = person(c, {
    x: seat[0], y: seat[1], h: 0.23, face: 1, drop: 46, foot: [14, -18], foot2: [9, -20], robe: 'short', hat: 'crown', hold: 'bolt',
    arm: mixA(mixA([40, 70], [150, 4], rise), [112, 18], calm), arm2: [24, 40], tilt: -14 * rise * (1 - calm), lean: -4, cut: s.tone(0.8), t: clock,
  });
  // the bolt gathers light, flashes, and sends a bead of it up to the hub
  const tip: P = ind.tip ?? ind.hand;
  const hub = onSky(NET1, HUB1.X, HUB1.Z);
  const charge = seg(t, 1.6, 2.6) * (1 - seg(t, 3.4, 4.6));
  if (charge > 0) { glow(c, tip[0], tip[1], 0.05 + 0.05 * charge, [255, 236, 170], charge); sparks(c, tip[0], tip[1], 0.06, clock, s.still ? 0 : 8, [255, 230, 150]); }
  const flash = seg(t, 2.55, 2.7) * (1 - seg(t, 2.8, 3.6));
  if (flash > 0) glow(c, tip[0], tip[1], 0.3, [255, 250, 225], flash);
  const fly = easeOut(seg(t, 2.6, 3.1));
  if (fly > 0) {
    c.save(); c.globalAlpha = 1 - seg(t, 3.3, 4.4);
    thread(c, [tip, [lerp(tip[0], hub[0], 0.5) - 0.03, lerp(tip[1], hub[1], 0.5)], hub], fly, [255, 226, 150], 0.005, { curve: 0.06 });
    c.restore();
  }
  if (t > 3) glow(c, hub[0], hub[1], 0.12, [255, 236, 190], 0.8 * (1 - seg(t, 3.4, 5)));
  // birds cross under the new net
  const fl = seg(t, 4.2, 11);
  if (fl > 0) { c.fillStyle = s.tone(0.3); for (let i = 0; i < 2; i++) bird(c, lerp(1.55, -0.2, fl) + i * 0.07, 0.4 + i * 0.03 + Math.sin(clock * 1.3 + i) * 0.01, 0.035, clock * 2.2 + i * 0.3, -1); }
  s.spill(hub[0], hub[1], 0.3 + 0.4 * gold, [255, 224, 160]);
};

/* ================================================================ II. the jewel */
/**
 * The reflection in a jewel: the net all round it, seen as in a convex
 * mirror. A diamond lattice (spacing FA) is bent onto the jewel's face by
 * r → tanh r, so the near jewels are large in the middle and the rest crowd
 * towards the rim. One of them, TARGET, is drawn with the same reflection
 * inside it, and so on down.
 */
const FA = 0.42;
const SQ = Math.SQRT1_2;
const fisheye = (u: number, v: number): P => { const d = Math.hypot(u, v); if (d < 1e-9) return [0, 0]; const k = Math.tanh(d) / d; return [u * k, v * k]; };
interface Bead { x: number; y: number; r: number; tint: RGB; id: number }
const BEADS: Bead[] = [];
for (let p = -7; p <= 7; p++) for (let q = -7; q <= 7; q++) {
  const u = (p - q) * FA * SQ, v = (p + q) * FA * SQ, d = Math.hypot(u, v);
  if (d > 2.8) continue;
  const [x, y] = fisheye(u, v);
  const sech = 1 / Math.cosh(d), tang = d < 1e-6 ? 1 : Math.tanh(d) / d;
  BEADS.push({ x, y, r: 0.27 * FA * Math.sqrt(sech * sech * tang), tint: tintAt(p, q), id: (p + 8) * 17 + q + 8 });
}
/** the reflected jewel we fall into: up and to the right of the middle */
const TARGET: Bead = BEADS.find((b) => b.id === 8 * 17 + 7) ?? BEADS[0];
const GLASS: RGB = [160, 196, 248], DEEP: RGB = [255, 0, 0];
TARGET.tint = GLASS;
const LINES: P[][] = [];
for (let i = -7; i <= 7; i++) for (const along of [0, 1]) {
  const pts: P[] = [];
  for (let j = -7; j <= 7.001; j += 0.25) {
    const p = along ? i : j, q = along ? j : i;
    const u = (p - q) * FA * SQ, v = (p + q) * FA * SQ;
    if (Math.hypot(u, v) <= 3.1) pts.push(fisheye(u, v));
  }
  if (pts.length > 1) LINES.push(pts);
}
/** A reflected jewel; big enough, and it shows the net in small inside it. */
function bead(c: C, x: number, y: number, r: number, tint: RGB, px: number, time: number, id: number) {
  const rs = r * px;
  if (rs < 0.4) return;
  c.fillStyle = css(DEEP, 0.85);
  c.beginPath(); c.arc(x, y, r * 1.18, 0, TAU); c.fill();
  if (rs > 3) {
    // drawn in the bead's own units: a tiny gradient under a deep zoom loses its precision and goes dark
    c.save(); c.translate(x, y); c.scale(r, r);
    const g = c.createRadialGradient(-0.3, -0.3, 0.05, 0, 0, 1);
    g.addColorStop(0, css(mixRGB(tint, WHITE, 0.8))); g.addColorStop(0.6, css(mixRGB(tint, WHITE, 0.2))); g.addColorStop(1, css(mixRGB(tint, DEEP, 0.45)));
    c.fillStyle = g; c.beginPath(); c.arc(0, 0, 1, 0, TAU); c.fill();
    c.restore();
  } else { c.fillStyle = css(mixRGB(tint, WHITE, 0.3)); c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); }
  if (rs > 7) {
    // the same net, small: a few bent threads and the nearest jewels
    c.save(); c.beginPath(); c.arc(x, y, r * 0.98, 0, TAU); c.clip();
    c.strokeStyle = css(DEEP, 0.6); c.lineWidth = r * 0.05;
    c.beginPath();
    for (const sd of [-1, 1]) for (const k of [-0.55, 0, 0.55]) { c.moveTo(x - r, y + k * r - sd * r); c.quadraticCurveTo(x + k * r * 0.5, y + k * r * 0.4, x + r, y + k * r + sd * r); }
    c.stroke();
    for (let i = 0; i < 9; i++) {
      const a = (i / 8) * TAU, d = i === 8 ? 0 : 0.56;
      c.fillStyle = css(mixRGB(TINTS[(id + i) % TINTS.length], DEEP, 0.12));
      c.beginPath(); c.arc(x + Math.cos(a + 0.4) * d * r, y + Math.sin(a + 0.4) * d * r, r * (i === 8 ? 0.17 : 0.1), 0, TAU); c.fill();
    }
    c.restore();
  }
  if (rs > 1.5) { c.fillStyle = 'rgba(255,255,255,0.9)'; c.beginPath(); c.ellipse(x - r * 0.38, y - r * 0.4, r * 0.26, r * 0.15, -0.75, 0, TAU); c.fill(); }
  const tw = Math.sin(time * 1.7 + id * 2.3);
  if (rs > 4 && tw > 0.86) twinkle(c, x - r * 0.3, y - r * 0.38, (r * 0.9 * (tw - 0.86)) / 0.14, 'rgba(255,255,255,0.95)');
}

/**
 * A jewel of the net and everything it reflects, at centre (x, y), radius R.
 * Down the line of TARGETs it recurses for ever (`deep`); any other jewel
 * that grows large enough shows the same reflection once, in its own colour.
 * Every choice here hangs on sizes on the screen, never on depth, so a frame
 * one level down looks exactly like the frame above it.
 */
function jewelView(s: Stage, x: number, y: number, R: number, px: number, depth: number, tint: RGB = GLASS, deep = true) {
  const c = s.c, rs = R * px;
  if (rs < 0.5 || depth > 14) return;
  const [vx0, vy0, vx1, vy1] = s.view();
  if (x + R < vx0 || x - R > vx1 || y + R < vy0 || y - R > vy1) return;
  const g = c.createRadialGradient(x - R * 0.25, y - R * 0.3, R * 0.04, x, y, R);
  g.addColorStop(0, css(mixRGB(tint, WHITE, 0.85))); g.addColorStop(0.55, css(mixRGB(tint, WHITE, 0.35))); g.addColorStop(1, css(mixRGB(tint, DEEP, 0.6)));
  c.fillStyle = g; c.beginPath(); c.arc(x, y, R, 0, TAU); c.fill();
  if (rs > 5) {
    c.save(); c.beginPath(); c.arc(x, y, R, 0, TAU); c.clip();
    // the threads of the net, bent round the jewel
    c.strokeStyle = css(DEEP, 0.78); c.lineWidth = Math.min(R * 0.014, 3.5 / px);
    c.beginPath();
    for (const L of LINES) L.forEach((p, i) => (i ? c.lineTo(x + p[0] * R, y + p[1] * R) : c.moveTo(x + p[0] * R, y + p[1] * R)));
    c.stroke();
    // every other jewel …
    for (const b of BEADS) {
      if (deep && b === TARGET) continue;
      const bx = x + b.x * R, by = y + b.y * R, br = b.r * R;
      if (bx + br < vx0 || bx - br > vx1 || by + br < vy0 || by - br > vy1) continue;
      if (br * px > 18) { c.fillStyle = css(DEEP, 0.85); c.beginPath(); c.arc(bx, by, br * 1.18, 0, TAU); c.fill(); jewelView(s, bx, by, br, px, depth + 1, b.tint, false); }
      else bead(c, bx, by, br, b.tint, px, s.clock, b.id);
    }
    // … and the one that holds the whole of it again; while it is small, a light marks it
    const tx = x + TARGET.x * R, ty = y + TARGET.y * R, tr = TARGET.r * R, trs = tr * px;
    if (deep && trs > 4 && trs < 140) {
      const k = clamp01((trs - 4) / 10) * clamp01((140 - trs) / 60) * (0.75 + 0.25 * Math.sin(s.clock * 3));
      glow(c, tx, ty, tr * 2.6, [255, 246, 214], 0.75 * k);
    }
    if (deep && trs > 3) { c.fillStyle = css(DEEP, 0.85); c.beginPath(); c.arc(tx, ty, tr * 1.18, 0, TAU); c.fill(); jewelView(s, tx, ty, tr, px, depth + 1); }
    else if (deep) bead(c, tx, ty, tr, TARGET.tint, px, s.clock, TARGET.id);
    // light on the glass: a broad sheen, a sharp glint, a rim of light below
    c.fillStyle = 'rgba(255,255,255,0.22)';
    c.beginPath(); c.ellipse(x - R * 0.36, y - R * 0.42, R * 0.42, R * 0.22, -0.7, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.85)';
    c.beginPath(); c.ellipse(x - R * 0.42, y - R * 0.48, R * 0.13, R * 0.06, -0.7, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = R * 0.03;
    c.beginPath(); c.arc(x, y, R * 0.93, 0.15 * Math.PI, 0.6 * Math.PI); c.stroke();
    c.restore();
  }
  c.strokeStyle = css(DEEP, 0.9); c.lineWidth = Math.min(R * 0.035, 9 / px);
  c.beginPath(); c.arc(x, y, R, 0, TAU); c.stroke();
}

/** The net straight on, far behind: a pale diamond mesh with small jewels, swaying a little. */
function curtain(s: Stage, cx: number, cy: number, dx: number, dy: number, tone: number, r: number, lit: number) {
  const c = s.c, [x0, y0, x1, y1] = s.view(), px = pxOf(s);
  const sway = Math.sin(s.clock * 0.7) * dx * 0.12;
  const a0 = Math.floor((x0 - cx) / dx) - 2, a1 = Math.ceil((x1 - cx) / dx) + 2;
  const b0 = Math.floor((y0 - cy) / dy) - 2, b1 = Math.ceil((y1 - cy) / dy) + 2;
  const path = new Path2D();
  const at = (a: number, b: number): P => [cx + a * dx + sway * Math.sin(b * 0.4), cy + b * dy];
  for (let b = b0; b <= b1; b++) for (let a = a0; a <= a1; a++) {
    if ((a - b) % 2) continue;
    const p = at(a, b);
    for (const da of [-1, 1]) { const q = at(a + da, b + 1); path.moveTo(p[0], p[1]); path.lineTo(q[0], q[1]); }
  }
  c.strokeStyle = s.tone(tone); c.lineWidth = Math.max(0.0012, 0.6 / px); c.stroke(path);
  for (let b = b0; b <= b1; b++) for (let a = a0; a <= a1; a++) {
    if ((a - b) % 2) continue;
    const p = at(a, b);
    gem(c, p[0], p[1], r, tintAt(a, b), lit * (0.7 + 0.3 * Math.sin(s.clock * 1.3 + a * 1.7 + b)), s.tone(tone), px);
  }
}

/** The monk who looks and touches: a shaven head, a long robe. */
const monk = (s: Stage, b: Partial<Body>): Body => ({ x: 0, y: GROUND, h: 0.34, robe: 'long', head: 'bald', cut: s.tone(0.8), t: s.clock, ...b });

const J2: P = [0.9, 0.45], R2 = 0.19;
/** where the dive heads: the point that the step from a jewel to TARGET leaves where it is */
const FIX2: P = [J2[0] + (R2 * TARGET.x) / (1 - TARGET.r), J2[1] + (R2 * TARGET.y) / (1 - TARGET.r)];

/** II. The jewel: a monk leans close to one jewel; we fall into it, into a jewel inside it, and another inside that. */
const theJewel: SceneFn = (s) => {
  const { t, c, clock } = s;
  const lean = ease(seg(t, 0.3, 1.9));
  const near = ease(seg(t, 1.6, 4.2));
  // the dive: one level is one step from a jewel to the jewel inside it; past the first, every level looks the same
  const x = Math.max(0, t - 3.8), u = (0.3 * x * x) / (x + 1.2);
  const ue = u < 1 ? u : 1 + ((u - 1) % 1);
  const zoom = lerp(1, 0.46 / R2, near) * Math.pow(1 / TARGET.r, ue);
  const into = ease(clamp01(ue));
  s.cam(lerp(lerp(s.W / 2, J2[0], near), FIX2[0], into), lerp(lerp(0.5, J2[1], near), FIX2[1], into), zoom);
  s.backdrop({ mood: 'dusk', x: J2[0], y: J2[1], r: 1.3 });
  const px = pxOf(s);
  const [vx0, vy0, vx1, vy1] = s.view();
  const room = Math.max(Math.hypot(vx0 - J2[0], vy0 - J2[1]), Math.hypot(vx1 - J2[0], vy0 - J2[1]), Math.hypot(vx0 - J2[0], vy1 - J2[1]), Math.hypot(vx1 - J2[0], vy1 - J2[1])) > R2;
  const knot: P = [J2[0], J2[1] - R2 * 1.55];
  if (room) {
    // the rest of the net, far off behind
    curtain(s, J2[0], knot[1], 0.075, 0.06, 0.64, 0.006, 0.7);
    // the near threads through the jewel's knot, and the next jewels along them
    c.strokeStyle = s.tone(0.2); c.lineWidth = 0.005;
    c.beginPath();
    for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { c.moveTo(knot[0], knot[1]); c.lineTo(knot[0] + dx * 2, knot[1] + dy * 1.6); }
    c.stroke();
    for (const [kx, ky, i] of [[knot[0] + 0.42, knot[1] + 0.34, 3], [knot[0] - 0.42, knot[1] - 0.34, 5], [knot[0] + 0.42, knot[1] - 0.34, 6]]) {
      c.strokeStyle = s.tone(0.2); c.lineWidth = 0.003; c.beginPath(); c.moveTo(kx, ky); c.lineTo(kx, ky + 0.06); c.stroke();
      gem(c, kx, ky + 0.12, 0.055, TINTS[i], 0.85, s.tone(0.2), px);
    }
    c.fillStyle = s.ink; c.beginPath(); c.arc(knot[0], knot[1], 0.008, 0, TAU); c.fill();
    // the cord and the gold cap it hangs by
    c.strokeStyle = s.tone(0.15); c.lineWidth = 0.004; c.beginPath(); c.moveTo(knot[0], knot[1]); c.lineTo(J2[0], J2[1] - R2 * 1.08); c.stroke();
    c.fillStyle = css(mixRGB(GOLD, [90, 60, 20], 0.25));
    c.beginPath(); c.ellipse(J2[0], J2[1] - R2 * 0.98, R2 * 0.3, R2 * 0.12, 0, Math.PI, 0); c.fill();
    c.beginPath(); c.arc(J2[0], J2[1] - R2 * 1.12, R2 * 0.05, 0, TAU); c.fill();
    glow(c, J2[0], J2[1], R2 * 1.8, [190, 214, 255], 0.35 + 0.1 * Math.sin(clock * 1.4));
  }
  jewelView(s, J2[0], J2[1], R2, px, 0);
  if (room) {
    // the monk, close, leaning in to look; his hand comes up under the jewel
    c.fillStyle = s.ink; c.strokeStyle = s.ink;
    person(c, monk(s, { x: 0.3, y: 1.38, h: 1.06, face: 1, lean: 12 * lean, tilt: 8 * lean, eye: lean > 0.4 ? 'wide' : 'open', mouth: 0.3 * lean, reach: [lerp(0.42, 0.68, lean), lerp(0.86, 0.62, lean)], arm2: [-8, 14] }));
    // what he sees makes him catch his breath
    const k = seg(t, 1.2, 1.8) * (1 - seg(t, 2.6, 3.2));
    if (k > 0) twinkle(c, J2[0] - R2 * 0.42, J2[1] - R2 * 0.48, 0.05 * k, 'rgba(255,255,255,0.95)');
  }
  s.spill(J2[0], J2[1], 0.45, [170, 200, 255]);
};

/* ================================================================ III. one touch */
const NET3: Canopy = { vx: 0.83, hy: 0.56, f: 1, h: 0.24, a: 0.17, z0: 0.4, z1: 2.8 };
/** the water lies this far below the eye; the net's reflection lies as far under it as the net is above */
const POOL = 0.07;
const MIRROR3: Canopy = { ...NET3, h: -(NET3.h + 2 * POOL) };
/** the knot the touched jewel hangs from (row 3, a little left) */
const K3 = { X: -3 * 0.085, Z: 0.4 + 3 * 0.085 };
const JT: P = [0.44, 0.505];

/** The lotus pool's near bank: stone steps down into the water, with reeds and lotus leaves. */
function ghat(s: Stage) {
  const c = s.c, t = s.clock;
  c.fillStyle = s.tone(0.08);
  c.beginPath(); c.moveTo(-0.4, GROUND); c.lineTo(0.47, GROUND);
  for (let i = 0; i < 4; i++) { c.lineTo(0.47 + i * 0.045, GROUND + 0.022 * (i + 1)); c.lineTo(0.47 + (i + 1) * 0.045, GROUND + 0.022 * (i + 1)); }
  c.lineTo(0.65, 1.5); c.lineTo(-0.4, 1.5); c.closePath(); c.fill();
  c.strokeStyle = s.tone(0.3); c.lineWidth = 0.0016;
  for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(-0.4, GROUND + 0.02 + i * 0.03); c.lineTo(0.47 + i * 0.045, GROUND + 0.02 + i * 0.03); c.stroke(); }
  // reeds on the far right
  c.strokeStyle = s.tone(0.14); c.lineWidth = 0.004;
  for (let i = 0; i < 9; i++) {
    const x = 1.2 + i * 0.026, h = 0.14 + hash(i, 3) * 0.12, sw = Math.sin(t * 1.1 + i) * 0.012;
    c.beginPath(); c.moveTo(x, 1.02); c.quadraticCurveTo(x + sw * 0.4, 1.02 - h * 0.6, x + sw, 1.02 - h); c.stroke();
    if (i % 3 === 0) { c.fillStyle = s.tone(0.14); c.beginPath(); c.ellipse(x + sw, 1.02 - h - 0.012, 0.005, 0.016, 0, 0, TAU); c.fill(); }
  }
  // lotus leaves and two flowers
  for (const [x, y, w] of [[0.74, 0.8, 0.07], [0.96, 0.87, 0.09], [1.12, 0.76, 0.05], [0.66, 0.93, 0.08], [1.24, 0.9, 0.07]]) {
    c.fillStyle = s.tone(0.16);
    c.beginPath(); c.ellipse(x, y, w, w * 0.24, 0, 0.15, TAU - 0.15); c.lineTo(x, y); c.closePath(); c.fill();
  }
  for (const [x, y, h] of [[0.98, 0.85, 0.07], [0.71, 0.78, 0.05]]) {
    c.strokeStyle = s.tone(0.16); c.lineWidth = 0.003; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 0.004, y - h * 0.6); c.stroke();
    c.fillStyle = css(mixRGB([226, 128, 160], s.screen, 0.25));
    for (let i = -2; i <= 2; i++) { c.save(); c.translate(x + 0.004, y - h * 0.6); c.rotate(i * 0.42); c.beginPath(); c.ellipse(0, -h * 0.28, h * 0.11, h * 0.3, 0, 0, TAU); c.fill(); c.restore(); }
  }
}

/** The wave's leading edge: the circle of radius R about the touched knot, drawn on the net in perspective as a ring of light. */
function front(s: Stage, cn: Canopy, R: number, k: number) {
  if (R <= 0.02 || R > 3.4) return;
  const c = s.c, fade = k * (1 - seg(R, 2.4, 3.4));
  const runs: P[][] = [[]];
  for (let i = 0; i <= 120; i++) {
    const a = (i / 120) * TAU, Z = K3.Z + Math.sin(a) * R;
    if (Z < cn.z0) { if (runs[runs.length - 1].length) runs.push([]); continue; }
    runs[runs.length - 1].push(onSky(cn, K3.X + Math.cos(a) * R, Z));
  }
  c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
  for (const [w, col] of [[0.024, css(GOLD, 0.16 * fade)], [0.01, css(mixRGB(GOLD, WHITE, 0.3), 0.35 * fade)], [0.0028, css(mixRGB(GOLD, WHITE, 0.6), 0.9 * fade)]] as [number, string][]) {
    c.strokeStyle = col; c.lineWidth = w;
    for (const run of runs) { if (run.length < 2) continue; c.beginPath(); run.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.stroke(); }
  }
  c.restore();
}

/** III. One touch: a monk touches one jewel of the dark net; it rings, and a wave of light runs out through all of it and its reflection. */
const oneTouch: SceneFn = (s) => {
  const { t, c, clock } = s;
  const back = ease(seg(t, 1.6, 3.8));
  s.cam(lerp(0.43, s.W / 2, back), 0.5, lerp(2.6, 1, back));
  s.backdrop({ mood: 'night', x: 0.6, y: 0.3, r: 1.5 });
  const px = pxOf(s);
  // the wave: from the touched knot outwards across the net, a ring of light that lifts the threads as it passes
  const x = Math.max(0, t - 1.9), R = 0.3 * x + 0.035 * x * x;
  const dist = (X: number, Z: number) => Math.hypot(X - K3.X, Z - K3.Z);
  const bump = (X: number, Z: number) => (t < 1.9 ? 0 : Math.exp(-(((R - dist(X, Z)) / 0.12) ** 2)));
  const lift = (X: number, Z: number) => 0.016 * bump(X, Z) * Math.cos((R - dist(X, Z)) * 22);
  const jewel = (k: Knot): Look => {
    const d = dist(k.X, k.Z), passed = clamp01((R - d) / 0.25), h = hash(k.n * 13 + k.m, 6);
    const shimmer = 0.55 + 0.45 * Math.sin(clock * (1.6 + 2.4 * h) + h * 20);
    return { size: 1, lit: 0.85 * passed * shimmer, flash: bump(k.X, k.Z) };
  };
  drawCanopy(s, NET3, { lift, jewel, shine: bump });
  front(s, NET3, R, 1);
  haze(s, NET3.hy, seg(R, 1.6, 2.8), [190, 210, 255]);
  // the far shore: low hills, palms and a stupa
  c.fillStyle = s.tone(0.32);
  hills(c, -0.4, s.W + 0.4, NET3.hy + 0.004, 0.018, 3, NET3.hy + 0.02);
  palm(c, 0.2, NET3.hy + 0.01, 0.08, clock); palm(c, 0.27, NET3.hy + 0.01, 0.065, clock + 1); palm(c, 1.3, NET3.hy + 0.01, 0.07, clock + 2);
  c.beginPath(); c.ellipse(1.12, NET3.hy + 0.004, 0.035, 0.03, 0, Math.PI, 0); c.fill();
  c.fillRect(1.117, NET3.hy - 0.06, 0.006, 0.04);
  for (let i = 0; i < 3; i++) c.fillRect(1.108 + i * 0.003, NET3.hy - 0.035 - i * 0.008, 0.024 - i * 0.006, 0.004);
  // the pool, and the net again in it
  const water = NET3.hy + 0.02;
  const wg = c.createLinearGradient(0, water, 0, 1.05);
  wg.addColorStop(0, css(mixRGB(s.screen, [20, 26, 50], 0.22))); wg.addColorStop(1, css(mixRGB(s.screen, [10, 12, 26], 0.6)));
  c.fillStyle = wg; c.fillRect(-0.4, water, s.W + 0.8, 0.8);
  c.save(); c.beginPath(); c.rect(-0.4, water, s.W + 0.8, 0.8); c.clip();
  drawCanopy(s, MIRROR3, { lift, jewel, shine: bump, alpha: 0.32, wobble: s.still ? 0 : 0.003 });
  front(s, MIRROR3, R, 0.45);
  c.restore();
  ghat(s);
  // the touched jewel on its long cord
  const touch = 1.25;
  const sway = t > touch ? Math.sin((t - touch) * 9) * 0.006 * Math.exp(-(t - touch) * 0.9) : 0;
  const knot = onSky(NET3, K3.X, K3.Z, lift(K3.X, K3.Z));
  const jx = JT[0] + sway, jy = JT[1];
  c.strokeStyle = s.tone(0.2); c.lineWidth = 0.0028;
  c.beginPath(); c.moveTo(knot[0], knot[1]); c.quadraticCurveTo(lerp(knot[0], jx, 0.5) + sway * 2, lerp(knot[1], jy, 0.5), jx, jy - 0.02); c.stroke();
  const hit = seg(t, touch, touch + 0.12) * Math.exp(-Math.max(0, t - touch) * 1.2);
  if (t > touch) glow(c, jx, jy, 0.06, [220, 232, 255], 0.5 + 0.2 * Math.sin(clock * 3));
  gem(c, jx, jy, 0.018, CRYSTAL, t > touch ? 1 : 0.05, s.tone(0.12), px, hit);
  // the ring travels up the cord to the net
  const up = seg(t, touch + 0.05, 1.9);
  if (up > 0 && up < 1) glow(c, lerp(jx, knot[0], up), lerp(jy, knot[1], up), 0.035, GOLD, 1);
  // the monk: reaches up, one fingertip to the jewel; then watches the light go, and opens his arms
  const reach = ease(seg(t, 0.1, touch)), withdraw = ease(seg(t, touch + 0.3, 2.4)), wonder = ease(seg(t, 7.6, 8.8));
  const fx = lerp(lerp(jx - 0.075, jx - 0.019, reach), jx - 0.06, withdraw), fy = lerp(lerp(jy + 0.08, jy + 0.012, reach), jy + 0.05, withdraw);
  c.fillStyle = s.ink; c.strokeStyle = s.ink;
  const m = person(c, monk(s, {
    x: 0.36, h: 0.36, face: 1, lean: 5 * (1 - wonder), tilt: lerp(-8, -22, withdraw) + 14 * wonder, hold2: 'staff',
    reach: [lerp(fx, 0.44, wonder), lerp(fy, 0.42, wonder)], reach2: wonder > 0 ? [lerp(0.33, 0.28, wonder), lerp(0.66, 0.43, wonder)] : null, arm2: [-10, 22],
    eye: wonder > 0.3 ? 'wide' : 'open', mouth: 0.4 * wonder,
  }));
  // a fingertip
  if (wonder < 0.5) {
    const a = Math.atan2(jy - m.hand[1], jx - m.hand[0]);
    c.lineWidth = 0.0035; c.beginPath(); c.moveTo(m.hand[0], m.hand[1]); c.lineTo(m.hand[0] + Math.cos(a) * 0.011, m.hand[1] + Math.sin(a) * 0.011); c.stroke();
  }
  // the chime
  for (let i = 0; i < 3; i++) ripple(c, jx, jy, 0.12, seg(t, touch + i * 0.22, touch + 1.1 + i * 0.22), css(mixRGB(GOLD, WHITE, 0.3)), 1);
  if (t > touch && t < touch + 0.8) sparks(c, jx, jy, 0.04, clock, s.still ? 0 : 8, [255, 236, 180]);
  s.spill(jx, jy, 0.2 + 0.5 * seg(R, 0, 2), [200, 214, 255]);
};

/* ================================================================ IV. the map */
/** a small corner of the net: the concepts, around a ring, joined as the site's map joins them */
const IDEAS = ['AI', 'Mind', 'Consciousness', 'Agency', 'Knowledge', 'Trust', 'Ethics', 'Responsibility', 'Technology'];
const RING_C: P = [0.78, 0.44];
const RX = 0.4, RY = 0.26;
const RING: P[] = IDEAS.map((_, i) => { const a = ((-170 + i * 40) * Math.PI) / 180; return [RING_C[0] + Math.cos(a) * RX, RING_C[1] + Math.sin(a) * RY]; });
const IDEA_TINT: RGB[] = [[86, 140, 236], [164, 106, 230], [234, 92, 124], [52, 180, 136], [246, 186, 70], [80, 170, 200], [226, 120, 70], [200, 90, 160], [120, 150, 110]];
/** every link between the nine, as the concept pages draw them: the ring, then the chords across it */
const LINKS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 0],
  [1, 3], [1, 8], [0, 3], [0, 4], [3, 7], [4, 6], [4, 7], [4, 8], [6, 8], [6, 2], [5, 8],
];
/** the face-on net the map comes out of, and the nine knots that become the ideas */
const MESH = { dx: 0.066, dy: 0.052 };
const SEEDS: P[] = (() => {
  const used = new Set<string>(), out: P[] = [];
  for (const p of RING) {
    const tx = (p[0] - RING_C[0]) * 0.42, ty = (p[1] - RING_C[1]) * 0.42;
    let best: P = [0, 0], bd = Infinity;
    for (let a = -8; a <= 8; a++) for (let b = -8; b <= 8; b++) {
      if ((a - b) % 2 || used.has(`${a},${b}`)) continue;
      const d = Math.hypot(a * MESH.dx - tx, b * MESH.dy - ty);
      if (d < bd) { bd = d; best = [a, b]; }
    }
    used.add(`${best[0]},${best[1]}`);
    out.push(best);
  }
  return out;
})();
/** hops from each idea to every other, for the pulses */
const HOPS: number[][] = IDEAS.map((_, src) => {
  const d = IDEAS.map(() => Infinity); d[src] = 0;
  for (let r = 0; r < 9; r++) for (const [a, b] of LINKS) { d[b] = Math.min(d[b], d[a] + 1); d[a] = Math.min(d[a], d[b] + 1); }
  return d;
});
const WAVES = [{ at: 5.4, from: 8 }, { at: 7.0, from: 2 }, { at: 8.5, from: 5 }];
const HOP = 0.6;

/** A small label under or over an idea, on a halo of paper so the threads don't cross it. */
function label(s: Stage, x: number, y: number, text: string, k: number) {
  if (k <= 0.01) return;
  const c = s.c, size = s.small ? 0.044 : 0.034;
  c.save();
  c.globalAlpha = k;
  c.font = s.font(size, 'sans', '600');
  c.textAlign = 'center'; c.textBaseline = 'middle';
  c.lineWidth = size * 0.35; c.lineJoin = 'round'; c.strokeStyle = css(s.screen, 0.9);
  c.strokeText(text, x, y + (1 - k) * 0.01);
  c.fillStyle = s.tone(0.12);
  c.fillText(text, x, y + (1 - k) * 0.01);
  c.restore();
}

/** IV. The map: the monk, sitting under the net, thinks; a corner of it becomes a ring of ideas, and a touch to any runs through all. */
const theMap: SceneFn = (s) => {
  const { t, c, clock } = s;
  const spread = ease(seg(t, 1.3, 4.2));
  s.cam(s.W / 2 + 0.02, 0.47, 1 + 0.04 * ease(seg(t, 3, 10)));
  s.backdrop({ mood: 'paper', to: 'gold', k: 0.35 * ease(seg(t, 5, 10)), x: RING_C[0], y: RING_C[1], r: 1.4 });
  const px = pxOf(s);
  const ink: RGB = s.dark ? [14, 13, 16] : [27, 26, 31];
  // how bright each idea is now: a pulse arrives at it, wave after wave
  const flashOf = (i: number) => WAVES.reduce((f, w) => f + Math.exp(-(((t - w.at - HOPS[w.from][i] * HOP) / 0.16) ** 2)), 0);
  // the net, face on; it opens out about the chosen corner as if we were drawing close, and fades
  const zoom = lerp(1, 2.4, spread), fade = 1 - ease(seg(t, 1.6, 3.6));
  const spot = ease(seg(t, 0.3, 1.2)) * fade;
  if (fade > 0.01) {
    const [x0, y0, x1, y1] = s.view();
    const dx = MESH.dx * zoom, dy = MESH.dy * zoom;
    const a0 = Math.floor((x0 - RING_C[0]) / dx) - 1, a1 = Math.ceil((x1 - RING_C[0]) / dx) + 1;
    const b0 = Math.floor((y0 - RING_C[1]) / dy) - 1, b1 = Math.ceil((y1 - RING_C[1]) / dy) + 1;
    const at = (a: number, b: number): P => [RING_C[0] + a * dx, RING_C[1] + b * dy + Math.sin(clock * 0.8 + a * 0.5) * 0.002];
    c.save(); c.globalAlpha = fade;
    const path = new Path2D();
    for (let b = b0; b <= b1; b++) for (let a = a0; a <= a1; a++) {
      if ((a - b) % 2) continue;
      const p = at(a, b);
      for (const da of [-1, 1]) { const q = at(a + da, b + 1); path.moveTo(p[0], p[1]); path.lineTo(q[0], q[1]); }
    }
    c.strokeStyle = s.tone(0.45); c.lineWidth = 0.0016 * Math.sqrt(zoom); c.stroke(path);
    glow(c, RING_C[0], RING_C[1], 0.3, [255, 236, 190], spot * 0.8);
    for (let b = b0; b <= b1; b++) for (let a = a0; a <= a1; a++) {
      if ((a - b) % 2 || SEEDS.some((sd) => sd[0] === a && sd[1] === b)) continue;
      const p = at(a, b), inSpot = Math.hypot(p[0] - RING_C[0], p[1] - RING_C[1]) < 0.2 * zoom;
      gem(c, p[0], p[1], 0.009 * Math.sqrt(zoom), tintAt(a, b), inSpot ? 0.6 : 0.5 - 0.35 * spot, s.tone(0.3), px);
    }
    c.restore();
  }
  // the monk sits beneath and looks up; his thought rises to the ring
  c.fillStyle = s.tone(0.18); c.beginPath(); c.ellipse(0.22, GROUND + 0.012, 0.13, 0.018, 0, 0, TAU); c.fill();
  c.fillStyle = s.ink; c.strokeStyle = s.ink;
  const calm = ease(seg(t, 4.5, 5.5));
  const m = person(c, monk(s, { x: 0.2, y: GROUND, h: 0.36, face: 1, ...SIT, reach: [0.262, GROUND - 0.105], reach2: [0.255, GROUND - 0.1], tilt: lerp(-20, -6, calm), eye: calm > 0.5 ? 'closed' : 'open' }));
  const think = ease(seg(t, 2.4, 3.4));
  for (let i = 0; i < 3; i++) {
    const k = clamp01(think * 3 - i);
    if (k <= 0) continue;
    const v = 0.25 + i * 0.25, bx = lerp(m.head[0] + 0.04, RING[8][0] - 0.03, v), by = lerp(m.head[1] - 0.05, RING[8][1] + 0.05, v);
    c.save(); c.globalAlpha = k;
    c.fillStyle = 'rgba(255,252,246,0.97)'; c.strokeStyle = s.ink; c.lineWidth = 0.003;
    c.beginPath(); c.arc(bx, by, 0.007 + i * 0.004, 0, TAU); c.fill(); c.stroke();
    c.restore();
  }
  // the ideas: each chosen jewel leaves its knot for its place on the map
  const pos = RING.map((p, i): P => {
    const k = ease(seg(t, 1.3 + i * 0.1, 3.8 + i * 0.1));
    const sx = RING_C[0] + SEEDS[i][0] * MESH.dx * zoom, sy = RING_C[1] + SEEDS[i][1] * MESH.dy * zoom;
    return [lerp(sx, p[0], k), lerp(sy, p[1], k)];
  });
  const grown = RING.map((_, i) => ease(seg(t, 1.6 + i * 0.1, 4 + i * 0.1)));
  // the threads of the map, drawn in one after another, with pulses running along them
  LINKS.forEach(([a, b], li) => {
    const k = ease(seg(t, 2.6 + li * 0.1, 3.4 + li * 0.1));
    if (k <= 0) return;
    const chord = li >= 9;
    thread(c, [pos[a], pos[b]], k, mixRGB(ink, s.screen, chord ? 0.5 : 0.3), chord ? 0.0022 : 0.0034, { curve: chord ? 0.08 : 0.04, bead: true });
    for (const w of WAVES) {
      const ha = HOPS[w.from][a], hb = HOPS[w.from][b];
      if (ha === hb) continue;
      const v = seg(t, w.at + Math.min(ha, hb) * HOP, w.at + Math.max(ha, hb) * HOP);
      if (v <= 0 || v >= 1) continue;
      // along the same bowed path the thread takes, from a towards b or back
      const p = pos[a], q = pos[b];
      const d = Math.hypot(q[0] - p[0], q[1] - p[1]), bow = (chord ? 0.08 : 0.04) * d;
      const mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2 - bow;
      const w2 = ha < hb ? v : 1 - v;
      const bx = (1 - w2) * (1 - w2) * p[0] + 2 * (1 - w2) * w2 * mx + w2 * w2 * q[0], by = (1 - w2) * (1 - w2) * p[1] + 2 * (1 - w2) * w2 * my + w2 * w2 * q[1];
      glow(c, bx, by, 0.028, GOLD, 1);
      c.fillStyle = css(mixRGB(GOLD, WHITE, 0.6)); c.beginPath(); c.arc(bx, by, 0.005, 0, TAU); c.fill();
    }
  });
  // the jewels: each holds the whole map in small, and its own place in it lit when any of them is
  RING.forEach((_, i) => {
    const g = grown[i], p = pos[i], fl = Math.min(1.2, flashOf(i));
    const r = lerp(0.009, 0.046, g);
    if (fl > 0.05) glow(c, p[0], p[1], r * 2.4, mixRGB(IDEA_TINT[i], GOLD, 0.5), 0.8 * fl);
    gem(c, p[0], p[1], r, IDEA_TINT[i], 0.75 + 0.25 * Math.sin(clock * 1.4 + i), s.tone(0.12), px, 0.4 * fl);
    if (g > 0.6) {
      // inside: the other eight, where they stand on the map, each lit as it is lit
      const k = seg(g, 0.6, 1), rr = r * 0.62;
      c.save(); c.globalAlpha = k;
      c.strokeStyle = css(DEEP, 0.4); c.lineWidth = r * 0.04;
      c.beginPath(); c.ellipse(p[0], p[1] + r * 0.05, rr, rr * 0.66, 0, 0, TAU); c.stroke();
      RING.forEach((q, j) => {
        if (j === i) return;
        const mx = p[0] + ((q[0] - RING_C[0]) / RX) * rr, my = p[1] + r * 0.05 + ((q[1] - RING_C[1]) / RY) * rr * 0.66;
        const f = Math.min(1, flashOf(j));
        c.fillStyle = css(mixRGB(mixRGB(IDEA_TINT[j], DEEP, 0.3), WHITE, 0.7 * f));
        c.beginPath(); c.arc(mx, my, r * (0.11 + 0.07 * f), 0, TAU); c.fill();
      });
      c.restore();
    }
    // the name
    const above = RING[i][1] < RING_C[1];
    label(s, p[0], p[1] + (above ? -1 : 1) * (r + 0.032), IDEAS[i], ease(seg(t, 3.2 + i * 0.16, 3.9 + i * 0.16)));
  });
  s.spill(RING_C[0], RING_C[1], 0.25 + 0.25 * ease(seg(t, 5, 8)), [255, 220, 150]);
};

export const indra: StoryVisuals = {
  id: 'indra',
  aspect: 1.4,
  loop: false,
  scenes: [theNet, theJewel, oneTouch, theMap],
  stills: [9.6, 7.2, 5.2, 8.6],
};
