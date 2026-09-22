/**
 * Tiny lifecycle helper for Astro's ClientRouter.
 *
 * `onPage(selector, init)` runs `init(el)` for the first matching element on
 * every page load (initial + client-side navigations) and calls the returned
 * cleanup before the next swap. Scripts written this way survive view
 * transitions without leaking listeners or animation loops.
 */
type Cleanup = void | (() => void);
type Init<T extends Element> = (el: T) => Cleanup;

const registry: { selector: string; init: Init<any>; cleanup: Cleanup }[] = [];
let wired = false;

function runAll() {
  for (const r of registry) {
    const el = document.querySelector(r.selector);
    if (el) r.cleanup = r.init(el);
  }
}

function cleanAll() {
  for (const r of registry) {
    if (typeof r.cleanup === 'function') r.cleanup();
    r.cleanup = undefined;
  }
}

export function onPage<T extends Element = HTMLElement>(selector: string, init: Init<T>) {
  registry.push({ selector, init, cleanup: undefined });
  if (!wired) {
    wired = true;
    document.addEventListener('astro:page-load', runAll);
    document.addEventListener('astro:before-swap', cleanAll);
  }
  // If the page is already loaded (script evaluated after astro:page-load), run now.
  if (document.readyState !== 'loading' && (window as any).__astroPageLoaded) {
    const el = document.querySelector(selector);
    if (el) registry[registry.length - 1].cleanup = init(el as T);
  }
}

document.addEventListener('astro:page-load', () => {
  (window as any).__astroPageLoaded = true;
});

/** Device / preference helpers */
export const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const finePointer = () => window.matchMedia('(pointer: fine)').matches;
export const isTouch = () => window.matchMedia('(hover: none)').matches;

/** A rough capability score to scale particle counts etc. 0..1 */
export function deviceBudget() {
  const nav = navigator as any;
  const cores = nav.hardwareConcurrency ?? 4;
  const mem = nav.deviceMemory ?? 4;
  const saveData = nav.connection?.saveData ? 0.5 : 1;
  const small = Math.min(window.innerWidth, window.innerHeight) < 600 ? 0.6 : 1;
  const score = Math.min(1, (cores / 8) * 0.5 + (mem / 8) * 0.5) * saveData * small;
  return Math.max(0.25, score);
}

export function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}
export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}
