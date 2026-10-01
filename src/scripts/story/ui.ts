import type { StoryText } from '@/data/stories';
import { clamp } from '@/lib/page';

/**
 * The caption and controls of a story: scene number and title, the quotation
 * (or telling) and its source, a play/pause button, one button per scene that
 * doubles as its progress bar, and, for section stories, a close button.
 */
export class CaptionUI {
  private titleEl: HTMLElement | null;
  private numEl: HTMLElement | null;
  private totalEl: HTMLElement | null;
  private actEl: HTMLElement | null;
  private quoteEl: HTMLElement | null;
  private srcEl: HTMLElement | null;
  private toggleBtn: HTMLButtonElement | null;
  private dotsBox: HTMLElement | null;
  private fills: HTMLElement[] = [];
  private dots: HTMLButtonElement[] = [];
  private shown = -1;
  private text: StoryText | null = null;
  private swapTimer = 0;
  private onClick: (e: Event) => void;

  constructor(public root: HTMLElement, private on: { toggle: () => void; go: (i: number) => void; close?: () => void }) {
    const q = <T extends HTMLElement = HTMLElement>(sel: string) => root.querySelector<T>(sel);
    this.titleEl = q('[data-story-title]'); this.numEl = q('[data-story-num]'); this.totalEl = q('[data-story-total]');
    this.actEl = q('[data-story-act]'); this.quoteEl = q('[data-story-quote]'); this.srcEl = q('[data-story-src]');
    this.toggleBtn = q<HTMLButtonElement>('[data-story-toggle]'); this.dotsBox = q('[data-story-dots]');
    this.onClick = (e) => {
      const t = e.target as HTMLElement;
      if (t.closest('[data-story-toggle]')) { this.on.toggle(); return; }
      if (t.closest('[data-story-close]')) { this.on.close?.(); return; }
      const go = t.closest<HTMLElement>('[data-story-go]');
      if (go) this.on.go(Number(go.dataset.storyGo));
    };
    root.addEventListener('click', this.onClick);
  }

  destroy() {
    this.root.removeEventListener('click', this.onClick);
    window.clearTimeout(this.swapTimer);
  }

  setStory(text: StoryText) {
    if (this.text === text) return;
    this.text = text;
    this.shown = -1;
    if (this.titleEl) this.titleEl.textContent = text.title;
    if (this.totalEl) this.totalEl.textContent = text.scenes[text.scenes.length - 1].numeral;
    this.root.setAttribute('aria-label', `A story: ${text.title}, ${text.about}`);
    if (this.dotsBox) {
      this.dotsBox.textContent = '';
      this.dots = []; this.fills = [];
      text.scenes.forEach((s, i) => {
        const li = document.createElement('li');
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'story__dot'; b.dataset.storyGo = String(i);
        b.setAttribute('aria-label', `Scene ${s.numeral}: ${s.title}`);
        const tick = document.createElement('span'); tick.className = 'story__tick';
        const fill = document.createElement('span'); fill.className = 'story__fill';
        tick.append(fill); b.append(tick); li.append(b); this.dotsBox!.append(li);
        this.dots.push(b); this.fills.push(fill);
      });
    }
  }

  show(i: number) {
    if (!this.text || i === this.shown) return;
    const first = this.shown < 0;
    this.shown = i;
    const s = this.text.scenes[i];
    const swap = () => {
      if (this.numEl) this.numEl.textContent = s.numeral;
      if (this.actEl) this.actEl.textContent = s.title;
      if (this.quoteEl) this.quoteEl.textContent = s.quote;
      if (this.srcEl) {
        this.srcEl.textContent = '';
        if (s.href) { const l = document.createElement('a'); l.href = s.href; l.className = 'link'; l.textContent = s.source; this.srcEl.append(l); }
        else this.srcEl.textContent = s.source;
      }
      this.root.dataset.kind = s.kind ?? 'quote';
      this.root.dataset.verse = s.quote.includes('\n') ? 'true' : 'false';
      this.dots.forEach((d, k) => { d.classList.toggle('is-current', k === i); d.setAttribute('aria-current', k === i ? 'step' : 'false'); });
      this.fills.forEach((f, k) => { if (k !== i) f.style.transform = `scaleX(${k < i ? 1 : 0})`; });
    };
    window.clearTimeout(this.swapTimer);
    if (first) { this.root.classList.remove('is-swapping'); swap(); return; }
    this.root.classList.add('is-swapping');
    this.swapTimer = window.setTimeout(() => { swap(); this.root.classList.remove('is-swapping'); }, 380);
  }

  /** Forget the scene on show, so the next `show` is immediate rather than a swap. */
  reset() { this.shown = -1; window.clearTimeout(this.swapTimer); this.root.classList.remove('is-swapping'); }

  progress(p: number) { const f = this.fills[this.shown]; if (f) f.style.transform = `scaleX(${clamp(p, 0, 1)})`; }

  setPlaying(on: boolean) {
    this.root.classList.toggle('is-paused', !on);
    if (!this.toggleBtn) return;
    this.toggleBtn.setAttribute('aria-pressed', on ? 'false' : 'true');
    this.toggleBtn.setAttribute('aria-label', on ? 'Pause the story' : 'Play the story');
  }
  setReduced() { this.root.classList.add('is-reduced'); }
}
