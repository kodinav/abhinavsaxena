import { reduced, touch } from './core';
import { lerp } from '@/lib/page';

/**
 * Kinetic variable-font lettering: glyphs near the pointer gain weight and
 * optical size, like ink swelling under a hand. [data-kinetic] > .letter spans.
 */
export function mountKinetic(root: HTMLElement) {
  if (reduced || touch) return () => {};
  const letters = Array.from(root.querySelectorAll<HTMLElement>('[data-letter]'));
  if (!letters.length) return () => {};
  const state = letters.map(() => ({ w: 400, tw: 400 }));
  let px = -9999, py = -9999, raf = 0, active = false;
  let rects: DOMRect[] = [];
  const measure = () => { rects = letters.map((l) => l.getBoundingClientRect()); };
  const onMove = (e: PointerEvent) => { px = e.clientX; py = e.clientY; if (!active) { active = true; measure(); tick(); } };
  const onLeave = () => { px = -9999; py = -9999; };
  const tick = () => {
    let still = false;
    letters.forEach((l, i) => {
      const r = rects[i];
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const d = Math.hypot(px - cx, py - cy);
      const k = Math.max(0, 1 - d / 260);
      state[i].tw = 400 + k * k * 380;
      state[i].w = lerp(state[i].w, state[i].tw, 0.14);
      if (Math.abs(state[i].w - state[i].tw) > 0.5) still = true;
      l.style.fontVariationSettings = `"wght" ${state[i].w.toFixed(0)}, "opsz" ${(72 - k * 40).toFixed(0)}`;
    });
    if (still || px > -9999) raf = requestAnimationFrame(tick); else active = false;
  };
  root.addEventListener('pointermove', onMove, { passive: true });
  root.addEventListener('pointerleave', onLeave);
  window.addEventListener('resize', measure);
  window.addEventListener('scroll', measure, { passive: true });
  return () => { cancelAnimationFrame(raf); root.removeEventListener('pointermove', onMove); root.removeEventListener('pointerleave', onLeave); window.removeEventListener('resize', measure); window.removeEventListener('scroll', measure); };
}
