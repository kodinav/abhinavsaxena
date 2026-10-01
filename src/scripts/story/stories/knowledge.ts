import { seg, ease, lerp, noise, css, mixRGB, hash, type RGB, type Stage, type SceneFn, type StoryVisuals } from '../puppet/theatre';
import { person, walk, gesture, CHAIR, type Body } from '../puppet/figure';
import { glow, sparks, sun, sound, twinkle } from '../puppet/fx';
import { bubble, shown, Q, EYE, CHECK, CROSS, SCROLL, CITY, CLOCK, type Icon } from '../puppet/bubbles';
import { hills, mountains, tree, cypress, wall, town, stool } from '../puppet/scenery';
import { thread } from '../puppet/marks';

/**
 * "What is knowledge?" — Theaetetus' question; Meno's two guides to Larisa,
 * one who knows the way and one who guesses it right; the statues of
 * Daedalus that run off unless tied; a stopped clock that happens to be
 * right; and the question still open.
 */
type C = CanvasRenderingContext2D;
type P = [number, number];
const GOLD: RGB = [240, 176, 70];
const GROUND = 0.84;

const socrates = (s: Stage, b: Partial<Body>): Body => ({ x: 0, y: GROUND, h: 0.33, robe: 'long', beard: true, head: 'bald', cut: s.tone(0.8), t: s.clock, ...b });
const theaetetus = (s: Stage, b: Partial<Body>): Body => ({ x: 0, y: GROUND, h: 0.3, robe: 'short', hair: 'curls', build: 0.96, cut: s.tone(0.8), t: s.clock, ...b });

/** A big question mark of light. */
function bigQ(s: Stage, x: number, y: number, size: number, k: number, color: RGB = GOLD) {
  if (k <= 0) return;
  const c = s.c;
  glow(c, x, y, size * 1.6, color, 0.55 * k);
  c.save(); c.translate(x, y); c.scale(size * k, size * k);
  c.fillStyle = css(color); Q(c);
  c.restore();
}
/** The three answers Theaetetus tries: perception, true opinion, an account. */
const ANSWERS: Icon[] = [EYE, (c) => { c.lineWidth = 0.1; c.beginPath(); c.ellipse(0, -0.1, 0.8, 0.6, 0, 0, Math.PI * 2); c.stroke(); c.beginPath(); c.moveTo(-0.3, 0.45); c.lineTo(-0.55, 0.9); c.lineTo(0.05, 0.5); c.stroke(); c.save(); c.scale(0.55, 0.55); c.translate(0, -0.2); CHECK(c); c.restore(); }, SCROLL];
function medallion(c: C, x: number, y: number, r: number, icon: Icon, ink: string, k = 1) {
  if (k <= 0) return;
  c.save(); c.globalAlpha *= k;
  c.fillStyle = 'rgba(255,252,246,0.97)'; c.strokeStyle = ink; c.lineWidth = r * 0.12;
  c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); c.stroke();
  c.translate(x, y); c.scale(r * 0.62, r * 0.62); c.fillStyle = ink; c.strokeStyle = ink; c.lineWidth = 0.14; c.lineCap = 'round'; icon(c);
  c.restore();
}

/** I. The question: under a plane tree, a question mark too big to answer, and three answers circling it. */
const theQuestion: SceneFn = (s) => {
  const { t, c, clock } = s;
  s.cam(s.W / 2, 0.5, 1.02 + 0.04 * ease(seg(t, 0, 9)));
  s.backdrop({ mood: 'day', x: 0.62, y: 0.3, r: 1.6 });
  c.fillStyle = s.tone(0.5); hills(c, -0.3, s.W + 0.3, 0.64, 0.06, 3, 1.3);
  c.fillStyle = s.tone(0.18); tree(c, 0.14, GROUND, 0.62, clock);
  c.fillStyle = s.tone(0.1); c.fillRect(-0.3, GROUND, s.W + 0.6, 0.5);
  c.fillStyle = s.tone(0.12); c.fillRect(0.3, GROUND - 0.085, 0.62, 0.025); c.fillRect(0.34, GROUND - 0.085, 0.02, 0.085); c.fillRect(0.88, GROUND - 0.085, 0.02, 0.085);
  c.fillStyle = s.ink;
  const ask = shown(t, 0.6, 3);
  const so = person(c, socrates(s, { x: 0.42, face: 1, ...CHAIR, ...gesture('rest', 'pointUp', ease(seg(t, 0.6, 1.4))), mouth: ask > 0.3 && !s.still ? 0.4 + 0.4 * Math.sin(clock * 14) : 0 }));
  const th = person(c, theaetetus(s, { x: 0.82, face: -1, ...CHAIR, ...gesture('rest', 'scratch', ease(seg(t, 3, 3.8))), tilt: -10 }));
  void so; void th;
  const q = ease(seg(t, 1, 2.6));
  const qx = 0.62, qy = 0.3;
  bigQ(s, qx, qy + 0.02 * Math.sin(clock), 0.16, q);
  ANSWERS.forEach((ic, i) => {
    const k = ease(seg(t, 3 + i * 0.9, 3.8 + i * 0.9));
    const a = clock * 0.6 + (i / 3) * Math.PI * 2;
    medallion(c, qx + Math.cos(a) * 0.26, qy + 0.02 + Math.sin(a) * 0.1, 0.045, ic, s.ink, k);
  });
};

/* ---------------------------------------------------------------- the road to Larisa */
const FORK = 0.5;
/** The two ways from the fork: up the hill to Larisa's gate, or down to the marsh. */
const UPPER: P[] = [[-0.3, GROUND - 0.02], [FORK, GROUND - 0.02], [0.72, GROUND - 0.1], [0.95, GROUND - 0.2], [1.1, GROUND - 0.24]];
const LOWER: P[] = [[FORK, GROUND - 0.02], [0.7, GROUND + 0.04], [0.92, GROUND + 0.08], [1.4, GROUND + 0.1]];
const along = (pts: P[], k: number): P => {
  const n = pts.length - 1, f = Math.min(n - 1e-6, Math.max(0, k * n)), i = Math.floor(f), v = f - i;
  return [lerp(pts[i][0], pts[i + 1][0], v), lerp(pts[i][1], pts[i + 1][1], v)];
};
function roadSet(s: Stage) {
  const { c, clock } = s;
  s.backdrop({ mood: 'day', x: 1.0, y: 0.25, r: 1.8 });
  c.fillStyle = s.tone(0.62); mountains(c, -0.3, s.W + 0.3, 0.5, 0.16, 11, 1.3, 5);
  // Larisa: a walled city on its hill
  c.fillStyle = s.tone(0.34); hills(c, 0.7, s.W + 0.4, GROUND - 0.2, 0.06, 4, 1.3, 2);
  c.fillStyle = s.tone(0.22); town(c, 0.98, 1.3, GROUND - 0.3, 0.12, 6, 1, 0, s.tone(0.5));
  wall(c, 0.98, 1.3, GROUND - 0.22, 0.09, 1.1, s.tone(0.7));
  c.fillStyle = s.tone(0.12);
  c.beginPath(); c.moveTo(-0.3, GROUND); c.lineTo(FORK, GROUND); c.lineTo(0.72, GROUND - 0.08); c.lineTo(0.95, GROUND - 0.18); c.lineTo(1.4, GROUND - 0.22); c.lineTo(1.4, 1.4); c.lineTo(-0.3, 1.4); c.closePath(); c.fill();
  // the marsh at the end of the wrong way
  c.fillStyle = css(mixRGB(s.screen, [120, 140, 130], 0.4));
  c.beginPath(); c.ellipse(1.0, GROUND + 0.1, 0.24, 0.025, 0, 0, Math.PI * 2); c.fill();
  c.strokeStyle = s.tone(0.2); c.lineWidth = 0.003;
  for (let i = 0; i < 6; i++) { const x = 0.82 + i * 0.07; c.beginPath(); c.moveTo(x, GROUND + 0.1); c.quadraticCurveTo(x + 0.01, GROUND + 0.04, x + 0.004 + Math.sin(clock + i) * 0.006, GROUND + 0.01); c.stroke(); }
  // the roads, pale on the dark ground
  c.strokeStyle = s.tone(0.5); c.lineWidth = 0.014; c.setLineDash([0.02, 0.012]);
  for (const path of [UPPER, LOWER]) { c.beginPath(); path.forEach((p, i) => (i ? c.lineTo(p[0], p[1] + 0.012) : c.moveTo(p[0], p[1] + 0.012))); c.stroke(); }
  c.setLineDash([]);
  // a signpost at the fork, its arms blank
  c.fillStyle = s.ink; c.fillRect(FORK - 0.004, GROUND - 0.13, 0.008, 0.13);
  c.beginPath(); c.moveTo(FORK, GROUND - 0.12); c.lineTo(FORK + 0.06, GROUND - 0.13); c.lineTo(FORK + 0.07, GROUND - 0.115); c.lineTo(FORK + 0.06, GROUND - 0.1); c.lineTo(FORK, GROUND - 0.105); c.fill();
  c.beginPath(); c.moveTo(FORK, GROUND - 0.09); c.lineTo(FORK + 0.055, GROUND - 0.08); c.lineTo(FORK + 0.065, GROUND - 0.065); c.lineTo(FORK + 0.055, GROUND - 0.055); c.lineTo(FORK, GROUND - 0.065); c.fill();
}
/** A guide leading three travellers along the upper road; `pause` holds them at the fork. */
function journey(s: Stage, k: number, guide: Partial<Body>, pauseAt: number, pauseLen: number) {
  const c = s.c;
  const out: { head: P; mouth: P } = { head: [0, 0], mouth: [0, 0] };
  for (let i = 3; i >= 0; i--) {
    const lag = i * 0.075;
    const kk = Math.max(0, k - lag);
    const p = along(UPPER, kk);
    const moving = kk > 0 && kk < 1 && !(s.t > pauseAt && s.t < pauseAt + pauseLen);
    c.fillStyle = s.ink;
    const j = person(c, { x: p[0], y: p[1], h: i === 0 ? 0.24 : 0.21, face: 1, robe: 'short', ...(moving ? walk(s.t * 1.1 + i * 0.27, 0.9) : {}), cut: s.tone(0.8), t: s.clock + i, ...(i === 0 ? guide : { beard: i === 2, hold: i === 1 ? 'sack' : null }) });
    if (i === 0) { out.head = j.head; out.mouth = j.mouth; }
  }
  return out;
}
/** Progress along the road, with a stop at the fork. */
const travel = (t: number, t0: number, t1: number, pauseAt: number, pauseLen: number) => {
  const total = t1 - t0 - pauseLen;
  const moving = t < pauseAt ? t - t0 : t < pauseAt + pauseLen ? pauseAt - t0 : t - t0 - pauseLen;
  return Math.max(0, Math.min(1, moving / total));
};

/** II. The road to Larisa: a guide who has been there leads the way — his own footsteps are on the road. */
const theRoad: SceneFn = (s) => {
  const { t, c } = s;
  s.cam(s.W / 2 + 0.03, 0.52, 1.06);
  roadSet(s);
  // footprints from when he went before, glowing on the right road
  const steps = 26;
  for (let i = 0; i < steps; i++) {
    const p = along(UPPER, 0.08 + (i / steps) * 0.9);
    const k = ease(seg(t, 0.4 + i * 0.05, 0.9 + i * 0.05));
    c.fillStyle = css(GOLD, 0.8 * k);
    c.beginPath(); c.ellipse(p[0] + (i % 2 ? 0.006 : -0.006), p[1] + 0.01 + (i % 2 ? 0.004 : 0), 0.007, 0.004, 0, 0, Math.PI * 2); c.fill();
  }
  const k = travel(t, 1, 11, 5.2, 0.8);
  const g = journey(s, k, { beard: true, hold: 'staff', ...(t > 5.2 && t < 6 ? gesture('rest', 'point', 1) : {}) }, 5.2, 0.8);
  // what he has in mind: the city itself, seen with his own eyes
  bubble(c, { x: g.head[0] - 0.02, y: g.head[1] - 0.15, r: 0.055, kind: 'thought', to: g.head, k: shown(t, 1.4, 11.6), ink: s.ink, icon: [EYE, CITY] });
  const arrive = seg(t, 10.4, 11.4);
  if (arrive > 0) glow(c, 1.1, GROUND - 0.25, 0.14, GOLD, arrive * 0.7);
};

/** III. Right opinion: a second guide has never been there; at the fork he guesses — and guesses right. */
const theGuess: SceneFn = (s) => {
  const { t, c, clock } = s;
  s.cam(s.W / 2 + 0.03, 0.52, 1.06);
  roadSet(s);
  const hesitate = t > 3.6 && t < 6.4;
  const k = travel(t, 0.6, 9.4, 3.6, 2.8);
  const look = hesitate ? Math.sin((t - 3.6) * 3.2) : 0;
  const g = journey(s, k, { hat: 'brim', hold: 'staff', tilt: look * 12, ...(hesitate ? (t < 5.6 ? gesture('rest', 'scratch', ease(seg(t, 3.7, 4.2))) : gesture('rest', 'point', 1)) : {}) }, 3.6, 2.8);
  // in his mind the city is only a guess: dashed, unseen — and a question at the fork
  const dashed: Icon = (cc) => { cc.save(); cc.globalAlpha = 0.5; CITY(cc); cc.restore(); cc.lineWidth = 0.06; cc.setLineDash([0.12, 0.1]); cc.strokeRect(-0.95, -0.85, 1.9, 1.7); cc.setLineDash([]); };
  const sure = seg(t, 5.6, 6.2);
  bubble(c, { x: g.head[0] - 0.02, y: g.head[1] - 0.15, r: 0.055, kind: 'thought', to: g.head, k: shown(t, 0.8, 10), ink: s.ink, icon: hesitate && sure < 0.5 ? [dashed, Q] : [dashed, CHECK] });
  if (hesitate && sure < 0.5) { const p = along(UPPER, 0.42); sound(c, p[0] + 0.05, p[1] - 0.16, 0.03, clock, -Math.PI / 2, 0.4, s.tone(0.4), 1.2); }
  const arrive = seg(t, 9, 10);
  if (arrive > 0) glow(c, 1.1, GROUND - 0.25, 0.14, GOLD, arrive * 0.7);
};

/* ---------------------------------------------------------------- the statues of Daedalus */
const MARBLE = (s: Stage) => css(mixRGB(s.screen, [250, 248, 242], 0.5));
/** A statue on its plinth that may come to life: `life` 0 stone … 1 running off towards `dir`. */
function statue(s: Stage, x: number, life: number, dir: 1 | -1, run: number, tied: boolean) {
  const c = s.c;
  c.fillStyle = s.tone(0.18); c.fillRect(x - 0.06, GROUND - 0.08, 0.12, 0.08);
  const away = tied ? 0 : run;
  const tug = tied ? Math.min(1, run * 3) : 0;
  const sx = x + dir * (away * 0.9 + tug * 0.03);
  const sy = GROUND - 0.08 + (away > 0 ? Math.min(0.08, away * 0.6) : 0);
  const moving = life > 0.6 && (away > 0 || tug > 0);
  c.fillStyle = css(mixRGB([90, 88, 84], mixRGB(s.screen, [255, 255, 255], 0.4), 0.55));
  const j = person(c, { x: sx, y: sy, h: 0.28, face: dir, robe: null, ...(moving ? walk(s.t * 1.6 + x * 3, 1.3) : { leg: [6, 0], leg2: [-8, 0] }), ...(life < 0.5 ? { arm: [4, 0], arm2: [-4, 0] } : {}), lean: tied ? 18 * tug : 6 * Math.min(1, away * 4), cut: s.tone(0.2), eye: life > 0.3 ? 'wide' : 'closed', t: s.clock });
  if (life > 0 && life < 0.7) sparks(c, sx, sy - 0.14, 0.06, s.clock, s.still ? 0 : 4, [255, 240, 200]);
  return j;
}
/** IV. The statues of Daedalus: untied, they run away; tied, they stay — and so with true opinions, until tied by reasons. */
const theStatues: SceneFn = (s) => {
  const { t, c, clock } = s;
  const second = ease(seg(t, 6.6, 7.6));
  s.cam(lerp(s.W / 2, s.W / 2 + 0.02, second), 0.5, 1.03);
  s.backdrop({ mood: 'fire', to: 'paper', k: second, x: 0.62, y: 0.35, r: 1.4 });
  if (second < 1) {
    c.save(); c.globalAlpha = 1 - second;
    // the workshop: tools on the wall, a bench
    c.fillStyle = s.tone(0.35);
    for (let i = 0; i < 5; i++) { const x = 0.1 + i * 0.07; c.fillRect(x, 0.2, 0.006, 0.08); c.fillRect(x - 0.015, 0.28, 0.036, 0.012); }
    c.fillStyle = s.tone(0.12); c.fillRect(-0.3, GROUND, s.W + 0.6, 0.5);
    const wake = seg(t, 0.8, 2);
    statue(s, 0.3, wake, -1, seg(t, 2.2, 4.4), false);
    statue(s, 0.95, wake, 1, seg(t, 2.6, 4.8), false);
    // the third is tied to a post: it pulls, and stays
    const tug = seg(t, 2.4, 6.6);
    const j = statue(s, 0.62, wake, 1, tug * 0.33 + (Math.sin(clock * 6) * 0.03 * Math.min(1, tug * 4)), true);
    c.fillStyle = s.ink; c.fillRect(0.46, GROUND - 0.2, 0.014, 0.2);
    c.strokeStyle = 'rgba(160,110,60,1)'; c.lineWidth = 0.005;
    c.beginPath(); c.moveTo(0.47, GROUND - 0.16); c.quadraticCurveTo(0.54, GROUND - 0.16 + 0.03 * (1 - Math.min(1, tug * 4)), j.hip[0], j.hip[1]); c.stroke();
    c.fillStyle = s.ink;
    person(c, { x: 0.18, y: GROUND, h: 0.32, face: 1, robe: 'short', beard: true, hold: 'hammer', ...gesture('raise', 'shrug', seg(t, 2.4, 3)), cut: s.tone(0.8), t: clock });
    c.restore();
  }
  if (second > 0) {
    c.save(); c.globalAlpha = second;
    // the same in the soul: a head, two true opinions — one flies off, one is tied by a cord of reasons and turns to gold
    const hx = 0.36, hy = 0.5, R = 0.3;
    c.fillStyle = s.tone(0.12);
    c.beginPath(); c.ellipse(hx, hy, R * 0.82, R, 0, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.moveTo(hx + R * 0.7, hy - R * 0.1); c.lineTo(hx + R * 1.02, hy + R * 0.22); c.lineTo(hx + R * 0.72, hy + R * 0.3); c.fill();
    c.fillRect(hx - R * 0.3, hy + R * 0.8, R * 0.6, R * 0.6);
    const free = seg(t, 8.6, 11.4);
    const o1: P = [hx - 0.06 + free * 0.9, hy - 0.08 - free * 0.5 + Math.sin(free * 9) * 0.03];
    glow(c, o1[0], o1[1], 0.06, [255, 240, 200], 0.9); c.fillStyle = 'rgba(255,250,236,1)'; c.beginPath(); c.arc(o1[0], o1[1], 0.016, 0, Math.PI * 2); c.fill();
    if (free > 0 && free < 1) sparks(c, o1[0], o1[1], 0.04, clock, s.still ? 0 : 5, [255, 240, 200]);
    const tie = ease(seg(t, 9.2, 11.2)), gold = ease(seg(t, 11, 12.4));
    const o2: P = [hx + 0.06 + Math.sin(clock * 3) * 0.01 * (1 - tie), hy + 0.06];
    const anchor: P = [hx + 0.02, hy + 0.2];
    thread(c, [anchor, [hx - 0.05, hy + 0.14], o2], tie, GOLD, 0.006, { bead: false });
    c.fillStyle = css(GOLD); c.beginPath(); c.arc(anchor[0], anchor[1], 0.012, 0, Math.PI * 2); c.fill();
    glow(c, o2[0], o2[1], 0.06 + gold * 0.04, gold > 0 ? GOLD : [255, 240, 200], 0.9);
    c.save(); c.translate(o2[0], o2[1]); c.rotate(clock * 0.3); twinkle(c, 0, 0, 0.02 + gold * 0.025, css(mixRGB([255, 250, 236], GOLD, gold))); c.restore();
    // the right-hand side: what each became
    medallion(c, 1.0, 0.36, 0.06, (cc) => { cc.save(); cc.globalAlpha = 0.5; cc.beginPath(); cc.arc(0, 0, 0.35, 0, Math.PI * 2); cc.fill(); cc.restore(); cc.lineWidth = 0.1; cc.beginPath(); cc.moveTo(0.3, -0.3); cc.lineTo(0.8, -0.8); cc.stroke(); }, s.ink, seg(t, 11, 11.6));
    medallion(c, 1.0, 0.62, 0.06, (cc) => { cc.save(); cc.fillStyle = css(GOLD); cc.beginPath(); for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 - Math.PI / 2, r = i % 2 ? 0.35 : 0.85; cc.lineTo(Math.cos(a) * r, Math.sin(a) * r); } cc.closePath(); cc.fill(); cc.restore(); }, s.ink, seg(t, 12.2, 12.8));
    c.restore();
  }
};

/* ---------------------------------------------------------------- the stopped clock */
function clockTower(s: Stage, x: number, h: number, mm: number, web: number) {
  const c = s.c;
  c.fillStyle = s.tone(0.14);
  c.fillRect(x - 0.08, GROUND - h, 0.16, h);
  c.beginPath(); c.moveTo(x - 0.1, GROUND - h); c.lineTo(x, GROUND - h - 0.12); c.lineTo(x + 0.1, GROUND - h); c.closePath(); c.fill();
  const cy = GROUND - h + 0.11, r = 0.062;
  c.fillStyle = 'rgba(250,246,236,1)'; c.beginPath(); c.arc(x, cy, r, 0, Math.PI * 2); c.fill();
  c.save(); c.translate(x, cy); c.scale(r * 0.95, r * 0.95); c.fillStyle = s.ink; c.strokeStyle = s.ink; c.lineCap = 'round'; CLOCK(Math.floor(mm / 60), mm % 60)(c); c.restore();
  if (web > 0) {
    // a cobweb across the face: it has not moved in a long time
    c.save(); c.globalAlpha = web; c.strokeStyle = 'rgba(80,80,90,0.9)'; c.lineWidth = 0.0015;
    const wx = x + r * 0.45, wy = cy - r * 0.45;
    for (let i = 0; i < 6; i++) { const a = Math.PI * 0.5 + (i / 5) * Math.PI * 0.5; c.beginPath(); c.moveTo(wx, wy); c.lineTo(wx + Math.cos(a) * r * 0.9, wy + Math.sin(a) * r * 0.9); c.stroke(); }
    for (let k = 1; k <= 3; k++) { c.beginPath(); for (let i = 0; i < 6; i++) { const a = Math.PI * 0.5 + (i / 5) * Math.PI * 0.5; c.lineTo(wx + Math.cos(a) * r * 0.3 * k, wy + Math.sin(a) * r * 0.3 * k); } c.stroke(); }
    c.fillStyle = 'rgba(40,40,46,1)'; c.beginPath(); c.arc(wx - r * 0.25, wy + r * 0.55, r * 0.07, 0, Math.PI * 2); c.fill();
    c.restore();
  }
  return { face: [x, cy] as P, r };
}
/** V. The stopped clock: day turns to night and back; its hands never move. A man glances up — and it is right. */
const theClock: SceneFn = (s) => {
  const { t, c, clock } = s;
  // twelve hours go by in four seconds: the sun sets, the moon crosses, the sun comes back to where it was
  const lapse = seg(t, 0.4, 4.4);
  const night = Math.sin(lapse * Math.PI);
  s.cam(s.W / 2, 0.5, 1.03);
  s.backdrop({ mood: 'day', to: 'night', k: night, x: 0.62, y: 0.3, r: 1.7 });
  const arc = (k: number): P => [lerp(1.3, -0.1, k), 0.5 - Math.sin(k * Math.PI) * 0.36];
  if (lapse < 1) { const p = arc(0.62 + lapse * 0.9); sun(c, p[0], p[1], 0.035, clock, 1 - night, 0.3); const m = arc(lapse * 1.6 - 0.3); c.fillStyle = css([240, 240, 250], night); c.beginPath(); c.arc(m[0], m[1], 0.03, 0, Math.PI * 2); c.fill(); }
  else sun(c, arc(0.62)[0], arc(0.62)[1], 0.035, clock, 1, 0.3);
  c.fillStyle = s.tone(0.5); town(c, -0.2, s.W + 0.2, GROUND, 0.2, 3, 1, 0, s.tone(0.65));
  c.fillStyle = s.tone(0.1); c.fillRect(-0.3, GROUND, s.W + 0.6, 0.5);
  const T = clockTower(s, 0.8, 0.5, 3 * 60, ease(seg(t, 0.2, 1.4)));
  // the man: walks up, glances at the clock, and believes what it says
  const walkK = seg(t, 4.4, 6.6);
  const mx = lerp(-0.1, 0.42, walkK);
  const look = ease(seg(t, 6.6, 7.2));
  c.fillStyle = s.ink;
  const m = person(c, { x: mx, y: GROUND, h: 0.3, face: 1, hat: 'brim', robe: 'cloak', ...(walkK < 1 ? walk(t * 1, 1) : gesture('rest', 'pointUp', look * 0.5)), tilt: -26 * look, cut: s.tone(0.8), t: clock });
  const belief = shown(t, 7.4, 13);
  bubble(c, { x: m.head[0] - 0.03, y: m.head[1] - 0.17, r: 0.06, kind: 'thought', to: m.head, k: belief, ink: s.ink, icon: [CLOCK(3, 0), seg(t, 9, 9.6) > 0.5 ? CHECK : (cc: C) => {}] });
  // it really is three: the bell in the tower rings it out
  for (let i = 0; i < 3; i++) { const at = 8.4 + i * 0.7; const k = seg(t, at, at + 0.7); if (k > 0 && k < 1) sound(c, T.face[0], T.face[1] - 0.17, 0.05, clock, -Math.PI / 2, 1 - k, s.tone(0.3), 1.2); }
  // but does he know?
  bigQ(s, m.head[0] + 0.15, m.head[1] - 0.24, 0.06, ease(seg(t, 10.4, 11.2)), [200, 70, 50]);
  if (t > 10.4) { c.strokeStyle = css([200, 70, 50], ease(seg(t, 10.6, 11.4))); c.lineWidth = 0.004; c.setLineDash([0.012, 0.01]); c.beginPath(); c.arc(T.face[0], T.face[1], T.r * 1.35, 0, Math.PI * 2); c.stroke(); c.setLineDash([]); }
};

/** VI. Still open: each answer tried as a key in the question's lock — none turns it. The two walk on, talking. */
const theOpenQuestion: SceneFn = (s) => {
  const { t, c, clock } = s;
  s.cam(s.W / 2, 0.5, 1.02);
  s.backdrop({ mood: 'dusk', to: 'gold', k: ease(seg(t, 6, 10)), x: 0.62, y: 0.4, r: 1.5 });
  c.fillStyle = s.tone(0.1); c.fillRect(-0.3, GROUND, s.W + 0.6, 0.5);
  // a great door, its keyhole a question mark, light behind it
  const dx = 0.62, dy = 0.48;
  c.fillStyle = s.tone(0.16);
  c.beginPath(); c.moveTo(dx - 0.2, GROUND); c.lineTo(dx - 0.2, 0.24); c.arc(dx, 0.24, 0.2, Math.PI, 0); c.lineTo(dx + 0.2, GROUND); c.closePath(); c.fill();
  c.strokeStyle = s.tone(0.3); c.lineWidth = 0.004; c.beginPath(); c.moveTo(dx, 0.1); c.lineTo(dx, GROUND); c.stroke();
  glow(c, dx, dy, 0.14, [255, 236, 190], 0.7 + 0.2 * Math.sin(clock * 2));
  c.save(); c.translate(dx, dy); c.scale(0.1, 0.1); c.fillStyle = 'rgba(255,244,214,1)'; Q(c); c.restore();
  // three keys, one after another: each goes in, will not turn, and drops away
  ANSWERS.forEach((ic, i) => {
    const at = 0.6 + i * 1.9;
    const come = ease(seg(t, at, at + 0.8)), fail = seg(t, at + 1.1, at + 1.8);
    if (come <= 0) return;
    const x = lerp(dx - 0.45 + i * 0.3 - 0.15, dx - 0.06, come) - fail * 0.05, y = lerp(0.18, dy, come) + fail * fail * 0.5;
    const shake = come >= 1 && fail <= 0 ? Math.sin(clock * 40) * 0.006 : 0;
    c.save(); c.globalAlpha = 1 - seg(t, at + 1.5, at + 1.9);
    c.translate(x + shake, y); c.rotate(fail * 1.2);
    c.fillStyle = css(GOLD); c.fillRect(-0.1, -0.006, 0.08, 0.012); c.fillRect(-0.07, 0.006, 0.01, 0.014); c.fillRect(-0.05, 0.006, 0.01, 0.01);
    c.restore();
    medallion(c, x - 0.13 + shake, y, 0.035, ic, s.ink, 1 - seg(t, at + 1.5, at + 1.9));
    if (fail > 0 && fail < 0.6) { c.save(); c.translate(x + 0.02, y - 0.05); c.scale(0.03, 0.03); c.strokeStyle = 'rgba(200,70,50,1)'; c.fillStyle = 'rgba(200,70,50,1)'; c.lineCap = 'round'; CROSS(c); c.restore(); }
  });
  // Socrates and Theaetetus walk off together, still asking
  const go = seg(t, 6.2, 10);
  c.fillStyle = s.ink;
  const so = person(c, socrates(s, { x: lerp(0.2, -0.1, go), h: 0.3, face: -1, ...(go > 0 ? walk(t * 0.9, 0.9) : gesture('rest', 'chin', 1)), mouth: go > 0 && !s.still ? 0.3 + 0.3 * Math.sin(clock * 12) : 0 }));
  const th = person(c, theaetetus(s, { x: lerp(0.34, 0.05, go), h: 0.27, face: -1, ...(go > 0 ? walk(t * 0.9 + 0.5, 0.9) : gesture('rest', 'scratch', 1)) }));
  bubble(c, { x: so.head[0] + 0.02, y: so.head[1] - 0.14, r: 0.04, to: so.mouth, k: shown(t, 6.6, 10), ink: s.ink, icon: Q });
  bubble(c, { x: th.head[0] + 0.04, y: th.head[1] - 0.12, r: 0.035, to: th.mouth, k: shown(t, 7.6, 10), ink: s.ink, icon: Q });
};

export const knowledge: StoryVisuals = {
  id: 'knowledge',
  aspect: 1.25,
  loop: false,
  scenes: [theQuestion, theRoad, theGuess, theStatues, theClock, theOpenQuestion],
  stills: [7, 9, 8, 12.6, 11.6, 5.4],
};
