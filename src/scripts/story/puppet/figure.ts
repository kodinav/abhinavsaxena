/**
 * Puppets: articulated silhouettes in profile, in the manner of black-figure
 * vase painting — a dark figure with its details (eye, folds, beard) incised
 * in the colour of the ground behind it.
 *
 * A body stands with its feet at (x, y) and is h tall. Inside, the figure is
 * drawn in its own units: 100 tall, x towards where it faces, y up. Limbs are
 * posed either by angle (degrees from hanging straight down, positive towards
 * the face; the second number bends the elbow or knee) or by reaching for a
 * point, in which case the elbow or knee finds its own place.
 */
type C = CanvasRenderingContext2D;
type P = [number, number];
export type Prop = 'torch' | 'scroll' | 'lyre' | 'hammer' | 'cane' | 'staff' | 'lamp' | 'sack' | 'tablet' | 'stick' | 'fan' | 'bowl' | 'branch' | 'stalk' | 'sword' | 'caduceus' | 'bolt' | null;

export interface Body {
  x: number; y: number; h: number;
  face?: 1 | -1;
  /** lean of the torso and tilt of the head (degrees, positive = forwards / looking down) */
  lean?: number; tilt?: number;
  /** arms by angle: [shoulder, elbow] */
  arm?: [number, number]; arm2?: [number, number];
  /** arms by target, in world coordinates (wins over the angles) */
  reach?: P | null; reach2?: P | null;
  /** legs by angle: [hip, knee] */
  leg?: [number, number]; leg2?: [number, number];
  /** feet by target, in the figure's own units relative to its origin (wins over the angles) */
  foot?: P | null; foot2?: P | null;
  /** lower the hips by this many units (sitting, kneeling, crouching) */
  drop?: number;
  /** a vertical bob, in units (walking) */
  bob?: number;
  robe?: 'short' | 'long' | 'cloak' | null;
  beard?: boolean;
  hat?: 'brim' | 'petasos' | 'crown' | 'laurel' | 'hood' | 'cap' | 'helmet' | 'turban' | 'topknot' | null;
  head?: 'human' | 'ibis' | 'bald';
  hair?: 'long' | 'bun' | 'curls' | null;
  eye?: 'open' | 'closed' | 'blind' | 'wide';
  mouth?: number;
  hold?: Prop; hold2?: Prop;
  /** wings on the hat (Hermes) */
  wings?: boolean;
  /** time, for cloth and flame */
  t?: number;
  /** body proportions: 1 adult, smaller for a youth */
  build?: number;
  /** the ground colour, for incised details; leave out to draw a plain silhouette */
  cut?: string;
}

export interface Joints {
  head: P; neck: P; mouth: P; eye: P; hand: P; hand2: P; foot: P; foot2: P; hip: P; chest: P;
  /** where flames burn (torch, lamp) */
  flames: P[];
  /** the business end of a held prop */
  tip: P | null;
}

const R = Math.PI / 180;
/** direction of a limb at `deg` from straight down, in y-up space with x forwards */
const dir = (deg: number): P => [Math.sin(deg * R), -Math.cos(deg * R)];
const rot = (p: P, a: number): P => [p[0] * Math.cos(a) - p[1] * Math.sin(a), p[0] * Math.sin(a) + p[1] * Math.cos(a)];
const add = (a: P, b: P): P => [a[0] + b[0], a[1] + b[1]];
const scale = (p: P, k: number): P => [p[0] * k, p[1] * k];

/** A tapered limb with rounded ends. */
function bone(c: C, a: P, b: P, w1: number, w2: number) {
  const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1e-6;
  const nx = -dy / len, ny = dx / len;
  c.beginPath();
  c.moveTo(a[0] + nx * w1 / 2, a[1] + ny * w1 / 2);
  c.lineTo(b[0] + nx * w2 / 2, b[1] + ny * w2 / 2);
  c.lineTo(b[0] - nx * w2 / 2, b[1] - ny * w2 / 2);
  c.lineTo(a[0] - nx * w1 / 2, a[1] - ny * w1 / 2);
  c.closePath(); c.fill();
  c.beginPath(); c.arc(a[0], a[1], w1 / 2, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.arc(b[0], b[1], w2 / 2, 0, Math.PI * 2); c.fill();
}
/** A closed smooth outline through points. */
function blob(c: C, pts: P[]) {
  const n = pts.length;
  const mid = (a: P, b: P): P => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  c.beginPath();
  const m0 = mid(pts[n - 1], pts[0]);
  c.moveTo(m0[0], m0[1]);
  for (let i = 0; i < n; i++) { const p = pts[i], m = mid(p, pts[(i + 1) % n]); c.quadraticCurveTo(p[0], p[1], m[0], m[1]); }
  c.closePath(); c.fill();
}

/** Two-bone reach: where the middle joint goes so the limb ends at `target`; `bend` +1 puts it forwards. */
function ik(root: P, target: P, a: number, b: number, bend: 1 | -1): [P, P] {
  let dx = target[0] - root[0], dy = target[1] - root[1];
  let d = Math.hypot(dx, dy) || 1e-6;
  const max = a + b - 0.01, min = Math.abs(a - b) + 0.01;
  if (d > max) { dx *= max / d; dy *= max / d; d = max; }
  if (d < min) { dx *= min / d; dy *= min / d; d = min; }
  const cosA = Math.max(-1, Math.min(1, (a * a + d * d - b * b) / (2 * a * d)));
  // turn the root→target direction towards the bend side (counter-clockwise in y-up space carries a hanging limb forwards)
  const ang = Math.acos(cosA) * bend;
  const ux = dx / d, uy = dy / d;
  const mid: P = [root[0] + (ux * Math.cos(ang) - uy * Math.sin(ang)) * a, root[1] + (ux * Math.sin(ang) + uy * Math.cos(ang)) * a];
  return [mid, [root[0] + dx, root[1] + dy]];
}

/** Draws a person and says where their hands, head, mouth and feet ended up, in world units. */
export function person(c: C, b: Body): Joints {
  const u = b.h / 100, f = b.face ?? 1, t = b.t ?? 0, s = b.build ?? 1;
  const drop = b.drop ?? 0, bob = b.bob ?? 0;
  const lean = (b.lean ?? 0) * R, tilt = (b.tilt ?? 0) * R;
  const toW = (p: P): P => [b.x + f * p[0] * u, b.y - p[1] * u];
  const toL = (w: P): P => [((w[0] - b.x) / u) * f, (b.y - w[1]) / u];

  const thigh = 24 * s, shin = 23 * s, upper = 17 * s, fore = 15 * s;
  const hip: P = [0, thigh + shin + 4 - drop + bob];
  const neck = add(hip, rot([0, 28 * s], -lean));
  const sh = add(neck, rot([0, -4], -lean));
  const headC = add(neck, rot([0.6, 9.8], -lean - tilt));

  // legs
  const legAt = (L: [number, number] | undefined, F: P | null | undefined, dx: number) => {
    const root: P = [hip[0] + dx, hip[1]];
    if (F) { const [knee, ankle] = ik(root, F, thigh, shin, 1); return { knee, ankle }; }
    const [a, k] = L ?? [0, 0];
    const knee = add(root, scale(dir(a), thigh));
    const ankle = add(knee, scale(dir(a - k), shin));
    return { knee, ankle };
  };
  const ln = legAt(b.leg, b.foot, 1.5), lf = legAt(b.leg2, b.foot2, -1.5);
  const drawLeg = (p: { knee: P; ankle: P }) => {
    bone(c, [hip[0], hip[1]], p.knee, 10.5, 7.6);
    bone(c, p.knee, p.ankle, 7.6, 4.6);
    // a pointed shoe
    c.beginPath();
    c.moveTo(p.ankle[0] - 3, p.ankle[1] + 2.2);
    c.quadraticCurveTo(p.ankle[0] + 3, p.ankle[1] + 2.8, p.ankle[0] + 9.5, p.ankle[1] - 1.2);
    c.lineTo(p.ankle[0] - 3.4, p.ankle[1] - 1.6);
    c.closePath(); c.fill();
  };

  // arms
  const armAt = (A: [number, number] | undefined, T: P | null | undefined, back: number) => {
    const root: P = add(sh, [back * 1.5, 0]);
    if (T) {
      const [elbow, hand] = ik(root, toL(T), upper, fore, -1);
      return { elbow, hand, ang: Math.atan2(hand[0] - elbow[0], -(hand[1] - elbow[1])) / R };
    }
    const [a, e] = A ?? (back < 0 ? [-6, 8] : [8, 10]);
    const elbow = add(root, scale(dir(a), upper));
    const hand = add(elbow, scale(dir(a + e), fore));
    return { elbow, hand, ang: a + e };
  };
  const an = armAt(b.arm, b.reach, 1), af = armAt(b.arm2, b.reach2, -1);
  const drawArm = (p: { elbow: P; hand: P; ang: number }) => {
    bone(c, sh, p.elbow, 7.4, 5.6);
    bone(c, p.elbow, p.hand, 5.6, 4.2);
    c.beginPath(); c.ellipse(p.hand[0], p.hand[1], 3.2, 2.7, -p.ang * R, 0, Math.PI * 2); c.fill();
  };

  c.save();
  c.translate(b.x, b.y);
  c.scale(f * u, -u);
  c.lineCap = 'round'; c.lineJoin = 'round';

  drawArm(af);
  drawLeg(lf);
  // torso, about the hip: chest forwards, a straight back
  c.save(); c.translate(hip[0], hip[1]); c.rotate(-lean);
  blob(c, [[-7.4, -2], [-7.2, 10], [-7.6, 20 * s], [-5.5, 27 * s], [0, 30 * s], [6, 28 * s], [9, 21 * s], [8.2, 14], [6.4, 7], [7.4, -1], [0, -5]]);
  c.restore();
  const robe = b.robe ?? null;
  const sway = Math.sin(t * 2.2) * 1.4;
  const hemOf = (p: { knee: P; ankle: P }, hemY: number) => {
    const [kx, ky] = p.knee, [ax, ay] = p.ankle;
    if (hemY >= ky) { const k = (hip[1] - hemY) / Math.max(1, hip[1] - ky); return hip[0] + (kx - hip[0]) * k; }
    const k = (ky - hemY) / Math.max(1, ky - ay); return kx + (ax - kx) * k;
  };
  let hemLine: [P, P] | null = null;
  if (robe) {
    const seated = drop > 14;
    if (seated) {
      // drapery over the lap and down the shins
      const kn = ln.knee[0] > lf.knee[0] ? ln : lf;
      const hemY = robe === 'short' ? kn.knee[1] - 3 : Math.max(2, Math.min(ln.ankle[1], lf.ankle[1]) + 3);
      blob(c, [
        add(sh, [-7, 2]), add(sh, [5, 1]), add(neck, rot([9, -9], -lean)), [hip[0] + 6, hip[1] + 7], [kn.knee[0] + 3, kn.knee[1] + 4.5],
        [kn.knee[0] + 5.5, kn.knee[1] - 2], [kn.ankle[0] + 5 + sway * 0.4, hemY], [kn.ankle[0] - 7, hemY], [kn.knee[0] - 6, kn.knee[1] - 5], [hip[0] - 4, hip[1] - 6], [hip[0] - 9, hip[1] + 2], add(sh, [-9, -8]),
      ]);
      hemLine = [[kn.ankle[0] - 6, hemY + 2], [kn.ankle[0] + 4.5, hemY + 2]];
    } else {
      const hemY = robe === 'short' ? Math.max(ln.knee[1], lf.knee[1]) - 1 : Math.max(3, Math.min(ln.ankle[1], lf.ankle[1]) + 4);
      const xs = [hemOf(ln, hemY), hemOf(lf, hemY)];
      // the hem follows the legs, but never flares wider than a stride
      const mid = (xs[0] + xs[1]) / 2, half = Math.min(Math.abs(xs[0] - xs[1]) / 2 + 8, 15);
      const front = mid + half + sway, back = mid - half + sway * 0.5;
      const cape = robe === 'cloak' ? -6 - 3 * Math.abs(Math.sin(t * 1.6)) : 0;
      blob(c, [
        add(sh, [-6, 2]), add(sh, [5, 2]), add(neck, rot([9.5, -8], -lean)), add(hip, rot([9.2, 4], -lean)),
        [front, hemY + 3], [front + 1.2, hemY - 1.5], [(front + back) / 2, hemY - 3], [back + cape - 1, hemY - 1.5], [back + cape, hemY + 3],
        add(hip, rot([-10 + cape * 0.6, 3], -lean)), add(sh, [-9 + cape * 0.3, -7]),
      ]);
      hemLine = [[back + cape + 1.5, hemY], [front - 1.5, hemY]];
    }
  }
  drawLeg(ln);

  // head
  c.save(); c.translate(headC[0], headC[1]); c.rotate(-lean - tilt);
  bone(c, [-1, -10], [0.4, -4], 6.4, 5.6); // neck
  const kind = b.head ?? 'human';
  if (kind === 'ibis') {
    c.beginPath(); c.ellipse(0, 1, 5.6, 5.2, 0, 0, Math.PI * 2); c.fill();
    c.lineWidth = 2.6; c.beginPath(); c.moveTo(4, 2); c.quadraticCurveTo(15, 2.5, 18.5, -11); c.stroke();
    // the long wig of an Egyptian god
    blob(c, [[-6, 6], [3, 5], [-2, -14], [-9, -12], [-8, -2]]);
  } else {
    c.beginPath(); c.ellipse(0, 0.4, 7, 8, 0, 0, Math.PI * 2); c.fill();
    // brow, nose, lips and chin, so the way a figure faces is never in doubt
    const m = b.mouth ?? 0;
    c.beginPath();
    c.moveTo(4.6, 6.2); c.quadraticCurveTo(7.4, 4.4, 7.2, 2.4); c.lineTo(9.6, -1.6); c.lineTo(7.2, -2.4);
    c.lineTo(7.4, -3.4 - m * 0.4); c.lineTo(6.2 - m * 1.2, -4.2 - m * 0.8); c.lineTo(7.2, -5.2 - m * 1.6); c.quadraticCurveTo(7.4, -7.8, 4.6, -8.2); c.lineTo(2, -6);
    c.closePath(); c.fill();
    if (b.beard) blob(c, [[1.6, -3], [7, -5.4], [6.8, -11.5], [3.6, -14.5], [-1, -10], [-2.6, -4]]);
    if (b.hair === 'long') blob(c, [[-7.2, 6], [1, 8.6], [-2, -4], [-8, -17], [-11, -12], [-9, 0]]);
    if (b.hair === 'bun') { c.beginPath(); c.arc(-7.4, 4.6, 3.6, 0, Math.PI * 2); c.fill(); }
    if (b.hair === 'curls') for (let i = 0; i < 6; i++) { c.beginPath(); c.arc(-6 + i * 2.2, 7.6 + Math.sin(i * 1.7) * 0.7, 2.3, 0, Math.PI * 2); c.fill(); }
  }
  const hat = b.hat ?? null;
  if (hat === 'brim') { c.beginPath(); c.ellipse(0.5, 6.6, 12.5, 2.2, 0, 0, Math.PI * 2); c.fill(); c.beginPath(); c.roundRect(-5.8, 6.4, 11.8, 8.6, 2.5); c.fill(); }
  if (hat === 'cap') { c.beginPath(); c.ellipse(0, 4, 7.6, 5.6, 0, Math.PI, 0, true); c.fill(); }
  if (hat === 'petasos') {
    c.beginPath(); c.ellipse(0.5, 6.4, 12, 2.4, -0.06, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.ellipse(0, 7.6, 6.2, 4.4, 0, Math.PI, 0, true); c.fill();
  }
  if (hat === 'helmet') { blob(c, [[-7.5, 2], [-6, 9], [2, 11], [7.5, 6], [7.6, 1], [3, 2], [2.6, -3], [-2, -7], [-8, -4]]); c.beginPath(); c.moveTo(-6, 10); c.quadraticCurveTo(-2, 19, 6, 12); c.lineTo(3, 10); c.closePath(); c.fill(); }
  if (hat === 'crown') { c.beginPath(); c.moveTo(-6.8, 5.4); c.lineTo(-6.8, 13); c.lineTo(-3.4, 9.4); c.lineTo(0.4, 15); c.lineTo(4, 9.4); c.lineTo(7.4, 13); c.lineTo(7.4, 5.4); c.closePath(); c.fill(); }
  if (hat === 'laurel') for (let i = 0; i < 7; i++) { const a = Math.PI * (0.1 + i * 0.13); c.beginPath(); c.ellipse(Math.cos(a) * 7.6, 2 + Math.sin(a) * 6.4, 1.3, 2.8, a + 0.4, 0, Math.PI * 2); c.fill(); }
  if (hat === 'turban') { blob(c, [[-8, 3], [-7.5, 10], [0, 12.5], [7.6, 9.6], [7.8, 3.6], [0, 5]]); }
  if (hat === 'topknot') { c.beginPath(); c.arc(-1, 9.4, 3.2, 0, Math.PI * 2); c.fill(); c.fillRect(-1.6, 9, 1.2, 6.5); }
  if (hat === 'hood') blob(c, [[-9, 9], [3, 11], [8, 5], [7, -2], [-2, -10], [-10, -5]]);
  if (b.wings) blob(c, [[-3, 8], [-8, 16], [-14, 15.5], [-11, 12.5], [-15, 11.5], [-10, 9]]);
  // incised details: the eye, the line of the hair
  if (b.cut) {
    c.fillStyle = b.cut; c.strokeStyle = b.cut;
    if (kind === 'ibis') { c.beginPath(); c.arc(2.4, 2.2, 1.1, 0, Math.PI * 2); c.fill(); }
    else {
      const ey = b.eye ?? 'open';
      if (ey === 'open' || ey === 'wide') { c.beginPath(); c.ellipse(4.2, 1.9, 1.6, ey === 'wide' ? 1.3 : 0.85, 0, 0, Math.PI * 2); c.fill(); }
      if (ey === 'closed') { c.lineWidth = 0.7; c.beginPath(); c.arc(4.2, 2.6, 1.6, Math.PI * 1.15, Math.PI * 1.85, false); c.stroke(); }
      if (ey === 'blind') c.fillRect(-7.2, 1.1, 15.2, 2.4);
      if (!hat && kind !== 'bald') { c.lineWidth = 0.55; c.beginPath(); c.moveTo(-2.6, 3.4); c.quadraticCurveTo(0.6, 7.6, 5, 6.8); c.stroke(); }
    }
  }
  c.restore();

  // near arm, then what the hands hold
  drawArm(an);
  const flames: P[] = [];
  let tip: P | null = null;
  const prop = (p: Prop | undefined, arm: { elbow: P; hand: P; ang: number }) => {
    if (!p) return;
    const hd = arm.hand, d = dir(arm.ang);
    switch (p) {
      case 'torch': bone(c, [hd[0] - d[0] * 3, hd[1] - 4], [hd[0] + 1.5, hd[1] + 16], 2.6, 3.6); flames.push([hd[0] + 1.8, hd[1] + 20]); tip = [hd[0] + 1.5, hd[1] + 16]; break;
      case 'lamp': c.beginPath(); c.ellipse(hd[0] + 3, hd[1] + 1.4, 5.4, 2.6, 0, 0, Math.PI * 2); c.fill(); bone(c, [hd[0] + 7, hd[1] + 1.4], [hd[0] + 10.6, hd[1] + 3], 2, 1.4); flames.push([hd[0] + 11, hd[1] + 6]); tip = [hd[0] + 11, hd[1] + 5]; break;
      case 'scroll': c.save(); c.translate(hd[0], hd[1]); c.rotate(Math.atan2(d[1], d[0]) + Math.PI / 2); c.fillRect(-2, -6.5, 4, 13); c.beginPath(); c.arc(0, -6.5, 2.6, 0, Math.PI * 2); c.arc(0, 6.5, 2.6, 0, Math.PI * 2); c.fill(); c.restore(); tip = hd; break;
      case 'tablet': c.save(); c.translate(hd[0] + 2, hd[1]); c.rotate(-0.15); c.fillRect(-1, -2, 12, 15); c.restore(); tip = [hd[0] + 7, hd[1] + 5]; break;
      case 'lyre': {
        c.save(); c.translate(hd[0] + 3, hd[1] + 2); c.lineWidth = 2;
        c.beginPath(); c.moveTo(-5.5, 0); c.quadraticCurveTo(-8.5, 9, -4, 15); c.moveTo(5.5, 0); c.quadraticCurveTo(8.5, 9, 4, 15); c.moveTo(-5, 13); c.lineTo(5, 13); c.stroke();
        c.beginPath(); c.ellipse(0, 0, 6.4, 3.4, 0, 0, Math.PI * 2); c.fill();
        c.lineWidth = 0.5; for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(i * 1.3, 1); c.lineTo(i * 1.3, 13); c.stroke(); }
        c.restore(); break;
      }
      case 'hammer': { const e: P = [hd[0] + d[0] * 15, hd[1] + d[1] * 15]; bone(c, [hd[0] - d[0] * 2, hd[1] - d[1] * 2], e, 2.4, 2.4); c.save(); c.translate(e[0], e[1]); c.rotate(Math.atan2(d[1], d[0])); c.fillRect(-2.5, -5, 6, 10); c.restore(); tip = e; break; }
      case 'cane': c.lineWidth = 1.8; c.beginPath(); c.moveTo(hd[0], hd[1]); c.lineTo(hd[0] + 10, 0.8); c.stroke(); tip = [hd[0] + 10, 0.8]; break;
      case 'stick': c.lineWidth = 1.6; c.beginPath(); c.moveTo(hd[0] - d[0] * 4, hd[1] - d[1] * 4); c.lineTo(hd[0] + d[0] * 22, hd[1] + d[1] * 22); c.stroke(); tip = [hd[0] + d[0] * 22, hd[1] + d[1] * 22]; break;
      case 'staff': c.lineWidth = 2.2; c.beginPath(); c.moveTo(hd[0] - 1, 0.5); c.lineTo(hd[0] + 1.2, hd[1] + 30); c.stroke(); tip = [hd[0] + 1.2, hd[1] + 30]; break;
      case 'caduceus': {
        c.lineWidth = 2; c.beginPath(); c.moveTo(hd[0], hd[1] - 8); c.lineTo(hd[0] + 1, hd[1] + 24); c.stroke();
        c.lineWidth = 1.1; c.beginPath(); for (let i = 0; i <= 16; i++) { const v = i / 16; c.lineTo(hd[0] + 0.6 + Math.sin(v * 9) * 2.4, hd[1] + 2 + v * 20); } c.stroke();
        c.beginPath(); c.arc(hd[0] + 1, hd[1] + 25, 2, 0, Math.PI * 2); c.fill();
        tip = [hd[0] + 1, hd[1] + 25]; break;
      }
      case 'bolt': c.beginPath(); c.moveTo(hd[0] - 2, hd[1] + 16); c.lineTo(hd[0] + 3, hd[1] + 6); c.lineTo(hd[0] - 1, hd[1] + 5); c.lineTo(hd[0] + 3, hd[1] - 6); c.lineTo(hd[0] - 3, hd[1] + 3); c.lineTo(hd[0] + 1, hd[1] + 4); c.closePath(); c.fill(); tip = [hd[0] - 2, hd[1] + 16]; break;
      case 'sack': c.beginPath(); c.ellipse(hd[0] + 1, hd[1] - 8, 6.5, 8.5, 0.1, 0, Math.PI * 2); c.fill(); break;
      case 'fan': c.save(); c.translate(hd[0], hd[1]); c.rotate(Math.atan2(d[1], d[0]) - Math.PI / 2); c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, 11, Math.PI * 0.75, Math.PI * 1.25, false); c.closePath(); c.fill(); c.restore(); break;
      case 'bowl': c.beginPath(); c.arc(hd[0] + 3, hd[1] + 2, 5, Math.PI, 0, true); c.fill(); tip = [hd[0] + 3, hd[1] + 3]; break;
      case 'branch': {
        c.lineWidth = 1.2; c.beginPath(); c.moveTo(hd[0], hd[1]); c.lineTo(hd[0] + 4, hd[1] + 18); c.stroke();
        for (let i = 0; i < 6; i++) { const v = 4 + i * 2.6; c.beginPath(); c.ellipse(hd[0] + v * 0.22 + (i % 2 ? 2.2 : -2.2), hd[1] + v, 1.2, 2.6, i % 2 ? -0.7 : 0.7, 0, Math.PI * 2); c.fill(); }
        tip = [hd[0] + 4, hd[1] + 18]; break;
      }
      case 'stalk': c.lineWidth = 2; c.beginPath(); c.moveTo(hd[0] - d[0] * 6, hd[1] - d[1] * 6); c.lineTo(hd[0] + d[0] * 14, hd[1] + d[1] * 14); c.stroke(); tip = [hd[0] + d[0] * 14, hd[1] + d[1] * 14]; break;
      case 'sword': c.lineWidth = 1.8; c.beginPath(); c.moveTo(hd[0], hd[1]); c.lineTo(hd[0] + d[0] * 20, hd[1] + d[1] * 20); c.stroke(); c.lineWidth = 3; c.beginPath(); c.moveTo(hd[0] - d[1] * 3, hd[1] + d[0] * 3); c.lineTo(hd[0] + d[1] * 3, hd[1] - d[0] * 3); c.stroke(); tip = [hd[0] + d[0] * 20, hd[1] + d[1] * 20]; break;
    }
  };
  prop(b.hold, an);
  prop(b.hold2, af);

  // incised drapery: a hem border, a belt and a few folds
  if (b.cut && robe && hemLine) {
    c.strokeStyle = b.cut; c.lineWidth = 0.7;
    const [h0, h1] = hemLine;
    c.beginPath(); c.moveTo(h0[0], h0[1] + 1.6); c.lineTo(h1[0], h1[1] + 1.6); c.stroke();
    const waist = add(hip, rot([0, 7], -lean));
    for (let i = 0; i < 3; i++) {
      const v = (i + 1) / 4;
      const x1 = h0[0] + (h1[0] - h0[0]) * v;
      c.beginPath(); c.moveTo(waist[0] - 4 + v * 8, waist[1]); c.quadraticCurveTo(x1 + sway * 0.3, (waist[1] + h0[1]) / 2, x1, h0[1] + 3.4); c.stroke();
    }
    c.beginPath(); c.moveTo(waist[0] - 7.5, waist[1] + 1); c.lineTo(waist[0] + 8, waist[1] + 0.4); c.stroke();
  }
  c.restore();

  const mouthL: P = add(headC, rot([7.6, -4], -lean - tilt));
  const eyeL: P = add(headC, rot([4.2, 1.9], -lean - tilt));
  return {
    head: toW(headC), neck: toW(neck), mouth: toW(mouthL), eye: toW(eyeL), hand: toW(an.hand), hand2: toW(af.hand),
    foot: toW(ln.ankle), foot2: toW(lf.ankle), hip: toW(hip), chest: toW(add(neck, rot([4, -8], -lean))),
    flames: flames.map(toW), tip: tip ? toW(tip) : null,
  };
}

/* ---------------------------------------------------------------- motion */

/** A walk cycle at `phase` (one stride pair per unit): legs, arms and the bob of the body. */
export function walk(phase: number, stride = 1): Pick<Body, 'leg' | 'leg2' | 'arm' | 'arm2' | 'bob'> {
  const th = phase * Math.PI * 2;
  const leg = (p: number): [number, number] => [26 * Math.sin(p) * stride, (6 + 52 * Math.max(0, Math.cos(p)) ** 2) * stride];
  const arm = (p: number): [number, number] => [-22 * Math.sin(p) * stride, (10 + 16 * Math.max(0, -Math.sin(p))) * stride];
  return { leg: leg(th), leg2: leg(th + Math.PI), arm: arm(th), arm2: arm(th + Math.PI), bob: -1.6 * Math.abs(Math.sin(th)) * stride };
}

/** Named gestures for the arms: [shoulder, elbow] for the near arm and the far arm. */
export const GESTURE = {
  rest: { arm: [8, 10], arm2: [-6, 8] },
  point: { arm: [88, -4], arm2: [-8, 12] },
  pointUp: { arm: [146, -8], arm2: [-6, 10] },
  pointDown: { arm: [52, 6], arm2: [-6, 10] },
  raise: { arm: [172, 0], arm2: [-6, 8] },
  both: { arm: [150, 10], arm2: [140, 16] },
  shield: { arm: [100, 100], arm2: [30, 70] },
  chin: { arm: [32, 132], arm2: [14, 76] },
  scratch: { arm: [148, 118], arm2: [-6, 8] },
  offer: { arm: [72, 6], arm2: [62, 14] },
  receive: { arm: [48, 50], arm2: [40, 56] },
  shrug: { arm: [44, 104], arm2: [34, 110] },
  hips: { arm: [22, -122], arm2: [-28, 120] },
  cross: { arm: [36, 112], arm2: [28, 122] },
  wave: { arm: [150, 34], arm2: [-6, 8] },
  plead: { arm: [100, 26], arm2: [92, 30] },
  write: { arm: [56, 46], arm2: [40, 52] },
  fist: { arm: [124, 70], arm2: [-10, 30] },
  carry: { arm: [168, 18], arm2: [160, 26] },
  bow: { arm: [20, 30], arm2: [10, 34] },
} as const satisfies Record<string, { arm: [number, number]; arm2: [number, number] }>;
export type Gesture = keyof typeof GESTURE;

/** Blend two pairs of angles. */
export const mixA = (a: readonly [number, number], b: readonly [number, number], k: number): [number, number] => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
/** Blend two named gestures. */
export function gesture(a: Gesture, b: Gesture = a, k = 0): { arm: [number, number]; arm2: [number, number] } {
  const A = GESTURE[a], B = GESTURE[b];
  return { arm: mixA(A.arm, B.arm, k), arm2: mixA(A.arm2, B.arm2, k) };
}

/** Sitting on the ground, knees up (foot targets in the figure's units). */
export const SIT: Pick<Body, 'drop' | 'foot' | 'foot2'> = { drop: 42, foot: [24, 1], foot2: [21, 1] };
/** Sitting on a chair or a rock about a quarter of the figure's height. */
export const CHAIR: Pick<Body, 'drop' | 'foot' | 'foot2'> = { drop: 25, foot: [21, 1], foot2: [17, 1] };
/** Kneeling on the back knee. */
export const KNEEL: Pick<Body, 'drop' | 'foot' | 'foot2'> = { drop: 22, foot: [17, 1], foot2: [-20, 1] };
