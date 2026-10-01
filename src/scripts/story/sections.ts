import { PRESETS } from '@/scripts/field/field';
import { stories, type StoryId } from '@/data/stories';
import { StoryPlayer, type Host, type Rect } from './player';
import { CaptionUI } from './ui';
import { VISUALS } from './stories';

/**
 * Section stories. Each section of the home page with `data-section-story`
 * has a story; it begins once the visitor has stayed in that section for a
 * few seconds without scrolling, clicking or typing, and ends when they move
 * on (or close it).
 *
 * Where it plays: if the screen has a large enough empty area around the
 * section's content, the story plays there, under the page's text, like the
 * hero's, with its caption beneath it. Otherwise (phones, dense sections) it
 * comes in a small card with the picture inside.
 */
const DWELL_MS = 5000;
const MOVE_PX = 180;
const CELL = 16;

interface CardAt { x: number; y: number; w: number; wide: boolean }
type Layout = { mode: 'inline'; stage: Rect; caption: Rect } | { mode: 'card'; at?: CardAt };
interface Active { sec: HTMLElement; id: StoryId; player: StoryPlayer; mode: 'inline' | 'card'; startY: number; stage: Rect; caption?: Rect }

export function mountSectionStories(card: HTMLElement) {
  const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-section-story]'));
  const hero = document.querySelector<HTMLElement>('[data-hero]');
  const frame = card.querySelector<HTMLElement>('[data-sstory-frame]')!;
  const uiRoot = card.querySelector<HTMLElement>('[data-story-ui]')!;
  if (!sections.length) return () => {};
  // one canvas for every section's story: in a card it sits in the frame, inline it lies under the page
  const canvas = document.createElement('canvas');
  canvas.className = 'story-stage';
  canvas.setAttribute('aria-hidden', 'true');

  let active: Active | null = null;
  let lastMove = performance.now();
  let lastY = window.scrollY;
  const players = new Map<StoryId, StoryPlayer>();
  const frozen = new Map<StoryId, Rect>();
  const finished = new Set<StoryId>();
  const dismissed = new Set<StoryId>();
  const capHeights = new Map<string, number>();
  let endTimer = 0;

  const ui = new CaptionUI(uiRoot, {
    toggle: () => active?.player.toggle(),
    go: (i) => active?.player.go(i),
    close: () => close({ dismiss: true }),
  });

  /* ------------------------------------------------------------ stage geometry */
  const stageNow = (id: StoryId): Rect | null => {
    if (active && active.id === id) {
      if (active.mode === 'card') return active.stage;
      const dy = window.scrollY - active.startY;
      return [active.stage[0], active.stage[1] - dy, active.stage[2], active.stage[3]];
    }
    return frozen.get(id) ?? null;
  };

  const host = (id: StoryId): Host => ({
    ui,
    canvas,
    feather: () => {
      const st = stageNow(id);
      return canvas.classList.contains('story-stage--card') || !st ? 0 : Math.min(st[2], st[3]) * 0.12;
    },
    basePreset: () => ({ ...PRESETS.ambient, alpha: 0.82, density: 0.8, fog: 0.55, speed: 0.6, textMask: 0 }),
    restPreset: () => 'ambient',
    stage: () => stageNow(id),
    onEnd: () => {
      window.clearTimeout(endTimer);
      endTimer = window.setTimeout(() => close({ done: true }), 2600);
    },
  });

  /** The section most of the screen is showing, if it shows enough of it. */
  const dominant = () => {
    const vh = window.innerHeight;
    let best: HTMLElement | null = null, bestH = 0;
    for (const sec of sections) {
      const r = sec.getBoundingClientRect();
      const vis = Math.min(r.bottom, vh) - Math.max(r.top, 0);
      if (vis > bestH) { bestH = vis; best = sec; }
    }
    if (!best) return null;
    return bestH >= Math.min(vh * 0.42, best.getBoundingClientRect().height * 0.9) ? best : null;
  };
  const heroShowing = () => !!hero && hero.getBoundingClientRect().bottom > window.innerHeight * 0.15;

  /* ------------------------------------------------------------ finding room on the page */
  function occupancy() {
    const vw = window.innerWidth, vh = window.innerHeight;
    const cols = Math.ceil(vw / CELL), rows = Math.ceil(vh / CELL);
    const occ = new Uint8Array(cols * rows);
    // 1 for anything on the page, 3 for links and controls, 8 for headings
    const mark = (l: number, t: number, r: number, b: number, pad: number, v = 1) => {
      const c0 = Math.max(0, Math.floor((l - pad) / CELL)), c1 = Math.min(cols - 1, Math.floor((r + pad) / CELL));
      const r0 = Math.max(0, Math.floor((t - pad) / CELL)), r1 = Math.min(rows - 1, Math.floor((b + pad) / CELL));
      for (let y = r0; y <= r1; y++) for (let x = c0; x <= c1; x++) if (occ[y * cols + x] < v) occ[y * cols + x] = v;
    };
    // the navigation slides away on scroll but comes back; always keep its band clear
    const navH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) * 16 || 68;
    mark(0, 0, vw, navH + 16, 0);
    mark(0, vh - 12, vw, vh, 0);
    const seen = new WeakMap<Element, boolean>();
    // collapsed panels and faded-out steps still report boxes; they are not on screen
    const skip = (el: Element | null): boolean => {
      if (!el) return true;
      if (seen.has(el)) return seen.get(el)!;
      const out = !!el.closest('[data-sstory], .story-stage, .marquee, .field, [data-hero], [hidden]') ||
        (typeof (el as any).checkVisibility === 'function' && !(el as any).checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }));
      seen.set(el, out);
      return out;
    };
    // every visible line of text
    const range = document.createRange();
    const walker = document.createTreeWalker(document.querySelector('main') ?? document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => (n.nodeValue && n.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT),
    });
    // text that a mask or a scroller has slid out of view does not count either
    const clips = new WeakMap<Element, DOMRect | null>();
    const clipOf = (el: Element | null): DOMRect | null => {
      if (!el || el === document.body) return null;
      if (clips.has(el)) return clips.get(el)!;
      const cs = getComputedStyle(el);
      const own = cs.overflowX !== 'visible' || cs.overflowY !== 'visible' ? el.getBoundingClientRect() : null;
      const up = clipOf(el.parentElement);
      let out: DOMRect | null = own ?? up;
      if (own && up) out = new DOMRect(Math.max(own.left, up.left), Math.max(own.top, up.top), Math.min(own.right, up.right) - Math.max(own.left, up.left), Math.min(own.bottom, up.bottom) - Math.max(own.top, up.top));
      clips.set(el, out);
      return out;
    };
    while (walker.nextNode()) {
      const n = walker.currentNode;
      const el = n.parentElement;
      if (skip(el)) continue;
      const clip = clipOf(el);
      // a card may cover the corner of a card, never the end of a heading
      const weight = el!.closest('h1, h2, h3') ? 8 : el!.closest('a, button') ? 3 : 1;
      range.selectNodeContents(n);
      for (const r of Array.from(range.getClientRects())) {
        let l = r.left, t = r.top, rr = r.right, b = r.bottom;
        if (clip) { l = Math.max(l, clip.left); t = Math.max(t, clip.top); rr = Math.min(rr, clip.right); b = Math.min(b, clip.bottom); }
        if (rr - l > 0 && b - t > 0 && b > 0 && t < vh) mark(l, t, rr, b, 14, weight);
      }
    }
    // pictures, icons and cards always count; buttons and links only when they are drawn as boxes
    const solid = (el: Element) => {
      const cs = getComputedStyle(el);
      const bg = cs.backgroundColor.match(/[\d.]+/g);
      const alpha = bg ? (bg.length > 3 ? Number(bg[3]) : 1) : 0;
      return alpha > 0.04 || parseFloat(cs.borderTopWidth) > 0 || parseFloat(cs.borderLeftWidth) > 0;
    };
    document.querySelectorAll('main img, main svg, main video, main canvas, main input, main select, main textarea, main [class*="card"], main [class*="icon"], main figure, main button, main .btn, main .chip').forEach((el) => {
      if (skip(el)) return;
      if ((el.matches('button, .btn, .chip') && !el.matches('[class*="card"]')) && !solid(el)) return;
      const r = el.getBoundingClientRect();
      if (r.width < 4 || r.height < 4 || r.bottom < 0 || r.top > vh) return;
      mark(r.left, r.top, r.right, r.bottom, 12, el.matches('button, .btn, .chip, a') ? 3 : 1);
    });
    return { occ, cols, rows };
  }

  /** Visit every maximal empty rectangle of the grid (in px). */
  function freeRects(g: { occ: Uint8Array; cols: number; rows: number }, visit: (x: number, y: number, w: number, h: number) => void) {
    const { occ, cols, rows } = g;
    const hts = new Uint16Array(cols);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) hts[c] = occ[r * cols + c] ? 0 : hts[c] + 1;
      const stack: number[] = [];
      for (let c = 0; c <= cols; c++) {
        const h = c < cols ? hts[c] : 0;
        while (stack.length && hts[stack[stack.length - 1]] >= h) {
          const top = stack.pop()!;
          const H = hts[top];
          const left = stack.length ? stack[stack.length - 1] + 1 : 0;
          if (H) visit(left * CELL, (r - H + 1) * CELL, (c - left) * CELL, H * CELL);
        }
        stack.push(c);
      }
    }
  }

  function captionHeight(id: StoryId, width: number) {
    const key = `${id}:${Math.round(width / 40)}`;
    if (capHeights.has(key)) return capHeights.get(key)!;
    // measure with the story's longest scene, so the caption never outgrows its place
    const text = stories[id];
    const longest = text.scenes.reduce((a, s, i) => (s.quote.length > text.scenes[a].quote.length ? i : a), 0);
    card.classList.add('is-inline', 'is-measuring'); card.classList.remove('is-card');
    card.style.width = `${width}px`;
    ui.setStory(text); ui.show(longest);
    const h = uiRoot.getBoundingClientRect().height;
    card.classList.remove('is-measuring');
    ui.reset();
    capHeights.set(key, h);
    return h;
  }

  /** How many taken cells a rectangle would cover. */
  function covered(g: ReturnType<typeof occupancy>, x: number, y: number, w: number, h: number) {
    let n = 0;
    const c0 = Math.max(0, Math.floor(x / CELL)), c1 = Math.min(g.cols - 1, Math.floor((x + w) / CELL));
    const r0 = Math.max(0, Math.floor(y / CELL)), r1 = Math.min(g.rows - 1, Math.floor((y + h) / CELL));
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) n += g.occ[r * g.cols + c];
    return n;
  }
  /** Of the corners, edges and middle of the screen, the place where a box of this size hides the least. */
  function quietestCorner(g: ReturnType<typeof occupancy>, w: number, h: number): [number, number] {
    const vw = window.innerWidth, vh = window.innerHeight;
    const navH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) * 16 || 68;
    const xs = [vw - 16 - w, 16, (vw - w) / 2, (vw - w) * 0.75, (vw - w) * 0.25], ys = [vh - 16 - h, navH + 16, navH + 16 + (vh - navH - 32 - h) / 2];
    const spots: [number, number][] = [];
    for (const y of ys) for (const x of xs) spots.push([x, Math.max(navH + 16, y)]);
    // corners first, so a tie goes to the edge of the screen rather than its middle
    return spots.reduce((best, s) => (covered(g, s[0], s[1], w, h) < covered(g, best[0], best[1], w, h) ? s : best));
  }
  /**
   * Where a card goes and what shape it takes: a wide card (picture beside the caption) or a tall one
   * (picture above it). Empty space first; failing that, the shape and place that hide the least.
   */
  function cardSpot(g: ReturnType<typeof occupancy>, id: StoryId, aspect: number): CardAt {
    const vw = window.innerWidth;
    const fw = 300, fh = Math.min(fw / aspect, 240);
    const wideW = Math.min(680, vw - 32);
    const variants: { w: number; h: number; wide: boolean }[] = [
      ...[wideW, Math.min(600, wideW), Math.min(540, wideW)].map((ww) => ({ w: ww, h: Math.max(fh, captionHeight(id, ww - fw - 40)) + 26, wide: true })),
      ...[380, 340].map((cw) => ({ w: cw, h: Math.min(window.innerHeight * 0.3, (cw - 24) / aspect) + captionHeight(id, cw - 24) + 44, wide: false })),
    ];
    for (const v of variants) {
      let spot: CardAt | undefined, bestArea = 0;
      freeRects(g, (x, y, w, h) => { if (w - 32 >= v.w && h - 16 >= v.h && w * h > bestArea) { bestArea = w * h; spot = { x: x + 16 + (w - 32 - v.w) / 2, y: y + 8 + (h - 16 - v.h) / 2, w: v.w, wide: v.wide }; } });
      if (spot) return spot;
    }
    let best: (CardAt & { c: number }) | null = null;
    for (const v of variants) {
      const [x, y] = quietestCorner(g, v.w, v.h);
      const c = covered(g, x, y, v.w, v.h);
      if (!best || c < best.c) best = { x, y, w: v.w, wide: v.wide, c };
    }
    return best!;
  }

  function findLayout(sec: HTMLElement, id: StoryId, aspect: number): Layout {
    const vw = window.innerWidth;
    if (vw <= 900) return { mode: 'card' };
    const g = occupancy();
    const card = (): Layout => ({ mode: 'card', at: cardSpot(g, id, aspect) });
    const capW = Math.min(460, Math.max(340, vw * 0.28));
    const capH = captionHeight(id, capW) + 20;
    let best: { score: number; x: number; y: number; w: number; h: number; sw: number; sh: number } | null = null;
    freeRects(g, (x, y, w, h) => {
      const sh0 = h - capH - 12;
      const sw = Math.min(w, sh0 * aspect), sh = sw / aspect;
      if (sw < 300 || sh < 220 || w < capW) return;
      const score = sw * sh;
      if (!best || score > best.score) best = { score, x, y, w, h, sw, sh };
    });
    if (!best) return card();
    const b = best as { x: number; y: number; w: number; h: number; sw: number; sh: number };
    const sx = b.x + (b.w - b.sw) / 2;
    const sy = b.y + Math.max(0, (b.h - b.sh - capH - 12) / 2);
    const cx = Math.max(b.x, Math.min(sx, b.x + b.w - capW));
    return { mode: 'inline', stage: [sx, sy, b.sw, b.sh], caption: [cx, sy + b.sh + 12, capW, capH] };
  }

  /* ------------------------------------------------------------ open and close */
  function open(sec: HTMLElement, id: StoryId) {
    const visuals = VISUALS[id];
    if (!visuals) return;
    card.style.transform = '';
    const layout = findLayout(sec, id, visuals.aspect);
    let stage: Rect;
    card.classList.toggle('is-card', layout.mode === 'card');
    card.classList.toggle('is-inline', layout.mode === 'inline');
    if (layout.mode === 'inline') {
      card.style.left = `${layout.caption[0]}px`; card.style.top = `${layout.caption[1]}px`; card.style.width = `${layout.caption[2]}px`;
      stage = layout.stage;
      card.before(canvas);
      canvas.className = 'story-stage story-stage--inline';
      Object.assign(canvas.style, { left: `${stage[0]}px`, top: `${stage[1]}px`, width: `${stage[2]}px`, height: `${stage[3]}px`, transform: '' });
    } else {
      // in empty space if there is any, otherwise the corner
      const at = layout.at;
      card.classList.toggle('is-wide', !!at?.wide);
      card.style.left = at ? `${at.x}px` : ''; card.style.top = at ? `${at.y}px` : ''; card.style.width = at ? `${at.w}px` : '';
      card.style.right = at ? 'auto' : ''; card.style.bottom = at ? 'auto' : '';
      // size the picture to the story's shape
      if (at?.wide) {
        const fh = Math.min(300 / visuals.aspect, 240);
        frame.style.height = `${fh}px`; frame.style.width = `${fh * visuals.aspect}px`; frame.style.marginInline = '';
      } else {
        const cw = card.getBoundingClientRect().width - 24;
        const fh = Math.min(window.innerHeight * 0.3, cw / visuals.aspect);
        frame.style.height = `${fh}px`; frame.style.width = `${fh * visuals.aspect}px`; frame.style.marginInline = 'auto';
      }
      const fr = frame.getBoundingClientRect();
      stage = [fr.left, fr.top, fr.width, fr.height];
      frame.append(canvas);
      canvas.className = 'story-stage story-stage--card';
      Object.assign(canvas.style, { left: '', top: '', width: '', height: '', transform: '' });
    }
    let player = players.get(id);
    if (!player) { player = new StoryPlayer(visuals, stories[id], host(id)); players.set(id, player); }
    frozen.delete(id);
    active = { sec, id, player, mode: layout.mode, startY: window.scrollY, stage };
    window.clearTimeout(endTimer);
    player.playing = true;
    player.start(player.index, 0);
    card.classList.add('is-open');
    if (layout.mode === 'card') {
      // the card's own position is final only once it is shown
      requestAnimationFrame(() => {
        if (!active || active.id !== id) return;
        const fr = frame.getBoundingClientRect();
        active.stage = [fr.left, fr.top, fr.width, fr.height];
      });
    }
  }

  function close(opts: { done?: boolean; dismiss?: boolean } = {}) {
    if (!active) return;
    const { id, player } = active;
    if (opts.done) finished.add(id);
    if (opts.dismiss) dismissed.add(id);
    if (opts.done) player.index = 0;
    frozen.set(id, stageNow(id)!);
    active = null;
    card.classList.remove('is-open');
    player.stop();
    window.clearTimeout(endTimer);
    lastMove = performance.now();
  }

  /* ------------------------------------------------------------ watching the visitor */
  const moved = () => { lastMove = performance.now(); };
  const onScroll = () => {
    const y = window.scrollY;
    if (Math.abs(y - lastY) < 2) return;
    lastY = y;
    moved();
    if (active && (Math.abs(y - active.startY) > MOVE_PX || dominant() !== active.sec)) close();
    else if (active && active.mode === 'inline') {
      const shift = `translateY(${-(y - active.startY)}px)`;
      card.style.transform = shift;
      canvas.style.transform = shift;
    }
  };
  const onResize = () => { moved(); if (active) close(); };
  const onPointer = (e: Event) => { if (!(e.target as Element)?.closest?.('[data-sstory]')) moved(); };
  const onTheme = () => active?.player.refresh();
  document.addEventListener('themechange', onTheme);
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize);
  window.addEventListener('pointerdown', onPointer, { passive: true });
  window.addEventListener('keydown', moved);
  const timer = window.setInterval(() => {
    if (document.hidden) { moved(); return; }
    if (active) {
      // another story (the hero's) has taken the field
      if (!active.player.isCurrent) close();
      return;
    }
    if (performance.now() - lastMove < DWELL_MS || heroShowing()) return;
    const sec = dominant();
    if (!sec) return;
    const id = sec.dataset.sectionStory as StoryId;
    if (!VISUALS[id] || dismissed.has(id) || finished.has(id)) return;
    card.style.transform = '';
    open(sec, id);
  }, 400);

  (window as any).__sectionStory = {
    open: (id: StoryId, scene = 0, t = 0) => {
      const sec = sections.find((s) => s.dataset.sectionStory === id);
      if (!sec) return;
      if (active) close();
      finished.delete(id); dismissed.delete(id);
      open(sec, id);
      active?.player.go(scene, t);
    },
    close: () => close(),
    pause: () => active?.player.pause(),
    /** QA: the occupancy grid as text (# = taken) and the layout this section would get */
    debug: (id: StoryId) => {
      const g = occupancy();
      let txt = '';
      for (let r = 0; r < g.rows; r += 2) { for (let c = 0; c < g.cols; c += 2) txt += g.occ[r * g.cols + c] ? '#' : '.'; txt += '\n'; }
      const sec = sections.find((x) => x.dataset.sectionStory === id)!;
      return { grid: txt, layout: findLayout(sec, id, VISUALS[id]!.aspect), cap: captionHeight(id, Math.min(460, Math.max(340, window.innerWidth * 0.28))) };
    },
    get active() { return active ? { id: active.id, mode: active.mode, stage: active.stage } : null; },
  };

  return () => {
    window.clearInterval(timer);
    window.clearTimeout(endTimer);
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onResize);
    window.removeEventListener('pointerdown', onPointer);
    window.removeEventListener('keydown', moved);
    document.removeEventListener('themechange', onTheme);
    if (active) { active.player.stop(false); active = null; }
    card.classList.remove('is-open');
    canvas.remove();
    ui.destroy();
    delete (window as any).__sectionStory;
  };
}
