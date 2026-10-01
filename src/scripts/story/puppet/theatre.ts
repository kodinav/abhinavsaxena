import { clamp } from '@/lib/page';
import { readThemeColors } from '@/lib/theme-colors';

/**
 * The puppet theatre: a lit screen, dark cut-out figures in front of it, and
 * a camera. A story is a list of scene functions; each is called every frame
 * with a `Stage` and paints the whole picture for that moment, so any frame
 * can be drawn on its own (reduced-motion stills, jumps, replays).
 *
 * World units: the stage is `W` wide and 1 tall, origin top-left. The camera
 * looks at a point and zooms; zoom 1 shows the whole stage.
 */
export type RGB = [number, number, number];
export type Mood = 'cave' | 'fire' | 'day' | 'dawn' | 'dusk' | 'night' | 'machine' | 'sea' | 'paper' | 'gold';

/** the lit screen: centre and edge colour, for a light page and a dark one */
const MOODS: Record<Mood, { light: [RGB, RGB]; dark: [RGB, RGB] }> = {
  cave:    { light: [[240, 196, 138], [176, 128, 86]],  dark: [[222, 164, 98], [44, 28, 18]] },
  fire:    { light: [[248, 214, 164], [226, 166, 108]], dark: [[232, 180, 120], [62, 36, 20]] },
  day:     { light: [[249, 240, 218], [233, 219, 190]], dark: [[234, 222, 194], [62, 56, 44]] },
  dawn:    { light: [[248, 222, 198], [228, 184, 158]], dark: [[232, 196, 164], [60, 40, 34]] },
  dusk:    { light: [[240, 204, 172], [204, 156, 134]], dark: [[218, 172, 140], [52, 34, 34]] },
  night:   { light: [[216, 222, 232], [168, 178, 198]], dark: [[166, 180, 204], [22, 26, 38]] },
  machine: { light: [[222, 234, 243], [172, 192, 208]], dark: [[178, 204, 226], [22, 32, 44]] },
  sea:     { light: [[226, 236, 238], [180, 202, 208]], dark: [[186, 210, 216], [24, 40, 46]] },
  paper:   { light: [[245, 234, 214], [222, 206, 182]], dark: [[226, 212, 186], [56, 48, 38]] },
  gold:    { light: [[250, 228, 178], [232, 190, 120]], dark: [[240, 206, 140], [64, 46, 22]] },
};

export const mixRGB = (a: RGB, b: RGB, k: number): RGB => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
export const css = (c: RGB, a = 1) => `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${a})`;

export const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a), 0, 1);
export const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
export const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);
export const easeIn = (x: number) => x * x * x;
/** 0 → 1 → 0: in over `fade` seconds from a, out over `fade` seconds before b */
export const pulse = (t: number, a: number, b: number, fade = 0.5) => seg(t, a, a + fade) * (1 - seg(t, b - fade, b));
/** an overshooting pop, 0 → ~1.1 → 1 */
export const pop = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : 1 + 2.7 * Math.pow(x - 1, 3) + 1.7 * Math.pow(x - 1, 2));
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
/** a stable pseudo-random number in [0, 1) for an integer (and an optional salt) */
export const hash = (n: number, salt = 0) => { const x = Math.sin(n * 127.1 + salt * 311.7) * 43758.5453; return x - Math.floor(x); };
/** smooth 1-D noise in [-1, 1] */
export function noise(x: number) {
  const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
  return lerp(hash(i) * 2 - 1, hash(i + 1) * 2 - 1, u);
}

export interface Stage {
  c: CanvasRenderingContext2D;
  /** seconds into the scene, its length, and t / d */
  t: number; d: number; p: number;
  /** seconds since the story began playing; for flicker and drift that should not restart with a scene */
  clock: number;
  dt: number;
  /** stage width in world units (the stage is 1 tall) */
  W: number;
  /** css px per world unit at zoom 1 */
  unit: number;
  /** a reduced-motion still: no drift, no flicker */
  still: boolean;
  /** a small stage (a card or a phone): keep detail bold */
  small: boolean;
  dark: boolean;
  /** silhouette ink, and ink faded back towards the screen for things further away (0 = near, 1 = gone) */
  ink: string;
  tone(depth: number): string;
  /** the screen's colour now (after `backdrop`) */
  screen: RGB;
  accent: RGB;
  /** look at (x, y) with `zoom`; call before drawing (and before `backdrop`) */
  cam(x: number, y: number, zoom?: number): void;
  /** the part of the world the camera sees: x0, y0, x1, y1 */
  view(): [number, number, number, number];
  /** paint the lit screen over everything the camera sees: its mood (or a blend of two), and where the light comes from (world units) */
  backdrop(o: { mood: Mood; to?: Mood; k?: number; x?: number; y?: number; r?: number; bright?: number }): void;
  /** let a light on the stage spill into the field around it (world units, strength 0..1) */
  spill(x: number, y: number, k: number, color?: RGB): void;
  font(size: number, kind?: 'serif' | 'sans' | 'mono', style?: string): string;
}
export type SceneFn = (s: Stage) => void;

export interface StoryVisuals {
  id: string;
  /** stage width / height */
  aspect: number;
  loop: boolean;
  scenes: SceneFn[];
  /** where to hold each scene for reduced-motion stills (seconds) */
  stills: number[];
}

let fonts: { serif: string; sans: string; mono: string } | null = null;
const readFonts = () => {
  const cs = getComputedStyle(document.documentElement);
  const v = (n: string, f: string) => cs.getPropertyValue(n).trim() || f;
  return { serif: v('--font-serif', 'Georgia, serif'), sans: v('--font-sans', 'system-ui, sans-serif'), mono: v('--font-mono', 'ui-monospace, monospace') };
};

let theme: { dark: boolean; accent: RGB } | null = null;
export function readTheme() {
  const t = readThemeColors();
  const [r, g, b] = t.paper;
  theme = { dark: (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 < 0.5, accent: t.accent };
  return theme;
}
if (typeof document !== 'undefined') document.addEventListener('themechange', () => { readTheme(); });

export interface Spill { x: number; y: number; k: number; color: RGB }

/**
 * Draws scenes into a canvas sized to the stage. Owns the camera, the
 * crossfade from one scene to the next and the soft edge that lets the
 * screen melt into the page.
 */
export class Theatre {
  private snap = document.createElement('canvas');
  private sctx = this.snap.getContext('2d')!;
  private since = 99;
  private hasSnap = false;
  spill: Spill | null = null;

  constructor(public canvas: HTMLCanvasElement) {}

  /** Remember the frame on screen; the next scene fades in over it. */
  cut(immediate = false) {
    const cv = this.canvas;
    if (immediate || !cv.width || !cv.height) { this.hasSnap = false; this.since = 99; return; }
    if (this.snap.width !== cv.width || this.snap.height !== cv.height) { this.snap.width = cv.width; this.snap.height = cv.height; }
    this.sctx.clearRect(0, 0, cv.width, cv.height);
    this.sctx.drawImage(cv, 0, 0);
    this.hasSnap = true;
    this.since = 0;
  }

  clear() {
    const c = this.canvas.getContext('2d');
    c?.setTransform(1, 0, 0, 1, 0, 0);
    c?.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.hasSnap = false;
  }

  render(scene: SceneFn, o: { w: number; h: number; aspect: number; t: number; d: number; clock: number; dt: number; still: boolean; feather: number }) {
    const cv = this.canvas;
    // sharp on high-density screens, but never more than about two million pixels a frame
    const dpr = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(MAX_PIXELS / Math.max(1, o.w * o.h)));
    const bw = Math.max(2, Math.round(o.w * dpr)), bh = Math.max(2, Math.round(o.h * dpr));
    if (cv.width !== bw || cv.height !== bh) { cv.width = bw; cv.height = bh; this.hasSnap = false; }
    const c = cv.getContext('2d')!;
    fonts ??= readFonts();
    const th = theme ?? readTheme();
    const unit = o.h; // css px per world unit
    const W = o.aspect;
    const base = unit * dpr;
    let screen: RGB = MOODS.paper[th.dark ? 'dark' : 'light'][0];
    const inkRGB: RGB = th.dark ? [14, 13, 16] : [27, 26, 31];
    const ink = css(inkRGB);
    this.spill = null;
    const self = this;
    let cx = W / 2, cy = 0.5, cz = 1;

    c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalAlpha = 1;
    c.globalCompositeOperation = 'source-over';
    c.clearRect(0, 0, bw, bh);
    c.setTransform(base, 0, 0, base, 0, 0);
    c.lineCap = 'round'; c.lineJoin = 'round';

    const stage: Stage = {
      c, t: o.t, d: o.d, p: clamp(o.t / o.d, 0, 1), clock: o.clock, dt: o.dt, W, unit, still: o.still,
      small: o.w < 420, dark: th.dark, ink, accent: th.accent,
      get screen() { return screen; },
      tone: (k) => css(mixRGB(inkRGB, screen, clamp(k, 0, 1))),
      cam: (x, y, z = 1) => { cx = x; cy = y; cz = z; c.setTransform(base * z, 0, 0, base * z, base * (W / 2 - x * z), base * (0.5 - y * z)); },
      view: () => [cx - W / 2 / cz, cy - 0.5 / cz, cx + W / 2 / cz, cy + 0.5 / cz],
      backdrop: (b) => {
        const pick = (m: Mood) => MOODS[m][th.dark ? 'dark' : 'light'];
        let [mid, edge] = pick(b.mood);
        if (b.to) { const [m2, e2] = pick(b.to); const k = clamp(b.k ?? 0, 0, 1); mid = mixRGB(mid, m2, k); edge = mixRGB(edge, e2, k); }
        const br = b.bright ?? 1;
        if (br !== 1) { mid = mixRGB(edge, mid, br); }
        screen = mid;
        const x = b.x ?? W / 2, y = b.y ?? 0.45, r = b.r ?? Math.max(W, 1) * 0.85;
        // the light lives in the world, so it moves with the camera; it covers whatever the camera sees
        const [x0, y0, x1, y1] = stage.view();
        const g = c.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, css(mixRGB(mid, [255, 255, 255], th.dark ? 0.05 : 0.25)));
        g.addColorStop(0.45, css(mid));
        g.addColorStop(1, css(edge));
        c.fillStyle = g;
        c.fillRect(x0 - 0.01, y0 - 0.01, x1 - x0 + 0.02, y1 - y0 + 0.02);
      },
      // stored where it shows on the stage, after the camera
      spill: (x, y, k, color) => { self.spill = { x: (x - cx) * cz + W / 2, y: (y - cy) * cz + 0.5, k, color: color ?? screen }; },
      font: (size, kind = 'serif', style = '') => `${style} ${size}px ${fonts![kind]}`.trim(),
    };
    c.save();
    scene(stage);
    c.restore();

    // the previous scene dissolves into this one
    if (this.hasSnap && this.since < FADE) {
      this.since += o.dt;
      const k = 1 - easeOut(clamp(this.since / FADE, 0, 1));
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.globalAlpha = k;
      c.drawImage(this.snap, 0, 0);
      c.globalAlpha = 1;
    }
    if (o.feather > 0) feather(c, bw, bh, o.feather * dpr);
  }
}
const FADE = 0.9;
const MAX_PIXELS = 2_000_000;

/** Fade the edges of the picture to nothing, so the screen melts into the page. */
function feather(c: CanvasRenderingContext2D, w: number, h: number, f: number) {
  c.save();
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.globalCompositeOperation = 'destination-in';
  const ramp = (g: CanvasGradient, len: number) => {
    const e = Math.min(0.45, f / len);
    const stops = [0, 0.08, 0.25, 0.5, 0.75, 1];
    const a = [0, 0.04, 0.2, 0.55, 0.88, 1];
    stops.forEach((s, i) => { g.addColorStop(s * e, `rgba(0,0,0,${a[i]})`); g.addColorStop(1 - s * e, `rgba(0,0,0,${a[i]})`); });
  };
  const gx = c.createLinearGradient(0, 0, w, 0); ramp(gx, w);
  c.fillStyle = gx; c.fillRect(0, 0, w, h);
  const gy = c.createLinearGradient(0, 0, 0, h); ramp(gy, h);
  c.fillStyle = gy; c.fillRect(0, 0, w, h);
  c.restore();
}
