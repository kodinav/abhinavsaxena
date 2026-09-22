import { gsap, ScrollTrigger, SplitText, reduced, onPageCleanup, fontsReady } from './core';

/**
 * Declarative text motion.
 *   data-split="lines"   masked line reveal on scroll (or on `data-split-when="load"`)
 *   data-split="chars"   staggered character rise
 *   data-split="words"   progressive word reveal scrubbed by scroll
 */
export async function mountText(root: ParentNode = document) {
  const els = Array.from(root.querySelectorAll<HTMLElement>('[data-split]:not([data-split-ready])'));
  if (!els.length) return;
  await fontsReady;
  for (const el of els) {
    el.dataset.splitReady = '1';
    const kind = el.dataset.split;
    const when = el.dataset.splitWhen ?? 'scroll';
    const delay = Number(el.dataset.splitDelay ?? 0);
    if (reduced) { el.style.opacity = '1'; continue; }
    if (kind === 'lines') {
      const split = SplitText.create(el, {
        type: 'lines', mask: 'lines', linesClass: 'split-line', autoSplit: true, aria: 'none',
        onSplit: (self) => gsap.from(self.lines, {
          yPercent: 110, duration: 1.25, ease: 'expo.out', stagger: 0.09, delay,
          ...(when === 'scroll' ? { scrollTrigger: { trigger: el, start: 'top 88%', once: true } } : {}),
        }),
      });
      onPageCleanup(() => split.revert());
    } else if (kind === 'chars') {
      const split = SplitText.create(el, {
        type: 'chars,words', mask: 'chars', charsClass: 'split-char', autoSplit: true, aria: 'auto',
        onSplit: (self) => gsap.from(self.chars, {
          yPercent: 120, rotateZ: 3, duration: 1.1, ease: 'expo.out', stagger: { each: 0.028, from: 'start' }, delay,
          ...(when === 'scroll' ? { scrollTrigger: { trigger: el, start: 'top 88%', once: true } } : {}),
        }),
      });
      onPageCleanup(() => split.revert());
    } else if (kind === 'words') {
      const split = SplitText.create(el, {
        type: 'words', wordsClass: 'split-word', autoSplit: true, aria: 'none',
        onSplit: (self) => gsap.fromTo(self.words, { opacity: 0.45 }, {
          opacity: 1, ease: 'none', stagger: 0.06,
          scrollTrigger: { trigger: el, start: 'top 78%', end: 'bottom 52%', scrub: 0.6 },
        }),
      });
      onPageCleanup(() => split.revert());
    }
  }
  ScrollTrigger.refresh();
}

/** Simple attribute-driven motion: data-motion="rise|fade|scale|clip" with optional data-motion-delay. */
export function mountMotion(root: ParentNode = document) {
  if (reduced) return;
  const els = Array.from(root.querySelectorAll<HTMLElement>('[data-motion]:not([data-motion-ready])'));
  const groups = new Map<Element, HTMLElement[]>();
  for (const el of els) {
    el.dataset.motionReady = '1';
    const g = el.closest('[data-motion-group]') ?? el;
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g)!.push(el);
  }
  for (const [g, list] of groups) {
    const kind = list[0].dataset.motion;
    const from: gsap.TweenVars = kind === 'fade' ? { opacity: 0 } : kind === 'scale' ? { opacity: 0, scale: 0.92 } : kind === 'clip' ? { clipPath: 'inset(0 0 100% 0)' } : { opacity: 0, y: 40 };
    gsap.from(list, {
      ...from, duration: 1.2, ease: 'expo.out', stagger: list.length > 1 ? 0.08 : 0,
      delay: Number(list[0].dataset.motionDelay ?? 0),
      scrollTrigger: { trigger: g, start: 'top 88%', once: true },
      clearProps: 'transform,opacity,clipPath',
    });
  }
}

/** Parallax: data-parallax="0.2" moves the element 20% of scroll distance (negative = opposite). */
export function mountParallax(root: ParentNode = document) {
  if (reduced) return;
  root.querySelectorAll<HTMLElement>('[data-parallax]:not([data-parallax-ready])').forEach((el) => {
    el.dataset.parallaxReady = '1';
    const k = Number(el.dataset.parallax || 0.15);
    gsap.to(el, { yPercent: -k * 100, ease: 'none', scrollTrigger: { trigger: el.closest('[data-parallax-scope]') ?? el, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
}
