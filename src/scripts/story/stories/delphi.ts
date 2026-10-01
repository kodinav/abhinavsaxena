import { seg, ease, lerp, noise, css, mixRGB, type RGB, type Stage, type SceneFn, type StoryVisuals } from '../puppet/theatre';
import { person, walk, gesture, KNEEL, CHAIR, type Body, type Joints } from '../puppet/figure';
import { glow, smoke, sun, sparks } from '../puppet/fx';
import { bubble, shown, Q, BANG, SOCRATES, LAUREL, SCROLL, CITY, type Icon } from '../puppet/bubbles';
import { temple, tripod, mountains, hills, cypress, olive, acropolis, town } from '../puppet/scenery';
import { thread } from '../puppet/marks';

/**
 * "The oracle at Delphi" (Apology 21–23, 38): a friend asks the oracle, the
 * god says no one is wiser than Socrates, Socrates is puzzled, questions
 * those who seem wise, and finds his wisdom is knowing that he does not know.
 */
type C = CanvasRenderingContext2D;
type P = [number, number];
const GOLD: RGB = [240, 176, 70];
const GROUND = 0.84;

/** Socrates: bald crown, snub nose, a full beard, barefoot in a plain cloak. */
const socrates = (s: Stage, b: Partial<Body>): Body => ({ x: 0, y: GROUND, h: 0.34, robe: 'long', beard: true, head: 'bald', cut: s.tone(0.8), t: s.clock, ...b });
/** Chaerephon, his eager friend. */
const chaerephon = (s: Stage, b: Partial<Body>): Body => ({ x: 0, y: GROUND, h: 0.33, robe: 'short', hair: 'curls', cut: s.tone(0.8), t: s.clock, ...b });

/** The laurel crowned head of Socrates: the oracle's answer. */
const WISEST: Icon = (c) => {
  c.save(); c.translate(0, 0.08); c.scale(0.72, 0.72); SOCRATES(c); c.restore();
  c.save(); c.translate(-0.02, -0.12); c.scale(1.18, 1.0); c.fillStyle = 'rgba(206,146,36,1)'; LAUREL(c); c.restore();
};
/** A laurel crown, drawn in gold over a head at (x, y). */
function crown(c: C, x: number, y: number, size: number, face: 1 | -1 = 1) {
  c.save(); c.translate(x, y); c.scale(face * size, size); c.rotate(-0.15);
  c.fillStyle = 'rgba(214,156,46,1)';
  for (let i = 0; i < 9; i++) { const a = Math.PI * (0.95 + i * 0.13); c.save(); c.translate(Math.cos(a) * 1, Math.sin(a) * 0.55); c.rotate(a + 1.9); c.beginPath(); c.ellipse(0, 0, 0.16, 0.36, 0, 0, Math.PI * 2); c.fill(); c.restore(); }
  c.restore();
}
/** "Is anyone wiser than Socrates?" */
const ASK: Icon = (c) => {
  c.save(); c.translate(-0.4, 0); c.scale(0.62, 0.62); SOCRATES(c); c.restore();
  c.save(); c.translate(0.55, 0); c.scale(0.75, 0.75); Q(c); c.restore();
};

function delphiSet(s: Stage, vapour: number) {
  const { c, clock } = s;
  // the Shining Rocks of Parnassus behind the sanctuary
  c.fillStyle = s.tone(0.62); mountains(c, -0.3, s.W + 0.3, 0.46, 0.34, 3, 1.3, 3);
  c.fillStyle = s.tone(0.42); hills(c, -0.3, s.W + 0.3, 0.6, 0.06, 5, 1.3);
  c.fillStyle = s.tone(0.28);
  cypress(c, 0.08, 0.66, 0.2, clock); cypress(c, 1.16, 0.64, 0.24, clock);
  temple(c, 0.36, 0.66, 0.44, 0.34, 6, s.tone(0.5));
  c.fillStyle = s.tone(0.1); c.fillRect(-0.3, GROUND, s.W + 0.6, 0.5);
  c.fillRect(-0.3, 0.66, s.W + 0.6, 0.02);
  // the chasm and its vapours, rising round the Pythia's tripod
  c.fillStyle = s.tone(0.04);
  c.beginPath(); c.ellipse(0.8, GROUND + 0.01, 0.12, 0.025, 0, 0, Math.PI * 2); c.fill();
  smoke(c, 0.8, GROUND, 0.18, clock, [250, 246, 236], vapour, 10, -0.15);
  c.fillStyle = s.ink; tripod(c, 0.8, GROUND, 0.26);
}

/** The Pythia, seated high on her tripod with a laurel sprig. */
function pythia(s: Stage, o: Partial<Body> = {}) {
  return person(s.c, { x: 0.8, y: GROUND - 0.21, h: 0.3, face: 1, ...CHAIR, robe: 'long', hair: 'long', hold: 'branch', ...gesture('pointUp', 'rest', 0.5), cut: s.tone(0.8), t: s.clock, ...o });
}

/** I. The oracle: Chaerephon climbs to Delphi and asks; the priestess answers. */
const theOracle: SceneFn = (s) => {
  const { t, c, clock } = s;
  const zoom = ease(seg(t, 3, 5.5));
  s.cam(lerp(s.W / 2, 0.86, zoom), lerp(0.5, 0.56, zoom), lerp(1, 1.35, zoom));
  s.backdrop({ mood: 'dawn', x: 0.9, y: 0.3, r: 1.6 });
  sun(c, 1.05, 0.2, 0.04, clock, 0.6, 0.5);
  delphiSet(s, 1);
  // he comes up the sacred way, kneels, and asks
  const walkK = seg(t, 0, 3.4);
  const kneel = ease(seg(t, 3.4, 4)) * (1 - ease(seg(t, 9.2, 9.6)));
  const joy = ease(seg(t, 9.2, 9.8));
  const away = seg(t, 9.8, 11);
  const x = walkK < 1 ? lerp(-0.1, 0.62, walkK) : lerp(0.62, 0.2, away);
  c.fillStyle = s.ink;
  const ch = person(c, chaerephon(s, {
    x, face: away > 0 ? -1 : 1,
    ...(walkK < 1 || away > 0 ? walk(t * 1.1, away > 0 ? 1.3 : 1) : {}),
    drop: KNEEL.drop! * kneel, foot: kneel > 0 ? [lerp(3, KNEEL.foot![0], kneel), 1] : null, foot2: kneel > 0 ? [lerp(-3, KNEEL.foot2![0], kneel), 1] : null,
    ...(joy > 0 ? gesture('rest', 'both', joy) : kneel > 0.5 ? gesture('rest', 'plead', ease(seg(t, 4, 4.5))) : {}),
    mouth: t > 4.2 && t < 6.2 && !s.still ? 0.4 + 0.4 * Math.sin(clock * 14) : 0,
  }));
  const speaking = t > 7 && t < 9.4 && !s.still;
  const py = pythia(s, { mouth: speaking ? 0.4 + 0.4 * Math.sin(clock * 12) : 0, tilt: 8 });
  glow(c, py.head[0], py.head[1], 0.12, [255, 236, 190], 0.4 + 0.3 * shown(t, 6.8, 10));
  bubble(c, { x: ch.head[0] - 0.02, y: ch.head[1] - 0.15, r: 0.065, to: ch.mouth, k: shown(t, 4.2, 6.8), ink: s.ink, icon: ASK });
  bubble(c, { x: py.head[0] - 0.14, y: py.head[1] - 0.12, r: 0.09, to: py.mouth, k: shown(t, 6.9, 10.4), ink: s.ink, icon: WISEST, scale: 0.75 });
};

/** Athens: the agora under the Acropolis. */
function athens(s: Stage, warm = 0) {
  const { c, clock } = s;
  s.backdrop({ mood: 'day', to: 'gold', k: warm, x: 0.9, y: 0.25, r: 1.8 });
  c.fillStyle = s.tone(0.6); acropolis(c, 0.95, 0.56, 0.6, 0.36, s.tone(0.75));
  c.fillStyle = s.tone(0.45); town(c, -0.2, 0.62, 0.62, 0.12, 4, 1, 0, s.tone(0.62));
  c.fillStyle = s.tone(0.3); olive(c, 0.08, 0.68, 0.24, clock); cypress(c, 1.22, 0.68, 0.22, clock);
  // a stoa at the back of the square: the colonnade where people talk
  c.fillStyle = s.tone(0.5);
  c.fillRect(-0.3, 0.5, 0.62, 0.026);
  for (let i = 0; i < 6; i++) c.fillRect(-0.24 + i * 0.1, 0.526, 0.016, 0.17);
  c.fillRect(-0.3, 0.69, 0.62, 0.014);
  c.fillStyle = s.tone(0.1); c.fillRect(-0.3, GROUND, s.W + 0.6, 0.5);
}

/** II. The riddle: the news reaches Socrates, and he cannot square it with what he knows of himself. */
const theRiddle: SceneFn = (s) => {
  const { t, c, clock } = s;
  s.cam(s.W / 2 + 0.03 * Math.sin(t * 0.3), 0.5, 1.12);
  athens(s);
  const runIn = seg(t, 0, 1.6);
  const leave = seg(t, 4.4, 6);
  const cx = runIn < 1 ? lerp(s.W + 0.1, 0.86, runIn) : lerp(0.86, s.W + 0.2, leave);
  c.fillStyle = s.ink;
  const ch = person(c, chaerephon(s, { x: cx, face: leave > 0 ? 1 : -1, ...(runIn < 1 || leave > 0 ? walk(t * 1.4, 1.3) : gesture('rest', 'both', shown(t, 1.6, 4.4))), mouth: t > 1.6 && t < 4 && !s.still ? 0.4 + 0.4 * Math.sin(clock * 14) : 0 }));
  bubble(c, { x: ch.head[0] - 0.05, y: ch.head[1] - 0.17, r: 0.085, to: ch.mouth, k: shown(t, 1.7, 4.6), ink: s.ink, icon: WISEST, scale: 0.75 });
  // Socrates puzzles: scratching his head, then pacing, then a shrug
  const pace = seg(t, 5, 9.5);
  const px = 0.5 + 0.12 * Math.sin(pace * Math.PI * 2);
  const pacing = pace > 0 && pace < 1;
  const face = pacing ? (Math.cos(pace * Math.PI * 2) > 0 ? 1 : -1) : 1;
  const so = person(c, socrates(s, {
    x: px, face, ...(pacing ? walk(t * 0.8, 0.8) : {}),
    ...(t < 5 ? gesture('rest', 'scratch', ease(seg(t, 3.6, 4.2))) : t > 9.4 ? gesture('rest', 'shrug', ease(seg(t, 9.4, 9.9))) : gesture('chin')),
    tilt: -6,
  }));
  // what he thinks: the god's answer … and a question mark
  const k = shown(t, 3.4, 10.4);
  const swap = seg(t, 6, 6.6);
  bubble(c, { x: so.head[0] + 0.02, y: so.head[1] - 0.2, r: 0.075, kind: 'thought', to: so.head, k, ink: s.ink, icon: swap < 0.5 ? WISEST : (cc) => { cc.save(); cc.translate(-0.45, 0); cc.scale(0.62, 0.62); WISEST(cc); cc.restore(); cc.save(); cc.translate(0.55, 0); cc.scale(0.85, 0.85); Q(cc); cc.restore(); } });
};

/** Someone who seems wise: their confidence, and what one question does to it. */
interface Sage { x: number; at: number; kind: 'politician' | 'poet' | 'craftsman' }
function sage(s: Stage, g: Sage, soX: number): Joints {
  const { t, c, clock } = s;
  const local = t - g.at;
  const asked = seg(local, 1.6, 2.2);
  const angry = seg(local, 2.6, 3.1);
  const leave = seg(local, 3.2, 4.6);
  const x = g.x + leave * 0.4;
  const pose: Partial<Body> =
    g.kind === 'politician' ? { robe: 'long', beard: true, hat: 'laurel', ...(angry > 0 ? gesture('hips', 'fist', angry) : gesture('hips')) } :
    g.kind === 'poet' ? { robe: 'long', hair: 'long', hold: 'lyre', ...(angry > 0 ? gesture('offer', 'shrug', angry) : gesture('offer')) } :
    { robe: 'short', beard: true, hat: 'cap', hold: 'hammer', ...(angry > 0 ? gesture('raise', 'fist', angry) : gesture('raise')) };
  c.fillStyle = s.ink;
  const j = person(c, { x, y: GROUND, h: 0.35, face: leave > 0 ? 1 : -1, ...(leave > 0 ? walk(t * 1.1, 1) : {}), lean: g.kind === 'politician' ? -6 * (1 - angry) : 0, ...pose, cut: s.tone(0.8), t: clock });
  // their bubble: a proud "!" with what they claim to know; after the question it shrinks and droops
  const sure = shown(local, 0.2, 4.8);
  const deflate = asked;
  const claim: Icon = g.kind === 'politician' ? CITY : g.kind === 'poet' ? SCROLL : (cc) => { cc.save(); cc.scale(0.9, 0.9); CITY(cc); cc.restore(); };
  if (sure > 0) {
    const r = lerp(0.075, 0.04, deflate);
    bubble(c, { x: x - 0.02, y: j.head[1] - 0.17 + deflate * 0.04, r, to: j.mouth, k: sure, ink: s.ink, shake: angry, time: clock, icon: deflate < 0.5 ? [BANG, claim] : (cc) => { cc.save(); cc.rotate(0.5); BANG(cc); cc.restore(); } });
  }
  // and the question that does it
  bubble(c, { x: lerp(soX, x, 0.45), y: j.head[1] - 0.06, r: 0.045, to: [soX + 0.03, j.head[1] + 0.02], k: shown(local, 1.1, 2.6), ink: s.ink, icon: Q });
  return j;
}

/** III. The examination: a politician, a poet, a craftsman — each sure, each emptied by a question. */
const SAGES: Sage[] = [
  { x: 0.62, at: 0, kind: 'politician' },
  { x: 1.28, at: 4.3, kind: 'poet' },
  { x: 1.94, at: 8.6, kind: 'craftsman' },
];
const theExamination: SceneFn = (s) => {
  const { t, c, clock } = s;
  // the camera walks with Socrates along the street
  const leg = Math.min(2, Math.floor(t / 4.3));
  const into = seg(t - leg * 4.3, 0, 1.1);
  const soX = lerp(leg === 0 ? 0.3 : SAGES[leg - 1].x - 0.32, SAGES[leg].x - 0.32, ease(into));
  s.cam(soX + 0.3, 0.5, 1.15);
  s.backdrop({ mood: 'day', x: soX + 0.6, y: 0.25, r: 1.8 });
  const [x0, , x1] = s.view();
  c.fillStyle = s.tone(0.6); acropolis(c, 1.3, 0.56, 0.6, 0.36, s.tone(0.75));
  c.fillStyle = s.tone(0.45); town(c, x0 - 0.3, x1 + 0.3, 0.62, 0.12, 9, 1, 0, s.tone(0.62));
  c.fillStyle = s.tone(0.1); c.fillRect(x0 - 0.3, GROUND, x1 - x0 + 0.6, 0.5);
  if (leg === 2) { c.fillStyle = s.ink; c.fillRect(SAGES[2].x + 0.12, GROUND - 0.06, 0.08, 0.06); c.fillRect(SAGES[2].x + 0.105, GROUND - 0.075, 0.11, 0.02); }
  SAGES.forEach((g) => { if (t > g.at - 1 && t < g.at + 5.2) sage(s, g, soX); });
  c.fillStyle = s.ink;
  person(c, socrates(s, { x: soX, face: 1, ...(into < 1 ? walk(t * 1, 1) : gesture('rest', 'point', shown(t - leg * 4.3, 1.1, 2.6))), mouth: shown(t - leg * 4.3, 1.1, 2.6) > 0.3 && !s.still ? 0.4 + 0.4 * Math.sin(clock * 14) : 0 }));
};

/** IV. The wisest: the god's light finds the one who knows he does not know. */
const theWisest: SceneFn = (s) => {
  const { t, c, clock } = s;
  const k = ease(seg(t, 1.5, 4));
  s.cam(s.W / 2, 0.5 - 0.03 * k, 1 + 0.08 * k);
  athens(s, k);
  // the three, grumbling, their claims shrunk to nothing
  c.fillStyle = s.tone(0.35);
  [0.12, 0.28, 1.12].forEach((x, i) => {
    const j = person(c, { x, y: GROUND, h: 0.3, face: i < 2 ? 1 : -1, robe: i === 1 ? 'short' : 'long', beard: i !== 1, hat: i === 0 ? 'laurel' : i === 2 ? 'cap' : null, ...gesture('cross'), t: clock });
    bubble(c, { x: j.head[0] + (i < 2 ? 0.04 : -0.04), y: j.head[1] - 0.1, r: 0.03, to: j.mouth, k: 0.9, ink: s.tone(0.35), icon: (cc) => { cc.save(); cc.rotate(0.6); BANG(cc); cc.restore(); } });
  });
  // a shaft of light from Delphi, far off
  const beam = ease(seg(t, 1, 3.5));
  c.save();
  const g = c.createLinearGradient(1.1, -0.1, 0.62, 0.84);
  g.addColorStop(0, `rgba(255,232,170,${0.55 * beam})`); g.addColorStop(1, `rgba(255,232,170,${0.12 * beam})`);
  c.fillStyle = g; c.beginPath(); c.moveTo(1.0, -0.2); c.lineTo(1.28, -0.2); c.lineTo(0.76, GROUND); c.lineTo(0.46, GROUND); c.closePath(); c.fill();
  c.restore();
  sun(c, 1.18, -0.02, 0.05, clock, beam, beam);
  c.fillStyle = s.ink;
  const bowed = ease(seg(t, 7.4, 8.4));
  const so = person(c, socrates(s, { x: 0.62, face: 1, ...gesture('shrug', 'bow', bowed), lean: 14 * bowed, tilt: -10 + 18 * bowed }));
  // his thought: a question, which turns to gold; and the laurel comes down onto it
  const q = shown(t, 0.8, 10);
  const bx = so.head[0] - 0.02, by = so.head[1] - 0.2;
  const gold = ease(seg(t, 3.5, 5));
  glow(c, bx, by, 0.12, GOLD, gold * 0.8);
  bubble(c, { x: bx, y: by, r: 0.07, kind: 'thought', to: so.head, k: q, ink: s.ink, icon: (cc) => { cc.save(); cc.fillStyle = css(mixRGB([27, 26, 31], GOLD, gold)); Q(cc); cc.restore(); } });
  // the god's laurel comes down the light and settles on his head
  const down = ease(seg(t, 5, 7));
  if (down > 0) {
    const hx = lerp(1.0, so.head[0] - 0.004, down), hy = lerp(0.02, so.head[1] - 0.012, down);
    crown(c, hx, hy, 0.034, 1);
    if (down < 1) sparks(c, hx, hy, 0.06, clock, s.still ? 0 : 8, [255, 220, 140]);
    glow(c, hx, hy, 0.06, GOLD, 0.5 * down);
  }
};

/** V. The examined life: questions pass from one to another, and each lights up from inside. */
const YOUTH: [number, number, boolean][] = [[0.22, 0.3, false], [0.44, 0.27, true], [0.82, 0.29, false], [1.02, 0.27, true], [1.18, 0.31, false]];
const theExaminedLife: SceneFn = (s) => {
  const { t, c, clock } = s;
  s.cam(s.W / 2, 0.52, 1.04 - 0.04 * ease(seg(t, 0, 10)));
  athens(s, 0.4);
  c.fillStyle = s.tone(0.12); c.fillRect(0.5, GROUND - 0.08, 0.26, 0.08);
  c.fillStyle = s.ink;
  const so = person(c, socrates(s, { x: 0.63, y: GROUND - 0.08 + 0.0, face: 1, ...CHAIR, drop: 18, ...gesture('offer', 'point', 0.5 + 0.5 * Math.sin(t * 1.3)), mouth: !s.still ? 0.3 + 0.3 * Math.sin(clock * 10) : 0 }));
  const heads: P[] = [];
  YOUTH.forEach(([x, h, curly], i) => {
    const face = x < 0.63 ? 1 : -1;
    const lit = ease(seg(t, 1.6 + i * 1.3, 2.6 + i * 1.3));
    if (i % 2) { c.fillStyle = s.tone(0.15); c.fillRect(x - 0.05 * face - 0.035, GROUND - h * 0.27, 0.07, h * 0.27); c.fillStyle = s.ink; }
    const j = person(c, { x, y: GROUND, h, face, robe: 'short', hair: curly ? 'curls' : null, build: 0.95, ...(i % 2 ? CHAIR : {}), ...gesture('rest', 'chin', lit), tilt: -6, cut: s.tone(0.8), t: clock + i });
    heads.push(j.head);
    const bx = j.head[0] + (face > 0 ? -0.02 : 0.02), by = j.head[1] - 0.15;
    glow(c, bx, by, 0.07, GOLD, lit * 0.7);
    bubble(c, { x: bx, y: by, r: 0.045, kind: 'thought', to: j.head, k: lit, ink: s.ink, icon: (cc) => { cc.save(); cc.fillStyle = css(mixRGB([27, 26, 31], GOLD, lit)); Q(cc); cc.restore(); } });
  });
  // the questions travel from him to each of them, along threads of gold
  YOUTH.forEach((_, i) => {
    const k = ease(seg(t, 1 + i * 1.3, 1.8 + i * 1.3));
    thread(c, [[so.head[0], so.head[1] - 0.06], [heads[i][0], heads[i][1] - 0.12]], k, GOLD, 0.004, { alpha: 0.85 });
  });
  glow(c, so.head[0], so.head[1] - 0.04, 0.09, GOLD, 0.5);
  s.spill(so.head[0], so.head[1], 0.5, [255, 214, 140]);
};

export const delphi: StoryVisuals = {
  id: 'delphi',
  aspect: 1.25,
  loop: false,
  scenes: [theOracle, theRiddle, theExamination, theWisest, theExaminedLife],
  stills: [8.6, 7.4, 2.4, 8, 9],
};
