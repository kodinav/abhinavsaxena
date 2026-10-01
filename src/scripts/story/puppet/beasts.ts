/**
 * Animals, drawn like the people: dark silhouettes in profile with incised
 * details, placed by their feet (x, y) and their height h, facing right
 * unless `face` is -1. Internally each is drawn in units of 100 = its height.
 */
type C = CanvasRenderingContext2D;
type P = [number, number];
const TAU = Math.PI * 2;
const R = Math.PI / 180;

function blob(c: C, pts: P[]) {
  const n = pts.length;
  const mid = (a: P, b: P): P => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  c.beginPath();
  const m0 = mid(pts[n - 1], pts[0]);
  c.moveTo(m0[0], m0[1]);
  for (let i = 0; i < n; i++) { const p = pts[i], m = mid(p, pts[(i + 1) % n]); c.quadraticCurveTo(p[0], p[1], m[0], m[1]); }
  c.closePath(); c.fill();
}
function bone(c: C, a: P, b: P, w1: number, w2: number) {
  const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1e-6;
  const nx = -dy / len, ny = dx / len;
  c.beginPath();
  c.moveTo(a[0] + nx * w1 / 2, a[1] + ny * w1 / 2); c.lineTo(b[0] + nx * w2 / 2, b[1] + ny * w2 / 2);
  c.lineTo(b[0] - nx * w2 / 2, b[1] - ny * w2 / 2); c.lineTo(a[0] - nx * w1 / 2, a[1] - ny * w1 / 2);
  c.closePath(); c.fill();
  c.beginPath(); c.arc(a[0], a[1], w1 / 2, 0, TAU); c.fill();
  c.beginPath(); c.arc(b[0], b[1], w2 / 2, 0, TAU); c.fill();
}
const ell = (c: C, x: number, y: number, rx: number, ry: number, rot = 0) => { c.beginPath(); c.ellipse(x, y, rx, ry, rot, 0, TAU); c.fill(); };
/** a limb at `deg` from straight down (positive = forwards) */
const dir = (deg: number): P => [Math.sin(deg * R), -Math.cos(deg * R)];

interface Place { x: number; y: number; h: number; face?: 1 | -1; cut?: string }
function frame(c: C, o: Place) {
  const u = o.h / 100, f = o.face ?? 1;
  c.save(); c.translate(o.x, o.y); c.scale(f * u, -u);
  c.lineCap = 'round'; c.lineJoin = 'round';
  return { toW: (p: P): P => [o.x + f * p[0] * u, o.y - p[1] * u] };
}

/* ---------------------------------------------------------------- the elephant */
export interface Elephant extends Place {
  /** walk phase (strides), and how much it walks (0 = standing) */
  phase?: number; stride?: number;
  /** trunk: overall curl (radians per segment), its wiggle (0..1, snake-like) and a lift (radians) */
  curl?: number; wiggle?: number; lift?: number;
  /** ear flap 0..1, tail swing 0..1 */
  flap?: number; swing?: number;
  t?: number;
  ivory?: string;
}
export interface ElephantParts { side: P; tusk: P; trunk: P[]; knee: P; ear: P; tail: P; head: P; eye: P; back: P }

export function elephant(c: C, o: Elephant): ElephantParts {
  const { toW } = frame(c, o);
  const t = o.t ?? 0, ph = (o.phase ?? 0) * TAU, st = o.stride ?? 0;
  // legs: far pair first
  const leg = (x: number, phase: number, w: number) => {
    const a = Math.sin(phase) * 14 * st, k = Math.max(0, Math.cos(phase)) * 18 * st;
    const top: P = [x, 46];
    const knee: P = [top[0] + dir(a)[0] * 24, top[1] + dir(a)[1] * 24];
    const foot: P = [knee[0] + dir(a - k)[0] * 22, Math.max(2, knee[1] + dir(a - k)[1] * 22)];
    bone(c, top, knee, w, w * 0.9); bone(c, knee, foot, w * 0.9, w * 0.95);
    c.beginPath(); c.roundRect(foot[0] - w * 0.55, foot[1] - 3, w * 1.1, 4, 1.5); c.fill();
    return knee;
  };
  leg(18, ph + Math.PI, 15); leg(-46, ph, 15);
  // tail
  const sw = Math.sin(t * 2.2) * 0.5 * (o.swing ?? 0.3);
  const tail: P = [-66 - 10 * Math.sin(0.4 + sw), 66 - 38 * Math.cos(0.4 + sw)];
  c.lineWidth = 2.6; c.beginPath(); c.moveTo(-60, 70); c.quadraticCurveTo(-68, 58, tail[0], tail[1]); c.stroke();
  ell(c, tail[0], tail[1] - 2, 2.2, 5, sw);
  // body: rump, barrel, shoulders, a domed head
  blob(c, [[-62, 56], [-60, 78], [-40, 92], [-10, 96], [22, 98], [42, 96], [58, 104], [74, 98], [80, 84], [78, 70], [66, 58], [50, 40], [20, 36], [-20, 36], [-50, 40]]);
  const kneeN = leg(28, ph, 16);
  leg(-36, ph + Math.PI, 16);
  // trunk: a chain of segments from the face, hanging down unless curled or lifted
  const segs = 12, lift = o.lift ?? 0, curl = o.curl ?? 0.07, wig = o.wiggle ?? 0;
  const pts: P[] = [[78, 74]];
  let ang = -Math.PI / 2 + 0.25 + lift; // pointing down, a little forwards
  for (let i = 0; i < segs; i++) {
    ang += curl + wig * 0.42 * Math.sin(t * 3.2 - i * 0.75);
    const last = pts[pts.length - 1];
    pts.push([last[0] + Math.cos(ang) * 5.6, last[1] + Math.sin(ang) * 5.6]);
  }
  for (let i = 0; i < segs; i++) bone(c, pts[i], pts[i + 1], 13 - i * 0.75, 12.25 - (i + 1) * 0.75);
  // ear: a great flap that swings out from its root
  const fl = 1 - 0.38 * (0.5 + 0.5 * Math.sin(t * 2.6)) * (o.flap ?? 0.3);
  c.save(); c.translate(52, 88); c.scale(fl, 1);
  blob(c, [[0, 4], [-14, 6], [-26, -2], [-28, -22], [-20, -40], [-8, -42], [0, -30], [4, -10]]);
  if (o.cut) { c.strokeStyle = o.cut; c.lineWidth = 0.9; c.beginPath(); c.moveTo(-4, -2); c.quadraticCurveTo(-20, -6, -20, -30); c.stroke(); }
  c.restore();
  // tusk, in ivory
  c.fillStyle = o.ivory ?? o.cut ?? '#eee';
  c.beginPath(); c.moveTo(72, 64); c.quadraticCurveTo(86, 56, 98, 64); c.quadraticCurveTo(86, 52, 70, 59); c.closePath(); c.fill();
  if (o.cut) {
    c.fillStyle = o.cut; ell(c, 66, 82, 2, 1.5);
    c.strokeStyle = o.cut; c.lineWidth = 0.8;
    for (let i = 3; i < segs; i += 2) { const p = pts[i]; c.beginPath(); c.arc(p[0], p[1], 3.4, 0.2, 1.4); c.stroke(); }
  }
  c.restore();
  return { side: toW([-8, 70]), tusk: toW([98, 64]), trunk: pts.map(toW), knee: toW([kneeN[0], kneeN[1] - 4]), ear: toW([38, 70]), tail: toW(tail), head: toW([66, 92]), eye: toW([66, 82]), back: toW([0, 96]) };
}

/* ---------------------------------------------------------------- four-legged beasts */
export type BeastKind = 'lion' | 'deer' | 'bear' | 'horse' | 'sheep' | 'dog' | 'boar';
export interface Beast extends Place {
  kind: BeastKind;
  /** stride phase, and stride size (0 standing, 1 walking, 1.6 running) */
  phase?: number; stride?: number;
  /** head up (+) or down (-), degrees */
  head?: number;
  mouth?: number;
  t?: number;
}
const SPEC: Record<BeastKind, { bl: number; bh: number; L: number; neck: P; hr: number; snout: number; tail: number }> = {
  lion:  { bl: 96, bh: 36, L: 44, neck: [12, 16], hr: 12, snout: 9, tail: 46 },
  deer:  { bl: 72, bh: 26, L: 56, neck: [14, 30], hr: 7, snout: 12, tail: 8 },
  bear:  { bl: 96, bh: 50, L: 32, neck: [12, 4], hr: 15, snout: 10, tail: 4 },
  horse: { bl: 96, bh: 34, L: 52, neck: [18, 28], hr: 9, snout: 18, tail: 34 },
  sheep: { bl: 72, bh: 42, L: 26, neck: [12, 10], hr: 8, snout: 9, tail: 8 },
  dog:   { bl: 70, bh: 26, L: 40, neck: [12, 16], hr: 8, snout: 11, tail: 26 },
  boar:  { bl: 86, bh: 40, L: 26, neck: [10, 6], hr: 12, snout: 14, tail: 10 },
};
export function beast(c: C, o: Beast): { head: P; mouth: P; back: P; tail: P } {
  const { toW } = frame(c, o);
  const s = SPEC[o.kind], t = o.t ?? 0, ph = (o.phase ?? 0) * TAU, st = o.stride ?? 0;
  const by = s.L + s.bh / 2 - 2;
  const fx = s.bl * 0.34, bx = -s.bl * 0.34;
  const legs = (pairs: [number, number][], w: number) => pairs.forEach(([x, p]) => {
    const a = Math.sin(p) * 22 * st, k = (8 + Math.max(0, Math.cos(p)) * 40) * Math.min(1, st);
    const top: P = [x, by - s.bh * 0.2];
    const len = s.L + s.bh * 0.2 - 2;
    const knee: P = [top[0] + dir(a)[0] * len * 0.52, top[1] + dir(a)[1] * len * 0.52];
    const foot: P = [knee[0] + dir(a - k)[0] * len * 0.5, Math.max(1.5, knee[1] + dir(a - k)[1] * len * 0.5)];
    bone(c, top, knee, w, w * 0.7); bone(c, knee, foot, w * 0.7, w * 0.55);
  });
  const lw = o.kind === 'bear' || o.kind === 'boar' ? 13 : o.kind === 'deer' ? 5.5 : o.kind === 'sheep' ? 6 : 9;
  legs([[fx - 4, ph + Math.PI], [bx - 4, ph + Math.PI * 0.5]], lw);
  // tail
  const tw = Math.sin(t * 2.4) * 0.3;
  if (o.kind === 'lion' || o.kind === 'dog') {
    const end: P = [bx - s.bl * 0.2 - s.tail * 0.5, by + 4 - s.tail * 0.6 + tw * 10];
    c.lineWidth = 3; c.beginPath(); c.moveTo(-s.bl / 2 + 2, by + 6); c.quadraticCurveTo(-s.bl / 2 - s.tail * 0.6, by + 14, end[0], end[1]); c.stroke();
    if (o.kind === 'lion') ell(c, end[0], end[1], 4, 6, 0.5);
  } else if (o.kind === 'horse') {
    blob(c, [[-s.bl / 2 + 4, by + 10], [-s.bl / 2 - 14, by + 4], [-s.bl / 2 - 22 + tw * 8, by - 26], [-s.bl / 2 - 12 + tw * 6, by - 30], [-s.bl / 2 - 4, by - 6]]);
  } else { ell(c, -s.bl / 2 - 2, by + 6, 4, 3, 0.4); }
  // body
  if (o.kind === 'sheep') {
    for (let i = 0; i < 11; i++) { const a = (i / 11) * TAU; ell(c, Math.cos(a) * s.bl * 0.42, by + Math.sin(a) * s.bh * 0.42, 11, 11); }
    ell(c, 0, by, s.bl * 0.46, s.bh * 0.48);
  } else if (o.kind === 'deer') {
    blob(c, [[-s.bl / 2, by + 4], [-s.bl / 2 + 8, by + s.bh / 2], [fx, by + s.bh / 2 + 2], [s.bl / 2, by + 4], [fx, by - s.bh / 2], [bx, by - s.bh / 2 + 2]]);
  } else {
    ell(c, 0, by, s.bl / 2, s.bh / 2);
    ell(c, fx, by + 2, s.bh * 0.55, s.bh * 0.56);
    ell(c, bx, by + 1, s.bh * 0.5, s.bh * 0.52);
    // a bear's great shoulder hump
    if (o.kind === 'bear') ell(c, fx - 10, by + s.bh * 0.32, s.bh * 0.42, s.bh * 0.36);
  }
  // neck and head
  const ha = (o.head ?? 0) * R;
  const nb: P = [fx + 6, by + s.bh * 0.25];
  const hp: P = [nb[0] + s.neck[0] * Math.cos(ha) - s.neck[1] * Math.sin(ha) * 0.4, nb[1] + s.neck[1] * Math.cos(ha) + s.neck[0] * Math.sin(ha)];
  bone(c, nb, hp, o.kind === 'deer' ? 9 : s.hr * 1.4, s.hr * 1.1);
  if (o.kind === 'lion') {
    // the mane: a ragged crown around the head
    const n = 16;
    c.beginPath();
    for (let i = 0; i <= n; i++) { const a = (i / n) * TAU, r = i % 2 ? s.hr * 1.5 : s.hr * 2.05 + Math.sin(t * 2 + i) * 0.8; c.lineTo(hp[0] - 3 + Math.cos(a) * r, hp[1] + Math.sin(a) * r); }
    c.closePath(); c.fill();
  }
  if (o.kind === 'horse') blob(c, [[nb[0] - 4, nb[1] + 6], [hp[0] - 6, hp[1] + 8], [hp[0] - 3, hp[1] + 3], [nb[0] + 2, nb[1] + 2]]);
  ell(c, hp[0], hp[1], s.hr, s.hr * 0.9);
  const m = o.mouth ?? 0;
  c.save(); c.translate(hp[0], hp[1]); c.rotate(-0.25 + ha * 0.5);
  blob(c, [[0, s.hr * 0.5], [s.snout + s.hr * 0.6, s.hr * 0.1], [s.snout + s.hr * 0.75, -s.hr * 0.35], [s.hr * 0.4, -s.hr * 0.75]]);
  if (m > 0.05) { c.save(); c.fillStyle = o.cut ?? '#fff'; c.beginPath(); c.moveTo(s.hr * 0.5, -s.hr * 0.35); c.lineTo(s.snout + s.hr * 0.8, -s.hr * 0.3); c.lineTo(s.snout + s.hr * 0.6, -s.hr * (0.3 + m * 0.6)); c.closePath(); c.fill(); c.restore(); }
  c.restore();
  if (o.kind === 'deer') {
    c.lineWidth = 2; c.beginPath();
    c.moveTo(hp[0] - 2, hp[1] + 5); c.quadraticCurveTo(hp[0] - 8, hp[1] + 18, hp[0] - 2, hp[1] + 30);
    c.moveTo(hp[0] - 6, hp[1] + 14); c.lineTo(hp[0] - 14, hp[1] + 20);
    c.moveTo(hp[0] - 4, hp[1] + 22); c.lineTo(hp[0] + 6, hp[1] + 28);
    c.stroke();
    ell(c, hp[0] - 6, hp[1] + 4, 3, 6, -0.8);
  } else if (o.kind === 'bear') {
    // round ears on a broad head
    ell(c, hp[0] - s.hr * 0.55, hp[1] + s.hr * 0.85, s.hr * 0.36, s.hr * 0.36);
    ell(c, hp[0] + s.hr * 0.05, hp[1] + s.hr * 0.95, s.hr * 0.32, s.hr * 0.32);
  } else if (o.kind !== 'lion') {
    ell(c, hp[0] - 4, hp[1] + s.hr * 0.85, s.hr * 0.32, s.hr * 0.45, -0.3);
  }
  if (o.kind === 'boar') { c.fillStyle = o.cut ?? '#fff'; c.beginPath(); c.moveTo(hp[0] + s.snout * 0.6, hp[1] - 2); c.quadraticCurveTo(hp[0] + s.snout, hp[1] + 4, hp[0] + s.snout * 0.5, hp[1] + 6); c.lineTo(hp[0] + s.snout * 0.5, hp[1]); c.fill(); }
  legs([[fx + 4, ph], [bx + 4, ph + Math.PI * 1.5]], lw);
  if (o.cut) { c.fillStyle = o.cut; ell(c, hp[0] + s.hr * 0.3, hp[1] + s.hr * 0.25, 1.4, 1.1); }
  c.restore();
  return { head: toW(hp), mouth: toW([hp[0] + s.snout + s.hr * 0.6, hp[1] - s.hr * 0.3]), back: toW([0, by + s.bh / 2]), tail: toW([-s.bl / 2 - 6, by]) };
}

/* ---------------------------------------------------------------- birds, fish and small things */
/** A bird in flight (or perched, with wings folded when beat is null). */
export function bird(c: C, x: number, y: number, size: number, beat: number | null, face: 1 | -1 = 1, kind: 'bird' | 'ibis' | 'owl' | 'eagle' = 'bird') {
  c.save(); c.translate(x, y); c.scale(face * size / 100, size / 100);
  c.lineCap = 'round'; c.lineJoin = 'round';
  if (beat === null) {
    if (kind === 'ibis') {
      // standing on long legs, the curved bill of Theuth
      c.lineWidth = 2.6; c.beginPath(); c.moveTo(-4, 0); c.lineTo(-2, -40); c.moveTo(6, 0); c.lineTo(2, -40); c.stroke();
      blob(c, [[-30, -62], [-10, -40], [14, -44], [22, -58], [0, -74], [-24, -72]]);
      c.lineWidth = 6; c.beginPath(); c.moveTo(14, -58); c.quadraticCurveTo(26, -80, 24, -92); c.stroke();
      ell(c, 26, -95, 6, 5);
      c.lineWidth = 2.6; c.beginPath(); c.moveTo(30, -95); c.quadraticCurveTo(48, -92, 54, -72); c.stroke();
    } else if (kind === 'owl') {
      blob(c, [[-16, -2], [-20, -40], [-14, -70], [0, -78], [14, -70], [20, -40], [16, -2]]);
      c.beginPath(); c.moveTo(-14, -70); c.lineTo(-16, -84); c.lineTo(-6, -74); c.moveTo(14, -70); c.lineTo(16, -84); c.lineTo(6, -74); c.fill();
    } else {
      blob(c, [[-30, -24], [-6, -10], [18, -14], [26, -28], [14, -36], [-14, -34]]);
      ell(c, 22, -34, 8, 7);
      c.beginPath(); c.moveTo(28, -36); c.lineTo(38, -33); c.lineTo(28, -30); c.fill();
      c.lineWidth = 2; c.beginPath(); c.moveTo(0, -12); c.lineTo(0, 0); c.moveTo(6, -12); c.lineTo(8, 0); c.stroke();
    }
  } else {
    const w = Math.sin(beat * TAU);
    const span = kind === 'eagle' ? 90 : 60;
    blob(c, [[-span * 0.45, 2], [-10, 6], [20, 4], [30, -2], [16, -8], [-12, -6]]);
    if (kind === 'ibis') { c.lineWidth = 3; c.beginPath(); c.moveTo(28, -2); c.quadraticCurveTo(46, -2, 54, 10); c.stroke(); c.beginPath(); c.moveTo(-14, 2); c.lineTo(-48, 6); c.stroke(); }
    else { ell(c, 30, -4, 8, 7); c.beginPath(); c.moveTo(36, -6); c.lineTo(46, -2); c.lineTo(36, 0); c.fill(); }
    // wings: up, level, down
    for (const side of [1, 0.7]) {
      c.beginPath(); c.moveTo(-8, -2); c.quadraticCurveTo(0, -2 - w * span * 0.55 * side, 10 - side * 18, -2 - w * span * 0.95 * side); c.quadraticCurveTo(10, -2 - w * span * 0.3 * side, 14, -2); c.closePath(); c.fill();
    }
  }
  c.restore();
}

/** A fish, swimming (its body bends with `phase`). */
export function fish(c: C, x: number, y: number, size: number, phase: number, face: 1 | -1 = 1, color?: string, cut?: string) {
  c.save(); c.translate(x, y); c.scale(face * size / 100, size / 100);
  if (color) c.fillStyle = color;
  const bend = Math.sin(phase * TAU) * 0.35;
  c.beginPath();
  c.moveTo(48, 0);
  c.quadraticCurveTo(30, -22, -6, -16);
  c.quadraticCurveTo(-30, -10 + bend * 20, -40, bend * 30);
  c.lineTo(-62, -18 + bend * 50); c.lineTo(-56, bend * 40); c.lineTo(-62, 18 + bend * 50); c.lineTo(-40, bend * 30);
  c.quadraticCurveTo(-30, 10 + bend * 20, -6, 16);
  c.quadraticCurveTo(30, 22, 48, 0);
  c.fill();
  c.beginPath(); c.moveTo(4, -15); c.quadraticCurveTo(-4, -30, -16, -26); c.lineTo(-12, -13); c.fill();
  if (cut) { c.fillStyle = cut; c.beginPath(); c.arc(32, -4, 3.4, 0, TAU); c.fill(); c.strokeStyle = cut; c.lineWidth = 1.6; c.beginPath(); c.arc(16, 0, 14, -1, 1); c.stroke(); }
  c.restore();
}

/** A tortoise, its head out or in. */
export function tortoise(c: C, x: number, y: number, size: number, out = 1, phase = 0, cut?: string) {
  c.save(); c.translate(x, y); c.scale(size / 100, size / 100);
  const w = Math.sin(phase * TAU) * 6;
  for (const lx of [-24, 22]) { c.beginPath(); c.roundRect(lx + w * (lx > 0 ? 1 : -1) - 6, -14, 12, 14, 4); c.fill(); }
  ell(c, 34 + out * 14, -22, 10, 7.5);
  c.beginPath(); c.moveTo(18, -16); c.lineTo(34 + out * 10, -24); c.lineTo(34 + out * 10, -16); c.fill();
  c.beginPath(); c.ellipse(0, -14, 40, 32, 0, Math.PI, 0); c.fill();
  if (cut) {
    c.strokeStyle = cut; c.lineWidth = 1.6;
    for (const [cx, cy] of [[-16, -28], [0, -34], [16, -28], [-8, -18], [8, -18]]) { c.beginPath(); for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; c.lineTo(cx + Math.cos(a) * 7, cy + Math.sin(a) * 6); } c.closePath(); c.stroke(); }
  }
  c.restore();
}

/** A bee, buzzing. */
export function bee(c: C, x: number, y: number, size: number, time: number, wing = '#fff') {
  c.save(); c.translate(x, y); c.scale(size / 100, size / 100);
  ell(c, 0, 0, 34, 22);
  ell(c, 34, -4, 13, 13);
  c.save(); c.fillStyle = wing; c.globalAlpha = 0.85;
  const fl = 0.5 + 0.5 * Math.sin(time * 60);
  ell(c, -4, -28 - fl * 6, 16, 22 - fl * 8, -0.5); ell(c, 10, -26 - fl * 4, 12, 18 - fl * 6, 0.4);
  c.restore();
  c.beginPath(); c.moveTo(-34, 0); c.lineTo(-50, 4); c.lineTo(-34, 8); c.fill();
  c.restore();
}

/** A snake, gliding. */
export function snake(c: C, x: number, y: number, len: number, time: number, face: 1 | -1 = 1, rear = 0) {
  c.save(); c.translate(x, y); c.scale(face, 1);
  const n = 26;
  const pts: P[] = [];
  for (let i = 0; i <= n; i++) {
    const v = i / n;
    pts.push([-v * len, Math.sin(time * 4 - v * 9) * len * 0.06 * v * (1 - v * 0.3) - (1 - v) ** 6 * rear * len * 0.4]);
  }
  for (let i = 0; i < n; i++) bone(c, pts[i], pts[i + 1], len * 0.075 * (1 - i / n * 0.8), len * 0.075 * (1 - (i + 1) / n * 0.8));
  ell(c, pts[0][0] + len * 0.02, pts[0][1], len * 0.07, len * 0.045);
  c.restore();
}
