import { initSmoothScroll, mountGrain } from './core';
import { initTransitions } from './transitions';
import { runPreloader } from './preloader';
import { mountText, mountMotion, mountParallax } from './text';
import { mountTilt } from './tilt';
import { mountField, field } from '@/scripts/field/field';

/**
 * Site motion bootstrap. First load: grain, smooth scroll, transitions, the
 * field, then the intro. Every page load: text reveals, motion attributes,
 * parallax, tilt, and the field's mode for that page.
 */
let booted = false;

function applyFieldMode() {
  const mode = document.body.dataset.fieldMode ?? 'ambient';
  field.setAnchors([]);
  field.setActive(null);
  field.setScroll(0);
  field.setPreset(mode === 'hero' ? 'hero' : mode);
  field.setIntensity(mode === 'off' ? 0 : 1);
}

/** Compile shaders and allocate particles off the critical path; the intro or the fade-in covers the gap. */
function mountFieldDeferred() {
  const go = () => { mountField(); applyFieldMode(); };
  if ('requestIdleCallback' in window) (window as any).requestIdleCallback(go, { timeout: 700 });
  else setTimeout(go, 120);
}

async function boot() {
  mountGrain();
  initSmoothScroll();
  initTransitions();
  mountFieldDeferred();
  const played = await runPreloader();
  document.documentElement.classList.add('is-ready');
  document.dispatchEvent(new CustomEvent('intro:done', { detail: { played } }));
}

document.addEventListener('astro:page-load', () => {
  if (!booted) {
    booted = true;
    boot();
  } else {
    document.querySelector('[data-preloader]')?.remove();
    mountGrain();
    if (field.ok) applyFieldMode(); else mountFieldDeferred();
    document.documentElement.classList.add('is-ready');
    document.dispatchEvent(new CustomEvent('intro:done', { detail: { played: false } }));
  }
  mountText();
  mountMotion();
  mountParallax();
  mountTilt();
});
