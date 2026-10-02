import { seg, ease, easeOut, pulse, pop, lerp, hash, noise, css, mixRGB, type RGB, type Stage, type SceneFn, type StoryVisuals } from '../puppet/theatre';
import { person, walk, gesture, mixA, CHAIR, type Body, type Joints, type Gesture } from '../puppet/figure';
import { bird } from '../puppet/beasts';
import { glow, emit, sparks, sun, water, sound, fire } from '../puppet/fx';
import { bubble, shown, Q, BANG, EQ, STAR, LAUREL, SCROLL, SUN, TREE, HEART, LINES, HAND, ARROW, HEAD, type Icon } from '../puppet/bubbles';
import { palm } from '../puppet/scenery';

/**
 * "The invention of writing" (Phaedrus 274c–275d): Theuth, the ibis-headed
 * god of Egypt, invents number, geometry, the stars, draughts and dice, and
 * last of all letters; he brings letters to King Thamus as a cure for
 * forgetting; the king answers that they will empty men's memories and only
 * make them look wise; and Socrates finds that written words, like painted
 * figures, keep a solemn silence — or give one unvarying answer.
 *
 * Five sets: Theuth's terrace above the Nile by night, the king's hall, a
 * square under an obelisk, and in Athens a painted colonnade and a library.
 */
type C = CanvasRenderingContext2D;
type P = [number, number];
const TAU = Math.PI * 2;
const DEG = Math.PI / 180;
const GROUND = 0.84;
const GOLD: RGB = [240, 176, 70];
const PALE: RGB = [255, 240, 204];
const SHEET: RGB = [232, 212, 164];
const SEPIA = 'rgba(70,46,26,1)';

const poly = (c: C, pts: P[]) => { c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); c.fill(); };
const disc = (c: C, x: number, y: number, r: number) => { c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); };
/** a four-pointed star in the current fill */
const star4 = (c: C, x: number, y: number, r: number) => { c.beginPath(); c.moveTo(x, y - r); c.quadraticCurveTo(x, y, x + r, y); c.quadraticCurveTo(x, y, x, y + r); c.quadraticCurveTo(x, y, x - r, y); c.quadraticCurveTo(x, y, x, y - r); c.fill(); };
/** a mouth that moves while its owner speaks, from a to b */
const talk = (s: Stage, a: number, b: number) => (s.t > a && s.t < b ? (s.still ? 0.5 : 0.4 + 0.4 * Math.sin(s.clock * 14)) : 0);
/** a picture in a colour of its own */
const tinted = (icon: Icon, color: RGB): Icon => (c) => { c.save(); c.fillStyle = css(color); c.strokeStyle = css(color); icon(c); c.restore(); };

/** Draw on a figure's head in its own units (100 = its height, x towards its face, y up), turned as the head is. */
function onHead(c: C, b: Body, j: Joints, draw: () => void) {
  const u = b.h / 100;
  c.save();
  c.translate(j.head[0], j.head[1]);
  c.scale((b.face ?? 1) * u, -u);
  c.rotate(-((b.lean ?? 0) + (b.tilt ?? 0)) * DEG);
  draw();
  c.restore();
}

/** A camera that eases from one framing to the next: [time, x, y, zoom]. */
function track(s: Stage, keys: [number, number, number, number][]) {
  let x = keys[0][1], y = keys[0][2], z = keys[0][3];
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1], b = keys[i];
    if (s.t >= a[0]) { const k = ease(seg(s.t, a[0], b[0])); x = lerp(a[1], b[1], k); y = lerp(a[2], b[2], k); z = lerp(a[3], b[3], k); }
  }
  s.cam(x, y, z);
}

/* ================================================================ signs */

/** Hieroglyphs, each in a -1..1 box: the letters Theuth brings. */
const G_ANKH: Icon = (c) => { c.lineWidth = 0.2; c.beginPath(); c.ellipse(0, -0.5, 0.26, 0.34, 0, 0, TAU); c.stroke(); c.beginPath(); c.moveTo(-0.58, -0.06); c.lineTo(0.58, -0.06); c.moveTo(0, -0.16); c.lineTo(0, 0.92); c.stroke(); };
const G_EYE: Icon = (c) => {
  c.lineWidth = 0.14;
  c.beginPath(); c.moveTo(-0.9, -0.1); c.quadraticCurveTo(-0.05, -0.7, 0.85, -0.12); c.quadraticCurveTo(-0.05, 0.32, -0.9, -0.1); c.stroke();
  disc(c, -0.02, -0.14, 0.2);
  c.beginPath(); c.moveTo(-0.85, -0.6); c.quadraticCurveTo(0, -0.95, 0.85, -0.58); c.stroke();
  c.beginPath(); c.moveTo(-0.12, 0.18); c.lineTo(-0.28, 0.85); c.moveTo(0.22, 0.16); c.quadraticCurveTo(0.42, 0.8, 0.8, 0.6); c.stroke();
};
const G_WATER: Icon = (c) => { c.lineWidth = 0.15; c.beginPath(); for (let i = 0; i <= 8; i++) c.lineTo(-0.9 + i * 0.225, i % 2 ? -0.16 : 0.16); c.stroke(); };
const G_REED: Icon = (c) => { c.beginPath(); c.moveTo(-0.05, 0.92); c.quadraticCurveTo(0.42, 0.1, 0.12, -0.92); c.quadraticCurveTo(-0.32, -0.15, -0.05, 0.92); c.fill(); };
const G_OWL: Icon = (c) => {
  c.beginPath(); c.ellipse(0.05, 0.2, 0.36, 0.55, 0.15, 0, TAU); c.fill();
  disc(c, -0.12, -0.52, 0.3);
  poly(c, [[0.2, 0.6], [0.6, 0.92], [0.05, 0.86]]);
  c.lineWidth = 0.1; c.beginPath(); c.moveTo(-0.15, 0.7); c.lineTo(-0.2, 0.95); c.stroke();
};
const G_MOUTH: Icon = (c) => { c.beginPath(); c.ellipse(0, 0, 0.88, 0.3, 0, 0, TAU); c.fill(); };
const G_BREAD: Icon = (c) => { c.beginPath(); c.arc(0, 0.35, 0.72, Math.PI, 0); c.closePath(); c.fill(); };
const G_VIPER: Icon = (c) => {
  c.lineWidth = 0.18; c.beginPath(); c.moveTo(-0.9, 0.35); c.quadraticCurveTo(-0.2, 0.55, 0.2, 0.3); c.quadraticCurveTo(0.6, 0.1, 0.55, -0.3); c.stroke();
  c.beginPath(); c.ellipse(0.62, -0.42, 0.2, 0.13, -0.3, 0, TAU); c.fill();
  c.lineWidth = 0.08; c.beginPath(); c.moveTo(0.55, -0.52); c.lineTo(0.48, -0.78); c.stroke();
};
const G_SUN: Icon = (c) => { c.lineWidth = 0.16; c.beginPath(); c.arc(0, 0, 0.62, 0, TAU); c.stroke(); disc(c, 0, 0, 0.18); };
const G_BASKET: Icon = (c) => { c.beginPath(); c.arc(0, -0.05, 0.78, 0, Math.PI); c.closePath(); c.fill(); c.lineWidth = 0.12; c.beginPath(); c.arc(0.55, 0.25, 0.25, -0.5 * Math.PI, 0.5 * Math.PI); c.stroke(); };
const G_ARM: Icon = (c) => poly(c, [[-0.9, -0.05], [0.35, -0.12], [0.85, -0.25], [0.92, -0.08], [0.5, 0.06], [0.75, 0.25], [0.3, 0.22], [-0.9, 0.18]]);
const G_CHICK: Icon = (c) => {
  c.beginPath(); c.ellipse(0, 0.1, 0.42, 0.38, 0, 0, TAU); c.fill();
  disc(c, 0.32, -0.42, 0.22);
  poly(c, [[0.5, -0.45], [0.74, -0.38], [0.5, -0.33]]);
  c.lineWidth = 0.09; c.beginPath(); c.moveTo(-0.1, 0.45); c.lineTo(-0.15, 0.9); c.moveTo(0.15, 0.45); c.lineTo(0.2, 0.9); c.stroke();
};
const GLYPHS: Icon[] = [G_ANKH, G_EYE, G_WATER, G_OWL, G_REED, G_SUN, G_VIPER, G_BREAD, G_CHICK, G_MOUTH, G_ARM, G_BASKET];
/** sign number i, in sepia at (x, y), `size` its half height, `k` how far it has been written (0..1) */
function sign(c: C, i: number, x: number, y: number, size: number, k = 1, color = SEPIA) {
  if (k <= 0) return;
  c.save(); c.translate(x, y); c.scale(size * pop(k), size * pop(k));
  c.fillStyle = color; c.strokeStyle = color; c.lineCap = 'round'; c.lineJoin = 'round';
  GLYPHS[((i * 7 + 2) % GLYPHS.length + GLYPHS.length) % GLYPHS.length](c);
  c.restore();
}

/** An open papyrus centred on (x, y), its rollers at the ends; `n` of its signs written, glowing with `light`. */
function sheet(s: Stage, x: number, y: number, w: number, h: number, n: number, light: number, rows = 3, cols = 5) {
  const c = s.c;
  if (light > 0) glow(c, x, y, w * 1.25, GOLD, 0.7 * light);
  c.fillStyle = css(mixRGB(SHEET, PALE, light * 0.6));
  c.fillRect(x - w / 2, y - h / 2, w, h);
  const cw = w / (cols + 0.4), rh = h / (rows + 0.3), sz = Math.min(cw, rh) * 0.36;
  for (let i = 0; i < rows * cols; i++) {
    const r = Math.floor(i / cols), q = i % cols;
    sign(c, i, x - w / 2 + cw * (q + 0.7), y - h / 2 + rh * (r + 0.65), sz, Math.min(1, n - i));
  }
  c.fillStyle = s.ink;
  for (const sx of [-1, 1]) { c.beginPath(); c.roundRect(x + sx * w / 2 - h * 0.08, y - h * 0.62, h * 0.16, h * 1.24, h * 0.08); c.fill(); }
}

/** A papyrus hanging from its top roller at (x, y): `len` of it unrolled, `w` wide, its signs in columns. */
function hanging(s: Stage, x: number, y: number, w: number, len: number, n: number, light: number) {
  const c = s.c;
  if (light > 0) glow(c, x, y + len / 2, Math.max(w, len) * 1.2, GOLD, 0.75 * light);
  c.fillStyle = css(mixRGB(SHEET, PALE, light * 0.7));
  c.fillRect(x - w / 2, y, w, len);
  const cols = 2, cw = w / cols, step = cw * 0.95;
  for (let i = 0; i < 12; i++) {
    const r = Math.floor(i / cols), q = i % cols, gy = y + step * (r + 0.6);
    if (gy + cw * 0.3 > y + len) continue;
    sign(c, i + 3, x - w / 2 + cw * (q + 0.5), gy, cw * 0.3, Math.min(1, n - i));
  }
  c.fillStyle = s.ink;
  c.beginPath(); c.roundRect(x - w * 0.62, y - w * 0.06, w * 1.24, w * 0.12, w * 0.06); c.fill();
  if (len > w * 0.15) { c.beginPath(); c.roundRect(x - w * 0.62, y + len - w * 0.06, w * 1.24, w * 0.12, w * 0.06); c.fill(); }
}

/** A rolled papyrus lying from a to b, with a tie round its middle. */
function rolled(s: Stage, a: P, b: P, r: number, light = 0) {
  const c = s.c;
  const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
  if (light > 0) glow(c, mx, my, Math.hypot(b[0] - a[0], b[1] - a[1]) * 1.1, GOLD, 0.6 * light);
  c.save(); c.lineCap = 'round';
  c.strokeStyle = s.ink; c.lineWidth = r * 2.4; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
  c.strokeStyle = css(mixRGB(SHEET, PALE, light)); c.lineWidth = r * 1.7; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
  c.fillStyle = 'rgba(176,64,44,1)'; disc(c, mx, my, r * 0.9);
  c.restore();
}

/** Golden rays turning slowly behind a light. */
function rays(c: C, x: number, y: number, r0: number, r1: number, k: number, time: number, n = 16) {
  if (k <= 0) return;
  c.save(); c.translate(x, y); c.rotate(time * 0.08);
  c.fillStyle = css([255, 214, 130], 0.24 * k);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU, len = r1 * (0.7 + 0.3 * Math.sin(i * 2.3 + time * 0.9));
    c.beginPath(); c.moveTo(Math.cos(a - 0.06) * r0, Math.sin(a - 0.06) * r0); c.lineTo(Math.cos(a) * len, Math.sin(a) * len); c.lineTo(Math.cos(a + 0.06) * r0, Math.sin(a + 0.06) * r0); c.closePath(); c.fill();
  }
  c.restore();
}

/* ================================================================ Egypt */

/** A pyramid: a lit face and a shaded one. */
function pyramid(c: C, x: number, y: number, w: number, h: number, lit: string, shade: string, cap?: string) {
  c.fillStyle = lit; poly(c, [[x - w / 2, y], [x, y - h], [x + w / 2, y]]);
  c.fillStyle = shade; poly(c, [[x, y - h], [x + w / 2, y], [x + w * 0.14, y]]);
  if (cap) { c.fillStyle = cap; poly(c, [[x - w * 0.045, y - h * 0.91], [x, y - h], [x + w * 0.045, y - h * 0.91]]); }
}
/** An obelisk on its plinth, signs cut down its face and its tip gilded. */
function obelisk(c: C, x: number, y: number, h: number, cut: string, tip: string) {
  const w = h * 0.085, cap = h * 0.075;
  c.fillRect(x - w * 0.95, y - h * 0.05, w * 1.9, h * 0.05);
  poly(c, [[x - w / 2, y - h * 0.05], [x - w * 0.34, y - h + cap], [x + w * 0.34, y - h + cap], [x + w / 2, y - h * 0.05]]);
  c.save();
  c.fillStyle = tip; poly(c, [[x - w * 0.34, y - h + cap], [x, y - h], [x + w * 0.34, y - h + cap]]);
  c.fillStyle = cut;
  for (let i = 0; i < 9; i++) {
    const yy = y - h * 0.84 + i * h * 0.085, ww = w * (0.28 - i * 0.004);
    if (i % 3 === 0) disc(c, x, yy, ww * 0.5);
    else if (i % 3 === 1) c.fillRect(x - ww * 0.6, yy - h * 0.006, ww * 1.2, h * 0.012);
    else poly(c, [[x - ww * 0.55, yy + h * 0.012], [x, yy - h * 0.018], [x + ww * 0.55, yy + h * 0.012]]);
  }
  c.restore();
}
/** A temple gateway: two sloping towers and the gate between them. */
function pylon(c: C, x: number, y: number, w: number, h: number, cut: string) {
  const tw = w * 0.4;
  for (const sx of [-1, 1]) {
    const cx = x + sx * (w / 2 - tw / 2);
    poly(c, [[cx - tw / 2, y], [cx - tw * 0.4, y - h], [cx + tw * 0.4, y - h], [cx + tw / 2, y]]);
    c.fillRect(cx - tw * 0.45, y - h * 1.06, tw * 0.9, h * 0.07);
  }
  c.fillRect(x - w * 0.12, y - h * 0.62, w * 0.24, h * 0.62);
  c.fillRect(x - w * 0.14, y - h * 0.68, w * 0.28, h * 0.07);
  c.save(); c.fillStyle = cut; c.fillRect(x - w * 0.055, y - h * 0.46, w * 0.11, h * 0.46); c.restore();
}
/** A clump of papyrus: stalks, each crowned with its umbel. */
function reeds(c: C, x: number, y: number, h: number, t: number, n = 6, seed = 0) {
  c.strokeStyle = c.fillStyle;
  for (let i = 0; i < n; i++) {
    const v = n > 1 ? i / (n - 1) - 0.5 : 0;
    const hh = h * (0.7 + 0.3 * hash(i, seed));
    const bx = x + v * h * 0.4;
    const sway = Math.sin(t * 1.1 + i * 1.7 + seed) * h * 0.035;
    const tx = bx + v * h * 0.3 + sway, ty = y - hh;
    c.lineWidth = h * 0.02;
    c.beginPath(); c.moveTo(bx, y); c.quadraticCurveTo(bx + v * h * 0.04, y - hh * 0.5, tx, ty); c.stroke();
    const a = -Math.PI / 2 + v * 0.9 + sway / h;
    c.beginPath(); c.moveTo(tx, ty); c.arc(tx, ty, h * 0.12, a - 0.62, a + 0.62); c.closePath(); c.fill();
  }
}
/** A papyrus column: a bundle of stems tied at the neck, opening into a flower. */
function column(c: C, x: number, y: number, h: number, w: number, cut: string) {
  c.fillRect(x - w * 0.78, y - h * 0.03, w * 1.56, h * 0.03);
  const top = y - h * 0.8;
  c.beginPath();
  c.moveTo(x - w * 0.45, y - h * 0.03);
  c.quadraticCurveTo(x - w * 0.58, y - h * 0.12, x - w * 0.5, y - h * 0.2);
  c.lineTo(x - w * 0.42, top); c.lineTo(x + w * 0.42, top); c.lineTo(x + w * 0.5, y - h * 0.2);
  c.quadraticCurveTo(x + w * 0.58, y - h * 0.12, x + w * 0.45, y - h * 0.03);
  c.closePath(); c.fill();
  c.beginPath();
  c.moveTo(x - w * 0.42, top);
  c.bezierCurveTo(x - w * 0.5, top - h * 0.06, x - w * 1.05, top - h * 0.1, x - w * 0.95, top - h * 0.15);
  c.lineTo(x + w * 0.95, top - h * 0.15);
  c.bezierCurveTo(x + w * 1.05, top - h * 0.1, x + w * 0.5, top - h * 0.06, x + w * 0.42, top);
  c.closePath(); c.fill();
  c.fillRect(x - w * 0.55, top - h * 0.2, w * 1.1, h * 0.05);
  c.save(); c.strokeStyle = cut; c.lineWidth = w * 0.05;
  for (let i = 0; i < 3; i++) { const yy = top + h * 0.012 + i * h * 0.014; c.beginPath(); c.moveTo(x - w * 0.42, yy); c.lineTo(x + w * 0.42, yy); c.stroke(); }
  for (let i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(x + i * w * 0.24, top + h * 0.06); c.lineTo(x + i * w * 0.27, y - h * 0.2); c.stroke(); }
  for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(x + i * w * 0.12, top - h * 0.005); c.lineTo(x + i * w * 0.36, top - h * 0.14); c.stroke(); }
  c.restore();
}
/** A band of lotus flowers and buds along the top of a wall. */
function frieze(c: C, x0: number, x1: number, y: number, h: number, cut: string) {
  c.fillRect(x0, y, x1 - x0, h);
  c.save(); c.fillStyle = cut; c.strokeStyle = cut; c.lineWidth = h * 0.06;
  c.beginPath(); c.moveTo(x0, y + h * 0.12); c.lineTo(x1, y + h * 0.12); c.moveTo(x0, y + h * 0.88); c.lineTo(x1, y + h * 0.88); c.stroke();
  const step = h * 1.1;
  for (let x = x0 + step / 2, i = 0; x < x1; x += step, i++) {
    if (i % 2 === 0) poly(c, [[x, y + h * 0.8], [x - h * 0.28, y + h * 0.3], [x - h * 0.1, y + h * 0.45], [x, y + h * 0.22], [x + h * 0.1, y + h * 0.45], [x + h * 0.28, y + h * 0.3]]);
    else { c.beginPath(); c.ellipse(x, y + h * 0.52, h * 0.1, h * 0.22, 0, 0, TAU); c.fill(); }
  }
  c.restore();
}
/** The winged sun of kingship, its disc in gold. */
function wingedSun(c: C, x: number, y: number, w: number, cut: string) {
  for (const sg of [-1, 1]) {
    c.beginPath();
    c.moveTo(x + sg * w * 0.07, y - w * 0.035);
    c.quadraticCurveTo(x + sg * w * 0.28, y - w * 0.11, x + sg * w * 0.5, y - w * 0.075);
    c.quadraticCurveTo(x + sg * w * 0.42, y, x + sg * w * 0.47, y + w * 0.02);
    c.quadraticCurveTo(x + sg * w * 0.28, y + w * 0.035, x + sg * w * 0.07, y + w * 0.045);
    c.closePath(); c.fill();
    c.save(); c.strokeStyle = cut; c.lineWidth = w * 0.006;
    for (let i = 1; i < 7; i++) { const v = i / 7, xx = x + sg * w * (0.08 + v * 0.38); c.beginPath(); c.moveTo(xx, y - w * (0.04 + v * 0.035)); c.lineTo(xx - sg * w * 0.025, y + w * 0.03); c.stroke(); }
    c.restore();
    // a cobra either side of the disc
    c.beginPath(); c.ellipse(x + sg * w * 0.085, y + w * 0.01, w * 0.016, w * 0.05, sg * 0.2, 0, TAU); c.fill();
  }
  c.save(); c.fillStyle = css(GOLD); disc(c, x, y, w * 0.065); c.restore();
}
/** A throne of Egypt on lion's legs, a sitter of height h on it at x (feet at y). */
function throne(c: C, x: number, y: number, h: number, face: 1 | -1, cut: string) {
  c.save(); c.translate(x, y); c.scale(face, 1);
  const seat = h * 0.25;
  for (const lx of [h * 0.1, -h * 0.13]) {
    poly(c, [[lx - h * 0.024, -seat], [lx + h * 0.024, -seat], [lx + h * 0.016, -h * 0.05], [lx - h * 0.02, -h * 0.05]]);
    c.beginPath(); c.ellipse(lx + h * 0.014, -h * 0.022, h * 0.038, h * 0.024, 0, 0, TAU); c.fill();
  }
  c.fillRect(-h * 0.17, -seat - h * 0.035, h * 0.31, h * 0.045);
  poly(c, [[-h * 0.17, -seat], [-h * 0.215, -h * 0.66], [-h * 0.145, -h * 0.68], [-h * 0.11, -seat]]);
  c.fillRect(-h * 0.13, -seat, h * 0.23, h * 0.1);
  c.strokeStyle = cut; c.lineWidth = h * 0.006;
  c.strokeRect(-h * 0.115, -seat + h * 0.014, h * 0.2, h * 0.07);
  c.beginPath(); c.moveTo(-h * 0.015, -seat + h * 0.08); c.lineTo(-h * 0.015, -seat + h * 0.035); c.stroke();
  c.beginPath(); c.arc(-h * 0.015, -seat + h * 0.028, h * 0.011, 0, TAU); c.stroke();
  c.restore();
}
/** A great fan of feathers on a pole, from the bearer's hands at `from` to its head at `to`. */
function flabellum(c: C, from: P, to: P, r: number, cut: string) {
  c.lineWidth = r * 0.1; c.lineCap = 'round'; c.strokeStyle = c.fillStyle;
  c.beginPath(); c.moveTo(from[0], from[1]); c.lineTo(to[0], to[1]); c.stroke();
  const a = Math.atan2(to[1] - from[1], to[0] - from[0]);
  c.save(); c.translate(to[0], to[1]); c.rotate(a);
  c.beginPath(); c.moveTo(0, -r); c.arc(0, 0, r, -Math.PI / 2, Math.PI / 2); c.closePath(); c.fill();
  for (let i = 0; i < 9; i++) { const b = -Math.PI / 2 + (i + 0.5) * Math.PI / 9; disc(c, Math.cos(b) * r, Math.sin(b) * r, r * 0.13); }
  c.strokeStyle = cut; c.lineWidth = r * 0.03;
  for (let i = 1; i < 9; i++) { const b = -Math.PI / 2 + i * Math.PI / 9; c.beginPath(); c.moveTo(Math.cos(b) * r * 0.2, Math.sin(b) * r * 0.2); c.lineTo(Math.cos(b) * r * 0.92, Math.sin(b) * r * 0.92); c.stroke(); }
  c.restore();
}
/** A cat sitting up, as the Egyptians carved them; its tail twitches. */
function cat(c: C, x: number, y: number, h: number, face: 1 | -1, t: number, cut: string) {
  c.save(); c.translate(x, y); c.scale(face * h, h);
  c.beginPath(); c.ellipse(-0.14, -0.2, 0.22, 0.2, 0, 0, TAU); c.fill();
  c.beginPath(); c.moveTo(-0.32, 0); c.quadraticCurveTo(-0.34, -0.45, -0.06, -0.64); c.lineTo(0.12, -0.6); c.quadraticCurveTo(0.17, -0.3, 0.16, 0); c.closePath(); c.fill();
  c.beginPath(); c.ellipse(0.06, -0.74, 0.14, 0.13, 0, 0, TAU); c.fill();
  poly(c, [[-0.06, -0.8], [-0.04, -1.0], [0.06, -0.84]]);
  poly(c, [[0.05, -0.84], [0.14, -1.0], [0.18, -0.8]]);
  c.beginPath(); c.ellipse(0.18, -0.7, 0.06, 0.045, 0, 0, TAU); c.fill();
  const tw = Math.sin(t * 2.3) * 0.1;
  c.strokeStyle = c.fillStyle; c.lineWidth = 0.06; c.lineCap = 'round';
  c.beginPath(); c.moveTo(-0.3, -0.04); c.quadraticCurveTo(-0.05, 0.03, 0.14 + tw, -0.04 - Math.abs(tw) * 0.8); c.stroke();
  c.fillStyle = cut; c.beginPath(); c.ellipse(0.1, -0.76, 0.03, 0.018, 0, 0, TAU); c.fill();
  c.strokeStyle = cut; c.lineWidth = 0.02; c.beginPath(); c.moveTo(-0.04, -0.6); c.quadraticCurveTo(0.06, -0.56, 0.13, -0.6); c.stroke();
  c.restore();
}
/** A Nile boat under its great slanting sail. */
function felucca(c: C, x: number, y: number, s: number) {
  c.beginPath(); c.moveTo(x - s * 0.5, y - s * 0.1); c.quadraticCurveTo(x, y + s * 0.1, x + s * 0.55, y - s * 0.13); c.lineTo(x + s * 0.4, y - s * 0.05); c.lineTo(x - s * 0.4, y - s * 0.05); c.closePath(); c.fill();
  c.lineWidth = s * 0.03; c.strokeStyle = c.fillStyle;
  c.beginPath(); c.moveTo(x, y - s * 0.06); c.lineTo(x, y - s * 0.6); c.moveTo(x - s * 0.42, y - s * 0.18); c.lineTo(x + s * 0.32, y - s * 1.0); c.stroke();
  poly(c, [[x - s * 0.36, y - s * 0.22], [x + s * 0.3, y - s * 0.96], [x + s * 0.24, y - s * 0.16]]);
}

/* ================================================================ the players */

/** Theuth: the ibis-headed god in a long robe, the moon's disc in its crescent on his head. */
function theuth(s: Stage, b: Partial<Body>, moon = 1): Joints {
  const c = s.c;
  const body: Body = { x: 0, y: GROUND, h: 0.36, face: 1, robe: 'long', head: 'ibis', cut: s.tone(0.8), t: s.clock, ...b };
  c.fillStyle = s.ink; c.strokeStyle = s.ink;
  const j = person(c, body);
  onHead(c, body, j, () => {
    // a heavier bill, so the ibis reads even on a card
    c.fillStyle = s.ink; c.strokeStyle = s.ink; c.lineCap = 'round';
    c.lineWidth = 3.4; c.beginPath(); c.moveTo(2.6, 2.6); c.quadraticCurveTo(14, 3.4, 18.4, -10.6); c.stroke();
    // the crescent and the disc of the moon
    c.lineWidth = 2.2; c.beginPath(); c.arc(-1, 11, 5.2, Math.PI * 1.1, Math.PI * 1.9); c.stroke();
    glow(c, -1, 12.4, 14, PALE, 0.6 * moon);
    c.fillStyle = css(mixRGB(PALE, GOLD, 0.3)); disc(c, -1, 12.4, 3.5);
  });
  return j;
}

const KING_X = 1.0, DAIS = GROUND - 0.05;
/** The crook of kingship: a staff banded in gold, its hook curling at the top. */
function crook(s: Stage, hand: P, face: 1 | -1, h: number) {
  const c = s.c, u = h / 100;
  const top: P = [hand[0] - face * 3 * u, hand[1] - 24 * u], bot: P = [hand[0] + face * 1.2 * u, hand[1] + 9 * u];
  c.save(); c.strokeStyle = s.ink; c.lineCap = 'round'; c.lineWidth = 2.4 * u;
  c.beginPath(); c.moveTo(bot[0], bot[1]); c.lineTo(top[0], top[1]);
  c.quadraticCurveTo(top[0] - face * 0.6 * u, top[1] - 7 * u, top[0] + face * 4 * u, top[1] - 6.6 * u);
  c.quadraticCurveTo(top[0] + face * 7.4 * u, top[1] - 4.6 * u, top[0] + face * 5.8 * u, top[1] - 1.2 * u);
  c.stroke();
  const len = Math.hypot(top[0] - bot[0], top[1] - bot[1]), nx = -(top[1] - bot[1]) / len, ny = (top[0] - bot[0]) / len;
  c.strokeStyle = css(GOLD); c.lineWidth = 1.1 * u;
  for (let i = 1; i < 6; i++) { const v = i / 6, px = lerp(bot[0], top[0], v), py = lerp(bot[1], top[1], v); c.beginPath(); c.moveTo(px - nx * 1.3 * u, py - ny * 1.3 * u); c.lineTo(px + nx * 1.3 * u, py + ny * 1.3 * u); c.stroke(); }
  c.restore();
}
/** King Thamus, enthroned: the striped headcloth, the cobra at his brow, the false beard, the crook. */
function thamus(s: Stage, b: Partial<Body>): Joints {
  const c = s.c;
  const body: Body = { x: KING_X, y: DAIS, h: 0.36, face: -1, robe: 'long', ...CHAIR, arm2: [40, 100], cut: s.tone(0.8), t: s.clock, ...b };
  c.fillStyle = s.ink; c.strokeStyle = s.ink;
  const j = person(c, body);
  const cut = s.tone(0.8);
  onHead(c, body, j, () => {
    c.fillStyle = s.ink;
    const nemes = new Path2D();
    nemes.moveTo(6.2, 4.2);
    nemes.quadraticCurveTo(6.8, 10.8, -0.5, 11);
    nemes.quadraticCurveTo(-8.8, 10.8, -9.6, 3);
    nemes.lineTo(-13.4, -11); nemes.lineTo(-7.6, -12.2); nemes.lineTo(-3.6, -2.6); nemes.lineTo(-1.6, -2.4);
    nemes.lineTo(-0.6, -16); nemes.lineTo(3.8, -16); nemes.lineTo(2.6, -1); nemes.lineTo(4.6, 2.8);
    nemes.closePath();
    c.fill(nemes);
    c.save(); c.clip(nemes); c.strokeStyle = cut; c.lineWidth = 0.8;
    for (let y = -16; y < 12; y += 2.4) { c.beginPath(); c.moveTo(-15, y - 1); c.lineTo(9, y + 1); c.stroke(); }
    c.restore();
    // the false beard, plaited
    c.fillStyle = s.ink;
    c.beginPath(); c.moveTo(4.4, -6.4); c.lineTo(7.4, -6.8); c.lineTo(7.8, -15); c.quadraticCurveTo(6.8, -16.4, 5.2, -15.4); c.closePath(); c.fill();
    c.strokeStyle = cut; c.lineWidth = 0.6;
    for (const y of [-9, -11.4, -13.6]) { c.beginPath(); c.moveTo(4.8, y); c.lineTo(7.6, y); c.stroke(); }
    // the cobra rearing at his brow, in gold
    c.fillStyle = css(GOLD);
    c.beginPath(); c.moveTo(5.4, 4.6); c.quadraticCurveTo(8.6, 5.4, 8, 9); c.quadraticCurveTo(7.4, 10.8, 6.2, 9.6); c.quadraticCurveTo(6.8, 7.6, 5, 5.8); c.closePath(); c.fill();
  });
  crook(s, j.hand2, body.face ?? -1, body.h);
  return j;
}

/** Socrates: bald crown, snub nose, a full beard, a plain long cloak. */
const socrates = (s: Stage, b: Partial<Body>): Body => ({ x: 0, y: GROUND, h: 0.36, face: 1, robe: 'long', beard: true, head: 'bald', cut: s.tone(0.8), t: s.clock, ...b });

/* ================================================================ I. Theuth */

/** The arts before letters, as pictures of light: each in a -1..1 box, moving with `time`. */
type Art = (c: C, time: number) => void;
const ABACUS: Art = (c, time) => {
  c.lineWidth = 0.1; c.strokeRect(-0.9, -0.72, 1.8, 1.44);
  for (let r = 0; r < 3; r++) {
    const y = -0.36 + r * 0.36;
    c.lineWidth = 0.05; c.beginPath(); c.moveTo(-0.9, y); c.lineTo(0.9, y); c.stroke();
    for (let i = 0; i < 3; i++) { c.beginPath(); c.ellipse(-0.7 + i * 0.21, y, 0.09, 0.13, 0, 0, TAU); c.fill(); }
    // one bead goes across as it is counted
    const m = ease(0.5 + 0.5 * Math.sin(time * 1.9 + r * 2.2));
    c.beginPath(); c.ellipse(lerp(-0.07, 0.7, m), y, 0.09, 0.13, 0, 0, TAU); c.fill();
  }
};
const GEOMETRY: Art = (c, time) => {
  c.lineWidth = 0.09;
  c.beginPath(); c.moveTo(-0.85, 0.78); c.lineTo(0.5, 0.78); c.lineTo(-0.85, -0.5); c.closePath(); c.stroke();
  c.lineWidth = 0.05; c.beginPath(); c.moveTo(-0.85, 0.58); c.lineTo(-0.65, 0.58); c.lineTo(-0.65, 0.78); c.stroke();
  // compasses, turning on their point, drawing a circle
  const o: P = [0.25, 0.02], r = 0.5;
  const sweep = Math.min(TAU, (time * 2.2) % (TAU + 2));
  const a = -Math.PI / 2 + sweep;
  c.lineWidth = 0.07; c.beginPath(); c.arc(o[0], o[1], r, -Math.PI / 2, a); c.stroke();
  const tip: P = [o[0] + Math.cos(a) * r, o[1] + Math.sin(a) * r];
  const n: P = [(tip[1] - o[1]) / r, -(tip[0] - o[0]) / r];
  const hinge: P = [(o[0] + tip[0]) / 2 + n[0] * 0.45, (o[1] + tip[1]) / 2 + n[1] * 0.45];
  c.lineWidth = 0.08; c.beginPath(); c.moveTo(o[0], o[1]); c.lineTo(hinge[0], hinge[1]); c.lineTo(tip[0], tip[1]); c.stroke();
  disc(c, hinge[0], hinge[1], 0.08); disc(c, tip[0], tip[1], 0.06);
};
const ASTRONOMY: Art = (c, time) => {
  c.lineWidth = 0.08; c.beginPath(); c.arc(0, 0.05, 0.36, 0, TAU); c.stroke();
  c.save(); c.globalAlpha *= 0.45; disc(c, 0, 0.05, 0.36); c.restore();
  c.save(); c.translate(0, 0.05); c.rotate(-0.4);
  c.lineWidth = 0.05; c.beginPath(); c.ellipse(0, 0, 0.9, 0.3, 0, 0, TAU); c.stroke();
  const a = time * 1.3;
  disc(c, Math.cos(a) * 0.9, Math.sin(a) * 0.3, 0.11);
  c.restore();
  c.lineWidth = 0.13; c.beginPath(); c.arc(-0.62, -0.62, 0.2, Math.PI * 0.55, Math.PI * 1.45); c.stroke();
  star4(c, 0.62, -0.68, 0.17); star4(c, 0.78, 0.62, 0.13); star4(c, -0.8, 0.58, 0.11);
};
const DRAUGHTS: Art = (c, time) => {
  const n = 4, sz = 1.6 / n;
  c.lineWidth = 0.07; c.strokeRect(-0.8, -0.8, 1.6, 1.6);
  c.save(); c.globalAlpha *= 0.45;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if ((i + j) % 2) c.fillRect(-0.8 + i * sz, -0.8 + j * sz, sz, sz);
  c.restore();
  const cell = (i: number, j: number): P => [-0.8 + (i + 0.5) * sz, -0.8 + (j + 0.5) * sz];
  // one man jumps the other, and back again
  const k = (time * 0.6) % 2, hop = ease(Math.min(1, (k % 1) * 1.6));
  const [p0, p1] = k < 1 ? [cell(0, 3), cell(2, 1)] : [cell(2, 1), cell(0, 3)];
  const mid = cell(1, 2);
  c.lineWidth = 0.08; c.beginPath(); c.arc(mid[0], mid[1], sz * 0.3, 0, TAU); c.stroke();
  disc(c, lerp(p0[0], p1[0], hop), lerp(p0[1], p1[1], hop) - Math.sin(hop * Math.PI) * 0.5, sz * 0.36);
};
const PIPS: Record<number, P[]> = {
  1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
  5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]],
};
const DICE: Art = (c, time) => {
  ([[-0.42, 0.22, 0], [0.4, -0.14, 1]] as const).forEach(([dx, dy, i]) => {
    const roll = time * 1.5 + i * 2.7, ph = roll % 1;
    const face = 1 + Math.floor(hash(Math.floor(roll), i + 4) * 6);
    const bounce = Math.abs(Math.sin(ph * Math.PI)) * 0.2 * (1 - ph);
    c.save(); c.translate(dx, dy - bounce); c.rotate(Math.sin(roll * 2.1) * 0.25);
    const e = 0.32, d = 0.17;
    c.lineWidth = 0.07;
    c.beginPath(); c.roundRect(-e, -e, e * 2, e * 2, 0.08); c.stroke();
    c.beginPath(); c.moveTo(-e, -e); c.lineTo(-e + d, -e - d); c.lineTo(e + d, -e - d); c.lineTo(e + d, e - d); c.lineTo(e, e); c.moveTo(e, -e); c.lineTo(e + d, -e - d); c.stroke();
    for (const [px, py] of PIPS[face]) disc(c, px * e * 0.55, py * e * 0.55, 0.07);
    c.restore();
  });
};
/** A picture made of light, rising and settling; `k` how far it has come into being. */
function lightPicture(s: Stage, art: Art, x: number, y: number, size: number, k: number, bright: number) {
  if (k <= 0.01) return;
  const c = s.c;
  glow(c, x, y, size * 2.3, GOLD, 0.55 * bright * Math.min(1, k));
  c.save(); c.globalAlpha *= Math.min(1, k * 1.5) * (0.35 + 0.65 * bright);
  c.translate(x, y); c.scale(size * lerp(0.35, 1, Math.min(1, k)), size * lerp(0.35, 1, Math.min(1, k)));
  c.lineCap = 'round'; c.lineJoin = 'round';
  // a darker rim under the light, so the picture holds on a pale sky
  c.fillStyle = 'rgba(120,70,20,0.55)'; c.strokeStyle = 'rgba(120,70,20,0.55)';
  c.save(); c.translate(0.05, 0.05); art(c, s.still ? 1.3 : s.clock); c.restore();
  c.fillStyle = css(PALE); c.strokeStyle = css(PALE);
  art(c, s.still ? 1.3 : s.clock);
  c.restore();
}

const ARTS: { art: Art; at: number; slot: P }[] = [
  { art: ABACUS, at: 1.0, slot: [0.24, 0.34] },
  { art: GEOMETRY, at: 2.6, slot: [0.4, 0.19] },
  { art: ASTRONOMY, at: 4.2, slot: [0.64, 0.12] },
  { art: DRAUGHTS, at: 5.8, slot: [0.88, 0.19] },
  { art: DICE, at: 7.4, slot: [1.04, 0.34] },
];
const LETTERS_AT = 9.0;
const TABLE_X = 0.69, TABLE_TOP = 0.655;
const HANDS: P = [0.62, 0.55];
const LETTERS_POS: P = [0.64, 0.33];

/** The night sky: darker overhead, with stars. */
function nightSky(s: Stage, k: number) {
  const c = s.c;
  const [x0, y0, x1] = s.view();
  const g = c.createLinearGradient(0, Math.min(y0, 0), 0, 0.62);
  g.addColorStop(0, `rgba(16,22,48,${0.6 * k})`); g.addColorStop(1, 'rgba(16,22,48,0)');
  c.fillStyle = g; c.fillRect(x0 - 0.01, y0 - 0.01, x1 - x0 + 0.02, 0.64 - y0);
  for (let i = 0; i < 44; i++) {
    const x = -0.1 + hash(i, 3) * (s.W + 0.2), y = 0.02 + Math.pow(hash(i, 5), 1.4) * 0.52;
    const tw = s.still ? 0.8 : 0.55 + 0.45 * Math.sin(s.clock * (1.3 + hash(i, 7) * 2) + i);
    c.fillStyle = `rgba(255,248,226,${k * tw * (1 - y)})`;
    star4(c, x, y, (0.004 + hash(i, 9) * 0.006) * (0.7 + 0.5 * tw));
  }
}

/** I. Theuth: by night on his terrace above the Nile, the ibis god brings his arts into the world one by one — and last and brightest, letters. */
const theTheuth: SceneFn = (s) => {
  const { t, c, clock } = s;
  const rise = ease(seg(t, LETTERS_AT + 0.4, LETTERS_AT + 2.2));
  const glory = ease(seg(t, LETTERS_AT + 1.6, LETTERS_AT + 3));
  const back = ease(seg(t, 0.3, 7.6)), push = ease(seg(t, LETTERS_AT + 0.6, 12.8));
  s.cam(lerp(lerp(0.6, s.W / 2, back), 0.64, push), lerp(lerp(0.6, 0.5, back), 0.45, push), lerp(lerp(1.24, 1, back), 1.12, push));
  s.backdrop({ mood: 'night', to: 'gold', k: 0.55 * glory, x: 0.64, y: 0.32, r: 1.5 });
  nightSky(s, 1 - 0.75 * glory);
  // the moon, Theuth's own light
  const moon: P = [0.17, 0.2];
  glow(c, moon[0], moon[1], 0.2, [236, 240, 255], 0.5 * (1 - glory * 0.6));
  c.fillStyle = 'rgba(248,246,234,1)'; disc(c, moon[0], moon[1], 0.035);
  // the far bank: pyramids, palms
  pyramid(c, 0.98, 0.6, 0.36, 0.18, s.tone(0.58), s.tone(0.5));
  pyramid(c, 1.2, 0.6, 0.22, 0.11, s.tone(0.6), s.tone(0.53));
  pyramid(c, 0.78, 0.6, 0.15, 0.07, s.tone(0.62), s.tone(0.56));
  c.fillStyle = s.tone(0.48);
  palm(c, 0.06, 0.6, 0.12, clock, 0.1); palm(c, 0.12, 0.6, 0.15, clock + 1, -0.08); palm(c, 1.09, 0.6, 0.13, clock + 2, 0.12);
  c.fillRect(-0.3, 0.585, s.W + 0.6, 0.02);
  // the Nile, the moon's path glittering on it, a boat going down
  water(c, -0.3, s.W + 0.3, 0.605, 0.2, clock, css(mixRGB(s.screen, [52, 70, 110], 0.42)), css(mixRGB(s.screen, [255, 255, 255], 0.5)), 0.004, 3);
  for (let i = 0; i < 9; i++) {
    const v = i / 8, w = (0.012 + 0.03 * v) * (0.6 + 0.4 * Math.sin((s.still ? 0 : clock * 2.6) + i * 1.9));
    c.fillStyle = `rgba(250,248,232,${(0.75 - 0.4 * v) * (1 - glory * 0.5)})`;
    c.fillRect(moon[0] - w / 2 + (hash(i, 6) - 0.5) * 0.02 * v, 0.616 + v * 0.13, w, 0.0035);
  }
  c.fillStyle = s.tone(0.42); felucca(c, 0.34 + 0.012 * t, 0.66 + 0.003 * Math.sin(clock * 1.3), 0.12);
  // reeds at the water's edge
  c.fillStyle = s.tone(0.24); reeds(c, 0.12, 0.78, 0.16, clock, 7, 1); reeds(c, 1.16, 0.78, 0.14, clock, 6, 4);
  // the terrace: its low wall and floor
  c.fillStyle = s.tone(0.15); c.fillRect(-0.3, 0.775, s.W + 0.6, GROUND - 0.775);
  c.fillStyle = s.tone(0.22); c.fillRect(-0.3, 0.77, s.W + 0.6, 0.01);
  c.fillStyle = s.tone(0.08); c.fillRect(-0.3, GROUND, s.W + 0.6, 0.5);
  // the ibis, Theuth's own bird, on the terrace — and off across the moon at the end
  const flyK = seg(t, 10.4, 13);
  if (flyK <= 0) {
    const peck = s.still ? 0 : Math.pow(Math.max(0, Math.sin(clock * 1.6)), 8);
    c.fillStyle = s.ink; c.save(); c.translate(0.98, GROUND); c.rotate(0.35 * peck); bird(c, 0, 0, 0.19, null, -1, 'ibis'); c.restore();
  } else {
    const k = easeOut(flyK);
    const bx = (1 - k) * (1 - k) * 0.98 + 2 * k * (1 - k) * 0.9 + k * k * -0.15, by = (1 - k) * (1 - k) * 0.7 + 2 * k * (1 - k) * 0.05 + k * k * 0.12;
    c.fillStyle = s.ink; bird(c, bx, by, 0.13, clock * 2.2, -1, 'ibis');
  }
  // the table, and what is on it
  c.fillStyle = s.tone(0.04);
  c.fillRect(TABLE_X - 0.13, TABLE_TOP, 0.26, 0.016);
  for (const sx of [-1, 1]) poly(c, [[TABLE_X + sx * 0.1 - 0.008, TABLE_TOP], [TABLE_X + sx * 0.1 + 0.008, TABLE_TOP], [TABLE_X + sx * 0.105 + 0.014, GROUND], [TABLE_X + sx * 0.105 - 0.014, GROUND]]);
  c.fillRect(TABLE_X - 0.1, TABLE_TOP + 0.1, 0.2, 0.008);
  rolled(s, [TABLE_X + 0.03, TABLE_TOP - 0.008], [TABLE_X + 0.1, TABLE_TOP - 0.008], 0.007);
  rolled(s, [TABLE_X + 0.045, TABLE_TOP - 0.02], [TABLE_X + 0.105, TABLE_TOP - 0.02], 0.006);
  // the lamp
  c.fillStyle = s.ink; c.beginPath(); c.ellipse(TABLE_X - 0.08, TABLE_TOP - 0.008, 0.022, 0.008, 0, 0, TAU); c.fill();
  fire(c, TABLE_X - 0.062, TABLE_TOP - 0.012, 0.03, clock, { sparks: s.still ? 0 : 3, glowK: 0.5 });
  // Theuth: works with his hands, and lifts each new art up out of them
  const lift = Math.max(...ARTS.map((a) => pulse(t, a.at - 0.35, a.at + 0.9, 0.35)), seg(t, LETTERS_AT - 0.3, LETTERS_AT + 0.2));
  const work: P = [0.6 + 0.012 * Math.sin(clock * 5.2), 0.645 + 0.006 * Math.cos(clock * 5.2)];
  const triumph = ease(seg(t, LETTERS_AT + 1.4, LETTERS_AT + 2.2));
  const hands: P = [lerp(work[0], HANDS[0], lift), lerp(work[1], HANDS[1], lift)];
  const th = theuth(s, triumph > 0
    ? { x: 0.5, ...gesture('offer', 'both', triumph), lean: lerp(8, -6, triumph), tilt: -22 * triumph }
    : { x: 0.5, lean: 10 - 4 * lift, tilt: lerp(18, -14, lift), reach: hands, reach2: [hands[0] - 0.022, hands[1] + 0.012] });
  void th;
  s.spill(TABLE_X - 0.06, TABLE_TOP - 0.05, 0.35 + 0.4 * glory, [255, 190, 110]);
  // each art comes up out of his hands and goes to its place in the sky
  const dim = ease(seg(t, LETTERS_AT + 0.8, LETTERS_AT + 2));
  ARTS.forEach((a) => {
    const k = seg(t, a.at, a.at + 1.3), e = ease(k);
    if (k <= 0) return;
    const out = 1 + 0.12 * dim;
    const sx = LETTERS_POS[0] + (a.slot[0] - LETTERS_POS[0]) * out, sy = LETTERS_POS[1] + (a.slot[1] - LETTERS_POS[1]) * out;
    const x = lerp(HANDS[0], sx, e), y = lerp(HANDS[1], sy, e) - Math.sin(e * Math.PI) * 0.08;
    const bob = s.still ? 0 : Math.sin(clock * 1.4 + a.at) * 0.006;
    if (k < 1) {
      // a thread of light from his hands to the new thing
      c.save(); c.strokeStyle = css([255, 226, 160], 0.7 * (1 - k)); c.lineWidth = 0.006 * (1 - k * 0.5);
      c.beginPath(); c.moveTo(HANDS[0], HANDS[1]); c.quadraticCurveTo((HANDS[0] + x) / 2, Math.min(HANDS[1], y) - 0.04, x, y); c.stroke(); c.restore();
      sparks(c, x, y, 0.05, clock, s.still ? 0 : 6, [255, 220, 150]);
    }
    lightPicture(s, a.art, x, y + bob, 0.079 * (1 - 0.2 * dim), k * 1.4, (k < 1 ? 1.2 : 0.9) * (1 - 0.5 * dim));
    // a flash as it takes its place
    const land = seg(t, a.at + 1.2, a.at + 1.9);
    if (land > 0 && land < 1) { c.save(); c.translate(x, y + bob); c.rotate(land * 1.5); c.fillStyle = css([255, 248, 224], 1 - land); star4(c, 0, 0, 0.05 + 0.08 * land); c.restore(); }
  });
  // and last, letters: a sheet of signs rises, writes itself, and outshines them all
  if (t > LETTERS_AT) {
    const x = lerp(HANDS[0], LETTERS_POS[0], rise), y = lerp(HANDS[1], LETTERS_POS[1], rise) - Math.sin(rise * Math.PI) * 0.05;
    const w = lerp(0.07, 0.36, rise), h = lerp(0.04, 0.17, rise);
    rays(c, x, y, 0.06, 0.42, glory, clock);
    glow(c, x, y, 0.36 * (0.5 + rise), GOLD, 0.5 + 0.4 * glory);
    if (rise < 1) sparks(c, x, y, 0.08, clock, s.still ? 0 : 10, [255, 226, 160]);
    sheet(s, x, y, w, h, seg(t, LETTERS_AT + 1, LETTERS_AT + 3.2) * 15, 0.5 + 0.5 * glory);
    s.spill(x, y, 0.5 * glory, [255, 214, 140]);
  }
};

/* ================================================================ II. The gift */

/** The king's hall: a frieze of lotus, papyrus columns, the winged sun, light falling from a high window. */
function hall(s: Stage, light: number) {
  const { c, clock } = s;
  c.fillStyle = s.tone(0.46); wingedSun(c, KING_X, 0.21, 0.46, s.tone(0.72));
  c.fillStyle = s.tone(0.34); frieze(c, -0.4, s.W + 0.4, 0.035, 0.065, s.tone(0.72));
  // signs cut in the wall between the columns
  for (let q = 0; q < 3; q++) for (let r = 0; r < 7; r++) sign(c, q * 7 + r, 0.155 + q * 0.045, 0.27 + r * 0.06, 0.015, 1, s.tone(0.6));
  c.fillStyle = s.tone(0.38);
  for (const x of [0.07, 0.33, 1.22]) column(c, x, GROUND, 0.74, 0.07, s.tone(0.6));
  // shafts of light with dust turning in them
  if (light > 0) {
    c.save();
    for (const [x, w] of [[0.36, 0.1], [0.6, 0.06]] as const) {
      const g = c.createLinearGradient(x, 0.1, x + 0.3, GROUND);
      g.addColorStop(0, css([255, 238, 196], 0.34 * light)); g.addColorStop(1, css([255, 238, 196], 0.04 * light));
      c.fillStyle = g; poly(c, [[x, 0.1], [x + w, 0.1], [x + w + 0.3, GROUND], [x + 0.3, GROUND]]);
    }
    if (!s.still) emit(clock, 16, 7, (a, r1, r2) => {
      const v = (r2 + a * 0.25) % 1, x = 0.38 + r1 * 0.08 + v * 0.3, y = 0.1 + v * 0.74;
      c.fillStyle = `rgba(255,244,214,${0.7 * light * Math.sin(Math.PI * a)})`; disc(c, x, y, 0.0028);
    }, 3);
    c.restore();
  }
  c.fillStyle = s.tone(0.1); c.fillRect(-0.4, GROUND, s.W + 0.8, 0.6);
  c.fillStyle = s.tone(0.18); c.fillRect(KING_X - 0.2, GROUND - 0.025, s.W, 0.025);
  c.fillStyle = s.tone(0.14); c.fillRect(KING_X - 0.16, DAIS, s.W, 0.026);
}
/** The bearer behind the throne with his great fan; the throne itself. */
function court(s: Stage) {
  const { c, clock } = s;
  const sway = s.still ? 0 : Math.sin(clock * 1.3) * 0.022;
  const fan: P = [0.97 + sway, 0.37], foot: P = [1.13, 0.64];
  c.fillStyle = s.tone(0.12);
  const d = [fan[0] - foot[0], fan[1] - foot[1]];
  person(c, { x: 1.17, y: DAIS, h: 0.33, face: -1, robe: 'short', hat: 'cap', reach: [foot[0] + d[0] * 0.18, foot[1] + d[1] * 0.18], reach2: [foot[0] + d[0] * 0.02, foot[1] + d[1] * 0.02], tilt: -10, t: clock, cut: s.tone(0.7) });
  c.fillStyle = s.tone(0.12); flabellum(c, foot, fan, 0.055, s.tone(0.6));
  c.fillStyle = s.ink; throne(c, KING_X, DAIS, 0.36, -1, s.tone(0.8));
}

/** "Wiser, and with better memories": a scroll, an arrow, a head that lights up (k: how far the light has gone). */
const PROMISE = (k: number): Icon => (c) => {
  c.save(); c.translate(-1.5, 0.04); c.scale(0.66, 0.66); SCROLL(c); c.restore();
  c.save(); c.translate(-0.2, 0.02); c.scale(0.42, 0.42); ARROW(c); c.restore();
  c.save(); c.translate(1.2, 0.04); c.scale(0.98, 0.98); HEAD()(c);
  c.fillStyle = css(GOLD); c.strokeStyle = css(GOLD);
  disc(c, -0.06, -0.18, 0.1 + 0.17 * k);
  c.lineWidth = 0.09;
  for (let i = 0; i < 7; i++) { const a = -Math.PI * (0.12 + i * 0.13); c.beginPath(); c.moveTo(-0.06 + Math.cos(a) * 0.72, -0.18 + Math.sin(a) * 0.75); c.lineTo(-0.06 + Math.cos(a) * (0.72 + 0.32 * k), -0.18 + Math.sin(a) * (0.75 + 0.32 * k)); c.stroke(); }
  c.restore();
  if (k > 0 && k < 1) { c.save(); c.fillStyle = css(GOLD); disc(c, lerp(-0.85, 0.5, k), 0.02, 0.13); c.restore(); }
};

/** II. The gift: Theuth carries his letters to King Thamus, bows, unrolls them — they shine — and promises minds full of light. */
const theGift: SceneFn = (s) => {
  const { t, c, clock } = s;
  const k = ease(seg(t, 0, 9.5));
  s.cam(lerp(0.6, 0.7, k), 0.5, lerp(1.0, 1.08, k));
  s.backdrop({ mood: 'gold', x: 0.4, y: 0.15, r: 1.6 });
  hall(s, 1);
  court(s);
  // the king watches; when the letters shine he leans in, hand at his chin
  const lean = ease(seg(t, 6.0, 6.8));
  const king = thamus(s, { lean: 10 * lean, arm: mixA([8, 10], [32, 132], lean), tilt: -4 * lean });
  void king;
  c.fillStyle = s.ink; cat(c, 0.86, DAIS, 0.075, -1, clock, s.tone(0.8));
  // Theuth: walks in with the rolled scroll, bows low, then lifts it and lets it fall open
  const walkK = seg(t, 0, 3);
  const x = lerp(-0.06, 0.5, walkK);
  const bow = Math.sin(Math.PI * seg(t, 3.1, 4.3));
  const open = ease(seg(t, 4.3, 5.3));
  let pose: Partial<Body>;
  if (walkK < 1) pose = { ...walk(t * 1.1, 0.9), reach: [x + 0.075, 0.6], reach2: [x + 0.058, 0.606] };
  else if (t < 4.3) pose = { lean: 34 * bow, tilt: 10 * bow, reach: [x + 0.075 + 0.06 * bow, 0.6 + 0.08 * bow], reach2: [x + 0.058 + 0.06 * bow, 0.606 + 0.08 * bow] };
  else pose = { reach: [x + lerp(0.075, 0.125, open), lerp(0.6, 0.53, open)], reach2: [x + lerp(0.058, 0.1, open), lerp(0.606, 0.536, open)], tilt: -6 * open };
  const th = theuth(s, { x, ...pose, mouth: talk(s, 5.8, 8.8) });
  const light = ease(seg(t, 4.8, 5.8));
  if (open <= 0) rolled(s, [th.hand2[0] - 0.03, th.hand2[1]], [th.hand[0] + 0.03, th.hand[1]], 0.011, 0.3);
  else {
    const top: P = [(th.hand[0] + th.hand2[0]) / 2, (th.hand[1] + th.hand2[1]) / 2];
    rays(c, top[0], top[1] + 0.1, 0.05, 0.3, light, clock);
    hanging(s, top[0], top[1], 0.078, 0.22 * open, seg(t, 4.8, 6.4) * 12, light);
    s.spill(top[0], top[1] + 0.1, 0.5 * light, [255, 210, 130]);
  }
  bubble(c, { x: th.head[0] - 0.15, y: th.head[1] - 0.24, r: 0.085, wide: 2, to: [th.mouth[0] - 0.01, th.mouth[1] - 0.02], k: shown(t, 5.7, 9.9), ink: s.ink, icon: PROMISE(ease(seg(t, 6.2, 8.2))), scale: 0.78 });
};

/* ================================================================ III. The king's reply */

/** A great speech bubble holding a moving picture; `scene` draws inside it, 1 unit = its half height, y down. */
function vision(s: Stage, x: number, y: number, rx: number, ry: number, to: P, k: number, scene: () => void) {
  if (k <= 0.01) return;
  const c = s.c;
  c.save();
  c.translate(x, y); c.scale(k, k);
  c.globalAlpha *= Math.min(1, k * 1.6);
  const tx = (to[0] - x) / k, ty = (to[1] - y) / k;
  const a = Math.atan2(ty, tx);
  const ex = Math.cos(a) * rx * 0.85, ey = Math.sin(a) * ry * 0.85;
  const len = Math.hypot(tx - ex, ty - ey), reach = Math.min(len * 0.7, ry * 0.9);
  const px = ex + ((tx - ex) / len) * reach, py = ey + ((ty - ey) / len) * reach;
  const nx = -Math.sin(a) * ry * 0.22, ny = Math.cos(a) * ry * 0.22;
  const shape = () => {
    c.beginPath(); c.ellipse(0, 0, rx, ry, 0, 0, TAU);
    c.moveTo(ex + nx, ey + ny); c.quadraticCurveTo((ex + px) / 2, (ey + py) / 2, px, py); c.lineTo(ex - nx, ey - ny);
  };
  c.strokeStyle = s.ink; c.lineWidth = ry * 0.06; shape(); c.stroke();
  c.fillStyle = 'rgba(252,246,230,0.98)'; shape(); c.fill();
  c.save(); c.beginPath(); c.ellipse(0, 0, rx * 0.98, ry * 0.98, 0, 0, TAU); c.clip();
  c.scale(ry, ry);
  scene();
  c.restore();
  c.restore();
}

/** What the king foresees: a man reads, the light of his memory runs out of his head into the scroll; he puts it down, walks off — and cannot remember. */
function forgetting(s: Stage) {
  const { t, c, clock } = s;
  const ink = s.ink;
  const drain = seg(t, 3.3, 6.3);
  const mind = 1 - ease(drain);
  const DESK = 0.62, G = 0.74, H = 1.32;
  // the floor of the little picture, and a tall reading desk
  c.fillStyle = 'rgba(214,196,164,0.55)'; c.fillRect(-2, G, 4, 1);
  c.fillStyle = 'rgba(150,126,96,0.7)'; c.fillRect(-2, G, 4, 0.02);
  c.fillStyle = ink;
  c.fillRect(DESK - 0.025, G - 0.62, 0.05, 0.62); c.fillRect(DESK - 0.13, G - 0.035, 0.26, 0.035);
  poly(c, [[DESK - 0.2, G - 0.6], [DESK + 0.2, G - 0.69], [DESK + 0.2, G - 0.65], [DESK - 0.2, G - 0.56]]);
  // the man: reads at the desk, then turns his back on it and walks off — and cannot remember
  const away = seg(t, 6.6, 8.2);
  let x: number, face: 1 | -1, pose: Partial<Body>;
  if (t < 6.6) {
    x = 0.1; face = 1;
    pose = { lean: 14, tilt: 30, reach: [DESK - 0.18, G - 0.62], reach2: [DESK - 0.21, G - 0.6], eye: drain > 0.6 ? 'closed' : 'open' };
  } else {
    x = lerp(0.1, -0.4, ease(away)); face = away < 1 || t < 10.4 ? -1 : 1;
    pose = away < 1 ? walk(t * 1.6, 0.9) : { ...gesture('rest', 'scratch', ease(seg(t, 8.5, 9.0))), tilt: -8 };
  }
  c.fillStyle = ink;
  const j = person(c, { x, y: G, h: H, face, robe: 'short', hat: 'cap', ...pose, cut: 'rgba(252,246,230,1)', t: clock });
  // the scroll lying open on the desk; the light poured into it stays there
  const glowS = ease(drain);
  const sc: P = [DESK, G - 0.685];
  if (glowS > 0) { glow(c, sc[0], sc[1], 0.42, GOLD, 0.9 * glowS); rays(c, sc[0], sc[1], 0.12, 0.36, glowS, clock); }
  c.save(); c.translate(sc[0], sc[1]); c.rotate(-0.22);
  c.fillStyle = css(mixRGB(SHEET, PALE, glowS)); c.fillRect(-0.17, -0.055, 0.34, 0.1);
  c.fillStyle = SEPIA; for (let i = 0; i < 2; i++) c.fillRect(-0.13, -0.03 + i * 0.04, i ? 0.18 : 0.26, 0.015);
  c.fillStyle = ink; for (const sx of [-1, 1]) { c.beginPath(); c.roundRect(sx * 0.17 - 0.022, -0.075, 0.044, 0.14, 0.022); c.fill(); }
  c.restore();
  // the light of memory, bright in his head …
  if (mind > 0.01) {
    glow(c, j.head[0], j.head[1], 0.36, GOLD, mind);
    c.fillStyle = css([255, 236, 170], mind); disc(c, j.head[0] + 0.01, j.head[1], 0.07 * (0.35 + 0.65 * mind));
  }
  // … running out of it, in a stream, down into the scroll
  if (drain > 0 && drain < 1) {
    const from: P = [j.head[0] + 0.05, j.head[1] - 0.03], to: P = [sc[0], sc[1] - 0.02];
    const ctrl: P = [(from[0] + to[0]) / 2 + 0.12, Math.min(from[1], to[1]) - 0.16];
    const at = (v: number): P => [(1 - v) * (1 - v) * from[0] + 2 * v * (1 - v) * ctrl[0] + v * v * to[0], (1 - v) * (1 - v) * from[1] + 2 * v * (1 - v) * ctrl[1] + v * v * to[1]];
    const strength = Math.min(1, Math.sin(Math.PI * drain) * 1.6);
    c.save(); c.strokeStyle = css([255, 210, 120], 0.6 * strength); c.lineWidth = 0.07; c.lineCap = 'round';
    c.beginPath(); c.moveTo(from[0], from[1]); c.quadraticCurveTo(ctrl[0], ctrl[1], to[0], to[1]); c.stroke(); c.restore();
    const drop = (v: number, r1: number) => {
      const p = at(v);
      c.fillStyle = css([236, 150, 40], 0.95 * strength);
      disc(c, p[0] + (r1 - 0.5) * 0.03, p[1] + (r1 - 0.5) * 0.03, 0.042);
    };
    if (s.still) for (let i = 0; i < 7; i++) drop((i + 0.5) / 7, 0.5);
    else emit(clock, 15, 0.8, (age, r1) => drop(age, r1), 5);
  }
  // emptied: he scratches his head, and nothing comes; at last he looks back at the scroll
  const q = ease(seg(t, 9.0, 9.5));
  if (q > 0) {
    const wob = s.still ? 0 : Math.sin(clock * 3) * 0.08;
    c.save(); c.translate(j.head[0], j.head[1] - 0.31); c.rotate(wob); c.scale(0.17 * pop(q), 0.17 * pop(q));
    c.fillStyle = 'rgba(200,70,50,1)'; Q(c); c.restore();
  }
}

/** III. The king's reply: "Stop." In a great bubble he shows what letters will do — memory drained into the scroll, and a man who cannot remember without it. */
const theReply: SceneFn = (s) => {
  const { t, c, clock } = s;
  track(s, [[0, 0.86, 0.5, 1.45], [10.4, 0.84, 0.49, 1.48], [12.6, 0.68, 0.52, 1.1]]);
  s.backdrop({ mood: 'gold', to: 'dusk', k: 0.35 + 0.55 * ease(seg(t, 0, 6)), x: 0.5, y: 0.2, r: 1.5 });
  hall(s, 0.5);
  // Theuth waits, holding up his letters; at the end he lowers them
  const droop = ease(seg(t, 11, 12.8));
  const hx = 0.36;
  const top: P = [hx + 0.106, lerp(0.478, 0.58, droop)];
  const th = theuth(s, { x: hx, reach: [top[0] + 0.012, top[1]], reach2: [top[0] - 0.014, top[1] + 0.005], tilt: lerp(-6, 32, droop), lean: 10 * droop });
  const mid: P = [(th.hand[0] + th.hand2[0]) / 2, (th.hand[1] + th.hand2[1]) / 2];
  hanging(s, mid[0], mid[1], 0.078, lerp(0.23, 0.06, droop), 12, 1 - 0.75 * droop);
  court(s);
  // the king: a hand up — stop — then a finger raised as he tells what will come of it; then he shakes his head
  const up = ease(seg(t, 0.2, 0.8)) * (1 - ease(seg(t, 10.3, 10.9)));
  const stop = up * (1 - seg(t, 2.4, 2.6));
  const wag = s.still || stop > 0 ? 0 : Math.sin(clock * 4) * 8;
  const arm: [number, number] = mixA([8, 10], [80 + wag, 90], up);
  const shake = t > 10.8 && t < 12.4 && !s.still ? Math.sin(clock * 9) * 7 : 0;
  const king = thamus(s, { arm, tilt: shake - 4, mouth: talk(s, 0.4, 1.2) || talk(s, 1.8, 10.2) });
  c.save(); c.translate(king.hand[0] - 0.004, king.hand[1] - 0.012); c.fillStyle = s.ink; c.strokeStyle = s.ink;
  if (stop > 0.05) {
    // the raised palm
    c.scale(0.03 * stop, 0.03 * stop); HAND(c);
  } else if (up > 0.05) {
    // one finger raised
    c.lineCap = 'round'; c.lineWidth = 0.007; c.beginPath(); c.moveTo(0, 0.004); c.lineTo(-0.002, -0.026 * up); c.stroke();
  }
  c.restore();
  if (stop > 0.5) sound(c, king.hand[0] - 0.03, king.hand[1] - 0.01, 0.05, clock, Math.PI, stop * 0.8, s.tone(0.35), 0.5);
  c.fillStyle = s.ink; cat(c, 0.86, DAIS, 0.075, -1, clock, s.tone(0.8));
  vision(s, 0.68, 0.365, 0.228, 0.168, king.mouth, shown(t, 1.5, 99), forgetting.bind(null, s));
};

/* ================================================================ IV. The semblance */

interface Learner { x: number; h: number; look: Partial<Body> }
const LEARNERS: Learner[] = [
  { x: 0.5, h: 0.31, look: { hat: 'cap', beard: true, robe: 'long' } },
  { x: 0.7, h: 0.33, look: { hat: 'topknot', robe: 'short' } },
  { x: 0.9, h: 0.3, look: { hair: 'long', robe: 'long' } },
  { x: 1.1, h: 0.32, look: { hat: 'hood', beard: true, robe: 'long' } },
];
const POPS = [3.9, 5.0, 6.1, 7.2];
const LAUNCH = 3.0;
const BOY: P = [0.2, GROUND];
const STAR_G = tinted(STAR, [226, 152, 34]), LAUREL_G = tinted(LAUREL, [190, 136, 40]);
/** the middle of learner i's bubble */
const puffAt = (i: number): P => [LEARNERS[i].x - 0.015, GROUND - LEARNERS[i].h * 0.89 - 0.16];

/** Where the question is: thrown by the boy, it hops from bubble to bubble, then comes home to him. */
function dart(t: number): P | null {
  const hopTo = (a: P, b: P, k: number, hgt: number): P => [lerp(a[0], b[0], k), lerp(a[1], b[1], k) - Math.sin(k * Math.PI) * hgt];
  const hand: P = [BOY[0] + 0.05, GROUND - 0.28];
  if (t < LAUNCH) return null;
  if (t < POPS[0]) return hopTo(hand, puffAt(0), ease(seg(t, LAUNCH, POPS[0])), 0.14);
  for (let i = 0; i < 3; i++) if (t < POPS[i + 1]) return hopTo(puffAt(i), puffAt(i + 1), ease(seg(t, POPS[i], POPS[i + 1])), 0.08);
  const home: P = [BOY[0] + 0.05, GROUND - 0.4];
  const k = ease(seg(t, POPS[3] + 0.3, POPS[3] + 1.8));
  const p = hopTo(puffAt(3), home, k, 0.2);
  return [p[0], p[1] + (k >= 1 ? Math.sin(t * 3) * 0.01 : 0)];
}

/** A bubble bursting: a ring, flecks of its skin, and nothing inside. */
function burst(c: C, x: number, y: number, r: number, age: number, ink: string) {
  if (age <= 0 || age >= 1) return;
  c.save();
  c.strokeStyle = ink; c.globalAlpha = 1 - age; c.lineWidth = r * 0.06;
  c.beginPath(); c.arc(x, y, r * (0.9 + age * 0.9), 0, TAU); c.stroke();
  c.lineWidth = r * 0.07;
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * TAU + 0.3, r0 = r * (1.05 + age * 1.2), r1 = r * (1.3 + age * 1.6);
    c.beginPath(); c.moveTo(x + Math.cos(a) * r0, y + Math.sin(a) * r0); c.lineTo(x + Math.cos(a) * r1, y + Math.sin(a) * r1); c.stroke();
  }
  // shreds of the skin fall away
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU + 0.6, d = r * (0.6 + age * 1.6);
    const px = x + Math.cos(a) * d, py = y + Math.sin(a) * d + age * age * r * 2.4;
    c.save(); c.translate(px, py); c.rotate(age * 6 + i);
    c.fillStyle = 'rgba(255,252,246,0.95)'; c.beginPath(); c.arc(0, 0, r * 0.22, 0, Math.PI); c.fill();
    c.lineWidth = r * 0.05; c.beginPath(); c.arc(0, 0, r * 0.22, 0, Math.PI); c.stroke();
    c.restore();
  }
  c.restore();
}

/** IV. The semblance: learners, scrolls held high, puffed up with stars and laurels — one question from a boy pops each bubble, and there is nothing inside. */
const theSemblance: SceneFn = (s) => {
  const { t, c, clock } = s;
  const follow = ease(seg(t, 3, 8));
  s.cam(lerp(0.6, 0.68, follow), 0.5, 1.02);
  s.backdrop({ mood: 'day', x: 0.22, y: 0.16, r: 1.8 });
  sun(c, 0.2, 0.15, 0.035, clock, 1, 0.5);
  pyramid(c, 0.88, 0.63, 0.5, 0.25, s.tone(0.64), s.tone(0.55), css(GOLD));
  pyramid(c, 1.18, 0.63, 0.32, 0.15, s.tone(0.66), s.tone(0.58));
  c.fillStyle = s.tone(0.52); pylon(c, 0.52, 0.66, 0.3, 0.13, s.tone(0.66));
  c.fillStyle = s.tone(0.46); c.fillRect(-0.3, 0.625, s.W + 0.6, 0.05);
  c.fillStyle = s.tone(0.36);
  palm(c, 0.04, 0.72, 0.26, clock, 0.12); palm(c, 0.66, 0.7, 0.2, clock + 1, -0.1); palm(c, 1.24, 0.72, 0.24, clock + 2, -0.14);
  c.fillStyle = s.tone(0.42); c.fillRect(-0.3, 0.67, s.W + 0.6, GROUND - 0.67);
  c.fillStyle = s.tone(0.26); obelisk(c, 0.34, GROUND, 0.62, s.tone(0.5), css(GOLD));
  c.fillStyle = s.tone(0.12); c.fillRect(-0.3, GROUND, s.W + 0.6, 0.5);
  c.strokeStyle = s.tone(0.2); c.lineWidth = 0.003;
  for (let i = 0; i < 12; i++) { c.beginPath(); c.moveTo(-0.2 + i * 0.14, GROUND); c.lineTo(-0.35 + i * 0.16, 1.05); c.stroke(); }
  // the boy with the question
  const throwK = ease(seg(t, 2.5, 3.0)) * (1 - ease(seg(t, 3.6, 4.2)));
  const catchK = ease(seg(t, POPS[3] + 1.2, POPS[3] + 1.8));
  c.fillStyle = s.ink;
  const boy = person(c, { x: BOY[0], y: GROUND, h: 0.23, face: 1, robe: 'short', build: 0.9, ...gesture('rest', 'raise', Math.max(throwK, catchK * 0.8)), mouth: talk(s, 2.6, 3.2), cut: s.tone(0.8), t: clock });
  void boy;
  // the learners
  LEARNERS.forEach((L, i) => {
    const p = POPS[i];
    const k = ease(seg(t, p, p + 0.6)), read = ease(seg(t, p + 1.2, p + 1.9));
    const proud: Partial<Body> = { arm: [150, 18], arm2: [-28, 120] };
    const arms = k <= 0 ? proud : read > 0 ? { arm: mixA([10, 20], [58, 70], read), arm2: mixA([-6, 8], [44, 60], read) } : { arm: mixA([150, 18], [10, 20], k), arm2: mixA([-28, 120], [-6, 8], k) };
    const breathe = s.still ? 0 : Math.sin(clock * 2.2 + i) * 2;
    c.fillStyle = s.ink;
    const j = person(c, {
      x: L.x, y: GROUND, h: L.h, face: -1, ...L.look, ...arms,
      lean: lerp(-9 + breathe, 12, k), tilt: lerp(-16, 22, k) + 10 * read,
      eye: k <= 0 ? 'closed' : t < p + 0.9 ? 'wide' : 'open', cut: s.tone(0.8), t: clock + i,
    });
    // his scroll: held up like a trophy; then hanging; then opened and peered into for the answer
    if (read > 0.4) {
      const m: P = [(j.hand[0] + j.hand2[0]) / 2 - 0.006, (j.hand[1] + j.hand2[1]) / 2];
      c.fillStyle = css(SHEET); c.fillRect(m[0] - 0.034, m[1] - 0.022, 0.068, 0.04);
      c.fillStyle = SEPIA; for (let r = 0; r < 3; r++) c.fillRect(m[0] - 0.024, m[1] - 0.012 + r * 0.01, 0.048, 0.003);
      c.fillStyle = s.ink; for (const sx of [-1, 1]) { c.beginPath(); c.roundRect(m[0] + sx * 0.034 - 0.005, m[1] - 0.027, 0.01, 0.05, 0.005); c.fill(); }
    } else rolled(s, [j.hand[0] - 0.036, j.hand[1] - 0.008], [j.hand[0] + 0.036, j.hand[1] - 0.008], 0.009, k <= 0 ? 0.7 : 0);
    const [bx, by] = puffAt(i);
    if (t < p) {
      // puffed up: a swelling bubble of stars and laurels
      const swell = 1 + (s.still ? 0 : 0.05 * Math.sin(clock * 2.6 + i * 1.3));
      const born = shown(t, 0.4 + i * 0.35, 99);
      glow(c, bx, by, 0.12, GOLD, 0.45 * born);
      bubble(c, { x: bx, y: by, r: 0.07 * swell, kind: 'thought', to: [L.x - 0.01, GROUND - L.h * 0.92], k: born, ink: s.ink, icon: [STAR_G, LAUREL_G], scale: 0.8 });
    } else {
      burst(c, bx, by, 0.07, seg(t, p, p + 0.7), s.ink);
      // what was inside: nothing
      const k2 = ease(seg(t, p + 0.25, p + 0.7));
      bubble(c, { x: bx, y: by + 0.02, r: 0.042, kind: 'thought', to: [L.x - 0.01, GROUND - L.h * 0.92], k: k2, ink: s.tone(0.3) });
    }
  });
  // the question itself
  const q = dart(t);
  if (q) {
    const spin = s.still ? 0 : Math.sin(clock * 6) * 0.3;
    glow(c, q[0], q[1], 0.07, [255, 226, 150], 0.8);
    c.save(); c.translate(q[0], q[1]); c.rotate(spin); c.scale(0.045, 0.045); c.fillStyle = 'rgba(200,70,50,1)'; Q(c); c.restore();
    if (!s.still && t < POPS[3] + 1.8) sparks(c, q[0], q[1], 0.04, clock, 5, [255, 210, 140]);
  }
};

/* ================================================================ V. The silent painting */

const PANEL = { x: 0.9, y: 0.5, w: 0.27, h: 0.34 };
const PAINT_LINE = 'rgb(34,24,20)';
/** The painted man: a portrait in red-figure on black, lifelike, open-mouthed — and drawn the same at every moment. */
function painting(s: Stage): Joints {
  const c = s.c, { x, y, w, h } = PANEL;
  c.fillStyle = s.tone(0.12); c.fillRect(x - w / 2 - 0.016, y - h / 2 - 0.016, w + 0.032, h + 0.032);
  c.fillStyle = css(GOLD); c.fillRect(x - w / 2 - 0.005, y - h / 2 - 0.005, w + 0.01, h + 0.01);
  c.fillStyle = PAINT_LINE; c.fillRect(x - w / 2, y - h / 2, w, h);
  c.save(); c.beginPath(); c.rect(x - w / 2, y - h / 2, w, h); c.clip();
  // a painted column and a branch of olive behind him
  c.fillStyle = 'rgb(128,66,40)';
  c.fillRect(x + w * 0.3, y - h / 2, w * 0.1, h); c.fillRect(x + w * 0.26, y - h * 0.44, w * 0.18, h * 0.05);
  c.strokeStyle = 'rgb(128,66,40)'; c.lineWidth = 0.004;
  c.beginPath(); c.moveTo(x - w * 0.5, y - h * 0.3); c.quadraticCurveTo(x - w * 0.32, y - h * 0.36, x - w * 0.2, y - h * 0.46); c.stroke();
  for (let i = 0; i < 5; i++) { c.beginPath(); c.ellipse(x - w * (0.46 - i * 0.06), y - h * (0.32 + i * 0.03) + (i % 2 ? 0.008 : -0.008), 0.006, 0.013, 0.8, 0, TAU); c.fill(); }
  c.fillStyle = 'rgb(210,118,66)';
  const body: Body = { x: x + 0.035, y: y + 0.5, h: 0.62, face: -1, robe: 'long', beard: true, hair: 'curls', hat: 'laurel', arm: [104, 36], arm2: [24, 60], mouth: 0.55, eye: 'open', t: 0, cut: PAINT_LINE };
  const j = person(c, body);
  // the painter's lines: brow, ear, the curls of hair and beard
  onHead(c, body, j, () => {
    c.strokeStyle = PAINT_LINE; c.lineWidth = 0.65; c.lineCap = 'round';
    c.beginPath(); c.moveTo(2.4, 3.6); c.quadraticCurveTo(4.6, 4.8, 6.6, 3.4); c.stroke();
    c.beginPath(); c.arc(-1.6, 0.6, 1.9, -1.2, 2.2); c.stroke();
    c.beginPath(); c.moveTo(-4, 5.8); c.quadraticCurveTo(0.8, 7.4, 4.8, 5.4); c.stroke();
    for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(1.4 + i * 1.3, -5.4 - i * 0.3); c.quadraticCurveTo(2.6 + i * 1.3, -8.6, 1.6 + i * 1.2, -11.6 + i * 0.6); c.stroke(); }
    for (let i = 0; i < 5; i++) { c.beginPath(); c.arc(-5.4 + i * 2.2, 7.6 + Math.sin(i * 1.7) * 0.7, 0.9, 0, TAU * 0.75); c.stroke(); }
  });
  // the varnish catches the light
  const g = c.createLinearGradient(x - w / 2, y - h / 2, x + w / 2, y + h / 2);
  g.addColorStop(0, 'rgba(255,250,236,0)'); g.addColorStop(0.42, 'rgba(255,250,236,0.1)'); g.addColorStop(0.5, 'rgba(255,250,236,0)');
  c.fillStyle = g; c.fillRect(x - w / 2, y - h / 2, w, h);
  c.restore();
  return j;
}
/** A fly: dark body, glassy wings that blur when it flies. */
function fly(c: C, x: number, y: number, size: number, time: number, flying: boolean, ink: string) {
  c.save(); c.translate(x, y);
  const beat = flying ? Math.abs(Math.sin(time * 70)) : 0.2;
  c.fillStyle = 'rgba(232,238,248,0.8)';
  c.beginPath(); c.ellipse(-size * 0.25, -size * (0.45 + beat * 0.4), size * 0.55, size * 0.26, -0.6 - beat * 0.6, 0, TAU); c.fill();
  c.beginPath(); c.ellipse(size * 0.1, -size * (0.45 + beat * 0.4), size * 0.5, size * 0.24, 0.5 + beat * 0.6, 0, TAU); c.fill();
  c.fillStyle = ink;
  c.beginPath(); c.ellipse(0, 0, size * 0.6, size * 0.34, 0, 0, TAU); c.fill();
  disc(c, size * 0.62, -size * 0.04, size * 0.27);
  if (!flying) { c.strokeStyle = ink; c.lineWidth = size * 0.09; for (let i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(i * size * 0.3, size * 0.2); c.lineTo(i * size * 0.38, size * 0.55); c.stroke(); } }
  c.restore();
}
/** A Doric column, dark, in the foreground. */
function doric(c: C, x: number, y0: number, y1: number, w: number) {
  c.fillRect(x - w / 2, y0, w, y1 - y0);
  c.fillRect(x - w * 0.75, y0 - w * 0.22, w * 1.5, w * 0.22);
  c.beginPath(); c.moveTo(x - w * 0.75, y0); c.quadraticCurveTo(x - w * 0.6, y0 + w * 0.3, x - w * 0.5, y0 + w * 0.32); c.lineTo(x + w * 0.5, y0 + w * 0.32); c.quadraticCurveTo(x + w * 0.6, y0 + w * 0.3, x + w * 0.75, y0); c.closePath(); c.fill();
}
/** "Writing is like painting": a framed portrait, equal to a scroll. */
const PAINTED: Icon = (c) => {
  c.lineWidth = 0.14; c.strokeRect(-0.72, -0.85, 1.44, 1.7);
  disc(c, 0.02, -0.2, 0.28);
  c.beginPath(); c.moveTo(-0.5, 0.85); c.quadraticCurveTo(-0.45, 0.15, 0.02, 0.12); c.quadraticCurveTo(0.48, 0.15, 0.53, 0.85); c.closePath(); c.fill();
  poly(c, [[-0.28, -0.25], [-0.42, -0.1], [-0.28, -0.06]]);
};

/** V. The silent painting: Socrates asks the painted man a question, then asks again, louder; a fly lands on its nose; it never moves. A scroll is the same. */
const theSilentPainting: SceneFn = (s) => {
  const { t, c, clock } = s;
  track(s, [[0, 0.52, 0.5, 1.12], [2.6, 0.7, 0.48, 1.18], [6.8, 0.72, 0.47, 1.2], [8.2, 0.78, 0.45, 1.48], [9.4, 0.78, 0.45, 1.46], [10.6, 0.68, 0.48, 1.14]]);
  s.backdrop({ mood: 'paper', x: 0.3, y: 0.25, r: 1.6 });
  // the wall of the painted colonnade
  c.fillStyle = s.tone(0.42); c.fillRect(-0.3, 0.7, s.W + 0.6, GROUND - 0.7);
  c.fillStyle = s.tone(0.3); c.fillRect(-0.3, 0.695, s.W + 0.6, 0.01);
  c.strokeStyle = s.tone(0.42); c.lineWidth = 0.008;
  c.beginPath();
  for (let x = -0.3; x < s.W + 0.3; x += 0.06) { c.moveTo(x, 0.17); c.lineTo(x, 0.12); c.lineTo(x + 0.045, 0.12); c.lineTo(x + 0.045, 0.155); c.lineTo(x + 0.018, 0.155); c.lineTo(x + 0.018, 0.14); }
  c.stroke();
  c.fillStyle = s.tone(0.42); c.fillRect(-0.3, 0.1, s.W + 0.6, 0.008); c.fillRect(-0.3, 0.178, s.W + 0.6, 0.008);
  // another, fainter picture further along: a ship
  c.fillStyle = s.tone(0.5); c.fillRect(0.2, 0.33, 0.2, 0.17);
  c.fillStyle = s.tone(0.62); c.fillRect(0.21, 0.34, 0.18, 0.15);
  c.fillStyle = s.tone(0.45); c.beginPath(); c.moveTo(0.24, 0.44); c.lineTo(0.36, 0.44); c.lineTo(0.34, 0.46); c.lineTo(0.26, 0.46); c.closePath(); c.fill(); poly(c, [[0.3, 0.36], [0.3, 0.43], [0.35, 0.43]]);
  const face = painting(s);
  c.fillStyle = s.tone(0.1); c.fillRect(-0.3, GROUND, s.W + 0.6, 0.5);
  // Socrates walks up with a scroll in his hand, and asks
  const walkK = seg(t, 0, 2.4), closer = ease(seg(t, 5.0, 5.5)), back = ease(seg(t, 9.0, 9.6));
  const x = walkK < 1 ? lerp(-0.06, 0.58, walkK) : 0.58 + 0.08 * closer - 0.08 * back;
  const ask1 = ease(seg(t, 2.5, 2.9)) * (1 - ease(seg(t, 3.6, 3.9)));
  const listen = ease(seg(t, 3.8, 4.2)) * (1 - ease(seg(t, 4.9, 5.2)));
  const ask2 = ease(seg(t, 5.1, 5.5)) * (1 - ease(seg(t, 8.7, 9.1)));
  const shrug = ease(seg(t, 9.1, 9.6)) * (1 - ease(seg(t, 10.0, 10.4)));
  const raise = ease(seg(t, 10.0, 10.6));
  const wave = s.still ? 0 : Math.sin(clock * 10) * 22;
  let pose: Partial<Body> = walkK < 1 ? walk(t * 1.1, 1) : {};
  if (walkK >= 1) {
    if (ask1 > 0) pose = gesture('rest', 'offer', ask1);
    else if (listen > 0) pose = { arm: mixA([8, 10], [24, 150], listen) };
    else if (ask2 > 0) pose = { arm: mixA([8, 10], [100 + wave, 30], ask2) };
    else if (shrug > 0) pose = gesture('rest', 'shrug', shrug);
    pose.arm2 = mixA([-6, 8], [112, 10], raise);
  }
  c.fillStyle = s.ink;
  const so = person(c, socrates(s, {
    x, ...pose,
    lean: 4 * ask1 + 7 * listen + 16 * ask2 - 4 * back, tilt: -4 * listen + 4 * ask2,
    mouth: talk(s, 2.6, 3.5) || (t > 5.2 && t < 6.8 ? (s.still ? 0.9 : 0.75 + 0.25 * Math.sin(clock * 16)) : 0),
  }));
  rolled(s, [so.hand2[0] - 0.03, so.hand2[1] - 0.004], [so.hand2[0] + 0.03, so.hand2[1] - 0.004], 0.008, 0.6 * raise);
  bubble(c, { x: so.head[0] - 0.05, y: so.head[1] - 0.19, r: 0.058, to: so.mouth, k: shown(t, 2.6, 4.6), ink: s.ink, icon: Q });
  bubble(c, { x: so.head[0] - 0.08, y: so.head[1] - 0.22, r: 0.08, wide: 1.5, to: so.mouth, k: shown(t, 5.2, 8.9), ink: s.ink, icon: [Q, BANG], scale: 0.9, shake: t < 6.8 ? 1 : 0.3, time: clock });
  if (ask2 > 0.5 && t < 6.8) sound(c, so.mouth[0] + 0.03, so.mouth[1], 0.05, clock, 0, ask2 * 0.7, s.tone(0.35), 0.6);
  // the fly: in from the right, round his head and the picture, and down on the painted nose
  const nose: P = [face.head[0] - 0.0595, face.head[1] + 0.0099];
  const fk = seg(t, 5.8, 7.6);
  if (fk > 0) {
    const landed = fk >= 1;
    let fx: number, fy: number;
    if (landed) { fx = nose[0] + 0.004; fy = nose[1] - 0.009; }
    else {
      const loop = fk * TAU * 1.5;
      fx = lerp(1.3, nose[0], ease(fk)) + Math.sin(loop) * 0.07 * (1 - fk);
      fy = lerp(0.2, nose[1] - 0.006, ease(fk)) + Math.cos(loop * 1.3) * 0.05 * (1 - fk);
    }
    fly(c, fx, fy, 0.019, clock, !landed, s.ink);
    if (!landed && !s.still) sound(c, fx, fy, 0.025, clock * 2, -Math.PI / 2, 0.6, s.tone(0.4), 1.4);
  }
  // writing is like painting: he lifts his scroll beside the picture
  bubble(c, { x: so.head[0] - 0.03, y: so.head[1] - 0.21, r: 0.075, wide: 1.9, kind: 'thought', to: so.head, k: shown(t, 10.3, 99), ink: s.ink, icon: [PAINTED, EQ, SCROLL], scale: 0.85 });
  // the dark columns of the stoa in front
  c.fillStyle = s.tone(0.06); c.fillRect(-0.3, 0, s.W + 0.6, 0.06);
  doric(c, 0.02, 0.06, GROUND, 0.07); doric(c, 1.23, 0.06, GROUND, 0.07);
};

/* ================================================================ VI. One unvarying answer */

const LECTERN_X = 0.8;
const PAGE: P = [LECTERN_X, 0.6];
const ASKS: { at: number; icon: Icon; pose: Gesture }[] = [
  { at: 0.5, icon: tinted(SUN, [222, 146, 30]), pose: 'offer' },
  { at: 3.3, icon: tinted(TREE, [70, 132, 64]), pose: 'point' },
  { at: 6.1, icon: tinted(HEART, [204, 62, 58]), pose: 'plead' },
];
const ANSWERS = ASKS.map((a) => a.at + 1.7);
const STACK: P = [LECTERN_X + 0.01, 0.46];

/** The library: pigeonholes full of rolled books. */
function shelves(s: Stage) {
  const c = s.c;
  const x0 = 0.0, x1 = 1.25, y0 = 0.1, y1 = 0.66, cols = 9, rows = 4;
  const cw = (x1 - x0) / cols, rh = (y1 - y0) / rows;
  c.fillStyle = s.tone(0.4); c.fillRect(x0 - 0.3, y0 - 0.014, x1 - x0 + 0.6, y1 - y0 + 0.028);
  for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) {
    const bx = x0 + q * cw, by = y0 + r * rh;
    c.fillStyle = s.tone(0.3); c.fillRect(bx + 0.008, by + 0.008, cw - 0.016, rh - 0.016);
    // rolled books lying in it, end on
    const n = 2 + Math.floor(hash(r * 31 + q, 2) * 3);
    for (let i = 0; i < n; i++) {
      const px = bx + cw * (0.26 + 0.24 * i) + (hash(i, r + q) - 0.5) * 0.01, py = by + rh * 0.72 - (i === 1 ? rh * 0.08 : 0);
      c.fillStyle = s.tone(0.46); disc(c, px, py, rh * 0.1);
      c.fillStyle = s.tone(0.36); disc(c, px, py, rh * 0.035);
    }
  }
  c.fillStyle = s.tone(0.34); c.fillRect(x0 - 0.3, y1 + 0.014, x1 - x0 + 0.6, 0.012);
}

/** VI. One unvarying answer: three different questions to a scroll — the sun, a tree, the heart — and three times the very same answer. */
const theUnvarying: SceneFn = (s) => {
  const { t, c, clock } = s;
  s.cam(lerp(0.66, 0.7, ease(seg(t, 0, 11))), 0.48, lerp(1.14, 1.2, ease(seg(t, 0, 11))));
  s.backdrop({ mood: 'fire', x: 0.24, y: 0.4, r: 1.3, bright: 0.75 + (s.still ? 0 : 0.05 * noise(clock * 3)) });
  shelves(s);
  c.fillStyle = s.tone(0.08); c.fillRect(-0.3, GROUND, s.W + 0.6, 0.5);
  // the lamp on its tall stand
  c.fillStyle = s.ink;
  const lx = 0.22, ly = 0.42;
  c.fillRect(lx - 0.005, ly, 0.01, GROUND - ly);
  for (const sx of [-1, 1]) poly(c, [[lx, GROUND - 0.06], [lx + sx * 0.05, GROUND], [lx + sx * 0.035, GROUND], [lx, GROUND - 0.04]]);
  c.beginPath(); c.ellipse(lx + 0.012, ly - 0.004, 0.03, 0.01, 0, 0, TAU); c.fill();
  fire(c, lx + 0.036, ly - 0.01, 0.035, clock, { sparks: s.still ? 0 : 3, glowK: 0.6 });
  s.spill(lx, ly, 0.5, [255, 180, 100]);
  // the lectern and the open scroll on it
  c.fillStyle = s.ink;
  c.fillRect(LECTERN_X - 0.008, 0.63, 0.016, GROUND - 0.63);
  c.fillRect(LECTERN_X - 0.06, GROUND - 0.012, 0.12, 0.012);
  poly(c, [[LECTERN_X - 0.09, 0.636], [LECTERN_X + 0.09, 0.6], [LECTERN_X + 0.09, 0.614], [LECTERN_X - 0.09, 0.65]]);
  const speaking = Math.max(...ANSWERS.map((a) => pulse(t, a - 0.2, a + 0.6, 0.2)));
  c.save(); c.translate(PAGE[0], PAGE[1] + 0.012); c.rotate(-0.2);
  glow(c, 0, -0.01, 0.14, GOLD, 0.25 + 0.5 * speaking);
  c.fillStyle = css(mixRGB(SHEET, PALE, speaking)); c.fillRect(-0.075, -0.026 - 0.01 * speaking, 0.15, 0.024 + 0.01 * speaking);
  c.fillStyle = SEPIA; for (let i = 0; i < 2; i++) c.fillRect(-0.06, -0.02 + i * 0.008 - 0.008 * speaking, 0.12, 0.003);
  c.fillStyle = s.ink; for (const sx of [-1, 1]) { c.beginPath(); c.roundRect(sx * 0.08 - 0.008, -0.034, 0.016, 0.036, 0.008); c.fill(); }
  c.restore();
  // Socrates asks, each time something new
  const cur = ASKS.reduce((a, q, i) => (t >= q.at ? i : a), -1);
  const done = ease(seg(t, 8.9, 9.4));
  let pose: Partial<Body> = gesture('rest');
  if (cur >= 0 && done <= 0) {
    const q = ASKS[cur];
    pose = gesture(cur > 0 ? ASKS[cur - 1].pose : 'rest', q.pose, ease(seg(t, q.at, q.at + 0.4)));
  } else if (done > 0) pose = gesture('plead', 'shrug', done);
  const startle = Math.max(...ANSWERS.map((a) => pulse(t, a, a + 0.8, 0.2)));
  const so = person(c, socrates(s, { x: 0.52, ...pose, lean: 8 + (cur >= 0 ? cur * 3 : 0) - 10 * startle - 6 * done, tilt: lerp(10, -8, startle) + (done > 0 && !s.still ? Math.sin(clock * 8) * 6 * done : 0), mouth: ASKS.reduce((m, q) => m || talk(s, q.at + 0.1, q.at + 0.9), 0) }));
  ASKS.forEach((q, i) => {
    const until = i < 2 ? ASKS[i + 1].at - 0.1 : 99;
    bubble(c, { x: so.head[0] - 0.04, y: so.head[1] - 0.2, r: 0.068, wide: 1.6, to: so.mouth, k: shown(t, q.at, until), ink: s.ink, icon: [q.icon, Q], scale: 0.85 });
  });
  // the scroll answers — the same lines, stamped out again each time; each new copy pushes the others up
  ANSWERS.forEach((a, i) => {
    if (t < a) return;
    let place = 0;
    for (let j = i + 1; j < ANSWERS.length; j++) place += ease(seg(t, ANSWERS[j], ANSWERS[j] + 0.5));
    const k = pop(seg(t, a, a + 0.4));
    const y = STACK[1] - place * 0.125;
    const same = Math.max(...ANSWERS.filter((b) => b > a).map((b) => pulse(t, b + 0.4, b + 1.2, 0.2)), 0);
    if (same > 0) { c.save(); c.strokeStyle = css(GOLD, same); c.lineWidth = 0.008; c.beginPath(); c.ellipse(STACK[0], y, 0.058 * 1.35 + 0.012, 0.058 + 0.012, 0, 0, TAU); c.stroke(); c.restore(); }
    bubble(c, { x: STACK[0], y, r: 0.058, wide: 1.35, to: place < 0.5 ? [PAGE[0], PAGE[1] - 0.01] : undefined, k, ink: s.ink, icon: LINES, scale: 0.7 });
    if (k < 1 && k > 0) burst(c, STACK[0], y, 0.07, seg(t, a + 0.25, a + 0.75), s.tone(0.3));
  });
};

export const writing: StoryVisuals = {
  id: 'writing',
  aspect: 1.25,
  loop: false,
  scenes: [theTheuth, theGift, theReply, theSemblance, theSilentPainting, theUnvarying],
  stills: [11.8, 7.6, 9.8, 5.6, 8.6, 9.8],
};
