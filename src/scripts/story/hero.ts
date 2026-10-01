import { PRESETS } from '@/scripts/field/field';
import { stories } from '@/data/stories';
import { StoryPlayer, type Host, type Rect } from './player';
import { CaptionUI } from './ui';
import { cave } from './stories/cave';

/**
 * The hero's story ("The voice from the wall"): plays on arrival, beside the
 * name on desktop and in its own block on phones, and steps aside whenever
 * the hero leaves the screen.
 */
export function mountStory(hero: HTMLElement) {
  const root = hero.querySelector<HTMLElement>('[data-story]');
  if (!root) return () => {};
  const ASPECT = cave.aspect;
  // in document coordinates
  let stage = { x: 0, y: 0, w: 0, h: 0 };
  let mobile = false, inView = true, started = false;
  const off: Array<() => void> = [];

  const canvas = document.createElement('canvas');
  canvas.className = 'story-stage story-stage--hero';
  canvas.setAttribute('aria-hidden', 'true');
  hero.append(canvas);

  const ui = new CaptionUI(root, { toggle: () => player.toggle(), go: (i) => player.go(i) });
  const host: Host = {
    ui,
    canvas,
    feather: () => Math.min(stage.w, stage.h) * (mobile ? 0.08 : 0.14),
    basePreset: () => PRESETS.hero,
    stage: (): Rect | null => (inView && stage.w > 0 ? [stage.x, stage.y - window.scrollY, stage.w, stage.h] : null),
  };
  const player = new StoryPlayer(cave, stories.cave, host);

  const measure = () => {
    const vw = window.innerWidth, vh = window.innerHeight;
    const hr = hero.getBoundingClientRect();
    mobile = vw <= 900;
    let x: number, y: number, w: number, h: number;
    if (!mobile) {
      // the visible end of the name, not its (wider) box
      const words = Array.from(hero.querySelectorAll('.hero__wordwrap')).map((el) => el.getBoundingClientRect().right);
      const textRight = words.length ? Math.max(...words) : vw * 0.5;
      const cap = root.getBoundingClientRect();
      const left = Math.max(textRight + vw * 0.03, vw * 0.48);
      const right = vw - Math.max(20, vw * 0.03);
      const boxTop = hr.top + Math.max(12, hr.height * 0.02);
      const boxBottom = Math.min(cap.top - 14, hr.top + vh * 0.86);
      const bw = right - left, bh = Math.max(120, boxBottom - boxTop);
      w = Math.min(bw, bh * ASPECT); h = w / ASPECT;
      x = left + (bw - w) / 2; y = boxTop + (bh - h) * 0.55;
    } else {
      // phones: the story gets its own full-width stage between the buttons and the caption
      const r = hero.querySelector('[data-story-stage]')?.getBoundingClientRect();
      w = r && r.width ? r.width : vw; h = w / ASPECT; x = r?.left ?? 0;
      y = r ? r.top + (r.height - h) / 2 : hr.top + vh * 0.5;
    }
    stage = { x, y: y + window.scrollY, w, h };
    // the canvas sits in the hero, so it scrolls with it
    canvas.style.left = `${x - hr.left}px`;
    canvas.style.top = `${y - hr.top}px`;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    player.refresh();
  };
  measure();
  const onResize = () => measure();
  window.addEventListener('resize', onResize);
  off.push(() => window.removeEventListener('resize', onResize));
  document.fonts?.ready.then(measure);
  const onTheme = () => player.refresh();
  document.addEventListener('themechange', onTheme);
  off.push(() => document.removeEventListener('themechange', onTheme));

  const io = new IntersectionObserver(([e]) => {
    if (e.isIntersecting === inView) return;
    inView = e.isIntersecting;
    if (!inView) player.stop(false);
    else if (started) { measure(); player.start(player.index); }
  }, { threshold: 0.12 });
  io.observe(hero);
  off.push(() => io.disconnect());

  const begin = () => {
    started = true;
    hero.classList.add('has-story');
    if (inView) player.start(player.reduced ? 1 : 0);
  };
  if (document.documentElement.classList.contains('is-ready')) begin();
  else { document.addEventListener('intro:done', begin, { once: true }); off.push(() => document.removeEventListener('intro:done', begin)); }

  (window as any).__story = { go: (i: number, t = 0) => player.go(i, t), pause: () => player.pause(), play: () => player.play(), get state() { return { index: player.index, t: player.t }; } };

  return () => {
    off.forEach((f) => f());
    player.stop(false);
    ui.destroy();
    canvas.remove();
    hero.classList.remove('has-story');
    delete (window as any).__story;
  };
}
