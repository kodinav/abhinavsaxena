import { pop, seg } from './theatre';

/**
 * Speech and thought bubbles, and the small pictures that go in them. The
 * pictures carry what is said, so the story can be followed without reading.
 *
 * Icons are drawn in a box from -1 to 1 around the origin, in the current
 * fill and stroke colour.
 */
type C = CanvasRenderingContext2D;
export type Icon = (c: C) => void;
const TAU = Math.PI * 2;

export interface BubbleOpts {
  x: number; y: number;
  /** half the bubble's height */
  r: number;
  /** width / height */
  wide?: number;
  /** where the tail points (a mouth, a head) */
  to?: [number, number];
  kind?: 'speech' | 'thought';
  /** 0..1, how far it has appeared (popped in) */
  k: number;
  ink: string;
  paper?: string;
  icon?: Icon | Icon[];
  /** icon scale inside the bubble (fraction of r) */
  scale?: number;
  /** a slight shake, for arguments, and the time that drives it */
  shake?: number;
  time?: number;
}

/** How far a bubble that appears at `a` and leaves at `b` is open at time t. */
export const shown = (t: number, a: number, b = Infinity, inDur = 0.45, outDur = 0.3) => (t < a || t > b ? 0 : Math.min(pop(seg(t, a, a + inDur)), 1 - seg(t, b - outDur, b) ** 2));

export function bubble(c: C, o: BubbleOpts) {
  const k = o.k;
  if (k <= 0.01) return;
  const wide = o.wide ?? 1.25;
  const rx = o.r * wide, ry = o.r;
  const paper = o.paper ?? 'rgba(255,252,246,0.97)';
  const line = o.r * 0.07;
  c.save();
  const sx = (o.shake ?? 0) * Math.sin((o.time ?? 0) * 38) * o.r * 0.06;
  c.translate(o.x + sx, o.y);
  c.scale(k, k);
  c.globalAlpha = Math.min(1, k * 1.6);
  const tx = o.to ? (o.to[0] - o.x - sx) / k : 0, ty = o.to ? (o.to[1] - o.y) / k : 0;
  const shapes: Array<() => void> = [];
  if ((o.kind ?? 'speech') === 'speech') {
    shapes.push(() => { c.beginPath(); c.ellipse(0, 0, rx, ry, 0, 0, TAU); });
    if (o.to) {
      // the tail: from the bubble's edge towards the speaker, stopping short of them
      const a = Math.atan2(ty, tx);
      const ex = Math.cos(a) * rx * 0.8, ey = Math.sin(a) * ry * 0.8;
      const len = Math.hypot(tx - ex, ty - ey);
      const reach = Math.min(len * 0.62, o.r * 1.25);
      const px = ex + ((tx - ex) / len) * reach, py = ey + ((ty - ey) / len) * reach;
      const n: [number, number] = [-Math.sin(a), Math.cos(a)];
      shapes.push(() => { c.beginPath(); c.moveTo(ex + n[0] * o.r * 0.3, ey + n[1] * o.r * 0.3); c.quadraticCurveTo(ex + (px - ex) * 0.5, ey + (py - ey) * 0.5, px, py); c.lineTo(ex - n[0] * o.r * 0.3, ey - n[1] * o.r * 0.3); c.closePath(); });
    }
  } else {
    const lobes = 9;
    for (let i = 0; i < lobes; i++) {
      const a = (i / lobes) * TAU;
      shapes.push(() => { c.beginPath(); c.arc(Math.cos(a) * rx * 0.78, Math.sin(a) * ry * 0.74, ry * 0.42, 0, TAU); });
    }
    shapes.push(() => { c.beginPath(); c.ellipse(0, 0, rx * 0.86, ry * 0.82, 0, 0, TAU); });
    if (o.to) {
      for (let i = 0; i < 3; i++) {
        const v = 0.5 + i * 0.2, rr = ry * (0.2 - i * 0.05);
        const bx = tx * v, by = ty * v;
        // the trail starts at the cloud's edge
        shapes.push(() => { c.beginPath(); c.arc(bx * 1.0, by * 1.0, rr, 0, TAU); });
      }
    }
  }
  c.strokeStyle = o.ink; c.lineWidth = line * 2;
  for (const s of shapes) { s(); c.stroke(); }
  c.fillStyle = paper;
  for (const s of shapes) { s(); c.fill(); }
  // the picture
  const icons = o.icon ? (Array.isArray(o.icon) ? o.icon : [o.icon]) : [];
  if (icons.length) {
    const sc = o.r * (o.scale ?? 0.62);
    const gap = icons.length > 1 ? (rx * 1.45) / icons.length : 0;
    icons.forEach((ic, i) => {
      c.save();
      c.translate((i - (icons.length - 1) / 2) * gap, 0);
      c.scale(sc / Math.max(1, icons.length * 0.62), sc / Math.max(1, icons.length * 0.62));
      c.fillStyle = o.ink; c.strokeStyle = o.ink; c.lineWidth = 0.14; c.lineCap = 'round'; c.lineJoin = 'round';
      ic(c);
      c.restore();
    });
  }
  c.restore();
}

/* ---------------------------------------------------------------- icons */
const glyph = (ch: string, weight = 700, style = '') => (c: C) => {
  c.save(); c.scale(0.01, 0.01);
  c.font = `${style} ${weight} 190px Georgia, 'Times New Roman', serif`.trim();
  c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText(ch, 0, 12);
  c.restore();
};
export const Q = glyph('?');
export const BANG = glyph('!');
export const EQ = glyph('=');
export const NEQ = glyph('≠');
export const DOTS: Icon = (c) => { for (let i = -1; i <= 1; i++) { c.beginPath(); c.arc(i * 0.55, 0.1, 0.16, 0, TAU); c.fill(); } };
export const text = (s: string, size = 70, style = 'italic 600') => (c: C) => {
  c.save(); c.scale(0.01, 0.01); c.font = `${style} ${size}px Georgia, serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(s, 0, 4); c.restore();
};

export const CHECK: Icon = (c) => { c.lineWidth = 0.22; c.beginPath(); c.moveTo(-0.6, 0.05); c.lineTo(-0.15, 0.5); c.lineTo(0.65, -0.5); c.stroke(); };
export const CROSS: Icon = (c) => { c.lineWidth = 0.22; c.beginPath(); c.moveTo(-0.5, -0.5); c.lineTo(0.5, 0.5); c.moveTo(0.5, -0.5); c.lineTo(-0.5, 0.5); c.stroke(); };
export const HEART: Icon = (c) => { c.beginPath(); c.moveTo(0, 0.75); c.bezierCurveTo(-1.1, 0, -0.75, -0.95, 0, -0.35); c.bezierCurveTo(0.75, -0.95, 1.1, 0, 0, 0.75); c.fill(); };
export const EYE: Icon = (c) => {
  c.lineWidth = 0.13; c.beginPath(); c.moveTo(-0.95, 0); c.quadraticCurveTo(0, -0.85, 0.95, 0); c.quadraticCurveTo(0, 0.85, -0.95, 0); c.stroke();
  c.beginPath(); c.arc(0, 0, 0.32, 0, TAU); c.fill();
};
export const EAR: Icon = (c) => {
  c.lineWidth = 0.15; c.beginPath(); c.moveTo(-0.15, 0.7); c.bezierCurveTo(-0.55, 0.65, -0.55, -0.8, 0.1, -0.8); c.bezierCurveTo(0.7, -0.8, 0.6, -0.1, 0.25, 0.15); c.bezierCurveTo(0.05, 0.3, 0.2, 0.6, -0.15, 0.7); c.stroke();
  c.beginPath(); c.moveTo(-0.05, -0.3); c.quadraticCurveTo(0.25, -0.45, 0.25, -0.15); c.stroke();
};
export const NOSE: Icon = (c) => { c.lineWidth = 0.15; c.beginPath(); c.moveTo(-0.1, -0.8); c.lineTo(0.35, 0.3); c.quadraticCurveTo(0.3, 0.55, 0, 0.5); c.quadraticCurveTo(-0.3, 0.5, -0.35, 0.35); c.stroke(); for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(0.55, -0.5 + i * 0.3); c.quadraticCurveTo(0.7, -0.6 + i * 0.3, 0.85, -0.5 + i * 0.3); c.stroke(); } };
export const HAND: Icon = (c) => {
  c.beginPath(); c.roundRect(-0.45, -0.1, 0.8, 0.85, 0.2); c.fill();
  for (let i = 0; i < 4; i++) { c.beginPath(); c.roundRect(-0.43 + i * 0.2, -0.8 + Math.abs(i - 1.5) * 0.12, 0.16, 0.8, 0.08); c.fill(); }
  c.save(); c.translate(0.35, 0.2); c.rotate(-0.7); c.beginPath(); c.roundRect(-0.08, -0.5, 0.17, 0.55, 0.08); c.fill(); c.restore();
};
export const DROP: Icon = (c) => { c.beginPath(); c.moveTo(0, -0.85); c.bezierCurveTo(0.2, -0.4, 0.6, -0.05, 0.6, 0.3); c.arc(0, 0.3, 0.6, 0, Math.PI); c.bezierCurveTo(-0.6, -0.05, -0.2, -0.4, 0, -0.85); c.fill(); };
export const SNOWFLAKE: Icon = (c) => { c.lineWidth = 0.12; for (let i = 0; i < 3; i++) { c.save(); c.rotate((i * Math.PI) / 3); c.beginPath(); c.moveTo(0, -0.8); c.lineTo(0, 0.8); c.moveTo(-0.2, -0.6); c.lineTo(0, -0.45); c.lineTo(0.2, -0.6); c.moveTo(-0.2, 0.6); c.lineTo(0, 0.45); c.lineTo(0.2, 0.6); c.stroke(); c.restore(); } };
export const FLAME: Icon = (c) => { c.beginPath(); c.moveTo(0, -0.9); c.bezierCurveTo(0.5, -0.35, 0.65, 0.05, 0.55, 0.35); c.bezierCurveTo(0.45, 0.75, -0.45, 0.75, -0.55, 0.35); c.bezierCurveTo(-0.65, 0, -0.3, -0.2, -0.2, -0.5); c.bezierCurveTo(-0.05, -0.3, 0.05, -0.55, 0, -0.9); c.fill(); };
export const SUN: Icon = (c) => {
  c.beginPath(); c.arc(0, 0, 0.38, 0, TAU); c.fill(); c.lineWidth = 0.12;
  for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; c.beginPath(); c.moveTo(Math.cos(a) * 0.55, Math.sin(a) * 0.55); c.lineTo(Math.cos(a) * 0.85, Math.sin(a) * 0.85); c.stroke(); }
};
export const TREE: Icon = (c) => {
  c.fillRect(-0.1, 0.1, 0.2, 0.75);
  for (const [x, y, r] of [[0, -0.35, 0.45], [-0.35, -0.05, 0.32], [0.35, -0.05, 0.32], [0, 0.05, 0.35]]) { c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); }
};
export const WALL: Icon = (c) => {
  c.lineWidth = 0.08;
  c.strokeRect(-0.85, -0.65, 1.7, 1.3);
  for (let r = 0; r < 4; r++) {
    const y = -0.65 + r * 0.325;
    c.beginPath(); c.moveTo(-0.85, y); c.lineTo(0.85, y); c.stroke();
    for (let i = 0; i < 4; i++) { const x = -0.85 + ((i + (r % 2) * 0.5) * 1.7) / 3.5; if (x > -0.84 && x < 0.84) { c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + 0.325); c.stroke(); } }
  }
};
export const SPEAR: Icon = (c) => { c.save(); c.rotate(-0.7); c.fillRect(-0.05, -0.55, 0.1, 1.45); c.beginPath(); c.moveTo(0, -0.95); c.lineTo(0.18, -0.5); c.lineTo(-0.18, -0.5); c.closePath(); c.fill(); c.restore(); };
export const SNAKE: Icon = (c) => {
  c.lineWidth = 0.2; c.beginPath(); c.moveTo(-0.85, 0.45);
  c.bezierCurveTo(-0.5, -0.2, -0.2, 0.7, 0.1, 0.1); c.bezierCurveTo(0.3, -0.35, 0.5, -0.3, 0.62, -0.45); c.stroke();
  c.beginPath(); c.ellipse(0.72, -0.52, 0.2, 0.13, -0.5, 0, TAU); c.fill();
  c.lineWidth = 0.05; c.beginPath(); c.moveTo(0.88, -0.6); c.lineTo(1.0, -0.62); c.moveTo(0.95, -0.61); c.lineTo(1.0, -0.55); c.stroke();
};
export const FAN: Icon = (c) => {
  c.beginPath(); c.moveTo(0, 0.6);
  for (let i = 0; i <= 8; i++) { const a = Math.PI * (1.1 + (i / 8) * 0.8), r = i % 2 ? 0.95 : 0.85; c.lineTo(Math.cos(a) * r, 0.6 + Math.sin(a) * r * 1.35); }
  c.closePath(); c.fill();
  c.fillRect(-0.06, 0.55, 0.12, 0.4);
};
export const ROPE: Icon = (c) => {
  c.lineWidth = 0.14;
  for (let i = 0; i < 4; i++) { c.beginPath(); c.ellipse(0, -0.35 + i * 0.12, 0.62 - i * 0.04, 0.22, 0, 0, TAU); c.stroke(); }
  c.beginPath(); c.moveTo(0.5, 0.15); c.quadraticCurveTo(0.7, 0.6, 0.35, 0.85); c.stroke();
};
export const FISH: Icon = (c) => {
  c.beginPath(); c.ellipse(-0.1, 0, 0.62, 0.36, 0, 0, TAU); c.fill();
  c.beginPath(); c.moveTo(0.45, 0); c.lineTo(0.95, -0.4); c.lineTo(0.88, 0); c.lineTo(0.95, 0.4); c.closePath(); c.fill();
};
export const HAPPY_FISH: Icon = (c) => {
  FISH(c);
  c.save(); c.fillStyle = 'rgba(255,252,246,1)'; c.strokeStyle = 'rgba(255,252,246,1)'; c.lineWidth = 0.07;
  c.beginPath(); c.arc(-0.42, -0.08, 0.07, 0, TAU); c.fill();
  c.beginPath(); c.arc(-0.48, 0.06, 0.12, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke();
  c.restore();
  // little hearts of joy
  c.save(); c.translate(-0.15, -0.68); c.scale(0.22, 0.22); HEART(c); c.restore();
  c.save(); c.translate(0.3, -0.8); c.scale(0.15, 0.15); HEART(c); c.restore();
};
export const SCROLL: Icon = (c) => {
  c.lineWidth = 0.1; c.strokeRect(-0.55, -0.65, 1.1, 1.3);
  c.beginPath(); c.ellipse(0, -0.68, 0.68, 0.12, 0, 0, TAU); c.fill(); c.beginPath(); c.ellipse(0, 0.68, 0.68, 0.12, 0, 0, TAU); c.fill();
  for (let i = 0; i < 4; i++) c.fillRect(-0.38, -0.38 + i * 0.24, i === 3 ? 0.42 : 0.76, 0.07);
};
export const LAUREL: Icon = (c) => {
  for (const s of [-1, 1]) {
    for (let i = 0; i < 6; i++) {
      const a = Math.PI * (0.62 + i * 0.13);
      const x = Math.cos(a) * 0.7 * s, y = Math.sin(a) * 0.7;
      c.save(); c.translate(x, y); c.rotate(a + (s > 0 ? Math.PI : 0) + 0.5 * s);
      c.beginPath(); c.ellipse(0, 0, 0.1, 0.22, 0, 0, TAU); c.fill(); c.restore();
    }
  }
};
export const SCALES: Icon = (c) => {
  c.lineWidth = 0.1;
  c.beginPath(); c.moveTo(0, -0.8); c.lineTo(0, 0.7); c.moveTo(-0.4, 0.75); c.lineTo(0.4, 0.75); c.moveTo(-0.75, -0.5); c.lineTo(0.75, -0.5); c.stroke();
  for (const s of [-1, 1]) {
    c.beginPath(); c.moveTo(s * 0.75, -0.5); c.lineTo(s * 0.5, 0.05); c.moveTo(s * 0.75, -0.5); c.lineTo(s * 1.0, 0.05); c.stroke();
    c.beginPath(); c.arc(s * 0.75, 0.05, 0.25, 0, Math.PI); c.fill();
  }
  c.beginPath(); c.arc(0, -0.8, 0.09, 0, TAU); c.fill();
};
export const CLOCK = (h = 2, m = 0): Icon => (c) => {
  c.lineWidth = 0.12; c.beginPath(); c.arc(0, 0, 0.8, 0, TAU); c.stroke();
  for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; c.beginPath(); c.arc(Math.cos(a) * 0.65, Math.sin(a) * 0.65, 0.04, 0, TAU); c.fill(); }
  const ha = ((h % 12) / 12 + m / 720) * TAU - Math.PI / 2, ma = (m / 60) * TAU - Math.PI / 2;
  c.lineWidth = 0.13; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(ha) * 0.4, Math.sin(ha) * 0.4); c.stroke();
  c.lineWidth = 0.08; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(ma) * 0.6, Math.sin(ma) * 0.6); c.stroke();
};
export const CITY: Icon = (c) => {
  c.beginPath(); c.moveTo(-0.9, 0.7); c.lineTo(-0.9, 0.05); c.lineTo(-0.6, -0.15); c.lineTo(-0.3, 0.05); c.lineTo(-0.3, -0.4); c.lineTo(0, -0.75); c.lineTo(0.3, -0.4); c.lineTo(0.3, 0.0); c.lineTo(0.9, 0.0); c.lineTo(0.9, 0.7); c.closePath(); c.fill();
  c.save(); c.fillStyle = 'rgba(255,252,246,1)'; c.beginPath(); c.arc(0, 0.7, 0.18, Math.PI, 0); c.fill(); c.restore();
};
export const BOOK: Icon = (c) => {
  c.beginPath(); c.moveTo(0, -0.45); c.quadraticCurveTo(-0.45, -0.7, -0.9, -0.55); c.lineTo(-0.9, 0.6); c.quadraticCurveTo(-0.45, 0.45, 0, 0.7); c.quadraticCurveTo(0.45, 0.45, 0.9, 0.6); c.lineTo(0.9, -0.55); c.quadraticCurveTo(0.45, -0.7, 0, -0.45); c.fill();
};
export const LAMP: Icon = (c) => { c.beginPath(); c.ellipse(0, 0.35, 0.75, 0.3, 0, 0, TAU); c.fill(); c.beginPath(); c.moveTo(0.6, 0.25); c.lineTo(1.0, 0.0); c.lineTo(0.75, 0.4); c.fill(); c.save(); c.translate(0.95, -0.35); c.scale(0.4, 0.4); FLAME(c); c.restore(); };
export const CROWN: Icon = (c) => { c.beginPath(); c.moveTo(-0.8, 0.5); c.lineTo(-0.8, -0.3); c.lineTo(-0.4, 0.1); c.lineTo(0, -0.6); c.lineTo(0.4, 0.1); c.lineTo(0.8, -0.3); c.lineTo(0.8, 0.5); c.closePath(); c.fill(); };
/** A head in profile, facing right, with optional beard and baldness. */
export const HEAD = (o: { beard?: boolean; bald?: boolean; glow?: boolean } = {}): Icon => (c) => {
  c.beginPath(); c.ellipse(-0.05, -0.1, 0.52, 0.6, 0, 0, TAU); c.fill();
  c.beginPath(); c.moveTo(0.35, -0.1); c.lineTo(0.68, 0.18); c.lineTo(0.4, 0.25); c.fill();
  c.beginPath(); c.moveTo(-0.2, 0.4); c.lineTo(0.2, 0.4); c.lineTo(0.15, 0.85); c.lineTo(-0.3, 0.85); c.fill();
  if (o.beard) { c.beginPath(); c.moveTo(0.05, 0.25); c.quadraticCurveTo(0.5, 0.35, 0.35, 0.75); c.quadraticCurveTo(0.05, 0.85, -0.15, 0.45); c.fill(); }
  if (o.glow) { c.save(); c.fillStyle = 'rgba(255,214,120,1)'; c.beginPath(); c.arc(-0.08, -0.2, 0.2, 0, TAU); c.fill(); c.restore(); }
};
/** Socrates, recognisable by his snub nose, bald crown and beard. */
export const SOCRATES: Icon = (c) => {
  c.beginPath(); c.ellipse(-0.05, -0.12, 0.55, 0.58, 0, 0, TAU); c.fill();
  c.beginPath(); c.moveTo(0.38, -0.12); c.quadraticCurveTo(0.72, 0.0, 0.5, 0.18); c.fill();
  c.beginPath(); c.moveTo(-0.25, 0.25); c.quadraticCurveTo(0.45, 0.2, 0.42, 0.55); c.quadraticCurveTo(0.2, 0.95, -0.25, 0.75); c.fill();
  c.lineWidth = 0.07; c.beginPath(); c.arc(-0.45, -0.25, 0.12, Math.PI * 0.6, Math.PI * 1.4); c.stroke();
};
export const STAR: Icon = (c) => { c.beginPath(); for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU - Math.PI / 2, r = i % 2 ? 0.38 : 0.9; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath(); c.fill(); };
export const GEAR: Icon = (c) => {
  c.beginPath(); for (let i = 0; i < 16; i++) { const a = (i / 16) * TAU, r = i % 2 ? 0.62 : 0.85; c.lineTo(Math.cos(a - 0.12) * r, Math.sin(a - 0.12) * r); c.lineTo(Math.cos(a + 0.12) * r, Math.sin(a + 0.12) * r); } c.closePath(); c.fill();
  c.save(); c.fillStyle = 'rgba(255,252,246,1)'; c.beginPath(); c.arc(0, 0, 0.25, 0, TAU); c.fill(); c.restore();
};
export const ARROW: Icon = (c) => { c.lineWidth = 0.16; c.beginPath(); c.moveTo(-0.8, 0); c.lineTo(0.7, 0); c.moveTo(0.35, -0.35); c.lineTo(0.75, 0); c.lineTo(0.35, 0.35); c.stroke(); };
export const WAVES: Icon = (c) => { c.lineWidth = 0.12; for (let i = 0; i < 3; i++) { c.beginPath(); for (let x = -0.9; x <= 0.9; x += 0.05) c.lineTo(x, -0.4 + i * 0.4 + Math.sin(x * 7) * 0.1); c.stroke(); } };
export const SHIP: Icon = (c) => { c.beginPath(); c.moveTo(-0.95, 0.15); c.lineTo(0.95, 0.15); c.lineTo(0.65, 0.55); c.lineTo(-0.7, 0.55); c.closePath(); c.fill(); c.fillRect(-0.04, -0.85, 0.08, 1.0); c.beginPath(); c.moveTo(-0.6, -0.65); c.lineTo(0.6, -0.65); c.lineTo(0.5, 0.0); c.lineTo(-0.5, 0.0); c.closePath(); c.fill(); };

/** A row of tiny letters, for a page or a scroll. */
export const LINES: Icon = (c) => { for (let i = 0; i < 4; i++) c.fillRect(-0.75, -0.55 + i * 0.36, i === 3 ? 0.8 : 1.5, 0.12); };
