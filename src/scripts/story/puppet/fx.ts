import { css, hash, noise, type RGB } from './theatre';

/**
 * Light and weather: glows, fire, sparks, smoke, rays, sound, water. All are
 * pure functions of time, so a frame can be drawn on its own; particles are
 * reborn every `life` seconds with a fresh random seed.
 */
type C = CanvasRenderingContext2D;
const TAU = Math.PI * 2;

/** A soft round light. */
export function glow(c: C, x: number, y: number, r: number, color: RGB, k: number) {
  if (k <= 0.003 || r <= 0) return;
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, css(color, 0.85 * k));
  g.addColorStop(0.35, css(color, 0.42 * k));
  g.addColorStop(1, css(color, 0));
  c.save();
  c.fillStyle = g;
  c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
  c.restore();
}

/**
 * Stateless particles: calls `fn` for each of `n` particles with its age (0..1
 * of its life) and two random numbers that change every time it is reborn.
 */
export function emit(time: number, n: number, life: number, fn: (age: number, r1: number, r2: number, i: number) => void, salt = 0) {
  for (let i = 0; i < n; i++) {
    const ph = time / life + hash(i, 7.7 + salt);
    const cycle = Math.floor(ph);
    fn(ph - cycle, hash(i * 31 + cycle * 7, 1.3 + salt), hash(i * 17 + cycle * 13, 2.9 + salt), i);
  }
}

/** A fire of `size` (its height) burning at (x, y) (the base). */
export function fire(c: C, x: number, y: number, size: number, time: number, o: { logs?: string; sparks?: number; glowK?: number } = {}) {
  c.save();
  const flick = 0.85 + 0.15 * noise(time * 3.1);
  glow(c, x, y - size * 0.35, size * 2.4 * flick, [255, 170, 80], (o.glowK ?? 0.55) * flick);
  // tongues: outer red-orange, then orange, then yellow, then a pale core
  const layers: [RGB, number, number][] = [[[214, 82, 34], 1, 0.55], [[240, 132, 46], 0.82, 0.45], [[252, 196, 84], 0.6, 0.34], [[255, 238, 190], 0.34, 0.2]];
  layers.forEach(([col, hk, wk], li) => {
    c.fillStyle = css(col, 0.95);
    const n = 5;
    for (let i = 0; i < n; i++) {
      const u = (i - (n - 1) / 2) / ((n - 1) / 2); // -1..1
      const h = size * hk * (0.55 + 0.45 * (1 - Math.abs(u))) * (0.82 + 0.28 * noise(time * (4.5 + i * 0.7) + i * 9 + li * 3));
      const w = size * wk * (0.5 + 0.2 * (1 - Math.abs(u)));
      const bx = x + u * size * 0.32 * hk;
      const lean = noise(time * 2.3 + i * 5 + li) * size * 0.16;
      c.beginPath();
      c.moveTo(bx - w / 2, y);
      c.bezierCurveTo(bx - w * 0.55, y - h * 0.45, bx + lean - w * 0.18, y - h * 0.75, bx + lean, y - h);
      c.bezierCurveTo(bx + lean + w * 0.18, y - h * 0.75, bx + w * 0.55, y - h * 0.45, bx + w / 2, y);
      c.closePath();
      c.fill();
    }
  });
  if (o.logs) {
    c.fillStyle = o.logs;
    c.save(); c.translate(x, y);
    c.rotate(0.22); c.beginPath(); c.roundRect(-size * 0.5, -size * 0.06, size, size * 0.11, size * 0.05); c.fill();
    c.rotate(-0.44); c.beginPath(); c.roundRect(-size * 0.5, -size * 0.06, size, size * 0.11, size * 0.05); c.fill();
    c.restore();
  }
  const ns = o.sparks ?? 14;
  if (ns) sparks(c, x, y - size * 0.4, size, time, ns);
  c.restore();
}

/** Sparks that rise and drift from a point. */
export function sparks(c: C, x: number, y: number, size: number, time: number, n = 14, color: RGB = [255, 196, 110]) {
  if (n <= 0) return;
  c.save();
  emit(time, n, 1.6, (a, r1, r2) => {
    const px = x + (r1 - 0.5) * size * 0.6 + noise(time * 1.7 + r2 * 40) * size * 0.25 * a;
    const py = y - a * size * (1.4 + r2 * 1.2);
    const s = size * 0.028 * (1 - a);
    c.fillStyle = css(color, (1 - a) * 0.95);
    c.beginPath(); c.arc(px, py, Math.max(0.0012, s), 0, TAU); c.fill();
  });
  c.restore();
}

/** Smoke or vapour: soft rising puffs that widen and fade. */
export function smoke(c: C, x: number, y: number, size: number, time: number, color: RGB, k = 1, n = 9, drift = 0.3) {
  if (k <= 0) return;
  c.save();
  emit(time, n, 3.2, (a, r1, r2) => {
    const px = x + (r1 - 0.5) * size * 0.3 + drift * size * a + noise(time * 0.6 + r2 * 20) * size * 0.25 * a;
    const py = y - a * size * 1.6;
    const r = size * (0.12 + a * 0.32);
    const g = c.createRadialGradient(px, py, 0, px, py, r);
    g.addColorStop(0, css(color, 0.32 * k * Math.sin(Math.PI * a)));
    g.addColorStop(1, css(color, 0));
    c.fillStyle = g;
    c.beginPath(); c.arc(px, py, r, 0, TAU); c.fill();
  }, 4);
  c.restore();
}

/** Sun: a bright disc, a halo and slowly turning rays. */
export function sun(c: C, x: number, y: number, r: number, time: number, k = 1, rays = 1) {
  if (k <= 0) return;
  c.save();
  glow(c, x, y, r * 6, [255, 226, 150], 0.7 * k);
  if (rays > 0) {
    c.save(); c.translate(x, y); c.rotate(time * 0.05);
    c.fillStyle = css([255, 230, 160], 0.22 * k * rays);
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * TAU, len = r * (3.2 + 1.4 * Math.sin(i * 2.7 + time * 0.8));
      c.beginPath(); c.moveTo(Math.cos(a - 0.06) * r * 1.1, Math.sin(a - 0.06) * r * 1.1);
      c.lineTo(Math.cos(a) * len, Math.sin(a) * len);
      c.lineTo(Math.cos(a + 0.06) * r * 1.1, Math.sin(a + 0.06) * r * 1.1); c.closePath(); c.fill();
    }
    c.restore();
  }
  c.fillStyle = css([255, 246, 220], k);
  c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
  c.restore();
}

/** Sound: arcs travelling out from a point towards `dir` (radians). */
export function sound(c: C, x: number, y: number, size: number, time: number, dir: number, k = 1, color = 'rgba(0,0,0,0.6)', spread = 0.7) {
  if (k <= 0) return;
  c.save(); c.strokeStyle = color; c.lineWidth = size * 0.05; c.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    const a = ((time * 1.4 + i / 3) % 1);
    c.globalAlpha = k * (1 - a) * 0.9;
    c.beginPath(); c.arc(x, y, size * (0.25 + a), dir - spread, dir + spread); c.stroke();
  }
  c.restore();
}

/** A four-pointed twinkle. */
export function twinkle(c: C, x: number, y: number, r: number, color: string) {
  c.save();
  c.fillStyle = color;
  c.beginPath();
  c.moveTo(x, y - r); c.quadraticCurveTo(x, y, x + r, y); c.quadraticCurveTo(x, y, x, y + r); c.quadraticCurveTo(x, y, x - r, y); c.quadraticCurveTo(x, y, x, y - r);
  c.fill();
  c.restore();
}

/** Falling snow or rain over a box. */
export function weather(c: C, x0: number, y0: number, w: number, h: number, time: number, kind: 'snow' | 'rain', k = 1, n = 40, color = 'rgba(255,255,255,0.85)') {
  if (k <= 0) return;
  c.save(); c.globalAlpha = k;
  emit(time, n, kind === 'snow' ? 6 : 0.9, (a, r1, r2) => {
    const px = x0 + r1 * w + (kind === 'snow' ? noise(time * 0.8 + r2 * 30) * w * 0.03 : -a * w * 0.04);
    const py = y0 + a * h;
    if (kind === 'snow') { c.fillStyle = color; c.beginPath(); c.arc(px, py, h * (0.004 + r2 * 0.005), 0, TAU); c.fill(); }
    else { c.strokeStyle = color; c.lineWidth = h * 0.003; c.beginPath(); c.moveTo(px, py); c.lineTo(px - w * 0.006, py + h * 0.04); c.stroke(); }
  }, 9);
  c.restore();
}

/** Water: a band of gentle waves between y and the bottom of the box. */
export function water(c: C, x0: number, x1: number, y: number, depth: number, time: number, fill: string, line: string, amp = 0.008, n = 4) {
  c.save();
  c.fillStyle = fill;
  c.beginPath(); c.moveTo(x0, y + depth);
  for (let x = x0; x <= x1 + 0.001; x += (x1 - x0) / 60) c.lineTo(x, y + Math.sin(x * 22 + time * 1.6) * amp);
  c.lineTo(x1, y + depth); c.closePath(); c.fill();
  c.strokeStyle = line; c.lineWidth = amp * 0.6;
  for (let i = 1; i <= n; i++) {
    const yy = y + (depth * i) / (n + 1);
    c.globalAlpha = 0.5 - i * 0.07;
    c.beginPath();
    for (let x = x0; x <= x1 + 0.001; x += (x1 - x0) / 40) {
      const v = Math.sin(x * 16 + time * (1.2 + i * 0.3) + i * 2);
      if (v > 0.55) c.lineTo(x, yy + v * amp * 0.5); else c.moveTo(x, yy + v * amp * 0.5);
    }
    c.stroke();
  }
  c.restore();
}

/** An expanding ring on water or air (age 0..1). */
export function ripple(c: C, x: number, y: number, r: number, age: number, color: string, flat = 0.32) {
  if (age <= 0 || age >= 1) return;
  c.save(); c.strokeStyle = color; c.globalAlpha = 1 - age; c.lineWidth = r * 0.06;
  c.beginPath(); c.ellipse(x, y, r * age, r * age * flat, 0, 0, TAU); c.stroke(); c.restore();
}

/** Speed lines trailing behind something moving towards `dir`. */
export function speed(c: C, x: number, y: number, size: number, dir: 1 | -1, k: number, color: string) {
  if (k <= 0) return;
  c.save(); c.strokeStyle = color; c.lineWidth = size * 0.04; c.globalAlpha = k;
  for (let i = 0; i < 3; i++) {
    const yy = y + (i - 1) * size * 0.28, x0 = x - dir * size * (0.6 + i * 0.12);
    c.beginPath(); c.moveTo(x0, yy); c.lineTo(x0 - dir * size * (0.5 + (i % 2) * 0.3), yy); c.stroke();
  }
  c.restore();
}

/** A heat shimmer: wavy rising lines. */
export function heat(c: C, x: number, y: number, size: number, time: number, k: number, color: string) {
  if (k <= 0) return;
  c.save(); c.strokeStyle = color; c.lineWidth = size * 0.035; c.globalAlpha = k;
  for (let i = 0; i < 3; i++) {
    const xx = x + (i - 1) * size * 0.35;
    c.beginPath();
    for (let j = 0; j <= 12; j++) { const v = j / 12; c.lineTo(xx + Math.sin(v * 9 + time * 5 + i) * size * 0.08, y - v * size * (0.9 + i * 0.1)); }
    c.stroke();
  }
  c.restore();
}

/**
 * Paint whatever `draw` fills as a soft-edged shadow in `color`, blurred by
 * `blur` world units. (The shape itself is drawn far off the canvas and only
 * its shadow lands here, which works in every browser.)
 */
export function softly(c: C, blur: number, color: string, draw: () => void) {
  const m = c.getTransform();
  const OFF = 20000;
  c.save();
  c.shadowColor = color;
  c.shadowBlur = Math.max(0, blur * m.a);
  c.shadowOffsetX = OFF;
  c.translate(-OFF / m.a, 0);
  c.fillStyle = '#000'; c.strokeStyle = '#000';
  draw();
  c.restore();
}
