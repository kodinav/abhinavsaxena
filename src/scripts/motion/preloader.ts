import { gsap, reduced, lockScroll } from './core';

/**
 * Typographic intro. Plays once per session; skipped for reduced motion.
 * Resolves when the curtain has cleared so the hero can begin.
 */
export function runPreloader(): Promise<boolean> {
  const el = document.querySelector<HTMLElement>('[data-preloader]');
  if (!el) return Promise.resolve(false);
  let seen = false;
  try { seen = sessionStorage.getItem('intro-seen') === '1'; } catch {}
  if (seen || reduced) { el.remove(); return Promise.resolve(false); }
  try { sessionStorage.setItem('intro-seen', '1'); } catch {}
  lockScroll(true);
  const words = Array.from(el.querySelectorAll<HTMLElement>('[data-pre-word]'));
  const name = el.querySelector<HTMLElement>('[data-pre-name]')!;
  const line = el.querySelector<HTMLElement>('[data-pre-line]')!;
  const count = el.querySelector<HTMLElement>('[data-pre-count]')!;
  const letters = Array.from(name.querySelectorAll<HTMLElement>('span'));
  return new Promise((resolve) => {
    const tl = gsap.timeline({
      defaults: { ease: 'expo.out' },
      onComplete: () => { el.remove(); lockScroll(false); resolve(true); },
    });
    (window as any).__pre = tl;
    tl.set(el, { autoAlpha: 1 })
      .fromTo(line, { scaleX: 0 }, { scaleX: 1, duration: 1.4, ease: 'ink' }, 0)
      .fromTo(count, { opacity: 0 }, { opacity: 1, duration: 0.4 }, 0.1);
    // concept words flicker through
    const STEP = 0.3;
    words.forEach((w, i) => {
      tl.fromTo(w, { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.3, ease: 'expo.out' }, 0.15 + i * STEP)
        .to(w, { yPercent: -100, opacity: 0, duration: 0.26, ease: 'expo.in' }, 0.15 + i * STEP + 0.24);
    });
    const t0 = 0.15 + words.length * STEP + 0.1;
    tl.fromTo(letters, { yPercent: 110 }, { yPercent: 0, duration: 0.9, stagger: 0.03 }, t0)
      .to(count, { textContent: 100, snap: { textContent: 1 }, duration: t0 + 0.5, ease: 'power2.inOut' }, 0)
      .to(line, { scaleX: 0, transformOrigin: 'right', duration: 0.6, ease: 'expo.in' }, t0 + 0.7)
      .to(letters, { yPercent: -110, duration: 0.6, stagger: 0.02, ease: 'expo.in' }, t0 + 0.75)
      .to(count, { opacity: 0, duration: 0.3 }, t0 + 0.75)
      .to(el, { clipPath: 'inset(0 0 100% 0)', duration: 0.9, ease: 'curtain' }, t0 + 1.05);
  });
}
