import type { Preset } from '@/scripts/field/field';
import { clamp, lerp } from '@/lib/page';
import { figure, type Pose } from './shapes';

/**
 * The scene kit: the small vocabulary every story is written in. A story is a
 * list of scene functions; each is called every frame with a `Scene` and
 * describes how the stage should look at that moment.
 */
export type RGB = [number, number, number];
export type Rect = [number, number, number, number]; // css px: x, y, w, h
export type Draw = (c: CanvasRenderingContext2D, w: number, h: number) => void;

export const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a), 0, 1);
export const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);
export const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
export const pulse = (t: number, a: number, b: number, fade = 0.6) => seg(t, a, a + fade) * (1 - seg(t, b - fade, b));
export const mix3 = (a: number[], b: number[], k: number): RGB => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
export const wobble = (t: number) => 0.5 * Math.sin(t * 7.1) + 0.3 * Math.sin(t * 12.7 + 1.3) + 0.2 * Math.sin(t * 21.3 + 2.1);
export const norm = (c: number[]): RGB => [c[0] / 255, c[1] / 255, c[2] / 255];

/** How the stage looks this frame. The player eases the field towards it. */
export interface Look {
  form: number; formTint: number; maskOn: number; stageDim: number; veil: number;
  wall: [number, number, number, number]; wallLight: number; wallColor: RGB; flick: number;
  light: [number, number, number, number]; lightColor: RGB; embers: number;
}
export const blankLook = (): Look => ({
  form: 0, formTint: 0, maskOn: 0, stageDim: 0, veil: 0, wall: [0.5, 0.48, 0.66, 0.62], wallLight: 0,
  wallColor: [1, 1, 1], flick: 1, light: [0, 0, 1, 0], lightColor: [1, 1, 1], embers: 0,
});

export interface Palette {
  ink: RGB; accent: RGB; paper: RGB; dark: number;
  /** firelight, daylight and a cool screen light, tuned per theme */
  fire: RGB; day: RGB; cool: RGB;
}

export interface Scene {
  t: number; d: number; p: number; clock: number; dt: number;
  /** true for reduced-motion stills and jumps: no easing and no impulses */
  immediate: boolean;
  stage: Rect; aspect: number; pal: Palette; look: Look; mobile: boolean;
  /** per group: offset x, offset y (stage units), strength, tint; reset to (0, 0, 1, 0) each frame */
  groups: Float32Array;
  /** stage units → css px */
  px(u: number, v: number): [number, number];
  /** draw this frame's shadows (white = shadow) */
  mask(draw: Draw): void;
  /** give a share of the particles places in a figure; one draw per group; sampled once per key */
  form(key: string, share: number, draws: Draw[]): void;
  /** a glowing point (css px) */
  glow(x: number, y: number, size: number, k: number): void;
  /** a thin glowing line through css-px points */
  line(points: number[]): void;
  /** a one-off radial push, once per scene and key */
  burst(key: string, x: number, y: number, k: number): void;
  /** a small text label pinned to the stage */
  label(i: number, x: number, y: number, text: string, k: number): void;
}
export type SceneFn = (s: Scene) => void;

export interface StoryVisuals {
  id: string;
  /** stage width / height */
  aspect: number;
  loop: boolean;
  scenes: SceneFn[];
  /** where to hold each scene for reduced-motion stills (seconds) */
  stills: number[];
  /** optional field character per scene */
  presets?: Array<Partial<Preset> | undefined>;
}

/** Where a figure drawn at (u, base) with height `hFrac` (all stage units) has its hands and head, in css px. */
let scratch: CanvasRenderingContext2D | null = null;
export function figureAt(s: Scene, u: number, base: number, hFrac: number, pose: Pose) {
  scratch ??= document.createElement('canvas').getContext('2d');
  const [x, y, w, h] = s.stage;
  return figure(scratch!, x + u * w, y + base * h, hFrac * h, pose);
}

/** Helpers for drawing in stage units inside a draw callback.
export const at = (w: number, h: number) => ({ x: (u: number) => u * w, y: (v: number) => v * h });

/** A quadratic arc between two css-px points, raised by `lift` px, as a flat point list. */
export function arcPoints(a: number[], b: number[], lift: number, upTo = 1, n = 24) {
  const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2 - lift, out: number[] = [];
  const steps = Math.max(2, Math.round(n * upTo) + 1);
  for (let i = 0; i < steps; i++) {
    const v = (i / (steps - 1)) * upTo;
    out.push((1 - v) * (1 - v) * a[0] + 2 * (1 - v) * v * mx + v * v * b[0], (1 - v) * (1 - v) * a[1] + 2 * (1 - v) * v * my + v * v * b[1]);
  }
  return out;
}
export function arcAt(a: number[], b: number[], lift: number, v: number): [number, number] {
  const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2 - lift;
  return [(1 - v) * (1 - v) * a[0] + 2 * (1 - v) * v * mx + v * v * b[0], (1 - v) * (1 - v) * a[1] + 2 * (1 - v) * v * my + v * v * b[1]];
}
