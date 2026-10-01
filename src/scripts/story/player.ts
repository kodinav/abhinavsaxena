import { field, type Preset } from '@/scripts/field/field';
import { prefersReducedMotion, lerp } from '@/lib/page';
import type { StoryText } from '@/data/stories';
import type { CaptionUI } from './ui';
import { blankLook, mix3, norm, type Draw, type Palette, type Rect, type Scene, type StoryVisuals } from './kit';

/**
 * Plays one story in the field. The player owns the clock, the shadow mask,
 * the particle formations and the easing; the host decides where the stage
 * is, when the story starts and stops, and where the caption sits.
 *
 * Only one story owns the field at a time; starting one releases another.
 */
export interface Host {
  /** where the stage is now, in css px; null while it is not on screen */
  stage(): Rect | null;
  ui: CaptionUI;
  mobile(): boolean;
  /** the field's character under this story's scenes */
  basePreset(): Partial<Preset>;
  /** what the field returns to when the story lets go */
  restPreset?(): string | null;
  /** runs after the field has drawn each frame (card stages copy themselves here) */
  afterDraw?(stage: Rect): void;
  /** a story that does not loop has finished its last scene */
  onEnd?(): void;
}

let current: StoryPlayer | null = null;
let wired = false;
function wire() {
  if (wired) return;
  wired = true;
  field.onFrame((dt) => current?.tick(dt));
  field.onDraw(() => current?.drawn());
}

const SAMPLE_W = 500;

export class StoryPlayer {
  index = 0;
  t = 0;
  clock = 0;
  playing = true;
  readonly reduced = prefersReducedMotion();
  private fading = false;
  private groups = new Float32Array(32);
  private mask = document.createElement('canvas');
  private mctx: CanvasRenderingContext2D;
  private sampler = document.createElement('canvas');
  private sctx: CanvasRenderingContext2D;
  private maskDue = 0;
  private formationFor = '#';
  private formationN = 0;
  private bursts = new Set<string>();
  private lastStage: Rect | null = null;

  constructor(public visuals: StoryVisuals, public text: StoryText, private host: Host) {
    this.mctx = this.mask.getContext('2d')!;
    this.sampler.width = SAMPLE_W;
    this.sampler.height = Math.round(SAMPLE_W / visuals.aspect);
    this.sctx = this.sampler.getContext('2d', { willReadFrequently: true })!;
    wire();
  }

  get isCurrent() { return current === this; }
  get isFading() { return this.fading; }

  /** Take the field and begin (or resume) at scene `i`. */
  start(i = this.index, t = 0) {
    if (current && current !== this) current.release();
    current = this;
    this.fading = false;
    this.formationFor = '#';
    this.host.ui.setStory(this.text);
    if (this.reduced) this.host.ui.setReduced();
    this.host.ui.setPlaying(this.playing && !this.reduced);
    this.enter(i, t);
  }

  /** Let go of the field, easing the scene out first unless `fade` is false. */
  stop(fade = true) {
    if (current !== this) return;
    if (!fade || this.reduced) this.release();
    else this.fading = true;
  }

  private release() {
    if (current === this) current = null;
    this.fading = false;
    field.resetStory();
    this.formationFor = '#';
    this.host.ui.hideLabels();
    const rest = this.host.restPreset?.();
    if (rest) field.setPreset(rest);
  }

  go(i: number, t = 0) { this.enter(i, t); }
  pause() { this.playing = false; this.host.ui.setPlaying(false); }
  play() {
    if (this.reduced) return;
    // a finished story starts again from the top
    if (!this.visuals.loop && this.index === this.text.scenes.length - 1 && this.t >= this.text.scenes[this.index].duration) this.enter(0);
    this.playing = true;
    this.host.ui.setPlaying(true);
  }
  toggle() { if (this.playing) this.pause(); else this.play(); }

  private enter(i: number, t = 0) {
    const n = this.text.scenes.length;
    this.index = ((i % n) + n) % n;
    this.t = t;
    this.bursts.clear();
    this.host.ui.show(this.index);
    field.setPreset({ ...this.host.basePreset(), ...(this.visuals.presets?.[this.index] ?? {}) });
    if (this.reduced) this.paintStill();
  }

  /** Reduced motion: settle the scene at a chosen moment and paint it once. */
  private paintStill() {
    this.t = this.visuals.stills[this.index] ?? this.text.scenes[this.index].duration * 0.6;
    const paint = () => {
      if (current !== this) return;
      if (!field.ok) { requestAnimationFrame(paint); return; }
      this.frame(1 / 60, true);
      field.still(150);
    };
    paint();
  }

  /** Called by the field once per frame while this story owns it. */
  tick(dt: number) {
    if (this.reduced) return;
    this.clock += dt;
    if (this.playing && !this.fading) {
      this.t += dt;
      const dur = this.text.scenes[this.index].duration;
      if (this.t >= dur) {
        if (this.index === this.text.scenes.length - 1 && !this.visuals.loop) {
          this.t = dur;
          this.playing = false;
          this.host.ui.setPlaying(false);
          this.host.onEnd?.();
        } else this.enter(this.index + 1);
      }
    }
    this.frame(dt, false);
  }

  drawn() { if (this.lastStage) this.host.afterDraw?.(this.lastStage); }

  private palette(): Palette {
    const p = field.palette;
    const ink = norm(p.ink), accent = norm(p.accent), paper = norm(p.paper), dark = p.dark;
    return {
      ink, accent, paper, dark,
      fire: dark ? mix3(accent, [1, 0.82, 0.62], 0.35) : mix3(accent, [0.95, 0.62, 0.3], 0.45),
      day: dark ? [1, 0.94, 0.82] : mix3(accent, [1, 0.9, 0.7], 0.5),
      cool: dark ? [0.74, 0.82, 0.96] : [0.38, 0.48, 0.64],
    };
  }

  private frame(dt: number, immediate: boolean) {
    const stage = this.host.stage();
    this.lastStage = stage;
    const ui = this.host.ui;
    if (!stage) { ui.hideLabels(); return; }
    const s = field.story;
    const look = blankLook();
    const g = this.groups;
    for (let k = 0; k < 8; k++) { g[k * 4] = 0; g[k * 4 + 1] = 0; g[k * 4 + 2] = 1; g[k * 4 + 3] = 0; }
    let maskDraw: Draw | null = null;
    let formed = false;
    const glows: number[] = [];
    const lines: Float32Array[] = [];
    const sc = this.text.scenes[this.index];
    ui.beginLabels(stage[2] < 440);
    const scene: Scene = {
      t: this.t, d: sc.duration, p: this.t / sc.duration, clock: this.clock, dt, immediate,
      stage, aspect: this.visuals.aspect, pal: this.palette(), look, mobile: this.host.mobile(), groups: g,
      px: (u, v) => [stage[0] + u * stage[2], stage[1] + v * stage[3]],
      mask: (d) => { maskDraw = d; },
      form: (key, share, draws) => { formed = true; this.formation(key, share, draws); },
      glow: (x, y, size, k) => { if (k > 0.004) glows.push(x, y, size, k); },
      line: (pts) => { if (pts.length >= 4) lines.push(Float32Array.from(pts)); },
      burst: (key, x, y, k) => { if (this.bursts.has(key)) return; this.bursts.add(key); field.story.burst = [x, y, immediate ? 0 : k]; },
      // labels stay inside the stage, so they never sit on a caption below it
      label: (i, x, y, text, k) => ui.label(i, Math.min(Math.max(x, stage[0] + 30), stage[0] + stage[2] - 30), Math.min(y, stage[1] + stage[3] - 16), text, k),
    };
    if (!this.fading) this.visuals.scenes[this.index]?.(scene);
    ui.endLabels();
    if (!formed) this.formation('', 0, []);

    // shadows: redraw the mask (about 30 times a second) and upload it
    this.maskDue -= dt;
    const draw = maskDraw as Draw | null;
    if (draw && (this.maskDue <= 0 || immediate)) {
      this.maskDue = 1 / 30;
      const md = Math.min(window.devicePixelRatio || 1, 1.5);
      const mw = Math.max(32, Math.min(1100, Math.round(stage[2] * md)));
      const mh = Math.max(32, Math.round((mw * stage[3]) / stage[2]));
      if (this.mask.width !== mw || this.mask.height !== mh) { this.mask.width = mw; this.mask.height = mh; }
      const c = this.mctx;
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.clearRect(0, 0, mw, mh);
      c.fillStyle = '#fff'; c.strokeStyle = '#fff'; c.globalAlpha = 1;
      draw(c, mw, mh);
      field.setMask(this.mask);
    }

    // hand the look to the field, eased so scenes dissolve into one another
    const k = immediate ? 1 : 1 - Math.exp(-dt * 3.2);
    s.stage = [stage[0], stage[1], stage[2], stage[3]];
    s.form = lerp(s.form, look.form, immediate ? 1 : 1 - Math.exp(-dt * 2.6));
    s.formTint = lerp(s.formTint, look.formTint, k);
    s.maskOn = lerp(s.maskOn, look.maskOn, k);
    s.stageDim = lerp(s.stageDim, look.stageDim, k);
    s.veil = lerp(s.veil, look.veil, k);
    s.wallLight = lerp(s.wallLight, look.wallLight, k);
    s.flick = look.flick;
    for (let i = 0; i < 4; i++) s.wall[i] = lerp(s.wall[i], look.wall[i], k);
    s.wallColor = mix3(s.wallColor, look.wallColor, k);
    // a light that is going out keeps its place while it fades
    if (look.light[3] > 0) { s.light[0] = look.light[0]; s.light[1] = look.light[1]; s.light[2] = look.light[2]; }
    s.light[3] = lerp(s.light[3], look.light[3], k);
    s.lightColor = mix3(s.lightColor, look.lightColor, k);
    s.embers = lerp(s.embers, look.embers, k);
    for (let i = 0; i < 32; i++) s.groups[i] = immediate ? g[i] : lerp(s.groups[i], g[i], 1 - Math.exp(-dt * 6));
    s.burst[2] *= Math.exp(-dt * 3.5);
    field.setMarks(glows.length ? Float32Array.from(glows) : null, lines);
    ui.progress(this.t / sc.duration);

    if (this.fading && s.form < 0.02 && s.wallLight < 0.02 && s.light[3] < 0.02 && s.embers < 0.02) this.release();
  }

  /* ------------------------------------------------------------ formations */
  private formation(key: string, share: number, draws: Draw[]) {
    const n = field.particleCount;
    if (key === this.formationFor && n === this.formationN) return;
    this.formationFor = key;
    this.formationN = n;
    if (!key || !n) { field.setFormation(null); return; }
    const c = this.sctx, W = this.sampler.width, H = this.sampler.height;
    const pools: Uint32Array[] = [];
    for (const d of draws) {
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.clearRect(0, 0, W, H);
      c.fillStyle = '#fff'; c.strokeStyle = '#fff'; c.globalAlpha = 1;
      d(c, W, H);
      const px = c.getImageData(0, 0, W, H).data;
      const list: number[] = [];
      for (let i = 0; i < W * H; i++) if (px[i * 4 + 3] > 140) list.push(i);
      pools.push(Uint32Array.from(list));
    }
    const total = pools.reduce((s, p) => s + p.length, 0);
    if (!total) { field.setFormation(null); return; }
    const count = Math.min(n, Math.round(n * share));
    const out = new Float32Array(n * 4);
    let k = 0;
    pools.forEach((pool, gi) => {
      const want = gi === pools.length - 1 ? count - k : Math.round((count * pool.length) / total);
      for (let j = 0; j < want && k < count && pool.length; j++, k++) {
        const idx = pool[(Math.random() * pool.length) | 0];
        out[k * 4] = ((idx % W) + Math.random()) / W;
        out[k * 4 + 1] = (Math.floor(idx / W) + Math.random()) / H;
        out[k * 4 + 2] = gi;
        out[k * 4 + 3] = 1;
      }
    });
    field.setFormation(out);
  }
}
