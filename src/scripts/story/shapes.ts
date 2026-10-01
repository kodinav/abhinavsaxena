/**
 * Silhouettes for the background story, drawn with Canvas 2D in white so they
 * can serve both as shadows (the mask) and as figures for particles to fill.
 *
 * Each shape is authored in a box `w` units wide and 100 units tall and is
 * placed by its bottom-centre: `place(ctx, x, y, h, draw)` puts the shape's
 * base at (x, y) in pixels, `h` pixels tall.
 */
type Ctx = CanvasRenderingContext2D;
export interface Shape { w: number; draw: (ctx: Ctx) => void }

export function place(ctx: Ctx, shape: Shape, x: number, y: number, h: number, flip = false) {
  const s = h / 100;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(flip ? -s : s, s);
  ctx.translate(-shape.w / 2, -100);
  shape.draw(ctx);
  ctx.restore();
}

const ellipse = (ctx: Ctx, x: number, y: number, rx: number, ry: number, rot = 0) => {
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); ctx.fill();
};
const poly = (ctx: Ctx, pts: number[]) => {
  ctx.beginPath(); ctx.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
  ctx.closePath(); ctx.fill();
};
const limb = (ctx: Ctx, width: number, pts: number[]) => {
  ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
  ctx.stroke();
};
const curve = (ctx: Ctx, width: number, x0: number, y0: number, cx: number, cy: number, x1: number, y1: number) => {
  ctx.lineWidth = width; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(cx, cy, x1, y1); ctx.stroke();
};

/* ---------------------------------------------------------------- the carried objects */

/** A storage amphora: neck, two looping handles, swelling body, narrow foot. */
export const amphora: Shape = {
  w: 60,
  draw(ctx) {
    ctx.fill(new Path2D('M19,2 H41 V7 H37 V18 C37,22 46,25 51,32 C58,42 58,58 52,70 C47,80 38,86 34,88 V92 H40 V100 H20 V92 H26 V88 C22,86 13,80 8,70 C2,58 2,42 9,32 C14,25 23,22 23,18 V7 H19 Z'));
    curve(ctx, 3.4, 23, 10, 9, 10, 12, 29);
    curve(ctx, 3.4, 37, 10, 51, 10, 48, 29);
  },
};

/** A horse in profile, walking left. */
export const horse: Shape = {
  w: 128,
  draw(ctx) {
    ellipse(ctx, 70, 50, 31, 15);          // barrel
    ellipse(ctx, 45, 47, 15, 15);          // chest
    ellipse(ctx, 96, 46, 16, 15);          // quarters
    poly(ctx, [36, 50, 54, 40, 40, 13, 28, 16, 30, 30]);              // neck
    poly(ctx, [30, 9, 40, 14, 33, 26, 16, 41, 9, 40, 8, 34, 22, 18]); // head
    poly(ctx, [31, 2, 36, 12, 29, 12]);                                // ear
    poly(ctx, [34, 12, 52, 34, 54, 40, 44, 26]);                       // mane
    limb(ctx, 6, [42, 58, 40, 79, 38, 97]);                            // near fore
    limb(ctx, 5.5, [51, 59, 57, 76, 50, 90]);                          // far fore, lifted
    limb(ctx, 6, [92, 56, 99, 75, 94, 97]);                            // near hind
    limb(ctx, 5.5, [104, 54, 108, 74, 109, 97]);                       // far hind
    ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(108, 40); ctx.bezierCurveTo(122, 44, 124, 62, 117, 80); ctx.stroke(); // tail
  },
};

/** A kouros: the archaic standing statue, left foot forward, arms at its sides. */
export const statue: Shape = {
  w: 52,
  draw(ctx) {
    ellipse(ctx, 26, 9, 6.5, 8);                   // head
    poly(ctx, [23, 15, 29, 15, 30, 22, 22, 22]);   // neck
    poly(ctx, [12, 22, 40, 22, 37, 50, 15, 50]);   // torso
    poly(ctx, [15, 48, 37, 48, 36, 58, 16, 58]);   // hips
    limb(ctx, 5.5, [13, 24, 10, 40, 12, 55]);      // arms
    limb(ctx, 5.5, [39, 24, 42, 40, 40, 55]);
    limb(ctx, 8, [20, 56, 15, 76, 10, 96]);        // forward leg
    limb(ctx, 8, [32, 56, 35, 76, 38, 96]);        // standing leg
    limb(ctx, 4.5, [4, 98, 14, 98]);               // feet
    limb(ctx, 4.5, [36, 98, 44, 98]);
  },
};

/** Athena's owl, perched. */
export const owl: Shape = {
  w: 60,
  draw(ctx) {
    ellipse(ctx, 30, 60, 19, 29);                       // body
    ellipse(ctx, 30, 28, 17, 14);                       // head
    poly(ctx, [13, 10, 22, 19, 14, 24]);                // ear tufts
    poly(ctx, [47, 10, 38, 19, 46, 24]);
    limb(ctx, 4, [2, 94, 58, 94]);                      // branch
    ctx.save(); ctx.globalCompositeOperation = 'destination-out';
    ellipse(ctx, 23, 28, 4.2, 4.2); ellipse(ctx, 37, 28, 4.2, 4.2); // eyes, cut through
    ctx.restore();
  },
};

/** A kylix, the wide drinking cup, on its stem. */
export const kylix: Shape = {
  w: 120,
  draw(ctx) {
    ctx.fill(new Path2D('M10,40 H110 C108,58 88,70 68,72 V86 C68,90 80,92 84,96 V100 H36 V96 C40,92 52,90 52,86 V72 C32,70 12,58 10,40 Z'));
    curve(ctx, 4, 14, 46, -2, 44, 6, 32);
    curve(ctx, 4, 106, 46, 122, 44, 114, 32);
  },
};

/* ---------------------------------------------------------------- people */

/** A prisoner seen from behind: head and shoulders. */
export const prisoner: Shape = {
  w: 60,
  draw(ctx) {
    ctx.fill(new Path2D('M4,100 C4,80 10,66 22,62 C25,61 26,58 26,55 L34,55 C34,58 35,61 38,62 C50,66 56,80 56,100 Z'));
    ellipse(ctx, 30, 40, 12.5, 16);
  },
};

/** A prisoner standing up. */
export const standing: Shape = {
  w: 50,
  draw(ctx) {
    ellipse(ctx, 25, 10, 6.5, 8);
    ctx.fill(new Path2D('M12,100 L12,48 C12,30 15,22 22,20 L28,20 C35,22 38,30 38,48 L38,100 Z'));
    limb(ctx, 6, [14, 26, 9, 46, 10, 62]);
    limb(ctx, 6, [36, 26, 41, 46, 40, 62]);
  },
};

/**
 * A figure of light facing right: the back hand low and open, the front hand
 * held out. Returns the hand positions (in the shape's units) for the spark.
 */
export const teller: Shape & { back: [number, number]; front: [number, number] } = {
  w: 60,
  back: [12, 52],
  front: [53, 36],
  draw(ctx) {
    ellipse(ctx, 29, 9, 6.5, 8);                    // head
    poly(ctx, [26, 15, 32, 15, 33, 21, 25, 21]);    // neck
    poly(ctx, [18, 21, 40, 21, 37, 52, 21, 52]);    // torso
    limb(ctx, 5, [20, 24, 15, 38, 12, 52]);         // back arm, low
    limb(ctx, 5, [38, 24, 46, 32, 53, 36]);         // front arm, offered
    limb(ctx, 7, [24, 52, 22, 74, 21, 97]);         // legs
    limb(ctx, 7, [34, 52, 38, 74, 41, 97]);
  },
};

/* ---------------------------------------------------------------- the sun */

export function sun(ctx: Ctx, cx: number, cy: number, r: number) {
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  const rays = 18;
  ctx.lineCap = 'round';
  for (let i = 0; i < rays; i++) {
    const a = (i / rays) * Math.PI * 2 + 0.09;
    const long = i % 2 === 0;
    const r0 = r * 1.32, r1 = r * (long ? 2.05 : 1.7);
    ctx.lineWidth = r * (long ? 0.075 : 0.055);
    ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); ctx.stroke();
  }
}

/* ================================================================ a posable human figure */

export interface Pose {
  facing?: 1 | -1;            // 1 faces right
  robe?: boolean;             // a chiton to the knee
  cloak?: boolean;            // a long cloak to the ankle
  stride?: number;            // 0 standing … 1 mid-step
  front?: [number, number];   // front arm: shoulder angle from hanging (deg, + is forward), elbow bend (deg)
  back?: [number, number];
  head?: 'plain' | 'beard' | 'hat' | 'crown' | 'ibis';
  seated?: boolean;
  bend?: number;              // lean of the torso (deg, + forward)
  torch?: boolean;            // a torch in the front hand
}

/**
 * Draws a person standing on (x, base), `h` pixels tall, in the current fill
 * and stroke colour. Returns the positions of the hands and head, which the
 * stories use to place sparks, lines and labels.
 */
export function figure(c: Ctx, x: number, base: number, h: number, pose: Pose = {}) {
  const u = h / 100, f = pose.facing ?? 1, seated = !!pose.seated;
  const P = (px: number, py: number): [number, number] => [x + f * px * u, base - py * u];
  const lean = ((pose.bend ?? 0) * Math.PI) / 180;
  const hipY = seated ? 36 : 50, shoulderY = hipY + 31, headY = hipY + 41;
  // torso points rotate about the hips
  const T = (px: number, py: number): [number, number] => {
    const dy = py - hipY;
    return P(px + Math.sin(lean) * dy, hipY + Math.cos(lean) * dy);
  };
  const fill = (pts: [number, number][]) => { c.beginPath(); c.moveTo(...pts[0]); for (const q of pts.slice(1)) c.lineTo(...q); c.closePath(); c.fill(); };
  const stroke = (pts: [number, number][], w: number) => { c.lineWidth = w * u; c.beginPath(); c.moveTo(...pts[0]); for (const q of pts.slice(1)) c.lineTo(...q); c.stroke(); };
  c.lineCap = 'round'; c.lineJoin = 'round';
  // legs
  const s = pose.stride ?? 0;
  if (seated) {
    stroke([P(4, hipY), P(21, hipY + 1), P(22, 2)], 7.2);
    stroke([P(-1, hipY), P(17, hipY + 1), P(18, 2)], 7.2);
  } else {
    stroke([P(3, 50), P(3 + 8 * s, 27), P(4 + 15 * s, 1.5)], 7);
    stroke([P(-3, 50), P(-3 - 4 * s, 27), P(-4 - 13 * s, 1.5)], 7);
  }
  // torso: shoulders, a narrower waist, hips
  fill([T(-10.5, shoulderY), T(10.5, shoulderY), T(8.5, shoulderY - 4), T(6.2, hipY + 10), T(7.4, hipY - 2), T(-7.4, hipY - 2), T(-6.2, hipY + 10), T(-8.5, shoulderY - 4)]);
  if (pose.robe || pose.cloak) {
    if (seated) {
      // the robe falls over the lap and down to the shins
      fill([T(-9.5, shoulderY - 2), T(9.5, shoulderY - 2), T(8, hipY + 4), P(23, hipY + 3), P(24, 10), P(13, 10), P(12, hipY - 3), P(-8, hipY - 3)]);
    } else {
      const hem = pose.cloak ? 5 : 25;
      c.beginPath();
      c.moveTo(...T(-10, shoulderY - 1)); c.lineTo(...T(10, shoulderY - 1));
      c.quadraticCurveTo(...P(11, hipY), ...P(13 + 7 * s, hem));
      c.quadraticCurveTo(...P(0, hem - 2), ...P(-13 - 5 * s, hem));
      c.quadraticCurveTo(...P(-11, hipY), ...T(-10, shoulderY - 1));
      c.closePath(); c.fill();
    }
  }
  // arms
  const arm = (side: number, a: [number, number] | undefined) => {
    const [th, ph] = a ?? [6, 6];
    const t1 = (th * Math.PI) / 180, t2 = ((th + ph) * Math.PI) / 180;
    const sx = side * 9 + Math.sin(lean) * (shoulderY - hipY), sy = shoulderY - 2;
    const ex = sx + Math.sin(t1) * 16.5, ey = sy - Math.cos(t1) * 16.5;
    const hx = ex + Math.sin(t2) * 15.5, hy = ey - Math.cos(t2) * 15.5;
    stroke([P(sx, sy), P(ex, ey), P(hx, hy)], 5.2);
    return P(hx, hy);
  };
  const back = arm(-1, pose.back);
  const front = arm(1, pose.front);
  // neck and head
  fill([T(-2.6, shoulderY + 3), T(2.6, shoulderY + 3), T(2.8, shoulderY - 1), T(-2.8, shoulderY - 1)]);
  const [hx, hy] = T(1, headY);
  ctxEllipse(c, hx, hy, 6.8 * u, 8 * u);
  const head = pose.head ?? 'plain';
  if (head === 'beard') fill([T(-1, headY - 3), T(6.5, headY - 3.5), T(4.5, headY - 12), T(-1, headY - 10)]);
  if (head === 'hat') { ctxEllipse(c, hx, hy - 6.6 * u, 11 * u, 2.3 * u); fill([T(-5.5, headY + 6), T(7, headY + 6), T(6.2, headY + 14), T(-4.6, headY + 14)]); }
  if (head === 'crown') fill([T(-6.4, headY + 6), T(-6.4, headY + 14), T(-3, headY + 9.5), T(0.6, headY + 15), T(4, headY + 9.5), T(7.4, headY + 14), T(7.4, headY + 6)]);
  if (head === 'ibis') {
    c.lineWidth = 2.8 * u;
    c.beginPath(); c.moveTo(...T(5, headY + 1)); c.quadraticCurveTo(...T(17, headY + 1), ...T(20, headY - 12)); c.stroke();
  }
  if (pose.torch) stroke([[front[0], front[1] + 4 * u], [front[0] + f * 1.5 * u, front[1] - 14 * u]], 2.4);
  return { front, back, head: [hx, hy] as [number, number] };
}
/** A plain chair or throne, drawn under a seated figure at (x, base) of the same height `h`. */
export function throne(c: Ctx, x: number, base: number, h: number, facing: 1 | -1 = 1) {
  const u = h / 100, f = facing;
  c.fillRect(x - (f > 0 ? 12 : -12 + 26) * u, base - 36 * u, 26 * u, 4 * u);       // seat
  c.fillRect(x - f * 13 * u - 2 * u, base - 70 * u, 4 * u, 70 * u);                  // back post
  c.fillRect(x + f * 12 * u - 2 * u, base - 36 * u, 4 * u, 36 * u);                  // front leg
}
const ctxEllipse = (c: Ctx, x: number, y: number, rx: number, ry: number) => { c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); c.fill(); };

/* ================================================================ animals */

/** A bird in flight, wings raised; `beat` (0..1) lowers the wings. */
export const bird = (beat = 0): Shape => ({
  w: 100,
  draw(ctx) {
    ellipse(ctx, 52, 58, 20, 7);
    ellipse(ctx, 74, 54, 7, 6);
    poly(ctx, [79, 53, 90, 55, 79, 57]);
    poly(ctx, [32, 56, 16, 50, 18, 62]);
    const lift = 1 - beat * 1.6;
    ctx.beginPath(); ctx.moveTo(44, 55); ctx.quadraticCurveTo(36, 55 - 34 * lift, 12, 52 - 40 * lift); ctx.quadraticCurveTo(40, 40 - 8 * lift, 60, 54); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(50, 55); ctx.quadraticCurveTo(54, 52 - 30 * lift, 40, 46 - 36 * lift); ctx.quadraticCurveTo(62, 42 - 6 * lift, 64, 55); ctx.closePath(); ctx.fill();
  },
});

/** A lion, walking left: mane, body, tail with a tuft. */
export const lion: Shape = {
  w: 130,
  draw(ctx) {
    ellipse(ctx, 76, 52, 34, 16);
    ellipse(ctx, 36, 40, 24, 27);               // mane
    ellipse(ctx, 18, 46, 11, 9);                // muzzle
    poly(ctx, [24, 22, 30, 16, 32, 26]);        // ear
    limb(ctx, 7, [40, 60, 38, 80, 36, 98]);
    limb(ctx, 6.5, [52, 62, 56, 80, 50, 96]);
    limb(ctx, 7, [96, 60, 102, 79, 98, 98]);
    limb(ctx, 6.5, [106, 58, 110, 78, 112, 97]);
    ctx.lineWidth = 3.4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(106, 46); ctx.bezierCurveTo(124, 42, 126, 64, 120, 74); ctx.stroke();
    ellipse(ctx, 120, 76, 4.5, 6);
  },
};

/** The ibis, Theuth's bird: long legs, curved neck, long curved bill. */
export const ibis: Shape = {
  w: 90,
  draw(ctx) {
    ellipse(ctx, 50, 50, 22, 12, -0.12);
    poly(ctx, [68, 46, 86, 56, 70, 56]);                 // tail
    ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(34, 46); ctx.quadraticCurveTo(20, 34, 26, 18); ctx.stroke(); // neck
    ellipse(ctx, 26, 15, 6, 5.5);
    ctx.lineWidth = 2.6;
    ctx.beginPath(); ctx.moveTo(22, 15); ctx.quadraticCurveTo(6, 16, 2, 34); ctx.stroke();    // bill
    limb(ctx, 2.6, [48, 60, 46, 80, 44, 99]);
    limb(ctx, 2.6, [54, 60, 58, 80, 56, 99]);
  },
};

/** An elephant facing left, drawn in parts so each can be lit on its own. */
export const elephantParts = {
  w: 150,
  side(ctx: Ctx) { ellipse(ctx, 86, 48, 46, 26); ellipse(ctx, 128, 46, 17, 20); },
  head(ctx: Ctx) { ellipse(ctx, 40, 36, 20, 21); },
  ear(ctx: Ctx) { ctx.beginPath(); ctx.moveTo(48, 20); ctx.bezierCurveTo(74, 14, 78, 56, 54, 62); ctx.quadraticCurveTo(44, 48, 48, 20); ctx.fill(); },
  trunk(ctx: Ctx) { ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(26, 44); ctx.bezierCurveTo(12, 62, 22, 86, 10, 96); ctx.stroke(); },
  tusk(ctx: Ctx) { ctx.lineWidth = 3.6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(30, 52); ctx.quadraticCurveTo(26, 70, 12, 70); ctx.stroke(); },
  legs(ctx: Ctx) { for (const [x, d] of [[60, 0], [76, 2], [112, -2], [130, 1]]) limb(ctx, 13, [x, 60, x + d, 96]); },
  tail(ctx: Ctx) { ctx.lineWidth = 2.6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(144, 40); ctx.quadraticCurveTo(152, 56, 147, 72); ctx.stroke(); ellipse(ctx, 147, 75, 2.6, 4); },
};

/** A small fish, swimming left. */
export const fish: Shape = {
  w: 60,
  draw(ctx) { ellipse(ctx, 26, 60, 18, 8); poly(ctx, [40, 60, 54, 50, 54, 70]); },
};

/* ================================================================ places and things */

/** A temple front: steps, six columns, architrave and pediment. Fills the box (x, y, w, h). */
export function temple(c: Ctx, x: number, y: number, w: number, h: number) {
  const step = h * 0.05;
  for (let i = 0; i < 3; i++) c.fillRect(x - i * step * 0.8, y + h - (i + 1) * step, w + i * step * 1.6, step * 0.82);
  const colTop = y + h * 0.36, colBot = y + h - 3 * step, n = 6, cw = w * 0.07;
  for (let i = 0; i < n; i++) {
    const cx = x + w * 0.08 + (i * (w * 0.84 - cw)) / (n - 1);
    c.fillRect(cx, colTop, cw, colBot - colTop);
    c.fillRect(cx - cw * 0.2, colTop - h * 0.025, cw * 1.4, h * 0.025);   // capital
  }
  c.fillRect(x - w * 0.02, y + h * 0.25, w * 1.04, h * 0.085);            // architrave
  c.beginPath(); c.moveTo(x - w * 0.04, y + h * 0.25); c.lineTo(x + w / 2, y); c.lineTo(x + w * 1.04, y + h * 0.25); c.closePath(); c.fill();
}

/** A three-legged bronze tripod with its bowl. */
export function tripod(c: Ctx, x: number, base: number, h: number) {
  c.lineCap = 'round'; c.lineWidth = h * 0.05;
  for (const d of [-0.32, 0, 0.32]) { c.beginPath(); c.moveTo(x + d * h * 0.2, base - h * 0.62); c.lineTo(x + d * h, base); c.stroke(); }
  c.beginPath(); c.ellipse(x, base - h * 0.66, h * 0.3, h * 0.1, 0, 0, Math.PI); c.fill();
  c.fillRect(x - h * 0.32, base - h * 0.7, h * 0.64, h * 0.05);
}

/** Houses on a hill. */
export function city(c: Ctx, x: number, base: number, w: number, h: number) {
  c.beginPath(); c.moveTo(x - w * 0.1, base); c.quadraticCurveTo(x + w * 0.5, base - h * 0.5, x + w * 1.1, base); c.closePath(); c.fill();
  const houses = [[0.12, 0.3, 0.42], [0.3, 0.22, 0.6], [0.48, 0.26, 0.7], [0.66, 0.2, 0.58], [0.8, 0.24, 0.4]];
  for (const [fx, fw, fh] of houses) {
    const hx = x + fx * w, hw = fw * w * 0.7, hh = fh * h * 0.55, hb = base - h * 0.38 * Math.sin(Math.PI * Math.min(1, Math.max(0, fx + fw / 2)));
    c.fillRect(hx, hb - hh, hw, hh);
    c.beginPath(); c.moveTo(hx - hw * 0.1, hb - hh); c.lineTo(hx + hw / 2, hb - hh - hw * 0.45); c.lineTo(hx + hw * 1.1, hb - hh); c.closePath(); c.fill();
  }
}

/** A clock face: ring, twelve ticks and two hands set to (hours, minutes). */
export function clock(c: Ctx, x: number, y: number, r: number, hours: number, minutes: number) {
  c.lineWidth = r * 0.07; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.stroke();
  c.lineCap = 'round';
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2, r0 = r * (i % 3 === 0 ? 0.74 : 0.82);
    c.lineWidth = r * (i % 3 === 0 ? 0.06 : 0.035);
    c.beginPath(); c.moveTo(x + Math.sin(a) * r0, y - Math.cos(a) * r0); c.lineTo(x + Math.sin(a) * r * 0.9, y - Math.cos(a) * r * 0.9); c.stroke();
  }
  const ha = ((hours % 12) + minutes / 60) / 12 * Math.PI * 2, ma = (minutes / 60) * Math.PI * 2;
  c.lineWidth = r * 0.075; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.sin(ha) * r * 0.5, y - Math.cos(ha) * r * 0.5); c.stroke();
  c.lineWidth = r * 0.05; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.sin(ma) * r * 0.72, y - Math.cos(ma) * r * 0.72); c.stroke();
  c.beginPath(); c.arc(x, y, r * 0.07, 0, Math.PI * 2); c.fill();
}

/** A ring (for Venn circles and jewels). */
export function ring(c: Ctx, x: number, y: number, r: number, width: number) { c.lineWidth = width; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.stroke(); }

/** A block of wax fresh from the comb: a rounded slab stamped with cells. */
export function waxBlock(c: Ctx, x: number, y: number, w: number, h: number) {
  const r = h * 0.12;
  c.beginPath(); c.roundRect(x, y, w, h, r); c.fill();
  c.save(); c.globalCompositeOperation = 'destination-out';
  const s = h * 0.13;
  for (let row = 0; row < 4; row++) for (let col = 0; col < 7; col++) {
    const cx = x + w * 0.12 + col * s * 1.75 + (row % 2) * s * 0.87, cy = y + h * 0.2 + row * s * 1.5;
    if (cx > x + w * 0.9) continue;
    c.beginPath();
    for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2 + Math.PI / 6; c.lineTo(cx + Math.cos(a) * s * 0.55, cy + Math.sin(a) * s * 0.55); }
    c.closePath(); c.fill();
  }
  c.restore();
}

/** Melted wax: a low, irregular pool with a few stray drops. */
export function puddle(c: Ctx, x: number, y: number, w: number, h: number) {
  c.beginPath();
  const n = 26;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    const r = 1 + 0.12 * Math.sin(a * 3 + 0.6) + 0.07 * Math.sin(a * 7 + 1.9);
    const px = x + w / 2 + Math.cos(a) * (w / 2) * r * 0.92, py = y + h * 0.62 + Math.sin(a) * (h * 0.3) * r;
    i ? c.lineTo(px, py) : c.moveTo(px, py);
  }
  c.closePath(); c.fill();
  for (const [fx, fy, fr] of [[0.02, 0.5, 0.05], [0.96, 0.78, 0.04], [0.9, 0.3, 0.03], [0.1, 0.92, 0.035]]) { c.beginPath(); c.ellipse(x + w * fx, y + h * fy, w * fr, h * fr * 1.4, 0, 0, Math.PI * 2); c.fill(); }
}

/** A galley: hull split into `planks` vertical sections (draw one with `only`), mast, sail, oars. */
export function galley(c: Ctx, x: number, y: number, w: number, h: number, part: 'hull' | 'sail' | 'oars', plank = -1, planks = 7) {
  const deck = y + h * 0.6, keel = y + h * 0.84;
  const hull = new Path2D();
  hull.moveTo(x, deck - h * 0.12);
  hull.quadraticCurveTo(x + w * 0.08, deck, x + w * 0.18, deck);
  hull.lineTo(x + w * 0.86, deck);
  hull.quadraticCurveTo(x + w * 0.96, deck - h * 0.02, x + w, deck - h * 0.2);
  hull.quadraticCurveTo(x + w * 0.9, keel, x + w * 0.7, keel);
  hull.lineTo(x + w * 0.24, keel);
  hull.quadraticCurveTo(x + w * 0.08, keel, x, deck - h * 0.12);
  if (part === 'hull') {
    c.save(); c.clip(hull);
    if (plank < 0) c.fillRect(x, y, w, h);
    else { const pw = w / planks; c.fillRect(x + plank * pw, y, pw * 0.94, h); }
    c.restore();
  } else if (part === 'sail') {
    c.fillRect(x + w * 0.49, y + h * 0.05, w * 0.012, deck - y - h * 0.05);
    c.beginPath(); c.moveTo(x + w * 0.3, y + h * 0.1); c.lineTo(x + w * 0.7, y + h * 0.1); c.quadraticCurveTo(x + w * 0.74, y + h * 0.32, x + w * 0.68, y + h * 0.5); c.lineTo(x + w * 0.32, y + h * 0.5); c.quadraticCurveTo(x + w * 0.27, y + h * 0.32, x + w * 0.3, y + h * 0.1); c.fill();
  } else {
    c.lineCap = 'round'; c.lineWidth = h * 0.018;
    for (let i = 0; i < 9; i++) { const ox = x + w * (0.24 + i * 0.065); c.beginPath(); c.moveTo(ox, deck + h * 0.06); c.lineTo(ox - w * 0.05, y + h); c.stroke(); }
  }
}

/** An arched bridge with posts and a handrail that follow the deck. */
export function bridge(c: Ctx, x: number, y: number, w: number, h: number) {
  const top = (t: number) => (1 - t) * (1 - t) * (y + h) + 2 * (1 - t) * t * (y - h * 0.15) + t * t * (y + h);
  c.beginPath();
  c.moveTo(x, y + h); c.quadraticCurveTo(x + w / 2, y - h * 0.15, x + w, y + h);
  c.lineTo(x + w * 0.9, y + h); c.quadraticCurveTo(x + w / 2, y + h * 0.2, x + w * 0.1, y + h); c.closePath(); c.fill();
  c.lineCap = 'round'; c.lineWidth = Math.max(1.5, h * 0.035);
  const rail = h * 0.24;
  for (let i = 1; i < 10; i++) { const t = i / 10; c.beginPath(); c.moveTo(x + w * t, top(t)); c.lineTo(x + w * t, top(t) - rail); c.stroke(); }
  c.beginPath();
  for (let i = 0; i <= 30; i++) { const t = 0.06 + (i / 30) * 0.88, px = x + w * t, py = top(t) - rail; i ? c.lineTo(px, py) : c.moveTo(px, py); }
  c.stroke();
}

/** A picture frame with a figure painted in it. */
export function painting(c: Ctx, x: number, y: number, w: number, h: number) {
  c.lineWidth = Math.max(2, w * 0.05); c.strokeRect(x, y, w, h);
  figure(c, x + w / 2, y + h * 0.95, h * 0.8, { robe: true, facing: 1, front: [20, 30], head: 'plain' });
}
