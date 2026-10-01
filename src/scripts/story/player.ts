import { field, type Preset } from '@/scripts/field/field';
import { prefersReducedMotion, lerp } from '@/lib/page';
import type { StoryText } from '@/data/stories';
import type { CaptionUI } from './ui';
import { Theatre, type StoryVisuals } from './puppet/theatre';

/**
 * Plays one story. The player owns the clock and the theatre that draws the
 * scenes; the host decides where the stage is, which canvas it draws into,
 * when the story starts and stops, and where the caption sits.
 *
 * Only one story plays at a time; starting one releases another.
 */
export type Rect = [number, number, number, number]; // css px: x, y, w, h

export interface Host {
  /** where the stage is now, in viewport css px; null while it is not on screen */
  stage(): Rect | null;
  /** the canvas the story is drawn into, already placed over the stage by the host */
  canvas: HTMLCanvasElement;
  ui: CaptionUI;
  /** how softly the picture's edges melt into the page, in css px (0 inside a card) */
  feather(): number;
  /** the field's character under this story */
  basePreset(): Partial<Preset>;
  /** what the field returns to when the story lets go */
  restPreset?(): string | null;
  /** a story that does not loop has finished its last scene */
  onEnd?(): void;
}

let current: StoryPlayer | null = null;
let raf = 0;
let last = 0;
function loop(now: number) {
  raf = 0;
  if (!current) return;
  const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
  last = now;
  current.tick(dt);
  if (current) raf = requestAnimationFrame(loop);
}
function run() { if (!raf) { last = 0; raf = requestAnimationFrame(loop); } }

const FADE_OUT = 0.6;

export class StoryPlayer {
  index = 0;
  t = 0;
  clock = 0;
  playing = true;
  readonly reduced = prefersReducedMotion();
  private theatre: Theatre;
  private leaving = -1;
  private glowK = 0;

  constructor(public visuals: StoryVisuals, public text: StoryText, private host: Host) {
    this.theatre = new Theatre(host.canvas);
  }

  get isCurrent() { return current === this; }

  /** Take the stage and begin (or resume) at scene `i`. */
  start(i = this.index, t = 0) {
    if (current && current !== this) current.release();
    current = this;
    this.leaving = -1;
    this.host.ui.setStory(this.text);
    if (this.reduced) this.host.ui.setReduced();
    this.host.ui.setPlaying(this.playing && !this.reduced);
    this.theatre.cut(true);
    this.host.canvas.classList.add('is-on');
    this.enter(i, t, true);
    if (!this.reduced) run();
  }

  /** Let go of the stage, fading the picture out first unless `fade` is false. */
  stop(fade = true) {
    if (current !== this) return;
    this.host.canvas.classList.remove('is-on');
    if (!fade || this.reduced) this.release();
    else if (this.leaving < 0) this.leaving = FADE_OUT;
  }

  private release() {
    if (current === this) current = null;
    this.leaving = -1;
    this.host.canvas.classList.remove('is-on');
    this.theatre.clear();
    field.resetStory();
    this.glowK = 0;
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

  /** Draw the current moment again (after a resize or a change of theme). */
  refresh() { if (current === this) this.paint(1 / 60); }

  private enter(i: number, t = 0, first = false) {
    const n = this.text.scenes.length;
    this.index = ((i % n) + n) % n;
    this.t = this.reduced ? (this.visuals.stills[this.index] ?? this.text.scenes[this.index].duration * 0.6) : t;
    if (!first) this.theatre.cut(this.reduced);
    this.host.ui.show(this.index);
    field.setPreset(this.host.basePreset());
    if (this.reduced) this.paint(1 / 60);
  }

  /** Called once per animation frame while this story plays. */
  tick(dt: number) {
    if (this.reduced) return;
    if (this.leaving >= 0) {
      this.leaving -= dt;
      if (this.leaving <= 0) { this.release(); return; }
    } else if (this.playing) {
      this.clock += dt;
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
    this.paint(dt);
  }

  private paint(dt: number) {
    const st = this.host.stage();
    if (!st || st[2] < 2 || st[3] < 2) return;
    const sc = this.text.scenes[this.index];
    this.theatre.render(this.visuals.scenes[this.index], {
      w: st[2], h: st[3], aspect: this.visuals.aspect, t: this.t, d: sc.duration,
      clock: this.reduced ? this.t : this.clock, dt: this.reduced ? 0 : dt, still: this.reduced, feather: this.host.feather(),
    });
    this.host.ui.progress(this.t / sc.duration);

    // the field calms down behind the stage, and the stage's light spills out into it
    const s = field.story;
    const k = this.reduced ? 1 : 1 - Math.exp(-dt * 3);
    const leaving = this.leaving >= 0;
    s.stage = [st[0], st[1], st[2], st[3]];
    s.stageDim = lerp(s.stageDim, leaving ? 0 : 0.7, k);
    const sp = this.theatre.spill;
    this.glowK = lerp(this.glowK, sp && !leaving ? sp.k : 0, k);
    if (sp) {
      s.light[0] = st[0] + sp.x * st[3];
      s.light[1] = st[1] + sp.y * st[3];
      s.light[2] = st[3] * 0.55;
      s.lightColor = [sp.color[0] / 255, sp.color[1] / 255, sp.color[2] / 255];
    }
    s.light[3] = this.glowK * 0.6;
  }
}
