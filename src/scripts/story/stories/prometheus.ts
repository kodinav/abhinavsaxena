import { seg, ease, easeOut, lerp, noise, css, mixRGB, hash, type RGB, type Stage, type SceneFn, type StoryVisuals } from '../puppet/theatre';
import { person, walk, gesture, CHAIR, type Body } from '../puppet/figure';
import { beast, bird, tortoise, type BeastKind } from '../puppet/beasts';
import { fire, glow, sparks, smoke, weather, speed, sound } from '../puppet/fx';
import { bubble, shown, Q, HAND, SCALES, HEART } from '../puppet/bubbles';
import { hills, mountains, cloud, town, throne } from '../puppet/scenery';
import { thread } from '../puppet/marks';

/**
 * "The gift of fire" (Protagoras 320c–322d): the gods make the creatures;
 * Epimetheus hands out every gift and has none left for man; Prometheus
 * steals fire and the arts; men gather but cannot live together; Zeus sends
 * reverence and justice — to all.
 */
type C = CanvasRenderingContext2D;
type P = [number, number];
const GOLD: RGB = [240, 176, 70];
const EMBER: RGB = [255, 150, 60];
const GROUND = 0.84;

/** A god's great hand reaching down from above: a forearm of light, a palm, curled fingers and a thumb. */
function godHand(c: C, from: P, to: P, w: number, curl: number, side: 1 | -1) {
  const dx = to[0] - from[0], dy = to[1] - from[1], len = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
  c.save(); c.translate(from[0], from[1]); c.rotate(a);
  const g = c.createLinearGradient(0, 0, len, 0);
  g.addColorStop(0, 'rgba(255,214,150,0)'); g.addColorStop(0.45, 'rgba(255,214,150,0.38)'); g.addColorStop(1, 'rgba(255,226,170,0.62)');
  c.fillStyle = g;
  c.beginPath(); c.moveTo(0, -w * 0.62); c.quadraticCurveTo(len * 0.5, -w * 0.5, len * 0.8, -w * 0.4); c.lineTo(len * 0.8, w * 0.4); c.quadraticCurveTo(len * 0.5, w * 0.5, 0, w * 0.62); c.closePath(); c.fill();
  c.fillStyle = 'rgba(255,226,172,0.7)';
  c.beginPath(); c.roundRect(len * 0.78, -w * 0.48, w * 0.7, w * 0.96, w * 0.3); c.fill();
  for (let i = 0; i < 4; i++) {
    const fy = (i - 1.5) * w * 0.24;
    c.save(); c.translate(len * 0.78 + w * 0.62, fy); c.rotate(curl * (0.55 + i * 0.12) * side);
    c.beginPath(); c.roundRect(0, -w * 0.1, w * (0.56 - Math.abs(i - 1.5) * 0.06), w * 0.2, w * 0.1); c.fill();
    c.restore();
  }
  c.save(); c.translate(len * 0.86, -side * w * 0.42); c.rotate(-side * (0.9 - curl * 0.4));
  c.beginPath(); c.roundRect(0, -w * 0.11, w * 0.5, w * 0.22, w * 0.11); c.fill(); c.restore();
  c.restore();
  glow(c, to[0], to[1], w * 1.4, [255, 220, 160], 0.35);
}

/** I. The making: inside the earth, hands of the gods shape creatures from clay and fire. */
const MADE: { kind: 'bird' | 'tortoise' | BeastKind | 'man'; slot: number; h: number }[] = [
  { kind: 'bird', slot: 0.14, h: 0.1 }, { kind: 'deer', slot: 0.3, h: 0.24 }, { kind: 'lion', slot: 0.94, h: 0.2 },
  { kind: 'tortoise', slot: 1.1, h: 0.08 }, { kind: 'bear', slot: 0.45, h: 0.2 }, { kind: 'man', slot: 0.7, h: 0.3 },
];
function creature(s: Stage, kind: string, x: number, h: number, face: 1 | -1, stride = 0) {
  const c = s.c;
  if (kind === 'bird') bird(c, x, GROUND, h * 0.9, null, face);
  else if (kind === 'tortoise') { c.save(); c.translate(x, 0); c.scale(face, 1); tortoise(c, 0, GROUND, h * 1.1, 1, s.clock * stride, s.tone(0.7)); c.restore(); }
  else if (kind === 'man') person(c, { x, y: GROUND, h, face, ...gesture('receive'), tilt: 14, t: s.clock, cut: s.tone(0.8) });
  else beast(c, { kind: kind as BeastKind, x, y: GROUND, h, face, phase: s.clock * 0.8, stride, t: s.clock, cut: s.tone(0.8) });
}
const theMaking: SceneFn = (s) => {
  const { t, c, clock } = s;
  s.cam(s.W / 2, 0.52, 1.06 - 0.06 * ease(seg(t, 0, 11)));
  s.backdrop({ mood: 'fire', x: 0.62, y: 0.95, r: 1.1, bright: 0.55 + 0.1 * noise(clock * 2) });
  // the earth's dark vault, veined with fire
  c.fillStyle = s.tone(0.06);
  c.beginPath(); c.moveTo(-0.3, -0.3); c.lineTo(s.W + 0.3, -0.3); c.lineTo(s.W + 0.3, 0.16);
  for (let x = s.W + 0.3; x >= -0.3; x -= 0.05) c.lineTo(x, 0.12 + 0.05 * noise(x * 6 + 2));
  c.closePath(); c.fill();
  c.fillRect(-0.3, GROUND, s.W + 0.6, 0.5);
  c.strokeStyle = css(EMBER, 0.85); c.lineWidth = 0.005;
  for (let i = 0; i < 7; i++) {
    const x0 = hash(i, 4) * s.W;
    c.globalAlpha = 0.5 + 0.5 * Math.sin(clock * 1.5 + i);
    c.beginPath(); c.moveTo(x0, GROUND + 0.02); c.lineTo(x0 + 0.05, GROUND + 0.06); c.lineTo(x0 + 0.03, GROUND + 0.1); c.lineTo(x0 + 0.08, GROUND + 0.16); c.stroke();
  }
  c.globalAlpha = 1;
  // the clay: a glowing lump that each creature rises out of
  const lump: P = [0.62, GROUND];
  glow(c, lump[0], lump[1] - 0.04, 0.22, EMBER, 0.75);
  c.fillStyle = css(mixRGB([120, 60, 30], EMBER, 0.45 + 0.2 * Math.sin(clock * 3)));
  c.beginPath(); c.ellipse(lump[0], lump[1] - 0.025, 0.08 + 0.01 * Math.sin(clock * 2.2), 0.04, 0, Math.PI, 0); c.fill();
  sparks(c, lump[0], lump[1] - 0.03, 0.1, clock, s.still ? 0 : 10);
  // the gods' hands, made of light, kneading
  const knead = s.still ? 0 : Math.sin(clock * 2.4);
  godHand(c, [0.1, -0.25], [0.5 + 0.012 * knead, GROUND - 0.16], 0.1, 0.7 + 0.3 * knead, 1);
  godHand(c, [1.18, -0.3], [0.75 - 0.012 * knead, GROUND - 0.17], 0.1, 0.7 - 0.3 * knead, -1);
  // one after another the creatures come out of the fire and go to their places
  MADE.forEach((m, i) => {
    const at = 0.8 + i * 1.55;
    const born = seg(t, at, at + 0.6), go = ease(seg(t, at + 0.8, at + 1.6));
    if (born <= 0) return;
    const x = lerp(lump[0], m.slot, go);
    const face: 1 | -1 = m.slot < lump[0] ? -1 : 1;
    const hot = 1 - seg(t, at + 0.4, at + 1.6);
    c.save(); c.globalAlpha = born;
    c.fillStyle = css(mixRGB([22, 18, 16], [255, 190, 110], hot));
    creature(s, m.kind, x, m.h * lerp(0.6, 1, born), m.kind === 'man' ? 1 : face, go > 0 && go < 1 ? 1 : 0);
    c.restore();
    if (hot > 0.05) glow(c, x, GROUND - m.h * 0.5, m.h * 0.9, [255, 200, 120], hot * 0.6);
  });
  s.spill(0.62, GROUND - 0.1, 0.7, [255, 150, 70]);
};

/** Epimetheus and his sack of gifts. */
function epimetheus(s: Stage, x: number, o: Partial<Body> = {}) {
  const c = s.c;
  c.fillStyle = s.ink;
  return person(c, { x, y: GROUND, h: 0.36, face: 1, robe: 'long', beard: true, hat: 'laurel', cut: s.tone(0.8), t: s.clock, ...o });
}
function sack(c: C, x: number, y: number, r: number, k = 1, open = 0) {
  c.beginPath(); c.moveTo(x - r * 0.9, y); c.quadraticCurveTo(x - r * 1.2, y - r * 1.3 * k, x - r * 0.35, y - r * 1.55 * k); c.lineTo(x + r * 0.35, y - r * 1.55 * k); c.quadraticCurveTo(x + r * 1.2, y - r * 1.3 * k, x + r * 0.9, y); c.closePath(); c.fill();
  c.beginPath(); c.ellipse(x, y - r * 1.55 * k, r * (0.35 + open * 0.3), r * 0.12, 0, 0, Math.PI * 2); c.fill();
}

/** The tokens of the gifts: a claw (strength), a gust (swiftness), a feather (wings), a shell. */
const TOKENS: ((c: C) => void)[] = [
  (c) => { for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(-0.5 + i * 0.4, -0.6); c.quadraticCurveTo(-0.2 + i * 0.4, 0, -0.55 + i * 0.4, 0.7); c.lineTo(-0.4 + i * 0.4, 0.7); c.quadraticCurveTo(-0.05 + i * 0.4, 0, -0.3 + i * 0.4, -0.6); c.fill(); } },
  (c) => { c.lineWidth = 0.16; for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(-0.8 + i * 0.15, -0.45 + i * 0.45); c.lineTo(0.5 + i * 0.15, -0.45 + i * 0.45); c.stroke(); } c.beginPath(); c.moveTo(0.4, -0.75); c.lineTo(0.95, 0); c.lineTo(0.4, 0.75); c.stroke(); },
  (c) => { c.beginPath(); c.moveTo(-0.7, 0.7); c.quadraticCurveTo(-0.6, -0.4, 0.7, -0.8); c.quadraticCurveTo(0.4, 0.2, -0.7, 0.7); c.fill(); c.save(); c.strokeStyle = 'rgba(255,252,246,1)'; c.lineWidth = 0.06; c.beginPath(); c.moveTo(-0.6, 0.6); c.lineTo(0.5, -0.6); c.stroke(); c.restore(); },
  (c) => { c.beginPath(); c.ellipse(0, 0.2, 0.85, 0.6, 0, Math.PI, 0); c.fill(); c.save(); c.strokeStyle = 'rgba(255,252,246,1)'; c.lineWidth = 0.07; c.beginPath(); c.moveTo(-0.45, 0.2); c.lineTo(-0.2, -0.25); c.lineTo(0.2, -0.25); c.lineTo(0.45, 0.2); c.stroke(); c.restore(); },
];
const theGifts: SceneFn = (s) => {
  const { t, c, clock } = s;
  s.cam(s.W / 2 + 0.02, 0.5, 1.04);
  s.backdrop({ mood: 'dawn', x: 0.9, y: 0.3, r: 1.8 });
  c.fillStyle = s.tone(0.55); mountains(c, -0.3, s.W + 0.3, 0.56, 0.18, 7, 1.3, 4);
  c.fillStyle = s.tone(0.32); hills(c, -0.3, s.W + 0.3, 0.66, 0.06, 2, 1.3);
  c.fillStyle = s.tone(0.12); c.fillRect(-0.3, GROUND, s.W + 0.6, 0.5);
  const turns = [0.8, 3.4, 6, 8.4];
  const cur = turns.reduce((a, at, i) => (t >= at ? i : a), -1);
  const local = cur >= 0 ? t - turns[cur] : 0;
  const reach = local < 0.7 ? ease(seg(local, 0, 0.6)) : 1 - ease(seg(local, 0.7, 1.2));
  c.fillStyle = s.tone(0.08); sack(c, 0.13, GROUND, 0.075, 1, reach);
  epimetheus(s, 0.25, { face: 1, ...(local < 0.7 ? { reach: [0.13, GROUND - 0.11] as P } : gesture('rest', 'point', 1 - seg(local, 1.4, 2))) });
  const BEAR = 0.5, DEER = 0.78, BIRD = 0.99, TORT = 1.14;
  const targets: P[] = [[BEAR, GROUND - 0.14], [DEER, GROUND - 0.18], [BIRD, GROUND - 0.12], [TORT, GROUND - 0.05]];
  c.fillStyle = s.ink;
  // the bear: strength — it rears up and roars; but it stays slow
  const bk = ease(seg(t, turns[0] + 1.2, turns[0] + 1.8)) * (1 - ease(seg(t, turns[0] + 2.6, turns[0] + 3.2)));
  c.save(); c.translate(BEAR - 0.09, GROUND); c.rotate(-0.55 * bk); c.translate(-(BEAR - 0.09), -GROUND);
  const b = beast(c, { kind: 'bear', x: BEAR, y: GROUND, h: 0.2, face: 1, head: 25 * bk, mouth: bk, t: clock, cut: s.tone(0.8) });
  c.restore();
  if (bk > 0.3) sound(c, b.mouth[0] + 0.04, b.mouth[1] - 0.08, 0.06, clock, -0.4, bk, s.tone(0.3));
  // the deer: swiftness — it bounds away
  const dk = seg(t, turns[1] + 1.3, turns[1] + 3);
  const dx = DEER + ease(dk) * 0.9;
  beast(c, { kind: 'deer', x: dx, y: GROUND - Math.abs(Math.sin(dk * Math.PI * 3)) * 0.05 * (dk > 0 && dk < 1 ? 1 : 0), h: 0.24, face: 1, phase: clock * 2.4, stride: dk > 0 && dk < 1 ? 1.6 : 0, t: clock, cut: s.tone(0.8) });
  if (dk > 0 && dk < 1) speed(c, dx - 0.06, GROUND - 0.14, 0.08, 1, 1, s.tone(0.3));
  // the bird: wings — it lifts off its rock and wheels overhead
  c.fillStyle = s.tone(0.1); c.beginPath(); c.ellipse(BIRD, GROUND, 0.06, 0.05, 0, Math.PI, 0); c.fill(); c.fillStyle = s.ink;
  const wk = seg(t, turns[2] + 1.2, 11);
  const bxp = BIRD + Math.sin(wk * 5) * 0.14 * wk, byp = GROUND - 0.05 - ease(Math.min(1, wk * 2)) * 0.5 + Math.cos(wk * 5) * 0.04 * wk;
  bird(c, bxp, byp, 0.08 + 0.05 * Math.min(1, wk * 3), wk > 0 ? clock * 2.6 : null, wk > 0 ? (Math.cos(wk * 5) > 0 ? 1 : -1) : -1);
  // the tortoise: a shell to hide in
  const tk = ease(seg(t, turns[3] + 1.2, turns[3] + 1.8));
  c.save(); c.translate(TORT, 0); c.scale(-1, 1); tortoise(c, 0, GROUND, 0.13 * (1 + 0.25 * tk), 1 - tk, 0, s.tone(0.7)); c.restore();
  // each gift: a glowing token flies from the sack to its animal and bursts there
  if (cur >= 0) {
    const fly = seg(local, 0.55, 1.25);
    const from: P = [0.13, GROUND - 0.13], to = targets[cur];
    if (fly > 0 && fly < 1) {
      const p: P = [lerp(from[0], to[0], ease(fly)), lerp(from[1], to[1], ease(fly)) - Math.sin(fly * Math.PI) * 0.24];
      glow(c, p[0], p[1], 0.08, GOLD, 1);
      c.save(); c.translate(p[0], p[1]); c.scale(0.03, 0.03); c.fillStyle = 'rgba(255,250,236,1)'; c.strokeStyle = 'rgba(255,250,236,1)'; TOKENS[cur](c); c.restore();
    }
    const land = seg(local, 1.25, 2.4);
    if (land > 0 && land < 1) {
      glow(c, to[0], to[1], 0.12 + land * 0.1, GOLD, (1 - land) * 0.9);
      c.strokeStyle = css(GOLD, 1 - land); c.lineWidth = 0.004;
      c.beginPath(); c.arc(to[0], to[1], 0.04 + land * 0.12, 0, Math.PI * 2); c.stroke();
    }
  }
};

/** III. The forgotten: the sack is empty; man stands naked in the rain while the beasts keep warm. */
const theForgotten: SceneFn = (s) => {
  const { t, c, clock } = s;
  s.cam(s.W / 2, 0.5, 1.06);
  s.backdrop({ mood: 'night', x: 0.62, y: 0.3, r: 1.5 });
  c.fillStyle = s.tone(0.55); mountains(c, -0.3, s.W + 0.3, 0.58, 0.16, 7, 1.3, 4);
  c.fillStyle = s.tone(0.32); hills(c, -0.3, s.W + 0.3, 0.68, 0.05, 2, 1.3);
  c.fillStyle = s.tone(0.12); c.fillRect(-0.3, GROUND, s.W + 0.6, 0.5);
  // the empty sack turned upside down and shaken
  const shake = seg(t, 0.4, 3.2);
  const sx = 0.2 + (shake > 0 && shake < 1 ? Math.sin(clock * 18) * 0.008 : 0);
  c.fillStyle = s.ink;
  const e = epimetheus(s, 0.26, { face: 1, ...(shake < 1 ? { reach: [sx, 0.36] as P, reach2: [sx + 0.02, 0.38] as P } : gesture('rest', 'scratch', ease(seg(t, 3.2, 3.8)))) });
  if (shake < 1) {
    c.save(); c.translate(sx, 0.4); c.rotate(Math.PI); c.fillStyle = s.tone(0.08); sack(c, 0, 0, 0.05, 1, 1); c.restore();
    for (let i = 0; i < 6; i++) { const a = ((clock * 0.7 + i / 6) % 1); c.fillStyle = s.tone(0.3); c.globalAlpha = 1 - a; c.beginPath(); c.arc(sx + (hash(i) - 0.5) * 0.04, 0.48 + a * 0.3, 0.004, 0, Math.PI * 2); c.fill(); }
    c.globalAlpha = 1;
  }
  bubble(c, { x: e.head[0] + 0.02, y: e.head[1] - 0.15, r: 0.05, kind: 'thought', to: e.head, k: shown(t, 3.6, 10), ink: s.ink, icon: Q });
  // the beasts, all provided for
  beast(c, { kind: 'bear', x: 0.98, y: GROUND, h: 0.15, face: -1, t: clock, cut: s.tone(0.8) });
  beast(c, { kind: 'lion', x: 1.16, y: GROUND - 0.12, h: 0.14, face: -1, t: clock, cut: s.tone(0.8) });
  c.fillStyle = s.ink; c.beginPath(); c.ellipse(1.18, GROUND - 0.06, 0.12, 0.06, 0, Math.PI, 0); c.fill();
  bird(c, 0.5 + Math.sin(clock * 0.6) * 0.2, 0.22 + Math.sin(clock * 1.2) * 0.03, 0.06, clock * 2.4, Math.cos(clock * 0.6) > 0 ? 1 : -1);
  c.save(); c.translate(0.36, 0); tortoise(c, 0, GROUND, 0.08, 0, 0, s.tone(0.7)); c.restore();
  // man: no fur, no shoes, no claws — arms wrapped round himself, shivering
  const shiver = s.still ? 0 : Math.sin(clock * 40) * 0.002;
  const look = seg(t, 5, 6);
  const m = person(c, { x: 0.68 + shiver, y: GROUND, h: 0.3, face: -1, ...gesture('cross', 'receive', look * (1 - seg(t, 8.4, 9))), tilt: 10 + 16 * look, t: clock, cut: s.tone(0.8) });
  bubble(c, { x: m.head[0] - 0.02, y: m.head[1] - 0.16, r: 0.055, kind: 'thought', to: m.head, k: shown(t, 5.6, 10), ink: s.ink, icon: [HAND, Q] });
  weather(c, -0.3, -0.1, s.W + 0.6, 1, clock, 'rain', 0.8, 70, css(mixRGB(s.screen, [255, 255, 255], 0.6), 0.7));
};

/** IV. The theft: up in the gods' workshop Prometheus lights a fennel stalk at the forge, and brings it down. */
const theTheft: SceneFn = (s) => {
  const { t, c, clock } = s;
  // the world is two storeys: the gods' workshop on the clouds above, the earth below
  const down = ease(seg(t, 4.4, 7.6));
  s.cam(s.W / 2, lerp(-0.5, 0.5, down), 1.05);
  s.backdrop({ mood: 'gold', to: 'night', k: down, x: 0.62, y: lerp(-0.6, 0.4, down), r: 1.4 });
  // above: clouds, the forge of Hephaestus, Athena's loom
  c.fillStyle = s.tone(0.7);
  cloud(c, 0.2, -0.2, 0.5, 1); cloud(c, 1.0, -0.15, 0.56, 3); cloud(c, 0.62, 0.02, 0.7, 5);
  c.fillStyle = s.tone(0.12); c.fillRect(-0.3, -0.16, s.W + 0.6, 0.04);
  const forge: P = [0.98, -0.2];
  c.fillStyle = s.ink;
  c.beginPath(); c.moveTo(forge[0] - 0.09, -0.16); c.lineTo(forge[0] - 0.07, -0.3); c.lineTo(forge[0] + 0.07, -0.3); c.lineTo(forge[0] + 0.09, -0.16); c.closePath(); c.fill();
  fire(c, forge[0], -0.3, 0.1, clock, { sparks: s.still ? 0 : 8, glowK: 0.5 });
  c.fillStyle = s.ink;
  c.fillRect(0.74, -0.24, 0.1, 0.03); c.fillRect(0.77, -0.21, 0.04, 0.05); c.fillRect(0.75, -0.17, 0.08, 0.012);
  // the loom
  c.strokeStyle = s.ink; c.lineWidth = 0.008;
  c.beginPath(); c.moveTo(0.12, -0.16); c.lineTo(0.12, -0.42); c.moveTo(0.3, -0.16); c.lineTo(0.3, -0.42); c.moveTo(0.1, -0.42); c.lineTo(0.32, -0.42); c.stroke();
  c.lineWidth = 0.002; for (let i = 0; i < 9; i++) { c.beginPath(); c.moveTo(0.14 + i * 0.02, -0.42); c.lineTo(0.14 + i * 0.02, -0.22); c.stroke(); }
  // below: the earth at night, and man, cold
  c.fillStyle = s.tone(0.5); mountains(c, -0.3, s.W + 0.3, 0.58, 0.14, 3, 1.3, 4);
  c.fillStyle = s.tone(0.12); c.fillRect(-0.3, GROUND, s.W + 0.6, 0.5);
  const given = seg(t, 8.6, 9.2);
  const camp: P = [0.5, GROUND];
  c.fillStyle = s.tone(0.1); c.fillRect(camp[0] - 0.05, GROUND - 0.012, 0.1, 0.012);
  if (given > 0) fire(c, camp[0], GROUND - 0.01, 0.1 * ease(given), clock, { logs: s.tone(0.05), sparks: s.still ? 0 : 10 });
  c.fillStyle = s.ink;
  const warm = ease(seg(t, 9.2, 10));
  const m = person(c, { x: 0.36, y: GROUND, h: 0.28, face: 1, ...gesture('cross', 'receive', Math.max(seg(t, 7.8, 8.5), warm)), tilt: lerp(12, -4, warm), t: clock, cut: s.tone(0.8) });
  void m;
  // Prometheus: in on tiptoe, lights the stalk, leaps down through the clouds, and hands it over
  let px: number, py: number, face: 1 | -1 = 1, pose: Partial<Body> = {};
  if (t < 3) { const k = seg(t, 0, 2.6); px = lerp(0.2, 0.86, k); py = -0.16; pose = { ...walk(t * 0.7, 0.6), drop: 8, lean: 22 }; }
  else if (t < 4.4) { px = 0.86; py = -0.16; pose = { reach: [forge[0] - 0.01, -0.33], lean: 10 }; }
  else if (t < 7.6) { const k = seg(t, 4.4, 7.6); px = lerp(0.86, 0.66, k); py = lerp(-0.16, GROUND, ease(k)); face = -1; pose = { ...walk(t * 1.2, 1.2), lean: 10 }; }
  else { px = 0.62; py = GROUND; face = -1; pose = { reach: [lerp(0.6, 0.53, seg(t, 7.6, 8.6)), GROUND - 0.14] }; }
  const p = person(c, { x: px, y: py, h: 0.32, face, robe: 'short', beard: true, hold: 'stalk', ...pose, cut: s.tone(0.8), t: clock });
  const lit = seg(t, 3.6, 4) * (1 - seg(t, 8.6, 9));
  if (lit > 0 && p.tip) {
    fire(c, p.tip[0], p.tip[1], 0.04, clock, { sparks: s.still ? 0 : 6, glowK: 0.6 });
    if (t > 4.4 && t < 7.6) sparks(c, p.tip[0], p.tip[1], 0.08, clock, s.still ? 0 : 10, [255, 210, 130]);
  }
  s.spill(down > 0.5 ? camp[0] : forge[0], down > 0.5 ? GROUND - 0.1 : -0.3, 0.6, [255, 170, 90]);
};

/** V. The cities: they gather and build, but without the art of living together they fall out, and scatter. */
const PEOPLE: [number, number][] = [[0.3, 1], [0.46, -1], [0.66, 1], [0.84, -1], [1.0, -1]];
const theCities: SceneFn = (s) => {
  const { t, c, clock } = s;
  s.cam(s.W / 2, 0.5, 1.04);
  const fall = ease(seg(t, 6.2, 8.6));
  s.backdrop({ mood: 'dusk', to: 'night', k: fall * 0.7, x: 0.62, y: 0.4, r: 1.6 });
  c.fillStyle = s.tone(0.55); mountains(c, -0.3, s.W + 0.3, 0.54, 0.14, 2, 1.3, 4);
  c.fillStyle = s.tone(0.28); town(c, 0.05, s.W - 0.05, 0.66, 0.2, 5, ease(seg(t, 0.2, 3.4)), fall, s.tone(0.45));
  c.fillStyle = s.tone(0.12); c.fillRect(-0.3, GROUND, s.W + 0.6, 0.5);
  fire(c, 0.62, GROUND - 0.005, 0.07 * (1 - fall * 0.7), clock, { logs: s.tone(0.05), sparks: s.still ? 0 : 6 });
  // the quarrel: two shove, a third raises a stick; red sparks of anger
  const row = ease(seg(t, 3.6, 4.4)) * (1 - seg(t, 7, 7.6));
  const scatter = seg(t, 7.2, 11);
  c.fillStyle = s.ink;
  PEOPLE.forEach(([x, f], i) => {
    const away = (x < 0.62 ? -1 : 1) * (0.2 + 0.6 * scatter);
    const fighting = i === 1 || i === 2;
    const px = x + (scatter > 0 ? away * ease(scatter) : 0) + (fighting ? (i === 1 ? 1 : -1) * 0.03 * row : 0);
    const face: 1 | -1 = scatter > 0 ? (away < 0 ? -1 : 1) : (f as 1 | -1);
    const pose: Partial<Body> = scatter > 0 ? walk(t * 1.1 + i * 0.3, 1.1) : fighting ? { ...gesture('rest', 'fist', row), lean: 12 * row } : i === 3 ? { ...gesture('rest', 'raise', row), hold: 'stick' } : gesture('rest', 'shrug', row);
    person(c, { x: px, y: GROUND, h: 0.28 + (i % 2) * 0.02, face, robe: 'short', beard: i % 2 === 0, ...pose, t: clock + i, cut: s.tone(0.8) });
  });
  if (row > 0) {
    c.strokeStyle = `rgba(210,60,40,${row})`; c.lineWidth = 0.005;
    for (let i = 0; i < 3; i++) {
      const x = 0.56 + i * 0.04, y = 0.48 - (i % 2) * 0.03 + Math.sin(clock * 9 + i) * 0.006;
      c.beginPath(); c.moveTo(x - 0.015, y); c.lineTo(x, y - 0.02); c.lineTo(x + 0.004, y + 0.004); c.lineTo(x + 0.018, y - 0.016); c.stroke();
    }
  }
  // wolves come back to the ruins
  const wolves = seg(t, 8.4, 11);
  if (wolves > 0) {
    beast(c, { kind: 'dog', x: lerp(s.W + 0.15, 0.95, wolves), y: GROUND, h: 0.11, face: -1, phase: clock * 1.2, stride: wolves < 1 ? 1 : 0, head: -10, t: clock, cut: s.tone(0.8) });
    beast(c, { kind: 'dog', x: lerp(-0.15, 0.24, wolves), y: GROUND, h: 0.1, face: 1, phase: clock * 1.2 + 0.4, stride: wolves < 1 ? 1 : 0, head: -10, t: clock, cut: s.tone(0.8) });
  }
};

/** VI. Reverence and justice: Zeus sends Hermes with both, to be given to everyone; the city stands. */
const RING = [0.3, 0.44, 0.58, 0.72, 0.86, 1.0];
const theJustice: SceneFn = (s) => {
  const { t, c, clock } = s;
  const all = ease(seg(t, 9.6, 11.4));
  s.cam(s.W / 2, 0.48 + 0.04 * ease(seg(t, 3, 6)), 1.04);
  s.backdrop({ mood: 'night', to: 'gold', k: ease(seg(t, 6, 12)), x: 0.62, y: 0.2, r: 1.6 });
  c.fillStyle = s.tone(0.55); mountains(c, -0.3, s.W + 0.3, 0.56, 0.14, 2, 1.3, 4);
  c.fillStyle = s.tone(0.28); town(c, 0.05, s.W - 0.05, 0.66, 0.2, 5, all, 0, s.tone(0.45));
  c.fillStyle = s.tone(0.12); c.fillRect(-0.3, GROUND, s.W + 0.6, 0.5);
  // Zeus enthroned on a cloud, speaking to Hermes
  c.fillStyle = s.tone(0.62); cloud(c, 0.24, 0.37, 0.46, 2);
  c.fillStyle = s.ink;
  throne(c, 0.2, 0.34, 0.2, 1);
  const zeus = person(c, { x: 0.22, y: 0.34, h: 0.2, face: 1, ...CHAIR, robe: 'long', beard: true, hat: 'crown', hold: 'bolt', ...gesture('rest', 'point', shown(t, 0.6, 4)), t: clock, cut: s.tone(0.8), mouth: t < 3 && !s.still ? 0.3 + 0.3 * Math.sin(clock * 12) : 0 });
  bubble(c, { x: zeus.head[0] + 0.02, y: zeus.head[1] - 0.14, r: 0.07, wide: 1.5, to: zeus.mouth, k: shown(t, 0.5, 3.4), ink: s.ink, icon: [SCALES, HEART], scale: 0.85 });
  // Hermes flies down, and goes from one to the next
  const fly = ease(seg(t, 2.6, 5.4));
  const visit = seg(t, 5.4, 9.6);
  const vi = Math.min(RING.length - 1, Math.floor(visit * RING.length));
  const hx = fly < 1 ? lerp(0.46, RING[0] - 0.06, fly) : lerp(RING[0] - 0.06, RING[RING.length - 1] - 0.06, visit);
  const hy = fly < 1 ? lerp(0.34, GROUND, fly) : GROUND;
  const hermes = person(c, { x: hx, y: hy - (fly > 0 && fly < 1 ? 0.03 : 0), h: 0.28, face: 1, robe: 'short', hat: 'petasos', wings: true, hold: 'caduceus', ...(fly < 1 ? { leg: [30, 40], leg2: [-20, 30], ...gesture('both') } : visit < 1 ? walk(t * 1.4, 0.8) : gesture('rest', 'both', all)), t: clock, cut: s.tone(0.8) });
  // the two gifts he carries, glowing
  if (t > 2.6 && visit < 1) { glow(c, hermes.hand[0], hermes.hand[1], 0.06, GOLD, 0.9); }
  // everyone receives them: a light settles in each chest, and they turn to one another and join hands
  RING.forEach((x, i) => {
    const got = visit >= 1 ? 1 : ease(seg(visit * RING.length, i + 0.4, i + 0.9));
    const face: 1 | -1 = i < RING.length / 2 ? 1 : -1;
    const near = all;
    const j = person(c, { x: x + (i < 3 ? 1 : -1) * 0.0 * near, y: GROUND, h: 0.26 + (i % 2) * 0.02, face: got > 0.5 ? face : (i % 2 ? 1 : -1), robe: 'short', beard: i % 3 === 0, hair: i % 3 === 1 ? 'curls' : null, ...(near > 0 ? { reach: [x + face * 0.06, GROUND - 0.12] as P, reach2: [x - face * 0.06, GROUND - 0.12] as P } : got > 0 ? gesture('cross', 'receive', got) : gesture('cross')), tilt: lerp(14, 0, got), t: clock + i, cut: s.tone(0.8) });
    if (got > 0) glow(c, j.chest[0], j.chest[1], 0.05, GOLD, got * 0.85);
  });
  if (all > 0) thread(c, RING.map((x) => [x, GROUND - 0.12] as P), all, GOLD, 0.004, { bead: false, curve: 0.02 });
  s.spill(0.62, GROUND - 0.2, 0.4 + 0.4 * all, [255, 210, 130]);
};

export const prometheus: StoryVisuals = {
  id: 'prometheus',
  aspect: 1.25,
  loop: false,
  scenes: [theMaking, theGifts, theForgotten, theTheft, theCities, theJustice],
  stills: [9.6, 9.6, 7, 9.4, 5, 12],
};
