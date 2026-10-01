import { glow } from './fx';
import type { RGB, Stage } from './theatre';

/**
 * Marks drawn over a scene: threads that trace a path (warrant, a journey, a
 * reflection), and the occasional letter or word.
 */
type C = CanvasRenderingContext2D;
type P = [number, number];

/** The length of a polyline. */
const lengthOf = (pts: P[]) => pts.slice(1).reduce((s, p, i) => s + Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]), 0);

/** The point a fraction k of the way along a polyline. */
export function along(pts: P[], k: number): P {
  const total = lengthOf(pts);
  let left = Math.max(0, Math.min(1, k)) * total;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i], d = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (left <= d || i === pts.length - 1) { const v = d ? Math.min(1, left / d) : 0; return [a[0] + (b[0] - a[0]) * v, a[1] + (b[1] - a[1]) * v]; }
    left -= d;
  }
  return pts[pts.length - 1];
}

/**
 * A thread drawn a fraction k along a path of points, with a bright bead at
 * its head while it is still being drawn.
 */
export function thread(c: C, pts: P[], k: number, color: RGB, width: number, o: { dash?: number[]; alpha?: number; bead?: boolean; curve?: number } = {}) {
  if (k <= 0 || pts.length < 2) return;
  const total = lengthOf(pts);
  let left = Math.min(1, k) * total;
  c.save();
  c.strokeStyle = `rgba(${color[0]},${color[1]},${color[2]},${o.alpha ?? 1})`;
  c.lineWidth = width; c.lineCap = 'round'; c.lineJoin = 'round';
  if (o.dash) c.setLineDash(o.dash);
  c.beginPath(); c.moveTo(pts[0][0], pts[0][1]);
  let head: P = pts[0];
  for (let i = 1; i < pts.length && left > 0; i++) {
    const a = pts[i - 1], b = pts[i], d = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const v = Math.min(1, left / (d || 1));
    head = [a[0] + (b[0] - a[0]) * v, a[1] + (b[1] - a[1]) * v];
    // each leg bows a little, like a thread rather than a ruler line
    const bow = (o.curve ?? 0.12) * d;
    const mx = (a[0] + head[0]) / 2, my = (a[1] + head[1]) / 2 - bow * v;
    c.quadraticCurveTo(mx, my, head[0], head[1]);
    left -= d;
  }
  c.stroke();
  c.restore();
  if ((o.bead ?? true) && k < 1) glow(c, head[0], head[1], width * 7, color, 0.9);
}

/** A small word or letter in the theatre's serif, centred on (x, y). */
export function word(s: Stage, x: number, y: number, text: string, k: number, size = 0.04, color = s.ink, style = 'italic') {
  if (k <= 0.01) return;
  const c = s.c;
  c.save();
  c.globalAlpha *= Math.min(1, k);
  c.fillStyle = color;
  c.font = s.font(size, 'serif', style);
  c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText(text, x, y + (1 - Math.min(1, k)) * size * 0.4);
  c.restore();
}
