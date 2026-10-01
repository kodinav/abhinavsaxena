import { wallText } from '@/data/stories';
import { seg, ease, easeOut, lerp, noise, css, mixRGB, type RGB, type Stage, type SceneFn, type StoryVisuals } from '../puppet/theatre';
import { person, walk, gesture, SIT, KNEEL, type Body } from '../puppet/figure';
import { fire, glow, sound, sun, softly, sparks } from '../puppet/fx';
import { bubble, shown, SUN, DOTS, LINES, Q } from '../puppet/bubbles';
import { chain, hills, tree, cypress } from '../puppet/scenery';
import { put, amphora, horse, kouros, owl, type Thing } from '../puppet/objects';
import { thread, word } from '../puppet/marks';

/**
 * "The voice from the wall": Plato's cave, then the paper's turn — a chain of
 * telling that carries warrant back to someone who saw, and a new wall that
 * speaks with nobody behind it.
 *
 * Two sets. The cave in section (the wall on the left, the prisoners facing
 * it, the low wall and its bearer, the fire, the way up to the daylight), and
 * the prisoners' own view: their backs, and the lit wall with its shadows.
 */
type C = CanvasRenderingContext2D;
type P = [number, number];
const GOLD: RGB = [240, 176, 70];
/** a deeper gold, for letters that must read on a pale screen */
const AMBER: RGB = [186, 118, 28];

const poly = (c: C, pts: P[]) => { c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); };
/** a polygon whose edges are broken up like rock */
function rag(c: C, pts: P[], amp: number, seed: number) {
  c.beginPath();
  let k = 0;
  pts.forEach((p, i) => {
    const q = pts[(i + 1) % pts.length];
    const n = Math.max(1, Math.round(Math.hypot(q[0] - p[0], q[1] - p[1]) / 0.03));
    for (let j = 0; j < n; j++, k++) {
      const v = j / n, x = p[0] + (q[0] - p[0]) * v, y = p[1] + (q[1] - p[1]) * v;
      const r = j === 0 ? 0 : noise(k * 0.9 + seed) * amp;
      if (i === 0 && j === 0) c.moveTo(x, y); else c.lineTo(x + r * 0.6, y + r);
    }
  });
  c.closePath(); c.fill();
}

/* ================================================================ set A: the cave in section */
const FLOOR = 0.86;
const PX = [0.36, 0.46, 0.56];
const PH = 0.3;
const FIRE: P = [1.0, FLOOR - 0.03];
const PAR = { x0: 0.66, x1: 0.72, top: 0.71 };
const LEDGE = 0.81, BX = 0.82;
const WALLQ: P[] = [[0.02, 0.05], [0.24, 0.15], [0.24, FLOOR], [0.02, 0.95]];
const WALL_X = 0.13;

interface Side {
  flame?: number; thing?: Thing | null; lift?: number; mouth?: number; beam?: number; shade?: number; day?: number;
  /** extra pose for prisoner i, or null to leave them for the scene to draw */
  pris?: (i: number, at: Body) => Partial<Body> | null;
  bearer?: boolean;
}
interface SideOut { necks: P[]; heads: P[]; mouths: P[]; shadow: { x: number; y: number; h: number } | null; bearerMouth: P | null }

function side(s: Stage, o: Side): SideOut {
  const { c, clock } = s;
  const flick = s.still ? 1 : 0.86 + 0.14 * noise(clock * 3.3);
  const flame = o.flame ?? 1;
  s.backdrop({ mood: 'cave', x: FIRE[0] - 0.08, y: FIRE[1] - 0.18, r: 1.2, bright: Math.min(1, 0.5 + 0.5 * flick * Math.min(1.2, flame)) });
  // daylight far up the slope
  glow(c, 1.3, 0.12, 0.5, [255, 240, 205], o.day ?? 0.55);
  // the wall the prisoners face, lit by the fire
  c.fillStyle = css(mixRGB(s.screen, [255, 244, 222], 0.35 * flick));
  poly(c, WALLQ); c.fill();
  const out: SideOut = { necks: [], heads: [], mouths: [], shadow: null, bearerMouth: null };

  // the carried figure and its shadow: from the flame, through the figure, onto the wall
  const lift = o.lift ?? 1, thing = o.thing ?? null;
  const objH = 0.09, objX = PAR.x0 + 0.02, objBase = PAR.top + 0.05 - lift * 0.14;
  if (thing && lift > 0.02) {
    const F: P = [FIRE[0], FIRE[1] - 0.1], O: P = [objX, objBase - objH / 2];
    const k = (WALL_X - F[0]) / (O[0] - F[0]);
    const sy = F[1] + (O[1] - F[1]) * k, sh = objH * k * 0.95;
    out.shadow = { x: WALL_X, y: sy, h: sh };
    const beam = (o.beam ?? 0) * lift;
    if (beam > 0.01) {
      const g = c.createLinearGradient(F[0], F[1], WALL_X, sy);
      g.addColorStop(0, `rgba(255,214,150,${0.32 * beam})`); g.addColorStop(1, `rgba(255,214,150,${0.08 * beam})`);
      c.fillStyle = g; c.beginPath(); c.moveTo(F[0], F[1]); c.lineTo(WALL_X, sy - sh * 0.62); c.lineTo(WALL_X, sy + sh * 0.62); c.closePath(); c.fill();
    }
    const shade = (o.shade ?? 1) * Math.min(1, lift * 1.5);
    if (shade > 0.01) {
      c.save(); poly(c, WALLQ); c.clip();
      softly(c, 0.01, css(mixRGB([20, 16, 14], s.screen, 0.22), 0.92 * shade), () => put(c, thing, WALL_X, sy + sh / 2, sh, thing === horse ? false : true));
      c.restore();
    }
  }

  // rock: the roof, the floor, the way up to the light
  c.fillStyle = s.tone(0.06);
  rag(c, [[-0.4, -0.4], [1.7, -0.4], [1.7, -0.02], [1.32, 0.02], [1.08, 0.09], [0.8, 0.1], [0.52, 0.06], [0.3, 0.1], [0.12, 0.03], [-0.4, 0.04]], 0.03, 3);
  rag(c, [[-0.4, FLOOR], [0.98, FLOOR], [1.08, FLOOR - 0.02], [1.14, 0.74], [1.2, 0.64], [1.26, 0.52], [1.34, 0.42], [1.7, 0.4], [1.7, 1.6], [-0.4, 1.6]], 0.02, 7);
  c.fillRect(-0.4, -0.4, 0.42, 2);
  // the low wall and the raised way behind it
  c.fillStyle = s.tone(0.1);
  c.fillRect(PAR.x0, PAR.top, PAR.x1 - PAR.x0, FLOOR - PAR.top);
  c.fillRect(PAR.x1, LEDGE, 0.2, FLOOR - LEDGE);
  // the hearth and the fire
  c.fillStyle = s.tone(0.04);
  c.beginPath(); c.ellipse(FIRE[0], FIRE[1] + 0.03, 0.09, 0.03, 0, 0, Math.PI * 2); c.fill();
  fire(c, FIRE[0], FIRE[1], 0.15 * flame, clock, { logs: s.tone(0.04), sparks: s.still ? 0 : 12, glowK: 0.5 });
  s.spill(FIRE[0], FIRE[1] - 0.1, 0.7 * Math.min(1, flame), [255, 170, 90]);

  // the bearer, stooped behind the low wall, lifting the figure over it
  const cut = s.tone(0.8);
  c.fillStyle = s.ink; c.strokeStyle = s.ink;
  if (o.bearer !== false) {
    const hands: P = [objX + 0.012, objBase + 0.004];
    const j = person(c, { x: BX, y: LEDGE, h: 0.3, face: -1, lean: 16 + 10 * (1 - lift), robe: 'short', beard: true, reach: hands, reach2: [hands[0] + 0.02, hands[1] + 0.006], mouth: o.mouth ?? 0, cut, t: clock });
    out.bearerMouth = j.mouth;
    if (thing && lift > 0.02) { c.fillStyle = s.ink; put(c, thing, objX, objBase, objH, thing !== horse); }
  }

  // the prisoners, chained, facing the wall
  const stakeTop: P = [0.29, FLOOR - 0.09];
  c.fillStyle = s.ink; c.fillRect(stakeTop[0] - 0.006, stakeTop[1], 0.012, FLOOR - stakeTop[1]);
  PX.forEach((x, i) => {
    const base: Body = { x, y: FLOOR, h: PH, face: -1, ...SIT, ...gesture('cross'), robe: 'short', beard: i !== 1, hair: i === 1 ? 'curls' : null, tilt: -8, cut, t: clock + i };
    const extra = o.pris ? o.pris(i, base) : {};
    if (extra === null) { out.necks.push([x, FLOOR - PH * 0.6]); out.heads.push([x, FLOOR - PH * 0.66]); out.mouths.push([x - 0.02, FLOOR - PH * 0.62]); return; }
    c.fillStyle = s.ink; c.strokeStyle = s.ink;
    const j = person(c, { ...base, ...extra });
    out.necks.push(j.neck); out.heads.push(j.head); out.mouths.push(j.mouth);
  });
  c.strokeStyle = s.tone(0.45);
  chain(c, stakeTop, out.necks[0], 0.014, 0.02);
  for (let i = 0; i < out.necks.length - 1; i++) chain(c, out.necks[i], out.necks[i + 1], 0.014, 0.03);
  return out;
}

/* ================================================================ set B: what the prisoners see */
const HX = [0.14, 0.44, 0.78, 1.1];
const HB = 1.04, HH = 0.36;

interface Back { turn?: number; arm?: P | null; slump?: number; tilt?: number }
/** A prisoner from behind: back, shoulders, neck and head; perhaps an arm raised to point. */
function backOf(c: C, x: number, o: Back) {
  const h = HH, y = HB, sl = o.slump ?? 0;
  const tx = (o.turn ?? 0) * h * 0.06;
  const hy = y - h * (0.8 - sl * 0.12);
  if (o.arm) {
    // a pointing arm: upper arm, forearm, a hand with one finger out
    const sg = o.arm[0] > x ? 1 : -1;
    const sh: P = [x + sg * h * 0.3, y - h * 0.48];
    const el: P = [lerp(sh[0], o.arm[0], 0.5) + sg * h * 0.05, lerp(sh[1], o.arm[1], 0.5) + h * 0.06];
    c.lineCap = 'round';
    c.lineWidth = h * 0.1; c.beginPath(); c.moveTo(sh[0], sh[1]); c.lineTo(el[0], el[1]); c.stroke();
    c.lineWidth = h * 0.075; c.beginPath(); c.moveTo(el[0], el[1]); c.lineTo(o.arm[0], o.arm[1]); c.stroke();
    const a = Math.atan2(o.arm[1] - el[1], o.arm[0] - el[0]);
    c.beginPath(); c.ellipse(o.arm[0], o.arm[1], h * 0.05, h * 0.04, a, 0, Math.PI * 2); c.fill();
    c.lineWidth = h * 0.025; c.beginPath(); c.moveTo(o.arm[0], o.arm[1]); c.lineTo(o.arm[0] + Math.cos(a) * h * 0.09, o.arm[1] + Math.sin(a) * h * 0.09); c.stroke();
  }
  c.beginPath();
  c.moveTo(x - h * 0.4, y + 0.1);
  c.lineTo(x - h * 0.41, y - h * 0.34);
  c.quadraticCurveTo(x - h * 0.41, y - h * 0.48, x - h * 0.29, y - h * 0.5);
  c.quadraticCurveTo(x - h * 0.13, y - h * 0.53, x - h * 0.065, y - h * 0.63);
  c.lineTo(x + h * 0.065, y - h * 0.63);
  c.quadraticCurveTo(x + h * 0.13, y - h * 0.53, x + h * 0.29, y - h * 0.5);
  c.quadraticCurveTo(x + h * 0.41, y - h * 0.48, x + h * 0.41, y - h * 0.34);
  c.lineTo(x + h * 0.4, y + 0.1);
  c.closePath(); c.fill();
  c.fillRect(x - h * 0.06, y - h * 0.72, h * 0.12, h * 0.12);
  c.beginPath(); c.ellipse(x + tx, hy, h * 0.15, h * 0.18, (o.turn ?? 0) * 0.08, 0, Math.PI * 2); c.fill();
  for (const sgn of [-1, 1]) { c.beginPath(); c.ellipse(x + tx + sgn * h * 0.148, hy + h * 0.02, h * 0.028, h * 0.05, 0, 0, Math.PI * 2); c.fill(); }
  const turn = o.turn ?? 0;
  if (Math.abs(turn) > 0.45) {
    const sg = Math.sign(turn);
    c.beginPath(); c.moveTo(x + tx + sg * h * 0.13, hy - h * 0.03); c.lineTo(x + tx + sg * h * 0.2, hy + h * 0.03); c.lineTo(x + tx + sg * h * 0.13, hy + h * 0.06); c.fill();
  }
  return { head: [x + tx, hy] as P, neck: [x, y - h * 0.62] as P };
}

interface WallView { mood?: 'cave' | 'machine'; heat?: number; turn?: (i: number) => number; arm?: (i: number) => P | null; slump?: number; parapet?: number; heads?: number }
/** The lit wall and the backs of the prisoners. `shadows` paints on the wall before the prisoners are drawn. */
function wallView(s: Stage, o: WallView, shadows: () => void) {
  const { c, clock } = s;
  const flick = s.still ? 1 : 0.88 + 0.12 * noise(clock * 3.1);
  const heat = o.heat ?? 1;
  if (o.mood === 'machine') s.backdrop({ mood: 'machine', to: 'cave', k: 1 - heat, x: s.W / 2, y: 0.32, r: 0.95 });
  else s.backdrop({ mood: 'cave', x: s.W / 2 + 0.05, y: 1.1, r: 1.25, bright: 0.55 + 0.45 * flick });
  // the rock face: a few cracks and ledges
  c.strokeStyle = s.tone(0.62); c.lineWidth = 0.003;
  for (const [x0, y0, x1, y1, x2, y2] of [[0.1, 0.12, 0.2, 0.22, 0.18, 0.36], [0.9, 0.08, 0.98, 0.2, 1.1, 0.24], [0.5, 0.05, 0.56, 0.16, 0.52, 0.22], [1.05, 0.5, 1.12, 0.6, 1.2, 0.62]]) {
    c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.lineTo(x2, y2); c.stroke();
  }
  // the low wall's long shadow along the foot of the rock
  const par = o.parapet ?? 1;
  if (par > 0.01) softly(c, 0.03, css(mixRGB([20, 16, 14], s.screen, 0.28), 0.8 * par), () => { c.fillRect(-0.3, 0.8, s.W + 0.6, 0.4); });
  // the prisoners' own shadows: heads on the rock, just above
  const heads = o.heads ?? 1;
  if (heads > 0.01) softly(c, 0.03, css(mixRGB([20, 16, 14], s.screen, 0.3), 0.75 * heads), () => {
    HX.forEach((x, i) => {
      const tx = (o.turn?.(i) ?? 0) * 0.03;
      c.beginPath(); c.ellipse(s.W / 2 + (x - s.W / 2) * 1.15 + tx, 0.66 + (o.slump ?? 0) * 0.04, 0.075, 0.09, 0, 0, Math.PI * 2); c.fill();
      c.fillRect(s.W / 2 + (x - s.W / 2) * 1.15 - 0.14, 0.74, 0.28, 0.2);
    });
  });
  shadows();
  // the cave mouth's rock around the wall
  c.fillStyle = s.tone(0.06);
  rag(c, [[-0.3, -0.3], [s.W + 0.3, -0.3], [s.W + 0.3, 0.04], [s.W * 0.7, 0.07], [s.W * 0.35, 0.03], [-0.3, 0.06]], 0.03, 11);
  rag(c, [[-0.3, -0.3], [0.03, -0.3], [0.05, 0.4], [0.02, 0.8], [-0.3, 1.3]], 0.025, 13);
  rag(c, [[s.W + 0.3, -0.3], [s.W - 0.03, -0.3], [s.W - 0.05, 0.5], [s.W - 0.02, 0.9], [s.W + 0.3, 1.3]], 0.025, 17);
  // the prisoners
  c.fillStyle = s.ink; c.strokeStyle = s.ink;
  const out = HX.map((x, i) => backOf(c, x, { turn: o.turn?.(i), arm: o.arm?.(i) ?? null, slump: o.slump }));
  c.strokeStyle = s.tone(0.45);
  for (let i = 0; i < out.length - 1; i++) chain(c, out[i].neck, out[i + 1].neck, 0.022, 0.06);
  return out;
}

/** A hand that points from `from` towards `at`, an arm's length `len` away, raised as far as `k`. */
function reachTowards(from: P, at: P, len: number, k: number): P {
  const a = Math.atan2(at[1] - from[1], at[0] - from[0]);
  const rest = Math.PI / 2;
  const ang = rest + (a - rest) * k;
  return [from[0] + Math.cos(ang) * len * lerp(0.6, 1, k), from[1] + Math.sin(ang) * len * lerp(0.6, 1, k)];
}

/** A carried figure's shadow on the wall, and the shadow of the hand that holds it up. */
function carried(s: Stage, thing: Thing, x: number, y: number, h: number, k: number, flip = false) {
  if (k <= 0.01) return;
  const c = s.c;
  softly(c, 0.012, css(mixRGB([20, 16, 14], s.screen, 0.18), 0.92 * k), () => {
    put(c, thing, x, y, h, flip);
    c.lineWidth = 0.028; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x - 0.02, y); c.quadraticCurveTo(x - 0.03, y + 0.12, x - 0.05, 0.86); c.stroke();
    c.beginPath(); c.ellipse(x - 0.012, y + 0.006, 0.03, 0.02, 0.3, 0, Math.PI * 2); c.fill();
  });
}

/* ================================================================ the scenes */

/** I. The fire: close on the flames, then back, until the whole arrangement shows. */
const theFire: SceneFn = (s) => {
  const { t, c } = s;
  const k = ease(seg(t, 2.2, 7.6));
  s.cam(lerp(1.0, s.W / 2, k), lerp(0.76, 0.5, k), lerp(2.6, 1, k));
  const lift = ease(seg(t, 3.4, 5.4));
  const out = side(s, {
    thing: horse, lift, beam: seg(t, 4.6, 6) * (1 - 0.6 * seg(t, 8, 10)), shade: seg(t, 5, 6.6),
    pris: (i) => (i === 1 ? { tilt: -8 - 10 * ease(seg(t, 7.4, 8.4)) } : {}),
  });
  // a prisoner lifts a hand towards the shadow
  if (out.shadow && t > 7.8) {
    const a = ease(seg(t, 7.8, 8.8));
    c.fillStyle = s.ink;
    person(c, { x: PX[0], y: FLOOR, h: PH, face: -1, ...SIT, robe: 'short', beard: true, tilt: -14, reach: [lerp(PX[0] - 0.02, out.shadow.x + 0.12, a), lerp(FLOOR - 0.14, out.shadow.y + 0.16, a)], arm2: [30, 100], cut: s.tone(0.8), t: s.clock });
  }
};

/** II. The shadows: what the prisoners see — figures passing on the rock, and their own heads. */
const PARADE: { thing: Thing; at: number; h: number; flip?: boolean; y: number }[] = [
  { thing: amphora, at: 0, h: 0.2, y: 0.5 },
  { thing: horse, at: 3.2, h: 0.22, y: 0.52 },
  { thing: kouros, at: 6.6, h: 0.32, y: 0.55, flip: true },
  { thing: owl, at: 9.8, h: 0.2, y: 0.5 },
  { thing: amphora, at: 12.6, h: 0.18, y: 0.5 },
];
const paradeX = (t: number, at: number, W: number) => W + 0.25 - (t - at) * 0.155;
const theShadows: SceneFn = (s) => {
  const { t } = s;
  s.cam(s.W / 2 + 0.02 * Math.sin(t * 0.2), 0.5 - 0.01 * t / 16, 1 + 0.06 * ease(seg(t, 0, 16)));
  // where the newest shadow is, so heads can follow it
  const lead = PARADE.map((p) => paradeX(t, p.at, s.W)).filter((x) => x > 0.1 && x < s.W + 0.1);
  const focus = lead.length ? lead[lead.length - 1] : s.W / 2;
  const point = ease(seg(t, 5.6, 6.6)) * (1 - ease(seg(t, 10, 11)));
  const horseX = paradeX(t, PARADE[1].at, s.W);
  wallView(s, {
    turn: (i) => Math.max(-1, Math.min(1, (focus - HX[i]) * 2.2)),
    arm: (i) => (i === 1 && point > 0.02 ? reachTowards([HX[1] + 0.1, HB - HH * 0.48], [horseX + 0.02, 0.5], HH * 0.78, point) : null),
  }, () => {
    PARADE.forEach((p) => {
      const x = paradeX(t, p.at, s.W);
      if (x < -0.4 || x > s.W + 0.4) return;
      const bob = Math.abs(Math.sin((t - p.at) * 3.1)) * 0.012;
      carried(s, p.thing, x, p.y - bob, p.h, 1, p.flip);
    });
    // the pointing arm throws its own shadow too, bigger on the rock
    if (point > 0.02) softly(s.c, 0.02, css(mixRGB([20, 16, 14], s.screen, 0.3), 0.7 * point), () => {
      const c = s.c; c.lineWidth = 0.045; c.lineCap = 'round';
      const from: P = [s.W / 2 + (HX[1] - s.W / 2) * 1.15 + 0.06, 0.74];
      const to = reachTowards(from, [horseX, 0.56], 0.3, point);
      c.beginPath(); c.moveTo(from[0], from[1]); c.lineTo(to[0], to[1]); c.stroke();
    });
  });
};

/** III. The echo: a bearer speaks; the rock gives the voice back, and it seems to come from the shadow. */
const theEcho: SceneFn = (s) => {
  const { t, c, clock } = s;
  // the camera follows the voice: bearer → wall → prisoners → everything
  const keys: [number, number, number, number][] = [[0, 0.8, 0.6, 1.9], [2.6, 0.8, 0.6, 1.9], [4.6, 0.26, 0.42, 1.55], [6.6, 0.36, 0.56, 1.45], [8.6, s.W / 2, 0.5, 1]];
  let cam = keys[0];
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1], b = keys[i];
    if (t >= a[0]) { const k = ease(seg(t, a[0], b[0])); cam = [0, lerp(a[1], b[1], k), lerp(a[2], b[2], k), lerp(a[3], b[3], k)]; }
  }
  s.cam(cam[1], cam[2], cam[3]);
  const talking = (t > 0.6 && t < 4.4) || (t > 8.8 && t < 10.6);
  const mouth = talking && !s.still ? 0.5 + 0.5 * Math.sin(clock * 16) : 0;
  const believe = ease(seg(t, 5.6, 6.6));
  const out = side(s, {
    thing: kouros, lift: 1, mouth, beam: 0.5, shade: 1,
    pris: (i) => (i === 1 ? { tilt: -16 * believe, reach: believe > 0.02 ? [lerp(PX[1] - 0.04, 0.22, believe), lerp(FLOOR - 0.14, 0.34, believe)] : null } : { tilt: -8 - 6 * believe }),
  });
  const ink = 'rgba(30,22,18,0.85)';
  if (out.bearerMouth) {
    // the voice travels to the rock …
    if (talking) sound(c, out.bearerMouth[0] - 0.01, out.bearerMouth[1], 0.08, clock, Math.PI, 1, ink);
    const go = seg(t, 1.2, 4.4);
    if (go > 0 && go < 1 && out.shadow) {
      const x = lerp(out.bearerMouth[0] - 0.08, WALL_X + 0.1, go), y = lerp(out.bearerMouth[1], out.shadow.y - out.shadow.h * 0.3, go);
      sound(c, x, y, 0.075, clock, Math.PI, 1 - go * 0.3, ink, 0.6);
    }
  }
  // … and comes back off it, as if the figure on the wall were speaking
  if (out.shadow) {
    const sh = out.shadow;
    const mouthOnWall: P = [WALL_X + sh.h * 0.06, sh.y - sh.h * 0.32];
    const back = seg(t, 4.2, 7);
    if (back > 0 && back < 1) sound(c, mouthOnWall[0] + 0.04 + back * 0.2, mouthOnWall[1] + back * 0.1, 0.075, clock, 0, 1 - back, ink, 0.6);
    const k = shown(t, 4.4, 10.8);
    bubble(c, { x: 0.37, y: 0.27, r: 0.06, to: mouthOnWall, k, ink: s.ink, icon: DOTS, scale: 0.5 });
    // what the prisoners believe: the shadow is the one who speaks
    const head = out.heads[2];
    bubble(c, { x: head[0] + 0.06, y: head[1] - 0.17, r: 0.07, kind: 'thought', to: head, k: shown(t, 6.6, 10.8), ink: s.ink, icon: (ic) => {
      ic.save(); ic.scale(0.016, 0.016); ic.translate(-26, -55); kouros.draw(ic); ic.restore();
      ic.lineWidth = 0.1; for (let r = 0; r < 2; r++) { ic.beginPath(); ic.arc(0.15, -0.55, 0.35 + r * 0.25, -0.6, 0.6); ic.stroke(); }
    } });
  }
};

/** IV. The turning: one is freed, stands, turns to the fire — and is blinded by it. */
const theTurning: SceneFn = (s) => {
  const { t, c, clock } = s;
  const glare = ease(seg(t, 3.6, 4.6));
  const shake = s.still ? 0 : glare * (1 - seg(t, 5.5, 8)) * 0.004 * Math.sin(clock * 47);
  s.cam(lerp(0.52, 0.62, glare) + shake, lerp(0.6, 0.58, glare), lerp(1.75, 1.55, glare));
  const rise = ease(seg(t, 1.2, 2.8)), turn = ease(seg(t, 2.8, 3.7));
  const out = side(s, { thing: null, bearer: false, flame: 1 + 0.6 * glare, day: 0.3, pris: (i) => (i === 2 ? null : {}) });
  // the broken chain
  const brk = seg(t, 0.5, 1.4);
  const neck2: P = [PX[2] + lerp(0, -0.005, rise), FLOOR - lerp(PH * 0.62, PH * 0.84, rise)];
  if (t > 0.5) sparks(c, lerp(out.necks[1][0], neck2[0], 0.5), lerp(out.necks[1][1], neck2[1], 0.5), 0.05, clock * 0.6 + brk, s.still ? 0 : 10, [255, 220, 150]);
  c.strokeStyle = s.tone(0.45);
  if (t < 0.6) chain(c, out.necks[1], neck2, 0.014, 0.03);
  else chain(c, out.necks[1], [lerp(out.necks[1][0], neck2[0], 0.45), out.necks[1][1] + 0.05 * brk], 0.014, 0.01);
  // he stands …
  const sitting: Partial<Body> = { ...SIT };
  const drop = lerp(SIT.drop!, 0, rise);
  const foot: P = [lerp(SIT.foot![0], 3, rise), 1], foot2: P = [lerp(SIT.foot2![0], -4, rise), 1];
  const stagger = glare * 0.03;
  const g = gesture('cross', 'shield', glare);
  // … and turns, a paper puppet flipped about its middle
  const flip = lerp(-1, 1, turn);
  c.save(); c.translate(PX[2] + stagger, 0); c.scale(Math.abs(flip) < 0.04 ? 0.04 : flip, 1); c.translate(-(PX[2] + stagger), 0);
  c.fillStyle = s.ink;
  person(c, { x: PX[2] + stagger, y: FLOOR, h: PH, face: 1, ...sitting, drop, foot, foot2, ...g, robe: 'short', beard: false, lean: -10 * glare, tilt: -10 * glare, eye: glare > 0.3 ? 'closed' : 'open', cut: s.tone(0.8), t: clock });
  c.restore();
  // the glare: a white burst and rays from the fire into his eyes
  if (glare > 0) {
    glow(c, FIRE[0], FIRE[1] - 0.1, 0.5 * glare, [255, 248, 225], 0.85 * glare * (0.85 + 0.15 * noise(clock * 6)));
    c.strokeStyle = `rgba(255,236,190,${0.55 * glare})`; c.lineWidth = 0.006;
    for (let i = 0; i < 7; i++) {
      const a = Math.PI + (i - 3) * 0.06 + noise(clock * 2 + i) * 0.02;
      c.beginPath(); c.moveTo(FIRE[0] - 0.02, FIRE[1] - 0.1); c.lineTo(FIRE[0] + Math.cos(a) * 0.5, FIRE[1] - 0.1 + Math.sin(a) * 0.5 - 0.04); c.stroke();
    }
  }
};

/** V. The sun: up the steep way, a dazzle of daylight, reflections in a pool, and at last the sun itself. */
const theSun: SceneFn = (s) => {
  const { t, c, clock } = s;
  if (t < 4.6) {
    // the climb, out of the dark towards a bright mouth
    const k = seg(t, 0, 4.4);
    const x = lerp(0.18, 1.02, k), y = lerp(0.9, 0.36, k);
    s.cam(lerp(0.42, 0.86, ease(k)), lerp(0.64, 0.38, ease(k)), 1.5);
    s.backdrop({ mood: 'cave', to: 'day', k: ease(k) * 0.8, x: 1.25, y: 0.1, r: 1.1 + k * 0.6 });
    glow(c, 1.26, 0.08, 0.35 + k * 0.4, [255, 246, 220], 0.6 + k * 0.4);
    c.fillStyle = s.tone(0.05);
    rag(c, [[-0.4, 1.1], [0.2, 0.92], [0.5, 0.78], [0.8, 0.6], [1.05, 0.4], [1.2, 0.32], [1.6, 0.3], [1.6, 1.6], [-0.4, 1.6]], 0.025, 21);
    rag(c, [[-0.4, -0.4], [1.6, -0.4], [1.6, -0.1], [1.2, -0.02], [0.9, 0.12], [0.6, 0.26], [0.3, 0.36], [-0.4, 0.4]], 0.03, 23);
    c.fillStyle = s.ink;
    person(c, { x, y: y + 0.02, h: 0.26, face: 1, ...walk(t * 0.9, 0.8), lean: 18, tilt: -10, robe: 'short', ...(k > 0.75 ? gesture('rest', 'shield', seg(k, 0.75, 0.95)) : {}), cut: s.tone(0.8), t: clock });
    s.spill(1.2, 0.1, 0.4 + k * 0.5, [255, 236, 200]);
    if (t > 4.1) { c.fillStyle = `rgba(255,252,240,${seg(t, 4.1, 4.6)})`; const [x0, y0, x1, y1] = s.view(); c.fillRect(x0, y0, x1 - x0, y1 - y0); }
    return;
  }
  // outside
  const up = ease(seg(t, 8, 11));
  s.cam(s.W / 2, 0.5 - 0.06 * up, 1 + 0.05 * up);
  s.backdrop({ mood: 'day', to: 'gold', k: up, x: 0.82, y: lerp(0.5, 0.2, up), r: 2.2 });
  sun(c, 0.82, lerp(0.62, 0.2, up), 0.06, clock, Math.min(1, 0.25 + up), up);
  s.spill(0.82, 0.2, 0.4 + 0.5 * up, [255, 226, 150]);
  c.fillStyle = s.tone(0.55); hills(c, -0.2, s.W + 0.2, 0.6, 0.08, 4, 1.2);
  c.fillStyle = s.tone(0.32); hills(c, -0.2, s.W + 0.2, 0.68, 0.05, 9, 1.2);
  c.fillStyle = s.tone(0.12);
  c.fillRect(-0.2, 0.74, s.W + 0.4, 0.5);
  // the pool, and what it shows
  const pool = { x0: 0.08, x1: 0.62, y: 0.76, d: 0.12 };
  c.fillStyle = css(mixRGB(s.screen, [200, 222, 236], 0.45));
  c.beginPath(); c.ellipse((pool.x0 + pool.x1) / 2, pool.y + pool.d / 2, (pool.x1 - pool.x0) / 2, pool.d / 2, 0, 0, Math.PI * 2); c.fill();
  const kneel = ease(seg(t, 5, 5.8)) * (1 - ease(seg(t, 8, 8.8)));
  const man = (cc: C, look: number) => person(cc, { x: 0.5, y: 0.75, h: 0.3, face: -1, ...KNEEL, drop: KNEEL.drop! * kneel, foot: [lerp(3, KNEEL.foot![0], kneel), 1], foot2: [lerp(-3, KNEEL.foot2![0], kneel), 1], tilt: look, ...(up > 0 ? gesture('rest', 'both', up) : gesture('rest', 'pointDown', kneel)), robe: 'short', cut: s.tone(0.8), t: clock, eye: 'open' });
  c.save();
  c.beginPath(); c.ellipse((pool.x0 + pool.x1) / 2, pool.y + pool.d / 2, (pool.x1 - pool.x0) / 2, pool.d / 2, 0, 0, Math.PI * 2); c.clip();
  c.globalAlpha = 0.4; c.fillStyle = s.ink;
  c.translate(0, 2 * 0.75); c.scale(1, -1);
  tree(c, 0.2, 0.75, 0.42, clock); man(c, 28 * kneel - 40 * up);
  c.restore();
  c.fillStyle = s.ink;
  tree(c, 0.2, 0.75, 0.42, clock);
  cypress(c, 1.08, 0.76, 0.34, clock);
  man(c, 28 * kneel - 40 * up);
  // the dazzle fading
  if (t < 5.4) { c.fillStyle = `rgba(255,252,240,${1 - seg(t, 4.6, 5.4)})`; const [x0, y0, x1, y1] = s.view(); c.fillRect(x0, y0, x1 - x0, y1 - y0); }
};

/** VI. The telling: back in the cave, A tells B, B tells C — and C's belief traces back to the sun. */
const theTelling: SceneFn = (s) => {
  const { t, c, clock } = s;
  s.cam(lerp(0.7, 0.62, ease(seg(t, 0, 5))), lerp(0.52, 0.5, ease(seg(t, 0, 5))), lerp(1.12, 1.02, ease(seg(t, 0, 5))));
  const turnB = ease(seg(t, 4.6, 5.2)) * (1 - ease(seg(t, 7.6, 8.2)));
  const speakA = shown(t, 5, 8.6), speakB = shown(t, 8.2, 11.4), thinkC = shown(t, 10.8, 15);
  const out = side(s, {
    thing: null, flame: 0.7, day: 1, bearer: false,
    pris: (i) => (i === 2 ? { face: turnB > 0.5 ? 1 : -1, tilt: -4, mouth: speakB > 0.3 && !s.still ? 0.4 + 0.4 * Math.sin(clock * 14) : 0 } : i === 1 ? { tilt: -4 } : {}),
  });
  // A comes down from the light and kneels beside the last in the row
  const walkK = seg(t, 0, 4.2);
  const ax = lerp(1.24, 0.69, walkK), ay = walkK < 0.42 ? lerp(0.52, FLOOR, seg(walkK, 0, 0.42)) : FLOOR;
  const kneel = ease(seg(t, 4.2, 4.9));
  c.fillStyle = s.ink;
  const A = person(c, {
    x: ax, y: ay, h: PH * 1.08, face: -1, ...(kneel < 1 ? walk(t * 0.85, 1 - kneel) : {}), drop: KNEEL.drop! * kneel,
    foot: kneel > 0 ? [lerp(3, KNEEL.foot![0], kneel), 1] : null, foot2: kneel > 0 ? [lerp(-3, KNEEL.foot2![0], kneel), 1] : null,
    ...(speakA > 0.2 ? gesture('rest', 'offer', speakA) : {}), mouth: speakA > 0.3 && !s.still ? 0.4 + 0.4 * Math.sin(clock * 14) : 0,
    robe: 'short', beard: true, cut: s.tone(0.8), t: clock,
  });
  const B = { head: out.heads[2], mouth: out.mouths[2] }, Cc = { head: out.heads[1] };
  bubble(c, { x: A.head[0] - 0.02, y: A.head[1] - 0.17, r: 0.06, to: A.mouth, k: speakA, ink: s.ink, icon: SUN });
  bubble(c, { x: B.head[0] - 0.06, y: B.head[1] - 0.18, r: 0.06, to: B.mouth, k: speakB, ink: s.ink, icon: SUN });
  bubble(c, { x: Cc.head[0] - 0.06, y: Cc.head[1] - 0.2, r: 0.065, kind: 'thought', to: Cc.head, k: thinkC, ink: s.ink, icon: SUN });
  word(s, A.head[0] + 0.045, A.head[1] - 0.07, 'A', seg(t, 4.8, 5.4), 0.05, css(AMBER), 'italic 600');
  word(s, B.head[0] + 0.045, B.head[1] - 0.08, 'B', seg(t, 8, 8.6), 0.05, css(AMBER), 'italic 600');
  word(s, Cc.head[0] + 0.045, Cc.head[1] - 0.08, 'C', seg(t, 10.6, 11.2), 0.05, css(AMBER), 'italic 600');
  // the warrant: from C, through B and A, out of the cave to what A saw
  const k = ease(seg(t, 11.4, 14.4));
  thread(c, [[Cc.head[0], Cc.head[1] - 0.04], [B.head[0], B.head[1] - 0.04], [A.head[0], A.head[1] - 0.04], [1.08, 0.36], [1.28, 0.1]], k, GOLD, 0.006);
  sun(c, 1.3, 0.08, 0.035, clock, seg(t, 13.6, 14.6), 0.6);
};

/* the new wall: lit from within, with nobody behind it */
function typed(s: Stage, lines: string[], t0: number, per: number, x: number, y: number, gap: number, size: number) {
  const c = s.c;
  c.save();
  c.font = s.font(size, 'mono'); c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillStyle = s.tone(0.28);
  lines.forEach((line, i) => {
    const k = seg(s.t, t0 + i * per, t0 + i * per + per * 0.8);
    if (k <= 0) return;
    const n = Math.round(line.length * k);
    const shown = line.slice(0, n);
    const caret = k < 1 && !s.still && Math.sin(s.clock * 12) > 0 ? '▍' : '';
    c.fillText(shown + caret, x, y + i * gap);
  });
  c.restore();
}

/** VII. The new wall: text without a speaker, passed along — and the thread back ends at the wall. */
const theNewWall: SceneFn = (s) => {
  const { t, c } = s;
  s.cam(s.W / 2, 0.52, 1.02);
  const heads = wallView(s, { mood: 'machine', parapet: 0, heads: 0, turn: (i) => (i === 0 ? -0.3 : i === 1 ? -0.6 : i === 2 ? -0.6 : 0) }, () => {
    typed(s, wallText.slice(0, 4), 0.4, 1.4, s.W / 2, 0.2, 0.075, 0.034);
  });
  const h = heads.map((p) => p.head);
  // the same words, passed along: from the wall to the first, the first to the second, the second to the third
  bubble(c, { x: h[0][0] + 0.1, y: 0.47, r: 0.055, to: [s.W / 2 - 0.14, 0.4], k: shown(t, 4.6, 13.6), ink: s.ink, icon: LINES });
  bubble(c, { x: h[1][0] + 0.02, y: h[1][1] - 0.22, r: 0.055, to: [h[0][0] + 0.07, h[0][1] - 0.06], k: shown(t, 6.6, 13.6), ink: s.ink, icon: LINES });
  bubble(c, { x: h[2][0] + 0.02, y: h[2][1] - 0.22, r: 0.055, to: [h[1][0] + 0.07, h[1][1] - 0.06], k: shown(t, 8.6, 13.6), ink: s.ink, icon: LINES });
  // try to trace it back: prisoner to prisoner to the wall … and then nothing
  const k = ease(seg(t, 10, 12.6));
  thread(c, [[h[2][0], h[2][1] - 0.1], [h[1][0], h[1][1] - 0.1], [h[0][0], h[0][1] - 0.1], [s.W / 2, 0.36]], k, [70, 80, 100], 0.008, { dash: [0.018, 0.012], bead: true });
  const end = seg(t, 12.4, 13.2);
  if (end > 0) {
    c.save(); c.globalAlpha = end; c.fillStyle = s.ink;
    c.translate(s.W / 2, 0.29); c.scale(0.075, 0.075); Q(c); c.restore();
  }
};

/** VIII. Coda: the more the wall is used, the worse; then someone describes it truly, and the light changes. */
const theCoda: SceneFn = (s) => {
  const { t, c, clock } = s;
  const heavy = ease(seg(t, 0, 4.5)) * (1 - ease(seg(t, 8, 10)));
  const reveal = ease(seg(t, 7.6, 9.4));
  s.cam(s.W / 2, 0.52, 1.02 + 0.03 * heavy);
  // someone walks in with a lamp, between the wall and the prisoners, and holds it up
  const walkK = seg(t, 4.2, 7.6);
  const lx = lerp(s.W + 0.15, 0.8, walkK);
  const raise = ease(seg(t, 7.4, 8.2));
  let lamp: P = [lx, 0.4];
  const heads = wallView(s, {
    mood: 'machine', heat: 1 - reveal * 0.85, parapet: 0, heads: 0.6 * reveal, slump: heavy * (1 - reveal),
    turn: (i) => lerp(-0.3, 0.9, reveal * (i < 3 ? 1 : 0)),
  }, () => {
    const lines = [...wallText, ...wallText];
    c.save(); c.beginPath(); c.rect(0.1, 0.1, s.W - 0.2, 0.42); c.clip();
    typed(s, lines.slice(0, 8), -0.6, 0.55, s.W / 2, 0.16 - heavy * 0.12, 0.06, 0.03);
    c.restore();
    // what the lamp shows: not a speaker, but an instrument — wheels turning behind the words
    if (reveal > 0) {
      const rx = 0.6, ry = 0.3, rr = 0.2 * reveal;
      glow(c, rx, ry, rr * 1.6, [255, 214, 150], 0.45 * reveal);
      c.save(); c.beginPath(); c.arc(rx, ry, rr, 0, Math.PI * 2); c.clip();
      c.fillStyle = css(mixRGB(s.screen, [255, 232, 196], 0.5)); c.fillRect(rx - rr, ry - rr, rr * 2, rr * 2);
      c.fillStyle = s.tone(0.15);
      gear(c, rx - 0.07, ry - 0.02, 0.07, 12, clock * 0.8);
      gear(c, rx + 0.055, ry + 0.04, 0.05, 9, -clock * 0.8 * 12 / 9 + 0.2);
      gear(c, rx + 0.02, ry - 0.11, 0.035, 8, -clock * 1.2);
      c.restore();
      c.strokeStyle = s.tone(0.2); c.lineWidth = 0.004; c.beginPath(); c.arc(rx, ry, rr, 0, Math.PI * 2); c.stroke();
    }
    c.fillStyle = s.ink;
    const L = person(c, { x: lx, y: 0.8, h: 0.4, face: -1, ...(walkK < 1 ? walk(t * 0.8, 1) : {}), arm: [lerp(60, 150, raise), lerp(20, -10, raise)], hold: 'lamp', robe: 'long', beard: true, cut: s.tone(0.8), t: clock });
    lamp = L.flames[0] ?? L.hand;
    glow(c, lamp[0], lamp[1], 0.12, [255, 200, 120], 0.6);
  });
  // bubbles everywhere: the instrument, heavily used
  const n = 7;
  for (let i = 0; i < n; i++) {
    const at = 0.4 + i * 0.6;
    const k = shown(t, at, at + 3.4) * (1 - reveal);
    const x = 0.18 + ((i * 0.37) % 1) * (s.W - 0.36), y = 0.38 + ((i * 0.53) % 1) * 0.22;
    const hd = heads[i % 3].head;
    bubble(c, { x, y, r: 0.045, to: [hd[0], hd[1] - 0.12], k, ink: s.ink, icon: LINES });
  }
  s.spill(lamp[0], lamp[1], 0.5 * raise, [255, 200, 130]);
};

function gear(c: C, x: number, y: number, r: number, teeth: number, a: number) {
  c.beginPath();
  for (let i = 0; i < teeth * 2; i++) {
    const ang = a + (i / (teeth * 2)) * Math.PI * 2, rr = i % 2 ? r * 0.78 : r;
    c.lineTo(x + Math.cos(ang - 0.08) * rr, y + Math.sin(ang - 0.08) * rr);
    c.lineTo(x + Math.cos(ang + 0.08) * rr, y + Math.sin(ang + 0.08) * rr);
  }
  c.closePath(); c.fill();
}

export const cave: StoryVisuals = {
  id: 'cave',
  aspect: 1.25,
  loop: true,
  scenes: [theFire, theShadows, theEcho, theTurning, theSun, theTelling, theNewWall, theCoda],
  stills: [8.8, 7, 7.5, 5.5, 10.5, 14, 12.6, 10],
};
