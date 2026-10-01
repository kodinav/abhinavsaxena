/**
 * Things people carry, worship and look at: drawn in a box `w` units wide
 * and 100 tall, placed by the middle of their base.
 */
type C = CanvasRenderingContext2D;
export interface Thing { w: number; draw: (c: C) => void }

export function put(c: C, thing: Thing, x: number, y: number, h: number, flip = false) {
  const s = h / 100;
  c.save();
  c.translate(x, y);
  c.scale(flip ? -s : s, s);
  c.translate(-thing.w / 2, -100);
  c.lineCap = 'round'; c.lineJoin = 'round';
  thing.draw(c);
  c.restore();
}

const ellipse = (c: C, x: number, y: number, rx: number, ry: number, rot = 0) => { c.beginPath(); c.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); c.fill(); };
const poly = (c: C, pts: number[]) => { c.beginPath(); c.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]); c.closePath(); c.fill(); };
const limb = (c: C, width: number, pts: number[]) => { c.lineWidth = width; c.beginPath(); c.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]); c.stroke(); };
const curve = (c: C, width: number, x0: number, y0: number, cx: number, cy: number, x1: number, y1: number) => { c.lineWidth = width; c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(cx, cy, x1, y1); c.stroke(); };

/** A storage amphora: neck, two looping handles, swelling body, narrow foot. */
export const amphora: Thing = {
  w: 60,
  draw(c) {
    c.fill(new Path2D('M19,2 H41 V7 H37 V18 C37,22 46,25 51,32 C58,42 58,58 52,70 C47,80 38,86 34,88 V92 H40 V100 H20 V92 H26 V88 C22,86 13,80 8,70 C2,58 2,42 9,32 C14,25 23,22 23,18 V7 H19 Z'));
    curve(c, 3.4, 23, 10, 9, 10, 12, 29);
    curve(c, 3.4, 37, 10, 51, 10, 48, 29);
  },
};

/** A horse in profile, walking left, on a carrying pole's plinth. */
export const horse: Thing = {
  w: 128,
  draw(c) {
    ellipse(c, 70, 50, 31, 15);
    ellipse(c, 45, 47, 15, 15);
    ellipse(c, 96, 46, 16, 15);
    poly(c, [36, 50, 54, 40, 40, 13, 28, 16, 30, 30]);
    poly(c, [30, 9, 40, 14, 33, 26, 16, 41, 9, 40, 8, 34, 22, 18]);
    poly(c, [31, 2, 36, 12, 29, 12]);
    poly(c, [34, 12, 52, 34, 54, 40, 44, 26]);
    limb(c, 6, [42, 58, 40, 79, 38, 97]);
    limb(c, 5.5, [51, 59, 57, 76, 50, 90]);
    limb(c, 6, [92, 56, 99, 75, 94, 97]);
    limb(c, 5.5, [104, 54, 108, 74, 109, 97]);
    c.lineWidth = 6;
    c.beginPath(); c.moveTo(108, 40); c.bezierCurveTo(122, 44, 124, 62, 117, 80); c.stroke();
  },
};

/** A kouros: the archaic standing statue of a man, left foot forward. */
export const kouros: Thing = {
  w: 52,
  draw(c) {
    ellipse(c, 26, 9, 6.5, 8);
    poly(c, [23, 15, 29, 15, 30, 22, 22, 22]);
    poly(c, [12, 22, 40, 22, 37, 50, 15, 50]);
    poly(c, [15, 48, 37, 48, 36, 58, 16, 58]);
    limb(c, 5.5, [13, 24, 10, 40, 12, 55]);
    limb(c, 5.5, [39, 24, 42, 40, 40, 55]);
    limb(c, 8, [20, 56, 15, 76, 10, 96]);
    limb(c, 8, [32, 56, 35, 76, 38, 96]);
    limb(c, 4.5, [4, 98, 14, 98]);
    limb(c, 4.5, [36, 98, 44, 98]);
  },
};

/** An owl on a branch. */
export const owl: Thing = {
  w: 60,
  draw(c) {
    ellipse(c, 30, 60, 19, 29);
    ellipse(c, 30, 28, 17, 14);
    poly(c, [13, 10, 22, 19, 14, 24]);
    poly(c, [47, 10, 38, 19, 46, 24]);
    limb(c, 4, [2, 94, 58, 94]);
  },
};

/** A kylix, the wide drinking cup. */
export const kylix: Thing = {
  w: 120,
  draw(c) {
    c.fill(new Path2D('M10,40 H110 C108,58 88,70 68,72 V86 C68,90 80,92 84,96 V100 H36 V96 C40,92 52,90 52,86 V72 C32,70 12,58 10,40 Z'));
    curve(c, 4, 14, 46, -2, 44, 6, 32);
    curve(c, 4, 106, 46, 122, 44, 114, 32);
  },
};
