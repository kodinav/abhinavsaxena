import { gsap, reduced, scrollTop } from './core';

/**
 * Cinematic page transitions on top of Astro's ClientRouter: a curtain rises
 * carrying the destination's name, the DOM swaps behind it, the curtain clears.
 */
export function initTransitions() {
  const curtain = document.querySelector<HTMLElement>('[data-curtain]');
  if (!curtain || reduced) return;
  const label = curtain.querySelector<HTMLElement>('[data-curtain-label]')!;
  let pending: Promise<void> | null = null;

  const labelFor = (url: URL, source?: Element | null) => {
    const txt = (source as HTMLElement | null)?.dataset?.transitionLabel ?? (source as HTMLElement | null)?.textContent?.trim();
    if (txt && txt.length < 40 && !/^\d+$/.test(txt)) return txt;
    const seg = url.pathname.split('/').filter(Boolean);
    if (!seg.length) return 'Home';
    const map: Record<string, string> = { research: 'Research', publications: 'Publications', essays: 'Essays', lab: 'Philosophy Lab', ideas: 'Ideas', about: 'About', cv: 'Curriculum Vitae', contact: 'Contact' };
    return map[seg[0]] ?? seg[0];
  };

  document.addEventListener('astro:before-preparation', (e: any) => {
    if (e.navigationType === 'traverse') return; // back/forward: keep it instant
    label.textContent = labelFor(e.to, e.sourceElement);
    curtain.style.clipPath = 'inset(100% 0 0 0)';
    curtain.style.visibility = 'visible';
    const tl = gsap.timeline();
    tl.to(curtain, { clipPath: 'inset(0% 0 0 0)', duration: 0.62, ease: 'curtain' })
      .fromTo(label, { yPercent: 40, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.5, ease: 'expo.out' }, 0.25);
    pending = new Promise((r) => tl.eventCallback('onComplete', () => r()));
    const original = e.loader;
    e.loader = async () => { await Promise.all([original(), pending]); };
  });

  document.addEventListener('astro:after-swap', () => {
    scrollTop(true);
    if (curtain.style.visibility !== 'visible') return;
    gsap.timeline({ delay: 0.12 })
      .to(label, { yPercent: -30, opacity: 0, duration: 0.4, ease: 'expo.in' }, 0)
      .to(curtain, { clipPath: 'inset(0 0 100% 0)', duration: 0.7, ease: 'curtain' }, 0.15)
      .set(curtain, { visibility: 'hidden', clipPath: 'inset(100% 0 0 0)' });
  });
}
