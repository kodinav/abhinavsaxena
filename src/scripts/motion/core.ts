import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { CustomEase } from 'gsap/CustomEase';
import Lenis from 'lenis';
import { prefersReducedMotion, isTouch } from '@/lib/page';

gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase);
CustomEase.create('ink', 'M0,0 C0.2,0.9 0.3,1 1,1');      // fast start, long settle
CustomEase.create('curtain', 'M0,0 C0.7,0 0.2,1 1,1');    // in-out with a held middle
gsap.defaults({ ease: 'expo.out', duration: 1.1 });

export const reduced = prefersReducedMotion();
export const touch = isTouch();
export { gsap, ScrollTrigger, SplitText };

/* ---------------- Lenis smooth scroll, driven by GSAP's ticker ---------------- */
let lenis: Lenis | null = null;
export function getLenis() { return lenis; }

export function initSmoothScroll() {
  if (lenis || reduced) return lenis;
  lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 1, smoothWheel: true, syncTouch: false });
  (window as any).lenis = lenis;
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis!.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  // anchor links scroll smoothly
  document.addEventListener('click', (e) => {
    const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
    if (!a || a.getAttribute('href') === '#') return;
    const id = decodeURIComponent(a.getAttribute('href')!.slice(1));
    const el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    lenis!.scrollTo(el, { offset: -80, duration: 1.2 });
    history.pushState(null, '', `#${id}`);
  });
  return lenis;
}
export function scrollTop(immediate = true) { lenis ? lenis.scrollTo(0, { immediate }) : window.scrollTo(0, 0); }
export function lockScroll(v: boolean) { if (lenis) v ? lenis.stop() : lenis.start(); document.body.classList.toggle('no-scroll', v); }

/* ---------------- page lifecycle: kill page-scoped animation on swap ---------------- */
const pageCleanups: Array<() => void> = [];
export function onPageCleanup(fn: () => void) { pageCleanups.push(fn); }
document.addEventListener('astro:before-swap', () => {
  ScrollTrigger.getAll().forEach((t) => t.kill());
  pageCleanups.splice(0).forEach((fn) => { try { fn(); } catch {} });
});
document.addEventListener('astro:page-load', () => { requestAnimationFrame(() => ScrollTrigger.refresh()); });

/* ---------------- film grain (compositor-only animation) ---------------- */
export function mountGrain() {
  const el = document.querySelector<HTMLElement>('[data-grain]');
  if (!el || el.dataset.ready) return;
  const c = document.createElement('canvas'); c.width = c.height = 160;
  const ctx = c.getContext('2d')!;
  const img = ctx.createImageData(160, 160);
  for (let i = 0; i < img.data.length; i += 4) { const v = 120 + Math.random() * 135; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
  ctx.putImageData(img, 0, 0);
  el.style.backgroundImage = `url(${c.toDataURL('image/png')})`;
  el.dataset.ready = '1';
}

/* ---------------- fonts ---------------- */
export const fontsReady = (typeof document !== 'undefined' && document.fonts ? document.fonts.ready : Promise.resolve()) as Promise<unknown>;
