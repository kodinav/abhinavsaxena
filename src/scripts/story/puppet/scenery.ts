import { hash, noise } from './theatre';

/**
 * Scenery: landscapes, buildings, furniture. Everything is placed in world
 * units and filled with the current fill style, so the same drawing serves a
 * near, dark layer and a far, pale one.
 */
type C = CanvasRenderingContext2D;
type P = [number, number];
const TAU = Math.PI * 2;
const ell = (c: C, x: number, y: number, rx: number, ry: number, rot = 0) => { c.beginPath(); c.ellipse(x, y, rx, ry, rot, 0, TAU); c.fill(); };

/** A rolling ridge from x0 to x1 around height y, filled down to `bottom`. */
export function hills(c: C, x0: number, x1: number, y: number, amp: number, seed: number, bottom = 2, freq = 3) {
  c.beginPath(); c.moveTo(x0, bottom);
  const n = 48;
  for (let i = 0; i <= n; i++) {
    const x = x0 + ((x1 - x0) * i) / n;
    c.lineTo(x, y - amp * (0.55 * noise(x * freq + seed) + 0.3 * noise(x * freq * 2.3 + seed * 3) + 0.15 * noise(x * freq * 5 + seed * 7)));
  }
  c.lineTo(x1, bottom); c.closePath(); c.fill();
}

/** Jagged peaks. */
export function mountains(c: C, x0: number, x1: number, y: number, h: number, seed: number, bottom = 2, peaks = 4) {
  c.beginPath(); c.moveTo(x0, bottom); c.lineTo(x0, y);
  const n = peaks * 2;
  for (let i = 0; i <= n; i++) {
    const x = x0 + ((x1 - x0) * i) / n;
    const top = i % 2 === 1;
    const yy = top ? y - h * (0.55 + 0.45 * hash(i, seed)) : y - h * 0.15 * hash(i, seed + 1);
    c.lineTo(x + (hash(i, seed + 2) - 0.5) * ((x1 - x0) / n) * 0.5, yy);
  }
  c.lineTo(x1, y); c.lineTo(x1, bottom); c.closePath(); c.fill();
}

/** A puffy cloud. */
export function cloud(c: C, x: number, y: number, w: number, seed = 0) {
  const n = 5;
  for (let i = 0; i < n; i++) {
    const v = i / (n - 1);
    ell(c, x + (v - 0.5) * w * 0.8, y - Math.sin(v * Math.PI) * w * 0.12 - hash(i, seed) * w * 0.05, w * (0.16 + 0.08 * Math.sin(v * Math.PI)), w * (0.12 + 0.07 * Math.sin(v * Math.PI)));
  }
  c.beginPath(); c.roundRect(x - w * 0.45, y - w * 0.06, w * 0.9, w * 0.12, w * 0.06); c.fill();
}

/* ---------------------------------------------------------------- trees */
export function cypress(c: C, x: number, y: number, h: number, t = 0) {
  const sway = Math.sin(t * 0.9 + x * 7) * h * 0.02;
  c.beginPath(); c.moveTo(x - h * 0.02, y); c.lineTo(x + h * 0.02, y); c.lineTo(x + h * 0.02, y - h * 0.1); c.closePath(); c.fill();
  c.beginPath();
  c.moveTo(x, y - h * 0.06);
  c.bezierCurveTo(x + h * 0.13, y - h * 0.25, x + h * 0.11 + sway, y - h * 0.7, x + sway * 1.4, y - h);
  c.bezierCurveTo(x - h * 0.11 + sway, y - h * 0.7, x - h * 0.13, y - h * 0.25, x, y - h * 0.06);
  c.fill();
}
export function olive(c: C, x: number, y: number, h: number, t = 0, seed = 1) {
  c.lineWidth = h * 0.06;
  c.beginPath(); c.moveTo(x, y); c.bezierCurveTo(x - h * 0.08, y - h * 0.25, x + h * 0.1, y - h * 0.35, x, y - h * 0.55); c.stroke();
  c.lineWidth = h * 0.03;
  c.beginPath(); c.moveTo(x, y - h * 0.4); c.quadraticCurveTo(x + h * 0.2, y - h * 0.5, x + h * 0.28, y - h * 0.62); c.moveTo(x, y - h * 0.45); c.quadraticCurveTo(x - h * 0.18, y - h * 0.55, x - h * 0.26, y - h * 0.66); c.stroke();
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI + Math.PI;
    const sw = Math.sin(t * 1.1 + i) * h * 0.01;
    ell(c, x + Math.cos(a) * h * 0.3 + sw, y - h * 0.68 + Math.sin(a) * h * 0.2 + hash(i, seed) * h * 0.05, h * 0.16, h * 0.1);
  }
  ell(c, x, y - h * 0.78, h * 0.26, h * 0.16);
}
export function palm(c: C, x: number, y: number, h: number, t = 0, lean = 0.12) {
  const top: P = [x + h * lean, y - h];
  c.lineWidth = h * 0.045;
  c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + h * lean * 0.1, y - h * 0.5, top[0], top[1]); c.stroke();
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI / 2 + (i - 3) * 0.55 + Math.sin(t * 1.3 + i) * 0.05;
    const len = h * (0.36 + (i % 2) * 0.06);
    const end: P = [top[0] + Math.cos(a) * len, top[1] + Math.sin(a) * len * 0.5 + len * 0.35];
    const mid: P = [top[0] + Math.cos(a) * len * 0.5, top[1] + Math.sin(a) * len * 0.5 - h * 0.04];
    c.beginPath(); c.moveTo(top[0], top[1]);
    c.quadraticCurveTo(mid[0], mid[1] - h * 0.04, end[0], end[1]);
    c.quadraticCurveTo(mid[0], mid[1] + h * 0.03, top[0], top[1] + h * 0.02);
    c.fill();
  }
}
export function willow(c: C, x: number, y: number, h: number, t = 0) {
  c.lineWidth = h * 0.06;
  c.beginPath(); c.moveTo(x, y); c.bezierCurveTo(x + h * 0.06, y - h * 0.3, x - h * 0.05, y - h * 0.5, x + h * 0.02, y - h * 0.7); c.stroke();
  ell(c, x + h * 0.02, y - h * 0.78, h * 0.32, h * 0.16);
  c.lineWidth = h * 0.008;
  for (let i = 0; i < 26; i++) {
    const sx = x + h * 0.02 + (i / 25 - 0.5) * h * 0.66;
    const len = h * (0.35 + 0.25 * Math.sin(i * 2.1) ** 2) * (1 - Math.abs(i / 25 - 0.5) * 0.9);
    const sw = Math.sin(t * 1.2 + i * 0.5) * h * 0.04;
    c.beginPath(); c.moveTo(sx, y - h * 0.78); c.quadraticCurveTo(sx + sw * 0.5, y - h * 0.78 + len * 0.6, sx + sw, y - h * 0.78 + len); c.stroke();
  }
}
/** A broad leafy tree (a banyan or an oak). */
export function tree(c: C, x: number, y: number, h: number, t = 0, seed = 2) {
  c.beginPath(); c.moveTo(x - h * 0.06, y); c.quadraticCurveTo(x - h * 0.03, y - h * 0.3, x - h * 0.02, y - h * 0.5); c.lineTo(x + h * 0.02, y - h * 0.5); c.quadraticCurveTo(x + h * 0.03, y - h * 0.3, x + h * 0.07, y); c.fill();
  for (let i = 0; i < 11; i++) {
    const a = (i / 11) * TAU;
    const sw = Math.sin(t * 0.9 + i * 1.3) * h * 0.008;
    ell(c, x + Math.cos(a) * h * 0.24 + sw, y - h * 0.66 + Math.sin(a) * h * 0.18 - hash(i, seed) * h * 0.04, h * 0.14, h * 0.12);
  }
  ell(c, x, y - h * 0.68, h * 0.28, h * 0.2);
}

/* ---------------------------------------------------------------- buildings */
/** A Greek temple: steps, columns, entablature and pediment. `cut` incises the column flutes. */
export function temple(c: C, x: number, y: number, w: number, h: number, cols = 6, cut?: string) {
  const step = h * 0.05;
  for (let i = 0; i < 3; i++) c.fillRect(x - w / 2 - (3 - i) * w * 0.012, y - step * (i + 1), w + (3 - i) * w * 0.024, step);
  const top = y - h * 0.72, base = y - step * 3;
  const cw = (w / cols) * 0.42;
  for (let i = 0; i < cols; i++) {
    const cx = x - w / 2 + (w / cols) * (i + 0.5);
    c.fillRect(cx - cw / 2, top, cw, base - top);
    c.fillRect(cx - cw * 0.7, top - h * 0.03, cw * 1.4, h * 0.03);
    if (cut) { c.save(); c.fillStyle = cut; for (let k = 1; k < 3; k++) c.fillRect(cx - cw / 2 + (cw * k) / 3 - h * 0.002, top + h * 0.02, h * 0.004, base - top - h * 0.04); c.restore(); }
  }
  c.fillRect(x - w / 2 - w * 0.02, top - h * 0.12, w + w * 0.04, h * 0.09);
  c.beginPath(); c.moveTo(x - w / 2 - w * 0.03, top - h * 0.12); c.lineTo(x, y - h); c.lineTo(x + w / 2 + w * 0.03, top - h * 0.12); c.closePath(); c.fill();
  if (cut) { c.save(); c.strokeStyle = cut; c.lineWidth = h * 0.006; c.beginPath(); c.moveTo(x - w * 0.4, top - h * 0.135); c.lineTo(x, y - h * 0.95); c.lineTo(x + w * 0.4, top - h * 0.135); c.closePath(); c.stroke(); c.restore(); }
}

/** A town: houses with flat and pitched roofs, built up as `grow` goes 0 → 1, and fallen as `ruin` goes 0 → 1. */
export function town(c: C, x0: number, x1: number, y: number, h: number, seed: number, grow = 1, ruin = 0, cut?: string) {
  const n = Math.max(3, Math.round((x1 - x0) / (h * 0.55)));
  for (let i = 0; i < n; i++) {
    const v = (i + 0.5) / n;
    const k = Math.max(0, Math.min(1, grow * n - i * 0.7));
    if (k <= 0) continue;
    const bw = ((x1 - x0) / n) * (0.75 + hash(i, seed) * 0.3);
    const bh = h * (0.45 + hash(i, seed + 1) * 0.55) * k;
    const bx = x0 + (x1 - x0) * v;
    const tilt = ruin * (hash(i, seed + 4) - 0.5) * 0.6;
    const fall = ruin * hash(i, seed + 5);
    c.save(); c.translate(bx, y); c.rotate(tilt);
    const hh = bh * (1 - fall * 0.7);
    c.fillRect(-bw / 2, -hh, bw, hh);
    if (hash(i, seed + 2) > 0.45 && fall < 0.3) { c.beginPath(); c.moveTo(-bw / 2 - bw * 0.08, -hh); c.lineTo(0, -hh - bw * 0.35); c.lineTo(bw / 2 + bw * 0.08, -hh); c.closePath(); c.fill(); }
    if (cut && hh > h * 0.25) {
      c.fillStyle = cut;
      c.fillRect(-bw * 0.12, -hh * 0.36, bw * 0.24, hh * 0.36);
      if (hh > h * 0.5) c.fillRect(-bw * 0.3, -hh * 0.8, bw * 0.16, hh * 0.14);
    }
    c.restore();
  }
}

/** A city wall with towers and a gate. */
export function wall(c: C, x0: number, x1: number, y: number, h: number, gate?: number, cut?: string) {
  c.fillRect(x0, y - h, x1 - x0, h);
  const n = Math.max(2, Math.round((x1 - x0) / (h * 0.5)));
  for (let i = 0; i <= n; i++) c.fillRect(x0 + ((x1 - x0) * i) / n - h * 0.08, y - h - h * 0.14, h * 0.16, h * 0.14);
  for (const tx of [x0, x1]) c.fillRect(tx - h * 0.25, y - h * 1.35, h * 0.5, h * 1.35);
  if (gate !== undefined && cut) {
    c.save(); c.fillStyle = cut;
    c.beginPath(); c.moveTo(gate - h * 0.22, y); c.lineTo(gate - h * 0.22, y - h * 0.5); c.arc(gate, y - h * 0.5, h * 0.22, Math.PI, 0); c.lineTo(gate + h * 0.22, y); c.closePath(); c.fill();
    c.restore();
  }
}

/** The Acropolis: a rock with the Parthenon on top. */
export function acropolis(c: C, x: number, y: number, w: number, h: number, cut?: string) {
  c.beginPath(); c.moveTo(x - w / 2, y);
  c.lineTo(x - w * 0.42, y - h * 0.38); c.lineTo(x - w * 0.3, y - h * 0.46); c.lineTo(x + w * 0.32, y - h * 0.48); c.lineTo(x + w * 0.44, y - h * 0.36); c.lineTo(x + w / 2, y);
  c.closePath(); c.fill();
  temple(c, x, y - h * 0.46, w * 0.42, h * 0.5, 8, cut);
}

/* ---------------------------------------------------------------- furniture and things */
export function throne(c: C, x: number, y: number, h: number, face: 1 | -1 = 1) {
  c.save(); c.translate(x, y); c.scale(face, 1);
  c.fillRect(-h * 0.2, -h * 0.75, h * 0.07, h * 0.75);
  c.fillRect(-h * 0.2, -h * 0.34, h * 0.42, h * 0.06);
  c.fillRect(h * 0.16, -h * 0.34, h * 0.05, h * 0.34);
  c.beginPath(); c.arc(-h * 0.165, -h * 0.78, h * 0.06, 0, TAU); c.fill();
  c.fillRect(-h * 0.24, -h * 0.03, h * 0.5, h * 0.03);
  c.restore();
}
export function stool(c: C, x: number, y: number, h: number) {
  c.fillRect(x - h * 0.6, y - h, h * 1.2, h * 0.16);
  c.lineWidth = h * 0.1; c.beginPath(); c.moveTo(x - h * 0.45, y - h * 0.9); c.lineTo(x - h * 0.55, y); c.moveTo(x + h * 0.45, y - h * 0.9); c.lineTo(x + h * 0.55, y); c.stroke();
}
export function table(c: C, x: number, y: number, w: number, h: number) {
  c.fillRect(x - w / 2, y - h, w, h * 0.08);
  c.fillRect(x - w * 0.42, y - h, w * 0.05, h);
  c.fillRect(x + w * 0.37, y - h, w * 0.05, h);
}
/** The Pythia's tripod: a bowl on three tall legs. */
export function tripod(c: C, x: number, y: number, h: number) {
  c.lineWidth = h * 0.035;
  c.beginPath(); c.moveTo(x - h * 0.28, y); c.lineTo(x - h * 0.12, y - h * 0.8); c.moveTo(x + h * 0.28, y); c.lineTo(x + h * 0.12, y - h * 0.8); c.moveTo(x, y); c.lineTo(x, y - h * 0.8); c.stroke();
  c.beginPath(); c.moveTo(x - h * 0.3, y - h * 0.84); c.quadraticCurveTo(x, y - h * 0.62, x + h * 0.3, y - h * 0.84); c.closePath(); c.fill();
  c.fillRect(x - h * 0.32, y - h * 0.88, h * 0.64, h * 0.05);
  for (const s of [-1, 1]) { c.lineWidth = h * 0.025; c.beginPath(); c.arc(x + s * h * 0.26, y - h * 0.92, h * 0.05, 0, TAU); c.stroke(); }
}
/** A low wall, the length of the stage. */
export function parapet(c: C, x0: number, x1: number, y: number, h: number, cut?: string) {
  c.fillRect(x0, y - h, x1 - x0, h);
  if (cut) {
    c.save(); c.strokeStyle = cut; c.lineWidth = h * 0.05;
    for (let r = 1; r < 3; r++) { c.beginPath(); c.moveTo(x0, y - (h * r) / 3); c.lineTo(x1, y - (h * r) / 3); c.stroke(); }
    const bw = h * 0.9;
    for (let r = 0; r < 3; r++) for (let x = x0 + (r % 2) * bw * 0.5; x < x1; x += bw) { c.beginPath(); c.moveTo(x, y - (h * r) / 3); c.lineTo(x, y - (h * (r + 1)) / 3); c.stroke(); }
    c.restore();
  }
}
/** A chain from a to b, in links. */
export function chain(c: C, a: P, b: P, link: number, sag = 0) {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const n = Math.max(2, Math.round(len / link));
  c.lineWidth = link * 0.22;
  for (let i = 0; i < n; i++) {
    const v = (i + 0.5) / n;
    const x = a[0] + (b[0] - a[0]) * v, y = a[1] + (b[1] - a[1]) * v + Math.sin(v * Math.PI) * sag;
    const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
    c.beginPath(); c.ellipse(x, y, link * 0.55, link * (i % 2 ? 0.12 : 0.3), ang, 0, TAU); c.stroke();
  }
}
/** A candle with its flame (drawn by the caller with `fire` or here, small). */
export function candle(c: C, x: number, y: number, h: number, t: number, lit = 1) {
  c.fillRect(x - h * 0.08, y - h, h * 0.16, h);
  c.fillRect(x - h * 0.2, y - h * 0.06, h * 0.4, h * 0.06);
  if (lit <= 0) return;
  const fl = 1 + 0.12 * Math.sin(t * 13) + 0.08 * Math.sin(t * 7.3);
  c.save();
  const g = c.createRadialGradient(x, y - h * 1.2, 0, x, y - h * 1.2, h * 1.6);
  g.addColorStop(0, `rgba(255,214,140,${0.55 * lit})`); g.addColorStop(1, 'rgba(255,214,140,0)');
  c.fillStyle = g; c.beginPath(); c.arc(x, y - h * 1.2, h * 1.6, 0, TAU); c.fill();
  c.fillStyle = `rgba(255,186,90,${lit})`;
  c.beginPath(); c.moveTo(x, y - h * (1.42 * fl)); c.quadraticCurveTo(x + h * 0.12, y - h * 1.1, x, y - h * 1.02); c.quadraticCurveTo(x - h * 0.12, y - h * 1.1, x, y - h * (1.42 * fl)); c.fill();
  c.restore();
}
/** A window with mullions; `open` light behind it is the caller's to paint. */
export function windowFrame(c: C, x: number, y: number, w: number, h: number, bar: number) {
  c.fillRect(x - bar, y - bar, w + bar * 2, bar * 2);
  c.fillRect(x - bar, y + h - bar, w + bar * 2, bar * 2);
  c.fillRect(x - bar, y, bar * 2, h);
  c.fillRect(x + w - bar, y, bar * 2, h);
  c.fillRect(x + w / 2 - bar / 2, y, bar, h);
  c.fillRect(x, y + h * 0.45 - bar / 2, w, bar);
}
/** The edge of a rock face or cave mouth: a ragged band from a to b, `depth` thick on the left of the path. */
export function rock(c: C, pts: P[], depth: number, seed: number) {
  c.beginPath();
  pts.forEach((p, i) => {
    const r = noise(i * 1.7 + seed) * depth * 0.18;
    if (i === 0) c.moveTo(p[0] + r, p[1]); else c.lineTo(p[0] + r, p[1] + noise(i * 2.3 + seed * 2) * depth * 0.1);
  });
  c.closePath(); c.fill();
}
